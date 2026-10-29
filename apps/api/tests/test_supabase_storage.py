import httpx
import pytest

from powwow.config import Settings, settings
from powwow.storage import Storage


def test_supabase_http_is_loopback_development_only():
    common = dict(database_url="postgresql+psycopg://user:pass@localhost/test", local_auth=False, storage_backend="supabase", supabase_service_role_key="server-key", enable_test_provider=False)
    Settings(_env_file=None, app_env="development", supabase_url="http://127.0.0.1:56321", **common).validate_runtime()
    for environment, url in [("production", "http://127.0.0.1:56321"), ("development", "http://untrusted.example"), ("production", "https://user:pass@project.supabase.co")]:
        with pytest.raises(RuntimeError):
            Settings(_env_file=None, app_env=environment, supabase_url=url, **common).validate_runtime()


@pytest.mark.parametrize("signed", ["/object/upload/sign/artifacts/owner/result.png?token=opaque", "/storage/v1/object/upload/sign/artifacts/owner/result.png?token=opaque", "http://127.0.0.1:56321/storage/v1/object/upload/sign/artifacts/owner/result.png?token=opaque"])
def test_local_signed_upload_keeps_configured_origin(monkeypatch, signed):
    cfg = settings()
    monkeypatch.setattr(cfg, "storage_backend", "supabase")
    monkeypatch.setattr(cfg, "supabase_url", "http://127.0.0.1:56321")
    monkeypatch.setattr("powwow.storage.httpx.post", lambda *args, **kwargs: httpx.Response(200, json={"url": signed}, request=httpx.Request("POST", args[0])))
    target = Storage().sign_output("owner/result.png", "image/png")
    assert target["url"] == "http://127.0.0.1:56321/storage/v1/object/upload/sign/artifacts/owner/result.png?token=opaque"
    assert target["headers"] == {"Content-Type": "image/png"}
    assert target["storage_key"] == "owner/result.png"


@pytest.mark.parametrize("signed", ["https://attacker.example/storage/v1/object/upload/sign/x", "//attacker.example/object/upload/sign/x", "http://127.0.0.1:55321/storage/v1/object/upload/sign/x", "http://user:pass@127.0.0.1:56321/storage/v1/object/upload/sign/x", "http://127.0.0.1:56321/auth/v1/admin/users"])
def test_signed_upload_rejects_origin_or_route_changes(monkeypatch, signed):
    cfg = settings()
    monkeypatch.setattr(cfg, "storage_backend", "supabase")
    monkeypatch.setattr(cfg, "supabase_url", "http://127.0.0.1:56321")
    monkeypatch.setattr("powwow.storage.httpx.post", lambda *args, **kwargs: httpx.Response(200, json={"url": signed}, request=httpx.Request("POST", args[0])))
    with pytest.raises(ValueError):
        Storage().sign_output("owner/result.png", "image/png")
