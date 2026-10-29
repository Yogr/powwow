from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator

from .schemas import Schema

Role = Literal["owner", "admin", "member", "viewer"]
TaskStatus = Literal["todo", "in_progress", "review", "done"]


class OrganizationCreate(Schema):
    name: str = Field(min_length=1, max_length=160)
    display_name: str = Field(default="", max_length=100)

    @field_validator("name")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("Enter an organization name.")
        return value.strip()


class OrganizationOut(Schema):
    id: str
    name: str
    role: Role
    plan: str
    limits: dict[str, int]
    current_user_id: str
    created_at: datetime


class MemberOut(Schema):
    user_id: str
    display_name: str
    role: Role
    created_at: datetime


class MemberPatch(Schema):
    role: Role | None = None
    display_name: str | None = Field(default=None, max_length=100)


class InviteCreate(Schema):
    role: Literal["admin", "member", "viewer"] = "member"
    expires_in_days: int = Field(default=7, ge=1, le=30)
    max_uses: int = Field(default=1, ge=1, le=100)
    email: str | None = Field(default=None, max_length=254)

    @field_validator("email")
    @classmethod
    def email_address(cls, value):
        if value is None:
            return value
        value = value.strip().lower()
        if "@" not in value or any(c.isspace() for c in value):
            raise ValueError("Enter an email address.")
        return value


class InviteOut(Schema):
    id: str
    organization_id: str
    role: str
    email: str | None
    max_uses: int
    uses: int
    expires_at: datetime
    revoked_at: datetime | None
    created_at: datetime


class InviteCreated(InviteOut):
    token: str
    invite_code: str


class InviteAccept(Schema):
    token: str = Field(min_length=12, max_length=200)
    display_name: str = Field(default="", max_length=100)


class TaskCreate(Schema):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=20000)
    status: TaskStatus = "todo"
    assignee_id: str | None = Field(default=None, max_length=128)

    @field_validator("title")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("Enter a task title.")
        return value.strip()


class TaskPatch(Schema):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=20000)
    status: TaskStatus | None = None
    assignee_id: str | None = Field(default=None, max_length=128)


class TaskOut(TaskCreate):
    id: str
    project_id: str
    organization_id: str | None
    created_by: str
    created_at: datetime
    updated_at: datetime


class PolicyPut(Schema):
    # None preserves the evaluated server routes. [] denies all model access.
    allowed_models: list[str] | None = Field(default=None, max_length=100)
    allowed_mcps: list[str] = Field(default_factory=list, max_length=100)
    allow_member_agents: bool = True


class AgentCreate(Schema):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)
    instructions: str = Field(default="", max_length=20000)
    model_id: str | None = Field(default=None, max_length=200)
    mcp_ids: list[str] = Field(default_factory=list, max_length=30)
    enabled: bool = True


class AgentPatch(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    instructions: str | None = Field(default=None, max_length=20000)
    model_id: str | None = Field(default=None, max_length=200)
    mcp_ids: list[str] | None = Field(default=None, max_length=30)
    enabled: bool | None = None


class AgentOut(AgentCreate):
    id: str
    organization_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    execution_available: bool = False
