"""Recover a verified local reconstruction after a known output transport failure.

Operator-only: preserves the failed run, registers its existing mesh, and leaves
retry to the normal API. No model calls, account credits, or status overrides.
"""
import argparse
import io
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--directory', type=Path, required=True)
    args = parser.parse_args()
    directory = args.directory.resolve()
    if not directory.is_relative_to((ROOT / '.data/trellis-runs').resolve()):
        raise ValueError('Recovery must use a Powwow TRELLIS run directory')
    os.chdir(ROOT / 'apps/api')
    sys.path.insert(0, str(ROOT / 'apps/api'))
    from PIL import Image
    from sqlalchemy import select
    from powwow.config import settings
    from powwow.db import SessionLocal
    from powwow.models import Run
    from powwow.production import Pipeline
    from powwow.storage import digest
    def failed_run(db, run_id, generation):
        value = db.scalar(select(Run).where(Run.id == run_id).with_for_update())
        if not value or value.workflow_id != 'asset.production.v1' or value.status != 'failed' or (value.error or {}).get('code') != 'model_error':
            raise ValueError('Only a known failed local production request can be recovered')
        return value
    with SessionLocal() as db:
        run = failed_run(db, args.run_id, 0)
        source_id = run.model_provenance['production']['optimized-reference']['artifacts'][-1]
        db.expunge(run)
    pipeline = Pipeline(run, 0, failed_run, lambda *args: None, lambda: False)
    source = pipeline.asset(source_id)
    expected = Image.open(io.BytesIO(pipeline.read(source))).convert('RGBA')
    actual = Image.open(directory / 'input.png').convert('RGBA')
    if actual.size != expected.size or actual.tobytes() != expected.tobytes():
        raise ValueError('Saved reconstruction does not match this request reference')
    evidence = json.loads((directory / 'generation.json').read_text())
    raw = (directory / 'raw-model.glb').read_bytes()
    if digest(raw) != evidence['raw_sha256'] or evidence['requested_resolution'] != 1536 or evidence['steps'] != 32:
        raise ValueError('Saved detailed reconstruction failed identity checks')
    command = [settings().blender_binary, '--background', '--factory-startup', '--disable-autoexec', '--python-exit-code', '1', '--python', str(ROOT / 'services/blender/validate.py'), '--', '--input', str(directory / 'raw-model.glb'), '--output', str(directory / 'model.glb'), '--report', str(directory / 'validation.json')]
    with (directory / 'recovery-validation.log').open('w', encoding='utf-8') as log:
        subprocess.run(command, check=True, timeout=180, stdout=log, stderr=subprocess.STDOUT, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    raw_asset = pipeline.save('trellis-master-raw', raw, 'model/gltf-binary', {**evidence, 'variant': 'raw', 'recovered': True}, [source.id])
    final_asset = pipeline.save('trellis-master', (directory / 'model.glb').read_bytes(), 'model/gltf-binary', {**evidence, 'variant': 'validated', 'recovered': True, 'blender_validation': json.loads((directory / 'validation.json').read_text())}, [source.id, raw_asset.id])
    pipeline.record('trellis-master', {'status': 'completed', 'artifacts': [raw_asset.id, final_asset.id], 'provenance': {'recovered_after_transport_failure': True, 'source_verified': True, 'generation': evidence}, 'metrics': {'worker_seconds': evidence['elapsed_seconds']}, 'error': None})
    print(json.dumps({'run_id': run.id, 'recovered_artifacts': [raw_asset.id, final_asset.id], 'model_calls': 0}))


if __name__ == '__main__':
    main()
