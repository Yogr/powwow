import base64
import io
import json

import httpx
import pytest
from PIL import Image
from pydantic import SecretStr

from powwow.config import settings
from powwow.hosted_images import generate
from powwow.providers import ProviderFailure


def test_explicit_transparency_naming_format_usage_and_single_call(monkeypatch):
    monkeypatch.setattr(settings(), 'openai_api_key', SecretStr('fixture-key'))
    buffer = io.BytesIO(); Image.new('RGBA', (32, 32)).save(buffer, 'PNG')
    calls = []
    def handler(request):
        calls.append(json.loads(request.content))
        return httpx.Response(200, json={'data': [{'b64_json': base64.b64encode(buffer.getvalue()).decode()}],
            'usage': {'input_tokens': 100, 'output_tokens': 1000}})
    real = httpx.Client
    monkeypatch.setattr('powwow.hosted_images.httpx.Client', lambda **kw: real(transport=httpx.MockTransport(handler), **kw))
    submitted = []
    data, metadata = generate('One Hollow Infantry', True, [], 'task-test', lambda: False, lambda: submitted.append(True))
    assert data == buffer.getvalue() and submitted == [True] and len(calls) == 1
    assert calls[0]['background'] == 'transparent' and calls[0]['output_format'] == 'png'
    assert calls[0]['n'] == 1 and calls[0]['prompt'] == 'One Hollow Infantry'
    assert metadata['cost_estimate_usd'] == .0308


def test_timeout_never_retries(monkeypatch):
    monkeypatch.setattr(settings(), 'openai_api_key', SecretStr('fixture-key'))
    calls = []
    def handler(request):
        calls.append(True)
        raise httpx.ReadTimeout('fixture lost response')
    real = httpx.Client
    monkeypatch.setattr('powwow.hosted_images.httpx.Client', lambda **kw: real(transport=httpx.MockTransport(handler), **kw))
    with pytest.raises(ProviderFailure) as exc:
        generate('One robot', False, [], 'uncertain-test', lambda: False, lambda: None)
    assert exc.value.code == 'submission_uncertain' and calls == [True]
