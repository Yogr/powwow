from types import SimpleNamespace
import json

import httpx
import pytest

from powwow.config import settings
from powwow.providers import Cancelled, ProviderFailure, _ollama_chat, chat_messages, local_media, ollama_chat, runpod


def fake_run():
    return SimpleNamespace(capability="chat", budget_usd=1, external_request_id=None, settings={})


class ProviderClient:
    calls = []
    failures = 0

    def __init__(self, **kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def post(self, url, **kwargs):
        self.calls.append(("POST", url))
        return httpx.Response(200, json={"id": "external-123", "status": "CANCELLED"}, request=httpx.Request("POST", url))

    def get(self, url, **kwargs):
        self.calls.append(("GET", url))
        if self.failures:
            self.failures -= 1
            raise httpx.ConnectError("Temporary network interruption")
        return httpx.Response(200, json={"status": "COMPLETED", "output": {"text": "ready"}, "executionTime": 1000}, request=httpx.Request("GET", url))


@pytest.fixture
def provider(monkeypatch):
    ProviderClient.calls = []
    ProviderClient.failures = 0
    monkeypatch.setattr("powwow.providers.httpx.Client", ProviderClient)
    monkeypatch.setattr("powwow.providers.time.sleep", lambda seconds: None)
    return ProviderClient


def test_transient_status_error_never_resubmits(provider):
    provider.failures = 1
    ids = []
    result = runpod(fake_run(), {}, ids.append, lambda: False, lambda *args: None)
    assert result["text"] == "ready"
    assert ids == ["external-123"]
    assert len([call for call in provider.calls if call[1].endswith("/run")]) == 1


def test_cancel_seen_during_stage_cancels_provider(provider):
    def stage(*args):
        raise Cancelled()
    with pytest.raises(Cancelled):
        runpod(fake_run(), {}, lambda value: None, lambda: False, stage)
    assert any("/cancel/external-123" in call[1] for call in provider.calls)


def test_failed_provider_id_persistence_retains_uncertainty(provider):
    def save_id(value):
        raise RuntimeError("Database went away")
    with pytest.raises(ProviderFailure) as exc:
        runpod(fake_run(), {}, save_id, lambda: False, lambda *args: None)
    assert exc.value.code == "submission_uncertain"


def test_superseded_worker_does_not_cancel_shared_remote_job(provider):
    run = fake_run()
    run.external_request_id = "existing-job"
    def lease_lost():
        raise ProviderFailure("lease_lost", "New owner")
    with pytest.raises(ProviderFailure) as exc:
        runpod(run, {}, lambda value: None, lease_lost, lambda *args: None)
    assert exc.value.code == "lease_lost"
    assert not provider.calls


def test_lookup_context_has_sources_and_no_contradictory_no_search_claim():
    run = SimpleNamespace(capability="chat", model_provenance={}, chat_id="chat", message_id="message", prompt="Tell me about pottery", settings={"web_search": True}, context_snapshot=[{"source_type": "web", "source_id": "1", "version": "now", "search_provider": "Wikipedia", "content": "Pottery...", "url": "https://en.wikipedia.org/wiki/Pottery"}])
    messages = chat_messages(run)
    assert "Cite factual claims" in messages[0]["content"]
    assert "no live internet search tool" not in messages[0]["content"]
    assert "https://en.wikipedia.org/wiki/Pottery" in messages[0]["content"]


def test_still_running_media_blocks_loading_or_repeating_a_model(monkeypatch):
    monkeypatch.setattr('powwow.providers.media_is_busy', lambda: True)
    for call in [lambda: ollama_chat(fake_run(), lambda _: None, lambda: False), lambda: local_media(fake_run(), {}, lambda: False)]:
        with pytest.raises(ProviderFailure) as error:
            call()
        assert error.value.code == 'gpu_busy'


def test_language_ollama_request_constrains_output_shape_and_word_hints(monkeypatch):
    sent = {}

    class Response:
        is_success = True

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def raise_for_status(self):
            pass

        def json(self):
            return {"models": []}

        def iter_lines(self):
            yield json.dumps({"message": {"content": '{"text":"Hola"}'}, "done": True, "done_reason": "stop", "eval_count": 10})

    class Client(Response):
        def __init__(self, **kwargs):
            pass

        def get(self, url):
            return Response()

        def stream(self, method, url, **kwargs):
            sent.update(kwargs["json"])
            return Response()

    monkeypatch.setattr("powwow.providers.httpx.Client", Client)
    monkeypatch.setattr("powwow.providers.chat_messages", lambda _: [{"role": "system", "content": "Language instructions"}])
    output = _ollama_chat(SimpleNamespace(settings={"language_learning": True}), lambda _: None, lambda: False)
    assert output["provenance"]["output_limit"] == 4096
    assert sent["format"]["type"] == "object"
    assert sent["format"]["additionalProperties"] is False
    assert sent["format"]["$defs"]["LanguageSegment"]["properties"]["text"]["pattern"] == r"^[ \t\r\n]*[^ \t\r\n]*[ \t\r\n]*$"
    assert sent["options"]["num_predict"] == 4096
    assert sent["options"]["num_ctx"] == 16384
    assert sent["options"]["temperature"] == .4
