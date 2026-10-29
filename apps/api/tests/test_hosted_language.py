"""Paid language admission, protocol and crash recovery. No real API calls."""
import json
from datetime import timedelta

import httpx
import pytest
from pydantic import SecretStr
from sqlalchemy import select

from powwow.config import settings
from powwow.db import SessionLocal, engine, now
from powwow.hosted_chat import request_body, response_schema, usage_cost
from powwow.intelligence import LANGUAGE_TIERS, maximum_cost
from powwow.models import Account, Run, UsageEntry
from powwow.worker import claim, execute
from test_language import make_profile, open_day, reply


@pytest.fixture
def hosted(monkeypatch, client, workspace):
    monkeypatch.setattr(settings(), "enable_test_provider", False)
    monkeypatch.setattr(settings(), "openai_api_key", SecretStr("test-placeholder-not-a-real-key"))
    profile = make_profile(client, workspace[0])
    return open_day(client, profile)["current_day_id"]


def queue(client, day, tier="basic", budget=1, key="hosted-request-one"):
    return client.post(f"/v1/language/days/{day}/turns", json={
        "action": "reply", "text": "Hola", "intelligence": tier,
        "budget_usd": budget, "idempotency_key": key})


def output(text=None, status="completed"):
    return {"id": "resp_test", "model": "gpt-6-astra", "status": status,
            "output": [{"type": "message", "content": [{"type": "output_text", "text": text if text is not None else json.dumps(reply())}]}],
            "usage": {"input_tokens": 1000, "output_tokens": 600,
                      "output_tokens_details": {"reasoning_tokens": 300}}}


def transport(monkeypatch, handler):
    real = httpx.Client
    monkeypatch.setattr("powwow.hosted_chat.httpx.Client", lambda **kwargs: real(transport=httpx.MockTransport(handler), **kwargs))


def balances(run_id):
    with SessionLocal() as db:
        run = db.get(Run, run_id)
        account = db.get(Account, run.owner_id)
        usage = db.scalar(select(UsageEntry).where(UsageEntry.run_id == run.id))
        return run.status, run.error, account.reserved_usd, account.spent_usd, usage.actual_cost_usd if usage else None


def test_missing_key_is_explicit_and_never_falls_back(client, hosted, monkeypatch):
    monkeypatch.setattr(settings(), "openai_api_key", SecretStr(""))
    result = queue(client, hosted)
    assert result.status_code == 503
    assert result.json()["detail"]["code"] == "provider_unavailable"
    assert client.get("/v1/languages/catalog").json()["intelligence"]["setup_required"]
    assert claim() is None


@pytest.mark.parametrize("tier", ["basic", "smarter", "advanced"])
def test_fixed_baseline_is_snapshotted_with_server_prices_and_reserved(client, hosted, tier):
    result = queue(client, hosted, tier).json()
    assert result["provider"] == "openai"
    assert result["model"] == LANGUAGE_TIERS["advanced"]["model"]
    assert result["workflow_id"] == "language.converse.v1"
    assert result["settings"]["intelligence_policy"]["reasoning_effort"] == LANGUAGE_TIERS["advanced"]["reasoning_effort"]
    assert balances(result["id"])[2] == maximum_cost(LANGUAGE_TIERS["advanced"])
    assert queue(client, hosted, tier).json()["id"] == result["id"]
    assert queue(client, hosted, "smarter" if tier == "basic" else "basic").status_code == 409


def test_budget_and_tier_validation(client, hosted):
    assert queue(client, hosted, budget=.01).json()["detail"]["code"] == "budget_too_low"
    assert queue(client, hosted, "made-up-free-model").status_code == 422
    result = client.post(f"/v1/language/days/{hosted}/turns", json={"text": "Hi", "idempotency_key": "injected-pricing", "intelligence_policy": {"model": "free"}})
    assert result.status_code == 422
    assert claim() is None


def test_strict_schema_requires_nullable_fields_and_closed_objects():
    schema = response_schema()
    def visit(value):
        if isinstance(value, dict):
            if value.get("type") == "object":
                assert value["additionalProperties"] is False
                assert set(value["required"]) == set(value["properties"])
            assert "default" not in value
            for child in value.values():
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)
    visit(schema)
    assert {"type": "null"} in schema["properties"]["correction"]["anyOf"]


def test_responses_protocol_and_billing_with_reasoning(client, hosted, monkeypatch):
    run = queue(client, hosted).json()
    seen = []
    def handle(request):
        seen.append(request)
        return httpx.Response(200, json=output())
    transport(monkeypatch, handle)
    execute(*claim())
    assert len(seen) == 1
    assert str(seen[0].url) == "https://api.openai.com/v1/responses"
    body = json.loads(seen[0].content)
    assert body["store"] is False and body["service_tier"] == "default"
    assert body["reasoning"] == {"effort": "high"}
    assert body["max_output_tokens"] == 8192 and "temperature" not in body
    assert body["text"]["format"]["strict"] is True
    assert body["input"][-1]["content"] == "Hola"
    status, error, reserved, spent, cost = balances(run["id"])
    assert (status, error, reserved) == ("succeeded", None, 0)
    assert cost == spent == .0425  # Includes all 600 output tokens, including reasoning.
    detail = client.get(f"/v1/language/days/{hosted}").json()
    assert detail["turns"][-1]["reply"] == reply()
    assert "test-placeholder" not in json.dumps(detail)


@pytest.mark.parametrize("raw,status", [("bad JSON", "completed"), (None, "incomplete")])
def test_paid_invalid_or_truncated_reply_is_charged_once(client, hosted, monkeypatch, raw, status):
    run = queue(client, hosted).json()
    seen = []
    def handle(request):
        seen.append(request)
        return httpx.Response(200, json=output(raw, status))
    transport(monkeypatch, handle)
    execute(*claim())
    assert len(seen) == 1
    state, _, reserved, spent, cost = balances(run["id"])
    assert (state, reserved, spent, cost) == ("failed", 0, .0425, .0425)
    assert len(client.get(f"/v1/language/days/{hosted}").json()["turns"]) == 1


@pytest.mark.parametrize("mode", ["timeout", "server_error", "missing_usage", "cancel_timeout"])
def test_uncertain_submission_holds_budget_and_blocks_retry(client, hosted, monkeypatch, mode):
    run = queue(client, hosted).json()
    seen = []
    def handle(request):
        seen.append(request)
        if mode == "cancel_timeout":
            with SessionLocal() as db:
                db.get(Run, run["id"]).status = "cancel_requested"
                db.commit()
        if mode in {"timeout", "cancel_timeout"}:
            raise httpx.ReadTimeout("test timeout")
        return httpx.Response(503 if mode == "server_error" else 200, json={})
    transport(monkeypatch, handle)
    execute(*claim())
    state, error, reserved, spent, cost = balances(run["id"])
    assert state == "failed" and error["code"] == "submission_uncertain"
    assert reserved == maximum_cost(LANGUAGE_TIERS["advanced"]) and spent == 0 and cost is None
    assert len(seen) == 1 and claim() is None
    retried = client.post(f"/v1/runs/{run['id']}/retry", json={"idempotency_key": "do-not-double-bill"})
    assert retried.status_code == 409 and retried.json()["detail"]["code"] == "reconcile_required"


def test_definitive_rejection_releases_reservation_and_sanitizes_error(client, hosted, monkeypatch):
    run = queue(client, hosted).json()
    transport(monkeypatch, lambda _: httpx.Response(401, json={"error": "private-secret-provider-body"}))
    execute(*claim())
    state, error, reserved, spent, cost = balances(run["id"])
    assert (state, reserved, spent, cost) == ("failed", 0, 0, 0)
    assert error["code"] == "hosted_rejected" and "private-secret" not in error["message"]


@pytest.mark.parametrize('provider_code,expected', [
    ('billing_not_active', 'API billing is not active'),
    ('insufficient_quota', 'insufficient API quota'),
    ('credit_balance_exhausted', 'credit balance'),
    ('project_spend_limit_exceeded', 'project spending limit'),
    ('organization_spend_limit_exceeded', 'organization spending limit'),
    ('organization_usage_limit_exceeded', 'organization usage limit'),
    ('rate_limit_exceeded', 'temporarily rate-limiting'),
    ('slow_down', 'slow down'),
])
def test_provider_limits_are_distinct_from_powwow_allowance(client, hosted, monkeypatch, provider_code, expected):
    run = queue(client, hosted).json()
    calls = []
    def reject(request):
        calls.append(request)
        return httpx.Response(429, headers={'retry-after': '15'}, json={'error': {'code': provider_code, 'type': 'insufficient_quota', 'message': 'private-secret-provider-body'}})
    transport(monkeypatch, reject)
    execute(*claim())
    state, error, reserved, spent, cost = balances(run['id'])
    assert (state, reserved, spent, cost) == ('failed', 0, 0, 0)
    assert expected in error['message'] and 'Settings' not in error['message']
    detail = client.get(f"/v1/runs/{run['id']}").json()
    assert detail['model_provenance']['provider_error']['code'] == provider_code
    assert detail['model_provenance']['provider_error']['retry_after_seconds'] == 15
    assert 'private-secret' not in json.dumps(detail)
    assert len(calls) == 1 and claim() is None


def test_unknown_provider_limit_does_not_invent_a_billing_diagnosis():
    from powwow.hosted_chat import rejection
    error = rejection(httpx.Response(429, json={'error': {'code': 'private-secret', 'type': [], 'message': 'private-secret'}}))
    assert 'HTTP 429' in str(error) and error.details['code'] is None
    assert 'private-secret' not in json.dumps(error.details) + str(error)


def test_cancellation_after_dispatch_settles_returned_usage(client, hosted, monkeypatch):
    run = queue(client, hosted).json()
    def handle(_):
        with SessionLocal() as db:
            db.get(Run, run["id"]).status = "cancel_requested"
            db.commit()
        return httpx.Response(200, json=output())
    transport(monkeypatch, handle)
    execute(*claim())
    assert balances(run["id"]) == ("cancelled", None, 0, .0425, .0425)


def test_worker_crash_after_submission_never_resubmits(client, hosted):
    run = queue(client, hosted).json()
    assert claim()
    with SessionLocal() as db:
        stored = db.get(Run, run["id"])
        stored.submission_started = True
        stored.lease_expires_at = now() - timedelta(seconds=1)
        db.commit()
    assert claim() is None
    assert balances(run["id"])[1]["code"] == "submission_uncertain"
    assert balances(run["id"])[2] > 0


def test_daily_limits_across_learners_and_settled_cost(client, hosted, workspace, monkeypatch):
    monkeypatch.setattr(settings(), "language_daily_budget_usd", .65)
    first = queue(client, hosted).json()
    profile = make_profile(client, workspace[0], learner_name="Second learner")
    day = open_day(client, profile)["current_day_id"]
    assert queue(client, day, key="second-learner-turn").json()["detail"]["code"] == "language_daily_budget"
    transport(monkeypatch, lambda _: httpx.Response(200, json=output()))
    execute(*claim())
    # .0425 spent + .6144 new reserve > .65, even after first reserve is released.
    assert queue(client, day, key="second-learner-turn").status_code == 402
    monkeypatch.setattr(settings(), "language_daily_budget_usd", .7)
    monkeypatch.setattr(settings(), "language_daily_turn_limit", 1)
    assert queue(client, day, key="second-learner-turn").json()["detail"]["code"] == "language_daily_turns"
    monkeypatch.setattr(settings(), "language_daily_turn_limit", 2)
    assert queue(client, day, key="second-learner-turn").status_code == 201
    assert balances(first["id"])[2] == maximum_cost(LANGUAGE_TIERS["advanced"])


def test_usage_validation_does_not_hide_overrun():
    assert usage_cost({"input_tokens": 1_000_000, "output_tokens": 1_000_000}, LANGUAGE_TIERS["advanced"]) == 62.5
    with pytest.raises(ValueError):
        usage_cost({"input_tokens": True, "output_tokens": -1}, LANGUAGE_TIERS["advanced"])


def test_explicit_tutor_retry_keeps_fixed_baseline_and_is_idempotent(client, hosted, monkeypatch):
    run = queue(client, hosted).json()
    transport(monkeypatch, lambda _: httpx.Response(200, json=output("bad JSON")))
    execute(*claim())
    url = f"/v1/runs/{run['id']}/retry"
    body = {"idempotency_key": "explicit-upgrade", "intelligence": "advanced", "budget_usd": 1}
    retried = client.post(url, json=body)
    assert retried.status_code == 201, retried.text
    assert retried.json()["model"] == LANGUAGE_TIERS["advanced"]["model"]
    assert client.post(url, json=body).json()["id"] == retried.json()["id"]
    assert client.post(url, json={**body, "intelligence": "basic"}).json()["id"] == retried.json()["id"]


def test_context_bound_trims_history_preserves_instructions_and_current_message(client, hosted, monkeypatch):
    run = queue(client, hosted).json()
    messages = [{"role": "system", "content": "Instructions"}] + [{"role": "user", "content": "Old history " * 2000} for _ in range(20)] + [{"role": "user", "content": "Current message"}]
    monkeypatch.setattr("powwow.hosted_chat.chat_messages", lambda _: list(messages))
    with SessionLocal() as db:
        body = request_body(db.get(Run, run["id"]))
    assert body["input"] == [messages[0], messages[-1]]


def test_legacy_local_language_run_stops_before_provider_call(client, hosted, monkeypatch):
    run = queue(client, hosted).json()
    with SessionLocal() as db:
        db.get(Run, run["id"]).provider = "ollama"
        db.commit()
    def unexpected(*args):
        pytest.fail("A legacy language run must not reach the rejected local model")
    monkeypatch.setattr("powwow.worker.ollama_chat", unexpected)
    execute(*claim())
    assert balances(run["id"])[1]["code"] == "language_model_required"


@pytest.mark.skipif(engine.dialect.name != "postgresql", reason="Account row locks require PostgreSQL")
def test_parallel_learners_cannot_overbook_daily_budget(client, hosted, workspace, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    monkeypatch.setattr(settings(), "language_daily_budget_usd", .7)
    days = [hosted] + [open_day(client, make_profile(client, workspace[0], learner_name=f"Concurrent {index}"))["current_day_id"] for index in range(2)]
    with ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(lambda pair: queue(client, pair[1], key=f"parallel-language-{pair[0]}"), enumerate(days)))
    assert sorted(result.status_code for result in results) == [201, 402, 402]
    with SessionLocal() as db:
        assert db.get(Account, "test-owner-a").reserved_usd == maximum_cost(LANGUAGE_TIERS["advanced"])
