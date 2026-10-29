"""One explicit regression edit after the observed Crawlframe anatomy failure."""
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT / 'apps/api')
sys.path.insert(0, str(ROOT / 'apps/api'))

from powwow.config import settings
from powwow.db import SessionLocal
from powwow.models import Artifact, Message, Run
from powwow.schemas import GenerationSettings, RunCreate
from powwow.service import submit_run
from powwow.storage import Storage

report_path = ROOT / 'evals/reports/astra-crawlframe-edit/report.json'
report_path.parent.mkdir(parents=True, exist_ok=True)
with report_path.open('x', encoding='utf-8') as output:
    json.dump({'status':'initializing','note':'One explicit edit; not an automatic repair loop.'}, output)
if settings().spending_limits_enabled:
    raise SystemExit('Expected the authorized uncapped development setting.')
with SessionLocal() as db:
    original = db.get(Run, '933e0868-35d6-4c95-b04f-77829b2d25ec')
    task = next(t for t in original.settings['task_plan']['tasks'] if t['output_name'] == 'Crawlframe.png')
    progress = original.model_provenance['tasks'][task['id']]
    asset = db.get(Artifact, progress['artifact_id'])
    if original.status != 'failed' or asset.details['quality_review']['passed']:
        raise SystemExit('Expected the saved, rejected Crawlframe draft.')
    prompt = ('Edit the attached Crawlframe draft to correct the failed anatomy, preserving its core chassis design, '
              'pale worn armor and black mechanical structure. The saved character requires exactly eight separate '
              'weight-bearing walking legs, four on each side, PLUS two smaller front manipulator arms. The draft '
              'only establishes six visible walking legs. Recompose the neutral stance and choose a sufficiently '
              'elevated oblique view so all eight complete walking legs and their separate feet are visible and '
              'countable without hiding behind the body or other legs. Keep the two small front manipulators '
              'visually distinct from the eight walking legs. Make a single full-subject reconstruction reference '
              'with comfortable margins and genuine transparency, no floor, text, numbering or extra views. '
              'Save Crawlframe.png and attach it to the existing Crawlframe character if it passes review. '
              'This is one targeted edit evaluation; preserve the rejected draft as evidence. '
              'Original character brief: ' + task['instructions'])
    message = Message(owner_id=original.owner_id, chat_id=original.chat_id, role='user', content=prompt, attachment_ids=[asset.id])
    db.add(message); db.flush()
    request = RunCreate(chat_id=original.chat_id, message_id=message.id, capability='text_to_image',
        attachment_ids=[asset.id], idempotency_key='crawlframe-explicit-edit-eval-v1',
        settings=GenerationSettings(intelligence='super', entry_image=task['destination']))
    run = submit_run(db, original.owner_id, request)
    run_id = run.id
    report_path.write_text(json.dumps({'run_id':run_id,'source_artifact_id':asset.id,'status':'submitted'}),encoding='utf-8')
print(json.dumps({'run_id':run_id,'status':'submitted'}),flush=True)
while True:
    with SessionLocal() as db:
        run = db.get(Run,run_id)
        if run.status in {'failed','cancelled','succeeded'}:
            outputs=[]
            for aid in run.artifact_ids:
                asset=db.get(Artifact,aid)
                local=report_path.parent/asset.name
                local.write_bytes(Storage().read(asset.storage_key))
                outputs.append({'id':asset.id,'name':asset.name,'local_file':str(local),'metadata':asset.details})
            report={'run_id':run.id,'status':run.status,'error':run.error,'actual_cost_usd':run.actual_cost_usd,
                    'outputs':outputs,'plan':run.settings.get('task_plan'),'provenance':run.model_provenance,
                    'qualification':'candidate','owner_review':'pending','note':'One explicitly revised edit; original rejection retained.'}
            report_path.write_text(json.dumps(report,indent=2),encoding='utf-8')
            print(json.dumps({k:report[k] for k in ('run_id','status','error','actual_cost_usd')}),flush=True)
            break
    time.sleep(3)
