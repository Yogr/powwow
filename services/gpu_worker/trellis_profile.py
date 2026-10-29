"""Explicit reconstruction profiles and input evidence, not a finishing workflow."""
from PIL import Image


PROFILES = {
    "draft": {"resolution": 512, "steps": 12, "mesh_simplify": 50, "texture_size": 1024},
    "standard": {"resolution": 1024, "steps": 12, "mesh_simplify": 100, "texture_size": 2048},
    # Retained detailed-source parameters from Start a Gang's asset pipeline.
    # This is a candidate profile; its cost and visual quality need evaluation.
    "detailed": {"resolution": 1536, "steps": 32, "mesh_simplify": 1000, "texture_size": 4096},
}


def reconstruction_settings(settings: dict, *, default_profile: str = "draft") -> dict:
    from runtime import integer
    if settings.get("trellis_workflow", "reconstruction") != "reconstruction":
        raise ValueError("The full 3D finishing workflow is unavailable: AI input optimization, GPT-6 Blender repairs, and texture refinement are not implemented. No reconstruction was started.")
    profile = settings.get("trellis_profile", default_profile)
    if profile not in PROFILES:
        raise ValueError("TRELLIS profile must be draft, standard, or detailed")
    defaults = PROFILES[profile]
    resolved = {"profile": profile, "seed": integer(settings, "seed", 42, 0, 2**31 - 1)}
    for key, low, high in (("resolution", 512, 1536), ("steps", 1, 32),
                           ("mesh_simplify", 10, 1000), ("texture_size", 512, 4096)):
        resolved[key] = integer(settings, key, defaults[key], low, high)
    if resolved["resolution"] not in {512, 1024, 1536}:
        raise ValueError("TRELLIS resolution must be 512, 1024, or 1536")
    if resolved["texture_size"] not in {512, 1024, 2048, 4096}:
        raise ValueError("TRELLIS texture size must be 512, 1024, 2048, or 4096")
    return resolved


def input_evidence(image: Image.Image) -> dict:
    """Reject empty foreground before expensive inference and describe actual prep."""
    alpha = image.convert("RGBA").getchannel("A")
    bounds = alpha.point(lambda value: 255 if value > 204 else 0).getbbox()
    if bounds is None or bounds[2] - bounds[0] < 2 or bounds[3] - bounds[1] < 2:
        raise ValueError("The source image has no usable foreground; choose an image with a visible object")
    masked = alpha.getextrema()[0] < 255
    return {"width": image.width, "height": image.height, "foreground_bounds": list(bounds),
            "foreground_mask": "supplied_alpha" if masked else "none",
            "orientation": "EXIF normalized", "background_removal": False,
            "conditioning": "TRELLIS foreground crop from supplied alpha" if masked else "TRELLIS framing of unchanged opaque image",
            "ai_optimization": False}


def stage_evidence(evidence: dict, *, validated: bool = False) -> dict:
    requested = evidence.get("requested_resolution")
    effective = evidence.get("effective_resolution")
    return {"id": "trellis.reconstruction.v2", "qualification": "candidate",
            "profile": evidence.get("profile", "draft"),
            "stages": [
                {"id": "input_preparation", "status": "completed", "kind": "deterministic",
                 "details": evidence.get("input_preparation", {})},
                {"id": "trellis_reconstruction", "status": "completed", "model": evidence.get("model"),
                 "requested_resolution": requested, "effective_resolution": effective,
                 "resolution_reduced": effective < requested if isinstance(requested, int) and isinstance(effective, int) else None},
                {"id": "blender_validation", "status": "completed" if validated else "not_completed", "kind": "deterministic"},
                {"id": "ai_blender_finishing", "status": "unavailable"},
                {"id": "texture_refinement", "status": "unavailable"},
            ]}
