"""Connect Powwow to its own local Supabase. Writes secrets only to ignored files."""
from __future__ import annotations

import argparse
import json
import secrets
from pathlib import Path
from urllib.parse import urlsplit

import httpx

ROOT = Path(__file__).resolve().parents[1]


def write_env(updates: dict[str, str]) -> None:
    path = ROOT / ".env"
    if not path.exists():
        path.write_text((ROOT / ".env.example").read_text(encoding="utf-8"), encoding="utf-8")
    previous = path.read_text(encoding="utf-8-sig").splitlines()
    remaining = dict(updates)
    lines = []
    for line in previous:
        key = line.split("=", 1)[0].strip() if "=" in line and not line.lstrip().startswith("#") else None
        if key in updates:
            if key in remaining:
                lines.append(f"{key}={remaining.pop(key)}")
        else:
            lines.append(line)
    lines.extend(f"{key}={value}" for key, value in remaining.items())
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--create-qa", action="store_true")
    args = parser.parse_args()
    status = json.loads((ROOT / ".data/supabase-status.json").read_text(encoding="utf-8-sig"))
    base = status["API_URL"].rstrip("/")
    database = status["DB_URL"]
    if urlsplit(base).hostname not in {"127.0.0.1", "localhost"} or urlsplit(base).port != 56321 or urlsplit(database).port != 56322:
        raise RuntimeError("Refusing configuration from any Supabase project other than Powwow's isolated local stack")
    public_key = status.get("PUBLISHABLE_KEY") or status["ANON_KEY"]
    server_key = status["SERVICE_ROLE_KEY"]
    write_env({
        "APP_ENV": "development", "LOCAL_AUTH": "false",
        "DATABASE_URL": database.replace("postgresql://", "postgresql+psycopg://", 1),
        "STORAGE_BACKEND": "supabase", "SUPABASE_URL": base,
        "SUPABASE_ANON_KEY": public_key, "SUPABASE_SERVICE_ROLE_KEY": server_key,
        # Powwow signs user tokens with its own ES256 key, verified through JWKS.
        "SUPABASE_JWT_SECRET": "", "SUPABASE_STORAGE_BUCKET": "artifacts",
        "POWWOW_UPLOAD_HOSTS": "127.0.0.1,localhost",
        "POWWOW_ALLOW_LOCAL_STORAGE_HTTP": "1",
    })
    public = {"supabase_url": base, "supabase_anon_key": public_key, "studio_url": status.get("STUDIO_URL", "http://127.0.0.1:56323"), "mailbox_url": status.get("MAILPIT_URL") or status.get("INBUCKET_URL")}
    (ROOT / ".data/supabase-public.json").write_text(json.dumps(public, indent=2) + "\n", encoding="utf-8")
    headers = {"apikey": server_key, "Authorization": f"Bearer {server_key}"}
    with httpx.Client(base_url=base, headers=headers, timeout=30) as client:
        bucket = client.get("/storage/v1/bucket/artifacts")
        if bucket.status_code == 404:
            bucket = client.post("/storage/v1/bucket", json={"id": "artifacts", "name": "artifacts", "public": False, "file_size_limit": 104857600})
            bucket.raise_for_status()
        else:
            bucket.raise_for_status()
            if bucket.json().get("public") is not False:
                raise RuntimeError("The Powwow artifacts bucket must be private")
        if args.create_qa:
            path = ROOT / ".data/supabase-qa.json"
            accounts = json.loads(path.read_text()) if path.exists() else {}
            for label in ["primary", "secondary"]:
                account = accounts.get(label) or {"email": f"qa-{label}@powwow.local", "password": "Pw9!" + secrets.token_urlsafe(20)}
                existing = client.get(f"/auth/v1/admin/users/{account['user_id']}") if account.get("user_id") else None
                if existing is None or existing.status_code == 404:
                    created = client.post("/auth/v1/admin/users", json={"email": account["email"], "password": account["password"], "email_confirm": True, "user_metadata": {"name": f"Powwow {label} QA", "local_test_account": True}})
                    created.raise_for_status()
                    account["user_id"] = created.json()["id"]
                else:
                    existing.raise_for_status()
                accounts[label] = account
            path.write_text(json.dumps(accounts, indent=2) + "\n", encoding="utf-8")
    print("Powwow configured for Supabase Auth, PostgreSQL, and private Storage. Secrets remain in ignored local files.")
    if args.create_qa:
        print("Local QA sign-in details saved to .data/supabase-qa.json; no email was sent.")


if __name__ == "__main__":
    main()
