import base64
import io
import json
import struct

from PIL import Image

from powwow.db import SessionLocal
from powwow.models import Run
from powwow.worker import claim, execute


def glb():
    # Minimal container fixture: these tests cover storage/lineage, not geometry.
    scene = json.dumps({'asset': {'version': '2.0'}, 'meshes': [{'primitives': []}]}).encode()
    scene += b' ' * (-len(scene) % 4)
    return struct.pack('<III', 0x46546c67, 2, 20 + len(scene)) + struct.pack('<II', len(scene), 0x4E4F534A) + scene


def setup_run(client, workspace):
    project, chat = workspace
    image = io.BytesIO()
    Image.new('RGB', (32, 32), 'blue').save(image, 'PNG')
    upload = client.post('/v1/uploads', data={'project_id': project['id'], 'chat_id': chat['id']}, files={'file': ('source.png', image.getvalue(), 'image/png')}).json()
    message = client.post(f"/v1/chats/{chat['id']}/messages", json={'content': 'Make a 3D model', 'attachment_ids': [upload['id']]}).json()
    response = client.post('/v1/runs', json={'chat_id': chat['id'], 'message_id': message['id'], 'capability': 'image_to_3d', 'idempotency_key': 'mesh-storage-test'})
    assert response.status_code == 201, response.text
    run = response.json()
    with SessionLocal() as db:
        db.get(Run, run['id']).provider = 'local_media'
        # These fixtures exercise the explicitly requested concept workflow.
        db.get(Run, run['id']).workflow_id = 'asset.image_to_3d.v1'
        db.commit()
    return run, upload


def output(variant):
    return {'base64': base64.b64encode(glb()).decode(), 'mime_type': 'model/gltf-binary', 'filename': variant + '.glb', 'metadata': {'variant': variant}}


def test_raw_and_final_are_separate_durable_artifacts_with_lineage(client, workspace, monkeypatch):
    run, upload = setup_run(client, workspace)
    monkeypatch.setattr('powwow.worker.local_media', lambda *args: {'model': 'test-only', 'artifacts': [output('validated'), output('raw')]})
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['status'] == 'succeeded'
    artifacts = [client.get('/v1/artifacts/' + key).json() for key in result['artifact_ids']]
    raw, final = artifacts
    assert raw['metadata']['variant'] == 'raw'
    assert final['metadata']['variant'] == 'validated'
    assert raw['id'] in final['lineage_ids']
    assert upload['id'] in raw['lineage_ids']
    for artifact in artifacts:
        assert client.get(artifact['download_url']).content == glb()


def test_failed_postprocessing_keeps_raw_without_claiming_success(client, workspace, monkeypatch):
    run, upload = setup_run(client, workspace)
    monkeypatch.setattr('powwow.worker.local_media', lambda *args: {'model': 'test-only', 'error': 'Blender validation did not finish', 'artifacts': [output('raw')]})
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['status'] == 'failed'
    assert result['error']['code'] == 'postprocessing_failed'
    assert len(result['artifact_ids']) == 1
    raw = client.get('/v1/artifacts/' + result['artifact_ids'][0]).json()
    assert raw['lineage_ids'] == [upload['id']]
    assert client.get(raw['download_url']).content == glb()


def test_worker_cannot_register_another_runs_storage_object(client, workspace, monkeypatch):
    run, _ = setup_run(client, workspace)
    monkeypatch.setattr('powwow.worker.local_media', lambda *args: {'model': 'test-only', 'artifacts': [{'mime_type': 'model/gltf-binary', 'storage_key': 'another-owner/runs/private/output.glb'}]})
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['status'] == 'failed'
    assert result['error']['code'] == 'invalid_output'
    assert not result['artifact_ids']
