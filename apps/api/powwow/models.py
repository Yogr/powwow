from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base, now, uid


class Owned:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    owner_id: Mapped[str] = mapped_column(String(128), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Account(Base):
    __tablename__ = "accounts"
    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    budget_usd: Mapped[float] = mapped_column(Float, default=25)
    reserved_usd: Mapped[float] = mapped_column(Float, default=0)
    spent_usd: Mapped[float] = mapped_column(Float, default=0)


class AccountPreferences(Base):
    __tablename__ = "account_preferences"
    owner_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    app_language: Mapped[str] = mapped_column(String(10), default="en")
    storage_mode: Mapped[str] = mapped_column(String(20), default="unselected")
    plan: Mapped[str] = mapped_column(String(30), default="free")
    component_priorities: Mapped[dict] = mapped_column(JSON, default=dict)


class ExperienceTour(Base):
    __tablename__ = "experience_tours"
    owner_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    kind: Mapped[str] = mapped_column(String(30), primary_key=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(160))
    plan: Mapped[str] = mapped_column(String(30), default="free")
    policy: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class OrganizationMember(Base):
    __tablename__ = "organization_members"
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(100), default="")
    role: Mapped[str] = mapped_column(String(20), default="member")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class OrganizationInvite(Base):
    __tablename__ = "organization_invites"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    role: Mapped[str] = mapped_column(String(20))
    max_uses: Mapped[int] = mapped_column(Integer, default=1)
    uses: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Project(Owned, Base):
    __tablename__ = "projects"
    name: Mapped[str] = mapped_column(String(160))
    instructions: Mapped[str] = mapped_column(Text, default="")
    context_mode: Mapped[str] = mapped_column(String(20), default="project")
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    storage_mode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    organization_id: Mapped[str | None] = mapped_column(ForeignKey("organizations.id"), index=True, nullable=True)


class ProjectWorkspace(Base):
    """Versioned builder documents; additive table keeps existing projects intact."""
    __tablename__ = "project_workspaces"
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), primary_key=True)
    workspace: Mapped[dict] = mapped_column(JSON, default=dict)
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Chat(Owned, Base):
    __tablename__ = "chats"
    __table_args__ = (UniqueConstraint("project_id", "component_id", "owner_id", name="uq_project_component_owner_chat"),)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id"), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(160), default="New chat")
    context_mode: Mapped[str] = mapped_column(String(20), default="project")
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    component_id: Mapped[str | None] = mapped_column(String(80), nullable=True)


class CollaborationTask(Base):
    __tablename__ = "collaboration_tasks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="todo")
    assignee_id: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)
    created_by: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class TaskChat(Base):
    __tablename__ = "task_chats"
    task_id: Mapped[str] = mapped_column(ForeignKey("collaboration_tasks.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    chat_id: Mapped[str] = mapped_column(ForeignKey("chats.id"), unique=True)


class OrganizationAgent(Base):
    __tablename__ = "organization_agents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(1000), default="")
    instructions: Mapped[str] = mapped_column(Text, default="")
    model_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    mcp_ids: Mapped[list] = mapped_column(JSON, default=list)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class LanguageProfile(Owned, Base):
    __tablename__ = "language_profiles"
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    learner_name: Mapped[str] = mapped_column(String(100))
    target_language: Mapped[str] = mapped_column(String(10))
    native_language: Mapped[str] = mapped_column(String(10))
    level: Mapped[str] = mapped_column(String(30))
    timezone: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[str] = mapped_column(String(10))


class LanguageDay(Owned, Base):
    __tablename__ = "language_days"
    __table_args__ = (UniqueConstraint("profile_id", "date"),)
    profile_id: Mapped[str] = mapped_column(ForeignKey("language_profiles.id"), index=True)
    date: Mapped[str] = mapped_column(String(10))
    day_number: Mapped[int] = mapped_column(Integer)
    chat_id: Mapped[str] = mapped_column(ForeignKey("chats.id"), unique=True)


class LanguagePhrase(Owned, Base):
    __tablename__ = "language_phrases"
    __table_args__ = (UniqueConstraint("profile_id", "fingerprint"),)
    profile_id: Mapped[str] = mapped_column(ForeignKey("language_profiles.id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    translation: Mapped[str] = mapped_column(Text)
    note: Mapped[str] = mapped_column(Text, default="")
    fingerprint: Mapped[str] = mapped_column(String(64))
    source_turn_id: Mapped[str | None] = mapped_column(ForeignKey("messages.id"), nullable=True)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    interval_days: Mapped[int] = mapped_column(Integer, default=0)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Message(Owned, Base):
    __tablename__ = "messages"
    chat_id: Mapped[str] = mapped_column(ForeignKey("chats.id"), index=True)
    role: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)
    attachment_ids: Mapped[list] = mapped_column(JSON, default=list)
    run_id: Mapped[str | None] = mapped_column(String(36), nullable=True, unique=True)


class Artifact(Owned, Base):
    __tablename__ = "artifacts"
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id"), index=True, nullable=True)
    chat_id: Mapped[str | None] = mapped_column(ForeignKey("chats.id"), nullable=True)
    run_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    kind: Mapped[str] = mapped_column(String(20))
    mime_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64))
    storage_key: Mapped[str] = mapped_column(String(500), unique=True)
    details: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    lineage_ids: Mapped[list] = mapped_column(JSON, default=list)


class ContextGrant(Owned, Base):
    __tablename__ = "context_grants"
    destination_project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    source_type: Mapped[str] = mapped_column(String(20))
    source_id: Mapped[str] = mapped_column(String(36))
    source_name: Mapped[str] = mapped_column(String(200))
    mode: Mapped[str] = mapped_column(String(20))
    captured_sources: Mapped[list] = mapped_column(JSON, default=list)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Run(Owned, Base):
    __tablename__ = "runs"
    __table_args__ = (UniqueConstraint("owner_id", "idempotency_key"), Index("ix_runs_claim", "status", "lease_expires_at"))
    chat_id: Mapped[str] = mapped_column(ForeignKey("chats.id"), index=True)
    message_id: Mapped[str] = mapped_column(ForeignKey("messages.id"))
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id"), nullable=True)
    idempotency_key: Mapped[str] = mapped_column(String(200))
    request_fingerprint: Mapped[str] = mapped_column(String(64))
    capability: Mapped[str] = mapped_column(String(30))
    workflow_id: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(30), default="queued")
    stage: Mapped[str] = mapped_column(String(50), default="queued")
    progress: Mapped[float | None] = mapped_column(Float, nullable=True)
    prompt: Mapped[str] = mapped_column(Text)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    attachment_ids: Mapped[list] = mapped_column(JSON, default=list)
    artifact_ids: Mapped[list] = mapped_column(JSON, default=list)
    context_snapshot: Mapped[list] = mapped_column(JSON, default=list)
    output_text: Mapped[str] = mapped_column(Text, default="")
    error: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    provider: Mapped[str] = mapped_column(String(40))
    model: Mapped[str] = mapped_column(String(200))
    model_provenance: Mapped[dict] = mapped_column(JSON, default=dict)
    estimated_cost_usd: Mapped[float] = mapped_column(Float, default=0)
    actual_cost_usd: Mapped[float] = mapped_column(Float, default=0)
    budget_usd: Mapped[float] = mapped_column(Float)
    reservation_usd: Mapped[float] = mapped_column(Float, default=0)
    attempt: Mapped[int] = mapped_column(Integer, default=1)
    parent_run_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    lease_owner: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lease_generation: Mapped[int] = mapped_column(Integer, default=0)
    lease_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    external_request_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    submission_started: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class IntentDecision(Owned, Base):
    __tablename__ = "intent_decisions"
    request_fingerprint: Mapped[str] = mapped_column(String(64), index=True)
    decision: Mapped[dict] = mapped_column(JSON)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class RunEvent(Base):
    __tablename__ = "run_events"
    __table_args__ = (UniqueConstraint("run_id", "sequence"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id"), index=True)
    sequence: Mapped[int] = mapped_column(Integer)
    stage_id: Mapped[str] = mapped_column(String(80))
    type: Mapped[str] = mapped_column(String(80))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)


class StageAttempt(Base):
    __tablename__ = "stage_attempts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id"), index=True)
    stage_id: Mapped[str] = mapped_column(String(80))
    attempt: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict)


class UsageEntry(Base):
    __tablename__ = "usage_entries"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    owner_id: Mapped[str] = mapped_column(String(128), index=True)
    run_id: Mapped[str] = mapped_column(ForeignKey("runs.id"), unique=True)
    provider: Mapped[str] = mapped_column(String(40))
    estimated_cost_usd: Mapped[float] = mapped_column(Float)
    actual_cost_usd: Mapped[float] = mapped_column(Float)
    duration_seconds: Mapped[float] = mapped_column(Float)
    measurement: Mapped[str] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
