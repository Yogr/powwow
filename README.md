# Powwow

Powwow is moving toward organization-based AI collaboration: shared projects,
assigned tasks, private working chats, shared assets and governed agents.
The web and Flutter clients now include the first collaboration foundation.
See [what is implemented and what remains](docs/collaboration-implementation.md)
and [competitor research, execution architecture and pricing](docs/collaboration-strategy.md).

Development spending caps can be explicitly disabled with
`DEVELOPMENT_UNCAPPED_SPENDING=true` in ignored server configuration. The switch
only takes effect with `APP_ENV=development`; charges and uncertain submissions
remain recorded. This development setting is not presented as a user benefit.

A shared workspace for useful conversations, research, and creative model workflows. The web app and Flutter mobile client use the same Python API, durable PostgreSQL job queue, and artifact store.

The active quality-first candidate uses GPT-6 Astra for planning, conversation,
project updates and review, with GPT Image 2.5 Sunburst for images. The model
authors individual media tasks; Powwow executes them sequentially, checks results,
and links accepted images to their intended project entries. Local 3D and configured
video tools remain available. GPT Image requires the server's OpenAI connection;
there is no automatic fallback to FLUX. The historical local setup notes below
describe installed specialist runtimes, not the active image baseline. See
[qualification and current evidence](docs/model-quality-policy.md).

## Run it here

Open **http://localhost:5173** and sign in. Local development uses its own Supabase Auth, PostgreSQL, and private Storage, with the same account and ownership checks as production. Setup saves local QA credentials in ignored `.data/supabase-qa.json`; new accounts can confirm their email through the local mailbox at http://127.0.0.1:56324. Start a regular chat or create a project. Web search is allowed by default and used when the prompt calls for research. Choose local or cloud storage in Settings before adding project files.

```powershell
# Start existing installation; leave this app running while you use it.
./scripts/start-local.ps1

# Stop only processes recorded and verified as this workspace's services.
./scripts/stop-local.ps1

# First-time setup (Docker Desktop, Node.js, and uv required).
./scripts/setup-local.ps1
```

Setup installs project-local Python environments and Ollama, starts the isolated `powwow` Supabase Docker project, and downloads the chat model. FLUX downloads on the first image request (approximately 13 GB). Keep adequate disk space and an NVIDIA CUDA-capable driver. Runtime data lives in `.data`, logs in `.logs`, and configuration in ignored `.env`; Supabase database/files persist in its named Docker volumes. The previous portable PostgreSQL files are preserved and are no longer used. No dummy-data migration is required.

The native Windows launcher uses local Supabase and GPU services. `compose.yaml` is the deployment stack for a **hosted Supabase** project, using ignored `.env.cloud`; it has no alternate database or file store. See the [local Supabase guide](docs/setup/04-local-supabase.md) for ports, accounts, isolation, and Docker networking.

The finished 3D workflow also requires the detailed TRELLIS runtime, Blender, a server-side OpenAI key, and the pinned foreground model installed with `.venv/Scripts/python.exe scripts/setup-foreground-model.py`. It prepares and masks the reference, reconstructs the model, applies bounded visual-model-directed Blender edits, bakes textures, and checks the exported GLB. Generated models display a saved, lit PNG preview with no continuous browser rendering. See the [3D workflow and evaluation evidence](docs/3d-workflow-audit.md) for capabilities and qualification status.

| Service | Local address |
|---|---|
| Web | http://localhost:5173 |
| API and interactive contract | http://localhost:8000/docs |
| GPU worker health | http://localhost:8188/health |
| Supabase Auth / Storage | http://127.0.0.1:56321 |
| Supabase PostgreSQL | `127.0.0.1:56322` |
| Supabase Studio | http://127.0.0.1:56323 |
| Local confirmation emails | http://127.0.0.1:56324 |

**This is a working local implementation with real chat and image inference.** Cloud video/3D execution, cloud account validation, and iOS compilation remain acceptance gates before the complete planned live PoC can be called finished. Unavailable capabilities are shown as unavailable. Procedural video/3D viewer fixtures are explicitly labeled as fixtures.

## Hosting choice and account setup

**Runpod** is the GPU recommendation: bring your own pinned model containers, call them through an asynchronous API, and scale workers to zero. Keep **Supabase** for authentication, PostgreSQL, and private files. Use **Railway** for the Python API and persistent workers. **Cloudflare Pages Free** is the lowest-cost web hosting choice; **Vercel Pro** supports the same app if you prefer it. Vercel Hobby restricts commercial use.

- [Provider ranking, current prices, and tradeoffs](docs/setup/01-provider-decision.md)
- [Account creation and deployment instructions](docs/setup/02-accounts-and-deployment.md)
- [Implementation status, evidence, and remaining acceptance gates](docs/poc/07-implementation-status.md)

No paid cloud resources or accounts have been created. Prices and workload suitability are different questions: cloud cost per useful output still needs measured runs and invoice reconciliation.

## What works

- Projects and standalone chats, editing, archive/restore, history search, and moving chats into or out of projects.
- Account settings, browser folder saving, storage quotas, and an installable desktop web app. See [storage and membership](docs/storage-and-membership.md).
- Chat, project, or selected-source context; directional grants, revocation, and recorded provenance.
- Real Qwen3 instruct chat, bounded Wikipedia source retrieval, optional Brave web search, and versioned answer guidance.
- Real FLUX.2 klein 4B image generation, creative brief preparation, settings, saved outputs, downloads, and favorites.
- Persistent jobs, status/events, cancellation, explicit retry, duplicate-request protection, worker leases, and budget reservations.
- Image workspace, MP4 playback, and interactive GLB viewing with orbit, zoom, reset, and wireframe.
- Flutter Android/iOS source with a shared contract, sign-in, projects, chat/image requests, run details, cancellation/retry, and image previews.
- Supabase sign-in, PostgreSQL ownership checks, private uploads/downloads, and Runpod chat/image/video/3D deployment code.

## Project builder

Projects own their Project Blueprint, Task Board, and creative editors. Blueprint is always first and Task Board second; other priorities are configurable in account preferences. Start with a request such as “I want to build a 2D browser game,” answer the graphical setup choices, and review the roadmap. For creative builds, the first setup also queues a budget-bounded AI planning pass whose proposed design and tasks can be reviewed before applying. Language learning uses the app language and starts directly when the target language is known.

There are 13 project types and 17 reusable components, including shared characters and plot, storyboards with first/last frames, a chapter editor, game design and playtests, timelines, audio notes, research, language learning, and release checklists. Editors save to the project database. Add tools through the project's sidebar or ask to add one in chat.

See the [component matrix, behavior, and remaining execution limits](docs/product-builder.md). These workspaces organize and guide builds; game execution, final film rendering, and publishing integrations remain future work.

## Language learning

Add **Language learning** to a project or begin with “I want to learn Spanish.” The app creates a learner using your app language and the requested target language. Then practice in a daily conversation with hidden full translations, clickable word meanings, gentle corrections, topic starters, optional browser dictation/read-aloud, and saved phrases with recall practice. Each learner and language has a separate history. See the [language learning guide and research](docs/language-learning.md).

Language learning now requires a hosted OpenAI key: run `./scripts/configure-openai.ps1` from the root to enter it privately and restart the API/worker. Basic / Smarter / Super are **evaluation candidates**, with server-enforced reply and spending limits. The previous local model did not meet the language acceptance bar. See [model qualification and release gates](docs/model-quality-policy.md) before promoting any model to an approved baseline.

## Repository

| Path | Responsibility |
|---|---|
| `apps/web` | React / TypeScript / Vite interface |
| `apps/api` | FastAPI API, authorization, durable jobs, context, provider adapters |
| `apps/mobile` | Flutter mobile client |
| `contracts/openapi.json` | Exported API contract |
| `packages/dart-client` | Generated Dart API models/client |
| `services/gpu_worker` | Pinned model runtimes and Runpod handlers |
| `services/blender` | Bounded GLB validation and export tool |
| `catalog` | Versioned model, workflow, and skill definitions |
| `infra/runpod` | GPU Dockerfiles, request fixtures, deployment notes |
| `evals` | Reproducible checks, fixtures, actual outputs, and reports |
| `.github/workflows/ci.yml` | Web/API/GPU/Flutter checks and optional native builds |

See the [API README](apps/api/README.md), [web README](apps/web/README.md), and [mobile README](apps/mobile/README.md) for development commands. Run `./scripts/generate-contracts.ps1` after changing API schemas; it regenerates TypeScript and Dart together. Tests use a dedicated disposable PostgreSQL database, never the normal local workspace database.

## Product brief

1. [Product and interface](docs/poc/01-product-and-interface.md)
2. [Architecture and contracts](docs/poc/02-architecture-and-contracts.md)
3. [Models and workflows](docs/poc/03-models-and-workflows.md)
4. [Original hosting comparison](docs/poc/04-hosting-and-costs.md)
5. [Acceptance milestones](docs/poc/05-implementation-plan.md)
6. [Original implementation handoff](docs/poc/06-next-chat-handoff.md)
7. [Current implementation status](docs/poc/07-implementation-status.md)

The October 26 collaboration direction supersedes the original personal-workspace product scope. Existing creative capabilities remain part of the product; historical setup and evaluation notes still describe their evidence and limitations.


## Repository hygiene

Keep credentials and machine paths in ignored server `.env` files; copy
`.env.example` for the shareable configuration schema. Never place server secrets
in browser variables. Build output, caches, local databases, QA accounts, and
runtime state are ignored and must not be force-added.

`evals/reports/` contains private local evaluation output, screenshots, and media;
it is intentionally not versioned. Historical references to those paths in the
quality policy describe locally retained evidence, not files included in a fresh
clone. Candidate status and recorded failures remain in the quality documentation.
Review and sanitize evidence before sharing it separately. Reusable software test
fixtures belong in `evals/fixtures/`; these do not establish AI quality.
