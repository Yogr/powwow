from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Artifact, Chat, CollaborationTask, ContextGrant, LanguageDay, Message, Project, ProjectWorkspace, TaskChat


def version(value) -> str:
    return value.isoformat()


def message_source(message: Message) -> dict:
    return {"source_type": "message", "source_id": message.id, "chat_id": message.chat_id, "version": version(message.updated_at), "role": message.role, "content": message.content}


def artifact_source(artifact: Artifact) -> dict:
    content = artifact.details.get("text_excerpt", "")
    if artifact.mime_type == "text/plain":
        from .account_preferences import artifact_available
        from .storage import Storage
        if artifact_available(artifact):
            content = Storage().read(artifact.storage_key).decode("utf-8")
    return {"source_type": "artifact", "source_id": artifact.id, "version": artifact.sha256, "name": artifact.name, "mime_type": artifact.mime_type, "content": content, "creation_brief": artifact.details.get("creation_brief", ""), "description": f"Attachment: {artifact.name} ({artifact.mime_type})"}


def workspace_source(row: ProjectWorkspace) -> dict:
    """Useful bounded working context, with no project or grant traversal."""
    data = row.workspace
    chunks = ["Project builder workspace (editable project data; starter plans are provisional).",
              "Brief: " + data.get("brief", "")[:1500],
              "Decisions: " + str(data.get("answers", {}))[:1500],
              "Blueprint:\n" + data.get("design", "")[:6500]]
    tasks = data.get("tasks", [])
    active = [task for task in tasks if task.get("status") != "done"]
    chunks.append(f"Task board: {len(tasks) - len(active)}/{len(tasks)} complete. Active work:")
    for task in active[:25]:
        chunks.append(f"- [{task.get('status')}] {task.get('id')}: {task.get('title', '')[:200]} | {task.get('description', '')[:180]} | Acceptance: {'; '.join(task.get('acceptance', []))[:200]} | Depends on: {', '.join(task.get('depends_on', []))[:150]}")
    # Reserve a separate share for editor records even with a large task board.
    content = "\n".join(chunks)[:11500]
    record_lines = []
    for component, records in data.get("records", {}).items():
        for record in records[:5]:
            fields = "; ".join(f"{key}: {value[:350]}" for key, value in record.get("fields", {}).items())[:1000]
            record_lines.append(f"{component} / {record.get('title', '')[:150]}: {fields}")
    content += "\nEditor records (sample):\n" + "\n".join(record_lines)[:4500]
    return {"source_type": "workspace", "source_id": row.project_id, "version": str(row.version), "name": "Project blueprint, tasks, and editors", "content": content[:16500]}


def source_records(db: Session, owner: str, source_type: str, source_id: str) -> list[dict]:
    """Read owned base records only; grants are never traversed recursively."""
    if source_type == "artifact":
        from .collaboration import readable_artifact
        from fastapi import HTTPException
        try:
            return [artifact_source(readable_artifact(db, source_id, owner))]
        except HTTPException:
            return []
    chat_ids = [source_id]
    sources = []
    if source_type == "chat":
        chat = db.get(Chat, source_id)
        if not chat or chat.owner_id != owner:
            return []
        if chat.project_id:
            from .collaboration import accessible_projects
            if not db.scalar(select(Project.id).where(Project.id == chat.project_id, accessible_projects(owner))):
                return []
    if source_type == "project":
        from .collaboration import accessible_projects
        project = db.scalar(select(Project).where(Project.id == source_id, accessible_projects(owner)))
        if not project:
            return []
        sources.append({"source_type": "project", "source_id": project.id, "name": project.name, "version": version(project.updated_at), "content": project.instructions})
        workspace = db.get(ProjectWorkspace, project.id)
        if workspace:
            sources.append(workspace_source(workspace))
        chat_ids = list(db.scalars(select(Chat.id).where(Chat.project_id == source_id, Chat.owner_id == owner, Chat.archived.is_(False), Chat.id.not_in(select(LanguageDay.chat_id)))))
    if chat_ids:
        messages = list(db.scalars(select(Message).where(Message.owner_id == owner, Message.chat_id.in_(chat_ids)).order_by(Message.created_at.desc()).limit(40)))
        sources += [message_source(item) for item in reversed(messages)]
    return sources


def resolve_context(db: Session, owner: str, chat: Chat, attachment_ids: list[str], current_message_id: str | None = None) -> list[dict]:
    sources = source_records(db, owner, "chat", chat.id)
    task_link = db.scalar(select(TaskChat).where(TaskChat.chat_id == chat.id, TaskChat.user_id == owner))
    if task_link:
        task = db.get(CollaborationTask, task_link.task_id)
        sources.append({"source_type": "task", "source_id": task.id, "version": version(task.updated_at),
            "name": task.title, "content": task.description, "status": task.status,
            "scope": "shared task data; this conversation remains private"})
    if chat.context_mode == "project":
        project_sources = source_records(db, owner, "project", chat.project_id)
        sources += [source for source in project_sources if not (chat.component_id or task_link) or source["source_type"] != "message"]
    if chat.context_mode in ["project", "selected"]:
        grants = db.scalars(select(ContextGrant).where(ContextGrant.owner_id == owner, ContextGrant.destination_project_id == chat.project_id, ContextGrant.revoked_at.is_(None)))
        for grant in grants:
            # Membership changes also invalidate future use of saved grant
            # snapshots. Previously completed runs retain their provenance.
            current_sources = source_records(db, owner, grant.source_type, grant.source_id)
            if not current_sources:
                continue
            linked = grant.captured_sources if grant.mode == "snapshot" else current_sources
            sources += [{**source, "grant_id": grant.id, "grant_mode": grant.mode, "captured_at": grant.created_at.isoformat()} for source in linked]
    for artifact_id in attachment_ids:
        sources += source_records(db, owner, "artifact", artifact_id)
    deduped = {}
    for source in sources:
        key = (source["source_type"], source["source_id"], source["version"])
        if key not in deduped:
            deduped[key] = source
    # Limit the same-chat turn window before saving model-input provenance.
    selected = list(deduped.values())
    own_messages = sorted([s for s in selected if s.get("source_type") == "message" and s.get("chat_id") == chat.id and s["source_id"] != current_message_id], key=lambda s: s["version"])[-24:]
    own_ids = {s["source_id"] for s in own_messages}
    selected = [s for s in selected if s.get("source_type") != "message" or s.get("chat_id") != chat.id or s["source_id"] in own_ids or s["source_id"] == current_message_id]
    selected.sort(key=lambda s: (s["source_id"] == current_message_id, s.get("source_type") == "workspace"))
    # Admission accounts for the actual payload. Never silently discard an
    # explicitly selected reference or the current message because of its size.
    return selected
