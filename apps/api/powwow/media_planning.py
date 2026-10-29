"""Executable media contracts. Models select registered workflows, never providers.

Planning is a paid, checkpointed stage of the same admitted run. This module
validates its output and reserves the next stage before any media submission.
"""
from typing import Literal

from fastapi import HTTPException
from pydantic import Field, model_validator
from sqlalchemy import select

from .schemas import Schema, EntryImageTarget


class MediaTask(Schema):
    id: str = Field(pattern=r"^[a-z][a-z0-9_-]{0,31}$")
    workflow: Literal["image.create.v1", "image.edit.v1", "video.animate.v1", "asset.image_to_3d.v1", "asset.production.v1"]
    instructions: str = Field(min_length=1, max_length=12000)
    output_name: str = Field(min_length=1, max_length=160)
    source_image_ids: list[str] = Field(default_factory=list, max_length=8)
    source_task_ids: list[str] = Field(default_factory=list, max_length=8)
    depends_on: list[str] = Field(default_factory=list, max_length=16)
    transparent_background: bool = False
    acceptance: list[str] = Field(min_length=1, max_length=16)
    destination: EntryImageTarget | None = None


class TaskPlan(Schema):
    summary: str = Field(min_length=1, max_length=1200)
    tasks: list[MediaTask] = Field(min_length=1, max_length=16)

    @model_validator(mode='after')
    def executable_graph(self):
        seen, names = set(), set()
        for task in self.tasks:
            if task.id in seen or task.output_name.casefold() in names:
                raise ValueError('Task IDs and filenames must be unique.')
            if set(task.depends_on + task.source_task_ids) - seen:
                raise ValueError('Dependencies must reference earlier tasks; cycles are not allowed.')
            if any(c in task.output_name for c in '/\\') or task.output_name in {'.', '..'}:
                raise ValueError('Use a filename, not a filesystem path.')
            if task.transparent_background and not task.output_name.lower().endswith('.png'):
                raise ValueError('Transparent images must be named .png.')
            seen.add(task.id)
            names.add(task.output_name.casefold())
        return self


class MediaPlan(Schema):
    workflow: Literal["image.create.v1", "image.edit.v1", "video.animate.v1", "asset.image_to_3d.v1", "asset.production.v1", "unsupported"]
    brief: str = Field(min_length=1, max_length=7500)
    output_name: str = Field(min_length=1, max_length=160)
    source_image_ids: list[str] = Field(max_length=8)
    steps: list[str] = Field(min_length=1, max_length=8)


WORKFLOW_CAPABILITIES = {"image.create.v1": "text_to_image", "image.edit.v1": "text_to_image",
    "video.animate.v1": "image_to_video", "asset.image_to_3d.v1": "image_to_3d", "asset.production.v1": "image_to_3d"}


def workflow_catalog():
    from .registry import binding
    from .production import availability
    descriptions = {
        "image.create.v1": "Create one still image from a text brief. No source image required.",
        "image.edit.v1": "Edit or re-create the supplied image(s), using their actual pixels. The output remains a still image, including reference art prepared for later 3D generation.",
        "video.animate.v1": "Animate one attached image into a video. Does not create a still reference first.",
        "asset.image_to_3d.v1": "Generate a concept mesh with TRELLIS.2 from one image already suitable for reconstruction. Preserve raw output and run deterministic Blender geometry/material checks. Does NOT perform AI input editing, GPT-6 Blender finishing, or new skin/texture generation.",
        "asset.production.v1": "Create a finished textured GLB from one image: vision-directed reference edit, transparent foreground isolation with BiRefNet, detailed TRELLIS, four-view GPT-6 inspection, bounded Blender geometry/material finishing, new 4096px albedo atlases baked into preserved UVs, editable Blender master, export/reimport and final visual review. Includes a cached lit thumbnail. Cannot invent missing geometry, rig, retopologize or generate arbitrary new designs on surfaces; quality failures preserve outputs and stop.",
    }
    result = [{"id": key, "purpose": descriptions[key], "available": binding(cap)["enabled"],
               "model": binding(cap)["model"], "qualification": "candidate"} for key, cap in WORKFLOW_CAPABILITIES.items()]
    for item in result:
        if item['id'] == 'asset.production.v1':
            item.update(availability())
    return result


def activate_media(db, current, plan: MediaPlan):
    from .registry import binding
    if isinstance(plan, MediaPlan) and plan.workflow.startswith('image.') and binding('text_to_image')['provider'] == 'openai':
        # Compatibility for saved, already-paid single-output plans. New model
        # replies use TaskPlan; legacy multi-output prose must be replanned.
        plan = TaskPlan(summary='Create the requested image', tasks=[MediaTask(id='image', workflow=plan.workflow,
            instructions=plan.brief, output_name=plan.output_name, source_image_ids=plan.source_image_ids,
            acceptance=['Follow the requested subject, composition, pose, and all visual constraints.'])])
    if isinstance(plan, TaskPlan):
        from .task_execution import activate
        return activate(db, current, plan)
    from .asset_names import requested_name
    from .account_preferences import admit_storage, artifact_available
    from .config import settings
    from .models import Artifact, Project
    from .providers import ProviderFailure
    from .registry import WORKFLOWS, binding
    from .service import account_for_update, emit

    capability = WORKFLOW_CAPABILITIES.get(plan.workflow)
    if not capability:
        raise ProviderFailure("workflow_unavailable", "The requested workflow is not implemented. No media generation was submitted.")
    if plan.workflow == 'asset.production.v1':
        from .production import availability
        if not availability()['available']:
            raise ProviderFailure('workflow_unavailable', 'The production workflow needs local image/TRELLIS workers, Blender and the hosted visual model.')
    explicit_name = requested_name(current.prompt)
    if explicit_name:
        plan = plan.model_copy(update={"output_name": explicit_name})
    extension = plan.output_name.rsplit(".", 1)[-1].lower() if "." in plan.output_name else ""
    formats = {"text_to_image": {"png", "jpg", "jpeg", "webp"}, "image_to_video": {"mp4"}, "image_to_3d": {"glb"}}
    known = set().union(*formats.values()) | {"wav", "mp3", "ogg", "flac", "obj", "fbx", "blend", "pdf", "txt"}
    if extension in known and extension not in formats[capability]:
        raise ProviderFailure("invalid_plan", "The planned output does not match the requested file type. No generation was submitted.")
    if set(plan.source_image_ids) - set(current.attachment_ids):
        raise ProviderFailure("invalid_plan", "The plan referenced an image that was not attached. No generation was submitted.")
    from .service import check_attachments
    images = check_attachments(db, current.owner_id, plan.source_image_ids)
    needs_image = plan.workflow != "image.create.v1"
    if needs_image and not images:
        raise ProviderFailure("image_required", "Add the image you want to use, then send the request again.")
    if len(images) != len(set(plan.source_image_ids)) or any(a.kind != "image" or not artifact_available(a) for a in images):
        raise ProviderFailure("image_missing", "A selected source image is unavailable. Attach its saved copy and try again.")
    if capability in {"image_to_video", "image_to_3d"} and len(images) != 1:
        raise ProviderFailure("source_selection_required", "This workflow needs one source image. Select the image to use and try again.")
    if not needs_image and images:
        raise ProviderFailure("invalid_plan", "Image references require the image editing workflow. No generation was submitted.")
    bound = binding(capability)
    from .collaboration import guard_run_access, admit_organization_storage
    guard_run_access(db, current, bound['model'])
    if not bound["enabled"]:
        raise ProviderFailure("workflow_unavailable", "The selected media workflow is unavailable. No generation was submitted.")
    if bound["provider"] == "runpod" and any(a.size_bytes > 6 * 1024 * 1024 for a in images):
        raise ProviderFailure("source_too_large", "Cloud source images must be under 6 MiB. Resize the reference and try again.")
    remaining = min(current.settings.get("media_budget_usd", 1), max(0, current.budget_usd - current.actual_cost_usd))
    if settings().spending_limits_enabled and bound["estimated_cost_usd"] > remaining:
        raise ProviderFailure("budget_too_low", "The remaining request budget cannot cover media generation. No generation was submitted.")
    account = account_for_update(db, current.owner_id)
    reserve = remaining if bound["provider"] == "runpod" or plan.workflow == 'asset.production.v1' else bound["estimated_cost_usd"]
    delta = reserve - current.reservation_usd
    if settings().spending_limits_enabled and account.spent_usd + account.reserved_usd + delta > account.budget_usd + 1e-9:
        raise ProviderFailure("account_budget", "Your processing allowance is used or reserved. No media generation was submitted.")
    project = db.get(Project, current.project_id) if current.project_id else None
    if project and project.archived:
        raise ProviderFailure("project_archived", "Restore this project before generating files.")
    capacity = settings().max_generated_artifact_bytes * (2 if capability == "image_to_3d" else 1)
    try:
        admit_organization_storage(db, project, capacity, current.id)
        mode = admit_storage(db, current.owner_id, capacity, project.storage_mode if project else None)
    except HTTPException as exc:
        raise ProviderFailure(exc.detail["code"], exc.detail["message"]) from exc
    account.reserved_usd = max(0, account.reserved_usd + delta)
    current.reservation_usd = reserve
    current.capability, current.workflow_id = capability, plan.workflow
    current.provider, current.model = bound["provider"], bound["model"]
    current.settings = {**current.settings, "project_experience": False, "media_plan": plan.model_dump(),
        "media_execution_budget_usd": remaining,
        "web_search": False,
        "media_operation": "edit" if plan.workflow == "image.edit.v1" else "create",
        "requested_filename": plan.output_name, "media_source_ids": plan.source_image_ids,
        "storage_mode": mode, "storage_reservation_bytes": capacity}
    current.submission_started = False
    current.model_provenance = {**current.model_provenance, "routing": {
        **current.model_provenance.get("routing", {}), "method": "model", "capability": capability,
        "task": {"text_to_image": "image", "image_to_video": "video", "image_to_3d": "model3d"}[capability],
        "skill_ids": WORKFLOWS[capability]["skills"], "available": True, "needs_image": False,
        "summary": "Edit the selected image" if plan.workflow == "image.edit.v1" else WORKFLOWS[capability]["name"],
        "web_search": False, "search_query": "",
        "model": current.model_provenance.get("classifier", {}).get("model"), "workflow": plan.workflow,
        "plan": plan.model_dump(), "qualification": "candidate"}}
    emit(db, current, "plan.selected", {"workflow": plan.workflow, "output_name": plan.output_name, "steps": plan.steps})
    db.commit()
