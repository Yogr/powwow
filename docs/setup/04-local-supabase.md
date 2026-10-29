# Local Supabase and deployment parity

Powwow uses Supabase Auth, PostgreSQL, and private Storage locally and in
production. The API remains the shared ownership boundary for web, Android,
and iOS. Local GPU inference is a separate service; changing that provider
does not change accounts, projects, jobs, or stored files.

## Start and sign in

Install Docker Desktop, Node.js/npm, and uv. Start Docker Desktop, then run:

```powershell
./scripts/setup-local.ps1
# Later sessions:
./scripts/start-local.ps1
./scripts/stop-local.ps1
```

Setup creates the isolated Supabase CLI project `powwow`, using pinned CLI
2.119.0. It creates a unique ES256 signing key and two confirmed local QA
accounts. Their credentials are in ignored `.data/supabase-qa.json`; they are
never printed and no email is sent. Sign in through http://localhost:5173.
Public client configuration is in `.data/supabase-public.json` and `/v1/config`.
Server secrets remain in ignored `.env` and are never returned to clients.

Normal sign-up requires confirmation. Open the confirmation message in the
local mailbox at http://127.0.0.1:56324. This mailbox captures local mail and
does not deliver messages externally.

| Service | Address |
|---|---|
| Auth, private Storage, Supabase API | http://127.0.0.1:56321 |
| PostgreSQL | `127.0.0.1:56322` |
| Studio | http://127.0.0.1:56323 |
| Local confirmation mailbox | http://127.0.0.1:56324 |

Existing local Supabase projects on ports 54321 or 55321 are independent.
Scripts verify Powwow's project labels and checkout path before stopping or
reconfiguring containers. They never use `supabase stop --all` or delete
volumes. Stopping preserves accounts, application tables, and stored files.
Old `.data/postgres` and `.data/artifacts` remain untouched and idle; they are
not migrated into this fresh workspace.

## Security matches the deployed contract

- `LOCAL_AUTH=false`: every private API call requires a Supabase user token.
- Unique local ES256 keys; JWT issuer and audience are verified via JWKS.
- Application tables enable row-level security and revoke browser database
  access. All client reads/writes pass through the API's ownership checks.
- The `artifacts` bucket is private. Downloads require API authorization.
  Workers receive a short-lived signed upload target for one preallocated key.
- Local HTTP signed uploads require the explicit development-only worker
  flag and an exact loopback allowlist. Hosted Supabase and workers use HTTPS.
- All published local Supabase ports bind to `127.0.0.1`. The CLI currently
  overrides the Docker network's loopback default; the startup helper verifies
  and corrects bindings for this checkout's own four published containers,
  preserving volumes and Kong's generated private files with their ownership.

Never publish this local developer stack to the internet. This follows the
[Supabase local development guidance](https://supabase.com/docs/guides/local-development).
The [configuration reference](https://supabase.com/docs/guides/local-development/cli/config)
documents the Auth, Storage, and port settings in `supabase/config.toml`.

## Android and iOS

Both clients use the same public Supabase URL/key as the web interface, plus
the shared API URL. For an Android emulator connected through adb, reverse
both ports before running with localhost configuration:

```powershell
adb reverse tcp:8000 tcp:8000
adb reverse tcp:56321 tcp:56321
```

Use public configuration only in client build defines. Never embed the service
role key, database credentials, or private signing key. Hosted clients use the
project's HTTPS Supabase URL and production API URL.

## Hosted deployment and Compose

Follow [account setup](02-accounts-and-deployment.md) to create hosted Supabase,
the private bucket, Runpod endpoints, and API/worker hosting. Copy `.env.example`
to ignored `.env.cloud`, set `APP_ENV=production`, keep `LOCAL_AUTH=false`, and
replace all database/Auth/Storage fields with that hosted project's values.
Set the GPU worker upload allowlist to its exact Supabase hostname and disable
`POWWOW_ALLOW_LOCAL_STORAGE_HTTP`. Configure provider endpoints explicitly.

`docker compose up --build -d` reads `.env.cloud` (or the path specified by
`POWWOW_COMPOSE_ENV_FILE`) and starts API, worker, and web only. It does not
create another database or artifact volume. Loopback URLs from `.env` would
point inside each container, so do not pass local `.env` to this deployment
stack. The Windows local launcher already connects native services to local
Supabase correctly and is the supported local development path.

The setup helper detects a configured HTTPS Supabase URL and leaves hosted
credentials unchanged. Local QA accounts are created only for the isolated
loopback project; no hosted users or external emails are created by setup.
