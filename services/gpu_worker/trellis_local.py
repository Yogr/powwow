"""Powwow adapter for a preinstalled SPZ TRELLIS.2 environment."""
import hashlib
import json
import os
import subprocess
import time
import uuid
from pathlib import Path


def available():
    value = os.environ.get("POWWOW_TRELLIS_LOCAL_ROOT", "")
    if not value:
        return False
    root = Path(value)
    return all((root / item).is_file() for item in (
        "venv/Scripts/python.exe", "api_spz/routes/generation.py", "models/dinov3/model.safetensors",
        "models/hub/models--microsoft--TRELLIS.2-4B/snapshots/af44b45f2e35a493886929c6d786e563ec68364d/pipeline.json"))


def generate(payload):
    from runtime import source_image
    from trellis_profile import input_evidence, reconstruction_settings
    if not available():
        raise ValueError("The existing local TRELLIS.2 installation is not configured")
    code = Path(os.environ["POWWOW_TRELLIS_LOCAL_ROOT"]).resolve()
    settings = payload.get("settings") or {}
    profile = reconstruction_settings(settings)
    image = source_image(payload)
    preparation = input_evidence(image)
    seed, steps, resolution, texture, faces = (profile[key] for key in
        ("seed", "steps", "resolution", "texture_size", "mesh_simplify"))
    repo = Path(__file__).resolve().parents[2]
    runs = Path(os.environ.get("POWWOW_TRELLIS_RUNS_DIR", str(repo / ".data/trellis-runs"))).resolve()
    directory = runs / uuid.uuid4().hex
    directory.mkdir(parents=True)
    source = directory / "input.png"
    image.save(source)
    raw = directory / "raw-model.glb"
    generation_report = directory / "generation.json"
    env = os.environ.copy()
    tools = code.parent / "tools"
    env["PATH"] = os.pathsep.join([str(tools / "git/mingw64/bin"), str(tools / "python"),
                                  str(tools / "python/Scripts"), env.get("PATH", "")])
    env.update(PYTHONNOUSERSITE="1", PYTHONDONTWRITEBYTECODE="1", SETUPTOOLS_USE_DISTUTILS="stdlib",
               HF_HOME=str(code / "models"), HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1")
    started = time.monotonic()
    command = [str(code / "venv/Scripts/python.exe"), "-u", str(Path(__file__).with_name("trellis_local_runner.py")),
               "--runtime", str(code), "--input", str(source), "--output", str(raw), "--report", str(generation_report),
               "--seed", str(seed), "--steps", str(steps), "--resolution", str(resolution),
               "--faces", str(faces), "--texture-size", str(texture)]
    flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    with (directory / "generation.log").open("w", encoding="utf-8") as log:
        subprocess.run(command, cwd=directory, env=env, stdout=log, stderr=subprocess.STDOUT, check=True,
                       timeout=int(os.environ.get("POWWOW_GENERATION_TIMEOUT", "1800")), creationflags=flags)
    evidence = json.loads(generation_report.read_text())
    evidence.update(profile=profile["profile"], input_preparation=preparation)
    evidence["source_sha256"] = hashlib.sha256(source.read_bytes()).hexdigest()
    blender = os.environ.get("BLENDER_BINARY", "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe")
    script = os.environ.get("POWWOW_BLENDER_SCRIPT", str(repo / "services/blender/validate.py"))
    from trellis_finalize import finalize
    return finalize(raw, payload, evidence, directory, blender, script, started)
