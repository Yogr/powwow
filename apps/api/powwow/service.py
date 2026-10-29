import hashlib
import json
from datetime import timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import settings
from .context import resolve_context
from .db import now
from .models import Account, Artifact, Chat, IntentDecision, Message, Project, Run, RunEvent, UsageEntry
from .registry import WORKFLOWS, binding, route
from .schemas import RunCreate

TERMINAL = {"succeeded", "failed", "cancelled"}


def fail(status: int, code: str, message: str):
    raise HTTPException(status, detail={"code": code, "message": message})


def owned(db: Session, model, item_id: str, owner: str):
    if model is Project:
        from .collaboration import project_access
        return project_access(db, item_id, owner)
    item = db.scalar(select(model).where(model.id == item_id, model.owner_id == owner))
    if item is None:
        fail(404, "not_found", "This item does not exist or is not accessible.")
    # Revoking organization membership also revokes access through old private
    # chat/run URLs. Their contents are never handed to another member.
    if getattr(item, "project_id", None):
        from .collaboration import project_access
        project_access(db, item.project_id, owner)
    return item


def account_for_update(db: Session, owner: str) -> Account:
    account = db.scalar(select(Account).where(Account.id == owner).with_for_update())
    if account is None:
        try:
            with db.begin_nested():
                account = Account(id=owner, budget_usd=settings().account_budget_usd)
                db.add(account)
                db.flush()
        except IntegrityError:
            pass
        account = db.scalar(select(Account).where(Account.id == owner).with_for_update())
    return account


def emit(db: Session, run: Run, event_type: str, payload: dict | None = None):
    # Callers hold the run row lock, serializing sequence allocation.
    sequence = (db.scalar(select(func.max(RunEvent.sequence)).where(RunEvent.run_id == run.id)) or 0) + 1
    db.add(RunEvent(run_id=run.id, sequence=sequence, stage_id=run.stage, type=event_type, payload=payload or {}))
    db.flush()


def check_attachments(db: Session, owner: str, ids: list[str]) -> list[Artifact]:
    from .account_preferences import artifact_available
    from .collaboration import readable_artifact
    items = [readable_artifact(db, item_id, owner) for item_id in dict.fromkeys(ids)]
    if any(not artifact_available(item) for item in items):
        fail(410, "file_expired", "A temporary attachment has expired. Attach the copy from your local folder again.")
    return items


def submit_run(db: Session, owner: str, request: RunCreate, parent: Run | None = None, internal_settings: dict | None = None) -> Run:
    fingerprint_data = request.model_dump(exclude={"idempotency_key", "intent_id"})
    if internal_settings and "intelligence_tier" in internal_settings:
        fingerprint_data["intelligence_tier"] = internal_settings["intelligence_tier"]
    fingerprint = hashlib.sha256(json.dumps(fingerprint_data, sort_keys=True).encode()).hexdigest()
    # Serialize admission and budget reservations per account, including idempotent concurrent submissions.
    account = account_for_update(db, owner)
    existing = db.scalar(select(Run).where(Run.owner_id == owner, Run.idempotency_key == request.idempotency_key))
    if existing:
        if existing.request_fingerprint != fingerprint:
            fail(409, "idempotency_conflict", "This idempotency key was already used for a different request.")
        return existing
    chat = owned(db, Chat, request.chat_id, owner)
    project = owned(db, Project, chat.project_id, owner) if chat.project_id else None
    if project:
        from .collaboration import project_access
        project_access(db, project.id, owner, write=True)
    if chat.archived or project and project.archived:
        fail(409, "archived", "Restore the project and chat before starting a new run.")
    message = owned(db, Message, request.message_id, owner)
    if message.chat_id != chat.id or message.role != "user":
        fail(422, "message_mismatch", "The input must be a user message from this chat.")
    attachment_ids = list(dict.fromkeys(message.attachment_ids + request.attachment_ids))
    decision = None
    if request.intent_id:
        from .intent import fingerprint as intent_fingerprint
        record = owned(db, IntentDecision, request.intent_id, owner)
        # SQLite strips timezone information; PostgreSQL preserves UTC offsets.
        expires = record.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=now().tzinfo)
        if expires < now():
            fail(409, "intent_expired", "This request needs a fresh plan. Send it again to continue.")
        if record.request_fingerprint not in {intent_fingerprint(message.content, attachment_ids, request.capability, request.settings.intelligence, request.settings.web_search, project.id if project else None), intent_fingerprint(message.content, attachment_ids, request.capability, request.settings.intelligence, request.settings.web_search)}:
            fail(409, "intent_mismatch", "Your request changed after planning. Send it again to refresh the plan.")
        decision = record.decision
    elif parent:
        decision = parent.model_provenance.get("routing")
    # Old preflight caches and clients cannot bypass the new reasoning planner.
    capability = "chat" if request.capability == "auto" and not parent else decision["capability"] if decision else route(message.content, request.capability)
    if capability != "chat" and len(message.content) > 7500:
        fail(422, "prompt_too_long", "Creative model briefs must be 7,500 characters or fewer.")
    attachments = check_attachments(db, owner, attachment_ids)
    if capability in ["image_to_video", "image_to_3d"] and not any(a.kind == "image" for a in attachments):
        fail(422, "image_required", "Attach or select an image to use this workflow.")
    run_settings = request.settings.model_dump(exclude_none=True)
    if capability == "text_to_image" and any(a.kind == "image" for a in attachments):
        run_settings.update(media_operation="edit", media_source_ids=[a.id for a in attachments if a.kind == "image"])
    if run_settings.get("entry_image"):
        from .entry_images import validate_target
        run_settings["asset_subject"] = validate_target(db, project, capability, run_settings["entry_image"])
    if chat.component_id:
        run_settings["component_session"] = chat.component_id
    if internal_settings:
        run_settings.update(internal_settings)
    if capability in {"chat", "text_to_image"} and not run_settings.get("media_plan") and not run_settings.get("language_learning") and not run_settings.get("builder_refinement"):
        from .builder import get_workspace
        from .builder_schemas import BuilderWorkspace
        run_settings["project_experience"] = True
        run_settings["experience_project_access"] = not project or chat.context_mode == "project"
        run_settings["experience_snapshot"] = get_workspace(db, project.id) if project and run_settings["experience_project_access"] else {"version": 0, "workspace": BuilderWorkspace().model_dump()}
    if run_settings.get("experience_project_access") and project:
        run_settings["project_references"] = [{"source_id": a.id, "name": a.name, "kind": a.kind, "mime_type": a.mime_type}
            for a in db.scalars(select(Artifact).where(Artifact.project_id == project.id, Artifact.owner_id == owner, Artifact.kind == "image").order_by(Artifact.created_at.desc()).limit(100))]
    if run_settings.get("language_learning"):
        from .intelligence import language_binding
        bound = language_binding(run_settings.get("intelligence_tier", "basic"))
        if bound.get("policy"):
            run_settings["intelligence_policy"] = bound["policy"]
    elif run_settings.get("project_experience"):
        from .intelligence import project_binding
        bound = project_binding(request.settings.intelligence)
        if bound.get("policy"):
            run_settings["intelligence_policy"] = bound["policy"]
    else:
        from .intelligence import general_binding
        bound = general_binding(request.settings.intelligence) if capability == "chat" else binding(capability)
        if bound.get("policy"):
            run_settings["intelligence_policy"] = bound["policy"]
    if not bound["enabled"]:
        fail(503, "provider_unavailable", bound["reason"])
    from .collaboration import model_access
    model_access(db, project, bound["model"])
    if request.settings.quality != "standard":
        fail(422, "premium_unavailable", "Premium quality is not available yet. Choose Standard.")
    limited = settings().spending_limits_enabled
    run_settings['spending_limits_enabled'] = limited
    if limited and request.budget_usd > settings().max_run_budget_usd:
        fail(422, "budget_limit", "This request exceeds your current usage limit. Check your plan in Settings.")
    if limited and bound["estimated_cost_usd"] > request.budget_usd and not run_settings.get("project_experience"):
        fail(422, "budget_too_low", "This request exceeds your current usage limit. Check your plan in Settings.")
    reservation = request.budget_usd if bound["provider"] == "runpod" else bound["estimated_cost_usd"] if bound["provider"] == "openai" else 0.0
    if limited and run_settings.get("project_experience"):
        # Exact input and affordable output are checked before each hosted stage.
        reservation = min(reservation, request.budget_usd)
    if run_settings.get("language_learning"):
        # The account lock also serializes admission across learners/projects.
        midnight = now().astimezone(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        daily_runs = db.execute(select(Run, UsageEntry).outerjoin(UsageEntry, UsageEntry.run_id == Run.id)
                                .where(Run.owner_id == owner, Run.created_at >= midnight)).all()
        language_runs = [(run, usage) for run, usage in daily_runs if run.settings.get("language_learning")]
        if limited and len(language_runs) >= settings().language_daily_turn_limit:
            fail(429, "language_daily_turns", "Today's language reply limit has been reached. It resets at 00:00 UTC.")
        daily_cost = sum(usage.actual_cost_usd if usage else run.reservation_usd for run, usage in language_runs)
        if limited and daily_cost + reservation > settings().language_daily_budget_usd + 1e-9:
            fail(402, "language_daily_budget", "Today's language usage limit has been reached. It resets at 00:00 UTC. Check your plan in Settings.")
    if limited and account.spent_usd + account.reserved_usd + reservation > account.budget_usd:
        fail(402, "account_budget", "Your current usage limit has been reached or reserved by work in progress. Check your plan in Settings.")
    if bound["provider"] == "runpod" and any(a.size_bytes > 6 * 1024 * 1024 for a in attachments if a.kind == "image"):
        fail(422, "source_too_large", "Runpod source images must be under 6 MiB. Resize this image before submitting.")
    account.reserved_usd += reservation
    run_settings["web_search_allowed"] = request.settings.web_search
    run_settings["web_search"] = bool(request.settings.web_search and capability == "chat" and decision and decision.get("web_search") and not run_settings.get("language_learning"))
    if capability != "chat":
        from .account_preferences import admit_storage
        from .collaboration import admit_organization_storage
        capacity = settings().max_generated_artifact_bytes * (2 if capability == "image_to_3d" else 1)
        admit_organization_storage(db, project, capacity)
        mode = admit_storage(db, owner, capacity, project.storage_mode if project else None)
        run_settings.update(storage_mode=mode, storage_reservation_bytes=capacity)
    provenance = {"routing": decision} if decision else {}
    workflow_id = "writing.develop.v1" if decision and decision.get("task") == "creative_writing" else WORKFLOWS[capability]["id"]
    if capability == 'image_to_3d':
        workflow_id = run_settings.get('media_plan', {}).get('workflow', 'asset.production.v1')
    if capability == "text_to_image" and run_settings.get("media_operation") == "edit":
        workflow_id = "image.edit.v1"
    if run_settings.get("project_experience"):
        workflow_id = "project.experience.v2"
    if run_settings.get("language_learning"):
        from .language import conversation_snapshot
        workflow_id = "language.converse.v1"
        context_snapshot = conversation_snapshot(db, owner, run_settings["language_day_id"], message.id)
    else:
        context_snapshot = resolve_context(db, owner, chat, attachment_ids, message.id)
    if run_settings.get("builder_refinement"):
        # The refinement prompt contains its versioned project snapshot. Do not
        # include older guide sessions that could compete with current choices.
        context_snapshot = [source for source in context_snapshot if source.get("source_id") == message.id]
    run = Run(owner_id=owner, project_id=chat.project_id, chat_id=chat.id, message_id=message.id, idempotency_key=request.idempotency_key, request_fingerprint=fingerprint, capability=capability, workflow_id=workflow_id, prompt=message.content, settings=run_settings, attachment_ids=attachment_ids, context_snapshot=context_snapshot, provider=bound["provider"], model=bound["model"], model_provenance=provenance, estimated_cost_usd=bound["estimated_cost_usd"], budget_usd=request.budget_usd, reservation_usd=reservation, attempt=parent.attempt + 1 if parent else 1, parent_run_id=parent.id if parent else None)
    db.add(run)
    db.flush()
    emit(db, run, "run.queued", {"status": "queued", "workflow_id": run.workflow_id})
    chat.updated_at = now()
    db.commit()
    return run


def settle_usage(db: Session, run: Run, duration: float, cost: float, measurement: str):
    previous = db.scalar(select(UsageEntry).where(UsageEntry.run_id == run.id))
    if previous and not run.settings.get('task_plan'):
        return
    account = account_for_update(db, run.owner_id)
    account.reserved_usd = max(0, account.reserved_usd - run.reservation_usd)
    if run.settings.get('task_plan'):
        run.reservation_usd = 0
    # Actual cost may exceed an estimate due to provider billing increments; never hide it.
    account.spent_usd += max(0, cost - run.actual_cost_usd)
    run.actual_cost_usd = cost
    mixed = (run.settings.get("media_plan") and run.model_provenance.get("classifier")) or run.workflow_id == 'asset.production.v1'
    provider = "openai+" + run.provider if mixed else run.provider
    if mixed:
        measurement = "hosted planner + media; per-stage usage retained in run provenance"
    if previous:
        previous.actual_cost_usd = cost
        previous.duration_seconds += duration
        previous.measurement = measurement
    else:
        db.add(UsageEntry(owner_id=run.owner_id, run_id=run.id, provider=provider, estimated_cost_usd=run.estimated_cost_usd, actual_cost_usd=cost, duration_seconds=duration, measurement=measurement))
