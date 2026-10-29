"""Use an existing SPZ TRELLIS.2 Windows runtime without changing its files.

Run with that installation's Python. All generated files/configs live in the
Powwow run directory. Offline mode forbids implicit model downloads.
"""
import argparse
import asyncio
import hashlib
import json
import os
import shutil
import sys
import time
from pathlib import Path

REVISION = "af44b45f2e35a493886929c6d786e563ec68364d"
DECODER_REVISION = "25e0d31ffbebe4b5a97464dd851910efc3002d96"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--runtime", required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--seed", type=int, required=True)
    parser.add_argument("--steps", type=int, default=12)
    parser.add_argument("--resolution", type=int, choices=[512, 1024, 1536], default=512)
    parser.add_argument("--faces", type=int, default=50)
    parser.add_argument("--texture-size", type=int, default=1024)
    args = parser.parse_args()
    code = Path(args.runtime).resolve()
    source, output, report = (Path(value).resolve() for value in (args.input, args.output, args.report))
    output.parent.mkdir(parents=True, exist_ok=True)
    os.chdir(output.parent)
    sys.path.insert(0, str(code))
    sys.dont_write_bytecode = True
    os.environ.update(HF_HOME=str(code / "models"), HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1",
                      OPENCV_IO_ENABLE_OPENEXR="1", TORCHDYNAMO_DISABLE="1")
    started = time.monotonic()
    import torch
    from PIL import Image
    from api_spz.core.state_manage import state, _apply_patches
    _apply_patches()
    from trellis2.pipelines import Trellis2ImageTo3DPipeline, rembg
    from api_spz.core.models_pydantic import GenerationArgForm
    from api_spz.routes.generation import _run_pipeline_generate_and_export

    class PreparedInput:
        def __init__(self):
            pass
        def to(self, *_):
            return self
        def cpu(self):
            return self
        def __call__(self, image):
            return image.convert("RGBA")

    rembg.PowwowPreparedInput = PreparedInput
    weights = code / "models/hub/models--microsoft--TRELLIS.2-4B/snapshots" / REVISION
    decoder = code / "models/hub/models--microsoft--TRELLIS-image-large/snapshots" / DECODER_REVISION
    config = json.loads((weights / "pipeline.json").read_text())
    config["args"]["rembg_model"] = {"name": "PowwowPreparedInput", "args": {}}
    config["args"]["low_vram"] = True
    # A 512 draft never calls the 1024 flow models. Avoid loading both into a
    # 32 GiB Windows host while its other application services remain running.
    if args.resolution == 512:
        config["args"]["models"].pop("shape_slat_flow_model_1024", None)
        config["args"]["models"].pop("tex_slat_flow_model_1024", None)
    for name, path in config["args"]["models"].items():
        root = decoder if path.startswith("microsoft/TRELLIS-image-large/") else weights
        relative = path.removeprefix("microsoft/TRELLIS-image-large/")
        resolved = root / relative
        for suffix in (".json", ".safetensors"):
            if not Path(str(resolved) + suffix).is_file():
                raise RuntimeError(f"Missing existing TRELLIS checkpoint: {resolved.name}{suffix}")
        config["args"]["models"][name] = str(resolved)
    encoder = code / "models/dinov3"
    if not (encoder / "model.safetensors").is_file():
        raise RuntimeError("Existing DINOv3 weights are missing; no download attempted")
    config["args"]["image_cond_model"]["args"]["model_name"] = str(encoder)
    config_dir = output.parent / "pipeline-config"
    config_dir.mkdir(exist_ok=True)
    (config_dir / "pipeline.json").write_text(json.dumps(config, indent=2))
    if not torch.cuda.is_available():
        raise RuntimeError("The existing TRELLIS runtime cannot access CUDA")
    state.pipeline = Trellis2ImageTo3DPipeline.from_pretrained(str(config_dir))
    state.pipeline.cuda()
    pipeline = state.pipeline
    evidence = {"model": "microsoft/TRELLIS.2-4B", "model_revision": REVISION,
                "decoder_revision": DECODER_REVISION, "runtime": "existing SPZ Windows TRELLIS.2",
                "torch_version": torch.__version__, "cuda_version": torch.version.cuda,
                "gpu": torch.cuda.get_device_name(), "seed": args.seed, "steps": args.steps,
                "requested_resolution": args.resolution, "texture_size": args.texture_size,
                "decimation_target": args.faces * 1000, "low_vram": True,
                "background_preparation": "Input foreground used as supplied; no background-removal model",
                "offline_weights": True, "simulated": False}
    original_preprocess = pipeline.preprocess_image
    def observed_preprocess(*a, **kw):
        image = original_preprocess(*a, **kw)
        image.save(output.parent / "conditioned.png")
        return image
    pipeline.preprocess_image = observed_preprocess
    original_run = pipeline.run
    def observed_run(*a, **kw):
        result = original_run(*a, **kw)
        if kw.get("return_before_decode"):
            shape, _texture, resolution = result
            evidence.update(effective_resolution=int(resolution), shape_tokens=int(shape.coords.shape[0]))
        return result
    pipeline.run = observed_run
    arg = GenerationArgForm(seed=args.seed, guidance_scale=7.5, num_inference_steps=args.steps,
                            resolution=args.resolution, mesh_simplify=args.faces, apply_texture=True,
                            texture_size=args.texture_size, tex_rescale_t=3.0, tex_guidance_strength=1.0,
                            output_format="glb")
    generated = asyncio.run(_run_pipeline_generate_and_export(Image.open(source).convert("RGBA"), arg))
    shutil.copyfile(generated, output)
    evidence.update(elapsed_seconds=round(time.monotonic() - started, 3),
                    raw_bytes=output.stat().st_size, raw_sha256=hashlib.sha256(output.read_bytes()).hexdigest())
    evidence["runtime_source_sha256"] = {str(path.relative_to(code)): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in (code / "api_spz/routes/generation.py", code / "trellis2/pipelines/trellis2_image_to_3d.py",
                     code / "trellis2/modules/image_feature_extractor.py")}
    report.write_text(json.dumps(evidence, indent=2))
    print(json.dumps(evidence), flush=True)


if __name__ == "__main__":
    main()
