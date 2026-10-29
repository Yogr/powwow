import os
import tempfile
from pathlib import Path

os.environ["APP_ENV"] = "test"
os.environ["LOCAL_AUTH"] = "false"
os.environ["ENABLE_TEST_PROVIDER"] = "true"
# TEST_DATABASE_URL enables the exact same suite against a dedicated PostgreSQL DB.
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", "sqlite:///" + str(Path(tempfile.mkdtemp()) / "api-test.db").replace("\\", "/"))
os.environ["STORAGE_PATH"] = tempfile.mkdtemp()
os.environ["STORAGE_BACKEND"] = "local"

import pytest
from fastapi.testclient import TestClient

from powwow.auth import owner_id
from powwow.db import Base, engine
from powwow.main import app

if engine.dialect.name == "postgresql" and "test" not in (engine.url.database or "").lower():
    raise RuntimeError("Refusing destructive test setup: the dedicated PostgreSQL database name must include 'test'.")


@pytest.fixture
def client():
    Base.metadata.drop_all(engine)
    app.dependency_overrides[owner_id] = lambda: "test-owner-a"
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def workspace(client):
    client.patch("/v1/account/preferences", json={"storage_mode": "cloud"})
    project = client.post("/v1/projects", json={"name": "Studio"}).json()
    chat = client.post("/v1/chats", json={"project_id": project["id"]}).json()
    return project, chat
