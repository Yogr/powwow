import json
from datetime import timedelta

import httpx
import pytest

from powwow.auth import owner_id
from powwow.db import SessionLocal, now
from powwow.intent import infer_task
from powwow.main import app
from powwow.models import IntentDecision, Run
from powwow.providers import chat_messages
from powwow.worker import claim, execute


def plan(client, prompt, **extra):
    response = client.post('/v1/intent', json={'prompt': prompt, **extra})
    assert response.status_code == 200, response.text
    return response.json()


def submit(client, chat, prompt, decision, key='intent-request-0001'):
    message = client.post(f"/v1/chats/{chat['id']}/messages", json={'content': prompt}).json()
    body = {'chat_id': chat['id'], 'message_id': message['id'], 'capability': 'auto', 'intent_id': decision['id'], 'idempotency_key': key}
    return client.post('/v1/runs', json=body), body


def test_writing_plan_survives_execution_and_applies_guidance(client, workspace):
    prompt = 'Develop a novel about a sculptor who can make 3D objects appear.'
    decision = plan(client, prompt)
    assert decision['task'] == 'creative_writing'
    assert decision['capability'] == 'chat'
    assert decision['method'] == 'pending'  # test environment never calls real inference
    assert 'story_development@1' in decision['skill_ids']
    assert plan(client, prompt)['id'] == decision['id']
    response, _ = submit(client, workspace[1], prompt, decision)
    assert response.status_code == 201, response.text
    with SessionLocal() as db:
        run = db.get(Run, response.json()['id'])
        assert 'character motivations' in chat_messages(run)[0]['content']
    execute(*claim())
    result = client.get('/v1/runs/' + response.json()['id']).json()
    assert result['status'] == 'succeeded'
    assert result['workflow_id'] == 'project.experience.v2'
    assert result['model_provenance']['routing']['task'] == 'creative_writing'
    assert 'story_development@1' in result['model_provenance']['skills']


def test_decision_requires_same_owner_prompt_and_valid_lifetime(client, workspace):
    decision = plan(client, 'Write a novel outline')
    response, _ = submit(client, workspace[1], 'Write a different novel outline', decision)
    assert response.status_code == 409
    assert response.json()['detail']['code'] == 'intent_mismatch'
    with SessionLocal() as db:
        db.get(IntentDecision, decision['id']).expires_at = now() - timedelta(seconds=1)
        db.commit()
    response, _ = submit(client, workspace[1], 'Write a novel outline', decision, 'expired-request')
    assert response.status_code == 409
    assert response.json()['detail']['code'] == 'intent_expired'
    app.dependency_overrides[owner_id] = lambda: 'other-owner'
    project = client.post('/v1/projects', json={'name': 'Other'}).json()
    chat = client.post('/v1/chats', json={'project_id': project['id']}).json()
    response, _ = submit(client, chat, 'Write a novel outline', decision)
    assert response.status_code == 404


def test_accepted_run_replays_after_plan_expires(client, workspace):
    prompt = 'Write a novel outline'
    decision = plan(client, prompt)
    response, body = submit(client, workspace[1], prompt, decision)
    assert response.status_code == 201
    with SessionLocal() as db:
        db.get(IntentDecision, decision['id']).expires_at = now() - timedelta(seconds=1)
        db.commit()
    replay = client.post('/v1/runs', json=body)
    assert replay.status_code == 201, replay.text
    assert replay.json()['id'] == response.json()['id']


def test_preflight_reports_missing_image_and_discussion_stays_chat(client):
    decision = plan(client, 'Make a 3D model of this mug', capability='image_to_3d')
    assert decision['capability'] == 'image_to_3d'
    assert decision['needs_image'] is True
    explanation = plan(client, 'Explain how to create a 3D model from an image')
    assert explanation['capability'] == 'chat'
    assert explanation['needs_image'] is False


def test_unbudgeted_legacy_classifier_is_not_called(client, monkeypatch):
    def forbidden(*args):
        raise AssertionError('Legacy local classifier must not run')
    monkeypatch.setattr('powwow.intent.infer_task', forbidden)
    decision = plan(client, 'An alternate-history lunar adventure')
    assert decision['capability'] == 'chat'
    assert decision['method'] == 'pending'
    assert decision['model'] is None
    assert 'search_query' not in decision


@pytest.mark.parametrize('content', ['[]', '{"task": "delete_database", "lookup": false, "query": ""}', '{"task": [], "lookup": false, "query": ""}', 'not json'])
def test_invalid_classifier_output_has_safe_fallback(content):
    with httpx.Client(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={'message': {'content': content}}))) as client:
        assert infer_task('test', False, client) is None


def test_classifier_structured_response_records_model():
    def response(request):
        data = json.loads(request.content)
        assert data['format']['additionalProperties'] is False
        assert data['options']['num_predict'] == 160
        return httpx.Response(200, json={'message': {'content': json.dumps({'task': 'image', 'lookup': False, 'query': ''})}, 'total_duration': 250000000})
    with httpx.Client(transport=httpx.MockTransport(response)) as client:
        result = infer_task('Make a ceramic cup product photograph', False, client)
    assert result['task'] == 'image'
    assert result['duration_seconds'] == .25


def test_still_running_media_prevents_classifier_gpu_call(monkeypatch):
    monkeypatch.setattr('powwow.intent.media_is_busy', lambda: True)
    requests = []
    with httpx.Client(transport=httpx.MockTransport(lambda request: requests.append(request))) as client:
        assert infer_task('A new request', False, client) is None
    assert not requests
