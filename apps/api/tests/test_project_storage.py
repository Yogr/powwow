from concurrent.futures import ThreadPoolExecutor

import pytest
from sqlalchemy import create_engine, text

from powwow.config import settings
from powwow.db import engine
from powwow.migrations import project_storage_choice


def upload(client, size, project_id=None):
    return client.post("/v1/uploads", data={"project_id": project_id} if project_id else {}, files={"file": ("note.txt", b"x" * size, "text/plain")})


def test_project_storage_choices_are_independent_of_account_default(client):
    client.patch("/v1/account/preferences", json={"storage_mode": "cloud"})
    local = client.post("/v1/projects", json={"name": "Local", "storage_mode": "local"}).json()
    cloud = client.post("/v1/projects", json={"name": "Cloud", "storage_mode": "cloud"}).json()
    assert upload(client, 10, local["id"]).json()["storage_mode"] == "local"
    client.patch("/v1/account/preferences", json={"storage_mode": "local"})
    assert upload(client, 10, cloud["id"]).json()["storage_mode"] == "cloud"
    assert upload(client, 10, local["id"]).json()["storage_mode"] == "local"
    assert client.get(f"/v1/projects/{local['id']}").json()["storage_mode"] == "local"


def test_chat_upload_and_media_use_the_project_storage_choice(client, monkeypatch):
    from test_workspace_settings import queue
    monkeypatch.setattr(settings(), "max_generated_artifact_bytes", 100)
    project = client.post("/v1/projects", json={"name": "Local", "storage_mode": "local"}).json()
    chat = client.post("/v1/chats", json={"project_id": project["id"]}).json()
    saved = client.post("/v1/uploads", data={"chat_id": chat["id"]}, files={"file": ("note.txt", b"hello", "text/plain")})
    assert saved.status_code == 201 and saved.json()["storage_mode"] == "local"
    run = queue(client, chat, "Draw an apple", "local-project-image", capability="text_to_image").json()
    assert run["settings"]["storage_mode"] == "local"
    assert client.get("/v1/account/preferences").json()["storage_mode"] == "unselected"


def test_one_small_crossing_then_stop_new_cloud_writes(client, monkeypatch):
    monkeypatch.setattr(settings(), "free_storage_quota_bytes", 100)
    client.patch("/v1/account/preferences", json={"storage_mode": "cloud"})
    assert upload(client, 99).status_code == 201
    assert upload(client, 6).status_code == 201
    blocked = upload(client, 1)
    assert blocked.status_code == 413
    assert blocked.json()["detail"]["action"] == "upgrade_storage"
    prefs = client.get("/v1/account/preferences").json()
    assert prefs["storage_used_bytes"] == 105 and prefs["storage_full"]
    assert prefs["storage_grace_bytes"] == 5
    # Existing files and ordinary chats remain usable; new local assets work.
    assert client.post("/v1/chats", json={"title": "Still chatting"}).status_code == 201
    local = client.post("/v1/projects", json={"name": "Local", "storage_mode": "local"}).json()
    assert upload(client, 1, local["id"]).status_code == 201


def test_grace_is_bounded_and_cannot_be_repeated(client, monkeypatch):
    monkeypatch.setattr(settings(), "free_storage_quota_bytes", 100)
    monkeypatch.setattr(settings(), "cloud_storage_grace_max_bytes", 3)
    client.patch("/v1/account/preferences", json={"storage_mode": "cloud"})
    assert upload(client, 99).status_code == 201
    assert upload(client, 5).status_code == 413
    assert upload(client, 2).status_code == 201  # Two unused grace bytes remain.
    assert upload(client, 1).status_code == 413  # They are not a new allowance.
    assert client.get("/v1/account/preferences").json()["storage_used_bytes"] == 101


@pytest.mark.skipif(engine.dialect.name != "postgresql", reason="Requires PostgreSQL row locks")
def test_simultaneous_crossings_only_admit_one(client, monkeypatch):
    monkeypatch.setattr(settings(), "free_storage_quota_bytes", 100)
    client.patch("/v1/account/preferences", json={"storage_mode": "cloud"})
    assert upload(client, 99).status_code == 201
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda _: upload(client, 3), range(4)))
    assert sorted(result.status_code for result in results) == [201, 413, 413, 413]
    assert client.get("/v1/account/preferences").json()["storage_used_bytes"] == 102


def test_existing_project_storage_migration_preserves_rows(tmp_path):
    old = create_engine("sqlite:///" + str(tmp_path / "existing.db"))
    with old.begin() as connection:
        connection.execute(text("CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT)"))
        connection.execute(text("INSERT INTO projects VALUES ('old', 'Original project')"))
        project_storage_choice(connection)
        project_storage_choice(connection)
        assert connection.execute(text("SELECT id, name, storage_mode FROM projects")).all() == [("old", "Original project", None)]
    old.dispose()
