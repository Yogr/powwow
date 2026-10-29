"""Private HTTP transport for local GPU inference. Bind localhost by default."""
import os
import secrets
from fastapi import FastAPI, HTTPException, Request
from starlette.concurrency import run_in_threadpool
import runtime
from runtime import generate, PROFILE, PROFILE_CAPABILITY, IMAGE_MODEL

app = FastAPI(title="Powwow private GPU worker", version="1.0.0")

@app.get("/health")
def health():
    import torch
    from trellis_local import available
    from foreground import available as foreground_available
    capabilities = [PROFILE_CAPABILITY.get(PROFILE)]
    if PROFILE == "image" and available():
        capabilities.append("image_to_3d")
    return {"status": "available" if torch.cuda.is_available() else "unavailable", "profile": PROFILE,
            "capabilities": capabilities, "model": IMAGE_MODEL if PROFILE == "image" else PROFILE,
            "image_operations": (["create", "edit"] if IMAGE_MODEL == "black-forest-labs/FLUX.2-klein-4B" else ["create"]) if PROFILE == "image" else [],
            "foreground_isolation": foreground_available(),
            "model3d_workflows": ["trellis.reconstruction.v2"] if "image_to_3d" in capabilities else [],
            "cuda": torch.cuda.is_available(), "simulated": False,
            "busy": runtime._lock.locked(),
            "model_loaded": runtime._pipeline is not None or runtime._chat_model is not None,
            "readiness_note": "CUDA availability only; a successful generation verifies the model runtime"}

@app.post("/generate")
async def infer(request: Request):
    token = os.environ.get("POWWOW_WORKER_TOKEN", "")
    if token and not secrets.compare_digest(request.headers.get("authorization", ""), "Bearer " + token):
        raise HTTPException(401, "Invalid worker token")
    length = request.headers.get("content-length")
    if length and int(length) > 28 * 1024 * 1024:
        raise HTTPException(413, "Request too large")
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 28 * 1024 * 1024:
            raise HTTPException(413, "Request too large")
    import json
    try:
        payload = json.loads(body)
        return await run_in_threadpool(generate, payload)
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(422, str(exc)) from exc
