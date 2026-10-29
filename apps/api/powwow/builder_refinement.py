"""Durable, budget-bounded AI proposals with explicit versioned application."""
import json
import re

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from .builder import get_workspace, save_workspace
from .builder_catalog import COMPONENT_IDS
from .builder_schemas import BuilderWorkspace, RefinementProposal, RefinementRequest
from .models import Chat, Message, Project, Run
from .schemas import RunCreate
from .service import account_for_update, fail, submit_run


def refinement_prompt(workspace: dict) -> str:
    tasks = [{"id": task["id"], "title": task["title"], "status": task["status"], "component": task["component"],
              "description": task["description"][:350], "acceptance": task["acceptance"][:3], "depends_on": task["depends_on"]}
             for task in workspace["tasks"][:50]]
    records = {component: [{"title": record["title"], "fields": {key: value[:250] for key, value in list(record["fields"].items())[:6]}}
                           for record in items[:2]] for component, items in workspace["records"].items() if items}
    snapshot = {"kind": workspace["kind"], "brief": workspace["brief"], "latest_planning_request": workspace["plan_prompt"],
                "chosen_answers": workspace["answers"], "assumptions": workspace["assumptions"],
                "components": workspace["components"], "blueprint": workspace["design"][:9000],
                "existing_tasks": tasks, "editor_records_sample": records}
    prompt = """Develop a detailed project blueprint and additional tasks for the specific idea in the JSON below. The existing plan is a generic local starter; your job is to reason about THIS project's goals, constraints, feasibility, and path to completion.

Return ONLY valid JSON with two fields: "design" (a complete Markdown blueprint string) and "tasks" (an array of additional work items).
Each task must have id, title, description, status, phase, acceptance, depends_on, component.
- id: a unique short string beginning "ai-"; never reuse an existing task ID.
- title: a concrete deliverable, at most 240 characters.
- description: explain how it serves this specific idea and the next actionable work.
- status: always "todo". Planning never means work is complete.
- phase: Discover, Decide, Prototype, Build, Review, or Release.
- acceptance: 1–3 observable completion checks, each at most 500 characters.
- depends_on: existing task IDs or additional task IDs that must finish first; no missing references or cycles.
- component: one of the available component IDs listed below.

Write 6–16 additional, nonduplicative tasks that expose specific missing work or split difficult starter tasks into concrete subtasks. Preserve existing work and completed tasks. Reference existing IDs for prerequisites. Do not return the starter tasks again.
The blueprint should include: the user's exact premise and intended audience; a small complete first version; detailed domain or story design; a recommended technical or production approach justified by the stated choices; required assets and editors; uncertainties and decisions with a small validation experiment for each major risk; dependency-aware milestones; accessibility, testing, and delivery checks; and a clear next action.
Treat unset choices as suggestions requiring confirmation. Explain tradeoffs simply for beginners. Keep the first version achievable. Do not invent verified source research, installed tools, or completed builds. Tool feasibility must be verified later. Keep pricing, spending caps, and subscription guidance out of the blueprint and tasks; account entitlements belong in Settings. This is a proposal for the user to review, not execution permission. Preserve valuable existing blueprint material and editor notes.
Keep the design below 7000 characters and the overall response concise enough to be complete JSON.

Available component IDs: """ + ", ".join(sorted(COMPONENT_IDS)) + "\n\nProject source data:\n" + json.dumps(snapshot, ensure_ascii=False)
    if len(prompt) > 100000:
        fail(422, "planning_context_too_large", "This project has too much source text for a single planning pass. Shorten the brief or plan a smaller milestone.")
    return prompt


def queue_refinement(db: Session, project: Project, owner: str, body: RefinementRequest) -> Run:
    if project.archived:
        fail(409, "archived", "Restore this project before refining its roadmap.")
    # Reuse the existing account admission lock so retries cannot create a
    # second guide message or paid generation for the same request key.
    account_for_update(db, owner)
    existing = db.scalar(select(Run).where(Run.owner_id == owner, Run.idempotency_key == body.idempotency_key))
    if existing:
        if existing.project_id != project.id or not existing.settings.get("builder_refinement") or existing.budget_usd != body.budget_usd:
            fail(409, "idempotency_conflict", "This idempotency key was already used for a different request.")
        return existing
    current = get_workspace(db, project.id)
    if not current["workspace"]["initialized"]:
        fail(409, "plan_required", "Create the initial project roadmap before asking for an AI refinement.")
    prompt = refinement_prompt(current["workspace"])
    chat = db.scalar(select(Chat).where(Chat.project_id == project.id, Chat.owner_id == owner, Chat.title == "Project guide", Chat.archived.is_(False)).order_by(Chat.created_at).limit(1))
    if not chat:
        chat = Chat(owner_id=owner, project_id=project.id, title="Project guide", context_mode="project")
        db.add(chat)
        db.flush()
    message = Message(owner_id=owner, chat_id=chat.id, role="user", content=prompt, attachment_ids=[])
    db.add(message)
    db.flush()
    request = RunCreate(chat_id=chat.id, message_id=message.id, capability="chat", budget_usd=body.budget_usd, idempotency_key=body.idempotency_key)
    return submit_run(db, owner, request, internal_settings={"builder_refinement": True, "workspace_version": current["version"]})


def refinement_run(db: Session, project_id: str, owner: str, run_id: str) -> Run:
    run = db.scalar(select(Run).where(Run.id == run_id, Run.owner_id == owner, Run.project_id == project_id))
    if run is None or not run.settings.get("builder_refinement") or run.capability != "chat":
        fail(404, "not_found", "This project planning run does not exist or is not accessible.")
    if run.status != "succeeded":
        fail(409, "refinement_not_ready", "The planning run must finish successfully before reviewing or applying its proposal.")
    return run


def parse_proposal(run: Run, workspace: dict) -> RefinementProposal:
    raw = run.output_text.strip()
    if len(raw) > 150000:
        fail(422, "invalid_refinement", "The model returned a proposal that is too large. Request a smaller planning pass.")
    if raw.startswith("```"):
        matched = re.fullmatch(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.S | re.I)
        if matched:
            raw = matched.group(1).strip()
    try:
        proposal = RefinementProposal.model_validate(json.loads(raw))
        if not proposal.design.strip():
            raise ValueError("A blueprint is required.")
        known_ids = {task["id"] for task in workspace["tasks"]}
        if len({task.id for task in proposal.tasks}) != len(proposal.tasks):
            raise ValueError("Proposal task IDs must be unique.")
        if any(task.component not in COMPONENT_IDS for task in proposal.tasks):
            raise ValueError("Use only catalog components.")
        if any(task.status != "todo" for task in proposal.tasks):
            raise ValueError("Proposed tasks must start in todo.")
        combined = [*workspace["tasks"], *(task.model_dump() for task in proposal.tasks if task.id not in known_ids)]
        BuilderWorkspace.model_validate({**workspace, "tasks": combined, "design": proposal.design})
        return proposal
    except (ValueError, TypeError, ValidationError, RecursionError) as exc:
        # Never reflect model output or detailed validation data into HTML/error
        # labels. The original run remains available for inspection in its chat.
        raise HTTPException(422, detail={"code": "invalid_refinement", "message": "The model's proposal is not a valid blueprint and task graph. Nothing was applied; retry the planning pass or edit the roadmap manually."}) from exc


def proposal_for_review(db: Session, project_id: str, owner: str, run_id: str) -> dict:
    run = refinement_run(db, project_id, owner, run_id)
    current = get_workspace(db, project_id)
    if current["version"] != run.settings.get("workspace_version"):
        fail(409, "workspace_conflict", "The project was edited after this proposal started. Your edits are preserved. Request a new planning pass for the latest version.")
    proposal = parse_proposal(run, current["workspace"])
    return {"run_id": run.id, "version": run.settings["workspace_version"], **proposal.model_dump()}


def apply_refinement(db: Session, project: Project, owner: str, run_id: str, version: int) -> dict:
    if project.archived:
        fail(409, "archived", "Restore this project before applying its planning proposal.")
    run = refinement_run(db, project.id, owner, run_id)
    current = get_workspace(db, project.id)
    if current["version"] != version or run.settings.get("workspace_version") != version:
        fail(409, "workspace_conflict", "The project was edited after this proposal started. Your edits are preserved. Review them and request a new planning pass.")
    document = current["workspace"]
    proposal = parse_proposal(run, document)
    known_ids = {task["id"] for task in document["tasks"]}
    additions = [task.model_dump() for task in proposal.tasks if task.id not in known_ids]
    document["tasks"] = [*document["tasks"], *additions]
    document["design"] = proposal.design
    document["components"] = list(dict.fromkeys([*document["components"], *(task["component"] for task in additions)]))
    return save_workspace(db, project.id, version, document)
