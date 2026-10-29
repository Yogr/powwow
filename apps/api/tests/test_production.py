"""Software contracts only; fixture models do not qualify visual quality."""
import base64
import io
import json
from pathlib import Path

import pytest
from PIL import Image

from powwow.db import SessionLocal
from powwow.models import Account, Artifact, Run, UsageEntry
from powwow.production import FinishPlan, Pipeline, validate_finish_plan, validate_isolation
from powwow.providers import ProviderFailure
from powwow.worker import claim, execute


def png():
    data = io.BytesIO()
    Image.new('RGB', (32, 32), 'orange').save(data, 'PNG')
    return data.getvalue()


def isolated_png():
    image = Image.open(io.BytesIO(png())).convert('RGBA')
    alpha = Image.new('L', image.size, 0)
    alpha.paste(255, (4, 4, 28, 28))
    image.putalpha(alpha)
    data = io.BytesIO()
    image.save(data, 'PNG')
    return data.getvalue()


GLB = Path(__file__).resolve().parents[3] / 'evals/fixtures/validated-fixture.glb'
REPORT = {'tool': 'Blender', 'version': 'fixture', 'mesh_objects': 1,
          'meshes': [{'index': 0}], 'materials': [{'name': 'clay'}], 'views': ['front', 'back', 'side', 'three-quarter']}
PLAN = {'acceptable_reference_and_geometry': True, 'blocking_issues': [], 'meshes': [], 'materials': []}


def setup(client, workspace, budget=1):
    project, chat = workspace
    asset = client.post('/v1/uploads', data={'project_id': project['id']}, files={'file': ('Mug.png', png(), 'image/png')}).json()
    msg = client.post(f"/v1/chats/{chat['id']}/messages", json={'content': 'Create a finished textured model named Mug.glb', 'attachment_ids': [asset['id']]}).json()
    run = client.post('/v1/runs', json={'chat_id': chat['id'], 'message_id': msg['id'], 'capability': 'image_to_3d', 'idempotency_key': 'production-fixture-test', 'budget_usd': budget}).json()
    assert run['workflow_id'] == 'asset.production.v1'
    with SessionLocal() as db:
        db.get(Run, run['id']).provider = 'local_media'
        db.commit()
    return run


def configure(monkeypatch, fault=None, signed=False):
    calls = []
    monkeypatch.setattr('powwow.production.availability', lambda: {'available': True})
    def hosted(run, cancelled, submitted):
        name = run.settings['production_request_id'].split('-')[-1]
        calls.append(name)
        run.settings['hosted_input_tokens'] = 100
        submitted()
        if fault == 'uncertain':
            raise ProviderFailure('submission_uncertain', 'Fixture interrupted request')
        value = {'image_prompt': 'Prepare this mug for reconstruction preserving the shape and texture.', 'constraints': []} if name == 'prepare_reference' else dict(PLAN) if name == 'plan_finishing' else {'passed': fault != 'quality', 'issues': ['Broken handle'] if fault == 'quality' else [], 'summary': 'Fixture review'}
        if name == 'plan_finishing' and fault == 'mesh':
            value['acceptable_reference_and_geometry'] = False
            value['blocking_issues'] = ['Missing handle']
        result = {'text': json.dumps(value), 'artifacts': [], 'model': 'vision-fixture', 'metrics': {'cost_estimate_usd': .02}, 'provenance': {'simulated': True, 'policy': run.settings['intelligence_policy']}}
        if fault == 'incomplete' and name == 'plan_finishing':
            result.update(text='{', error='Fixture incomplete response', error_code='response_incomplete')
        return result
    monkeypatch.setattr('powwow.production.openai_chat', hosted)
    if signed:
        monkeypatch.setattr('powwow.production.Storage.sign_output', lambda self, key, mime: {'storage_key': key})
    def deliver(payload, artifacts):
        if signed:
            from powwow.storage import Storage
            for artifact in artifacts:
                variant = 'raw' if artifact['metadata'].get('variant') == 'raw' else 'final'
                key = (payload['output_uploads'][variant] if 'output_uploads' in payload else payload['output_upload'])['storage_key']
                Storage().put(key, base64.b64decode(artifact.pop('base64')), artifact['mime_type'])
                artifact['storage_key'] = key
                if fault == 'foreign_output':
                    artifact['storage_key'] = 'another-owner/private.png'
                if fault == 'swapped_output' and variant == 'raw':
                    artifact['storage_key'] = payload['output_uploads']['final']['storage_key']
        return {'artifacts': artifacts, 'model': 'media-fixture'}
    def media(run, payload, cancelled):
        calls.append(payload['capability'])
        if payload['capability'] == 'text_to_image':
            source = payload['source_images'][0]
            from powwow.storage import digest
            meta = {'media_operation': payload['settings']['media_operation'], 'reference_images': [{'artifact_id': source['artifact_id'], 'sha256': digest(base64.b64decode(source['base64']))}]}
            return deliver(payload, [{'base64': base64.b64encode(isolated_png() if payload['settings']['media_operation'] == 'segment' else png()).decode(), 'mime_type': 'image/png', 'metadata': meta}])
        assert payload['settings']['trellis_profile'] == 'detailed'
        return deliver(payload, [{'base64': base64.b64encode(GLB.read_bytes()).decode(), 'mime_type': 'model/gltf-binary', 'metadata': {'variant': variant}} for variant in ('raw', 'validated')])
    monkeypatch.setattr('powwow.production.local_media', media)
    def blender(self, name, source, plan=None):
        cached = self.checkpoint(name)
        if cached:
            return cached
        calls.append(name)
        if name == 'finish_and_texture' and fault == 'blender':
            raise ProviderFailure('blender_finish_failed', 'Fixture Blender failure')
        views = [self.save(name + str(index), png(), 'image/png').id for index in range(4)]
        artifacts = []
        if plan is not None:
            final = self.save('finished', GLB.read_bytes(), 'model/gltf-binary', {'quality_review': 'pending', 'preview_artifact_id': views[1], 'blender_validated': True})
            artifacts.append(final.id)
        checkpoint = {'status': 'completed', 'views': views, 'artifacts': artifacts, 'report': REPORT}
        self.record(name, checkpoint)
        return checkpoint
    monkeypatch.setattr(Pipeline, 'blender', blender)
    return calls


@pytest.mark.parametrize('signed', [False, True])
def test_complete_pipeline_charges_each_stage_once_and_links_static_preview(client, workspace, monkeypatch, signed):
    run = setup(client, workspace)
    calls = configure(monkeypatch, signed=signed)
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['status'] == 'succeeded', result['error']
    assert result['actual_cost_usd'] == .06
    assert calls == ['prepare_reference', 'text_to_image', 'text_to_image', 'image_to_3d', 'inspect_mesh', 'plan_finishing', 'finish_and_texture', 'review_export']
    final = client.get('/v1/artifacts/' + result['artifact_ids'][0]).json()
    assert final['name'] == 'Mug.glb' and final['preview_url'].endswith('/content')
    assert client.get(final['preview_url']).status_code == 200
    assert final['metadata']['quality_review']['passed'] is True
    with SessionLocal() as db:
        account = db.get(Account, 'test-owner-a')
        assert account.spent_usd == .06 and account.reserved_usd == 0
        assert db.query(UsageEntry).one().actual_cost_usd == .06
        assert db.query(Artifact).filter_by(run_id=run['id']).count() > 1


@pytest.mark.parametrize('fault', ['foreign_output', 'swapped_output'])
def test_signed_outputs_require_exact_server_issued_stage_and_variant(client, workspace, monkeypatch, fault):
    run = setup(client, workspace)
    calls = configure(monkeypatch, fault, signed=True)
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['status'] == 'failed' and result['error']['code'] == 'invalid_output'
    assert 'inspect_mesh' not in calls


@pytest.mark.parametrize('fault,code,cost', [('uncertain', 'submission_uncertain', 0), ('mesh', 'quality_review_failed', .04), ('quality', 'quality_review_failed', .06)])
def test_failed_quality_and_unknown_billing_never_repeat_paid_stages(client, workspace, monkeypatch, fault, code, cost):
    run = setup(client, workspace)
    calls = configure(monkeypatch, fault)
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['status'] == 'failed' and result['error']['code'] == code
    assert result['actual_cost_usd'] == cost
    retry = client.post('/v1/runs/' + run['id'] + '/retry', json={'idempotency_key': 'production-retry'})
    assert retry.status_code == 409
    if fault == 'uncertain':
        assert calls == ['prepare_reference']
        with SessionLocal() as db:
            assert db.get(Account, 'test-owner-a').reserved_usd > 0
            assert not db.query(UsageEntry).count()
    else:
        assert result['artifact_ids']
        if fault == 'mesh':
            assets = [client.get('/v1/artifacts/' + value).json() for value in result['artifact_ids']]
            review = [asset for asset in assets if asset['kind'] == 'model3d' and not asset['metadata'].get('auxiliary')]
            assert len(review) == 1 and review[0]['metadata']['quality_review']['passed'] is False
            assert review[0]['preview_url'].endswith('/content')


def test_known_blender_failure_resumes_without_repaying_or_regenerating(client, workspace, monkeypatch):
    run = setup(client, workspace)
    configure(monkeypatch, 'blender')
    execute(*claim())
    assert client.get('/v1/runs/' + run['id']).json()['actual_cost_usd'] == .04
    retry = client.post('/v1/runs/' + run['id'] + '/retry', json={'idempotency_key': 'production-resume'}).json()
    calls = configure(monkeypatch)
    execute(*claim())
    result = client.get('/v1/runs/' + retry['id']).json()
    assert result['status'] == 'succeeded', result['error']
    assert result['actual_cost_usd'] == .02
    assert calls == ['finish_and_texture', 'review_export']
    with SessionLocal() as db:
        assert db.get(Account, 'test-owner-a').spent_usd == .06


def test_stage_reservation_happens_before_submission(client, workspace, monkeypatch):
    run = setup(client, workspace, budget=.01)
    calls = configure(monkeypatch)
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['error']['code'] == 'budget_too_low'
    assert result['actual_cost_usd'] == 0
    assert calls == ['prepare_reference']


def test_explicit_stronger_review_reuses_model_and_keeps_failed_paid_plan(client, workspace, monkeypatch):
    run = setup(client, workspace)
    with monkeypatch.context() as previous:
        from powwow.intelligence import LANGUAGE_TIERS
        configure(previous, 'incomplete')
        previous.setattr(Pipeline, 'policy', lambda self, name: LANGUAGE_TIERS['smarter'])
        execute(*claim())
    assert client.post('/v1/runs/' + run['id'] + '/retry', json={'idempotency_key': 'same-model-retry'}).status_code == 409
    retry = client.post('/v1/runs/' + run['id'] + '/retry', json={'idempotency_key': 'stronger-model-review', 'intelligence': 'super'}).json()
    calls = configure(monkeypatch)
    execute(*claim())
    result = client.get('/v1/runs/' + retry['id']).json()
    assert result['status'] == 'succeeded', result['error']
    assert calls == ['plan_finishing', 'finish_and_texture', 'review_export']
    assert result['model_provenance']['production']['plan_finishing']['result']['provenance']['policy']['model'] == 'gpt-6-astra'
    assert client.get('/v1/runs/' + run['id']).json()['error']['code'] == 'response_incomplete'
    with SessionLocal() as db:
        assert db.get(Account, 'test-owner-a').spent_usd == .08


def test_finish_plan_rejects_unidentified_meshes_and_materials():
    plan = FinishPlan.model_validate({**PLAN, 'meshes': [{'index': 5, 'reason': 'test', 'remove_loose': True, 'merge_distance_ratio': 0, 'recalculate_normals': False, 'smooth_shading': False}]})
    with pytest.raises(ProviderFailure, match='unknown'):
        validate_finish_plan(plan, REPORT)


def test_foreground_must_preserve_pixels_and_remove_background():
    assert validate_isolation(isolated_png(), png())['rgb_verified']
    with pytest.raises(ProviderFailure, match='transparent'):
        validate_isolation(png(), png())
    other = io.BytesIO()
    Image.new('RGB', (32, 32), 'blue').save(other, 'PNG')
    with pytest.raises(ProviderFailure, match='pixels'):
        validate_isolation(isolated_png(), other.getvalue())
