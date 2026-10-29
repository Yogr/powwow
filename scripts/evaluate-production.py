"""One bounded live workflow; a durable ledger prevents duplicate submissions."""
import argparse
import hashlib
import json
import sys
import uuid
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'evals/reports/production-live.json'


def main():
    global REPORT
    parser = argparse.ArgumentParser()
    parser.add_argument('--run', action='store_true')
    parser.add_argument('--resume', action='store_true', help='Explicitly resume the saved run after a known implementation failure')
    parser.add_argument('--intelligence', choices=['super'], help='Explicit stronger-model comparison on a known incomplete visual plan')
    parser.add_argument('--report', type=Path, default=REPORT)
    args = parser.parse_args()
    REPORT = args.report.resolve()
    with httpx.Client(base_url='http://127.0.0.1:8000', timeout=45) as client:
        config = client.get('/v1/config').json()
        credentials = json.loads((ROOT / '.data/supabase-qa.json').read_text(encoding='utf-8-sig'))['primary']
        auth = httpx.post(config['supabase_url'] + '/auth/v1/token?grant_type=password',
            headers={'apikey': config['supabase_anon_key']}, json={'email': credentials['email'], 'password': credentials['password']}, timeout=30)
        if not auth.is_success:
            raise RuntimeError('QA authentication failed')
        client.headers['Authorization'] = 'Bearer ' + auth.json()['access_token']
        def call(method, path, **kwargs):
            response = client.request(method, path, **kwargs)
            if not response.is_success:
                raise RuntimeError(f'API {response.status_code}: {response.text[:500]}')
            return response.json()
        if args.run:
            report = {'status': 'initializing', 'maximum_budget_usd': 1, 'qualification': 'candidate', 'owner_review': 'pending'}
            with REPORT.open('x', encoding='utf-8') as file:
                json.dump(report, file)
            project = call('POST', '/v1/projects', json={'name': '3D pipeline evaluation', 'storage_mode': 'cloud'})
            source = ROOT / 'evals/reports/flux-reference-edit-2026-10-09/edited-reference.png'
            asset = call('POST', '/v1/uploads', data={'project_id': project['id']}, files={'file': ('Terracotta-reference.png', source.read_bytes(), 'image/png')})
            chat = call('POST', '/v1/chats', json={'project_id': project['id']})
            prompt = 'Create a finished textured 3D model of this terracotta mug. Preserve its hollow opening, handle, warm clay color and diagonal ridges. Prepare the reference, use the full detailed TRELLIS and Blender finishing workflow, and save the model as TerracottaMug.glb.'
            message = call('POST', f"/v1/chats/{chat['id']}/messages", json={'content': prompt, 'attachment_ids': [asset['id']]})
            report.update(project_id=project['id'], chat_id=chat['id'], source_id=asset['id'], message_id=message['id'], idempotency_key='production-eval-' + uuid.uuid4().hex, status='submission_pending')
            REPORT.write_text(json.dumps(report, indent=2), encoding='utf-8')
            run = call('POST', '/v1/runs', json={'chat_id': chat['id'], 'message_id': message['id'], 'capability': 'image_to_3d', 'attachment_ids': [asset['id']], 'settings': {'media_budget_usd': 1}, 'budget_usd': 1, 'idempotency_key': report['idempotency_key']})
            report['run_id'] = run['id']
        else:
            report = json.loads(REPORT.read_text(encoding='utf-8'))
            run = call('GET', '/v1/runs/' + report['run_id'])
            if args.resume:
                if run['status'] != 'failed' or (run.get('error') or {}).get('code') in {'submission_uncertain', 'cancellation_unconfirmed', 'quality_review_failed'}:
                    raise RuntimeError('Only a known implementation failure may be resumed')
                report.setdefault('previous_runs', []).append({'run_id': run['id'], 'error': run['error'], 'cost_usd': run['actual_cost_usd'], 'provenance': run['model_provenance']})
                remaining = report['maximum_budget_usd'] - sum(item['cost_usd'] for item in report['previous_runs'])
                report['resume_idempotency_key'] = 'production-resume-' + run['id']
                REPORT.write_text(json.dumps(report, indent=2), encoding='utf-8')
                request = {'idempotency_key': report['resume_idempotency_key'], 'budget_usd': remaining}
                if args.intelligence:
                    request['intelligence'] = args.intelligence
                run = call('POST', '/v1/runs/' + run['id'] + '/retry', json=request)
                report['run_id'] = run['id']
        report.update(status=run['status'], stage=run['stage'], error=run['error'], cost_usd=run['actual_cost_usd'], artifact_ids=run['artifact_ids'], provenance=run['model_provenance'])
        REPORT.write_text(json.dumps(report, indent=2), encoding='utf-8')
        print(json.dumps({key: report.get(key) for key in ('run_id', 'status', 'stage', 'error', 'cost_usd')}, indent=2))
        if run['status'] in {'succeeded', 'failed'}:
            output = REPORT.with_suffix('')
            output.mkdir(exist_ok=True)
            for artifact_id in run['artifact_ids']:
                asset = call('GET', '/v1/artifacts/' + artifact_id)
                target = output / Path(asset['name']).name
                if not target.exists() or hashlib.sha256(target.read_bytes()).hexdigest() != asset['sha256']:
                    response = client.get(asset['download_url'])
                    if response.is_success:
                        if hashlib.sha256(response.content).hexdigest() != asset['sha256']:
                            raise RuntimeError('Downloaded evaluation asset failed its integrity check')
                        target.write_bytes(response.content)
                if asset.get('preview_url'):
                    preview = output / (Path(asset['name']).stem + '-preview.png')
                    if not preview.exists():
                        response = client.get(asset['preview_url'])
                        if response.is_success:
                            preview.write_bytes(response.content)


if __name__ == '__main__':
    main()
