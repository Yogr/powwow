"""Organization boundaries and collaboration APIs; no shared private conversations."""
import hashlib
import secrets
from datetime import timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .auth import owner_id
from .collaboration_schemas import (AgentCreate, AgentOut, AgentPatch, InviteAccept, InviteCreate,
    InviteCreated, InviteOut, MemberOut, MemberPatch, OrganizationCreate, OrganizationOut,
    PolicyPut, TaskCreate, TaskOut, TaskPatch)
from .db import get_db, now
from .models import (Artifact, Chat, CollaborationTask, Organization, OrganizationAgent,
    OrganizationInvite, OrganizationMember, Project, Run, TaskChat)
from .schemas import ChatOut

router = APIRouter(tags=["collaboration"])
DB = Annotated[Session, Depends(get_db)]
Owner = Annotated[str, Depends(owner_id)]
FREE_LIMITS = {"members": 5, "projects": 3, "storage_bytes": 500 * 1024 * 1024,
               "agents": 3, "tasks_per_project": 500}


def fail(status, code, message):
    from .service import fail as raise_error
    raise_error(status, code, message)


def membership(db, organization_id, user_id, write=False, admin=False):
    member = db.scalar(select(OrganizationMember).where(OrganizationMember.organization_id == organization_id,
        OrganizationMember.user_id == user_id).execution_options(populate_existing=True))
    if not member:
        fail(404, "not_found", "This organization does not exist or is not accessible.")
    if admin and member.role not in {"owner", "admin"} or write and member.role == "viewer":
        fail(403, "role_required", "Your organization role does not allow this action.")
    return member


def organization_lock(db, organization_id):
    return db.scalar(select(Organization).where(Organization.id == organization_id).with_for_update().execution_options(populate_existing=True))


def accessible_projects(user_id):
    orgs = select(OrganizationMember.organization_id).where(OrganizationMember.user_id == user_id)
    # Former owners must not retain access after leaving an organization.
    return or_((Project.organization_id.is_(None)) & (Project.owner_id == user_id), Project.organization_id.in_(orgs))


def project_access(db, project_id, user_id, write=False, allow_archived=False):
    project = db.get(Project, project_id)
    if not project:
        fail(404, "not_found", "This project does not exist or is not accessible.")
    if project.organization_id:
        if write:
            # All project write paths take account -> organization locks, then
            # refresh the role. Removal/demotion cannot race a shared write.
            from .service import account_for_update
            account_for_update(db, user_id)
            organization_lock(db, project.organization_id)
            db.refresh(project)
        membership(db, project.organization_id, user_id, write=write)
    elif project.owner_id != user_id:
        fail(404, "not_found", "This project does not exist or is not accessible.")
    if write and project.archived and not allow_archived:
        fail(409, "archived", "Restore this project before editing it.")
    return project


def readable_artifact(db, artifact_id, owner):
    artifact = db.get(Artifact, artifact_id)
    if not artifact:
        fail(404, "not_found", "This file does not exist or is not accessible.")
    project = project_access(db, artifact.project_id, owner) if artifact.project_id else None
    shared = project and project.organization_id and (artifact.chat_id is None or artifact.details.get("shared_with_project"))
    if artifact.owner_id != owner and not shared:
        fail(404, "not_found", "This file does not exist or is not accessible.")
    return artifact


def guard_run_access(db, run, model=None):
    """Recheck membership/policy before a queued stage causes external effects."""
    from fastapi import HTTPException
    from .providers import ProviderFailure
    try:
        project = project_access(db, run.project_id, run.owner_id, write=True) if run.project_id else None
        model_access(db, project, model or run.model)
        return project
    except HTTPException as exc:
        raise ProviderFailure(exc.detail["code"], exc.detail["message"]) from exc


def admit_project(db, organization_id, user_id):
    from .service import account_for_update
    account_for_update(db, user_id)
    organization_lock(db, organization_id)
    membership(db, organization_id, user_id, write=True)
    count = db.scalar(select(func.count()).select_from(Project).where(Project.organization_id == organization_id))
    if count >= FREE_LIMITS["projects"]:
        fail(403, "organization_quota", "This organization's project allowance is full.")


def org_out(org, member, user_id):
    return {"id": org.id, "name": org.name, "role": member.role, "plan": org.plan,
            "limits": FREE_LIMITS, "current_user_id": user_id, "created_at": org.created_at}


@router.get("/v1/organizations", response_model=list[OrganizationOut])
def organizations(db: DB, owner: Owner):
    rows = db.execute(select(Organization, OrganizationMember).join(OrganizationMember,
        Organization.id == OrganizationMember.organization_id).where(OrganizationMember.user_id == owner).order_by(Organization.created_at))
    return [org_out(org, member, owner) for org, member in rows]


@router.post("/v1/organizations", response_model=OrganizationOut, status_code=201)
def create_organization(body: OrganizationCreate, db: DB, owner: Owner):
    from .service import account_for_update
    account_for_update(db, owner)
    count = db.scalar(select(func.count()).select_from(OrganizationMember).where(OrganizationMember.user_id == owner, OrganizationMember.role == "owner"))
    if count >= 3:
        fail(403, "organization_quota", "You can own up to three free organizations.")
    org = Organization(name=body.name)
    db.add(org)
    db.flush()
    member = OrganizationMember(organization_id=org.id, user_id=owner, role="owner", display_name=body.display_name.strip() or owner[:8])
    db.add(member)
    db.commit()
    return org_out(org, member, owner)


@router.get("/v1/organizations/{organization_id}", response_model=OrganizationOut)
def get_organization(organization_id: str, db: DB, owner: Owner):
    member = membership(db, organization_id, owner)
    return org_out(db.get(Organization, organization_id), member, owner)


@router.get("/v1/organizations/{organization_id}/members", response_model=list[MemberOut])
def members(organization_id: str, db: DB, owner: Owner):
    membership(db, organization_id, owner)
    return list(db.scalars(select(OrganizationMember).where(OrganizationMember.organization_id == organization_id).order_by(OrganizationMember.created_at)))


@router.patch("/v1/organizations/{organization_id}/members/{user_id}", response_model=MemberOut)
def patch_member(organization_id: str, user_id: str, body: MemberPatch, db: DB, owner: Owner):
    organization_lock(db, organization_id)
    actor = membership(db, organization_id, owner)
    member = membership(db, organization_id, user_id)
    if body.role is not None:
        if actor.role not in {"owner", "admin"} or actor.role != "owner" and (member.role in {"owner", "admin"} or body.role in {"owner", "admin"}):
            fail(403, "role_required", "Only an owner can manage owner and admin roles.")
        if member.role == "owner" and body.role != "owner":
            count = db.scalar(select(func.count()).select_from(OrganizationMember).where(OrganizationMember.organization_id == organization_id, OrganizationMember.role == "owner"))
            if count <= 1:
                fail(409, "last_owner", "Add another owner before changing the last owner's role.")
        member.role = body.role
    if body.display_name is not None:
        if owner != user_id and actor.role not in {"owner", "admin"}:
            fail(403, "role_required", "You can only edit your own display name.")
        member.display_name = body.display_name.strip() or user_id[:8]
    db.commit()
    return member


@router.delete("/v1/organizations/{organization_id}/members/{user_id}", status_code=204)
def remove_member(organization_id: str, user_id: str, db: DB, owner: Owner):
    organization_lock(db, organization_id)
    actor = membership(db, organization_id, owner)
    member = membership(db, organization_id, user_id)
    if owner != user_id and (actor.role not in {"owner", "admin"} or actor.role != "owner" and member.role in {"owner", "admin"}):
        fail(403, "role_required", "Your organization role does not allow removing this member.")
    if member.role == "owner":
        count = db.scalar(select(func.count()).select_from(OrganizationMember).where(OrganizationMember.organization_id == organization_id, OrganizationMember.role == "owner"))
        if count <= 1:
            fail(409, "last_owner", "Add another owner before removing the last owner.")
    projects = select(Project.id).where(Project.organization_id == organization_id)
    for task in db.scalars(select(CollaborationTask).where(CollaborationTask.project_id.in_(projects), CollaborationTask.assignee_id == user_id)):
        task.assignee_id = None
    db.delete(member)
    db.commit()
    return Response(status_code=204)


def token_hash(token):
    return hashlib.sha256(token.strip().upper().replace("-", "").encode()).hexdigest()


def confirmed_invite_email(request, owner):
    import httpx
    from .config import settings
    token = getattr(request.state, "auth_token", None)
    if not token:
        return None
    cfg = settings()
    try:
        response = httpx.get(cfg.supabase_url.rstrip("/") + "/auth/v1/user",
            headers={"Authorization": "Bearer " + token, "apikey": cfg.supabase_anon_key}, timeout=8)
        response.raise_for_status()
        user = response.json()
        if user.get("id") == owner and user.get("email_confirmed_at") and user.get("email"):
            return str(user["email"]).strip().lower()
    except (httpx.HTTPError, ValueError):
        fail(503, "email_verification_unavailable", "Your verified email could not be checked. Try again when sign-in is available.")
    return None


@router.get("/v1/organizations/{organization_id}/invites", response_model=list[InviteOut])
def invites(organization_id: str, db: DB, owner: Owner):
    membership(db, organization_id, owner, admin=True)
    return list(db.scalars(select(OrganizationInvite).where(OrganizationInvite.organization_id == organization_id).order_by(OrganizationInvite.created_at.desc())))


@router.post("/v1/organizations/{organization_id}/invites", response_model=InviteCreated, status_code=201)
def invite(organization_id: str, body: InviteCreate, db: DB, owner: Owner):
    organization_lock(db, organization_id)
    actor = membership(db, organization_id, owner, admin=True)
    if body.role == "admin" and actor.role != "owner":
        fail(403, "role_required", "Only an owner can invite admins.")
    active = db.scalar(select(func.count()).select_from(OrganizationInvite).where(OrganizationInvite.organization_id == organization_id,
        OrganizationInvite.revoked_at.is_(None), OrganizationInvite.expires_at > now(), OrganizationInvite.uses < OrganizationInvite.max_uses))
    if active >= 20:
        fail(403, "invite_limit", "Revoke an unused invitation before creating another.")
    # 128 bits of entropy; only the digest is stored. Codes and links use the same capability.
    token = secrets.token_hex(16).upper()
    row = OrganizationInvite(organization_id=organization_id, token_hash=token_hash(token), role=body.role,
        email=body.email, max_uses=body.max_uses, expires_at=now() + timedelta(days=body.expires_in_days), created_by=owner)
    db.add(row)
    db.commit()
    return {**InviteOut.model_validate(row).model_dump(), "token": token, "invite_code": "-".join(token[i:i+4] for i in range(0, len(token), 4))}


@router.delete("/v1/organizations/{organization_id}/invites/{invite_id}", status_code=204)
def revoke_invite(organization_id: str, invite_id: str, db: DB, owner: Owner):
    organization_lock(db, organization_id)
    membership(db, organization_id, owner, admin=True)
    row = db.get(OrganizationInvite, invite_id)
    if not row or row.organization_id != organization_id:
        fail(404, "not_found", "This invitation does not exist.")
    row.revoked_at = now()
    db.commit()
    return Response(status_code=204)


@router.post("/v1/invites/accept", response_model=OrganizationOut)
def accept_invite(body: InviteAccept, request: Request, db: DB, owner: Owner):
    digest = token_hash(body.token)
    row = db.scalar(select(OrganizationInvite).where(OrganizationInvite.token_hash == digest))
    if not row:
        fail(404, "invalid_invite", "This invitation is invalid or expired.")
    org = organization_lock(db, row.organization_id)
    db.refresh(row)
    expiry = row.expires_at.replace(tzinfo=timezone.utc) if row.expires_at.tzinfo is None else row.expires_at
    if row.revoked_at or expiry <= now():
        fail(410, "invalid_invite", "This invitation is invalid or expired.")
    if row.email and row.email != confirmed_invite_email(request, owner):
        fail(403, "invite_email", "Sign in with the verified email address invited to this organization.")
    existing = db.get(OrganizationMember, (org.id, owner))
    if existing:
        return org_out(org, existing, owner)
    if row.uses >= row.max_uses:
        fail(410, "invalid_invite", "This invitation has already been used.")
    count = db.scalar(select(func.count()).select_from(OrganizationMember).where(OrganizationMember.organization_id == org.id))
    if count >= FREE_LIMITS["members"]:
        fail(403, "organization_quota", "This organization's member allowance is full.")
    member = OrganizationMember(organization_id=org.id, user_id=owner, role=row.role, display_name=body.display_name.strip() or owner[:8])
    db.add(member)
    row.uses += 1
    db.commit()
    return org_out(org, member, owner)


def task_out(db, task):
    return {**{key: getattr(task, key) for key in TaskOut.model_fields if key != "organization_id"},
            "organization_id": db.get(Project, task.project_id).organization_id}


def task_access(db, task_id, owner, write=False):
    row = db.get(CollaborationTask, task_id)
    if not row:
        fail(404, "not_found", "This task does not exist or is not accessible.")
    return row, project_access(db, row.project_id, owner, write=write)


def validate_assignee(db, project, assignee):
    if not assignee:
        return
    if project.organization_id:
        member = db.get(OrganizationMember, (project.organization_id, assignee))
        if not member or member.role == "viewer":
            fail(422, "invalid_assignee", "Choose an active organization member who can work on tasks.")
    elif assignee != project.owner_id:
        fail(422, "invalid_assignee", "A personal project's tasks can only be assigned to its owner.")


@router.get("/v1/tasks", response_model=list[TaskOut])
def my_tasks(db: DB, owner: Owner, assigned_to_me: bool = True, organization_id: str | None = None):
    query = select(CollaborationTask).join(Project).where(accessible_projects(owner), Project.archived.is_(False))
    if organization_id:
        membership(db, organization_id, owner)
        query = query.where(Project.organization_id == organization_id)
    if assigned_to_me:
        query = query.where(CollaborationTask.assignee_id == owner)
    return [task_out(db, task) for task in db.scalars(query.order_by(CollaborationTask.updated_at.desc()).limit(500))]


@router.get("/v1/projects/{project_id}/tasks", response_model=list[TaskOut])
def project_tasks(project_id: str, db: DB, owner: Owner):
    project_access(db, project_id, owner)
    return [task_out(db, task) for task in db.scalars(select(CollaborationTask).where(CollaborationTask.project_id == project_id).order_by(CollaborationTask.created_at))]


@router.post("/v1/projects/{project_id}/tasks", response_model=TaskOut, status_code=201)
def create_task(project_id: str, body: TaskCreate, db: DB, owner: Owner):
    project = project_access(db, project_id, owner, write=True)
    db.scalar(select(Project).where(Project.id == project_id).with_for_update())
    count = db.scalar(select(func.count()).select_from(CollaborationTask).where(CollaborationTask.project_id == project_id))
    if count >= FREE_LIMITS["tasks_per_project"]:
        fail(403, "task_quota", "This project's task allowance is full.")
    validate_assignee(db, project, body.assignee_id)
    row = CollaborationTask(project_id=project_id, created_by=owner, **body.model_dump())
    db.add(row)
    db.commit()
    return task_out(db, row)


@router.patch("/v1/tasks/{task_id}", response_model=TaskOut)
def patch_task(task_id: str, body: TaskPatch, db: DB, owner: Owner):
    row, project = task_access(db, task_id, owner, write=True)
    if "assignee_id" in body.model_fields_set:
        validate_assignee(db, project, body.assignee_id)
        row.assignee_id = body.assignee_id
    for key, value in body.model_dump(exclude_none=True, exclude={"assignee_id"}).items():
        if key == "title" and not value.strip():
            fail(422, "invalid_title", "Enter a task title.")
        setattr(row, key, value)
    db.commit()
    return task_out(db, row)


@router.put("/v1/tasks/{task_id}/chat", response_model=ChatOut)
def task_chat(task_id: str, db: DB, owner: Owner):
    row, project = task_access(db, task_id, owner, write=True)
    db.scalar(select(CollaborationTask).where(CollaborationTask.id == task_id).with_for_update())
    link = db.get(TaskChat, (task_id, owner))
    if link:
        return db.get(Chat, link.chat_id)
    chat = Chat(owner_id=owner, project_id=project.id, title=row.title[:160], context_mode="project")
    db.add(chat)
    db.flush()
    db.add(TaskChat(task_id=task_id, user_id=owner, chat_id=chat.id))
    db.commit()
    return chat


@router.get("/v1/organizations/{organization_id}/policy", response_model=PolicyPut)
def get_policy(organization_id: str, db: DB, owner: Owner):
    membership(db, organization_id, owner)
    return PolicyPut.model_validate(db.get(Organization, organization_id).policy)


@router.put("/v1/organizations/{organization_id}/policy", response_model=PolicyPut)
def set_policy(organization_id: str, body: PolicyPut, db: DB, owner: Owner):
    org = organization_lock(db, organization_id)
    membership(db, organization_id, owner, admin=True)
    org.policy = body.model_dump()
    db.commit()
    return body


def model_access(db, project, model):
    if project and project.organization_id:
        policy = PolicyPut.model_validate(db.get(Organization, project.organization_id).policy)
        if policy.allowed_models is not None and model not in policy.allowed_models:
            fail(403, "model_not_allowed", "This model is not allowed by your organization.")


def agent_permission(db, organization_id, owner, agent=None):
    org = organization_lock(db, organization_id)
    member = membership(db, organization_id, owner, write=True)
    policy = PolicyPut.model_validate(org.policy)
    if member.role not in {"owner", "admin"} and (not policy.allow_member_agents or agent and agent.created_by != owner):
        fail(403, "role_required", "Ask an organization admin to manage this agent.")
    return policy


def validate_agent(policy, model_id, mcp_ids):
    if model_id and policy.allowed_models is not None and model_id not in policy.allowed_models:
        fail(403, "model_not_allowed", "This model is not allowed by your organization.")
    if not set(mcp_ids).issubset(set(policy.allowed_mcps)):
        fail(403, "mcp_not_allowed", "This MCP is not allowed by your organization.")


@router.get("/v1/organizations/{organization_id}/agents", response_model=list[AgentOut])
def agents(organization_id: str, db: DB, owner: Owner):
    membership(db, organization_id, owner)
    return list(db.scalars(select(OrganizationAgent).where(OrganizationAgent.organization_id == organization_id).order_by(OrganizationAgent.created_at)))


@router.post("/v1/organizations/{organization_id}/agents", response_model=AgentOut, status_code=201)
def create_agent(organization_id: str, body: AgentCreate, db: DB, owner: Owner):
    policy = agent_permission(db, organization_id, owner)
    validate_agent(policy, body.model_id, body.mcp_ids)
    count = db.scalar(select(func.count()).select_from(OrganizationAgent).where(OrganizationAgent.organization_id == organization_id))
    if count >= FREE_LIMITS["agents"]:
        fail(403, "agent_quota", "This organization's agent allowance is full.")
    row = OrganizationAgent(organization_id=organization_id, created_by=owner, **body.model_dump())
    db.add(row)
    db.commit()
    return row


@router.patch("/v1/organizations/{organization_id}/agents/{agent_id}", response_model=AgentOut)
def patch_agent(organization_id: str, agent_id: str, body: AgentPatch, db: DB, owner: Owner):
    membership(db, organization_id, owner)
    row = db.get(OrganizationAgent, agent_id)
    if not row or row.organization_id != organization_id:
        fail(404, "not_found", "This agent does not exist.")
    policy = agent_permission(db, organization_id, owner, row)
    changes = body.model_dump(exclude_unset=True)
    validate_agent(policy, changes.get("model_id", row.model_id), changes.get("mcp_ids", row.mcp_ids) or [])
    for key, value in changes.items():
        if value is not None or key == "model_id":
            setattr(row, key, value)
    db.commit()
    return row


@router.delete("/v1/organizations/{organization_id}/agents/{agent_id}", status_code=204)
def delete_agent(organization_id: str, agent_id: str, db: DB, owner: Owner):
    membership(db, organization_id, owner)
    row = db.get(OrganizationAgent, agent_id)
    if not row or row.organization_id != organization_id:
        fail(404, "not_found", "This agent does not exist.")
    agent_permission(db, organization_id, owner, row)
    db.delete(row)
    db.commit()
    return Response(status_code=204)


def organization_storage(db, organization_id, excluding_run=None):
    projects = select(Project.id).where(Project.organization_id == organization_id)
    used = db.scalar(select(func.coalesce(func.sum(Artifact.size_bytes), 0)).where(Artifact.project_id.in_(projects))) or 0
    reserved = 0
    for run in db.scalars(select(Run).where(Run.project_id.in_(projects))):
        uncertain = run.error and run.error.get("code") in {"submission_uncertain", "cancellation_unconfirmed"}
        if run.id != excluding_run and (run.status not in {"succeeded", "failed", "cancelled"} or uncertain):
            reserved += run.settings.get("storage_reservation_bytes", 0)
    return used, reserved


def admit_organization_storage(db, project, amount, excluding_run=None):
    if not project or not project.organization_id:
        return
    organization_lock(db, project.organization_id)
    used, reserved = organization_storage(db, project.organization_id, excluding_run)
    if used + reserved + amount > FREE_LIMITS["storage_bytes"]:
        fail(413, "organization_storage_quota", "This organization's storage allowance is full.")


@router.get("/v1/organizations/{organization_id}/usage")
def usage(organization_id: str, db: DB, owner: Owner):
    membership(db, organization_id, owner, admin=True)
    project_ids = select(Project.id).where(Project.organization_id == organization_id)
    used, reserved = organization_storage(db, organization_id)
    runs = list(db.scalars(select(Run).where(Run.project_id.in_(project_ids))))
    return {"members": db.scalar(select(func.count()).select_from(OrganizationMember).where(OrganizationMember.organization_id == organization_id)),
        "projects": db.scalar(select(func.count()).select_from(Project).where(Project.organization_id == organization_id)),
        "agents": db.scalar(select(func.count()).select_from(OrganizationAgent).where(OrganizationAgent.organization_id == organization_id)),
        "tasks": db.scalar(select(func.count()).select_from(CollaborationTask).where(CollaborationTask.project_id.in_(project_ids))),
        "storage_used_bytes": used, "storage_reserved_bytes": reserved,
        "ai_spent_usd": sum(run.actual_cost_usd for run in runs), "ai_reserved_usd": sum(run.reservation_usd for run in runs),
        "limits": FREE_LIMITS, "checkout_available": False}
