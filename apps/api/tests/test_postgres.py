from concurrent.futures import ThreadPoolExecutor

import pytest
from sqlalchemy import select, text

from powwow.db import SessionLocal, engine
from powwow.models import Account, Run

pytestmark = pytest.mark.skipif(engine.dialect.name != "postgresql", reason="Requires TEST_DATABASE_URL pointing to an isolated PostgreSQL database")


def test_concurrent_idempotency_and_account_budget(client, workspace, monkeypatch):
    _, chat = workspace
    message = client.post(f"/v1/chats/{chat['id']}/messages", json={"content": "hello"}).json()
    monkeypatch.setattr("powwow.service.binding", lambda capability: {"enabled": True, "provider": "runpod", "model": "test", "estimated_cost_usd": .1})
    with SessionLocal() as db:
        account = db.get(Account, "test-owner-a")
        account.budget_usd, account.reserved_usd, account.spent_usd = 1, 0, 0
        db.commit()
    body = {"chat_id": chat["id"], "message_id": message["id"], "capability": "chat", "budget_usd": .6, "idempotency_key": "simultaneous-request"}
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda _: client.post("/v1/runs", json=body), range(6)))
    assert all(result.status_code == 201 for result in results), [result.text for result in results]
    assert len({result.json()["id"] for result in results}) == 1
    with SessionLocal() as db:
        assert len(list(db.scalars(select(Run)))) == 1
        assert db.get(Account, "test-owner-a").reserved_usd == .6
    with ThreadPoolExecutor(max_workers=4) as pool:
        rejected = list(pool.map(lambda index: client.post("/v1/runs", json={**body, "idempotency_key": f"over-budget-{index}"}), range(4)))
    assert all(result.status_code == 402 for result in rejected)
    assert client.get("/v1/usage").json()["reserved_usd"] == .6


def test_production_bootstrap_enables_row_security(client, monkeypatch):
    from powwow.config import settings
    from powwow.db import init_db
    monkeypatch.setattr(settings(), "app_env", "production")
    init_db()
    with engine.connect() as connection:
        rows = list(connection.execute(text("SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('projects', 'runs', 'messages', 'artifacts')")))
        assert len(rows) == 4
        assert all(row.relrowsecurity for row in rows)


def test_concurrent_uploads_and_media_reservations_share_storage_allowance(client, workspace, monkeypatch):
    from powwow.config import settings
    monkeypatch.setattr(settings(), "free_storage_quota_bytes", 10)
    with ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(lambda _: client.post("/v1/uploads", files={"file": ("note.txt", b"12345678", "text/plain")}), range(5)))
    assert sorted(result.status_code for result in results) == [201, 413, 413, 413, 413], [result.text for result in results]
    assert client.get("/v1/account/preferences").json()["storage_used_bytes"] == 8
    monkeypatch.setattr(settings(), "free_storage_quota_bytes", 30)
    monkeypatch.setattr(settings(), "max_generated_artifact_bytes", 20)
    message = client.post(f"/v1/chats/{workspace[1]['id']}/messages", json={"content": "Draw an apple"}).json()
    body = {"chat_id": workspace[1]["id"], "message_id": message["id"], "capability": "text_to_image"}
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda index: client.post("/v1/runs", json={**body, "idempotency_key": f"quota-concurrent-{index}"}), range(4)))
    assert sorted(result.status_code for result in results) == [201, 413, 413, 413], [result.text for result in results]
    account = client.get("/v1/account/preferences").json()
    assert account["storage_used_bytes"] == 8 and account["storage_reserved_bytes"] == 20
