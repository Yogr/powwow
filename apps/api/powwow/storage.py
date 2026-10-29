import hashlib
import gzip
import io
import json
import struct
from pathlib import Path
from urllib.parse import quote, urlsplit

import httpx
from PIL import Image, UnidentifiedImageError

from .config import settings

MIME_EXT = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "video/mp4": ".mp4", "model/gltf-binary": ".glb", "application/x-blender": ".blend", "application/pdf": ".pdf", "text/plain": ".txt"}


def validate_content(data: bytes, mime: str, max_bytes: int | None = None) -> dict:
    if not data or len(data) > (max_bytes or settings().max_upload_bytes):
        raise ValueError("The file is empty or exceeds the allowed size.")
    if mime not in MIME_EXT:
        raise ValueError("Supported files: PNG, JPEG, WebP, MP4, GLB, PDF, and plain text.")
    details = {"validation": "file integrity", "simulated": False}
    if mime.startswith("image/"):
        try:
            with Image.open(io.BytesIO(data)) as image:
                if image.width * image.height > 40_000_000:
                    raise ValueError("Image dimensions exceed the 40 megapixel limit.")
                expected = {"image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WEBP"}[mime]
                if image.format != expected:
                    raise ValueError("Image contents do not match their MIME type.")
                details.update(width=image.width, height=image.height)
                image.verify()
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
            raise ValueError("The image cannot be decoded safely.") from exc
    elif mime == "model/gltf-binary":
        if len(data) < 20 or data[:4] != b"glTF" or struct.unpack_from("<II", data, 4) != (2, len(data)):
            raise ValueError("Invalid GLB 2.0 header or file length.")
        length, chunk_type = struct.unpack_from("<II", data, 12)
        if chunk_type != 0x4E4F534A or 20 + length > len(data):
            raise ValueError("GLB has no valid JSON scene chunk.")
        scene = json.loads(data[20:20 + length])
        if not scene.get("meshes"):
            raise ValueError("GLB does not contain any meshes.")
        details.update(mesh_count=len(scene["meshes"]), material_count=len(scene.get("materials", [])), blender_validated=False, validation="GLB container and scene structure; topology/material quality not evaluated")
    elif mime == "video/mp4":
        if b"ftyp" not in data[:64]:
            raise ValueError("The file is not a supported MP4 container.")
        details["validation"] = "MP4 container signature; playback validation is performed by the model worker"
    elif mime == "application/x-blender":
        header = data[:7]
        if data.startswith(b'\x1f\x8b'):
            try:
                with gzip.GzipFile(fileobj=io.BytesIO(data)) as stream:
                    header = stream.read(7)
            except (OSError, EOFError) as exc:
                raise ValueError('Invalid compressed Blender scene.') from exc
        if header != b"BLENDER":
            raise ValueError("Invalid Blender scene header.")
        details["validation"] = "Blender file signature; never execute embedded scripts"
    elif mime == "application/pdf" and not data.startswith(b"%PDF-"):
        raise ValueError("The file is not a PDF.")
    elif mime == "text/plain":
        try:
            content = data.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise ValueError("Plain text files must be UTF-8.") from exc
        if "\x00" in content:
            raise ValueError("Binary data is not a plain text file.")
        details["text_excerpt"] = content[:12000]
    return details


def kind_for(mime: str) -> str:
    return "image" if mime.startswith("image/") else "video" if mime.startswith("video/") else "model3d" if mime == "model/gltf-binary" else "document"


class Storage:
    def __init__(self):
        self.cfg = settings()

    def local_path(self, key: str) -> Path:
        root = self.cfg.storage_path.resolve()
        path = (root / key).resolve()
        if not path.is_relative_to(root):
            raise ValueError("Invalid storage key")
        return path

    def headers(self) -> dict:
        return {"Authorization": f"Bearer {self.cfg.supabase_service_role_key}", "apikey": self.cfg.supabase_service_role_key}

    def object_url(self, key: str) -> str:
        return f"{self.cfg.supabase_url.rstrip('/')}/storage/v1/object/{quote(self.cfg.supabase_storage_bucket, safe='')}/{quote(key, safe='/')}"

    def put(self, key: str, data: bytes, mime: str):
        if self.cfg.storage_backend == "supabase":
            response = httpx.post(self.object_url(key), headers={**self.headers(), "Content-Type": mime, "x-upsert": "true"}, content=data, timeout=120)
            response.raise_for_status()
        else:
            path = self.local_path(key)
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary = path.with_suffix(path.suffix + ".partial")
            temporary.write_bytes(data)
            temporary.replace(path)

    def read(self, key: str, max_bytes: int = 100 * 1024 * 1024) -> bytes:
        if self.cfg.storage_backend == "supabase":
            with httpx.stream("GET", self.object_url(key), headers=self.headers(), timeout=120) as response:
                response.raise_for_status()
                data = bytearray()
                for chunk in response.iter_bytes():
                    data.extend(chunk)
                    if len(data) > max_bytes:
                        raise ValueError("Stored output exceeds its size limit.")
                return bytes(data)
        path = self.local_path(key)
        if path.stat().st_size > max_bytes:
            raise ValueError("Stored output exceeds its size limit.")
        return path.read_bytes()

    def delete(self, key: str):
        """Remove stored bytes for explicit deletion or expired local staging."""
        if self.cfg.storage_backend == "supabase":
            url = f"{self.cfg.supabase_url.rstrip('/')}/storage/v1/object/{quote(self.cfg.supabase_storage_bucket, safe='')}"
            response = httpx.request("DELETE", url, headers=self.headers(), json={"prefixes": [key]}, timeout=30)
            if response.status_code != 404:
                response.raise_for_status()
        else:
            self.local_path(key).unlink(missing_ok=True)

    def sign_output(self, key: str, mime: str) -> dict | None:
        if self.cfg.storage_backend != "supabase":
            return None
        url = f"{self.cfg.supabase_url.rstrip('/')}/storage/v1/object/upload/sign/{quote(self.cfg.supabase_storage_bucket, safe='')}/{quote(key, safe='/')}"
        response = httpx.post(url, headers={**self.headers(), "x-upsert": "true"}, json={}, timeout=20)
        response.raise_for_status()
        result = response.json()
        signed = result.get("url") or result.get("signedURL") or result.get("signedUrl")
        if not signed:
            raise ValueError("Supabase did not return a signed upload URL.")
        base = self.cfg.supabase_url.rstrip("/")
        parsed = urlsplit(signed)
        if not parsed.scheme:
            if parsed.netloc:
                raise ValueError("Supabase returned an invalid signed upload destination.")
            signed = base + (signed if signed.startswith("/storage/v1/") else "/storage/v1/" + signed.lstrip("/"))
        target, origin = urlsplit(signed), urlsplit(base)
        if (target.scheme, target.hostname, target.port) != (origin.scheme, origin.hostname, origin.port) or target.username or target.password or not target.path.startswith("/storage/v1/object/upload/sign/"):
            raise ValueError("Supabase returned a signed upload URL outside its configured origin.")
        local_http = self.cfg.app_env in {"development", "test"} and target.scheme == "http" and target.hostname in {"127.0.0.1", "localhost", "::1"}
        if target.scheme != "https" and not local_http:
            raise ValueError("Signed upload URLs require HTTPS outside loopback development.")
        return {"url": signed, "method": "PUT", "headers": {"Content-Type": mime}, "storage_key": key}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
