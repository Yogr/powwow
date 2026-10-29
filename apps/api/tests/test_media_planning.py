import base64
import io
import json

import pytest
from PIL import Image

from powwow.db import SessionLocal
from powwow.models import Account, Run, UsageEntry
from powwow.providers import ProviderFailure, fixture_result
from powwow.worker import claim, execute


PROMPT = "Modify this soldier image to prepare it for an image to 3D model generator. Remove the gun, use a T-pose and broad blue armor panels for player skins. Name the new image 'TimeSoldier.png'."


def source(client, workspace):
    image = io.BytesIO()
    Image.new('RGB', (32, 32), 'red').save(image, 'PNG')
    return client.post('/v1/uploads', data={'project_id': workspace[0]['id']}, files={'file': ('Soldier.png', image.getvalue(), 'image/png')}).json(), image.getvalue()


def queue(client, workspace, ids, prompt=PROMPT):
    preflight = client.post('/v1/intent', json={'prompt': prompt, 'attachment_ids': ids, 'project_id': workspace[0]['id']}).json()
    assert preflight['capability'] == 'chat' and preflight['method'] == 'pending'
    msg = client.post(f"/v1/chats/{workspace[1]['id']}/messages", json={'content': prompt, 'attachment_ids': ids}).json()
    response = client.post('/v1/runs', json={'chat_id': workspace[1]['id'], 'message_id': msg['id'], 'intent_id': preflight['id'], 'attachment_ids': ids, 'idempotency_key': 'planner-test-request'})
    assert response.status_code == 201, response.text
    return response.json()


def plan(ids, workflow='image.edit.v1'):
    return {'action': 'media', 'kind': None, 'target_language': None, 'complexity': 'standard',
            'needs_response': False, 'clarification': None, 'project_title': None,
            'media': {'workflow': workflow, 'brief': PROMPT, 'output_name': 'TimeSoldier.png',
                      'source_image_ids': ids, 'steps': ['Edit the reference image', 'Save TimeSoldier.png']}}


def configure(monkeypatch, intent, fail=None):
    calls = []
    def classifier(run):
        calls.append('plan')
        assert run.settings['intelligence_policy']['reasoning_effort'] == 'high'
        return {'text': json.dumps(intent), 'model': 'planner-fixture', 'artifacts': [], 'metrics': {'cost_estimate_usd': .03}}
    monkeypatch.setattr('powwow.worker.fixture_result', classifier)
    monkeypatch.setattr('powwow.registry.binding', lambda cap: {'enabled': True, 'provider': 'local_media', 'model': 'flux-fixture', 'estimated_cost_usd': 0})
    monkeypatch.setattr('powwow.service.binding', lambda cap: {'enabled': True, 'provider': 'local_media', 'model': 'flux-fixture', 'estimated_cost_usd': 0})
    def generate(run, payload, cancelled):
        calls.append(payload)
        if fail:
            raise ProviderFailure(fail, 'Fixture failure')
        result = fixture_result(run)
        result['artifacts'][0]['metadata'] = {'media_operation': 'edit', 'reference_images': [{'artifact_id': item['artifact_id'], 'sha256': __import__('hashlib').sha256(base64.b64decode(item['base64'])).hexdigest()} for item in payload.get('source_images', [])]}
        return result
    monkeypatch.setattr('powwow.worker.local_media', generate)
    return calls


def test_planned_image_edit_uses_pixels_name_and_charges_planning_once(client, workspace, monkeypatch):
    image, raw = source(client, workspace)
    calls = configure(monkeypatch, plan([image['id']]))
    run = queue(client, workspace, [image['id']])
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['status'] == 'succeeded', result.get('error')
    assert result['capability'] == 'text_to_image' and result['workflow_id'] == 'image.edit.v1'
    assert calls[0] == 'plan' and len(calls) == 2
    assert base64.b64decode(calls[1]['source_images'][0]['base64']) == raw
    assert 'source_image' not in calls[1]
    asset = client.get('/v1/artifacts/' + result['artifact_ids'][0]).json()
    assert asset['name'] == 'TimeSoldier.png' and asset['lineage_ids'] == [image['id']]
    with SessionLocal() as db:
        saved = db.get(Run, run['id'])
        account = db.get(Account, saved.owner_id)
        assert saved.actual_cost_usd == account.spent_usd == .03
        assert account.reserved_usd == 0
        assert db.query(UsageEntry).filter_by(run_id=run['id']).one().actual_cost_usd == .03
        assert db.query(UsageEntry).filter_by(run_id=run['id']).one().provider == 'openai+local_media'
    replay = client.post('/v1/runs', json={'chat_id': workspace[1]['id'], 'message_id': run['message_id'], 'attachment_ids': [image['id']], 'idempotency_key': 'planner-test-request'})
    assert replay.status_code == 201 and replay.json()['id'] == run['id']


@pytest.mark.parametrize('workflow,ids_mode,error', [('asset.production.v1', 'valid', 'workflow_unavailable'), ('image.edit.v1', 'foreign', 'invalid_plan'), ('image.edit.v1', 'none', 'image_required')])
def test_invalid_or_unavailable_plan_never_submits_media(client, workspace, monkeypatch, workflow, ids_mode, error):
    monkeypatch.setattr('powwow.production.availability', lambda: {'available': False})
    image, _ = source(client, workspace)
    selected = [image['id']] if ids_mode == 'valid' else ['unattached-id'] if ids_mode == 'foreign' else []
    calls = configure(monkeypatch, plan(selected, workflow))
    run = queue(client, workspace, [image['id']])
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['status'] == 'failed' and result['error']['code'] == error
    assert calls == ['plan'] and result['actual_cost_usd'] == .03


def test_retry_reuses_successful_plan_and_reference_contract(client, workspace, monkeypatch):
    image, _ = source(client, workspace)
    calls = configure(monkeypatch, plan([image['id']]), fail='provider_offline')
    run = queue(client, workspace, [image['id']])
    execute(*claim())
    retry = client.post('/v1/runs/' + run['id'] + '/retry', json={'idempotency_key': 'planner-retry-request'})
    assert retry.status_code == 201, retry.text
    assert retry.json()['workflow_id'] == 'image.edit.v1'
    execute(*claim())
    assert calls.count('plan') == 1
    assert calls[-1]['settings']['media_operation'] == 'edit'
    assert calls[-1]['settings']['requested_filename'] == 'TimeSoldier.png'
    assert calls[-1]['source_images'][0]['artifact_id'] == image['id']


def test_requested_image_filename_blocks_an_incorrect_mesh_plan(client, workspace, monkeypatch):
    image, _ = source(client, workspace)
    intent = plan([image['id']], 'asset.image_to_3d.v1')
    intent['media']['output_name'] = 'WrongMesh.glb'
    calls = configure(monkeypatch, intent)
    run = queue(client, workspace, [image['id']])
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['error']['code'] == 'invalid_plan' and calls == ['plan']


def test_planning_does_not_bypass_full_storage_or_media_budget(client, workspace, monkeypatch):
    from powwow.config import settings
    image, _ = source(client, workspace)
    calls = configure(monkeypatch, plan([image['id']]))
    monkeypatch.setattr(settings(), 'free_storage_quota_bytes', image['size_bytes'])
    monkeypatch.setattr(settings(), 'max_generated_artifact_bytes', 1)
    run = queue(client, workspace, [image['id']])
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['error']['code'] == 'storage_quota' and calls == ['plan']


def test_uncertain_remote_media_retains_only_its_reservation_and_never_retries(client, workspace, monkeypatch):
    image, _ = source(client, workspace)
    calls = configure(monkeypatch, plan([image['id']]))
    monkeypatch.setattr('powwow.registry.binding', lambda cap: {'enabled': True, 'provider': 'runpod', 'model': 'flux-fixture', 'estimated_cost_usd': .08})
    def uncertain(*args):
        calls.append('remote')
        raise ProviderFailure('submission_uncertain', 'Fixture unknown submission')
    monkeypatch.setattr('powwow.worker.runpod', uncertain)
    run = queue(client, workspace, [image['id']])
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['error']['code'] == 'submission_uncertain'
    assert calls == ['plan', 'remote']
    with SessionLocal() as db:
        saved = db.get(Run, run['id'])
        account = db.get(Account, saved.owner_id)
        assert account.spent_usd == .03 and account.reserved_usd == pytest.approx(.97)
    assert client.post('/v1/runs/' + run['id'] + '/retry', json={'idempotency_key': 'unsafe-new-submission'}).status_code == 409
    assert claim() is None


def test_storage_failure_keeps_plan_and_does_not_generate(client, workspace, monkeypatch):
    image, _ = source(client, workspace)
    client.patch('/v1/account/preferences', json={'storage_mode': 'unselected'})
    calls = configure(monkeypatch, plan([image['id']]))
    run = queue(client, workspace, [image['id']])
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['error']['code'] == 'storage_choice_required'
    assert calls == ['plan']
    client.patch('/v1/projects/' + workspace[0]['id'], json={'storage_mode': 'cloud'})
    retry = client.post('/v1/runs/' + run['id'] + '/retry', json={'idempotency_key': 'planner-storage-retry'}).json()
    execute(*claim())
    result = client.get('/v1/runs/' + retry['id']).json()
    assert result['status'] == 'succeeded', result.get('error')
    assert calls.count('plan') == 1
