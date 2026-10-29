import json
from datetime import datetime, timedelta, timezone

import pytest

from powwow.auth import owner_id
from powwow.builder import detect_kind, infer_answers
from powwow.db import SessionLocal, now
from powwow.language import parse_reply
from powwow.main import app
from powwow.models import Message, Run
from powwow.providers import chat_messages
from powwow.worker import claim, execute


def reply():
    return {"text": "¿Cómo estás?", "translation": "How are you?",
            "segments": [{"text": "¿Cómo ", "translation": "How"}, {"text": "estás?", "translation": "are you"}],
            "explanation": None, "correction": None, "show_translation_tip": False,
            "suggested_replies": [{"text": "Estoy bien.", "translation": "I'm well."}],
            "vocabulary": [{"text": "bien", "translation": "well", "note": "An everyday greeting response."}], "topic": "Your day"}


def make_profile(client, project, **changes):
    response = client.post(f"/v1/projects/{project['id']}/language/profiles", json={
        "learner_name": "Marisa", "target_language": "es", "native_language": "en", "level": "beginner", "timezone": "America/New_York", **changes})
    assert response.status_code == 201, response.text
    return response.json()


def open_day(client, profile):
    response = client.get(f"/v1/language/profiles/{profile['id']}/days")
    assert response.status_code == 200, response.text
    return response.json()


def send(client, day_id, text="", action="start", key="language-start-001"):
    return client.post(f"/v1/language/days/{day_id}/turns", json={"text": text, "action": action, "idempotency_key": key, "budget_usd": 0})


def finish(monkeypatch, value=None):
    raw = json.dumps(value if value is not None else reply(), ensure_ascii=False)
    monkeypatch.setattr("powwow.worker.fixture_result", lambda run: {"text": raw, "model": "test-fixture", "artifacts": [], "metrics": {}, "provenance": {"simulated": True}})
    job = claim()
    assert job
    execute(*job)


@pytest.fixture
def learner(client, workspace):
    profile = make_profile(client, workspace[0])
    days = open_day(client, profile)
    return profile, days["current_day_id"]


def test_catalog_and_builder_inference(client, workspace):
    catalog = client.get("/v1/languages/catalog").json()
    assert {"es", "en", "ja", "ar"} <= {language["code"] for language in catalog["languages"]}
    assert len(catalog["levels"]) == 4
    assert detect_kind("I would like to learn Spanish") == "language"
    assert detect_kind("I don't want to learn Spanish") is None
    assert detect_kind("Build an app to learn Spanish") == "app"
    assert infer_answers("language", "Learn Spanish, I speak English fluently, beginner") == {"target_language": "es", "native_language": "en", "level": "beginner"}
    response = client.post(f"/v1/projects/{workspace[0]['id']}/plan", json={"prompt": "I'd like to learn Spanish"})
    assert response.status_code == 200, response.text
    assert response.json()["workspace"]["kind"] == "language"
    assert "language" in response.json()["workspace"]["components"]


def test_tutor_uses_configured_baseline_not_browser_tier(client, learner):
    response = client.post(f"/v1/language/days/{learner[1]}/turns", json={
        "action": "start", "text": "", "intelligence": "advanced", "budget_usd": 0,
        "idempotency_key": "fixed-tutor-baseline-001"})
    assert response.status_code == 201, response.text
    assert response.json()["settings"]["intelligence_tier"] == "basic"


@pytest.mark.parametrize("change", [{"timezone": "Mars/Olympus"}, {"timezone": "../UTC"}, {"target_language": "xx"}, {"native_language": "es"}, {"learner_name": "   "}, {"level": "certified"}])
def test_profile_validation(client, workspace, change):
    result = client.post(f"/v1/projects/{workspace[0]['id']}/language/profiles", json={"learner_name": "Marisa", "target_language": "es", "native_language": "en", **change})
    assert result.status_code == 422


def test_profile_attaches_component_and_opens_one_day(client, workspace, learner):
    profile, day = learner
    assert make_profile(client, workspace[0])["id"] == profile["id"]
    assert client.get(f"/v1/language/profiles/{profile['id']}").json()["learner_name"] == profile["learner_name"]
    assert len(client.get(f"/v1/projects/{workspace[0]['id']}/language/profiles").json()) == 1
    assert "language" in client.get(f"/v1/projects/{workspace[0]['id']}/workspace").json()["workspace"]["components"]
    first, second = open_day(client, profile), open_day(client, profile)
    assert first == second
    assert first["days"][0]["day_number"] == 1
    assert first["current_day_id"] == day
    chats = client.get(f"/v1/chats?project_id={workspace[0]['id']}").json()
    assert first["days"][0]["chat_id"] not in {chat["id"] for chat in chats}


def test_start_and_message_are_idempotent_and_only_one_run_active(client, learner, monkeypatch):
    profile, day = learner
    initial = send(client, day)
    assert initial.status_code == 201, initial.text
    run = initial.json()
    assert run["settings"]["language_learning"] is True
    assert run["context_snapshot"] == []
    assert send(client, day).json()["id"] == run["id"]
    assert send(client, day, key="another-mount-start").json()["id"] == run["id"]
    assert send(client, day, text="Hello", action="reply", key="different-fingerprint").status_code == 409
    assert send(client, day, text="Hello", action="reply").status_code == 409
    assert client.get(f"/v1/language/days/{day}").json()["turns"] == []
    finish(monkeypatch)
    detail = client.get(f"/v1/language/days/{day}").json()
    assert detail["active_run"] is None and detail["last_run"]["status"] == "succeeded"
    assert len(detail["turns"]) == 1
    assert detail["turns"][0]["text"] == "¿Cómo estás?"
    assert detail["turns"][0]["reply"] == reply()
    assert send(client, day, key="start-after-greeting").json()["id"] == run["id"]
    response = send(client, day, "Estoy bien", "reply", "student-reply-001")
    assert response.status_code == 201
    assert send(client, day, "Estoy bien", "reply", "student-reply-001").json()["id"] == response.json()["id"]
    assert len(client.get(f"/v1/language/days/{day}").json()["turns"]) == 2


@pytest.mark.parametrize("bad", ["not JSON", "{truncated", '{}', '{"text":"Hola","translation":"Hello","segments":[{"text":"Adios","translation":"Goodbye"}]}', '{"text":"Hola","translation":"Hello","segments":[{"text":"Hola","translation":""}]}'])
def test_bad_reply_fails_visibly_preserves_user_and_never_becomes_lesson(client, learner, monkeypatch, bad):
    _, day = learner
    result = send(client, day, "Hola", "reply", "invalid-response-001").json()
    monkeypatch.setattr("powwow.worker.fixture_result", lambda _: {"text": bad, "artifacts": []})
    execute(*claim())
    detail = client.get(f"/v1/language/days/{day}").json()
    assert detail["last_run"]["status"] == "failed"
    assert detail["last_run"]["error"]["code"] == "invalid_language_reply"
    assert [(turn["role"], turn["text"]) for turn in detail["turns"]] == [("user", "Hola")]
    retried = client.post(f"/v1/runs/{result['id']}/retry", json={"idempotency_key": "recover-language-reply"})
    assert retried.status_code == 201, retried.text
    assert retried.json()["settings"]["language_learning"] is True
    finish(monkeypatch)
    detail = client.get(f"/v1/language/days/{day}").json()
    assert len(detail["turns"]) == 2
    assert len([turn for turn in detail["turns"] if turn["role"] == "user"]) == 1


def test_prompt_supports_native_help_gentle_recast_and_realistic_word_meanings(client, learner):
    _, day = learner
    result = send(client, day, "I had a good day, but I don't know how to say it", "help", "help-me-say-it").json()
    with SessionLocal() as db:
        messages = chat_messages(db.get(Run, result["id"]))
    system = messages[0]["content"]
    assert "Tuve un buen día" in system and "tengo means 'I have'" in system
    assert "help action ALWAYS needs explanation" in system
    assert "one useful next question" in system
    assert "Every lexical segment needs its own accurate contextual translation" in system
    assert "Current action: help" in system
    assert messages[-1]["content"] == result["prompt"]


def test_help_requires_explanation_and_enables_tip(client, learner, monkeypatch):
    _, day = learner
    result = send(client, day, "", "help", "help-empty-response").json()
    finish(monkeypatch)
    assert client.get(f"/v1/runs/{result['id']}").json()["error"]["code"] == "invalid_language_reply"
    client.post(f"/v1/runs/{result['id']}/retry", json={"idempotency_key": "help-valid-retry"})
    output = {**reply(), "explanation": "Cómo means how. Estás asks about how you feel."}
    finish(monkeypatch, output)
    detail = client.get(f"/v1/language/days/{day}").json()
    assert detail["turns"][0]["reply"]["show_translation_tip"] is True


def test_each_profile_has_private_context_even_in_shared_project(client, workspace, learner, monkeypatch):
    first, day = learner
    send(client, day, "My secret hobby is collecting blue moons", "reply", "first-family-member")
    finish(monkeypatch)
    other = make_profile(client, workspace[0], learner_name="Alex", target_language="fr")
    other_day = open_day(client, other)["current_day_id"]
    run = send(client, other_day, "I like gardening", "reply", "second-family-member").json()
    assert run["context_snapshot"] == []
    assert run["settings"]["language_profile"]["learner_name"] == "Alex"
    assert run["settings"]["language_profile"]["target_language"] == "fr"
    # Ordinary project-chat runs must not absorb a learner's journal either.
    ordinary = client.post(f"/v1/chats/{workspace[1]['id']}/messages", json={"content": "What is this project about?"}).json()
    with SessionLocal() as db:
        from powwow.context import resolve_context
        from powwow.models import Chat
        snapshot = resolve_context(db, "test-owner-a", db.get(Chat, workspace[1]["id"]), [], ordinary["id"])
    assert "blue moons" not in json.dumps(snapshot)
    assert "gardening" not in json.dumps(snapshot)


def test_local_calendar_rollover_dst_and_skipped_days(client, workspace, monkeypatch):
    clock = [datetime(2026, 3, 8, 6, 59, tzinfo=timezone.utc)]
    monkeypatch.setattr("powwow.language.now", lambda: clock[0])
    profile = make_profile(client, workspace[0])
    first = open_day(client, profile)
    assert first["days"][0]["date"] == "2026-03-08"
    clock[0] = datetime(2026, 3, 8, 7, 1, tzinfo=timezone.utc)  # Jump from 01:59 to 03:01.
    assert open_day(client, profile)["current_day_id"] == first["current_day_id"]
    clock[0] = datetime(2026, 3, 9, 3, 59, tzinfo=timezone.utc)
    assert open_day(client, profile)["current_day_id"] == first["current_day_id"]
    clock[0] = datetime(2026, 3, 9, 4, 0, tzinfo=timezone.utc)  # Actual local midnight after DST.
    second = open_day(client, profile)
    assert [day["day_number"] for day in second["days"]] == [1, 2]
    assert second["current_day_id"] == second["days"][-1]["id"]
    assert send(client, first["current_day_id"], "past", "reply", "reject-past-day").status_code == 409
    clock[0] = datetime(2026, 3, 11, 12, 0, tzinfo=timezone.utc)
    fourth = open_day(client, profile)
    assert [day["day_number"] for day in fourth["days"]] == [1, 2, 4]
    assert client.get(f"/v1/language/days/{first['current_day_id']}").status_code == 200


def test_recent_history_only_follows_its_learner(client, workspace, monkeypatch):
    clock = [datetime(2026, 10, 3, 12, tzinfo=timezone.utc)]
    monkeypatch.setattr("powwow.language.now", lambda: clock[0])
    profile = make_profile(client, workspace[0])
    day = open_day(client, profile)["current_day_id"]
    send(client, day, "I enjoy painting", "reply", "yesterday-interest")
    finish(monkeypatch)
    clock[0] += timedelta(days=1)
    today = open_day(client, profile)["current_day_id"]
    run = send(client, today, key="new-day-greeting").json()
    assert "I enjoy painting" in json.dumps(run["context_snapshot"])
    assert {source["language_date"] for source in run["context_snapshot"]} == {"2026-10-03"}
    assert len(run["context_snapshot"]) == 2


def test_archived_project_readable_but_cannot_open_new_day_or_write(client, workspace, learner, monkeypatch):
    profile, day = learner
    client.patch(f"/v1/projects/{workspace[0]['id']}", json={"archived": True})
    assert send(client, day).status_code == 409
    assert client.get(f"/v1/language/days/{day}").status_code == 200
    assert client.post(f"/v1/language/profiles/{profile['id']}/phrases", json={"text": "hola", "translation": "hello"}).status_code == 409
    monkeypatch.setattr("powwow.language.now", lambda: now() + timedelta(days=1))
    days = open_day(client, profile)
    assert days["current_day_id"] is None and len(days["days"]) == 1


def test_generic_endpoints_cannot_bypass_lesson_guards(client, learner, workspace):
    profile, day = learner
    run = send(client, day).json()
    chat = run["chat_id"]
    assert client.post(f"/v1/chats/{chat}/messages", json={"content": "bypass"}).status_code == 409
    assert client.patch(f"/v1/chats/{chat}", json={"context_mode": "project"}).status_code == 409
    assert client.post("/v1/runs", json={"chat_id": chat, "message_id": run["message_id"], "capability": "chat", "idempotency_key": "bypass-lesson-rules"}).status_code == 409


def test_phrase_bank_deduplicates_checks_source_and_schedules_recall(client, workspace, learner, monkeypatch):
    profile, day = learner
    send(client, day)
    finish(monkeypatch)
    turn = client.get(f"/v1/language/days/{day}").json()["turns"][0]
    url = f"/v1/language/profiles/{profile['id']}/phrases"
    payload = {"text": "bien", "translation": "well", "note": "Greeting", "source_turn_id": turn["id"]}
    response = client.post(url, json=payload)
    assert response.status_code == 201, response.text
    phrase = response.json()
    assert client.post(url, json=payload).json()["id"] == phrase["id"]
    assert len(client.get(url).json()) == 1
    assert phrase["review_count"] == 0 and phrase["interval_days"] == 0
    first = client.patch(f"/v1/language/phrases/{phrase['id']}", json={"rating": "good"}).json()
    second = client.patch(f"/v1/language/phrases/{phrase['id']}", json={"rating": "good"}).json()
    again = client.patch(f"/v1/language/phrases/{phrase['id']}", json={"rating": "again"}).json()
    assert first["interval_days"] == 1 and second["interval_days"] == 3 and again["interval_days"] == 0
    assert again["review_count"] == 3
    assert datetime.fromisoformat(again["due_at"]) - datetime.fromisoformat(again["last_reviewed_at"]) == timedelta(minutes=10)
    other = make_profile(client, workspace[0], learner_name="Alex", target_language="fr")
    assert client.post(f"/v1/language/profiles/{other['id']}/phrases", json=payload).status_code == 422
    assert client.get(f"/v1/language/profiles/{other['id']}/phrases").json() == []


def test_owner_isolation_for_all_learning_resources(client, workspace, learner):
    profile, day = learner
    phrase = client.post(f"/v1/language/profiles/{profile['id']}/phrases", json={"text": "hola", "translation": "hello"}).json()
    app.dependency_overrides[owner_id] = lambda: "owner-b"
    for path in [f"/v1/projects/{workspace[0]['id']}/language/profiles", f"/v1/language/profiles/{profile['id']}", f"/v1/language/profiles/{profile['id']}/days", f"/v1/language/days/{day}", f"/v1/language/profiles/{profile['id']}/phrases"]:
        assert client.get(path).status_code == 404
    assert send(client, day).status_code == 404
    assert client.patch(f"/v1/language/phrases/{phrase['id']}", json={"rating": "good"}).status_code == 404
    assert client.post(f"/v1/language/profiles/{profile['id']}/phrases", json={"text": "hola", "translation": "hello"}).status_code == 404


def test_retry_cannot_reorder_later_messages_or_write_to_past_day(client, learner, monkeypatch):
    _, day = learner
    original = send(client, day, "Hola", "reply", "first-failed-reply").json()
    client.post(f"/v1/runs/{original['id']}/cancel")
    following = send(client, day, "Buenos días", "reply", "later-reply").json()
    assert client.post(f"/v1/runs/{original['id']}/retry", json={"idempotency_key": "retry-while-active"}).status_code == 409
    finish(monkeypatch)
    assert client.post(f"/v1/runs/{original['id']}/retry", json={"idempotency_key": "retry-after-later"}).json()["detail"]["code"] == "lesson_moved_on"
    monkeypatch.setattr("powwow.language.now", lambda: now() + timedelta(days=1))
    assert client.post(f"/v1/runs/{original['id']}/retry", json={"idempotency_key": "retry-past-day"}).json()["detail"]["code"] == "past_lesson"


def test_interrupted_worker_recovers_without_duplicate_transcript(client, learner, monkeypatch):
    _, day = learner
    run = send(client, day, "Hola", "reply", "worker-interruption").json()
    first = claim()
    assert first[1] == 1
    with SessionLocal() as db:
        current = db.get(Run, run["id"])
        current.lease_expires_at = now() - timedelta(seconds=90)
        current.output_text = '{"text": "partial'
        db.commit()
    finish(monkeypatch)
    detail = client.get(f"/v1/language/days/{day}").json()
    assert detail["last_run"]["status"] == "succeeded"
    assert [turn["role"] for turn in detail["turns"]] == ["user", "assistant"]
    assert detail["turns"][-1]["reply"] == reply()


def test_cjk_glosses_keep_original_characters_without_invented_spaces():
    parsed = parse_reply(json.dumps({"text": "你好！", "translation": "Hello!", "segments": [{"text": "你好", "translation": "hello"}, {"text": "！", "translation": ""}]}))
    assert "".join(segment.text for segment in parsed.segments) == "你好！"


def test_model_omitted_segment_whitespace_is_recovered_without_altering_glosses():
    value = {**reply(), "text": "¡Hola! ¿Cómo estás hoy?", "translation": "Hello! How are you today?", "segments": [
        {"text": "¡Hola!", "translation": "Hello!"}, {"text": "¿Cómo", "translation": "How"},
        {"text": "estás", "translation": "are you"}, {"text": "hoy?", "translation": "today?"}]}
    parsed = parse_reply(json.dumps(value))
    assert "".join(segment.text for segment in parsed.segments) == value["text"]
    assert [segment.translation for segment in parsed.segments] == [segment["translation"] for segment in value["segments"]]
    assert parsed.text == value["text"] and parsed.translation == value["translation"]


@pytest.mark.parametrize("segment", ["Como ", "¿Como ", "¿Cómo! ", "Qué ", "cómo "])
def test_alignment_never_repairs_changed_letters_accents_or_punctuation(segment):
    value = reply()
    value["segments"][0]["text"] = segment
    with pytest.raises(ValueError):
        parse_reply(json.dumps(value))


def test_alignment_cannot_insert_whitespace_inside_a_semantically_different_word():
    value = {"text": "the rapist", "translation": "test", "segments": [{"text": "therapist", "translation": "a clinician"}]}
    with pytest.raises(ValueError):
        parse_reply(json.dumps(value))


def test_failed_starter_retries_to_one_assistant_without_synthetic_user_turn(client, learner, monkeypatch):
    _, day = learner
    run = send(client, day, "Begin with a hobby question", "start", "failed-first-greeting").json()
    monkeypatch.setattr("powwow.worker.fixture_result", lambda _: {"text": "invalid", "artifacts": []})
    execute(*claim())
    assert client.get(f"/v1/language/days/{day}").json()["turns"] == []
    retry = client.post(f"/v1/runs/{run['id']}/retry", json={"idempotency_key": "retry-first-greeting"})
    assert retry.status_code == 201, retry.text
    assert retry.json()["settings"]["language_action"] == "start"
    finish(monkeypatch)
    detail = client.get(f"/v1/language/days/{day}").json()
    assert [turn["role"] for turn in detail["turns"]] == ["assistant"]
    assert send(client, day, key="remount-after-start-retry").json()["id"] == retry.json()["id"]
