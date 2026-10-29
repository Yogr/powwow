"""Readable output names from the saved subject or original creation brief.

This is a local naming step, not an additional model request. Storage keys and
artifact IDs remain the unique identity; filenames can be shared across versions.
"""
import re
import unicodedata

EXTENSIONS = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp",
              "video/mp4": ".mp4", "model/gltf-binary": ".glb", "application/pdf": ".pdf",
              "text/plain": ".txt", "audio/wav": ".wav", "audio/x-wav": ".wav",
              "audio/mpeg": ".mp3", "audio/ogg": ".ogg", "audio/flac": ".flac"}


def requested_name(prompt: str) -> str | None:
    """Explicit filename for fixed-workflow calls that need no AI routing."""
    match = re.search(r"\b(?:name[ds]?|call(?:ed)?|save(?:d)?|filename)\b[^\n]{0,60}?[\"']([^\"'\n]+\.(?:png|jpe?g|webp|glb|mp4|wav|mp3|ogg|flac|pdf|txt))[\"']", prompt, re.I)
    if not match:
        match = re.search(r"\b(?:name[ds]?|call(?:ed)?|save(?:d)?|filename)\b[^\n]{0,60}?\b([\w-]+\.(?:png|jpe?g|webp|glb|mp4|wav|mp3|ogg|flac|pdf|txt))\b", prompt, re.I)
    return match.group(1) if match else None


def safe_filename(name: str, mime: str) -> str:
    # A filename is metadata, never a path. Preserve case and ordinary spaces.
    stem = re.sub(r"[<>:\"/\\|?*\x00-\x1f]", "-", unicodedata.normalize("NFKC", name))
    stem = re.sub(r"\.[a-zA-Z0-9]{1,8}$", "", stem).strip(" .")[:140].rstrip(" .") or "project-asset"
    if stem.split(".")[0].upper() in {"CON", "PRN", "AUX", "NUL", *[f"COM{i}" for i in range(10)], *[f"LPT{i}" for i in range(10)]}:
        stem = "asset-" + stem
    return stem + EXTENSIONS.get(mime, ".bin")


def generated_name(run, mime: str, metadata: dict, index: int = 0) -> str:
    explicit = requested_name(run.prompt) or run.settings.get("requested_filename")
    if explicit:
        name = safe_filename(explicit, mime)
        # The final result gets the requested name. Retained intermediates are
        # distinct assets, not a second generation or the final deliverable.
        if metadata.get("variant") in {"raw", "preview", "thumbnail"}:
            stem, extension = name.rsplit(".", 1)
            return f"{stem}-{metadata['variant']}.{extension}"
        return name
    subject = run.settings.get("asset_subject") or run.prompt
    subject = next((line.strip() for line in subject.splitlines() if line.strip()), "")
    subject = re.sub(r"^(?:(?:please|can you|could you|i want you to|i need you to)\s+)+", "", subject, flags=re.I)
    subject = re.sub(r"^(?:create|generate|make|draw|render|compose|produce|design|illustrate|paint)\s+", "", subject, flags=re.I)
    subject = re.sub(r"^(?:(?:a|an|the)\s+)?(?:image|picture|photo|photograph|illustration|video|clip|3d model|model|sound|music|song|track|audio)(?:\s+(?:of|for|about|showing))?\s+", "", subject, flags=re.I)
    subject = re.sub(r"^(?:a|an|the)\s+", "", subject, flags=re.I)
    words = re.findall(r"[^\W_]+", unicodedata.normalize("NFKC", subject), flags=re.UNICODE)
    stem = "-".join(words[:10]).lower()[:90].strip("-") or "project-asset"
    if stem.upper() in {"CON", "PRN", "AUX", "NUL", *[f"COM{i}" for i in range(10)], *[f"LPT{i}" for i in range(10)]}:
        stem = "asset-" + stem
    variant = metadata.get("variant")
    suffix = "-" + variant if variant in {"raw", "validated", "preview", "thumbnail"} else f"-{index + 1}" if index else ""
    return stem + suffix + EXTENSIONS.get(mime, ".bin")
