"""Transport security and validation tests; these never synthesize media."""
import base64
import io
import json
import os
import subprocess
import sys
import tempfile
import time
from types import SimpleNamespace
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image
import runtime


class WorkerContractTests(unittest.TestCase):
    def test_source_rejects_malformed_base64_and_nonimage(self):
        for encoded in ["invalid!", base64.b64encode(b"<html>not an image</html>").decode()]:
            with self.assertRaises(ValueError):
                runtime.source_image({"source_image": {"base64": encoded, "mime_type": "image/png"}})

    def test_source_preserves_alpha_and_normalizes_image(self):
        buffer = io.BytesIO()
        Image.new("RGBA", (32, 24), (255, 0, 0, 128)).save(buffer, "PNG")
        result = runtime.source_image({"source_image": {"base64": base64.b64encode(buffer.getvalue()).decode()}})
        self.assertEqual(result.size, (32, 24))
        self.assertEqual(result.getpixel((0, 0))[3], 128)

    def test_signed_output_rejects_unknown_hosts_and_plain_http_before_network(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "image.png"
            path.write_bytes(b"test")
            with patch.dict(os.environ, {"POWWOW_UPLOAD_HOSTS": "project.supabase.co"}), patch("httpx.request") as request:
                for url in ["http://project.supabase.co/object", "https://evil.example/object", "https://project.supabase.co.evil.example/object", "https://user@project.supabase.co/object"]:
                    with self.assertRaises(ValueError):
                        runtime.artifact(path, "image/png", {}, {"output_upload": {"url": url, "storage_key": "owner/output"}})
                request.assert_not_called()

    def test_inline_output_size_limit_and_hash(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "image.png"
            path.write_bytes(b"small artifact")
            result = runtime.artifact(path, "image/png", {}, {})
            self.assertEqual(base64.b64decode(result["base64"]), b"small artifact")
            self.assertEqual(len(result["metadata"]["sha256"]), 64)
            with patch.object(runtime, "MAX_INLINE_BYTES", 4):
                with self.assertRaises(ValueError):
                    runtime.artifact(path, "image/png", {}, {})

    def test_upload_failures_do_not_expose_signed_credentials(self):
        import httpx
        url = 'https://project.supabase.co/output?token=private-signed-token'
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'model.glb'
            path.write_bytes(b'output')
            with patch.dict(os.environ, {'POWWOW_UPLOAD_HOSTS': 'project.supabase.co'}), patch('httpx.request', side_effect=httpx.ConnectError(url)):
                with self.assertRaises(ValueError) as caught:
                    runtime.artifact(path, 'model/gltf-binary', {}, {'output_upload': {'url': url, 'storage_key': 'owner/model.glb'}})
                self.assertNotIn('private-signed-token', str(caught.exception))
                self.assertNotIn('https://', str(caught.exception))

    def test_development_http_upload_requires_flag_and_exact_loopback_host(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "model.glb"
            path.write_bytes(b"small output")
            with patch.dict(os.environ, {"POWWOW_UPLOAD_HOSTS": "127.0.0.1,localhost,evil.example",
                                         "POWWOW_ALLOW_LOCAL_STORAGE_HTTP": "1"}), patch("httpx.request") as request:
                result = runtime.artifact(path, "model/gltf-binary", {}, {"output_upload": {
                    "url": "http://127.0.0.1:56321/storage/v1/object/upload/sign/output", "storage_key": "owner/run/model.glb"}})
                self.assertEqual(result["storage_key"], "owner/run/model.glb")
                self.assertEqual(request.call_count, 1)
                with self.assertRaises(ValueError):
                    runtime.artifact(path, "model/gltf-binary", {}, {"output_upload": {
                        "url": "http://evil.example/object", "storage_key": "wrong"}})
                with patch.dict(os.environ, {"POWWOW_ALLOW_LOCAL_STORAGE_HTTP": "0"}):
                    with self.assertRaises(ValueError):
                        runtime.artifact(path, "model/gltf-binary", {}, {"output_upload": {
                            "url": "http://127.0.0.1:56321/object", "storage_key": "wrong"}})
                self.assertEqual(request.call_count, 1)

    def test_wrong_capability_is_rejected_before_loading_model(self):
        with patch.object(runtime, "image_pipeline") as loader:
            with self.assertRaises(ValueError):
                runtime.generate({"capability": "arbitrary_command", "prompt": "hello"})
            loader.assert_not_called()

    def test_health_reports_busy_while_local_generation_lock_is_held(self):
        import local_server
        with patch.dict(sys.modules, {"torch": SimpleNamespace(cuda=SimpleNamespace(is_available=lambda: True))}):
            self.assertFalse(local_server.health()["busy"])
            with runtime._lock:
                self.assertTrue(local_server.health()["busy"])
            self.assertFalse(local_server.health()["busy"])

    def test_blender_failure_keeps_only_raw_and_reports_error(self):
        from trellis_finalize import finalize
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            raw = directory / "raw.glb"
            raw.write_bytes(b"glTFraw fixture")
            with patch("trellis_finalize.subprocess.run", side_effect=subprocess.TimeoutExpired("blender", 180)):
                result = finalize(raw, {}, {"model": "test"}, directory, "blender", "validate.py", time.monotonic())
            self.assertEqual(len(result["artifacts"]), 1)
            self.assertEqual(result["artifacts"][0]["metadata"]["variant"], "raw")
            self.assertNotIn("blender_validation", result["artifacts"][0]["metadata"])
            self.assertEqual(result["error"]["code"], "postprocessing_failed")
            self.assertEqual(base64.b64decode(result["artifacts"][0]["base64"]), raw.read_bytes())

    def test_blender_success_uses_distinct_raw_and_final_destinations(self):
        from trellis_finalize import finalize
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            raw = directory / "raw.glb"
            raw.write_bytes(b"glTFraw fixture")
            targets = {name: {"url": "https://project.supabase.co/" + name, "storage_key": "run/" + name}
                       for name in ("raw", "final")}
            def validate(*args, **kwargs):
                (directory / "model.glb").write_bytes(b"glTFvalidated fixture")
                (directory / "validation.json").write_text(json.dumps({"tool": "Blender", "mesh_objects": 1}))
            with patch.dict(os.environ, {"POWWOW_UPLOAD_HOSTS": "project.supabase.co"}), \
                 patch("trellis_finalize.subprocess.run", side_effect=validate), patch("httpx.request") as request:
                result = finalize(raw, {"output_uploads": targets}, {"model": "test"}, directory,
                                  "blender", "validate.py", time.monotonic())
            self.assertNotIn("error", result)
            self.assertEqual([a["storage_key"] for a in result["artifacts"]], ["run/raw", "run/final"])
            self.assertEqual(result["artifacts"][1]["metadata"]["blender_validation"]["mesh_objects"], 1)
            self.assertEqual([call.args[1] for call in request.call_args_list],
                             ["https://project.supabase.co/raw", "https://project.supabase.co/final"])


if __name__ == "__main__":
    unittest.main()
