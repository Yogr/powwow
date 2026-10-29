from powwow.config import Settings, settings
from powwow.db import SessionLocal
from powwow.models import Account


def test_spending_override_is_only_effective_in_development():
    for env in ('production', 'test'):
        assert Settings(app_env=env, development_uncapped_spending=True).spending_limits_enabled
    assert not Settings(app_env='development', development_uncapped_spending=True).spending_limits_enabled
    assert Settings(app_env='development', development_uncapped_spending=False).spending_limits_enabled


def test_uncapped_admission_retains_accounting_and_idempotency(client, workspace, monkeypatch):
    cfg = settings()
    monkeypatch.setattr(cfg, 'app_env', 'development')
    monkeypatch.setattr(cfg, 'development_uncapped_spending', True)
    monkeypatch.setattr(cfg, 'max_run_budget_usd', .01)
    from pydantic import SecretStr
    monkeypatch.setattr(cfg, 'openai_api_key', SecretStr('not-used-no-worker-call'))
    chat = workspace[1]
    message = client.post(f"/v1/chats/{chat['id']}/messages", json={'content': 'Plan a story.'}).json()
    with SessionLocal() as db:
        account = db.get(Account, 'test-owner-a')
        account.budget_usd = 0
        db.commit()
    body = {'chat_id': chat['id'], 'message_id': message['id'], 'budget_usd': 1, 'idempotency_key': 'uncapped-admission'}
    response = client.post('/v1/runs', json=body)
    assert response.status_code == 201, response.text
    run = response.json()
    assert run['settings']['spending_limits_enabled'] is False
    assert client.post('/v1/runs', json=body).json()['id'] == run['id']
    with SessionLocal() as db:
        account = db.get(Account, 'test-owner-a')
        assert account.reserved_usd > 1 and account.spent_usd == 0
    assert client.get('/v1/config').json()['spending_limits_enabled'] is False
