"""Verify locally cached large model files against Hub's SHA256 inventory.

Usage: python verify_snapshot.py REPO REVISION
This is read-only: weights must already be cached. It prints an audit JSON and
exits nonzero if a large-file hash differs. Git-tracked small files use Git blob
hashes, not SHA256, and are identified separately.
"""
import argparse
import hashlib
import json
from pathlib import Path
from huggingface_hub import HfApi, hf_hub_download

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("repository")
    parser.add_argument("revision")
    args = parser.parse_args()
    # Diffusers intentionally downloads runtime files without model-card images.
    # Resolve an already cached config rather than requiring every repository file.
    root = Path(hf_hub_download(args.repository, "model_index.json", revision=args.revision, local_files_only=True)).parent
    info = HfApi().model_info(args.repository, revision=args.revision, files_metadata=True)
    files, errors = [], []
    for entry in info.siblings:
        if not entry.lfs:
            continue
        path = root / entry.rfilename
        expected = entry.lfs.sha256
        if not path.exists():
            files.append({"path": entry.rfilename, "status": "not_cached"})
            continue
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for block in iter(lambda: handle.read(8 * 1024 * 1024), b""):
                digest.update(block)
        match = digest.hexdigest() == expected
        files.append({"path": entry.rfilename, "sha256": digest.hexdigest(), "expected_sha256": expected, "match": match})
        if not match:
            errors.append(entry.rfilename)
    print(json.dumps({"repository": args.repository, "revision": info.sha, "files": files, "errors": errors}, indent=2))
    raise SystemExit(bool(errors))

if __name__ == "__main__":
    main()
