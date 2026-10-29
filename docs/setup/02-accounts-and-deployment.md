# Accounts and deployment

The selected stack is **Runpod + Supabase + Railway + Cloudflare Pages Free**. **Vercel Pro** remains a compatible choice if you prefer its familiar dashboard. Both frontend hosts use the same application code and deployment output. See [the decision and prices](01-provider-decision.md). Creating the accounts below is the next user action. This repository has not created any accounts, entered payment details, pushed an image, or provisioned GPU capacity.

The same Python API serves web, Android, and iOS. The web app never holds GPU-provider or database administrator credentials.

## 1. Supabase: identity, database, private artifacts

1. Open [Supabase Dashboard](https://supabase.com/dashboard), sign in, and create an organization and project named `powwow-poc`.
2. Select a US region near the intended Railway API and Runpod cache. Check available Runpod locations before committing to a large model cache. Save the generated database password in your password manager.
3. Start on Free for initial evaluation within its limits. Do not rely on that tier for backups or uninterrupted production service. Media storage is likely to be its first limit.
4. In the project **Connect** dialog, copy the **Session pooler** connection string on port **5432** if the app host needs IPv4. Replace its URI scheme with `postgresql+psycopg://` and add `?sslmode=require`. Use the database password, URL-encoded if it contains reserved URL characters. Session mode is appropriate for these persistent Python processes; do not accidentally copy transaction mode on port 6543. [Connection options](https://supabase.com/docs/guides/database/connecting-to-postgres).
5. In **Project Settings → API** (or the API key panel), copy the project URL and public anon key. Copy the service role key separately for backend storage operations. A public/publishable key is safe to expose in the client; service-role/secret keys are privileged and stay in Railway. [API keys](https://supabase.com/docs/guides/api/api-keys).
6. In **Authentication**, enable email/password sign-in. Add the eventual frontend URL as **Site URL** and add localhost plus the deployed frontend to allowed redirect URLs. Keep email confirmation enabled for public use; create a confirmed test account for the first smoke test. Configure your SMTP provider before opening sign-ups broadly. [Auth URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).
7. In **Storage**, create a bucket called `artifacts`, with **Public bucket turned off**. The backend issues authorized access and signed output uploads. Do not grant general public read/write policies for this bucket. [Private storage](https://supabase.com/docs/guides/storage/buckets/fundamentals).
8. With backend variables configured, run `python -m powwow.manage init-db` from `apps/api` before starting concurrent API/worker processes. Production initialization enables row-level security and revokes direct anon/authenticated access to API-owned tables; [`apps/api/supabase-private-tables.sql`](../../apps/api/supabase-private-tables.sql) provides the equivalent SQL for review. Confirm app tables are inaccessible through anon/authenticated direct Data API calls; the application API enforces ownership. `init-db` bootstraps the first schema; future schema changes need versioned migrations.

Current Supabase JWT verification uses the project's signing-key endpoint and verifies issuer, audience, and authenticated role. The API supports ES256/RS256 signing keys; legacy HS256 requires the backend-only `SUPABASE_JWT_SECRET`. Prefer current asymmetric keys. [Signing keys](https://supabase.com/docs/guides/auth/signing-keys).

## 2. Runpod: GPU account and first image endpoint

1. Create an account at the [Runpod console](https://console.runpod.io/), verify email, and enable two-factor authentication. Add a small prepaid balance for the test you intend to run. Leave automatic replenishment off until you have reviewed measured cost.
2. Create a scoped API key in **Settings → API Keys**. Save it as `RUNPOD_API_KEY` in Railway, never in a `VITE_` environment variable. Do not paste it into a chat or commit it.
3. Create a [Hugging Face](https://huggingface.co/join) account if needed. Create a read token for gated model downloads; FLUX klein 4B and Wan are public, while TRELLIS's DINOv3 dependency requires accepting its model terms and being granted access. Save that token as a Runpod secret `HF_TOKEN`.
4. Use a container registry such as [Docker Hub](https://hub.docker.com/). Build from the repository root. First build only the image worker:

```powershell
docker build --platform linux/amd64 -f infra/runpod/Dockerfile.image -t YOUR_DOCKER_USER/powwow-image:0.1 .
docker login
docker push YOUR_DOCKER_USER/powwow-image:0.1
docker inspect --format='{{index .RepoDigests 0}}' YOUR_DOCKER_USER/powwow-image:0.1
```

Save the returned digest. For a private registry, give Runpod its registry credential through its secret settings. Model weights are downloaded at runtime into the model cache; they are not included in this image build. [Runpod image deployment](https://docs.runpod.io/serverless/workers/deploy).

5. In Runpod **Storage**, create a standard network volume in a location that has the selected GPU type. Start with approximately **50 GB for the image worker**; inspect actual cache size before adding models. A 100 GB cache costs about $7/month at the published rate. It bills while the GPU is off.
6. In **Serverless → New Endpoint**, choose the custom container/bring-your-own-image path and create a **queue-based** endpoint named `powwow-image`. Supply the tested image digest and attach the volume.
7. Set the following explicitly; do not accept the default maximum of three workers:

| Setting | First image test |
|---|---|
| Active/minimum warm workers | `0` |
| Maximum workers | `1` |
| GPUs per worker | `1` |
| GPU type | 24 GB L4/A5000/3090 group, or 48 GB A40/A6000 if needed |
| CUDA compatibility | 12.8 or newer for image container |
| Idle timeout | `5` seconds |
| Execution timeout | `600` seconds initially; first download may need a separately budgeted longer test |
| FlashBoot | Enabled |
| Volume mount | `/runpod-volume` |
| `HF_HOME` | `/runpod-volume/huggingface` |
| `POWWOW_WORKER_PROFILE` | `image` (already baked as default) |
| `POWWOW_CPU_OFFLOAD` | `1` |
| `POWWOW_UPLOAD_HOSTS` | `YOUR_PROJECT_REF.supabase.co` |
| `HF_TOKEN` | Read-only Hugging Face token, only when needed |

These settings are starting limits, not tested performance promises. The first request must download weights, load the model, and generate. Subsequent requests can reuse cached files. Cold starts still exist with zero warm workers. A network volume restricts where workers can run. [Endpoint settings](https://docs.runpod.io/serverless/endpoints/endpoint-configurations).

8. Copy the endpoint ID to Railway as `RUNPOD_IMAGE_ENDPOINT_ID`. Set `RUNPOD_HOURLY_RATE_USD` to the actual console quote, using a conservative upper bound if multiple GPU types are allowed. Application estimates are not provider invoice reconciliation.
9. Use the endpoint's Requests tab with `infra/runpod/image-test.json`. This is a real billed model request. Retrieve the result promptly; async results are retained only temporarily. For the full app test, let the API allocate a signed upload and register the result in private storage. [Request lifecycle and retention](https://docs.runpod.io/serverless/endpoints/send-requests).

Do not leave a dedicated GPU Pod running as your application's CPU web server. For cold-start debugging, a short-lived Pod with the same container can help; stop it when the test ends, after saving outputs. Pod disks and network volumes have separate billing.

## 3. Railway: API and job worker

1. Create an account at [Railway](https://railway.com/) and a project called `powwow-poc`. Connect the repository after placing it in your own Git hosting account, or use Railway's CLI upload path. This guide does not publish the repository on your behalf.
2. Create an API service from the repository with **Root Directory `apps/api`**. Railway can build its Dockerfile. Set the service listening port to **8000**, enable a public HTTPS domain, and set the healthcheck to `/health` (use the route present in the current API build).
3. Create a second service from the same directory and image, named `powwow-chat-worker`. Override its start command to `python -m powwow.worker` and set its service-specific `WORKER_CAPABILITIES=chat`. Create a third service `powwow-media-worker` with the same start command and `WORKER_CAPABILITIES=text_to_image,image_to_video,image_to_3d`. These workers need no public domains. Separate workers let chat progress while a long media job runs. Keep them running so queued jobs and provider completions are processed after browsers close. A single worker with an empty filter is sufficient for a lower-cost sequential experiment.
4. Set shared variables on all three services:

```dotenv
APP_ENV=production
LOCAL_AUTH=false
DATABASE_URL=postgresql+psycopg://postgres.PROJECT_REF:URL_ENCODED_PASSWORD@SESSION_POOLER_HOST:5432/postgres?sslmode=require
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=BACKEND_ONLY_SERVICE_ROLE_KEY
STORAGE_BACKEND=supabase
SUPABASE_STORAGE_BUCKET=artifacts
RUNPOD_API_KEY=BACKEND_ONLY_RUNPOD_KEY
RUNPOD_IMAGE_ENDPOINT_ID=IMAGE_ENDPOINT_ID
RUNPOD_HOURLY_RATE_USD=ACTUAL_CONSOLE_RATE
CORS_ORIGINS=https://YOUR_WEB_DOMAIN
MAX_RUN_BUDGET_USD=2
ACCOUNT_BUDGET_USD=25
PROVIDER_TIMEOUT_SECONDS=1800
OLLAMA_BASE_URL=
LOCAL_MEDIA_URL=
HTTP_MODEL_BASE_URL=
```

The example budgets are initial conservative defaults, not user authorization to spend that amount. Set them to your actual experiment ceiling. Leave local media and localhost Ollama endpoints unconfigured in the cloud; they do not point to your PC from Railway. Add video/3D endpoint IDs only after their real smoke tests pass.

5. Run the initial database setup once, then deploy API and workers, inspect their logs, and confirm PostgreSQL connections and private storage access. Do not use an ephemeral filesystem for production outputs. If workers stop, completed Runpod results must be reconciled before their provider retention expires.
6. Configure a usage alert and an appropriate Railway hard limit. Railway Hobby has a $5 minimum including $5 of resources; real spend depends on consumption. Free/trial credits are not an assumption of permanently free continuously running services. [Railway pricing](https://railway.com/pricing).

## 4. Web frontend: Cloudflare Pages Free or Vercel

### Recommended for lowest cost: Cloudflare Pages

Cloudflare Pages can serve this commercial PoC's static React app on its Free plan, subject to its published terms. Static asset requests are free and unlimited; Free allows 500 builds/month, one concurrent build, 20,000 files per site, and 25 MiB per asset. Generated media stays in Supabase. No Pages Functions, Workers subscription, or custom domain purchase is required. [Static pricing](https://developers.cloudflare.com/pages/functions/pricing/), [limits](https://developers.cloudflare.com/pages/platform/limits/), [developer terms](https://www.cloudflare.com/service-specific-terms-developer-platform/).

1. Create an account at the [Cloudflare Dashboard](https://dash.cloudflare.com/sign-up), verify email, and enable two-factor authentication.
2. Open **Workers & Pages → Create application → Pages → Connect to Git**. Connect your repository and choose the production branch. Restrict the Git integration to the intended repository. [Official Git integration guide](https://developers.cloudflare.com/pages/get-started/git-integration/).
3. Set **Root directory `apps/web`**, build command **`npm ci && npm run build`**, and output directory **`dist`**. Use the React/Vite preset if offered; the explicit values are what matter.
4. Add `NODE_VERSION=24` and `SKIP_DEPENDENCY_INSTALL=1` so the build uses the checked-in lockfile through `npm ci`. Add these public frontend variables for Production, and for Preview only if previews should use that backend. [Build environment configuration](https://developers.cloudflare.com/pages/configuration/build-image/):

```dotenv
VITE_API_BASE_URL=https://YOUR_RAILWAY_API_DOMAIN
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY
```

5. Select **Save and Deploy**. Copy the resulting `https://YOUR_PROJECT.pages.dev` origin into Railway `CORS_ORIGINS` and Supabase Auth Site URL / allowed redirect URLs. Use exact allowed origins; add a known preview origin explicitly if needed. Redeploy the API after changing its variables.
6. Test sign-in, a new project/chat, image generation, download, and refresh. `VITE_` values are embedded at build time, so rebuild after changing them. The app calls Railway directly; Cloudflare serves only static files.

Use the provider-hosted checkout page when adding billing later; Cloudflare's general free-service terms restrict collection of payment-card details on free-hosted properties. [Terms §2.2.1(h)](https://www.cloudflare.com/terms/).

### Familiar alternative: Vercel

1. Create/sign in at [Vercel](https://vercel.com/new) and import your repository.
2. Set **Root Directory `apps/web`**, framework **Vite**, Node.js **24**, build command `npm run build`, output directory `dist`.
3. Set the same three public `VITE_` variables shown above and deploy. Copy the final domain into Railway `CORS_ORIGINS` and Supabase Auth Site URL / redirect URLs, then perform the same smoke test.
4. Use Hobby only if the deployment qualifies as personal and noncommercial. **Commercial Powwow needs Pro**, even if a prototype is initially free to users. Pro currently starts at $20/month plus usage. Choosing Cloudflare instead avoids that frontend subscription while preserving the same React/API stack. [Hobby restrictions](https://vercel.com/docs/plans/hobby), [plan pricing](https://vercel.com/pricing).

## 5. Enable cloud chat, video, and TRELLIS

Cloud chat uses a separate `Dockerfile.chat` image with `POWWOW_WORKER_PROFILE=chat` and pinned `Qwen/Qwen3-4B-Instruct-2507`. Build/push it as `powwow-chat:0.1`, create a queue-based 16–24 GB endpoint with zero warm workers and maximum one, and save its ID as `RUNPOD_CHAT_ENDPOINT_ID` in Railway. Start with a 300-second execution timeout and `chat-test.json`. The profile accepts at most 8192 input tokens and generates up to 2048 output tokens, or 4096 when the server selects `story_development@1`; finish reason and truncation are recorded. It preserves API-provided context messages. Its response arrives at job completion; local Ollama chat supports incremental tokens. This cloud runtime has not yet been exercised on a rented GPU. [Official Qwen model and runtime](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507).

Build `Dockerfile.video` and `Dockerfile.trellis2` using the same commands with separate image names. Their native builds need substantially more time and RAM than the image worker. Start with a roomy Linux GPU to separate extension problems from out-of-memory problems. These native containers have not been certified by the presence of Dockerfiles.

| Profile | First target | Worker settings | API variable |
|---|---|---|---|
| Wan | 48 GB A40/A6000 or L40S | profile `video`, CUDA 12.4+, 1800-second execution timeout; prepared source image required | `RUNPOD_VIDEO_ENDPOINT_ID` |
| TRELLIS.2 | A100 80 GB | profile `trellis2`, CUDA 12.4+, 1800-second execution timeout, DINOv3-authorized `HF_TOKEN`; prepared foreground image | `RUNPOD_3D_ENDPOINT_ID` |

Keep maximum workers at one per endpoint and warm workers at zero. Use a persistent cache sized for the actual profiles; a shared regional cache can avoid repeated duplicate downloads. CPU RAM and model download space matter independently of VRAM. Do not select Blackwell for the CUDA 12.4 native builds without rebuilding and testing that architecture.

Large MP4/GLB outputs use an API-issued signed storage upload, with `POWWOW_UPLOAD_HOSTS` set as above. The current API sends image inputs inline and limits them to 6 MiB on Runpod. Resize/compress a larger input before submitting; signed input downloads are a later transport enhancement. A large file must fail clearly rather than be silently truncated. [Worker contract](../../infra/runpod/README.md).

For TRELLIS, our runner removes the upstream automatic BRIA background-removal dependency and uses prepared input. A clean isolated object with transparent background is preferred. DINOv3 terms/access and native rendering component licenses remain required. Record the exact container digest, resolved Python inventory, model snapshot, successful GLB import, and any manual preparation before enabling it for users.

The TRELLIS container invokes the bounded Blender validation/export script and returns its report in final artifact metadata. The API supplies distinct signed destinations for the raw and validated GLBs. Raw geometry is uploaded first; if Blender or the final upload fails, the raw artifact is preserved and the run records a postprocessing failure. This contract is unit-tested. The existing Windows TRELLIS runtime has also generated and validated real geometry locally; the Linux cloud image still needs its own build and GPU smoke test. See [local runtime evidence](03-existing-local-trellis.md).

## 6. Optional Brave Search: broader web lookup

Leave `BRAVE_API_KEY` blank to use the default free Wikipedia lookup. Brave is optional and expands lookup to web search snippets when a user enables online lookup for a chat request.

**Storage permission is required for this integration.** Powwow preserves retrieved snippets in run context and events. Brave's standard terms allow only transient storage; its FAQ requires a plan explicitly granting storage rights for retained results. A paid plan or free credit does **not** itself confirm that permission. Obtain an entitlement covering this persistence before configuring a key. [Brave storage FAQ](https://brave.com/search/api/), [terms §3.2](https://api-dashboard.search.brave.com/documentation/resources/terms-of-service).

Pricing checked October 1, 2026: **Search costs $5 per 1,000 requests and advertises $5 in automatically applied monthly credits**—equivalent to 1,000 Search requests if the full credit is available for them. The dashboard describes prepaid billing. Brave's FAQ says card verification is required even for a free plan; check the actual activated plan and credit balance before testing. No funded account is assumed here. [Current plans](https://api-dashboard.search.brave.com/app/plans), [card-verification FAQ](https://brave.com/search/api/).

1. [Register for the API](https://api-dashboard.search.brave.com/register), review the Search plan and storage entitlement, then activate the appropriate plan. Leave automatic reload off for the initial experiment; buying extra credits is optional. [Credit terms](https://api-dashboard.search.brave.com/terms-of-service/credit-terms).
2. Open **[API Keys](https://api-dashboard.search.brave.com/app/keys)** and create a key. Save it as `BRAVE_API_KEY` in the local ignored `.env`, or in Railway variables for the API and chat worker. Keep it out of `VITE_` variables, mobile builds, and GPU containers. Restart those backend processes. [Authentication instructions](https://api-dashboard.search.brave.com/documentation/guides/authentication).
3. Enable online lookup for one chat request and confirm linked Brave sources. Review Brave usage separately: Powwow's GPU estimates/budgets do not reconcile or cap this search bill. Clear the key and restart the backend to return to Wikipedia.

## Secrets: where each value belongs

| Value | Browser / mobile | CPU API / worker | GPU worker |
|---|---|---|---|
| Supabase URL + anon/public key | Yes | Yes | No |
| User access token | Current user session | Verify only | No |
| PostgreSQL connection string | Never | Yes | Never |
| Supabase service role key | Never | Storage operations | Never |
| Runpod API key | Never | Yes | Runpod-managed runtime auth only |
| Brave Search API key (optional) | Never | API + chat worker | Never |
| Endpoint IDs | Not needed | Yes | Not needed |
| Hugging Face read token | Never | Not needed | If gated weights require it |
| Signed output upload URL | Not needed | Create for a run | Short-lived permission for that output |

## Continuous integration

The checked-in [GitHub Actions workflow](../../.github/workflows/ci.yml) runs the web production build, API tests against a disposable PostgreSQL 18 database, GPU transport/validation unit tests, and Flutter analysis/widget tests on pushes and pull requests. It uses Flutter 3.44.8, Python 3.12.11, Node 24, and pinned action revisions. It requires no application secrets and does not deploy or generate paid model outputs.

After you publish the repository to your own GitHub account, open **Actions → Powwow checks → Run workflow** to optionally build an Android debug APK or an unsigned iOS simulator app. The iOS job uses macOS; both native builds are disabled by default. Artifacts are retained for seven days. These are development builds; store distribution still needs your application identities, release signing, and the respective developer accounts. CI has been syntax-checked locally; a GitHub-hosted run and the iOS build remain unverified until the repository is pushed and the workflow runs.

## Smoke test that earns the live PoC label

- Sign in as two different accounts. Confirm one cannot read, move, or download the other's projects, runs, grants, or artifacts, including by changing IDs manually.
- Generate a real image; refresh the browser during work; confirm one logical run, final image, model revision, elapsed time, and download.
- Animate that image; play the MP4 in the browser and independently. Confirm frame count, size, duration, and real model provenance.
- Generate a TRELLIS GLB from prepared input; load it in the app and independently in Blender. Inspect geometry and materials; retain raw/processed artifacts when a validation stage exists.
- Cancel queued and active jobs; retry a failed job explicitly; confirm no automatic uncertain paid resubmission.
- Disconnect/reconnect and resume events. Stop/restart the CPU worker and verify recovery from persisted state.
- Revoke a context grant and verify future requests exclude the revoked source. Existing generated content cannot be retroactively erased by revocation.
- Review invoice spend versus application estimates, first-load and warm duration, cache bills, failed jobs, and storage use.

The application cannot honestly be called the complete planned **live generation PoC** until all three model paths, tenant isolation, durable recovery, and the mobile slice have passed their acceptance checks. Local functionality and supplied cloud deployment code are useful deliverables but do not establish a paid-cloud test that has not run.

## Pause and teardown

Set Runpod endpoint maximum workers to zero when stopping the experiment; cancel queued jobs first and save their outputs. Remove endpoints only after confirming results are durable. Network volumes continue billing until separately deleted; export anything needed before deleting a volume. Stop any dedicated Pods and review their retained disks. Pause/remove Railway services if no background jobs remain, and preserve PostgreSQL and artifact backups before removing a project. Rotate any credential exposed in a log or commit.
