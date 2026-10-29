"""One paid planner replay, durable and capped; no media or project mutations."""
import argparse
import json
import os
import sys
from datetime import timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT / 'apps/api')
sys.path.insert(0, str(ROOT / 'apps/api'))

from powwow.config import settings
from powwow.db import SessionLocal, now
from powwow.intelligence import CLASSIFIER_POLICY
from powwow.models import Chat, Message, Run
from powwow.service import account_for_update
from powwow.worker import WORKER_ID, execute

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-run', required=True)
parser.add_argument('--budget', type=float, default=1)
parser.add_argument('--report', default='evals/reports/astra-task-planner-live.json')
args = parser.parse_args()
report_path = ROOT / args.report
if report_path.exists():
    raise SystemExit('A report exists. Inspect its recorded run; never silently repeat evaluation.')
if not 0 < args.budget <= min(1, settings().max_run_budget_usd):
    raise SystemExit('Planner evaluation is limited to $1 and the configured request cap.')
report_path.parent.mkdir(parents=True, exist_ok=True)
with report_path.open('x', encoding='utf-8') as output:
    json.dump({'status': 'initializing', 'maximum_budget_usd': args.budget}, output)
with SessionLocal() as db:
    source = db.get(Run, args.source_run)
    if not source:
        raise SystemExit('Source run is unavailable.')
    account = account_for_update(db, source.owner_id)
    if account.spent_usd + account.reserved_usd + args.budget > account.budget_usd:
        raise SystemExit('Account allowance cannot cover the evaluation.')
    account.reserved_usd += args.budget
    chat = Chat(owner_id=source.owner_id, project_id=source.project_id, title='Task planner evaluation · October 10', archived=True)
    db.add(chat); db.flush()
    message = Message(owner_id=source.owner_id, chat_id=chat.id, role='user', content=source.prompt)
    db.add(message); db.flush()
    run = Run(owner_id=source.owner_id, project_id=source.project_id, chat_id=chat.id, message_id=message.id,
        idempotency_key='astra-task-plan-eval-' + source.id, request_fingerprint=source.request_fingerprint,
        capability='chat', workflow_id='project.experience.v2', prompt=source.prompt,
        settings={'project_experience': True, 'planner_evaluation': True, 'experience_snapshot': source.settings['experience_snapshot'],
                  'experience_project_access': True, 'component_session': source.settings.get('component_session'), 'intelligence': 'super'},
        attachment_ids=source.attachment_ids,
        context_snapshot=[s for s in source.context_snapshot if s.get('source_id') != source.message_id],
        provider='openai', model=CLASSIFIER_POLICY['model'], status='preparing', stage='classify',
        budget_usd=args.budget, reservation_usd=args.budget, estimated_cost_usd=args.budget,
        lease_owner=WORKER_ID, lease_generation=1, lease_expires_at=now() + timedelta(seconds=settings().worker_lease_seconds), started_at=now())
    db.add(run); db.flush(); run_id=run.id
    report_path.write_text(json.dumps({'run_id': run_id, 'status': 'submitted', 'maximum_budget_usd': args.budget}), encoding='utf-8')
    db.commit()
print('Evaluating one saved Breachwater prompt; maximum $' + str(args.budget), flush=True)
execute(run_id, 1)
with SessionLocal() as db:
    run = db.get(Run, run_id)
    intent = run.settings.get('experience_intent', {})
    tasks = (intent.get('media') or {}).get('tasks', [])
    checks = {'five_tasks': len(tasks) == 5,
              'individual_pngs': len({t['output_name'] for t in tasks}) == 5 and all(t['output_name'].endswith('.png') for t in tasks),
              'transparent': bool(tasks) and all(t['transparent_background'] for t in tasks),
              'destinations': bool(tasks) and all(t.get('destination') for t in tasks),
              'no_media_generated': run.artifact_ids == []}
    report = {'run_id': run.id, 'status': run.status, 'error': run.error, 'actual_cost_usd': run.actual_cost_usd,
              'maximum_budget_usd': args.budget, 'policy': CLASSIFIER_POLICY, 'checks': checks, 'plan': intent.get('media'),
              'qualification': 'candidate', 'owner_review': 'pending'}
    report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({k: report[k] for k in ('run_id', 'status', 'actual_cost_usd', 'checks', 'error')}))
