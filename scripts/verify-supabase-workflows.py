"""Real local inference with Supabase Auth, database records and private outputs.

Uses ignored local QA credentials; never writes tokens/passwords to the report.
Run from the repository root after scripts/start-local.ps1.
"""
import hashlib
import json
import time
import uuid
from pathlib import Path

import httpx
from sqlalchemy import text

from powwow.config import settings
from powwow.db import engine

report_path = Path('evals/reports/supabase-workflows.json')
client = httpx.Client(base_url='http://127.0.0.1:8000', timeout=45)
config = client.get('/v1/config').raise_for_status().json()
assert config['auth_mode'] == 'supabase'
assert settings().storage_backend == 'supabase'
accounts = json.loads(Path('.data/supabase-qa.json').read_text(encoding='utf-8-sig'))


def login(account):
    response = httpx.post(config['supabase_url'] + '/auth/v1/token?grant_type=password', headers={'apikey': config['supabase_anon_key']}, json={'email': account['email'], 'password': account['password']})
    response.raise_for_status()
    return {'Authorization': 'Bearer ' + response.json()['access_token']}


client.headers.update(login(accounts['primary']))
other = httpx.Client(base_url=str(client.base_url), headers=login(accounts['secondary']), timeout=30)
evidence = {'auth_mode': config['auth_mode'], 'storage_backend': settings().storage_backend, 'database_port': engine.url.port, 'runs': [], 'artifacts': [], 'checks': []}


def save():
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(evidence, indent=2), encoding='utf-8')


def call(method, path, **kwargs):
    response = client.request(method, '/v1' + path, **kwargs)
    if not response.is_success:
        raise RuntimeError(f'{method} {path}: {response.status_code}: {response.text[:500]}')
    return response.json()


project = call('POST', '/projects', json={'name': 'Supabase workflow check', 'instructions': 'QA project containing real generated outputs.'})
evidence['project_id'] = project['id']
assert other.get('/v1/projects/' + project['id']).status_code == 404
evidence['checks'].append('second Supabase account cannot access project')


def request_run(title, prompt, expected_capability, attachments=None, generation_settings=None):
    attachments = attachments or []
    plan = call('POST', '/intent', json={'prompt': prompt, 'capability': 'auto', 'attachment_ids': attachments})
    print('Intent:', title, plan['task'], plan['method'], flush=True)
    assert plan['capability'] == expected_capability, plan
    assert plan['method'] == 'model', plan
    assert plan['available'] and not plan['needs_image'], plan
    chat = call('POST', '/chats', json={'project_id': project['id'], 'title': title})
    message = call('POST', f"/chats/{chat['id']}/messages", json={'content': prompt, 'attachment_ids': attachments})
    body = {'chat_id': chat['id'], 'message_id': message['id'], 'capability': 'auto', 'intent_id': plan['id'], 'idempotency_key': 'supabase-live-' + uuid.uuid4().hex, 'settings': generation_settings or {}}
    run = call('POST', '/runs', json=body)
    assert call('POST', '/runs', json=body)['id'] == run['id']
    started = time.monotonic()
    while run['status'] not in {'succeeded', 'failed', 'cancelled'}:
        if time.monotonic() - started > 600:
            raise TimeoutError('Generation still running; inspect the saved run ID')
        time.sleep(2)
        run = call('GET', '/runs/' + run['id'])
    evidence['runs'].append(run)
    save()
    print('Completed:', title, run['status'], run['model'], flush=True)
    assert run['status'] == 'succeeded', run['error']
    assert not run['model_provenance'].get('simulated')
    assert run['model_provenance']['routing']['method'] == 'model'
    events = call('GET', f"/runs/{run['id']}/events")
    assert [event['sequence'] for event in events] == list(range(1, len(events) + 1))
    for artifact_id in run['artifact_ids']:
        artifact = call('GET', '/artifacts/' + artifact_id)
        output = client.get(artifact['download_url']).raise_for_status().content
        assert hashlib.sha256(output).hexdigest() == artifact['sha256']
        assert other.get(artifact['download_url']).status_code == 404
        evidence['artifacts'].append(artifact)
    save()
    return run


writing = request_run('Novel planning', 'Develop a concise five-beat outline for a quiet science-fiction novel about a botanist aboard a generation ship. The conflict concerns a garden that begins remembering Earth. Give the protagonist a motivation and end with a practical next drafting step.', 'chat')
assert 'story_development@1' in writing['model_provenance']['skills']
assert writing['model_provenance']['output_limit'] == 4096
assert not writing['model_provenance']['truncated']
image = request_run('Ceramic cup', 'Create an image of one handmade terracotta ceramic coffee cup, isolated and centered against a plain cream background, three-quarter product photograph, soft studio lighting, no text, no other objects.', 'text_to_image', generation_settings={'width': 512, 'height': 512, 'seed': 42})
mesh = request_run('Ceramic cup in 3D', 'Convert this source image into a textured 3D model of the cup.', 'image_to_3d', attachments=image['artifact_ids'], generation_settings={'seed': 42})
assert len(mesh['artifact_ids']) == 2
raw, final = [call('GET', '/artifacts/' + key) for key in mesh['artifact_ids']]
assert raw['metadata']['variant'] == 'raw'
assert final['metadata']['variant'] == 'validated'
assert final['metadata']['blender_validated']
assert raw['id'] in final['lineage_ids']
with engine.connect() as connection:
    assert connection.scalar(text('SELECT count(*) FROM projects WHERE id=:id'), {'id': project['id']}) == 1
    for artifact in evidence['artifacts']:
        key = connection.scalar(text('SELECT storage_key FROM artifacts WHERE id=:id'), {'id': artifact['id']})
        assert connection.scalar(text('SELECT count(*) FROM storage.objects WHERE bucket_id=:bucket AND name=:key'), {'bucket': settings().supabase_storage_bucket, 'key': key}) == 1
evidence['checks'] += ['writing skill and model intent executed', 'real FLUX image saved in private Supabase Storage', 'real TRELLIS raw and Blender-validated GLB saved in private Supabase Storage', 'source -> raw -> validated lineage retained', 'all artifact SHA-256 downloads verified', 'second Supabase account denied every generated download', 'run admission replay created one logical run', 'project and storage rows verified directly in Supabase PostgreSQL']
evidence['passed'] = True
save()
print('Supabase workflow checks passed.', flush=True)
