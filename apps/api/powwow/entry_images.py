"""Attach completed images without replacing edits made during generation."""
from copy import deepcopy
from sqlalchemy import select
from .models import Artifact, Project, ProjectWorkspace
from .service import fail


def entry_record(document, target):
    return next((item for item in document.get("records", {}).get(target["category_id"], [])
                 if item["id"] == target["record_id"]), None)


def validate_target(db, project, capability, target):
    if capability != "text_to_image" or not project:
        fail(422, "entry_image_target", "Entry images require a project image request.")
    row = db.get(ProjectWorkspace, project.id)
    record = entry_record(row.workspace, target) if row else None
    if not record:
        fail(422, "entry_image_target", "Save this entry before generating its image.")
    if target["field"] != "reference" and target["category_id"] != "storyboard":
        fail(422, "entry_image_target", "Only storyboard scenes have frame images.")
    if record["fields"].get(target["field"], "") != target["expected_reference"]:
        fail(409, "entry_image_changed", "The entry's image changed. Reopen it before generating.")
    return record["title"]


def attach_entry_image(db, run):
    target = run.settings.get("entry_image")
    if not target:
        return
    row = db.scalar(select(ProjectWorkspace).where(ProjectWorkspace.project_id == run.project_id).with_for_update())
    project = db.get(Project, run.project_id)
    if project:
        from .collaboration import project_access
        project_access(db, project.id, run.owner_id, write=True)
    document = deepcopy(row.workspace) if row else {}
    record = entry_record(document, target)
    image = db.scalar(select(Artifact).where(Artifact.id.in_(run.artifact_ids), Artifact.run_id == run.id,
        Artifact.project_id == run.project_id, Artifact.owner_id == run.owner_id, Artifact.kind == "image"))
    status = "available_in_assets"
    if image and record and record['fields'].get(target['field']) == image.id:
        status = 'attached'
    elif image and record and project and not project.archived and record["fields"].get(target["field"], "") == target["expected_reference"]:
        record["fields"][target["field"]] = image.id
        row.workspace = document
        row.version += 1
        status = "attached"
    run.model_provenance = {**run.model_provenance, "entry_image": {"status": status, "artifact_id": image.id if image else None, **target}}
    if status == "attached" and image and project and project.organization_id:
        image.details = {**image.details, "shared_with_project": True}
