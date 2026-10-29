# Powwow GPU workers

Build from the repository root:

```powershell
docker build --platform linux/amd64 -f infra/runpod/Dockerfile.image -t YOUR_REGISTRY/powwow-image:0.1 .
docker build --platform linux/amd64 -f infra/runpod/Dockerfile.chat -t YOUR_REGISTRY/powwow-chat:0.1 .
docker build --platform linux/amd64 -f infra/runpod/Dockerfile.video -t YOUR_REGISTRY/powwow-video:0.1 .
docker build --platform linux/amd64 -f infra/runpod/Dockerfile.trellis2 -t YOUR_REGISTRY/powwow-trellis2:0.1 .
```

The image runtime uses Diffusers. The video runtime invokes the pinned official Wan command with an image, motion prompt, seed, and frame budget. The TRELLIS runtime invokes its official pipeline and GLB exporter with pinned model snapshots, and skips BRIA background removal by accepting prepared images. These are inference implementations, not sample asset generators. **A Dockerfile's presence is not proof that native CUDA dependencies built or produced a valid artifact.** See [deployment and validation](../../docs/setup/02-accounts-and-deployment.md).

The chat container uses the same request transport and a pinned Qwen3 4B Instruct model. It accepts server-prepared `messages` and returns `text`, `model`, `metrics`, and `provenance`; it has no artifact upload. Configure `RUNPOD_CHAT_ENDPOINT_ID` in the CPU app. It is a completion response at the end of the cloud job; local Ollama provides streaming text.

## Common protocol

Local HTTP: `POST /generate` with the object in `image-test.json`'s `input` field. Runpod: `POST https://api.runpod.ai/v2/ENDPOINT_ID/run` with the complete JSON and a backend-only API key. The application stores the returned job ID and uses `/status/JOB_ID` and `/cancel/JOB_ID`.

Output:

```json
{
  "artifacts": [{"base64": "...", "mime_type": "image/png", "filename": "image.png", "metadata": {"seed": 7, "model_revision": "...", "simulated": false}}],
  "model": "black-forest-labs/FLUX.2-klein-4B",
  "metrics": {"worker_seconds": 12.3, "simulated": false}
}
```

`12.3` is example data, not a measurement. An artifact either has `base64` (up to 6 MiB raw) or `storage_key` after uploading to an API-issued `output_upload` destination. The API must validate that returned key matches its allocation. Set `POWWOW_UPLOAD_HOSTS=YOUR_PROJECT.supabase.co` on every cloud worker. URLs must use HTTPS, match the exact configured hostname, and cannot redirect. The GPU never receives the Supabase service role key.

Image input is `{ "source_image": { "base64": "...", "mime_type": "image/png" } }`. The runtime supports up to 20 MiB decoded locally; Runpod async transport limits require the API to enforce the lower 6 MiB inline input limit. Large GLBs and MP4s need signed output uploads. Source URL ingestion is not implemented.

## Local image worker

Use an environment separate from the API because model runtime dependencies differ. Install CUDA-enabled PyTorch matching the GPU driver, then:

```powershell
uv pip install --python .venv-gpu/Scripts/python.exe -r services/gpu_worker/requirements.txt
$env:POWWOW_CPU_OFFLOAD = '1'
$env:POWWOW_UNLOAD_AFTER_JOB = '1'
.venv-gpu/Scripts/python.exe -m uvicorn local_server:app --app-dir services/gpu_worker --host 127.0.0.1 --port 8188
```

CPU offload is default. Unloading after each job releases memory for local chat but makes subsequent model loads slower. Omit that setting for a dedicated cloud worker. `GET /health` checks CUDA and reports whether an image model is loaded; only actual generation validates the complete model path. Set `POWWOW_WORKER_TOKEN` and provide the same bearer token from the backend if using an exposed private worker. Keep the local server bound to loopback otherwise.

The approved local alternative is `POWWOW_IMAGE_MODEL=stabilityai/sd-turbo` with its pinned revision. Its different model name is recorded; it is never reported as FLUX output. SD-Turbo is an optional development comparison whose separate license must be reviewed before a commercial catalog change.

## Important runtime constraints

- One generation at a time per process; no unmeasured GPU concurrency.
- Image dimensions are multiples of 64, 256–1536 per side, at most 1.5 megapixels. Default aspect choices are 1024×1024, 1024×576, 576×1024, 1024×768, or 768×1024; output metadata records actual dimensions.
- Wan uses a 1280×704-class landscape or portrait area and follows the input aspect ratio; 17–121 frames in increments of four plus one, 10–50 steps, 24 fps. The 121-frame baseline is about five seconds.
- TRELLIS uses a prepared object image. Transparent input is useful; automatic licensed BRIA segmentation is intentionally absent. The generated export targets 100,000 triangles and 2048px textures, but actual mesh properties require validation.
- TRELLIS uploads raw geometry first, then runs bounded Blender import/inspection/export. Its final artifact includes the Blender report. The API supplies `output_uploads.raw` and `output_uploads.final` with distinct signed storage targets; the response contains both variants. A Blender or final-upload failure returns the raw artifact with an explicit error, so the API preserves the output while marking the run failed. This transport is unit-tested; the Linux cloud image still requires an actual GPU smoke test.
- TRELLIS's DINOv3 dependency is gated. `HF_TOKEN` must have access; do not bake it into a Docker layer.
- Native containers target CUDA 12.4 and Ampere/Ada/Hopper. Blackwell needs a separately verified newer PyTorch/CUDA/native build; selecting a cheaper Blackwell GPU blindly can break extensions.
- Subprocess model loads are repeated per job. This keeps isolation and cleanup simple, but a warmed persistent video/3D pipeline is a later measured optimization.
- The current return data does not claim C2PA watermarking, content moderation, production topology, rigging, or watertightness.

## Reproducibility

Source and model commits and Docker base digests are pinned. The completed worker image and transitive Python dependencies still require an image digest and dependency inventory from the successful build. Publish the tested image, capture `docker inspect --format='{{index .RepoDigests 0}}' IMAGE`, then configure Runpod with that digest. `catalog/models/production-candidates.json` deliberately marks missing cloud validation and missing completed worker digests as incomplete.
