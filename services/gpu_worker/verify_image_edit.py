"""One local image-edit evaluation. Never retries or contacts a paid provider.

Use the private local media service so its generation lock remains authoritative.
An existing report directory prevents accidental repeated submission.
"""
import argparse
import base64
import hashlib
import io
import json
import os
import time
from pathlib import Path
from urllib.parse import urlsplit

import httpx
from PIL import Image


def verify_result(result: dict, source_hash: str) -> tuple[bytes, dict]:
    outputs = result.get("artifacts", [])
    if result.get("error") or len(outputs) != 1:
        raise ValueError("Expected one completed image output")
    output = outputs[0]
    metadata = output.get("metadata", {})
    if output.get("mime_type") != "image/png" or metadata.get("simulated") is not False:
        raise ValueError("Expected a real PNG output")
    refs = metadata.get("reference_images", [])
    if metadata.get("media_operation") != "edit" or len(refs) != 1 or refs[0].get("sha256") != source_hash:
        raise ValueError("The result does not confirm the supplied reference was used")
    data = base64.b64decode(output.get("base64", ""), validate=True)
    if not data or hashlib.sha256(data).hexdigest() != metadata.get("sha256"):
        raise ValueError("Image output integrity check failed")
    with Image.open(io.BytesIO(data)) as image:
        dimensions = list(image.size)
        if image.format != "PNG":
            raise ValueError("Image output is not PNG")
        image.verify()
    return data, {"model": result.get("model"), "metadata": metadata,
                  "metrics": result.get("metrics", {}), "dimensions": dimensions}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--url", default="http://127.0.0.1:8188")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    if not args.execute:
        parser.error("--execute is required for one local GPU generation")
    parsed = urlsplit(args.url)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"} or parsed.username or parsed.password or parsed.query or parsed.fragment:
        parser.error("The evaluator accepts a loopback HTTP worker URL only")
    source = Path(args.input).resolve()
    data = source.read_bytes()
    if not data or len(data) > 20 * 1024 * 1024:
        parser.error("Input must be a nonempty image up to 20 MiB")
    with Image.open(io.BytesIO(data)) as image:
        if image.format not in {"PNG", "JPEG", "WEBP"}:
            parser.error("Input must be PNG, JPEG, or WebP")
        image.verify()
    source_hash = hashlib.sha256(data).hexdigest()
    output = Path(args.output_dir).resolve()
    if output.exists():
        parser.error("Report directory already exists. Inspect the earlier request; this evaluator never resubmits it.")
    headers = {}
    token = os.environ.get("POWWOW_WORKER_TOKEN")
    if token:
        headers["Authorization"] = "Bearer " + token
    with httpx.Client(timeout=30, follow_redirects=False) as client:
        health = client.get(args.url.rstrip("/") + "/health")
        health.raise_for_status()
        status = health.json()
        if status.get("busy") or status.get("status") != "available" or "edit" not in status.get("image_operations", []):
            raise RuntimeError("The local image editor is unavailable or busy; no request was submitted")
        output.mkdir(parents=True, exist_ok=False)
        record = {"status": "submitted", "source_sha256": source_hash, "prompt": args.prompt,
                  "seed": args.seed, "visual_review": "pending", "qualification": "candidate"}
        report = output / "report.json"
        report.write_text(json.dumps(record, indent=2), encoding="utf-8")
        started = time.monotonic()
        try:
            response = client.post(args.url.rstrip("/") + "/generate", headers=headers, timeout=1800,
                json={"capability": "text_to_image", "prompt": args.prompt,
                      "source_image": {"artifact_id": "evaluation-reference", "base64": base64.b64encode(data).decode()},
                      "settings": {"media_operation": "edit", "seed": args.seed}})
            response.raise_for_status()
            generated, evidence = verify_result(response.json(), source_hash)
            (output / "edited-reference.png").write_bytes(generated)
            record.update(status="completed", **evidence)
        except Exception as exc:
            record.update(status="failed_or_uncertain", error_type=type(exc).__name__)
            raise
        finally:
            record["elapsed_seconds"] = round(time.monotonic() - started, 3)
            report.write_text(json.dumps(record, indent=2), encoding="utf-8")
    print(str(report))


if __name__ == "__main__":
    main()
