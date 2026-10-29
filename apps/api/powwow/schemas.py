from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

ContextMode = Literal["chat", "project", "selected"]
Capability = Literal["auto", "chat", "text_to_image", "image_to_video", "image_to_3d"]


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class ProjectCreate(Schema):
    name: str = Field(min_length=1, max_length=160)
    instructions: str = Field(default="", max_length=10000)
    context_mode: ContextMode = "project"
    storage_mode: Literal["local", "cloud"] | None = None
    organization_id: str | None = Field(default=None, max_length=36)


class ProjectPatch(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    instructions: str | None = Field(default=None, max_length=10000)
    context_mode: ContextMode | None = None
    archived: bool | None = None
    storage_mode: Literal["local", "cloud"] | None = None


class ProjectOut(ProjectCreate):
    id: str
    archived: bool
    created_at: datetime
    updated_at: datetime


class ChatCreate(Schema):
    project_id: str | None = None
    title: str = Field(default="New chat", min_length=1, max_length=160)
    context_mode: ContextMode | None = None


class ChatPatch(Schema):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    project_id: str | None = None
    context_mode: ContextMode | None = None
    archived: bool | None = None


class ChatOut(ChatCreate):
    id: str
    component_id: str | None = None
    context_mode: ContextMode
    archived: bool
    created_at: datetime
    updated_at: datetime


class MessageCreate(Schema):
    content: str = Field(min_length=1)
    attachment_ids: list[str] = Field(default_factory=list, max_length=8)


class MessageOut(MessageCreate):
    id: str
    chat_id: str
    role: Literal["user", "assistant"]
    run_id: str | None
    created_at: datetime


class EntryImageTarget(Schema):
    category_id: str = Field(min_length=1, max_length=80)
    record_id: str = Field(min_length=1, max_length=120)
    field: Literal["reference", "first_image", "last_image"] = "reference"
    expected_reference: str = Field(default="", max_length=120)


class GenerationSettings(Schema):
    entry_image: EntryImageTarget | None = None
    web_search: bool = True
    intelligence: Literal["basic", "smarter", "super"] = "basic"
    aspect_ratio: Literal["1:1", "16:9", "9:16", "4:3", "3:4"] = "1:1"
    quality: Literal["standard", "premium"] = "standard"
    media_budget_usd: float = Field(default=1, ge=0, le=100)
    seed: int | None = Field(default=None, ge=0, le=2147483647)
    width: int | None = Field(default=None, ge=256, le=1536, multiple_of=64)
    height: int | None = Field(default=None, ge=256, le=1536, multiple_of=64)
    num_inference_steps: int | None = Field(default=None, ge=1, le=12)


class IntentRequest(Schema):
    project_id: str | None = None
    prompt: str = Field(min_length=1)
    attachment_ids: list[str] = Field(default_factory=list, max_length=8)
    capability: Capability = "auto"
    intelligence: Literal["basic", "smarter", "super"] = "basic"
    allow_web_search: bool = True


class IntentOut(Schema):
    id: str
    capability: Literal["chat", "text_to_image", "image_to_video", "image_to_3d"]
    task: Literal["conversation", "creative_writing", "research", "image", "video", "model3d"]
    available: bool
    needs_image: bool
    summary: str
    skill_ids: list[str]
    method: Literal["model", "rules", "selected", "pending"]
    model: str | None = None
    web_search: bool = False


class RunCreate(Schema):
    chat_id: str
    message_id: str
    capability: Capability = "auto"
    attachment_ids: list[str] = Field(default_factory=list, max_length=8)
    settings: GenerationSettings = Field(default_factory=GenerationSettings)
    budget_usd: float = Field(default=1, ge=0, le=100)
    idempotency_key: str = Field(min_length=8, max_length=200)
    intent_id: str | None = None


class RunRetry(Schema):
    idempotency_key: str = Field(min_length=8, max_length=200)
    budget_usd: float | None = Field(default=None, ge=0, le=100)
    intelligence: Literal["basic", "smarter", "advanced", "super"] | None = None


class RunOut(Schema):
    id: str
    chat_id: str
    message_id: str
    project_id: str | None
    capability: str
    workflow_id: str
    status: str
    stage: str
    progress: float | None
    prompt: str
    settings: dict[str, Any]
    attachment_ids: list[str]
    artifact_ids: list[str]
    output_text: str
    error: dict[str, Any] | None
    estimated_cost_usd: float
    actual_cost_usd: float
    budget_usd: float
    provider: str
    model: str
    model_provenance: dict[str, Any]
    context_snapshot: list[dict[str, Any]]
    attempt: int
    parent_run_id: str | None
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None
    completed_at: datetime | None


class EventOut(Schema):
    run_id: str
    sequence: int
    stage_id: str
    type: str
    timestamp: datetime
    payload: dict[str, Any]


class ArtifactOut(Schema):
    id: str
    project_id: str | None
    chat_id: str | None
    run_id: str | None
    name: str
    kind: str
    mime_type: str
    size_bytes: int
    sha256: str
    url: str
    download_url: str
    preview_url: str | None = None
    metadata: dict[str, Any]
    lineage_ids: list[str]
    created_at: datetime
    storage_mode: Literal["legacy", "local", "cloud"] = "legacy"
    expires_at: datetime | None = None
    local_saved_at: datetime | None = None
    available: bool = True


class ArtifactPatch(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    favorite: bool | None = None


class GrantCreate(Schema):
    destination_project_id: str
    source_type: Literal["project", "chat", "artifact"]
    source_id: str
    mode: Literal["snapshot", "live"] = "snapshot"


class GrantOut(GrantCreate):
    id: str
    source_name: str
    created_at: datetime
    revoked_at: datetime | None
