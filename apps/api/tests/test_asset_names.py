from types import SimpleNamespace
import pytest

from powwow.asset_names import generated_name
from powwow.worker import claim, execute


@pytest.mark.parametrize('prompt,mime,expected', [
    ('Please create an image of a red fox in a snowy forest', 'image/png', 'red-fox-in-a-snowy-forest.png'),
    ('Generate a video of lanterns over the river', 'video/mp4', 'lanterns-over-the-river.mp4'),
    ('Create a 3D model of a brass lantern', 'model/gltf-binary', 'brass-lantern.glb'),
    ('Compose music for a moonlit village', 'audio/mpeg', 'moonlit-village.mp3'),
    ('Generate a sound of rain on a window', 'audio/wav', 'rain-on-a-window.wav'),
    ('Crée une forêt enchantée', 'image/webp', 'crée-une-forêt-enchantée.webp'),
])
def test_names_cover_media_types(prompt, mime, expected):
    assert generated_name(SimpleNamespace(prompt=prompt, settings={}), mime, {}) == expected


def test_saved_subject_safe_names_and_distinct_variants():
    run = SimpleNamespace(prompt='ignored brief', settings={'asset_subject': 'Mara Finch'})
    assert generated_name(run, 'image/png', {}) == 'mara-finch.png'
    assert generated_name(run, 'model/gltf-binary', {'variant': 'raw'}) != generated_name(run, 'model/gltf-binary', {'variant': 'validated'})
    for subject in ['../../CON', 'C:\\private\\file?.png', '...','x'*500]:
        run.settings['asset_subject'] = subject
        name = generated_name(run, 'image/png', {})
        assert len(name) < 120 and not any(c in name for c in '/\\:*?"<>|')
        assert name.lower() != 'con.png'


def test_worker_names_asset_and_retains_its_brief_as_reference(client, workspace):
    project, chat = workspace
    msg = client.post(f"/v1/chats/{chat['id']}/messages", json={'content': 'Draw a silver owl under moonlight'}).json()
    run = client.post('/v1/runs', json={'chat_id':chat['id'], 'message_id':msg['id'], 'capability':'text_to_image', 'idempotency_key':'named-output-test'}).json()
    execute(*claim())
    result = client.get('/v1/runs/'+run['id']).json()
    asset = client.get('/v1/artifacts/'+result['artifact_ids'][0]).json()
    assert asset['name'] == 'silver-owl-under-moonlight.png'
    assert 'silver-owl-under-moonlight.png' in client.get(asset['download_url']).headers['content-disposition']
    uploaded = client.post('/v1/uploads', data={'project_id':project['id']}, files={'file':('Notes.txt',b'The owl watches the gate.','text/plain')}).json()
    # Sending two references keeps real IDs and contents, not just pasted names.
    ids = [asset['id'], uploaded['id']]
    msg = client.post(f"/v1/chats/{chat['id']}/messages", json={'content':'Use these references for the gate scene.', 'attachment_ids':ids}).json()
    run = client.post('/v1/runs', json={'chat_id':chat['id'], 'message_id':msg['id'], 'capability':'chat', 'idempotency_key':'two-reference-test', 'attachment_ids':ids}).json()
    sources = [item for item in run['context_snapshot'] if item['source_type']=='artifact']
    assert {item['source_id'] for item in sources} == set(ids)
    assert next(item for item in sources if item['source_id']==asset['id'])['creation_brief'] == 'Draw a silver owl under moonlight'
    assert next(item for item in sources if item['source_id']==uploaded['id'])['content'] == 'The owl watches the gate.'
    assert client.get('/v1/artifacts/'+uploaded['id']).json()['name'] == 'Notes.txt'


@pytest.mark.parametrize('mime,filename', [('image/png','TimeSoldier.png'), ('video/mp4','MarchingSoldier.mp4'), ('model/gltf-binary','TimeSoldier.glb'), ('audio/mpeg','SoldierTheme.mp3')])
def test_explicit_names_preserve_case_and_safe_basename(mime, filename):
    run = SimpleNamespace(prompt=f"Please name the new asset '{filename}'", settings={})
    assert generated_name(run, mime, {}) == filename
    run.settings['requested_filename'] = filename
    assert generated_name(run, mime, {'variant':'validated'}) == filename
    assert '-raw.' in generated_name(run, mime, {'variant':'raw'})
    run.settings['requested_filename'] = '../../NUL.png'
    assert '/' not in generated_name(run, mime, {})
