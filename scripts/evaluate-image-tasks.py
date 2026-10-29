"""Execute the saved, already-paid Breachwater task plan once; never auto-retry."""
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
from powwow.media_planning import TaskPlan
from powwow.models import Artifact, Chat, Message, ProjectWorkspace, Run
from powwow.storage import Storage
from powwow.task_execution import activate
from powwow.worker import WORKER_ID, execute

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--planner-run', required=True)
parser.add_argument('--report', default='evals/reports/astra-image-tasks-live/report.json')
parser.add_argument('--review-fix-run', help='Explicitly re-review saved outputs after the alpha transport fix; does not repeat generation')
parser.add_argument('--continue-independent', action='store_true', help='Finish unrelated unexecuted tasks; reuse all saved review results, including rejections')
args = parser.parse_args()
if settings().spending_limits_enabled:
    raise SystemExit('This evaluation requires the explicitly authorized uncapped development mode.')
report_path = ROOT / args.report
report_path.parent.mkdir(parents=True, exist_ok=True)
with report_path.open('x', encoding='utf-8') as output:
    json.dump({'status': 'initializing', 'spending_limits_enabled': False}, output)
with SessionLocal() as db:
    source = db.get(Run, args.planner_run)
    if not source or source.status != 'succeeded':
        raise SystemExit('A successful saved planner run is required.')
    plan = TaskPlan.model_validate(source.settings['experience_intent']['media'])
    if args.review_fix_run:
        run = db.get(Run, args.review_fix_run)
        if not run or run.owner_id != source.owner_id or run.status != 'failed' or run.submission_started or (run.error or {}).get('code') != 'quality_review_failed':
            raise SystemExit('Only a known, completed failed review may be corrected.')
        checkpoints = run.model_provenance.get('production', {})
        if any(value.get('status') == 'submitted' for value in checkpoints.values()) or (run.settings.get('alpha_review_correction') and not args.continue_independent):
            raise SystemExit('Uncertain or already-corrected evaluations cannot be replayed.')
        if args.continue_independent and run.settings.get('independent_tasks_continued'):
            raise SystemExit('Independent tasks have already been continued.')
        key = 'independent_tasks_continuation' if args.continue_independent else 'review_correction'
        run.model_provenance = {**run.model_provenance, key: {
            'previous_error': run.error, 'reason': ('Continue unrelated tasks using every existing generation/review checkpoint, including rejected outputs.' if args.continue_independent else 'Vision input discarded alpha; render checkerboard preview and preserve user-authorized pose alternatives.'),
            'previous_cost_usd': run.actual_cost_usd, 'generation_repeated': False}}
        run.settings = {**run.settings, 'independent_tasks_continued' if args.continue_independent else 'alpha_review_correction': True}
        run.status, run.error, run.completed_at = 'preparing', None, None
        run.lease_owner, run.lease_generation = WORKER_ID, run.lease_generation + 1
        run.lease_expires_at = now()+timedelta(seconds=settings().worker_lease_seconds)
        run_id, generation = run.id, run.lease_generation
        db.commit()
    else:
        workspace = db.get(ProjectWorkspace, source.project_id)
        chat = Chat(owner_id=source.owner_id, project_id=source.project_id,
                title='Breachwater enemy references · GPT-6 evaluation')
        db.add(chat); db.flush()
        message = Message(owner_id=source.owner_id, chat_id=chat.id, role='user', content=source.prompt)
        db.add(message); db.flush()
        run = Run(owner_id=source.owner_id, project_id=source.project_id, chat_id=chat.id, message_id=message.id,
        idempotency_key='astra-image-eval-' + source.id, request_fingerprint=source.request_fingerprint,
        capability='text_to_image', workflow_id='tasks.execute.v1', prompt=source.prompt,
        settings={'experience_project_access': True, 'experience_snapshot': {**source.settings['experience_snapshot'], 'workspace': workspace.workspace},
                  'spending_limits_enabled': False, 'intelligence': 'super'}, attachment_ids=source.attachment_ids,
        context_snapshot=source.context_snapshot, provider='openai', model='gpt-6-astra',
        status='preparing', stage='tasks', budget_usd=1, reservation_usd=0, estimated_cost_usd=5,
        model_provenance={'planner_source': {'run_id':source.id, 'cost_already_recorded_usd':source.actual_cost_usd}},
        lease_owner=WORKER_ID, lease_generation=1, lease_expires_at=now()+timedelta(seconds=settings().worker_lease_seconds), started_at=now())
        db.add(run); db.flush(); run_id, generation = run.id, 1
        activate(db, run, plan)
    report_path.write_text(json.dumps({'run_id':run_id,'status':'admitting','spending_limits_enabled':False}), encoding='utf-8')
print(json.dumps({'run_id':run_id,'status':'executing','task_count':len(plan.tasks)}), flush=True)
execute(run_id, generation)
with SessionLocal() as db:
    run = db.get(Run, run_id)
    outputs = []
    for artifact_id in run.artifact_ids:
        asset = db.get(Artifact, artifact_id)
        local = report_path.parent / asset.name
        local.write_bytes(Storage().read(asset.storage_key))
        outputs.append({'id':asset.id,'name':asset.name,'local_file':str(local), 'metadata':asset.details})
    report = {'run_id':run.id,'status':run.status,'error':run.error,'spending_limits_enabled':False,
              'actual_cost_usd':run.actual_cost_usd,'planner_source_run':args.planner_run,
              'outputs':outputs,'task_progress':run.model_provenance.get('tasks',{}),
              'checkpoints':run.model_provenance.get('production',{}), 'qualification':'candidate','owner_review':'pending'}
    report_path.write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps({k:report[k] for k in ('run_id','status','error','actual_cost_usd','task_progress')}),flush=True)
