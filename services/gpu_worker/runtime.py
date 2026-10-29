"""One trusted model profile per worker; identical local and Runpod job contract.

Only image inference is included in this Python environment. Video and TRELLIS
run in their own containers because upstream native dependencies conflict.
"""
from __future__ import annotations

import base64
import gc
import hashlib
import io
import json
import os
import secrets
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

from PIL import Image, ImageOps

IMAGE_MODEL = os.environ.get("POWWOW_IMAGE_MODEL", "black-forest-labs/FLUX.2-klein-4B")
IMAGE_REVISIONS = {
    "black-forest-labs/FLUX.2-klein-4B": "e7b7dc27f91deacad38e78976d1f2b499d76a294",
    "stabilityai/sd-turbo": "b261bac6fd2cf515557d5d0707481eafa0485ec2",
}
PROFILE = os.environ.get("POWWOW_WORKER_PROFILE", "image")
PROFILE_CAPABILITY = {"chat": "chat", "image": "text_to_image", "video": "image_to_video", "trellis2": "image_to_3d"}
CHAT_MODEL = "Qwen/Qwen3-4B-Instruct-2507"
CHAT_REVISION = "cdbee75f17c01a7cc42f958dc650907174af0554"
MAX_SOURCE_BYTES = 20 * 1024 * 1024
MAX_INLINE_BYTES = 6 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 25_000_000
_lock = threading.Lock()
_pipeline = None
_chat_model = None
_chat_tokenizer = None


def integer(settings: dict, key: str, default: int, minimum: int, maximum: int) -> int:
    value = settings.get(key, default)
    if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
        raise ValueError(f"{key} must be an integer from {minimum} to {maximum}")
    return value


def source_image(payload: dict) -> Image.Image:
    source = payload.get("source_image") or {}
    encoded = source.get("base64", "")
    if not isinstance(encoded, str) or len(encoded) > MAX_SOURCE_BYTES * 4 // 3 + 4:
        raise ValueError("Source image exceeds the 20 MiB limit")
    try:
        raw = base64.b64decode(encoded, validate=True)
        if not raw or len(raw) > MAX_SOURCE_BYTES:
            raise ValueError("A nonempty source image is required")
        with Image.open(io.BytesIO(raw)) as original:
            if original.format not in {"PNG", "JPEG", "WEBP"}:
                raise ValueError("Source image must be PNG, JPEG, or WebP")
            original.load()
            return ImageOps.exif_transpose(original).convert("RGBA")
    except (ValueError, OSError) as exc:
        raise ValueError("Source image must contain valid base64 PNG, JPEG, or WebP data") from exc


def image_references(payload: dict) -> tuple[list[Image.Image], list[dict]]:
    """Decode bounded image-edit inputs before loading a model or allocating GPU memory."""
    sources = payload.get("source_images")
    if sources is not None and payload.get("source_image"):
        raise ValueError("Supply source_image or source_images, not both")
    if sources is None:
        sources = [payload["source_image"]] if payload.get("source_image") else []
    if not isinstance(sources, list) or len(sources) > 8:
        raise ValueError("Image editing supports at most eight reference images")
    images, evidence, total = [], [], 0
    for source in sources:
        if not isinstance(source, dict):
            raise ValueError("Each reference must be an image object")
        image = source_image({"source_image": source})
        raw = base64.b64decode(source["base64"], validate=True)
        total += len(raw)
        if total > MAX_SOURCE_BYTES:
            raise ValueError("Reference images exceed the combined 20 MiB limit")
        # FLUX consumes RGB references. Composite transparency deliberately:
        # merely dropping alpha can expose invisible source pixels as black.
        background = Image.new("RGBA", image.size, "white")
        background.alpha_composite(image)
        images.append(background.convert("RGB"))
        evidence.append({"artifact_id": source.get("artifact_id"),
                         "sha256": hashlib.sha256(raw).hexdigest(),
                         "width": image.width, "height": image.height,
                         "alpha_composite": "white"})
    return images, evidence


def artifact(path: Path, mime: str, metadata: dict, payload: dict) -> dict:
    data = path.read_bytes()
    result = {"mime_type": mime, "filename": path.name,
              "metadata": {**metadata, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}}
    target = payload.get("output_upload")
    if target:
        # Destinations are API-issued, and further restricted to an operator-set
        # exact host; clients cannot select an arbitrary network destination.
        from urllib.parse import urlsplit
        import httpx
        import logging
        # Signed destinations contain temporary credentials in their query.
        logging.getLogger('httpx').setLevel(logging.WARNING)
        url = str(target.get("url", ""))
        parsed = urlsplit(url)
        allowed = {x.strip() for x in os.environ.get("POWWOW_UPLOAD_HOSTS", "").split(",") if x.strip()}
        local_http = (os.environ.get("POWWOW_ALLOW_LOCAL_STORAGE_HTTP") == "1"
                      and parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost", "::1"})
        if (parsed.scheme != "https" and not local_http) or parsed.hostname not in allowed or parsed.username or parsed.password:
            raise ValueError("Output upload host is not configured on this worker")
        method = target.get("method", "PUT")
        if method not in {"PUT", "POST"}:
            raise ValueError("Unsupported output upload method")
        headers = {"Content-Type": mime, **target.get("headers", {})}
        try:
            response = httpx.request(method, url, content=data, headers=headers, timeout=180, follow_redirects=False)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ValueError(f'Output upload failed (HTTP {exc.response.status_code}). The generated file is retained locally.') from None
        except httpx.HTTPError:
            raise ValueError('Output upload was interrupted. Check the retained local file before restarting generation.') from None
        result["storage_key"] = target["storage_key"]
    elif len(data) <= MAX_INLINE_BYTES:
        result["base64"] = base64.b64encode(data).decode("ascii")
    else:
        raise ValueError("Result exceeds 6 MiB inline limit; configure signed output uploads before this profile")
    return result


def image_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline
    import torch
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is required for this image worker; no simulated output is returned")
    revision = os.environ.get("POWWOW_IMAGE_REVISION") or IMAGE_REVISIONS.get(IMAGE_MODEL)
    if not revision:
        raise ValueError("A custom model requires an explicit POWWOW_IMAGE_REVISION")
    if IMAGE_MODEL == "black-forest-labs/FLUX.2-klein-4B":
        from diffusers import Flux2KleinPipeline
        _pipeline = Flux2KleinPipeline.from_pretrained(IMAGE_MODEL, revision=revision, torch_dtype=torch.bfloat16)
    elif IMAGE_MODEL == "stabilityai/sd-turbo":
        from diffusers import AutoPipelineForText2Image
        _pipeline = AutoPipelineForText2Image.from_pretrained(IMAGE_MODEL, revision=revision, torch_dtype=torch.float16, variant="fp16")
    else:
        raise ValueError("Model is not in this worker's approved image allowlist")
    if os.environ.get("POWWOW_CPU_OFFLOAD", "1") == "1":
        _pipeline.enable_model_cpu_offload()
    else:
        _pipeline.to("cuda")
    return _pipeline


def generate_image(payload: dict, directory: Path) -> tuple[Path, str, dict, str]:
    settings = payload.get("settings") or {}
    operation = settings.get("media_operation", "edit" if payload.get("source_image") or payload.get("source_images") else "create")
    if operation not in {"create", "edit"}:
        raise ValueError("Image operation must be create or edit")
    references, reference_evidence = image_references(payload)
    if operation == "edit" and not references:
        raise ValueError("Choose an image to edit before generating")
    if references and IMAGE_MODEL != "black-forest-labs/FLUX.2-klein-4B":
        raise ValueError("The configured image model cannot edit reference images; no generation was started")
    if references and operation != "edit":
        raise ValueError("Reference images require the edit operation; no text-only generation was started")
    import torch
    dimensions = {"1:1": (1024, 1024), "16:9": (1024, 576), "9:16": (576, 1024), "4:3": (1024, 768), "3:4": (768, 1024)}
    ratio = settings.get("aspect_ratio", "1:1")
    if ratio not in dimensions:
        raise ValueError("aspect_ratio must be 1:1, 16:9, 9:16, 4:3, or 3:4")
    default_width, default_height = dimensions[ratio]
    width = integer(settings, "width", default_width, 256, 1536)
    height = integer(settings, "height", default_height, 256, 1536)
    if width % 64 or height % 64 or width * height > 1_572_864:
        raise ValueError("Image dimensions must be multiples of 64 and at most 1.5 megapixels")
    seed = integer(settings, "seed", secrets.randbelow(2**31), 0, 2**32 - 1)
    turbo = IMAGE_MODEL == "stabilityai/sd-turbo"
    if "num_inference_steps" in settings and "steps" not in settings:
        settings = {**settings, "steps": settings["num_inference_steps"]}
    steps = integer(settings, "steps", 1 if turbo else 4, 1, 4 if turbo else 12)
    pipe = image_pipeline()
    torch.cuda.reset_peak_memory_stats()
    reference_input = {"image": references} if references else {}
    with torch.inference_mode():
        generated = pipe(prompt=payload["prompt"], height=height, width=width,
                         guidance_scale=0.0 if turbo else 1.0, num_inference_steps=steps,
                         generator=torch.Generator(device="cuda").manual_seed(seed), **reference_input).images[0]
    path = directory / "image.png"
    generated.save(path, "PNG")
    metadata = {"width": width, "height": height, "seed": seed, "steps": steps,
                "media_operation": operation, "reference_images": reference_evidence,
                "model_revision": os.environ.get("POWWOW_IMAGE_REVISION") or IMAGE_REVISIONS[IMAGE_MODEL],
                "peak_gpu_memory_bytes": torch.cuda.max_memory_allocated(), "simulated": False}
    return path, "image/png", metadata, IMAGE_MODEL


def generate_subprocess(payload: dict, directory: Path) -> tuple[Path, str, dict, str] | dict:
    from huggingface_hub import snapshot_download
    started = time.monotonic()
    settings = payload.get("settings") or {}
    source = source_image(payload)
    source_path = directory / "source.png"
    source.save(source_path)
    seed = integer(settings, "seed", secrets.randbelow(2**31), 0, 2**32 - 1)
    if PROFILE == "video":
        model = "Wan-AI/Wan2.2-TI2V-5B"
        revision = "921dbaf3f1674a56f47e83fb80a34bac8a8f203e"
        weights = os.environ.get("POWWOW_WAN_MODEL_PATH") or snapshot_download(model, revision=revision)
        frames = integer(settings, "frames", 121, 17, 121)
        if (frames - 1) % 4:
            raise ValueError("Video frames must be 4n+1")
        steps = integer(settings, "steps", 50, 10, 50)
        orientation = "704*1280" if source.height > source.width else "1280*704"
        path = directory / "video.mp4"
        command = [sys.executable, "generate.py", "--task", "ti2v-5B", "--size", orientation,
                   "--ckpt_dir", weights, "--offload_model", "True", "--convert_model_dtype", "--t5_cpu",
                   "--image", str(source_path), "--prompt", payload["prompt"], "--base_seed", str(seed),
                   "--frame_num", str(frames), "--sample_steps", str(steps), "--save_file", str(path)]
        subprocess.run(command, cwd=os.environ.get("POWWOW_WAN_ROOT", "/opt/Wan2.2"), check=True,
                       timeout=int(os.environ.get("POWWOW_GENERATION_TIMEOUT", "1800")))
        probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
                                "-show_entries", "stream=width,height,nb_read_frames,r_frame_rate,duration",
                                "-of", "json", str(path)], check=True, capture_output=True, text=True, timeout=60)
        streams = json.loads(probe.stdout).get("streams", [])
        if not streams or int(streams[0].get("nb_read_frames", 0)) != frames:
            raise ValueError("Video output does not contain the expected frame count")
        subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-i", str(path), "-f", "null", "-"],
                       check=True, capture_output=True, timeout=120)
        return path, "video/mp4", {"seed": seed, "frames": frames, "fps": 24, "steps": steps,
                                     "duration_seconds": frames / 24, "model_revision": revision, "simulated": False,
                                     "width": streams[0]["width"], "height": streams[0]["height"],
                                     "validation": "ffprobe frame count plus full ffmpeg decode"}, model
    if PROFILE == "trellis2":
        from trellis_profile import input_evidence, reconstruction_settings
        profile = reconstruction_settings(settings, default_profile="standard")
        preparation = input_evidence(source)
        model = "microsoft/TRELLIS.2-4B"
        revision = "af44b45f2e35a493886929c6d786e563ec68364d"
        weights = os.environ.get("POWWOW_TRELLIS_MODEL_PATH") or snapshot_download(model, revision=revision)
        raw_path = directory / "raw-model.glb"
        generation_report = directory / "generation.json"
        subprocess.run([sys.executable, str(Path(__file__).with_name("trellis_generate.py")),
                        "--input", str(source_path), "--output", str(raw_path), "--weights", weights,
                        "--seed", str(profile["seed"]), "--steps", str(profile["steps"]),
                        "--resolution", str(profile["resolution"]), "--faces", str(profile["mesh_simplify"]),
                        "--texture-size", str(profile["texture_size"]), "--report", str(generation_report)],
                       cwd=os.environ.get("POWWOW_TRELLIS_ROOT", "/opt/TRELLIS.2"),
                       check=True, timeout=int(os.environ.get("POWWOW_GENERATION_TIMEOUT", "1800")))
        validator = os.environ.get("POWWOW_BLENDER_SCRIPT", str(Path(__file__).with_name("blender_validate.py")))
        evidence = {**json.loads(generation_report.read_text()), "model": model,
                    "profile": profile["profile"], "seed": profile["seed"],
                    "model_revision": revision, "simulated": False, "input_preparation": preparation,
                    "source_sha256": hashlib.sha256(source_path.read_bytes()).hexdigest(),
                    "raw_sha256": hashlib.sha256(raw_path.read_bytes()).hexdigest()}
        from trellis_finalize import finalize
        return finalize(raw_path, payload, evidence, directory, os.environ.get("BLENDER_BINARY", "blender"),
                        validator, started)
    raise ValueError("Unknown worker profile")


def generate_chat(payload: dict) -> dict:
    global _chat_model, _chat_tokenizer
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is required for this cloud chat worker")
    messages = payload.get("messages") or [{"role": "user", "content": payload["prompt"]}]
    if not isinstance(messages, list) or not 1 <= len(messages) <= 64:
        raise ValueError("Chat requires 1–64 messages")
    for message in messages:
        if not isinstance(message, dict) or message.get("role") not in {"system", "user", "assistant"}:
            raise ValueError("Invalid chat message role")
        if not isinstance(message.get("content"), str):
            raise ValueError("Chat message content must be text")
    if sum(len(m["content"]) for m in messages) > 100_000:
        raise ValueError("Chat input exceeds the worker's text limit")
    if _chat_model is None:
        _chat_tokenizer = AutoTokenizer.from_pretrained(CHAT_MODEL, revision=CHAT_REVISION)
        _chat_model = AutoModelForCausalLM.from_pretrained(CHAT_MODEL, revision=CHAT_REVISION,
                                                         dtype=torch.bfloat16, device_map="cuda")
        _chat_model.eval()
    inputs = _chat_tokenizer.apply_chat_template(messages, add_generation_prompt=True, tokenize=True,
                                                return_dict=True, return_tensors="pt").to("cuda")
    input_tokens = int(inputs["input_ids"].shape[-1])
    if input_tokens > 8192:
        raise ValueError("Chat exceeds this profile's 8192 input-token budget; reduce selected context")
    skills = payload.get("skills") or []
    settings = payload.get("settings") or {}
    structured = settings.get("builder_refinement") or settings.get("language_learning")
    output_limit = 8192 if settings.get("builder_refinement") else 4096 if settings.get("language_learning") or any(isinstance(skill, dict) and skill.get("id") == "story_development@1" for skill in skills) else 2048
    max_tokens = integer(payload.get("settings") or {}, "max_tokens", output_limit, 1, output_limit)
    with torch.inference_mode():
        output = _chat_model.generate(**inputs, max_new_tokens=max_tokens, do_sample=True,
                                      temperature=0.4 if structured else 0.65, top_p=0.8, top_k=20)
    text = _chat_tokenizer.decode(output[0][input_tokens:], skip_special_tokens=True).strip()
    output_tokens = int(output.shape[-1]) - input_tokens
    eos = _chat_model.generation_config.eos_token_id
    eos_ids = eos if isinstance(eos, list) else [eos]
    ended = output_tokens > 0 and int(output[0][-1]) in eos_ids
    truncated = output_tokens >= max_tokens and not ended
    return {"text": text, "artifacts": [], "model": CHAT_MODEL,
            "metrics": {"input_tokens": input_tokens, "output_tokens": output_tokens},
            "provenance": {"model_revision": CHAT_REVISION, "runtime": "transformers", "simulated": False,
                           "finish_reason": "length" if truncated else "stop", "truncated": truncated,
                           "output_limit": max_tokens}}


def generate(payload: dict) -> dict:
    global _pipeline
    if not isinstance(payload, dict):
        raise ValueError("Input must be an object")
    from trellis_local import available as local_trellis_available
    local_trellis = (PROFILE == "image" and payload.get("capability") == "image_to_3d" and local_trellis_available())
    if payload.get("capability") != PROFILE_CAPABILITY.get(PROFILE) and not local_trellis:
        raise ValueError(f"Worker supports only {PROFILE_CAPABILITY.get(PROFILE)}")
    prompt = payload.get("prompt", "")
    if not isinstance(prompt, str) or not prompt.strip() or len(prompt) > 8000:
        raise ValueError("Prompt must have 1–8000 characters")
    if not isinstance(payload.get("settings", {}), dict):
        raise ValueError("settings must be an object")
    # Serial execution is intentional: concurrent diffusion jobs can OOM a GPU.
    with _lock:
        started = time.monotonic()
        if local_trellis:
            # Free an image pipeline retained by an earlier request before the
            # independent native TRELLIS process takes ownership of the GPU.
            if _pipeline is not None:
                _pipeline = None
                gc.collect()
                import torch
                torch.cuda.empty_cache()
            from trellis_local import generate as generate_local_trellis
            return generate_local_trellis(payload)
        if PROFILE == "chat":
            result = generate_chat(payload)
            result["metrics"]["worker_seconds"] = round(time.monotonic() - started, 3)
            return result
        with tempfile.TemporaryDirectory(prefix="powwow-") as temp:
            directory = Path(temp)
            if PROFILE == 'image' and payload.get('settings', {}).get('media_operation') == 'segment':
                _pipeline = None
                gc.collect()
                import torch
                torch.cuda.empty_cache()
                from foreground import generate as isolate_foreground
                generated = isolate_foreground(payload, directory)
            else:
                generated = generate_image(payload, directory) if PROFILE == "image" else generate_subprocess(payload, directory)
            if isinstance(generated, dict):
                result = generated
            else:
                path, mime, metadata, model = generated
                result = {"artifacts": [artifact(path, mime, metadata, payload)], "model": model,
                          "metrics": {"worker_seconds": round(time.monotonic() - started, 3), "simulated": False}}
        if os.environ.get("POWWOW_UNLOAD_AFTER_JOB", "0") == "1":
            _pipeline = None
            gc.collect()
            import torch
            torch.cuda.empty_cache()
        return result
