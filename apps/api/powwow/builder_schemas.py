"""Shared wire contract for the project builder's durable editable documents."""
from typing import Annotated, Literal

from pydantic import Field, model_validator

from .schemas import Schema

KindId = Literal["game", "movie", "book", "comic", "website", "app", "podcast", "music", "course", "brand", "research", "language", "other"]
ShortValue = Annotated[str, Field(max_length=500)]
RecordValue = str


class BuilderTask(Schema):
    id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    description: str = Field(default="", max_length=10000)
    status: Literal["todo", "doing", "blocked", "done"] = "todo"
    phase: str = Field(default="Build", max_length=100)
    acceptance: list[ShortValue] = Field(default_factory=list, max_length=30)
    depends_on: list[str] = Field(default_factory=list, max_length=100)
    component: str = Field(default="tasks", max_length=80)


class BuilderRecord(Schema):
    id: str = Field(min_length=1, max_length=120)
    title: str = Field(max_length=240)
    fields: dict[str, RecordValue] = Field(default_factory=dict, max_length=40)


class DetailCategory(Schema):
    id: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=80)


def validate_task_graph(tasks: list[BuilderTask]):
    by_id = {task.id: task for task in tasks}
    if len(by_id) != len(tasks):
        raise ValueError("Task IDs must be unique.")
    visited, active = set(), set()

    def visit(task_id):
        if task_id not in by_id:
            raise ValueError("Task dependencies must reference an existing task.")
        if task_id in active:
            raise ValueError("Task dependencies cannot contain a cycle.")
        if task_id in visited:
            return
        active.add(task_id)
        for dependency in by_id[task_id].depends_on:
            visit(dependency)
        active.remove(task_id)
        visited.add(task_id)

    for task_id in by_id:
        visit(task_id)


class BuilderWorkspace(Schema):
    kind: KindId | None = None
    initialized: bool = False
    brief: str = ""
    answers: dict[str, ShortValue] = Field(default_factory=dict, max_length=60)
    assumptions: list[ShortValue] = Field(default_factory=list, max_length=100)
    components: list[str] = Field(default_factory=list, max_length=50)
    tasks: list[BuilderTask] = Field(default_factory=list, max_length=500)
    records: dict[str, list[BuilderRecord]] = Field(default_factory=dict, max_length=50)
    detail_categories: list[DetailCategory] = Field(default_factory=list, max_length=40)
    design: str = ""
    plan_prompt: str = ""

    @model_validator(mode="after")
    def validate_document(self):
        from .project_details import DETAIL_CATEGORIES
        ids = [item.id for item in self.detail_categories]
        names = [item.name.strip().casefold() for item in self.detail_categories]
        if len(set(ids)) != len(ids) or len(set(names)) != len(names) or not all(names):
            raise ValueError("Category names and IDs must be unique and nonempty.")
        if any(key not in DETAIL_CATEGORIES and not key.startswith("detail-") for key in ids):
            raise ValueError("Custom category IDs must start with detail-.")
        validate_task_graph(self.tasks)
        for records in self.records.values():
            if len(records) > 300 or len({record.id for record in records}) != len(records):
                raise ValueError("Each editor allows up to 300 records with unique IDs.")
        self.components = list(dict.fromkeys(self.components))
        return self


class WorkspaceOut(Schema):
    version: int = Field(ge=0)
    workspace: BuilderWorkspace


class WorkspacePut(WorkspaceOut):
    pass


class PlanRequest(Schema):
    prompt: str = Field(min_length=1)
    kind: KindId | None = None
    answers: dict[str, ShortValue] = Field(default_factory=dict, max_length=60)
    explicit: bool = False


class PlanOut(WorkspaceOut):
    eligible: bool
    reason: str | None = None


class PlanPreview(Schema):
    eligible: bool
    reason: str | None = None
    kind: KindId
    answers: dict[str, str]


class RefinementRequest(Schema):
    budget_usd: float = Field(ge=0, le=100)
    idempotency_key: str = Field(min_length=8, max_length=200)


class RefinementApply(Schema):
    run_id: str
    version: int = Field(ge=1)


class RefinementProposal(Schema):
    design: str = Field(min_length=1, max_length=100000)
    tasks: list[BuilderTask] = Field(default_factory=list, max_length=100)


class RefinementOut(RefinementProposal):
    run_id: str
    version: int
