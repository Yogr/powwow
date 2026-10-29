"""Install the pinned upstream MIT BiRefNet candidate for local foreground masks."""
import hashlib
import json
from pathlib import Path
import httpx

REVISION = 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4'
root = Path(__file__).resolve().parents[1] / '.data/models/birefnet' / REVISION
root.mkdir(parents=True, exist_ok=True)
manifest = {'model': 'ZhengPeng7/BiRefNet', 'revision': REVISION, 'files': {}}
with httpx.Client(follow_redirects=True, timeout=120) as client:
    for name in ('config.json', 'BiRefNet_config.py', 'birefnet.py', 'README.md', 'model.safetensors'):
        target = root / name
        if not target.exists():
            with client.stream('GET', f'https://huggingface.co/ZhengPeng7/BiRefNet/resolve/{REVISION}/{name}') as response:
                response.raise_for_status()
                with target.with_suffix(target.suffix + '.partial').open('wb') as file:
                    for chunk in response.iter_bytes(1024 * 1024):
                        file.write(chunk)
            target.with_suffix(target.suffix + '.partial').replace(target)
        with target.open('rb') as file:
            manifest['files'][name] = hashlib.file_digest(file, 'sha256').hexdigest()
        print('Verified ' + name, flush=True)
(root / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
