# Powwow application API

FastAPI and SQLAlchemy share PostgreSQL records across web and mobile clients.
The separate worker claims jobs using `FOR UPDATE SKIP LOCKED`, expiring leases,
and generation fencing. Restarting a browser does not interrupt model work.

Set `WORKER_CAPABILITIES=chat` on a cloud chat worker and
`WORKER_CAPABILITIES=text_to_image,image_to_video,image_to_3d` on a separate
media worker to keep long video jobs from delaying ordinary chat. Leave it
empty locally to serialize all GPU work on the single development device.

## Run

From this directory, after installing `requirements.txt`:

```powershell
python -m powwow.manage init-db
python -m uvicorn powwow.main:app --host 127.0.0.1 --port 8000
# In another terminal:
python -m powwow.worker
```

Settings load the repository `.env`. Both local and production use
`LOCAL_AUTH=false`, Supabase identity tokens, PostgreSQL, and private Storage.
Run the repository's `scripts/start-supabase.ps1` first. Local setup uses its
own ES256 signing key; the API verifies its JWKS, issuer, audience, and role.
Production requires HTTPS; HTTP Supabase URLs are accepted only on loopback
with `APP_ENV=development`. Restrict local API listeners to loopback.
Only the public Supabase URL and anon/publishable key are returned to clients.

`DATABASE_URL` uses `postgresql+psycopg://...`. SQLite is accepted only by tests.
Schema initialization uses a PostgreSQL advisory lock so API/worker startup is
safe when simultaneous. With Supabase, application tables automatically enable
RLS and revoke `PUBLIC`, `anon`, and `authenticated` table access; the API's
database role must own its tables. The explicit SQL equivalent is
`supabase-private-tables.sql`. Keep the artifacts bucket private.

This is the initial schema. `create_all` does not migrate an existing schema:
introduce reviewed database migrations before changing columns in a deployed
instance. Preserve the existing database and artifact volume when updating.

## Contracts

Interactive API reference: `/docs`. Export the shared schema:

```powershell
python -m powwow.manage export-openapi
```

Collections return arrays. Inference requires two separate calls: persist a
user message, then submit `/v1/runs` with its ID and an idempotency key. Reusing
that key with different inputs returns 409. The account row serializes budget
admission, preventing concurrent requests from reserving the same money.

Events persist before publication. `/v1/runs/{id}/events?after=sequence` returns
replayable JSON; `Accept: text/event-stream` enables SSE with `Last-Event-ID`.
Uploads accept verified PNG/JPEG/WebP, MP4, GLB, PDF, or UTF-8 text. Active HTML
and SVG are not accepted. Artifact downloads always check account ownership.

Context grants use captured chat/artifact snapshots or live project links.
Links resolve only their source's own records and never traverse other grants.
Revocation stops future retrieval; previous run snapshots retain provenance.

## Providers and costs

`OLLAMA_BASE_URL` and `OLLAMA_MODEL` enable local chat. Ollama returns its model
digest, token counts, and timing; weights unload after a request so a local
image model can use the GPU. `HTTP_MODEL_BASE_URL` enables the local media
worker's `/generate` endpoint. `POWWOW_WORKER_TOKEN` is optional authentication
for that server. Media requests apply versioned brief/motion instructions and
save both the original and prepared prompt.

Runpod uses separately configured `RUNPOD_*_ENDPOINT_ID` values. Provider IDs
persist before polling, so a lost polling connection resumes the same request.
An interrupted submission without a saved provider ID fails visibly and keeps
its budget reserved; inspect the provider dashboard before retrying. Automatic
retry is prohibited when submission or cancellation is uncertain.

Budgets reserve the requested maximum before dispatch. Runpod execution timeout
uses the configured `RUNPOD_HOURLY_RATE_USD`; set it to the actual endpoint's
rate. Provider duration billing is an estimate until invoice reconciliation.
Network volume, storage, model download, and billing increments may add cost.
Account limits block admission; they are not a guarantee that the provider's
final invoice cannot exceed the estimate. Local runs record zero provider fee
and measured wall time; electricity/hardware costs are not measured.

With Supabase storage, the API issues a signed upload target for each output.
GPU workers must allow only the configured Supabase hostname. Returned storage
keys are checked against the exact preallocated run key before validation.

Chat's `settings.web_search` opts into source lookup. Without a Brave key this
uses Wikipedia encyclopedia summaries and is labeled accordingly. A configured
`BRAVE_API_KEY` enables wider search. Configure it only with a plan granting result-storage rights, because source snapshots persist; see the account setup guide. Search is read-only, has fixed hosts and
deadlines, and records source URLs/capture times in the run snapshot.

Unconfigured capabilities are unavailable. The fixture provider is blocked
outside tests. Premium API providers are an explicit extension point and are
not enabled in this build.

## Verify

```powershell
python -m pytest tests -q
# Exercise actual PostgreSQL locking using an EMPTY dedicated test database:
$env:TEST_DATABASE_URL='postgresql+psycopg://user:password@localhost:56322/powwow_test'
python -m pytest tests -q
```

**The suite drops/recreates its test tables. Never point `TEST_DATABASE_URL`
at the application database.** Tests cover tenant isolation, snapshots and
revocation, single-hop grants, leases/fencing, cancel/retry, upload validation,
JWT validation, provider reconciliation, and PostgreSQL concurrency/budgets.

Limits: local media cancellation waits for the active HTTP inference call to
return; the UI remains `cancel_requested` while that compute finishes. GLB
container checks alone do not prove topology or material quality. Cloud model
quality, commercial component licenses, deployment credentials, and mobile
release/signing remain deployment validation tasks.

