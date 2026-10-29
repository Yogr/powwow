from datetime import timedelta

from powwow.auth import owner_id
from powwow.collaboration import FREE_LIMITS
from powwow.db import SessionLocal, now
from powwow.main import app
from powwow.models import OrganizationInvite


def identity(user):
    app.dependency_overrides[owner_id] = lambda: user


def organization(client):
    response = client.post("/v1/organizations", json={"name": "Workshop", "display_name": "Alex"})
    assert response.status_code == 201, response.text
    org = response.json()
    project = client.post("/v1/projects", json={"name": "Shared build", "organization_id": org["id"]})
    assert project.status_code == 201, project.text
    return org, project.json()


def join(client, org, user="member-b", role="member"):
    identity("test-owner-a")
    invitation = client.post(f"/v1/organizations/{org['id']}/invites", json={"role": role})
    assert invitation.status_code == 201, invitation.text
    identity(user)
    accepted = client.post("/v1/invites/accept", json={"token": invitation.json()["invite_code"], "display_name": "Blair"})
    assert accepted.status_code == 200, accepted.text
    return invitation.json()


def test_shared_project_private_component_and_task_chats(client):
    org, project = organization(client)
    a_chat = client.put(f"/v1/projects/{project['id']}/components/tasks/chat").json()
    client.post(f"/v1/chats/{a_chat['id']}/messages", json={"content": "Owner private notes"})
    task = client.post(f"/v1/projects/{project['id']}/tasks", json={"title": "Review navigation", "description": "Check keyboard and mobile layouts", "assignee_id": "test-owner-a"}).json()
    a_task_chat = client.put(f"/v1/tasks/{task['id']}/chat").json()
    join(client, org)
    assert client.get(f"/v1/projects/{project['id']}").status_code == 200
    assert client.get(f"/v1/projects/{project['id']}/workspace").status_code == 200
    assert client.get(f"/v1/chats/{a_chat['id']}/messages").status_code == 404
    assert client.get(f"/v1/chats/{a_task_chat['id']}").status_code == 404
    b_chat = client.put(f"/v1/projects/{project['id']}/components/tasks/chat")
    assert b_chat.status_code == 200, b_chat.text
    assert b_chat.json()["id"] != a_chat["id"]
    b_task_chat = client.put(f"/v1/tasks/{task['id']}/chat").json()
    assert b_task_chat["id"] != a_task_chat["id"]
    assert client.put(f"/v1/tasks/{task['id']}/chat").json()["id"] == b_task_chat["id"]
    assert client.patch(f"/v1/tasks/{task['id']}", json={"assignee_id": "member-b", "status": "in_progress"}).status_code == 200
    assert len(client.get("/v1/tasks?assigned_to_me=true").json()) == 1
    assert client.patch(f"/v1/tasks/{task['id']}", json={"assignee_id": "outsider"}).status_code == 422
    assert client.patch(f"/v1/chats/{b_task_chat['id']}", json={"project_id": None}).status_code == 409
    from powwow.context import resolve_context
    from powwow.models import Chat
    with SessionLocal() as db:
        snapshot = resolve_context(db, "member-b", db.get(Chat, b_task_chat["id"]), [])
    assert any(item["source_type"] == "task" and "Check keyboard" in item["content"] for item in snapshot)
    assert not any("Owner private" in item.get("content", "") for item in snapshot)


def test_viewer_and_outsider_cannot_mutate_or_infer(client):
    org, project = organization(client)
    join(client, org, role="viewer")
    assert client.get(f"/v1/projects/{project['id']}/workspace").status_code == 200
    state = client.get(f"/v1/projects/{project['id']}/workspace").json()
    assert client.put(f"/v1/projects/{project['id']}/workspace", json=state).status_code == 403
    assert client.post(f"/v1/projects/{project['id']}/tasks", json={"title": "Cannot write"}).status_code == 403
    assert client.post("/v1/chats", json={"project_id": project["id"]}).status_code == 403
    assert client.post("/v1/intent", json={"project_id": project["id"], "prompt": "Run something"}).status_code == 403
    assert client.post(f"/v1/organizations/{org['id']}/invites", json={}).status_code == 403
    assert client.get(f"/v1/organizations/{org['id']}/usage").status_code == 403
    identity("outsider")
    assert client.get(f"/v1/projects/{project['id']}").status_code == 404
    assert client.get("/v1/projects").json() == []
    assert client.get(f"/v1/projects/{project['id']}/tasks").status_code == 404
    assert client.get(f"/v1/organizations/{org['id']}/members").status_code == 404


def test_revocation_removes_old_project_chat_access(client):
    org, project = organization(client)
    join(client, org)
    chat = client.post("/v1/chats", json={"project_id": project["id"]}).json()
    identity("test-owner-a")
    assert client.delete(f"/v1/organizations/{org['id']}/members/member-b").status_code == 204
    identity("member-b")
    assert client.get(f"/v1/chats/{chat['id']}").status_code == 404
    assert client.get("/v1/chats").json() == []
    assert client.get("/v1/tasks").json() == []


def test_invites_are_hashed_expiring_revocable_and_email_bound(client):
    org, _ = organization(client)
    invitation = client.post(f"/v1/organizations/{org['id']}/invites", json={}).json()
    listing = client.get(f"/v1/organizations/{org['id']}/invites").json()
    assert "token" not in listing[0] and "token_hash" not in listing[0]
    with SessionLocal() as db:
        row = db.get(OrganizationInvite, invitation["id"])
        assert row.token_hash != invitation["token"]
        row.expires_at = now() - timedelta(hours=1)
        db.commit()
    identity("member-b")
    assert client.post("/v1/invites/accept", json={"token": invitation["token"]}).status_code == 410
    identity("test-owner-a")
    targeted = client.post(f"/v1/organizations/{org['id']}/invites", json={"email": "invited@example.com"}).json()
    identity("member-b")
    assert client.post("/v1/invites/accept", json={"token": targeted["token"]}).status_code == 403
    identity("test-owner-a")
    assert client.delete(f"/v1/organizations/{org['id']}/invites/{targeted['id']}").status_code == 204
    identity("member-b")
    assert client.post("/v1/invites/accept", json={"token": targeted["token"]}).status_code == 410


def test_single_use_invite_replay_and_member_limits(client):
    org, _ = organization(client)
    invitation = join(client, org)
    assert client.post("/v1/invites/accept", json={"token": invitation["token"]}).status_code == 200
    identity("member-c")
    assert client.post("/v1/invites/accept", json={"token": invitation["token"]}).status_code == 410
    for index in range(3):
        join(client, org, f"other-{index}")
    identity("test-owner-a")
    extra = client.post(f"/v1/organizations/{org['id']}/invites", json={}).json()
    identity("too-many")
    assert client.post("/v1/invites/accept", json={"token": extra["token"]}).status_code == 403


def test_last_owner_and_privilege_escalation(client):
    org, _ = organization(client)
    assert client.patch(f"/v1/organizations/{org['id']}/members/test-owner-a", json={"role": "member"}).status_code == 409
    assert client.delete(f"/v1/organizations/{org['id']}/members/test-owner-a").status_code == 409
    join(client, org)
    assert client.patch(f"/v1/organizations/{org['id']}/members/member-b", json={"role": "owner"}).status_code == 403
    identity("test-owner-a")
    assert client.patch(f"/v1/organizations/{org['id']}/members/member-b", json={"role": "admin"}).status_code == 200
    identity("member-b")
    assert client.patch(f"/v1/organizations/{org['id']}/members/test-owner-a", json={"role": "viewer"}).status_code == 403
    assert client.post(f"/v1/organizations/{org['id']}/invites", json={"role": "admin"}).status_code == 403


def test_agent_governance_and_model_admission(client):
    org, project = organization(client)
    policy = {"allowed_models": [], "allowed_mcps": [], "allow_member_agents": False}
    assert client.put(f"/v1/organizations/{org['id']}/policy", json=policy).status_code == 200
    assert client.post(f"/v1/organizations/{org['id']}/agents", json={"name": "Reviewer", "model_id": "unapproved"}).status_code == 403
    assert client.post(f"/v1/organizations/{org['id']}/agents", json={"name": "Reviewer", "mcp_ids": ["unknown-server"]}).status_code == 403
    agent = client.post(f"/v1/organizations/{org['id']}/agents", json={"name": "Reviewer", "instructions": "Review changes"})
    assert agent.status_code == 201 and agent.json()["execution_available"] is False
    assert client.post("/v1/intent", json={"project_id": project["id"], "prompt": "Help"}).status_code == 403
    join(client, org)
    assert len(client.get(f"/v1/organizations/{org['id']}/agents").json()) == 1
    assert client.post(f"/v1/organizations/{org['id']}/agents", json={"name": "Denied"}).status_code == 403
    assert client.put(f"/v1/organizations/{org['id']}/policy", json={}).status_code == 403


def test_shared_uploads_private_attachments_and_storage_limit(client, monkeypatch):
    org, project = organization(client)
    shared = client.post("/v1/uploads", data={"project_id": project["id"]}, files={"file": ("notes.txt", b"Shared notes", "text/plain")})
    assert shared.status_code == 201, shared.text
    chat = client.post("/v1/chats", json={"project_id": project["id"]}).json()
    private = client.post("/v1/uploads", data={"project_id": project["id"], "chat_id": chat["id"]}, files={"file": ("private.txt", b"Private notes", "text/plain")}).json()
    join(client, org)
    assert client.get(shared.json()["url"]).content == b"Shared notes"
    assert client.get(private["url"]).status_code == 404
    assets = client.get(f"/v1/artifacts?project_id={project['id']}").json()
    assert [item["id"] for item in assets] == [shared.json()["id"]]
    assert client.delete(f"/v1/artifacts/{shared.json()['id']}").status_code == 404
    monkeypatch.setitem(FREE_LIMITS, "storage_bytes", 30)
    denied = client.post("/v1/uploads", data={"project_id": project["id"]}, files={"file": ("large.txt", b"x" * 20, "text/plain")})
    assert denied.status_code == 413 and denied.json()["detail"]["code"] == "organization_storage_quota"


def test_project_and_agent_quota_cannot_be_changed_by_client(client):
    org, _ = organization(client)
    for index in range(2):
        assert client.post("/v1/projects", json={"name": str(index), "organization_id": org["id"]}).status_code == 201
    assert client.post("/v1/projects", json={"name": "Over quota", "organization_id": org["id"]}).status_code == 403
    for index in range(3):
        assert client.post(f"/v1/organizations/{org['id']}/agents", json={"name": str(index)}).status_code == 201
    assert client.post(f"/v1/organizations/{org['id']}/agents", json={"name": "Over quota"}).status_code == 403
    assert client.post("/v1/organizations", json={"name": "Upgrade", "plan": "enterprise"}).status_code == 422
    usage = client.get(f"/v1/organizations/{org['id']}/usage").json()
    assert usage["members"] == 1 and usage["projects"] == 3 and usage["agents"] == 3
    assert usage["checkout_available"] is False


def test_queued_model_policy_blocks_fixture_execution_without_resubmitting(client):
    from powwow.models import Run
    from powwow.worker import claim, execute
    org, project = organization(client)
    chat = client.post("/v1/chats", json={"project_id": project["id"]}).json()
    message = client.post(f"/v1/chats/{chat['id']}/messages", json={"content": "Discuss this task"}).json()
    body = {"chat_id": chat["id"], "message_id": message["id"], "capability": "chat", "idempotency_key": "organization-policy-queued"}
    run = client.post("/v1/runs", json=body)
    assert run.status_code == 201, run.text
    client.put(f"/v1/organizations/{org['id']}/policy", json={"allowed_models": []})
    # A replay returns the original queued request even after policy changes.
    assert client.post("/v1/runs", json=body).json()["id"] == run.json()["id"]
    execute(*claim())
    with SessionLocal() as db:
        saved = db.get(Run, run.json()["id"])
        assert saved.status == "failed" and saved.error["code"] == "model_not_allowed"
        assert saved.submission_started is False and saved.actual_cost_usd == 0


def test_queued_work_is_stopped_after_membership_revocation(client):
    from powwow.models import Run
    from powwow.worker import claim, execute
    org, project = organization(client)
    join(client, org)
    chat = client.post("/v1/chats", json={"project_id": project["id"]}).json()
    message = client.post(f"/v1/chats/{chat['id']}/messages", json={"content": "Discuss this task"}).json()
    run = client.post("/v1/runs", json={"chat_id": chat["id"], "message_id": message["id"], "capability": "chat", "idempotency_key": "revoked-queued"}).json()
    identity("test-owner-a")
    client.delete(f"/v1/organizations/{org['id']}/members/member-b")
    identity("member-b")
    assert client.post(f"/v1/runs/{run['id']}/cancel").status_code == 404
    execute(*claim())
    with SessionLocal() as db:
        saved = db.get(Run, run["id"])
        assert saved.status == "failed" and saved.error["code"] == "not_found"
        assert saved.submission_started is False


def test_old_component_unique_constraint_migration_preserves_messages(tmp_path):
    from sqlalchemy import create_engine, text
    from powwow.migrations import component_chat_sessions, sqlite_private_component_sessions
    path = tmp_path / "old-chat.db"
    engine = create_engine("sqlite:///" + str(path).replace("\\", "/"))
    with engine.begin() as db:
        db.execute(text("CREATE TABLE chats (id TEXT PRIMARY KEY, project_id TEXT, component_id TEXT, owner_id TEXT, CONSTRAINT uq_project_component_chat UNIQUE (project_id, component_id))"))
        db.execute(text("CREATE TABLE messages (id TEXT PRIMARY KEY, chat_id TEXT REFERENCES chats(id), content TEXT)"))
        db.execute(text("INSERT INTO chats VALUES ('a', 'project', 'tasks', 'alice')"))
        db.execute(text("INSERT INTO messages VALUES ('m', 'a', 'Private old message')"))
    sqlite_private_component_sessions(engine)
    sqlite_private_component_sessions(engine)
    with engine.begin() as db:
        component_chat_sessions(db)
        db.execute(text("INSERT INTO chats VALUES ('b', 'project', 'tasks', 'bob')"))
        assert db.execute(text("SELECT content FROM messages WHERE chat_id = 'a'")).scalar_one() == "Private old message"
        assert db.execute(text("PRAGMA foreign_key_check")).fetchall() == []
        assert db.execute(text("SELECT COUNT(*) FROM chats")).scalar_one() == 2
    assert path.with_suffix(".db.before-private-components").exists()
