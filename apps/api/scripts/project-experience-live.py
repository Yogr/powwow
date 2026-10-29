"""Opt-in live smoke gate. Real calls, isolated data, no repair or retry loops."""
import argparse
import json
import os
from pathlib import Path
import sys
import tempfile
import time

root = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--all', action='store_true', help='Run the full representative suite instead of the first four cases.')
args = parser.parse_args()
os.chdir(root / 'apps/api')
sys.path.insert(0, str(root / 'apps/api'))
report = {'qualification':'candidate', 'live':True, 'checks':[], 'errors':[], 'owner_review':'pending'}
report_path = root / 'evals/reports/project-experience-live.json'
report_path.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='powwow-experience-live-') as isolated:
    os.environ.update(APP_ENV='test', ENABLE_TEST_PROVIDER='false', LOCAL_AUTH='false',
        DATABASE_URL='sqlite:///' + (Path(isolated) / 'evaluation.db').as_posix(),
        STORAGE_BACKEND='local', STORAGE_PATH=str(Path(isolated) / 'files'), ACCOUNT_BUDGET_USD='3')
    from powwow.config import settings
    if not settings().openai_api_key.get_secret_value():
        report['errors'].append('Blocked: configure OPENAI_API_KEY in ignored server configuration. No model calls were made.')
        report['live'] = False
    else:
        from fastapi.testclient import TestClient
        from powwow.auth import owner_id
        from powwow.db import engine
        from powwow.main import app
        from powwow.worker import claim, execute
        app.dependency_overrides[owner_id] = lambda: 'experience-live-evaluator'
        cases = json.loads((root/'evals/project-experience-quality.json').read_text())['cases']
        if not args.all:
            cases = cases[:4]
        try:
            with TestClient(app) as client:
                for case in cases:
                    project = client.post('/v1/projects', json={'name':'Evaluation '+case['id']}).json()
                    chat = client.post('/v1/chats', json={'project_id':project['id']}).json()
                    message = client.post(f"/v1/chats/{chat['id']}/messages", json={'content':case['prompt']}).json()
                    response = client.post('/v1/runs', json={'chat_id':chat['id'], 'message_id':message['id'], 'capability':'chat',
                        'settings':{'intelligence':'basic','web_search':False}, 'budget_usd':1, 'idempotency_key':'live-'+case['id']})
                    if response.status_code != 201:
                        raise RuntimeError(f"{case['id']}: admission failed ({response.status_code}); no retry")
                    queued = response.json()
                    started = time.monotonic()
                    execute(*claim())
                    run = client.get(f"/v1/runs/{queued['id']}").json()
                    actual = run['settings'].get('experience_intent', {})
                    check = {'case':case['id'], 'status':run['status'], 'elapsed_seconds':round(time.monotonic()-started,3),
                        'intent':actual, 'classifier':run['model_provenance'].get('classifier'),
                        'response_policy':run['settings'].get('intelligence_policy'), 'actual_cost_usd':run['actual_cost_usd'],
                        'output':run['output_text'], 'project_update':run['model_provenance'].get('project_update'), 'error':run['error']}
                    report['checks'].append(check)
                    if run['status'] != 'succeeded':
                        raise RuntimeError(f"{case['id']}: live run failed; no repair call or retry")
                    if any(actual.get(key) != case[key] for key in ['action','kind','target_language'] if key in case):
                        raise RuntimeError(f"{case['id']}: incorrect live classification")
                    if case.get('records'):
                        doc=client.get(f"/v1/projects/{project['id']}/workspace").json()['workspace']
                        if any(not doc['records'].get(component) for component in case['records']):
                            raise RuntimeError(f"{case['id']}: required editor content was not saved")
                    print('PASS', case['id'], flush=True)
        except Exception as exc:
            report['errors'].append(str(exc))
        finally:
            app.dependency_overrides.clear()
            engine.dispose()
report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps({'checks':len(report['checks']), 'errors':report['errors'], 'qualification':'candidate'}))
raise SystemExit(1 if report['errors'] else 0)
