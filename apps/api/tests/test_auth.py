from datetime import datetime, timedelta, timezone

import jwt
import pytest

from powwow.auth import owner_id
from powwow.config import Settings, settings
from powwow.main import app


def test_local_auth_fails_closed_outside_development():
    with pytest.raises(RuntimeError, match="only with APP_ENV=development"):
        Settings(app_env="production", local_auth=True).validate_runtime()


def test_test_provider_and_sqlite_cannot_be_production():
    with pytest.raises(RuntimeError, match="SQLite is for tests only"):
        Settings(app_env="production", database_url="sqlite:///test.db", local_auth=False).validate_runtime()
    with pytest.raises(RuntimeError, match="test provider"):
        Settings(app_env="production", database_url="postgresql+psycopg://example/db", supabase_url="https://project.supabase.co", local_auth=False, enable_test_provider=True).validate_runtime()


def test_production_jwt_validates_issuer_expiry_and_role(client, monkeypatch):
    app.dependency_overrides.clear()
    cfg = settings()
    monkeypatch.setattr(cfg, "supabase_url", "https://project.supabase.co")
    monkeypatch.setattr(cfg, "supabase_jwt_secret", "a-test-signing-key-with-at-least-32-characters")
    claims = {"sub": "jwt-owner", "iss": "https://project.supabase.co/auth/v1", "aud": "authenticated", "role": "authenticated", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}
    def headers(changes=None):
        token = jwt.encode({**claims, **(changes or {})}, cfg.supabase_jwt_secret, algorithm="HS256")
        return {"Authorization": "Bearer " + token}
    assert client.get("/v1/projects").status_code == 401
    assert client.get("/v1/projects", headers=headers()).status_code == 200
    assert client.get("/v1/projects", headers=headers({"iss": "https://other.supabase.co/auth/v1"})).status_code == 401
    assert client.get("/v1/projects", headers=headers({"role": "anon"})).status_code == 401
    assert client.get("/v1/projects", headers=headers({"exp": datetime.now(timezone.utc) - timedelta(seconds=10)})).status_code == 401


def test_local_browser_origin_is_restricted(client, monkeypatch):
    app.dependency_overrides.clear()
    monkeypatch.setattr(settings(), "app_env", "development")
    monkeypatch.setattr(settings(), "local_auth", True)
    assert client.get("/v1/projects", headers={"Origin": "https://untrusted.example"}).status_code == 403
    assert client.get("/v1/projects", headers={"Origin": "http://localhost:5173"}).status_code == 200
