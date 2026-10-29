"""One pinned offline segmentation call; no generative edits or RGB changes."""
import hashlib
from pathlib import Path

REVISION = 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4'
ROOT = Path(__file__).resolve().parents[2] / '.data/models/birefnet' / REVISION


def available():
    return all((ROOT / name).is_file() for name in ('model.safetensors', 'config.json', 'birefnet.py', 'manifest.json'))


def generate(payload, directory):
    import torch
    from torchvision import transforms
    from transformers import AutoModelForImageSegmentation
    from PIL import ImageChops
    from runtime import source_image
    import base64
    if not available():
        raise ValueError('Install the pinned foreground model with scripts/setup-foreground-model.py')
    sources = payload.get('source_images') or [payload.get('source_image')]
    if len(sources) != 1 or not isinstance(sources[0], dict):
        raise ValueError('Foreground isolation requires one source image')
    source = sources[0]
    image = source_image({'source_image': source})
    model = AutoModelForImageSegmentation.from_pretrained(str(ROOT), trust_remote_code=True, local_files_only=True).eval().to(device='cuda', dtype=torch.float32)
    transform = transforms.Compose([transforms.Resize((1024, 1024)), transforms.ToTensor(), transforms.Normalize([.485, .456, .406], [.229, .224, .225])])
    torch.cuda.reset_peak_memory_stats()
    with torch.inference_mode():
        prediction = model(transform(image.convert('RGB')).unsqueeze(0).to('cuda'))[-1].sigmoid().cpu()[0].squeeze()
    mask = transforms.ToPILImage()(prediction).resize(image.size)
    image.putalpha(ImageChops.multiply(mask, image.getchannel('A')))
    alpha = image.getchannel('A')
    bounds = alpha.point(lambda value: 255 if value > 204 else 0).getbbox()
    if not bounds or (bounds[2]-bounds[0]) * (bounds[3]-bounds[1]) < image.width * image.height * .01:
        raise ValueError('Foreground isolation found no substantial subject')
    if alpha.getextrema()[0] > 10:
        raise ValueError('Foreground isolation did not remove the background')
    output = directory / 'isolated-reference.png'
    image.save(output)
    metadata = {'media_operation': 'segment', 'reference_images': [{'artifact_id': source.get('artifact_id'), 'sha256': hashlib.sha256(base64.b64decode(source['base64'], validate=True)).hexdigest()}],
                'model_revision': REVISION, 'foreground_bounds': list(bounds), 'width': image.width, 'height': image.height,
                'rgb_preserved': True, 'peak_gpu_memory_bytes': torch.cuda.max_memory_allocated(), 'simulated': False}
    del model
    return output, 'image/png', metadata, 'ZhengPeng7/BiRefNet'
