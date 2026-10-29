# Implementation status and acceptance evidence

Updated October 1, 2026 on Windows. This is the authoritative implementation update to the planning package. The local web application, shared API, durable worker, and real chat/image/3D runtimes are implemented. The complete three-capability cloud PoC is **not yet accepted**: no paid accounts were provisioned, and the native video/3D model containers have not executed on rented GPUs.

## Decisions made

- React/TypeScript web, Flutter mobile, FastAPI/Python shared backend, PostgreSQL queue/domain records, private artifact storage.
- Runpod custom serverless GPU containers; Supabase identity/database/storage; Railway CPU API and workers; Cloudflare Pages Free or Vercel Pro for the static web app.
- Local Docker Supabase supplies Auth, PostgreSQL, and private Storage using a separate `powwow` project on ports 56321–56324. Native NVIDIA inference remains local. The earlier standalone PostgreSQL and file store are no longer the development defaults. Dummy data was not migrated, and unrelated Supabase projects were preserved. CPU API and web images previously built successfully; GPU container builds remain unverified.
- FLUX.2 klein 4B for images, Qwen3-4B-Instruct-2507 for chat and local intent selection, and the existing cached TRELLIS.2-4B Windows installation for local 3D. Wan2.2 TI2V-5B and Linux GPU containers remain deployment candidates until their own acceptance tests pass.
- Local and production clients use Supabase user tokens. Provider keys and database administrator credentials remain on backend services. The old development authentication bypass is disabled in the normal local setup.

See [provider ranking and sourced prices](../setup/01-provider-decision.md) and [accounts/deployment instructions](../setup/02-accounts-and-deployment.md). GPU-provider ratings are engineering judgments, not measured cost/performance benchmarks.

## Delivered behavior

### Web workspace

Project/chat creation, renaming, archive/restore, search, moving chats, private context scopes, directional context grants and revocation, uploads, saved artifacts, favorites, download, request settings, job status, cancellation, and explicit retries. Desktop uses resizable conversation/output panes; phone widths use Chat/Output/Details. Image zoom, MP4 playback, and GLB orbit/reset/wireframe render in the browser.

Unconfirmed generation and retry requests keep their exact payload and idempotency key in account-scoped session storage. Refreshing the browser exposes a recovery action that confirms the original request. New submissions are blocked until it is resolved; changing a draft cannot silently change the pending request's budget or settings.

The interface reads the API capability catalog. Customers start with **Let Powwow choose**, describe an outcome, or choose Talk & write, image, video, or 3D. **Explore Powwow** explains outcomes without provider setup controls or connection badges. Image controls appear only for image work. Video remains unavailable until its runtime is qualified; a fixture cannot masquerade as model output. Supabase sign-in replaces the shared local account.

### Shared backend

PostgreSQL stores projects, chats, messages, runs, ordered events, context grants, usage, and artifact metadata. Workers claim jobs using database leases and fencing. Idempotency keys prevent duplicate logical run creation. Uncertain Runpod submissions are not automatically paid again; known remote jobs are reconciled. Budget reservations include unfinished work. These estimates are not a hard cap on provider invoices, especially cold starts, idle time, and storage.

Project isolation and grant resolution happen in the backend. Every run saves the actual selected context and skill/model metadata. Revocation excludes sources from later requests; prior generated content is retained. Supabase JWT signatures, issuer, audience, role, and expiration are checked. Direct client access to API-owned database tables is revoked and row-level security enabled during production initialization.

The API and worker are separate deployable processes. Production can use separate chat/media worker capability filters; local execution stays serial to share the 16 GB GPU safely. Jobs persist after browsers close. Local GPU cancellation can discard a result while an already executing model call finishes; it cannot immediately reclaim every in-flight GPU kernel.

### Skills, research, and model execution

Before saving a new message, clients call `/v1/intent`. A bounded Qwen request classifies the intended deliverable and whether factual lookup is needed. The backend maps this to registered capabilities and skills, checks availability and required source images, and stores an account-owned decision valid for ten minutes. Run admission verifies that the prompt and attachments still match. Accepted requests can safely replay after this planning decision expires.

The classifier can choose only a fixed task enum; it cannot select arbitrary URLs, models, credentials, tools, or shell commands. If local inference is busy or unavailable, conservative rules provide a fallback and the recorded method says `rules`. Explicit customer outcome choices remain authoritative. This is one bounded selection step and a versioned workflow, not an unrestricted agent loop or general MCP marketplace.

Novel requests apply `story_development@1`: preserve the premise, establish character motivation and coherent story beats, distinguish fiction from sourced history, and end with a useful next drafting step. Local and cloud chat allow 4096 output tokens for this skill and 2048 otherwise. Responses record truncation; the web interface displays partial text while a run is active and a continuation notice when the limit is reached.

Versioned answer guidance and creative brief preparation are recorded with original and prepared prompts. Wikipedia retrieval can be chosen automatically for research and remains available without credentials. Retrieved links are displayed independently of model prose. Broad web search requires the optional Brave API key; Wikipedia alone is not a general search engine. Document uploads are stored, but full PDF/document extraction and retrieval are not implemented.

Ollama serves the pinned Qwen instruct model. A CUDA PyTorch/diffusers worker runs pinned FLUX locally. GPU results are validated and stored through the same artifact API used by Runpod. Runpod model containers are separate for chat, image, video, and TRELLIS because their runtime requirements differ.

A headless Blender tool imports GLB, checks finite geometry, triangle limits and material/image references, and exports a validated GLB. The existing Startagang-associated TRELLIS installation now runs through Powwow without changing that application or downloading duplicate weights. A real 512-resolution reconstruction and Blender export passed on this laptop. Raw and validated GLBs have separate artifact records and source lineage. If final validation fails, the raw output remains available and the run is marked failed. See [runtime setup and measured evidence](../setup/03-existing-local-trellis.md).

Powwow coordinates its local classifier, Ollama, and media calls with a PostgreSQL advisory lock. The TRELLIS adapter releases its subprocess memory after each request, and unused 1024-resolution models are omitted from the temporary 512 configuration. This makes the tested path fit the laptop's 16 GB GPU and 32 GB RAM; it does not establish that larger settings or concurrent external GPU applications fit.

### Mobile and contracts

The Flutter slice provides Supabase sign-in, project/chat navigation, chat/image submission, polling/resume, persistent request IDs for uncertain submissions, cancellation/retry, workflow details, and image previews. It uses the same API and generated Dart schemas as the web client's generated TypeScript contract. Android ran on the local emulator and submitted a real chat through the backend. Full mobile media editing/viewer parity is later work.

An iOS project and optional macOS CI build are included. iOS compilation, signing, device behavior, and store release have not been verified on this Windows host. The Android package is a debug build with provisional application identity.

## Verification performed

| Check | Evidence and result |
|---|---|
| API behavior/security/recovery | **28 tests passed** against a dedicated real PostgreSQL database, including 4 search tests and a regression for preserving source-image attachment order. Tests cover tenant checks, context/grants, idempotency, budget/retry/recovery, JWT/storage behavior, and source-query handling |
| GPU transport/validation | **5 contract tests passed**; separate from expensive model inference |
| Full browser workflow | **21 checks passed**, zero recorded page errors; real chat/source request, project/context flow, viewers/downloads, and desktop/tablet/phone navigation |
| Browser request recovery | **8 checks passed** against the real API; deliberately dropped accepted responses, exact run/retry payload replay after reload, concurrent retry prevention, one logical run, and definitive rejection recovery |
| Responsive layout | Screenshots and overflow checks at 320, 390, 768, and 1440 px; divider keyboard control and reload persistence verified |
| Web distribution | Production Vite build passed; npm audit reported zero known vulnerabilities at check time |
| Flutter | Analysis clean; **3 unit/widget tests passed**; Android debug APK built |
| Android real integration | **1 device integration test passed**: submit to shared API, receive exact actual model answer, open Details and Output |
| Local real chat/image | End-to-end script passed duplicate-request replay, ordered events, genuine image generation, persistence, and authenticated download |
| Blender | Real Blender 5.2.1 imported/exported the fixture: 323 vertices, 528 triangles, 1 mesh, 1 material, no missing images |
| Infrastructure | Full six-service stop/start passed: all five ports returned healthy, database ID inventories unchanged, and all 10 artifact SHA-256 values preserved. Compose configuration and CI actionlint passed. CPU API/web Docker builds and an isolated DB/API/web container smoke passed (proxy, CORS, project/chat creation, API restart persistence, complete cleanup); GPU builds and hosted CI execution remain unverified |

Key evidence:

- [Live run records](../../evals/reports/local-live-smoke.json) and [actual generated image](../../evals/reports/local-live-image.png).
- [Browser QA results](../../evals/reports/ui-validation/results.json) and screenshots in that directory.
- [Browser idempotency/recovery results](../../evals/reports/ui-validation/idempotency-results.json).
- [Responsive checks](../../evals/reports/browser-layout.json) and `evals/reports/screenshots`.
- [Service restart and data-integrity report](../../evals/reports/local-services.json).
- [Docker build, isolated container smoke, and cleanup report](../../evals/reports/docker-validation.json).
- [Blender report](../../evals/reports/blender-validation.json).
- [Android validation](../../evals/reports/android-validation.json) and [native app screenshot](../../evals/reports/android-workspace.png).
- [FLUX snapshot audit](../../evals/reports/flux-snapshot-verification.json): all five cached LFS files matched their upstream SHA-256 values; optional model-card images and the alternative monolithic weight file were not downloaded.
- Reproduction scripts: `scripts/live-smoke.py`, `apps/web/scripts/browser-qa.mjs`, `apps/web/scripts/idempotency-qa.mjs`, `apps/mobile/integration_test/shared_backend_test.dart`, and `scripts/test-local-scripts.ps1`.

The recorded end-to-end FLUX request used a 768×768 output and seed 42; the worker reported **68.718 seconds**, with roughly 70 seconds from job start to completion. This was one laptop run including model loading, not a warm-throughput benchmark or cloud prediction. The exact generated image and settings are in the report. The first direct image run took approximately 66 seconds. No cloud invoice or cost-per-accepted-output measurement exists yet.

## Remaining acceptance gates

| Planning milestone | Current status | What remains |
|---|---|---|
| 0: contracts and stack | Implemented | Keep generated clients synchronized as API evolves |
| 1: interactive web | Implemented with real backend | Full composed multistage failure/retained-output flow requires later worker work |
| 2: persistent backend/mobile | Supabase Auth/database/private Storage wired locally; shared mobile client implemented | Hosted Supabase acceptance; versioned schema migrations; iOS build/device validation |
| 3: rented GPU image | Actual local inference passed; cloud code supplied | Build/push image, provision Runpod, test cold/warm runs, interruption/recovery, and actual charges |
| 4: video/3D/tool | Local TRELLIS inference, raw retention, and Blender export verified | Execute Wan; build and verify Linux GPU containers; resolve gated DINO access for cloud deployment |
| 5: routing/premium/composition | Local model-assisted intent, writing/research guidance, and rules fallback implemented | Broader classifier evaluation, hosted classifier setup, OpenAI/Anthropic/Grok adapters, premium cost policy, automatic text-to-image-to-3D composition |
| 6: quality/economics | One real image and initial runtime evidence | Founder skill port, comparison suite, quality review, realistic cold/warm/failure/accepted-output economics |

TRELLIS transport retains raw and final outputs. Native video/3D cloud containers still require a compatible Linux GPU and their own build and execution checks. The successful existing Windows installation does not certify those separate Linux runtimes. Hosted model-assisted preflight requires an operator-managed Ollama-compatible service reachable by the API; without it, cloud runs use the recorded rules fallback. A paid serverless classifier with measured admission costs remains future work.

Before a public production launch, add versioned migrations, deployment backups/restore exercises, operational alerting, rate limits/abuse controls, signed release identities, and broader load/quality evaluation. These extend the selected architecture; no framework or shared-backend replacement is required.

## Next concrete steps

1. Create the accounts in the deployment guide and choose a small explicit GPU experiment ceiling.
2. Build and test the image container; deploy Supabase/Railway/Pages and complete a two-account end-to-end check.
3. Run video and TRELLIS on compatible Linux GPU endpoints, retaining outputs and billing evidence. Keep each disabled until its checks pass.
4. Complete versioned migrations, hosted classifier qualification, and the remaining acceptance checks before calling the full live PoC done.

Local services are intentionally left running. Stop them with `scripts/stop-local.ps1`; it preserves workspace data and does not reset Docker or stop unrelated user services.
