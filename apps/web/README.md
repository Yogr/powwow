# Powwow web client

React 19, TypeScript, and Vite. All durable project, chat, run, context, and artifact state belongs to the shared FastAPI service. The web client stores interface preferences and account-scoped pending-request recovery data locally; the API remains authoritative.

## Run

```powershell
npm --prefix apps/web install
npm --prefix apps/web run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/v1` and `/health` to the local API on port 8000. Start the complete local stack using the repository runbook.

For a hosted build, set `VITE_API_BASE_URL` to the HTTPS application API. `/v1/config` supplies the public Supabase authentication configuration at runtime. Server keys never belong in Vite environment variables. Optional `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` can provide the same public values at build time.

```powershell
npm --prefix apps/web run generate:api
npm --prefix apps/web run build
```

`src/generated-api.ts` is generated from `contracts/openapi.json`. `src/api.ts` uses its domain types and provides the authenticated transport. Regenerate the file after changing API schemas.

## Interface

The creative home uses an animated orbit of six previews, original artwork, a white serif headline, and five starter prompts. Starter prompts fill the existing composer; they do not submit a request. Writing, game, screenplay, and song prompts use the writing workflow. Image and 3D availability still follows the backend catalog.

`src/CreativeShowcase.tsx` contains the orbit and shared creative prompts. `src/creative-studio.css` defines the charcoal/ember theme and responsive layout. Optimized artwork and its generation prompts are in `public/creative/`. Motion pauses on hover, keyboard focus, the pause control, a hidden browser tab, and the system reduced-motion preference.

Run `node apps/web/scripts/creative-studio-qa.mjs` from the repository root with Vite running for the isolated browser design checks. Its API responses are test fixtures; it does not validate live generation. Screenshots and results are saved in `evals/reports/creative-studio/`.

- Create, rename, archive, restore, move, and search projects/conversations.
- Explicit chat/project/selected-source context, live project links, snapshots, and revocation.
- Real queued jobs with persisted polling, cancellation, retry, idempotent submission, and retained input after errors.
- Upload PNG/JPEG/WebP, MP4, GLB, PDF, and UTF-8 text/Markdown/CSV; maximum eight attachments per request.
- Image zoom, original downloads, image reuse, MP4 playback, and a lazy-loaded Three.js GLB viewer with camera reset and wireframe.
- Library filters, persistent favorites, artifact history, model/skill/workflow settings, source provenance, and budget controls.
- Resizable desktop conversation/output panels; mobile Chat, Output, and Details; keyboard shortcuts and native modal focus management.
- Supabase sign-in/sign-up when configured; clear local development mode otherwise.

Availability comes from the backend catalog. A configured runtime has not necessarily been health-checked. The interface does not simulate unavailable generation. Procedural GLB/MP4 files used for viewer validation are explicitly named fixtures, uploaded through the normal attachment API.

## Browser validation

With the local API, worker, and web app running:

```powershell
node apps/web/scripts/browser-qa.mjs
node apps/web/scripts/idempotency-qa.mjs
```

The script uses the root Playwright dependency, the live `Ceramic studies` project, and fixtures under `evals/fixtures`. It creates uniquely named QA projects and archives them on completion. It records checks, screenshots, and a downloaded GLB under `evals/reports/ui-validation`. This is an integration suite: it runs a real local chat and source lookup, so the configured inference runtime must be available.

The verified run covered 21 checks at 1440, 768, and 390 pixels, including actual GLB WebGL loading and MP4 decoding/playback. It is a targeted browser review, not a complete accessibility audit or proof of cloud deployment.

The recovery suite adds eight checks using real API requests whose responses are deliberately discarded. It verifies that accepted generation and retry requests reuse the original payload and idempotency key after refresh, concurrent retries are blocked, and a definitive validation rejection preserves the draft. Pending operations are saved in session storage under the authenticated account ID; the local development account has its own scope. A pending operation locks new submissions until the user recovers it. Network errors and server errors retain recovery data; accepted responses and definitive 4xx responses clear it.

