from datetime import timedelta

import pytest
from pydantic import SecretStr
from sqlalchemy import create_engine, inspect, text

from powwow.auth import owner_id
from powwow.config import settings
from powwow.db import SessionLocal, now
from powwow.hosted_chat import request_body
from powwow.main import app
from powwow.migrations import sqlite_nullable_projects
from powwow.models import Artifact, Run
from powwow.storage import Storage
from powwow.worker import claim, execute


def chat(client, **body):
    result = client.post("/v1/chats", json=body)
    assert result.status_code == 201, result.text
    return result.json()


def queue(client, item, prompt="Hello", key="new-standalone-turn", capability="auto", **settings):
    message = client.post(f"/v1/chats/{item['id']}/messages", json={"content": prompt}).json()
    return client.post("/v1/runs", json={"chat_id": item["id"], "message_id": message["id"], "idempotency_key": key, "capability": capability, "settings": settings})


def upload(client, value=b"notes", **data):
    return client.post("/v1/uploads", data=data, files={"file": ("notes.txt", value, "text/plain")})


def test_standalone_chat_runs_without_project_or_storage_choice_and_is_isolated(client, workspace):
    project, sibling = workspace
    client.post(f"/v1/chats/{sibling['id']}/messages", json={"content": "private project context"})
    client.patch("/v1/account/preferences", json={"storage_mode": "unselected"})
    standalone = chat(client, title="A question")
    assert standalone["project_id"] is None and standalone["context_mode"] == "chat"
    result = queue(client, standalone)
    assert result.status_code == 201, result.text
    run = result.json()
    assert run["project_id"] is None
    assert all(source.get("content") != "private project context" for source in run["context_snapshot"])
    execute(*claim())
    assert client.get(f"/v1/runs/{run['id']}").json()["status"] == "succeeded"
    assert [item["id"] for item in client.get("/v1/chats?standalone=true").json()] == [standalone["id"]]
    assert standalone["id"] not in {item["id"] for item in client.get(f"/v1/chats?project_id={project['id']}").json()}
    app.dependency_overrides[owner_id] = lambda: "other-owner"
    assert client.get(f"/v1/chats/{standalone['id']}").status_code == 404
    assert client.get(f"/v1/runs/{run['id']}").status_code == 404


def test_standalone_attach_and_detach_are_explicit_and_owner_checked(client, workspace):
    item = chat(client)
    assert client.post("/v1/chats", json={"context_mode": "project"}).status_code == 422
    linked = client.patch(f"/v1/chats/{item['id']}", json={"project_id": workspace[0]["id"]}).json()
    assert linked["project_id"] == workspace[0]["id"] and linked["context_mode"] == "project"
    detached = client.patch(f"/v1/chats/{item['id']}", json={"project_id": None}).json()
    assert detached["project_id"] is None and detached["context_mode"] == "chat"
    assert client.patch(f"/v1/chats/{item['id']}", json={"project_id": "someone-elses-project"}).status_code == 404


def test_account_defaults_pricing_entitlements_and_priority_rules(client):
    default = client.get("/v1/account/preferences").json()
    assert default["storage_mode"] == "unselected" and default["app_language"] == "en"
    assert default["plan"] == "free" and default["storage_quota_bytes"] == 500 * 1024 * 1024
    assert default["checkout_available"] is False
    assert client.patch("/v1/account/preferences", json={"plan": "paid", "storage_quota_bytes": 9999999999}).status_code == 422
    assert client.patch("/v1/account/preferences", json={"app_language": "unknown"}).status_code == 422
    assert client.patch("/v1/account/preferences", json={"component_priorities": {"design": 3}}).status_code == 422
    assert client.patch("/v1/account/preferences", json={"component_priorities": {"language": 1}}).status_code == 422
    result = client.patch("/v1/account/preferences", json={"app_language": "es", "component_priorities": {"language": 3}}).json()
    assert result["app_language"] == "es" and result["component_priorities"]["language"] == 3
    assert [component["id"] for component in client.get("/v1/builder/catalog").json()["components"][:3]] == ["design", "tasks", "language"]
    app.dependency_overrides[owner_id] = lambda: "owner-two"
    assert client.get("/v1/account/preferences").json()["app_language"] == "en"


def test_no_project_builder_preview_preserves_ordinary_chats_and_native_preference(client):
    client.patch("/v1/account/preferences", json={"app_language": "fr"})
    ordinary = client.post("/v1/builder/preview", json={"prompt": "How does gravity work?"}).json()
    assert ordinary["eligible"] is False
    learning = client.post("/v1/builder/preview", json={"prompt": "I want to learn Spanish"}).json()
    assert learning["eligible"] and learning["kind"] == "language" and learning["answers"]["native_language"] == "fr"
    assert client.get("/v1/projects").json() == []
    assert client.get("/v1/chats").json() == []


def test_web_permission_defaults_on_is_inferred_and_explicit_off_is_respected(client):
    item = chat(client)
    ordinary = queue(client, item).json()
    assert ordinary["settings"]["web_search_allowed"] is True and ordinary["settings"]["web_search"] is False
    research = queue(client, item, "Research the latest ceramic materials", "lookup-allowed-001").json()
    assert research["settings"]["web_search"] is True
    off = queue(client, item, "Research the latest ceramic materials", "lookup-denied-001", web_search=False).json()
    assert off["settings"]["web_search_allowed"] is False and off["settings"]["web_search"] is False
    allowed_intent = client.post("/v1/intent", json={"prompt": "Research ceramic materials"}).json()
    denied_intent = client.post("/v1/intent", json={"prompt": "Research ceramic materials", "allow_web_search": False}).json()
    assert allowed_intent["id"] != denied_intent["id"]
    assert allowed_intent["web_search"] is True and denied_intent["web_search"] is False


def test_general_intelligence_uses_shared_intake_and_retains_tier_on_retry(client, monkeypatch):
    monkeypatch.setattr(settings(), "enable_test_provider", False)
    monkeypatch.setattr(settings(), "openai_api_key", SecretStr("test-placeholder-not-a-real-key"))
    item = chat(client)
    result = queue(client, item, intelligence="smarter")
    assert result.status_code == 201, result.text
    run = result.json()
    assert run["provider"] == "openai" and run["settings"]["intelligence_policy"]["qualification"] == "candidate"
    with SessionLocal() as db:
        saved = db.get(Run, run["id"])
        saved.settings = {**saved.settings, "experience_stage": "classify"}
        request = request_body(saved)
    assert request["text"]["format"]["type"] == "json_schema" and request["store"] is False
    assert run["workflow_id"] == "project.experience.v2"
    client.post(f"/v1/runs/{run['id']}/cancel")
    retry = client.post(f"/v1/runs/{run['id']}/retry", json={"idempotency_key": "retain-smarter-on-retry"}).json()
    assert retry["settings"]["intelligence"] == "smarter" and retry["provider"] == "openai"
    assert retry["settings"]["web_search_allowed"] is True


def test_hosted_intent_availability_never_downgrades_or_exposes_keys(client, monkeypatch):
    monkeypatch.setattr(settings(), "enable_test_provider", False)
    monkeypatch.setattr(settings(), "openai_api_key", SecretStr(""))
    response = client.post("/v1/intent", json={"prompt": "Hello", "intelligence": "super"}).json()
    assert response["available"] is False
    item = chat(client)
    assert queue(client, item, intelligence="super").status_code == 503
    assert "openai_api_key" not in client.get("/v1/intelligence").text


def test_reference_upload_needs_no_storage_choice_and_still_enforces_quota(client, monkeypatch):
    monkeypatch.setattr(settings(), "free_storage_quota_bytes", 8)
    first = upload(client, b"12345").json()
    assert first["storage_mode"] == "cloud" and first["project_id"] is None
    assert upload(client, b"6789").status_code == 413
    assert client.get(first["url"]).content == b"12345"
    assert client.get("/v1/account/preferences").json()["storage_used_bytes"] == 5
    assert client.get("/v1/account/preferences").json()["storage_mode"] == "unselected"
    client.patch("/v1/account/preferences", json={"storage_mode": "local"})
    assert client.get(first["url"]).content == b"12345"


def test_local_receipt_preserves_staging_until_expiry_and_never_expires_legacy(client):
    client.patch("/v1/account/preferences", json={"storage_mode": "local"})
    item = upload(client).json()
    assert item["storage_mode"] == "local" and item["expires_at"] and item["available"]
    assert client.post(f"/v1/artifacts/{item['id']}/local-save", json={"sha256": "a" * 64, "size_bytes": item["size_bytes"]}).status_code == 422
    receipt = client.post(f"/v1/artifacts/{item['id']}/local-save", json={"sha256": item["sha256"], "size_bytes": item["size_bytes"]})
    assert receipt.status_code == 200 and receipt.json()["local_saved_at"]
    assert client.get(item["url"]).status_code == 200
    with SessionLocal() as db:
        artifact = db.get(Artifact, item["id"])
        key = artifact.storage_key
        artifact.details = {**artifact.details, "expires_at": (now() - timedelta(seconds=1)).isoformat()}
        legacy = Artifact(owner_id="test-owner-a", project_id=None, name="legacy", kind="document", mime_type="text/plain", size_bytes=4, sha256="b" * 64, storage_key="test-owner-a/legacy.txt", details={"expires_at": (now() - timedelta(days=1)).isoformat()})
        db.add(legacy)
        Storage().put(legacy.storage_key, b"keep", "text/plain")
        db.commit()
        from powwow.account_preferences import expire_local_staging
        assert expire_local_staging(db) == 1
        assert Storage().read(legacy.storage_key) == b"keep"
        assert db.get(Artifact, item["id"]) is not None
        assert not Storage().local_path(key).exists()
    assert client.get(item["url"]).status_code == 410
    assert client.get(f"/v1/artifacts/{item['id']}").json()["available"] is False
    assert client.get("/v1/account/preferences").json()["storage_staged_bytes"] == 0


def test_media_reserves_capacity_and_default_web_permission_does_not_block_it(client, monkeypatch):
    client.patch("/v1/account/preferences", json={"storage_mode": "cloud"})
    monkeypatch.setattr(settings(), "max_generated_artifact_bytes", 1000)
    monkeypatch.setattr(settings(), "free_storage_quota_bytes", 1500)
    item = chat(client)
    run = queue(client, item, "Draw a red apple", "media-first-image", capability="text_to_image").json()
    assert run["capability"] == "text_to_image" and run["settings"]["web_search"] is False
    assert run["settings"]["storage_reservation_bytes"] == 1000
    assert queue(client, item, "Draw a blue apple", "media-next-image", capability="text_to_image").status_code == 413
    assert upload(client, b"x" * 576).status_code == 413  # Beyond the bounded 5% grace.
    execute(*claim())
    complete = client.get(f"/v1/runs/{run['id']}").json()
    assert complete["status"] == "succeeded", complete
    usage = client.get("/v1/account/preferences").json()
    assert 0 < usage["storage_used_bytes"] < 1000 and usage["storage_reserved_bytes"] == 0
    assert queue(client, item, "Draw a green apple", "media-after-complete", capability="text_to_image").status_code == 201


def test_old_sqlite_migration_preserves_data_relationships_indexes_and_backup(tmp_path):
    path = tmp_path / "existing.db"
    engine = create_engine("sqlite:///" + str(path))
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE projects (id VARCHAR(36) PRIMARY KEY)"))
        connection.execute(text("CREATE TABLE chats (id VARCHAR(36) PRIMARY KEY, project_id VARCHAR(36) NOT NULL REFERENCES projects(id))"))
        connection.execute(text("CREATE TABLE artifacts (id VARCHAR(36) PRIMARY KEY, project_id VARCHAR(36) NOT NULL REFERENCES projects(id), chat_id VARCHAR(36) REFERENCES chats(id))"))
        connection.execute(text("CREATE TABLE runs (id VARCHAR(36) PRIMARY KEY, project_id VARCHAR(36) NOT NULL REFERENCES projects(id), chat_id VARCHAR(36) REFERENCES chats(id))"))
        connection.execute(text("CREATE INDEX ix_chats_project_id ON chats (project_id)"))
        connection.execute(text("INSERT INTO projects VALUES ('project')"))
        connection.execute(text("INSERT INTO chats VALUES ('chat', 'project')"))
        connection.execute(text("INSERT INTO artifacts VALUES ('artifact', 'project', 'chat')"))
        connection.execute(text("INSERT INTO runs VALUES ('run', 'project', 'chat')"))
    sqlite_nullable_projects(engine)
    sqlite_nullable_projects(engine)  # Replaying startup is a no-op.
    with engine.begin() as connection:
        assert connection.execute(text("SELECT * FROM artifacts")).all() == [("artifact", "project", "chat")]
        assert connection.execute(text("SELECT * FROM runs")).all() == [("run", "project", "chat")]
        connection.execute(text("INSERT INTO chats VALUES ('standalone', NULL)"))
        assert connection.execute(text("PRAGMA foreign_key_check")).all() == []
    assert all(column["nullable"] for table in ["chats", "artifacts", "runs"] for column in inspect(engine).get_columns(table) if column["name"] == "project_id")
    assert "ix_chats_project_id" in {index["name"] for index in inspect(engine).get_indexes("chats")}
    assert path.with_suffix(".db.before-standalone").exists()
    engine.dispose()
def test_experience_tours_are_per_owner_per_kind_and_idempotent(client):
    assert client.get("/v1/account/experience-tours").json() == []
    for _ in range(2):
        assert client.put("/v1/account/experience-tours/book").status_code == 200
    assert client.get("/v1/account/experience-tours").json() == ["book"]
    assert client.put("/v1/account/experience-tours/invalid").status_code == 422
    app.dependency_overrides[owner_id] = lambda: "other-owner"
    try:
        assert client.get("/v1/account/experience-tours").json() == []
    finally:
        app.dependency_overrides.pop(owner_id, None)
