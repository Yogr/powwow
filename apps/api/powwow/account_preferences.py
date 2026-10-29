"""Account choices, honest entitlements, and owner-serialized asset capacity."""
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import owner_id
from .builder_catalog import COMPONENT_IDS, COMPONENTS, KIND_BY_ID
from .config import settings
from .db import get_db, now
from .language_catalog import LANGUAGE_BY_CODE
from .models import AccountPreferences, Artifact, Run, ExperienceTour
from .schemas import Schema
from .service import TERMINAL, account_for_update, fail, owned
from .storage import Storage

router = APIRouter(tags=["account"])
DB = Annotated[Session, Depends(get_db)]
Owner = Annotated[str, Depends(owner_id)]


@router.get("/v1/account/experience-tours")
def experience_tours(db: DB, owner: Owner) -> list[str]:
    return list(db.scalars(select(ExperienceTour.kind).where(ExperienceTour.owner_id == owner)))


@router.put("/v1/account/experience-tours/{kind}")
def complete_experience_tour(kind: str, db: DB, owner: Owner):
    if kind not in KIND_BY_ID:
        fail(422, "invalid_experience", "Choose a supported experience.")
    account_for_update(db, owner)
    if not db.get(ExperienceTour, (owner, kind)):
        db.add(ExperienceTour(owner_id=owner, kind=kind))
    db.commit()
    return {"kind": kind, "completed": True}


class PreferencesPatch(Schema):
    app_language: str | None = None
    storage_mode: Literal["unselected", "local", "cloud"] | None = None
    component_priorities: dict[str, int] | None = Field(default=None, max_length=50)

    @field_validator("app_language")
    @classmethod
    def language(cls, value):
        if value is not None and value not in LANGUAGE_BY_CODE:
            raise ValueError("Choose an application language from the language catalog.")
        return value

    @field_validator("component_priorities")
    @classmethod
    def priorities(cls, value):
        for component, priority in (value or {}).items():
            if component not in COMPONENT_IDS or not 1 <= priority <= 10000:
                raise ValueError("Choose known components and priorities from 1 to 10000.")
            if component == "design" and priority != 1 or component == "tasks" and priority != 2 or component not in {"design", "tasks"} and priority < 3:
                raise ValueError("Project Blueprint is always first and Task Board second.")
        return value


class PreferencesOut(Schema):
    app_language: str
    storage_mode: Literal["unselected", "local", "cloud"]
    plan: str
    storage_quota_bytes: int
    storage_used_bytes: int
    storage_staged_bytes: int
    storage_reserved_bytes: int
    storage_grace_bytes: int
    storage_full: bool
    local_retention_hours: int
    checkout_available: bool = False
    component_priorities: dict[str, int]


class LocalSaveReceipt(Schema):
    sha256: str = Field(pattern=r"^[a-f0-9]{64}$")
    size_bytes: int = Field(ge=0)


def preferences(db, owner):
    row = db.get(AccountPreferences, owner)
    if row is None:
        row = AccountPreferences(owner_id=owner, app_language="en", storage_mode="unselected", plan="free", component_priorities={})
        db.add(row)
        db.flush()
    return row


def component_priorities(row):
    result = {component[0]: 100 + index * 10 for index, component in enumerate(COMPONENTS)}
    result.update(row.component_priorities or {})
    return {**result, "design": 1, "tasks": 2}


def as_utc(value):
    if isinstance(value, str):
        value = datetime.fromisoformat(value)
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def artifact_available(artifact):
    data = artifact.details or {}
    if data.get("storage_mode") != "local":
        return True
    return not data.get("staging_deleted_at") and (not data.get("expires_at") or as_utc(data["expires_at"]) > now())


def storage_usage(db, owner, excluding_run=None):
    used, staged, reserved = 0, 0, {"cloud": 0, "local": 0}
    for item in db.scalars(select(Artifact).where(Artifact.owner_id == owner)):
        if item.details.get("storage_mode") == "local":
            if not item.details.get("staging_deleted_at"):
                staged += item.size_bytes
        else:
            used += item.size_bytes
    for run in db.scalars(select(Run).where(Run.owner_id == owner)):
        uncertain = run.error and run.error.get("code") in {"submission_uncertain", "cancellation_unconfirmed"}
        if run.id != excluding_run and (run.status not in TERMINAL or uncertain):
            mode = run.settings.get("storage_mode")
            if mode in reserved:
                reserved[mode] += run.settings.get("storage_reservation_bytes", 0)
    return used, staged, reserved


def cloud_grace_bytes():
    config = settings()
    return min(int(config.free_storage_quota_bytes * config.cloud_storage_grace_percent / 100), config.cloud_storage_grace_max_bytes)


def admit_storage(db, owner, amount, mode=None, excluding_run=None):
    account_for_update(db, owner)
    choice = mode or preferences(db, owner).storage_mode
    if choice == "unselected":
        fail(409, "storage_choice_required", "Choose a local folder or cloud storage in Settings before adding files.")
    used, staged, reserved = storage_usage(db, owner, excluding_run)
    current = used if choice == "cloud" else staged
    quota = settings().free_storage_quota_bytes if choice == "cloud" else settings().local_staging_quota_bytes
    occupied = current + reserved[choice]
    ceiling = quota + (cloud_grace_bytes() if choice == "cloud" else 0)
    # A small crossing is allowed, but once full no new request may use the
    # remaining grace. Previously admitted runs can finish within their reserve.
    full = choice == "cloud" and not excluding_run and amount > 0 and occupied >= quota
    if full or occupied + amount > ceiling:
        raise HTTPException(413, detail={"code": "storage_quota", "storage_mode": choice,
            "action": "upgrade_storage" if choice == "cloud" else "manage_local_storage",
            "message": "Your cloud storage is full. Upgrade your storage or use a local folder for new files." if choice == "cloud" else "Temporary local-save staging is full. Save your pending files and wait for their staging period to expire."})
    return choice


def storage_metadata(mode):
    return {"storage_mode": mode, **({"expires_at": (now() + timedelta(hours=settings().local_retention_hours)).isoformat(), "local_saved_at": None} if mode == "local" else {})}


def expire_local_staging(db, owner=None):
    query = select(Artifact)
    if owner:
        query = query.where(Artifact.owner_id == owner)
    count = 0
    for item in db.scalars(query):
        info = item.details or {}
        # Only files explicitly created under local staging ever expire.
        if info.get("storage_mode") != "local" or not info.get("expires_at") or info.get("staging_deleted_at") or as_utc(info["expires_at"]) > now():
            continue
        account_for_update(db, item.owner_id)
        Storage().delete(item.storage_key)
        item.details = {**{key: value for key, value in info.items() if key != "text_excerpt"}, "staging_deleted_at": now().isoformat()}
        count += 1
    if count:
        db.commit()
    return count


def preferences_out(db, owner):
    row = preferences(db, owner)
    used, staged, reserved = storage_usage(db, owner)
    return {"app_language": row.app_language, "storage_mode": row.storage_mode, "plan": row.plan,
            "storage_quota_bytes": settings().free_storage_quota_bytes, "storage_used_bytes": used,
            "storage_staged_bytes": staged, "storage_reserved_bytes": reserved["cloud"],
            "storage_grace_bytes": cloud_grace_bytes(), "storage_full": used + reserved["cloud"] >= settings().free_storage_quota_bytes,
            "local_retention_hours": settings().local_retention_hours, "checkout_available": False,
            "component_priorities": component_priorities(row)}


@router.get("/v1/account/preferences", response_model=PreferencesOut)
def get_preferences(db: DB, owner: Owner):
    account_for_update(db, owner)
    result = preferences_out(db, owner)
    db.commit()
    return result


@router.patch("/v1/account/preferences", response_model=PreferencesOut)
def patch_preferences(body: PreferencesPatch, db: DB, owner: Owner):
    account_for_update(db, owner)
    row = preferences(db, owner)
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(row, key, {**row.component_priorities, **value} if key == "component_priorities" else value)
    db.commit()
    return preferences_out(db, owner)


@router.post("/v1/artifacts/{artifact_id}/local-save")
def acknowledge_local_save(artifact_id: str, body: LocalSaveReceipt, db: DB, owner: Owner):
    artifact = owned(db, Artifact, artifact_id, owner)
    if artifact.details.get("storage_mode") != "local":
        fail(409, "not_local_staging", "This file is not a temporary local-save artifact.")
    if body.sha256 != artifact.sha256 or body.size_bytes != artifact.size_bytes:
        fail(422, "local_save_mismatch", "The saved file's checksum or size does not match this output.")
    artifact.details = {**artifact.details, "local_saved_at": artifact.details.get("local_saved_at") or now().isoformat()}
    db.commit()
    return {"id": artifact.id, "local_saved_at": artifact.details["local_saved_at"], "expires_at": artifact.details["expires_at"]}
