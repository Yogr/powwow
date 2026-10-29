"""Media transport/profile checks only; fixtures do not establish model quality."""
import base64
import hashlib
import io
import tempfile
from contextlib import nullcontext
from pathlib import Path
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import Mock, patch

from PIL import Image

import runtime
from trellis_profile import input_evidence, reconstruction_settings, stage_evidence
from verify_image_edit import verify_result


def reference(color, artifact_id="source-asset"):
    output = io.BytesIO()
    Image.new("RGBA", (32, 32), color).save(output, "PNG")
    return {"artifact_id": artifact_id, "base64": base64.b64encode(output.getvalue()).decode()}


class ImageEditingTests(TestCase):
    def test_edit_passes_each_reference_pixels_and_records_source_hashes(self):
        sources = [reference((255, 0, 0, 255)), reference((0, 0, 255, 128), "second-asset")]
        pipeline = Mock(return_value=SimpleNamespace(images=[Image.new("RGB", (256, 256), "red")]))
        torch = SimpleNamespace(
            cuda=SimpleNamespace(reset_peak_memory_stats=lambda: None, max_memory_allocated=lambda: 0),
            inference_mode=nullcontext,
            Generator=lambda **kwargs: SimpleNamespace(manual_seed=lambda seed: seed))
        payload = {"prompt": "Redraw the selected subject on a plain background", "source_images": sources,
                   "settings": {"media_operation": "edit", "seed": 42, "width": 256, "height": 256}}
        with tempfile.TemporaryDirectory() as temp, patch.dict("sys.modules", {"torch": torch}), \
                patch.object(runtime, "IMAGE_MODEL", "black-forest-labs/FLUX.2-klein-4B"), \
                patch.object(runtime, "image_pipeline", return_value=pipeline):
            path, mime, metadata, _ = runtime.generate_image(payload, Path(temp))
            self.assertTrue(path.is_file())
        call = pipeline.call_args.kwargs
        self.assertEqual(len(call["image"]), 2)
        self.assertEqual(call["image"][0].getpixel((0, 0)), (255, 0, 0))
        self.assertEqual(call["image"][1].getpixel((0, 0)), (127, 127, 255))
        self.assertEqual(mime, "image/png")
        self.assertEqual(metadata["media_operation"], "edit")
        self.assertEqual(metadata["reference_images"][0]["sha256"], hashlib.sha256(base64.b64decode(sources[0]["base64"])).hexdigest())
        self.assertEqual(metadata["reference_images"][1]["artifact_id"], "second-asset")

    def test_missing_reference_and_unsupported_model_never_load_a_model(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(runtime, "image_pipeline") as loader:
            with self.assertRaisesRegex(ValueError, "Choose an image"):
                runtime.generate_image({"prompt": "Edit", "settings": {"media_operation": "edit"}}, Path(temp))
            with patch.object(runtime, "IMAGE_MODEL", "stabilityai/sd-turbo"):
                with self.assertRaisesRegex(ValueError, "cannot edit reference"):
                    runtime.generate_image({"prompt": "Edit", "source_image": reference((255, 0, 0, 255)),
                                            "settings": {"media_operation": "edit"}}, Path(temp))
            loader.assert_not_called()

    def test_create_never_silently_discards_references(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(runtime, "image_pipeline") as loader:
            with self.assertRaisesRegex(ValueError, "require the edit operation"):
                runtime.generate_image({"prompt": "Create", "source_image": reference((255, 0, 0, 255)),
                                        "settings": {"media_operation": "create"}}, Path(temp))
            loader.assert_not_called()

    def test_reference_count_and_total_byte_limit(self):
        source = reference((255, 0, 0, 255))
        with self.assertRaisesRegex(ValueError, "eight"):
            runtime.image_references({"source_images": [source] * 9})
        raw_size = len(base64.b64decode(source["base64"]))
        with patch.object(runtime, "MAX_SOURCE_BYTES", raw_size + 1):
            with self.assertRaisesRegex(ValueError, "combined"):
                runtime.image_references({"source_images": [source, source]})
        with self.assertRaisesRegex(ValueError, "not both"):
            runtime.image_references({"source_image": source, "source_images": [source]})

    def test_live_evaluator_requires_reference_and_output_integrity_evidence(self):
        source = reference((255, 0, 0, 255))
        data = base64.b64decode(source["base64"])
        digest = hashlib.sha256(data).hexdigest()
        output = {"mime_type": "image/png", "base64": source["base64"], "metadata": {
            "simulated": False, "media_operation": "edit", "reference_images": [{"sha256": "source-hash"}],
            "sha256": digest}}
        actual, evidence = verify_result({"artifacts": [output], "model": "fixture"}, "source-hash")
        self.assertEqual(actual, data)
        self.assertEqual(evidence["dimensions"], [32, 32])
        with self.assertRaisesRegex(ValueError, "reference was used"):
            verify_result({"artifacts": [output]}, "wrong-source")
        output["metadata"]["sha256"] = "wrong-output-hash"
        with self.assertRaisesRegex(ValueError, "integrity"):
            verify_result({"artifacts": [output]}, "source-hash")


class TrellisProfileTests(TestCase):
    def test_detailed_profile_preserves_source_recipe_and_draft_is_explicit(self):
        detailed = reconstruction_settings({"trellis_profile": "detailed"})
        self.assertEqual({k: detailed[k] for k in ("resolution", "steps", "mesh_simplify", "texture_size")},
                         {"resolution": 1536, "steps": 32, "mesh_simplify": 1000, "texture_size": 4096})
        self.assertEqual(reconstruction_settings({})["profile"], "draft")
        self.assertEqual(reconstruction_settings({}, default_profile="standard")["resolution"], 1024)
        for invalid in ({"resolution": 700}, {"texture_size": 3000}, {"steps": True}, {"trellis_profile": "best"}):
            with self.assertRaises(ValueError):
                reconstruction_settings(invalid)

    def test_full_workflow_cannot_silently_execute_reconstruction(self):
        with self.assertRaisesRegex(ValueError, "No reconstruction was started"):
            reconstruction_settings({"trellis_workflow": "full"})

    def test_blank_image_fails_before_inference_and_opaque_is_not_called_removed(self):
        with self.assertRaisesRegex(ValueError, "no usable foreground"):
            input_evidence(Image.new("RGBA", (32, 32), (0, 0, 0, 0)))
        evidence = input_evidence(Image.new("RGBA", (32, 32), (255, 0, 0, 255)))
        self.assertEqual(evidence["foreground_mask"], "none")
        self.assertFalse(evidence["background_removal"])
        self.assertFalse(evidence["ai_optimization"])

    def test_stage_evidence_reports_missing_finishing_and_resolution_reduction(self):
        report = stage_evidence({"profile": "detailed", "requested_resolution": 1536,
                                 "effective_resolution": 1024, "model": "TRELLIS"}, validated=True)
        stages = {stage["id"]: stage for stage in report["stages"]}
        self.assertTrue(stages["trellis_reconstruction"]["resolution_reduced"])
        self.assertEqual(stages["blender_validation"]["status"], "completed")
        self.assertEqual(stages["ai_blender_finishing"]["status"], "unavailable")
        self.assertEqual(stages["texture_refinement"]["status"], "unavailable")
