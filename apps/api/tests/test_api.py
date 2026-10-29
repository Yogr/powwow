import io
from datetime import timedelta

from PIL import Image
from sqlalchemy import select

from powwow.auth import owner_id
from powwow.db import SessionLocal, now
from powwow.main import app
from powwow.models import Account, Run, RunEvent, UsageEntry
from powwow.worker import claim, execute


def message(client, chat, text="Help me draft a creative brief"):
    response = client.post(f"/v1/chats/{chat['id']}/messages", json={"content": text})
    assert response.status_code == 201, response.text
    return response.json()


def run_body(chat, msg, key="request-0001", **extra):
    return {"chat_id": chat["id"], "message_id": msg["id"], "capability": "chat", "idempotency_key": key, "budget_usd": 1, **extra}


def test_create_persist_execute_and_replay(client, workspace):
    _, chat = workspace
    msg = message(client, chat)
    body = run_body(chat, msg)
    first = client.post("/v1/runs", json=body)
    assert first.status_code == 201, first.text
    duplicate = client.post("/v1/runs", json=body)
    assert duplicate.json()["id"] == first.json()["id"]
    execute(*claim())
    run = client.get("/v1/runs/" + first.json()["id"]).json()
    assert run["status"] == "succeeded"
    assert run["provider"] == "test"
    assert run["output_text"]
    assert len(client.get(f"/v1/chats/{chat['id']}/messages").json()) == 2
    events = client.get(f"/v1/runs/{run['id']}/events").json()
    assert [e["sequence"] for e in events] == list(range(1, len(events) + 1))
    tail = client.get(f"/v1/runs/{run['id']}/events?after=2").json()
    assert all(e["sequence"] > 2 for e in tail)
    assert len(client.get("/v1/usage").json()["entries"]) == 1
    assert claim() is None


def test_project_tools_populate_only_after_completed_chat(client, workspace):
    project, chat = workspace
    url = f"/v1/projects/{project['id']}/workspace"
    assert client.get(url).json()["workspace"]["components"] == []
    msg = message(client, chat, "Build a game about a fox collecting stars")
    body = run_body(chat, msg)
    run = client.post("/v1/runs", json=body).json()
    assert client.get(url).json()["workspace"]["components"] == []
    execute(*claim())
    result = client.get(f"/v1/runs/{run['id']}").json()
    assert result["status"] == "succeeded"
    saved = client.get(url).json()
    assert saved["workspace"]["initialized"]
    assert {"design", "tasks"} <= set(saved["workspace"]["components"])
    assert saved["workspace"]["tasks"]
    assert "Welcome to your game workspace" in result["output_text"]
    assert "structured project templates" in saved["workspace"]["design"]
    assert len(client.get("/v1/usage").json()["entries"]) == 1
    assert client.post("/v1/runs", json=body).json()["id"] == run["id"]
    assert client.get(url).json() == saved
    saved["workspace"]["components"] = []
    saved["workspace"]["design"] = "My edited blueprint"
    edited = client.put(url, json=saved).json()
    next_msg = message(client, chat, "Build a website for this game")
    client.post("/v1/runs", json=run_body(chat, next_msg, key="next-request-002"))
    execute(*claim())
    assert client.get(url).json() == edited


def test_workspace_failure_does_not_fail_or_repeat_paid_result(client, workspace, monkeypatch):
    from powwow import project_experience
    def conflict(*args):
        raise RuntimeError("workspace conflict")
    monkeypatch.setattr(project_experience, "apply_reply", conflict)
    _, chat = workspace
    msg = message(client, chat, "Help me with this character")
    run = client.post("/v1/runs", json=run_body(chat, msg)).json()
    execute(*claim())
    assert client.get(f"/v1/runs/{run['id']}").json()["status"] == "succeeded"
    assert client.get(f"/v1/runs/{run['id']}").json()["model_provenance"]["project_update"]["status"] == "needs_review"
    assert len(client.get(f"/v1/chats/{chat['id']}/messages").json()) == 2
    assert len(client.get("/v1/usage").json()["entries"]) == 1
    assert claim() is None


def test_idempotency_conflict_and_cancel_queued(client, workspace):
    _, chat = workspace
    msg = message(client, chat)
    body = run_body(chat, msg)
    run = client.post("/v1/runs", json=body).json()
    assert client.post("/v1/runs", json={**body, "budget_usd": 2}).status_code == 409
    cancelled = client.post(f"/v1/runs/{run['id']}/cancel").json()
    assert cancelled["status"] == "cancelled"
    assert claim() is None
    assert client.post(f"/v1/runs/{run['id']}/cancel").json()["status"] == "cancelled"
    assert len(client.get("/v1/usage").json()["entries"]) == 1
    retry = client.post(f"/v1/runs/{run['id']}/retry", json={"idempotency_key": "retry-000001"})
    assert retry.status_code == 201, retry.text
    assert retry.json()["parent_run_id"] == run["id"]
    assert retry.json()["attempt"] == 2


def test_cross_account_access_blocked_everywhere(client, workspace):
    project, chat = workspace
    msg = message(client, chat, "private secret")
    run = client.post("/v1/runs", json=run_body(chat, msg)).json()
    app.dependency_overrides[owner_id] = lambda: "test-owner-b"
    for path in [f"/v1/projects/{project['id']}", f"/v1/chats/{chat['id']}", f"/v1/chats/{chat['id']}/messages", f"/v1/runs/{run['id']}", f"/v1/runs/{run['id']}/events"]:
        assert client.get(path).status_code == 404
    assert client.get("/v1/projects").json() == []
    assert client.post("/v1/runs", json=run_body(chat, msg)).status_code == 404
    second = client.post("/v1/projects", json={"name": "B"}).json()
    assert client.post("/v1/context-grants", json={"destination_project_id": second["id"], "source_type": "project", "source_id": project["id"], "mode": "live"}).status_code == 404


def test_grants_snapshot_revocation_and_single_hop(client, workspace):
    source, source_chat = workspace
    first = message(client, source_chat, "Original source content")
    middle = client.post("/v1/projects", json={"name": "Middle"}).json()
    destination = client.post("/v1/projects", json={"name": "Destination"}).json()
    destination_chat = client.post("/v1/chats", json={"project_id": destination["id"]}).json()
    grant = client.post("/v1/context-grants", json={"destination_project_id": destination["id"], "source_type": "chat", "source_id": source_chat["id"], "mode": "snapshot"}).json()
    later = message(client, source_chat, "Later content must not enter snapshot")
    prompt = message(client, destination_chat)
    run = client.post("/v1/runs", json=run_body(destination_chat, prompt)).json()
    ids = [s["source_id"] for s in run["context_snapshot"]]
    assert first["id"] in ids and later["id"] not in ids
    client.delete("/v1/context-grants/" + grant["id"])
    after = client.post("/v1/runs", json=run_body(destination_chat, prompt, "request-after-revoke")).json()
    assert first["id"] not in [s["source_id"] for s in after["context_snapshot"]]
    # source -> middle -> destination must not recursively expose source.
    for src, dest in [(source, middle), (middle, destination)]:
        assert client.post("/v1/context-grants", json={"destination_project_id": dest["id"], "source_type": "project", "source_id": src["id"], "mode": "live"}).status_code == 201
    indirect = client.post("/v1/runs", json=run_body(destination_chat, prompt, "request-single-hop")).json()
    assert first["id"] not in [s["source_id"] for s in indirect["context_snapshot"]]
    # The prior run retains its immutable provenance after revocation.
    assert first["id"] in [s["source_id"] for s in client.get("/v1/runs/" + run["id"]).json()["context_snapshot"]]


def test_project_isolation_and_chat_move(client, workspace):
    source, chat = workspace
    other_chat = client.post("/v1/chats", json={"project_id": source["id"]}).json()
    sibling = message(client, other_chat, "Project context")
    prompt = message(client, chat)
    initial = client.post("/v1/runs", json=run_body(chat, prompt)).json()
    assert sibling["id"] in [s["source_id"] for s in initial["context_snapshot"]]
    new_project = client.post("/v1/projects", json={"name": "New"}).json()
    assert client.patch("/v1/chats/" + chat["id"], json={"project_id": new_project["id"]}).status_code == 200
    moved = client.post("/v1/runs", json=run_body(chat, prompt, "request-moved")).json()
    assert sibling["id"] not in [s["source_id"] for s in moved["context_snapshot"]]
    client.patch("/v1/projects/" + new_project["id"], json={"archived": True})
    assert client.post("/v1/runs", json=run_body(chat, prompt, "archived-request")).status_code == 409
    client.patch("/v1/projects/" + new_project["id"], json={"archived": False})
    assert client.post("/v1/runs", json=run_body(chat, prompt, "restored-request")).status_code == 201


def test_upload_validation_ownership_and_generated_artifacts(client, workspace):
    project, chat = workspace
    bad = client.post("/v1/uploads", data={"project_id": project["id"]}, files={"file": ("attack.png", b"<html>invalid</html>", "image/png")})
    assert bad.status_code == 422
    svg = client.post("/v1/uploads", data={"project_id": project["id"]}, files={"file": ("attack.svg", b"<svg/>", "image/svg+xml")})
    assert svg.status_code == 422
    buffer = io.BytesIO()
    Image.new("RGB", (64, 64), "red").save(buffer, "PNG")
    upload = client.post("/v1/uploads", data={"project_id": project["id"], "chat_id": chat["id"]}, files={"file": ("source.png", buffer.getvalue(), "image/png")})
    assert upload.status_code == 201, upload.text
    artifact = upload.json()
    assert client.get(artifact["url"]).content == buffer.getvalue()
    msg = message(client, chat, "Create an image of a blue vase")
    run = client.post("/v1/runs", json=run_body(chat, msg, capability="text_to_image")).json()
    assert run["capability"] == "text_to_image"
    execute(*claim())
    run = client.get("/v1/runs/" + run["id"]).json()
    assert run["status"] == "succeeded", run
    result = client.get("/v1/artifacts/" + run["artifact_ids"][0]).json()
    assert result["metadata"]["simulated"] is True
    app.dependency_overrides[owner_id] = lambda: "other"
    assert client.get(artifact["url"]).status_code == 404
    assert client.get(artifact["download_url"]).status_code == 404


def test_missing_image_and_unknown_settings(client, workspace):
    _, chat = workspace
    msg = message(client, chat, "Make a 3D model")
    assert client.post("/v1/runs", json=run_body(chat, msg, capability="image_to_3d")).status_code == 422
    assert client.post("/v1/runs", json=run_body(chat, msg, settings={"url": "http://internal"})).status_code == 422


def test_stale_lease_fencing_and_recovery(client, workspace):
    _, chat = workspace
    msg = message(client, chat)
    run = client.post("/v1/runs", json=run_body(chat, msg)).json()
    first_claim = claim()
    assert first_claim and claim() is None
    with SessionLocal() as db:
        current = db.get(Run, run["id"])
        current.lease_expires_at = now() - timedelta(seconds=1)
        db.commit()
    second_claim = claim()
    assert second_claim[1] > first_claim[1]
    execute(*first_claim)
    assert client.get("/v1/runs/" + run["id"]).json()["status"] == "preparing"
    execute(*second_claim)
    assert client.get("/v1/runs/" + run["id"]).json()["status"] == "succeeded"
    with SessionLocal() as db:
        assert len(list(db.scalars(select(UsageEntry)))) == 1


def test_active_cancel_and_submission_uncertainty(client, workspace):
    _, chat = workspace
    msg = message(client, chat)
    run = client.post("/v1/runs", json=run_body(chat, msg)).json()
    leased = claim()
    assert client.post(f"/v1/runs/{run['id']}/cancel").json()["status"] == "cancel_requested"
    execute(*leased)
    assert client.get("/v1/runs/" + run["id"]).json()["status"] == "cancelled"
    uncertain = client.post("/v1/runs", json=run_body(chat, msg, "uncertain-request")).json()
    claim()
    with SessionLocal() as db:
        current = db.get(Run, uncertain["id"])
        current.provider = "runpod"
        current.submission_started = True
        current.lease_expires_at = now() - timedelta(seconds=1)
        db.commit()
    assert claim() is None
    current = client.get("/v1/runs/" + uncertain["id"]).json()
    assert current["error"]["code"] == "submission_uncertain"
    assert client.post(f"/v1/runs/{uncertain['id']}/retry", json={"idempotency_key": "uncertain-retry"}).status_code == 409


def test_worker_capability_filter_keeps_chat_separate(client, workspace, monkeypatch):
    from powwow.config import settings
    _, chat = workspace
    msg = message(client, chat)
    client.post("/v1/runs", json=run_body(chat, msg))
    monkeypatch.setattr(settings(), "worker_capabilities", "text_to_image,image_to_video,image_to_3d")
    assert claim() is None
    monkeypatch.setattr(settings(), "worker_capabilities", "chat")
    assert claim() is not None


def test_recovered_remote_cancellation_reaches_provider(client, workspace, monkeypatch):
    from powwow.providers import Cancelled
    _, chat = workspace
    msg = message(client, chat)
    run = client.post("/v1/runs", json=run_body(chat, msg)).json()
    leased = claim()
    with SessionLocal() as db:
        current = db.get(Run, run["id"])
        current.provider = "runpod"
        current.external_request_id = "already-running"
        current.submission_started = True
        db.commit()
    client.post(f"/v1/runs/{run['id']}/cancel")
    reached = []
    def cancel_provider(current, *args):
        reached.append(current.external_request_id)
        raise Cancelled()
    monkeypatch.setattr("powwow.worker.runpod", cancel_provider)
    execute(*leased)
    assert reached == ["already-running"]
    assert client.get("/v1/runs/" + run["id"]).json()["status"] == "cancelled"


def test_context_snapshot_turn_window_matches_transmitted_messages(client, workspace):
    from powwow.providers import chat_messages
    _, chat = workspace
    for index in range(28):
        message(client, chat, f"Context turn {index}")
    current = message(client, chat, "Final question")
    response = client.post("/v1/runs", json=run_body(chat, current)).json()
    with SessionLocal() as db:
        run = db.get(Run, response["id"])
        snapshot_ids = {s["source_id"] for s in run.context_snapshot if s.get("source_type") == "message" and s.get("chat_id") == chat["id"]}
        transmitted = chat_messages(run)
        assert len(snapshot_ids) == 25
        assert len(transmitted) == 26  # system + 24 history + current request


def test_source_image_uses_attachment_order_not_database_insertion(client, workspace, monkeypatch):
    import base64
    project, chat = workspace
    inputs = []
    for color in ["red", "blue"]:
        buffer = io.BytesIO()
        Image.new("RGB", (64, 64), color).save(buffer, "PNG")
        data = buffer.getvalue()
        response = client.post("/v1/uploads", data={"project_id": project["id"], "chat_id": chat["id"]}, files={"file": (f"{color}.png", data, "image/png")})
        assert response.status_code == 201
        inputs.append((response.json()["id"], data))
    msg = message(client, chat, "Animate the first selected image")
    # Blue was inserted second but is explicitly selected first by the user.
    run = client.post("/v1/runs", json=run_body(chat, msg, capability="image_to_video", attachment_ids=[inputs[1][0], inputs[0][0]])).json()
    with SessionLocal() as db:
        current = db.get(Run, run["id"])
        current.provider = "local_media"
        db.commit()
    received = []
    def capture_source(current, payload, cancelled):
        received.append(base64.b64decode(payload["source_image"]["base64"]))
        return {"model": "unit-test-only", "artifacts": [{"mime_type": "video/mp4", "filename": "test.mp4", "base64": base64.b64encode(b"\x00\x00\x00\x18ftypisom\x00\x00\x02\x00isomiso2").decode()}]}
    monkeypatch.setattr("powwow.worker.local_media", capture_source)
    execute(*claim())
    assert received == [inputs[1][1]]
    assert client.get("/v1/runs/" + run["id"]).json()["status"] == "succeeded"
