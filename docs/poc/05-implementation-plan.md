# 5. Implementation plan and decisions

> Implementation update, September 30, 2026: the application now exists. See [current status and evidence](07-implementation-status.md) and the [selected Runpod stack](../setup/01-provider-decision.md). This document preserves the original planning baseline.

Date: September 30, 2026. Historical status at handoff: all milestones were pending. Use the linked implementation status for current progress. [Planning index](../../README.md).

## Milestone 0: freeze the first build contract

**Deliverables:** initial stack decision, OpenAPI schemas, domain records, workflow identifiers, UI state fixtures, and runnable local development instructions.

- Use the proposed React/TypeScript web + Flutter mobile direction unless the founder chooses Flutter web before implementation.
- Define ownership, project context modes, artifacts, runs, events, usage, and error schemas before coupling the UI to a model service.
- Establish a monorepo with the layout below. Generate clients from contracts; do not independently hand-maintain TypeScript and Dart copies of the API.
- Pick one local authentication approach for development and one production identity provider before the live multi-user phase.
- Keep paid credentials optional for the interface milestone.

```text
apps/
  web/                       React/TypeScript application
  mobile/                    Flutter application
services/
  api/                       Python/FastAPI modules and migrations
  worker/                    Job execution and provider adapters
packages/
  contracts/                 OpenAPI, event schemas, generated clients
  design-tokens/             Color, spacing, type, and component states
catalog/
  models/                    Versioned model manifests
  workflows/                 Executable recipes
  skills/                    Powwow-authored guidance and evaluation cases
infra/
  containers/                Separate image/video/3D/Blender images
  deployment/                Selected cloud templates and runbooks
evals/
  fixtures/                  Rights-cleared prompts and inputs
  reports/                   Quality, performance, and cost measurements
docs/
  poc/                       This planning package
```

**Done when:** schemas validate and the web and Flutter clients can represent the same project, run, and artifact fixtures. Record selected versions in manifests/lockfiles during implementation.

## Milestone 1: interactive web PoC

**Deliverables:** polished responsive interface with simulated job adapters, sample image/video/3D artifacts, and local project/chat persistence.

- Implement the simple composer, sidebar, project/chat management, history search, archive/restore, and context selector.
- Build image, video, and 3D artifact workspaces with the controls in the product brief.
- Demonstrate horizontal expansion on desktop and focused panels on mobile widths.
- Implement upload validation, loading, queued, generation, cancellation, failure, retry, and completion states using fixtures.
- Simulate multi-stage jobs and preserve earlier outputs after a later-stage failure.
- Label all demo runs and assets as simulated. Model/provider choices reflect enabled catalog entries.

**Done when:** a reviewer can complete the three user journeys and a context-sharing flow without credentials, refresh without losing demo projects, navigate by keyboard, and use the interface at approximately 390, 768, and 1440 pixels wide. Check actual browser rendering, image/video playback, and 3D loading rather than relying only on component tests.

This milestone is an interface prototype. It is not the completed live-inference PoC.

## Milestone 2: persistent backend and Flutter slice

**Deliverables:** authenticated API, database migrations, object storage, durable run/event handling, and a small Flutter client.

- Replace client-local authoritative state with server persistence.
- Implement chat-only, project, and selected-source context resolution with visible provenance.
- Add resumable event consumption, job leases, idempotent submissions, and usage records.
- Build Flutter login/project list/chat submission/job progress/artifact preview against the same API.
- Run Android locally where tooling permits. Configure macOS CI or a Mac for iOS compile/signing and device testing; report unavailable platform validation explicitly.

**Done when:** two test accounts cannot access each other's projects/artifacts; an isolated project cannot retrieve another project's content; a deliberate grant enables the intended source; revocation blocks future retrieval. Refresh, disconnect, reconnect, and duplicate submission must preserve one logical run. A job continues after the originating client closes.

## Milestone 3: first rented GPU and live text-to-image

**Deliverables:** selected cloud deployment, pinned image container, cached weights, one live image workflow, measured usage, and teardown instructions.

- Resolve cloud account, region, budget, quota, and worker SKU using the hosting comparison.
- Build the FLUX.2 klein 4B baseline; pin and inventory all components.
- Connect the worker through the same run adapter used by fixtures.
- Record cold/warm startup, memory, generation time, outputs, errors, and billed resources.
- Enforce per-run and aggregate experiment limits in the scheduler.

**Done when:** a web prompt produces a genuine image on the rented worker, survives a page refresh, appears in project history, and downloads successfully. Worker failure is visible and recoverable. Deployment can be repeated from the runbook and the worker can be shut down without losing artifacts.

## Milestone 4: live video, 3D, and one managed tool

**Deliverables:** Wan image-to-video worker, TRELLIS.2 image-to-3D worker, managed Blender validation/export tool, and full artifact lineage.

- Reuse both uploaded and generated images as inputs.
- Add the bounded motion and asset-preparation skills described in the recipe document.
- Run each GPU profile serially first; add safe scheduling by profile and memory requirement.
- Integrate Blender through a typed tool boundary. Include at least one genuine managed tool call rather than only a mock MCP badge.
- Validate exports, generate previews, and preserve raw and processed assets.

**Done when:** a user can generate an image, animate it, and create a viewable/downloadable 3D version; MP4 plays and GLB imports in an independent viewer or Blender. The job record identifies the exact model/workflow versions, executed tool operations, inputs, outputs, time, and cost.

## Milestone 5: automatic routing and premium providers

**Deliverables:** tested classifier, basic self-hosted chat, premium adapters, tier policy, and a composed workflow.

- Compare deterministic routing with the small-model classifier on labeled requests.
- Handle missing image inputs and ambiguous destinations without guessing an expensive route.
- Implement OpenAI, Anthropic, and Grok adapter contracts with provider-specific capability handling.
- Activate each premium provider when its credentials and cost limits exist. Run a real streaming/tool smoke test for each activated provider. Track missing integrations explicitly.
- Add text-to-image-to-3D composition with a reference-image review option.
- Keep ordinary chat and routing responsive when a long video job occupies a media GPU; use a separate small pool or explicit queue policy.

**Done when:** freeform requests route to the intended enabled workflow, the user can choose an available premium provider, and usage is attributed correctly. Premium spend outside a configured limit requires an explicit choice. An unavailable provider produces an honest state rather than a substituted result.

## Milestone 6: quality, economics, and reusable refinements

**Deliverables:** benchmark report, selected model/provider defaults, documented per-workflow limits, and a first refinement of the founder's 3D flow.

- Locate and port the existing local Trellis/Blender workflow with its reference outputs.
- Compare baseline generation against Powwow's refined skills on the evaluation suite.
- Compare image model candidates and small/large video profiles.
- Measure cost per accepted result at realistic utilization, including retries and premium steps.
- Replace speculative latency and cost targets with measured bounds.
- Add telemetry for queue time, stage time, failure rate, model loading, budget rejection, and accepted-result rate.

**Done when:** the founder can review outputs and choose quality/cost defaults with recorded evidence. A fresh deployment and a new account can use all three enabled capabilities without manually wiring models or tools.

## Release boundaries

| Label | Required evidence |
|---|---|
| Interface prototype | Milestone 1; clearly simulated computation |
| Live generation PoC | Milestones 2-4; all three capabilities on rented hardware, persistence, Flutter slice |
| Expanded PoC | Milestone 5; routing, self-hosted chat, premium integrations, composition |
| Evaluated product candidate | Milestone 6 plus operational review and founder-approved quality bar |

Customer billing, store publication, complete mobile feature parity, and advanced editor suites are subsequent work. Do not call the web mockup or one working image endpoint the full PoC.

## Decisions and defaults

These were the original proposals. The implementation update records the choices made under the instruction to proceed using engineering judgment.

| ID | Decision | Proposed starting choice | Revisit when |
|---|---|---|---|
| D01 | Web framework | React + TypeScript; Flutter mobile | Before UI scaffold if one UI codebase is preferred |
| D02 | Backend | Python/FastAPI, PostgreSQL, object storage | A demonstrated scaling constraint appears |
| D03 | Job engine | Database-backed leases and persisted stage state | Workflow duration/complexity warrants a dedicated engine |
| D04 | First cloud | AWS G6e-compatible profiles; compare GCP | Account credits, quota, or benchmark results favor another |
| D05 | Alternative GPU hosts | Compare Runpod and Modal | Live quote and workload measurements are available |
| D06 | First model profiles | FLUX.2 klein 4B, Wan TI2V-5B, TRELLIS.2 | Quality/cost evaluation chooses a better eligible version |
| D07 | Context sharing | Isolated defaults plus explicit directional grants | Team accounts are introduced |
| D08 | Premium models | Configured catalog entries, metered usage | New provider versions pass evaluations |
| D09 | Client model | Optional later; server classification first | Download size, battery, browser support, and routing gains are measured |
| D10 | Peer network | Deferred behind provider boundary | A separately approved execution/privacy design exists |

## Choices for the next conversation

The UI can start with the proposed defaults. Before paid deployment, resolve cloud preference/credits, region, total experiment budget, and acceptable wait for image/video/3D. Before premium refinement, locate the existing local skill and enable the intended API account. Before app distribution, choose bundle IDs, signing accounts, and mobile release scope.

Keep a dated decision log as choices are made. Preserve measured results and abandoned candidates where they explain cost or quality tradeoffs. Do not add a new framework, provider, or agent runtime merely because it is available.



