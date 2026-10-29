"""Live local Auth/database/private Storage checks. Never prints credentials."""
from __future__ import annotations

import hashlib
import io
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import httpx
import jwt
import psycopg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def require(condition: bool, label: str):
    if not condition:
        raise RuntimeError(label)


def main():
    public = json.loads((ROOT / ".data/supabase-public.json").read_text())
    private = json.loads((ROOT / ".data/supabase-status.json").read_text(encoding="utf-8-sig"))
    users = json.loads((ROOT / ".data/supabase-qa.json").read_text())
    base = public["supabase_url"]
    require(base == "http://127.0.0.1:56321", "Refusing a non-Powwow local project")
    public_headers = {"apikey": public["supabase_anon_key"]}
    clients = []
    algorithms = []
    for name in ["primary", "secondary"]:
        account = users[name]
        auth = httpx.post(base + "/auth/v1/token?grant_type=password", headers=public_headers, json={"email": account["email"], "password": account["password"]}, timeout=20)
        require(auth.status_code == 200, "QA sign-in failed")
        token = auth.json()["access_token"]
        algorithms.append(jwt.get_unverified_header(token)["alg"])
        clients.append(httpx.Client(base_url="http://127.0.0.1:8000", headers={"Authorization": "Bearer " + token}, timeout=30))
    first, second = clients
    require(algorithms == ["ES256", "ES256"], "Unexpected user-token signing algorithm")
    require(httpx.get("http://127.0.0.1:8000/v1/projects").status_code == 401, "Anonymous access was not blocked")
    require(first.get("/v1/config").json()["auth_mode"] == "supabase", "API did not enable Supabase Auth")
    project = first.post("/v1/projects", json={"name": "Supabase isolation verification"})
    require(project.status_code == 201, "Project creation failed")
    project_id = project.json()["id"]
    chat = first.post("/v1/chats", json={"project_id": project_id, "title": "Private storage check"})
    require(chat.status_code == 201, "Chat creation failed")
    chat_id = chat.json()["id"]
    require(first.post(f"/v1/chats/{chat_id}/messages", json={"content": "This verification message belongs to the primary QA account."}).status_code == 201, "Message persistence failed")
    stream = io.BytesIO()
    Image.new("RGB", (32, 24), (88, 136, 116)).save(stream, format="PNG")
    data = stream.getvalue()
    uploaded = first.post("/v1/uploads", data={"project_id": project_id, "chat_id": chat_id}, files={"file": ("storage-check.png", data, "image/png")})
    require(uploaded.status_code == 201, "Private Storage upload failed")
    artifact = uploaded.json()
    downloaded = first.get(artifact["download_url"])
    require(downloaded.status_code == 200 and downloaded.content == data, "Private download differs from uploaded bytes")
    isolated = [f"/v1/projects/{project_id}", f"/v1/chats/{chat_id}", f"/v1/chats/{chat_id}/messages", artifact["url"], artifact["download_url"]]
    require(all(second.get(path).status_code == 404 for path in isolated), "A second account accessed private workspace data")
    with psycopg.connect(private["DB_URL"]) as connection:
        owner, key = connection.execute("SELECT owner_id,storage_key FROM artifacts WHERE id=%s", (artifact["id"],)).fetchone()
        require(owner == users["primary"]["user_id"], "Artifact owner is not the authenticated Supabase user")
        table_security = connection.execute("SELECT c.relname,c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT'),has_table_privilege('authenticated',c.oid,'SELECT') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'").fetchall()
        require(table_security and all(row[1] and not row[2] and not row[3] for row in table_security), "Application table grants allow bypassing API ownership")
    anon_object = httpx.get(base + "/storage/v1/object/artifacts/" + key, headers=public_headers)
    require(anon_object.status_code in {400, 401, 403, 404}, "Anonymous Storage download succeeded")
    for headers in [public_headers, {**public_headers, **dict(second.headers)}]:
        rest = httpx.get(base + "/rest/v1/projects?select=id", headers=headers)
        require(rest.status_code in {401, 403, 404}, "Direct Data API exposed application tables")
    os.chdir(ROOT / "apps/api")
    sys.path.insert(0, str(ROOT / "apps/api"))
    from powwow.storage import Storage
    storage = Storage()
    target_key = users["primary"]["user_id"] + "/verification/" + str(uuid4()) + ".png"
    signed = storage.sign_output(target_key, "image/png")
    put = httpx.put(signed["url"], headers=signed["headers"], content=data, timeout=20)
    require(put.status_code in {200, 201}, "Signed worker upload failed")
    require(storage.read(target_key) == data, "Signed-upload stored bytes differ")
    bucket = httpx.get(base + "/storage/v1/bucket/artifacts", headers=storage.headers()).json()
    require(bucket.get("public") is False, "Artifact bucket is public")
    first.patch(f"/v1/projects/{project_id}", json={"archived": True})
    report = {
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "project": "powwow", "supabase_url": base, "postgres_port": 56322,
        "auth_mode": "supabase", "jwt_algorithm": "ES256", "users_verified": 2,
        "anonymous_api_status": 401, "cross_account_paths_denied": len(isolated),
        "private_bucket": True, "direct_table_access_revoked": True,
        "rls_tables_checked": len(table_security), "upload_download_sha256": hashlib.sha256(data).hexdigest(),
        "signed_worker_upload_verified": True,
        "project_id": project_id, "chat_id": chat_id, "artifact_id": artifact["id"],
        "native_database_preserved_unused": True,
    }
    (ROOT / "evals/reports/supabase-local.json").write_text(json.dumps(report, indent=2) + "\n")
    for client in clients:
        client.close()
    print("Supabase live checks passed: two ES256 sign-ins, anonymous denial, account isolation, private uploads/downloads, signed worker upload, and database RLS/grants.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Requests can contain signed URLs. Do not print raw exceptions/tokens.
        print("Supabase live verification failed: " + (str(error) if isinstance(error, RuntimeError) else type(error).__name__), file=sys.stderr)
        raise SystemExit(1)
