"""Exercise real model requests through the durable application API.
Writes a repeatable evidence record; never substitutes fixtures for inference.
"""
import argparse
import json
import time
import uuid
from pathlib import Path

import httpx

parser = argparse.ArgumentParser()
parser.add_argument('--base', default='http://127.0.0.1:8000')
parser.add_argument('--image', action='store_true')
args = parser.parse_args()
client = httpx.Client(base_url=args.base, timeout=30)
def call(method, path, **kwargs):
    response = client.request(method, '/v1' + path, **kwargs)
    response.raise_for_status()
    return response.json()

project = call('POST', '/projects', json={'name': 'Ceramic studies', 'instructions': 'A small independent ceramics studio. Warm, tactile, natural imagery and clear, unpretentious writing.'})
chat = call('POST', '/chats', json={'project_id': project['id'], 'title': 'A quieter kind of coffee'})
prompt = 'Write three short, distinctive product names for a handmade terracotta coffee cup. Give each a one-line description. Keep the language warm and simple.'
message = call('POST', f"/chats/{chat['id']}/messages", json={'content': prompt})
key = 'smoke-' + str(uuid.uuid4())
body = {'chat_id': chat['id'], 'message_id': message['id'], 'capability': 'chat', 'idempotency_key': key}
run = call('POST', '/runs', json=body)
duplicate = call('POST', '/runs', json=body)
assert duplicate['id'] == run['id'], 'Duplicate request created extra inference'
evidence = {'project_id': project['id'], 'chat_id': chat['id'], 'idempotency_verified': True, 'runs': []}

def finish(run):
    started = time.monotonic()
    print('Waiting for', run['capability'], run['id'], flush=True)
    while run['status'] not in ['succeeded', 'failed', 'cancelled']:
        if time.monotonic() - started > 600:
            raise TimeoutError('Live model smoke exceeded ten minutes; run remains inspectable')
        time.sleep(2)
        run = call('GET', f"/runs/{run['id']}")
    events = call('GET', f"/runs/{run['id']}/events")
    assert len({e['sequence'] for e in events}) == len(events)
    evidence['runs'].append(run)
    Path('evals/reports').mkdir(parents=True, exist_ok=True)
    Path('evals/reports/local-live-smoke.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
    print(run['status'], run.get('model'), run.get('error'), flush=True)
    if run['status'] != 'succeeded':
        raise RuntimeError(str(run.get('error')))
    return run

finish(run)
if args.image:
    message = call('POST', f"/chats/{chat['id']}/messages", json={'content': 'Create a product photograph of a sculptural terracotta ceramic coffee cup on pale sand, a single olive branch beside it, soft natural studio light, warm earthy palette, tactile pottery, no text.'})
    run = call('POST', '/runs', json={'chat_id': chat['id'], 'message_id': message['id'], 'capability': 'text_to_image', 'idempotency_key': 'smoke-' + str(uuid.uuid4()), 'settings': {'width': 768, 'height': 768, 'seed': 42}})
    result = finish(run)
    artifact = call('GET', '/artifacts/' + result['artifact_ids'][0])
    response = client.get(artifact['download_url'])
    response.raise_for_status()
    assert response.content.startswith(b'\x89PNG')
    Path('evals/reports/local-live-image.png').write_bytes(response.content)
    evidence['artifact_download_verified'] = True
    Path('evals/reports/local-live-smoke.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
print('Live smoke checks passed.', flush=True)
