"""Preserve generated geometry before bounded Blender validation and export."""
import json
import subprocess
import time
from pathlib import Path


def finalize(raw, payload, evidence, directory, blender, script, started):
    from runtime import artifact
    from trellis_profile import stage_evidence
    if raw.read_bytes()[:4] != b"glTF":
        raise ValueError("TRELLIS did not export a GLB")
    targets = payload.get("output_uploads") or {}

    def transport(variant):
        value = dict(payload)
        value.pop("output_upload", None)
        target = targets.get(variant) or (payload.get("output_upload") if variant == "final" else None)
        if target:
            value["output_upload"] = target
        return value

    # Upload the raw result first. A validation crash must not discard a costly
    # successful reconstruction when the API has supplied durable destinations.
    raw_metadata = {**evidence, "variant": "raw", "raw_preserved": True,
                    "workflow_execution": stage_evidence(evidence)}
    result = {"artifacts": [artifact(raw, "model/gltf-binary", raw_metadata, transport("raw"))],
              "model": evidence["model"], "provenance": {**evidence, "workflow_execution": stage_evidence(evidence)}}
    final, report = directory / "model.glb", directory / "validation.json"
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    try:
        with (directory / "blender.log").open("w", encoding="utf-8") as log:
            subprocess.run([str(blender), "--background", "--factory-startup", "--disable-autoexec",
                            "--python-exit-code", "1", "--python", str(script), "--", "--input", str(raw),
                            "--output", str(final), "--report", str(report)], check=True, timeout=180,
                           stdout=log, stderr=subprocess.STDOUT, creationflags=flags)
        validation = json.loads(report.read_text())
        if final.read_bytes()[:4] != b"glTF":
            raise ValueError("Blender did not export a GLB")
        metadata = {**evidence, "variant": "validated", "raw_preserved": True,
                    "blender_validation": validation,
                    "workflow_execution": stage_evidence(evidence, validated=True)}
        result["artifacts"].append(artifact(final, "model/gltf-binary", metadata, transport("final")))
        result["provenance"]["workflow_execution"] = stage_evidence(evidence, validated=True)
    except Exception as exc:
        # Return the raw artifact with an explicit failure. The API records it
        # and marks this run failed; it must never claim Blender validation.
        error = {"code": "postprocessing_failed", "stage": "blender_export_or_upload",
                 "message": "The generated raw model was preserved, but Blender export or final upload failed.",
                 "cause": type(exc).__name__}
        (directory / "finalization-error.json").write_text(json.dumps(error, indent=2))
        result["error"] = error
    result["metrics"] = {"worker_seconds": round(time.monotonic() - started, 3), "simulated": False}
    return result
