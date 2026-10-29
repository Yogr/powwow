import asyncio
import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from .auth import owner_id
from .collaboration import (accessible_projects, admit_organization_storage, admit_project,
    membership, model_access, project_access, router as collaboration_router)
from .builder import get_workspace, owned_project, plan_project, preview_plan, save_workspace
from .builder_catalog import builder_catalog
from .builder_refinement import apply_refinement, proposal_for_review, queue_refinement
from .builder_schemas import PlanOut, PlanPreview, PlanRequest, RefinementApply, RefinementOut, RefinementRequest, WorkspaceOut, WorkspacePut
from .config import settings
from .context import source_records
from .db import SessionLocal, get_db, init_db, now, uid
from .models import Account, Artifact, Chat, ContextGrant, LanguageDay, Message, Project, Run, RunEvent, StageAttempt, UsageEntry
from .language import guard_language_retry, router as language_router
from .account_preferences import admit_storage, artifact_available, component_priorities, preferences, router as account_router, storage_metadata
from .registry import catalog
from .schemas import ArtifactOut, ArtifactPatch, ChatCreate, ChatOut, ChatPatch, EventOut, GenerationSettings, GrantCreate, GrantOut, IntentRequest, IntentOut, MessageCreate, MessageOut, ProjectCreate, ProjectOut, ProjectPatch, RunCreate, RunOut, RunRetry
from .service import TERMINAL, account_for_update, check_attachments, emit, fail, owned, settle_usage, submit_run
from .storage import MIME_EXT, Storage, digest, kind_for, validate_content


@asynccontextmanager
async def lifespan(app):
    settings().validate_runtime()
    init_db()
    yield


app = FastAPI(title="Powwow API", version="0.1.0", description="Shared API for Powwow web, Android, and iOS clients. Generation executes in a durable worker; bounded intent selection prepares requests.", lifespan=lifespan)
app.include_router(language_router)
app.include_router(account_router)
app.include_router(collaboration_router)
app.add_middleware(CORSMiddleware, allow_origins=settings().cors_origins.split(","), allow_credentials=False, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allow_headers=["Authorization", "Content-Type", "Last-Event-ID", "Accept"])
DB = Annotated[Session, Depends(get_db)]
Owner = Annotated[str, Depends(owner_id)]


def artifact_out(artifact: Artifact) -> ArtifactOut:
    preview = artifact.details.get('preview_artifact_id')
    return ArtifactOut(id=artifact.id, project_id=artifact.project_id, chat_id=artifact.chat_id, run_id=artifact.run_id, name=artifact.name, kind=artifact.kind, mime_type=artifact.mime_type, size_bytes=artifact.size_bytes, sha256=artifact.sha256, url=f"/v1/artifacts/{artifact.id}/content", download_url=f"/v1/artifacts/{artifact.id}/download", preview_url=f"/v1/artifacts/{preview}/content" if preview else None, metadata=artifact.details, lineage_ids=artifact.lineage_ids, created_at=artifact.created_at, storage_mode=artifact.details.get("storage_mode", "legacy"), expires_at=artifact.details.get("expires_at"), local_saved_at=artifact.details.get("local_saved_at"), available=artifact_available(artifact))


@app.get("/health", tags=["system"])
def health(db: DB):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "service": "powwow-api", "version": "0.1.0", "database": "postgresql" if not settings().database_url.startswith("sqlite") else "sqlite-test"}


@app.get("/v1/config", tags=["system"])
def config():
    cfg = settings()
    return {"auth_mode": "local" if cfg.local_auth and cfg.app_env == "development" else "supabase", "supabase_url": cfg.supabase_url, "supabase_anon_key": cfg.supabase_anon_key, "max_upload_bytes": cfg.max_upload_bytes, "max_run_budget_usd": cfg.max_run_budget_usd, "spending_limits_enabled": cfg.spending_limits_enabled, "deployment": cfg.app_env, "local_cost_note": "Local runs have no provider charge. Electricity and hardware costs are not measured."}


@app.get("/v1/catalog", tags=["catalog"])
def get_catalog(owner: Owner):
    return catalog()


@app.get("/v1/capabilities", tags=["catalog"])
def capabilities(owner: Owner):
    return catalog()["capabilities"]


@app.get("/v1/builder/catalog", tags=["builder"])
def get_builder_catalog(owner: Owner, db: DB):
    from .service import account_for_update
    account_for_update(db, owner)
    result = builder_catalog(component_priorities(preferences(db, owner)))
    db.commit()
    return result


@app.post("/v1/builder/preview", response_model=PlanPreview, tags=["builder"])
def preview_new_idea(body: PlanRequest, db: DB, owner: Owner):
    from .builder import detect_kind, infer_answers
    kind = body.kind or detect_kind(body.prompt)
    answers = infer_answers(kind, body.prompt) if kind else {}
    if kind == "language":
        from .models import AccountPreferences
        row = db.get(AccountPreferences, owner)
        answers.setdefault("native_language", row.app_language if row else "en")
    return {"eligible": kind is not None, "kind": kind or "other", "answers": {**answers, **body.answers}, "reason": None if kind else "no_creation_intent"}


@app.get("/v1/intelligence", tags=["catalog"])
def get_intelligence(owner: Owner):
    from .intelligence import general_intelligence
    return general_intelligence()


@app.get("/v1/projects/{project_id}/workspace", response_model=WorkspaceOut, tags=["builder"])
def read_project_workspace(project_id: str, db: DB, owner: Owner):
    owned_project(db, project_id, owner)
    return get_workspace(db, project_id)


@app.put("/v1/projects/{project_id}/workspace", response_model=WorkspaceOut, tags=["builder"])
def write_project_workspace(project_id: str, body: WorkspacePut, db: DB, owner: Owner):
    project = project_access(db, project_id, owner, write=True)
    if project.archived:
        fail(409, "archived", "Restore this project before editing its workspace.")
    return save_workspace(db, project_id, body.version, body.workspace.model_dump())


@app.post("/v1/projects/{project_id}/plan-preview", response_model=PlanPreview, tags=["builder"])
def preview_project_plan(project_id: str, body: PlanRequest, db: DB, owner: Owner):
    return preview_plan(db, project_access(db, project_id, owner, write=True, allow_archived=True), body)


@app.post("/v1/projects/{project_id}/plan", response_model=PlanOut, tags=["builder"])
def create_project_plan(project_id: str, body: PlanRequest, db: DB, owner: Owner):
    return plan_project(db, project_access(db, project_id, owner, write=True, allow_archived=True), body)


@app.post("/v1/projects/{project_id}/plan-refinement", response_model=RunOut, status_code=201, tags=["builder"])
def refine_project_plan(project_id: str, body: RefinementRequest, db: DB, owner: Owner):
    return queue_refinement(db, project_access(db, project_id, owner, write=True), owner, body)


@app.get("/v1/projects/{project_id}/plan-refinements/{run_id}", response_model=RefinementOut, tags=["builder"])
def review_project_refinement(project_id: str, run_id: str, db: DB, owner: Owner):
    owned_project(db, project_id, owner)
    return proposal_for_review(db, project_id, owner, run_id)


@app.post("/v1/projects/{project_id}/apply-refinement", response_model=WorkspaceOut, tags=["builder"])
def apply_project_refinement(project_id: str, body: RefinementApply, db: DB, owner: Owner):
    return apply_refinement(db, project_access(db, project_id, owner, write=True), owner, body.run_id, body.version)


@app.get("/v1/workflows", tags=["catalog"])
def workflows(owner: Owner):
    return catalog()["workflows"]


@app.get("/v1/models", tags=["catalog"])
def models(owner: Owner):
    return catalog()["models"]


@app.get("/v1/skills", tags=["catalog"])
def skills(owner: Owner):
    return catalog()["skills"]


@app.get("/v1/projects", response_model=list[ProjectOut], tags=["projects"])
def list_projects(db: DB, owner: Owner, archived: bool | None = None, q: str = "", organization_id: str | None = None):
    query = select(Project).where(accessible_projects(owner))
    if organization_id:
        membership(db, organization_id, owner)
        query = query.where(Project.organization_id == organization_id)
    if archived is not None:
        query = query.where(Project.archived == archived)
    if q:
        query = query.where(Project.name.ilike(f"%{q[:160]}%"))
    return list(db.scalars(query.order_by(Project.updated_at.desc())))


@app.post("/v1/projects", response_model=ProjectOut, status_code=201, tags=["projects"])
def create_project(body: ProjectCreate, db: DB, owner: Owner):
    if body.organization_id:
        admit_project(db, body.organization_id, owner)
    project = Project(owner_id=owner, **body.model_dump())
    if body.organization_id:
        project.storage_mode = "cloud"
    db.add(project)
    db.commit()
    return project


@app.get("/v1/projects/{project_id}", response_model=ProjectOut, tags=["projects"])
def get_project(project_id: str, db: DB, owner: Owner):
    return owned(db, Project, project_id, owner)


@app.patch("/v1/projects/{project_id}", response_model=ProjectOut, tags=["projects"])
def patch_project(project_id: str, body: ProjectPatch, db: DB, owner: Owner):
    project = project_access(db, project_id, owner, write=True, allow_archived=True)
    if project.organization_id:
        membership(db, project.organization_id, owner, write=True)
        if body.storage_mode == "local":
            fail(422, "shared_storage", "Organization project assets use cloud storage.")
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(project, key, value)
    db.commit()
    return project


@app.get("/v1/chats", response_model=list[ChatOut], tags=["chats"])
def list_chats(db: DB, owner: Owner, project_id: str | None = None, archived: bool | None = None, q: str = "", standalone: bool = False):
    query = select(Chat).where(Chat.owner_id == owner, Chat.id.not_in(select(LanguageDay.chat_id)))
    query = query.where((Chat.project_id.is_(None)) | (Chat.project_id.in_(select(Project.id).where(accessible_projects(owner)))))
    if standalone:
        query = query.where(Chat.project_id.is_(None))
    if project_id:
        owned(db, Project, project_id, owner)
        query = query.where(Chat.project_id == project_id)
    if archived is not None:
        query = query.where(Chat.archived == archived)
    if q:
        query = query.where(Chat.title.ilike(f"%{q[:160]}%"))
    return list(db.scalars(query.order_by(Chat.updated_at.desc())))


@app.post("/v1/chats", response_model=ChatOut, status_code=201, tags=["chats"])
def create_chat(body: ChatCreate, db: DB, owner: Owner):
    project = project_access(db, body.project_id, owner, write=True) if body.project_id else None
    if project and project.archived:
        fail(409, "archived", "Restore this project before creating a chat.")
    if project is None and body.context_mode not in {None, "chat"}:
        fail(422, "standalone_context", "A standalone chat uses only its own conversation and attachments.")
    chat = Chat(owner_id=owner, project_id=project.id if project else None, title=body.title, context_mode=body.context_mode or (project.context_mode if project else "chat"))
    db.add(chat)
    db.commit()
    return chat


@app.get("/v1/chats/{chat_id}", response_model=ChatOut, tags=["chats"])
def get_chat(chat_id: str, db: DB, owner: Owner):
    return owned(db, Chat, chat_id, owner)


@app.put("/v1/projects/{project_id}/components/{component_id}/chat", response_model=ChatOut, tags=["chats"])
def component_chat(project_id: str, component_id: str, db: DB, owner: Owner):
    from .builder_catalog import COMPONENTS
    from sqlalchemy.exc import IntegrityError
    project = project_access(db, project_id, owner, write=True)
    names = {item[0]: item[1] for item in COMPONENTS if item[0] != "language"}
    if component_id not in names:
        fail(422, "invalid_component", "Choose a project component. Language sessions live in Language Learning.")
    if project.archived:
        fail(409, "archived", "Restore this project before opening its component sessions.")
    query = select(Chat).where(Chat.project_id == project_id, Chat.component_id == component_id, Chat.owner_id == owner)
    chat = db.scalar(query)
    if chat:
        return chat
    chat = Chat(owner_id=owner, project_id=project_id, component_id=component_id, title=names[component_id], context_mode="project")
    db.add(chat)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        chat = db.scalar(query)
        if not chat:
            raise
    return chat


@app.patch("/v1/chats/{chat_id}", response_model=ChatOut, tags=["chats"])
def patch_chat(chat_id: str, body: ChatPatch, db: DB, owner: Owner):
    chat = owned(db, Chat, chat_id, owner)
    from .models import TaskChat
    if db.scalar(select(TaskChat.chat_id).where(TaskChat.chat_id == chat.id)) and "project_id" in body.model_fields_set:
        fail(409, "task_chat", "This private session belongs to its task's project.")
    if chat.component_id and ("project_id" in body.model_fields_set or body.archived is not None):
        fail(409, "component_chat", "This session belongs to its project component.")
    if db.scalar(select(LanguageDay.id).where(LanguageDay.chat_id == chat_id)):
        fail(409, "language_chat", "Manage this daily conversation in its language learning component.")
    if body.project_id:
        destination = project_access(db, body.project_id, owner, write=True)
        if destination.archived:
            fail(409, "archived", "Restore the destination project first.")
        if body.context_mode is None:
            chat.context_mode = destination.context_mode
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(chat, key, value)
    if "project_id" in body.model_fields_set and body.project_id is None:
        chat.project_id = None
    if chat.project_id is None:
        chat.context_mode = "chat"
    db.commit()
    return chat


@app.get("/v1/chats/{chat_id}/messages", response_model=list[MessageOut], tags=["messages"])
def list_messages(chat_id: str, db: DB, owner: Owner):
    owned(db, Chat, chat_id, owner)
    return list(db.scalars(select(Message).where(Message.chat_id == chat_id, Message.owner_id == owner).order_by(Message.created_at)))


@app.post("/v1/chats/{chat_id}/messages", response_model=MessageOut, status_code=201, tags=["messages"])
def create_message(chat_id: str, body: MessageCreate, db: DB, owner: Owner):
    chat = owned(db, Chat, chat_id, owner)
    if db.scalar(select(LanguageDay.id).where(LanguageDay.chat_id == chat_id)):
        fail(409, "language_chat", "Send this reply through the language learning component.")
    project = project_access(db, chat.project_id, owner, write=True) if chat.project_id else None
    if chat.archived or project and project.archived:
        fail(409, "archived", "Restore this chat and project before adding messages.")
    check_attachments(db, owner, body.attachment_ids)
    message = Message(owner_id=owner, chat_id=chat_id, role="user", **body.model_dump())
    db.add(message)
    if chat.title == "New chat":
        chat.title = body.content.strip().split("\n")[0][:70]
    chat.updated_at = now()
    db.commit()
    return message


@app.post("/v1/runs", response_model=RunOut, status_code=201, tags=["runs"])
def create_run(body: RunCreate, db: DB, owner: Owner):
    chat = owned(db, Chat, body.chat_id, owner)
    existing = db.scalar(select(Run).where(Run.owner_id == owner, Run.idempotency_key == body.idempotency_key))
    if chat.project_id and not existing:
        project = project_access(db, chat.project_id, owner, write=True)
        from .intelligence import project_binding
        model_access(db, project, project_binding(body.settings.intelligence)["model"])
    if db.scalar(select(LanguageDay.id).where(LanguageDay.chat_id == body.chat_id, LanguageDay.owner_id == owner)):
        fail(409, "language_chat", "Start this reply through the language learning component.")
    # Replays must reach the idempotency check even after a decision expires.
    existing = db.scalar(select(Run).where(Run.owner_id == owner, Run.idempotency_key == body.idempotency_key))
    if not existing and not body.intent_id:
        from .intent import resolve
        message = owned(db, Message, body.message_id, owner)
        attachment_ids = list(dict.fromkeys(message.attachment_ids + body.attachment_ids))
        artifacts = check_attachments(db, owner, attachment_ids)
        chat = owned(db, Chat, body.chat_id, owner)
        decision = resolve(db, owner, IntentRequest(project_id=chat.project_id, prompt=message.content, attachment_ids=attachment_ids, capability=body.capability, intelligence=body.settings.intelligence, allow_web_search=body.settings.web_search), artifacts)
        body = body.model_copy(update={"intent_id": decision.id})
    return submit_run(db, owner, body)


@app.post("/v1/intent", response_model=IntentOut, tags=["runs"])
def resolve_intent(body: IntentRequest, db: DB, owner: Owner):
    from .intent import resolve
    if body.project_id:
        project = project_access(db, body.project_id, owner, write=True)
        from .intelligence import project_binding
        model_access(db, project, project_binding(body.intelligence)["model"])
    artifacts = check_attachments(db, owner, body.attachment_ids)
    record = resolve(db, owner, body, artifacts)
    return {"id": record.id, **{key: value for key, value in record.decision.items() if key in IntentOut.model_fields}}


@app.get("/v1/projects/{project_id}/memory.md", tags=["builder"])
def export_project_memory(project_id: str, db: DB, owner: Owner):
    from fastapi.responses import Response
    from .project_experience import memory_markdown
    owned_project(db, project_id, owner)
    return Response(memory_markdown(get_workspace(db, project_id)["workspace"]), media_type="text/markdown",
                    headers={"Content-Disposition": 'attachment; filename="project-memory.md"'})


@app.get("/v1/runs", response_model=list[RunOut], tags=["runs"])
def list_runs(db: DB, owner: Owner, chat_id: str | None = None, project_id: str | None = None):
    query = select(Run).where(Run.owner_id == owner)
    query = query.where((Run.project_id.is_(None)) | (Run.project_id.in_(select(Project.id).where(accessible_projects(owner)))))
    if chat_id:
        owned(db, Chat, chat_id, owner)
        query = query.where(Run.chat_id == chat_id)
    if project_id:
        owned(db, Project, project_id, owner)
        query = query.where(Run.project_id == project_id)
    return list(db.scalars(query.order_by(Run.created_at.desc()).limit(100)))


@app.get("/v1/runs/{run_id}", response_model=RunOut, tags=["runs"])
def get_run(run_id: str, db: DB, owner: Owner):
    return owned(db, Run, run_id, owner)


@app.post("/v1/runs/{run_id}/cancel", response_model=RunOut, tags=["runs"])
def cancel_run(run_id: str, db: DB, owner: Owner):
    owned(db, Run, run_id, owner)
    run = db.scalar(select(Run).where(Run.id == run_id, Run.owner_id == owner).with_for_update())
    if run is None:
        fail(404, "not_found", "Run not found.")
    if run.status not in TERMINAL and run.status != "cancel_requested":
        if run.status == "queued":
            run.status = "cancelled"
            run.stage = "cancelled"
            run.completed_at = now()
            settle_usage(db, run, 0, 0, "cancelled before dispatch")
        else:
            run.status = "cancel_requested"
        emit(db, run, "run." + run.status, {"status": run.status})
        db.commit()
    return run


@app.post("/v1/runs/{run_id}/retry", response_model=RunOut, status_code=201, tags=["runs"])
def retry_run(run_id: str, body: RunRetry, db: DB, owner: Owner):
    run = owned(db, Run, run_id, owner)
    if run.settings.get('task_plan'):
        run = db.scalar(select(Run).where(Run.id == run_id).with_for_update())
        if body.idempotency_key in run.settings.get('task_resume_keys', []):
            return run
        if run.project_id:
            project_access(db, run.project_id, owner, write=True)
        code = (run.error or {}).get('code')
        if run.status not in {'failed', 'cancelled'} or run.submission_started or code in {'submission_uncertain', 'cancellation_unconfirmed'}:
            fail(409, 'reconcile_required', 'This task cannot be resumed until its active or uncertain submission is resolved.')
        if code in {'quality_review_failed', 'invalid_finish_plan', 'response_incomplete', 'model_refusal'}:
            fail(409, 'quality_review_required', 'Review the saved result and revise its instructions. Repeating the same paid generation is not a repair.')
        budget = body.budget_usd if body.budget_usd is not None else run.budget_usd
        if settings().spending_limits_enabled and (budget > settings().max_run_budget_usd or budget <= run.actual_cost_usd):
            fail(422, 'budget_limit', 'The remaining task needs an available budget within the server limit.')
        account = account_for_update(db, owner)
        reservation = max(0, budget - run.actual_cost_usd)
        if settings().spending_limits_enabled and account.spent_usd + account.reserved_usd + reservation > account.budget_usd:
            fail(402, 'account_budget', 'Your processing allowance is used or reserved.')
        account.reserved_usd += reservation
        run.reservation_usd = reservation
        run.budget_usd = budget
        classifier_cost = run.model_provenance.get('classifier', {}).get('metrics', {}).get('cost_estimate_usd', 0)
        run.settings = {**run.settings, 'media_execution_budget_usd': min(run.settings.get('media_budget_usd', 1), budget - classifier_cost),
                        'task_resume_keys': [*run.settings.get('task_resume_keys', []), body.idempotency_key]}
        run.status, run.stage, run.error, run.completed_at = 'queued', 'queued', None, None
        run.lease_expires_at = None
        emit(db, run, 'run.queued', {'status': 'queued', 'resuming_tasks': True})
        db.commit()
        return run
    if run.status not in {"failed", "cancelled"}:
        fail(409, "not_retryable", "Only failed or cancelled runs can be retried.")
    if run.attempt >= 2 and not run.settings.get("project_experience"):
        fail(409, "attempt_limit", "This workflow has reached its two-attempt limit. Review the error before starting a new request.")
    if run.error and run.error.get("code") in ["submission_uncertain", "cancellation_unconfirmed"]:
        fail(409, "reconcile_required", "This request needs review before it can be retried.")
    replan_stage = None
    if run.workflow_id == 'asset.production.v1' and body.intelligence == 'super' and (run.error or {}).get('code') in {'invalid_finish_plan', 'response_incomplete'}:
        name = run.settings.get('production_active_stage')
        checkpoint = run.model_provenance.get('production', {}).get(name, {})
        policy = checkpoint.get('result', {}).get('provenance', {}).get('policy', {})
        if name in {'prepare_reference', 'plan_finishing', 'review_export'} and checkpoint.get('status') == 'completed' and policy.get('model') == 'gpt-6.1-sol':
            replan_stage = name
    if run.workflow_id == 'asset.production.v1' and not replan_stage and (run.error or {}).get('code') in {'quality_review_failed', 'invalid_finish_plan', 'model_refusal', 'response_incomplete'}:
        fail(409, 'quality_review_required', 'Review the saved model and stage findings, then revise the request. Repeating the same model call will not repair the underlying issue.')
    request = RunCreate(chat_id=run.chat_id, message_id=run.message_id, capability=run.capability, attachment_ids=run.attachment_ids, settings={key: value for key, value in run.settings.items() if key in GenerationSettings.model_fields}, budget_usd=body.budget_usd if body.budget_usd is not None else run.budget_usd, idempotency_key=body.idempotency_key)
    if run.settings.get("language_learning"):
        guard_language_retry(db, run, owner, body.idempotency_key)
    internal = {key: run.settings[key] for key in ["builder_refinement", "workspace_version", "language_learning", "language_profile", "language_day_id", "language_action", "language_input", "language_request_fingerprint", "intelligence_tier", "media_plan", "media_operation", "media_source_ids", "requested_filename"] if key in run.settings}
    if run.settings.get("experience_intent", {}).get("action") == "media":
        # Reuse a successfully paid plan after a known execution/precondition
        # failure. A user-requested retry never needs to pay to rediscover it.
        internal["experience_intent"] = run.settings["experience_intent"]
    if run.workflow_id == 'asset.production.v1':
        internal['production_resume_run_id'] = run.id
        if replan_stage:
            internal['production_replan_stage'] = replan_stage
    if body.intelligence is not None:
        if run.settings.get("language_learning"):
            internal["intelligence_tier"] = "basic"
        elif body.intelligence == "advanced":
            fail(422, "unsupported_intelligence", "Choose Basic, Smarter, or Super for this conversation.")
        else:
            request.settings.intelligence = body.intelligence
    request.settings.web_search = run.settings.get("web_search_allowed", run.settings.get("web_search", False))
    return submit_run(db, owner, request, parent=run, internal_settings=internal)


@app.get("/v1/runs/{run_id}/events", response_model=list[EventOut], tags=["runs"])
async def events(run_id: str, request: Request, db: DB, owner: Owner, after: int = 0):
    owned(db, Run, run_id, owner)
    if "text/event-stream" not in request.headers.get("accept", ""):
        return list(db.scalars(select(RunEvent).where(RunEvent.run_id == run_id, RunEvent.sequence > after).order_by(RunEvent.sequence)))
    try:
        cursor = max(after, int(request.headers.get("last-event-id", "0")))
    except ValueError:
        cursor = after
    # End the initial transaction before the streaming connection starts.
    db.rollback()

    async def stream():
        nonlocal cursor
        while not await request.is_disconnected():
            with SessionLocal() as session:
                run = owned(session, Run, run_id, owner)
                items = list(session.scalars(select(RunEvent).where(RunEvent.run_id == run_id, RunEvent.sequence > cursor).order_by(RunEvent.sequence)))
                terminal = run.status in TERMINAL
                for item in items:
                    cursor = item.sequence
                    yield f"id: {cursor}\nevent: {item.type}\ndata: {EventOut.model_validate(item).model_dump_json()}\n\n"
            if terminal:
                break
            if not items:
                yield ": heartbeat\n\n"
            await asyncio.sleep(1)
    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/v1/runs/{run_id}/stages", tags=["runs"])
def stages(run_id: str, db: DB, owner: Owner):
    owned(db, Run, run_id, owner)
    return [{"id": s.id, "stage_id": s.stage_id, "attempt": s.attempt, "status": s.status, "started_at": s.started_at, "completed_at": s.completed_at, "details": s.details} for s in db.scalars(select(StageAttempt).where(StageAttempt.run_id == run_id).order_by(StageAttempt.started_at))]


@app.post("/v1/uploads", response_model=ArtifactOut, status_code=201, tags=["artifacts"])
def upload(db: DB, owner: Owner, file: UploadFile = File(...), project_id: str | None = Form(default=None), chat_id: str | None = Form(default=None)):
    project_id, chat_id = project_id or None, chat_id or None
    if project_id:
        project = project_access(db, project_id, owner, write=True)
        if project.archived:
            fail(409, "archived", "Restore this project before adding files.")
    if chat_id:
        chat = owned(db, Chat, chat_id, owner)
        if chat.archived:
            fail(409, "archived", "Restore this chat before adding files.")
        if project_id is None:
            project_id = chat.project_id
            if project_id and owned(db, Project, project_id, owner).archived:
                fail(409, "archived", "Restore this project before adding files.")
        if chat.project_id != project_id:
            fail(422, "project_mismatch", "This chat belongs to another project.")
    # This handler performs synchronous storage and row-locking database work.
    # FastAPI runs it in a thread, so a waiting upload cannot block the event
    # loop that closes another request's transaction after a quota rejection.
    data = file.file.read(settings().max_upload_bytes + 1)
    mime = (file.content_type or "").split(";")[0]
    try:
        details = validate_content(data, mime)
    except (ValueError, json.JSONDecodeError) as exc:
        fail(422, "invalid_upload", str(exc))
    artifact_id = uid()
    if project_id:
        account_for_update(db, owner)
        project = project_access(db, project_id, owner, write=True)
        admit_organization_storage(db, project, len(data))
    choice = (owned(db, Project, project_id, owner).storage_mode if project_id else None) or preferences(db, owner).storage_mode
    # References can be attached before choosing where generated files are saved.
    # Use the included cloud allowance without changing the user's preference.
    mode = admit_storage(db, owner, len(data), "cloud" if choice == "unselected" else choice)
    key = f"{owner}/uploads/{artifact_id}{MIME_EXT[mime]}"
    Storage().put(key, data, mime)
    artifact = Artifact(id=artifact_id, owner_id=owner, project_id=project_id, chat_id=chat_id, name=Path(file.filename or "upload").name[:200], kind=kind_for(mime), mime_type=mime, size_bytes=len(data), sha256=digest(data), storage_key=key, details={**details, "source": "upload", **storage_metadata(mode)})
    db.add(artifact)
    db.commit()
    return artifact_out(artifact)


@app.get("/v1/artifacts", response_model=list[ArtifactOut], tags=["artifacts"])
def list_artifacts(db: DB, owner: Owner, project_id: str | None = None, chat_id: str | None = None):
    query = select(Artifact).where(Artifact.owner_id == owner)
    if project_id:
        project = project_access(db, project_id, owner)
        if project.organization_id:
            query = select(Artifact).where(Artifact.project_id == project_id, (Artifact.owner_id == owner) | (Artifact.chat_id.is_(None)) | (Artifact.details["shared_with_project"].as_boolean().is_(True)))
        else:
            query = query.where(Artifact.project_id == project_id)
    else:
        query = query.where((Artifact.project_id.is_(None)) | (Artifact.project_id.in_(select(Project.id).where(accessible_projects(owner)))))
    if chat_id:
        owned(db, Chat, chat_id, owner)
        query = query.where(Artifact.chat_id == chat_id)
    return [artifact_out(item) for item in db.scalars(query.order_by(Artifact.created_at.desc()).limit(300))]


@app.get("/v1/artifacts/{artifact_id}", response_model=ArtifactOut, tags=["artifacts"])
def get_artifact(artifact_id: str, db: DB, owner: Owner):
    from .collaboration import readable_artifact
    return artifact_out(readable_artifact(db, artifact_id, owner))


@app.patch("/v1/artifacts/{artifact_id}", response_model=ArtifactOut, tags=["artifacts"])
def patch_artifact(artifact_id: str, body: ArtifactPatch, db: DB, owner: Owner):
    artifact = owned(db, Artifact, artifact_id, owner)
    if artifact.project_id:
        project_access(db, artifact.project_id, owner, write=True)
    if body.name is not None:
        artifact.name = body.name
    if body.favorite is not None:
        artifact.details = {**artifact.details, "favorite": body.favorite}
    db.commit()
    return artifact_out(artifact)


@app.delete("/v1/artifacts/{artifact_id}", status_code=204, tags=["artifacts"])
def delete_artifact(artifact_id: str, db: DB, owner: Owner):
    # Serialize with submission so an asset cannot disappear during admission.
    account_for_update(db, owner)
    artifact = owned(db, Artifact, artifact_id, owner)
    if artifact.project_id:
        project_access(db, artifact.project_id, owner, write=True)
    active = db.scalars(select(Run).where(Run.owner_id == owner, Run.status.notin_(TERMINAL)))
    if any(artifact_id in run.attachment_ids or artifact_id in run.artifact_ids or artifact.run_id == run.id for run in active):
        fail(409, "asset_in_use", "Wait for the request using this asset to finish before deleting it.")
    # Delete bytes first: a storage failure must leave the asset available for retry.
    # Historical IDs remain as provenance; they no longer resolve to a file.
    try:
        Storage().delete(artifact.storage_key)
    except Exception:
        fail(503, "asset_delete_failed", "The stored file could not be deleted. Please try again.")
    db.delete(artifact)
    db.commit()
    return Response(status_code=204)


def artifact_response(artifact_id: str, db: Session, owner: str, download: bool):
    from .collaboration import readable_artifact
    artifact = readable_artifact(db, artifact_id, owner)
    if not artifact_available(artifact):
        fail(410, "file_expired", "This temporary file has expired. Open the copy saved in your local folder.")
    headers = {"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"}
    if settings().storage_backend == "local":
        return FileResponse(Storage().local_path(artifact.storage_key), media_type=artifact.mime_type, filename=artifact.name if download else None, content_disposition_type="attachment" if download else "inline", headers=headers)
    data = Storage().read(artifact.storage_key)
    if download:
        from urllib.parse import quote
        headers["Content-Disposition"] = f"attachment; filename*=UTF-8''{quote(artifact.name, safe='')}"
    return Response(content=data, media_type=artifact.mime_type, headers=headers)


@app.get("/v1/artifacts/{artifact_id}/content", tags=["artifacts"])
def artifact_content(artifact_id: str, db: DB, owner: Owner):
    return artifact_response(artifact_id, db, owner, False)


@app.get("/v1/artifacts/{artifact_id}/download", tags=["artifacts"])
def download_artifact(artifact_id: str, db: DB, owner: Owner):
    return artifact_response(artifact_id, db, owner, True)


@app.get("/v1/context-grants", response_model=list[GrantOut], tags=["context"])
def list_grants(db: DB, owner: Owner, destination_project_id: str | None = None, include_revoked: bool = False):
    query = select(ContextGrant).where(ContextGrant.owner_id == owner, ContextGrant.destination_project_id.in_(select(Project.id).where(accessible_projects(owner))))
    if destination_project_id:
        owned(db, Project, destination_project_id, owner)
        query = query.where(ContextGrant.destination_project_id == destination_project_id)
    if not include_revoked:
        query = query.where(ContextGrant.revoked_at.is_(None))
    return list(db.scalars(query.order_by(ContextGrant.created_at.desc())))


@app.post("/v1/context-grants", response_model=GrantOut, status_code=201, tags=["context"])
def create_grant(body: GrantCreate, db: DB, owner: Owner):
    owned(db, Project, body.destination_project_id, owner)
    source = owned(db, {"project": Project, "chat": Chat, "artifact": Artifact}[body.source_type], body.source_id, owner)
    if body.mode == "live" and body.source_type != "project":
        fail(422, "invalid_grant_mode", "Live context links are supported for whole projects. Use a snapshot for chats and artifacts.")
    if body.source_type == "project" and body.source_id == body.destination_project_id:
        fail(422, "self_link", "A project already has access to its own context.")
    grant = ContextGrant(owner_id=owner, **body.model_dump(), source_name=getattr(source, "title", None) or getattr(source, "name", "Source"), captured_sources=source_records(db, owner, body.source_type, body.source_id) if body.mode == "snapshot" else [])
    db.add(grant)
    db.commit()
    return grant


@app.delete("/v1/context-grants/{grant_id}", response_model=GrantOut, tags=["context"])
def revoke_grant(grant_id: str, db: DB, owner: Owner):
    grant = owned(db, ContextGrant, grant_id, owner)
    grant.revoked_at = grant.revoked_at or now()
    db.commit()
    return grant


@app.get("/v1/usage", tags=["usage"])
def usage(db: DB, owner: Owner):
    account = db.get(Account, owner)
    entries = list(db.scalars(select(UsageEntry).where(UsageEntry.owner_id == owner).order_by(UsageEntry.created_at.desc()).limit(200)))
    return {"budget_usd": account.budget_usd if account else settings().account_budget_usd, "reserved_usd": account.reserved_usd if account else 0, "spent_usd": account.spent_usd if account else 0, "entries": [{"run_id": e.run_id, "provider": e.provider, "estimated_cost_usd": e.estimated_cost_usd, "actual_cost_usd": e.actual_cost_usd, "duration_seconds": e.duration_seconds, "measurement": e.measurement, "created_at": e.created_at} for e in entries]}
