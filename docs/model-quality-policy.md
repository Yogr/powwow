# Model quality comes before cost optimization

## October 26: organization collaboration candidate

Organization projects now share saved components, tasks and explicitly published
assets while conversations remain private to each user. A task's current title
and description are added to its owner's task-chat context. Organization model
policy is enforced at request admission and rechecked before queued paid stages.
The existing qualified/candidate model routes, cost ledger, reservations,
idempotency keys and uncertain-submission rules remain in place.

This changes context and authorization, not model qualification. The task-chat
workflow remains a **candidate** pending representative live evaluation and
product-owner review. API, browser and Flutter fixture tests verify isolation,
roles and software behavior only. No paid live inference or model promotion was
performed for this collaboration implementation. Shared agents are saved
definitions; autonomous execution, scheduling, MCP execution and provider account
connections must not be described as working until their adapters and evaluation
gates are completed.

## October 10: quality-first task orchestration

The product owner requested a GPT-6-first baseline before cost optimization. New
planning, project interpretation, general conversation, tutoring and visual review
use GPT-6 Astra with high reasoning. GPT Image 2.5 Sunburst (2026-09-08 snapshot)
is the image generation/editing candidate. Existing Sol policies remain comparison
data; they are not automatic fallback routes. The dated register below records
earlier evaluations and is superseded for active defaults by this section.

The reasoning model now returns a task graph with individual instructions, named
outputs, authorized source IDs, dependencies, acceptance criteria and optional
project-record destinations. The application schedules tasks sequentially and
enforces access, storage, budgets, checkpoints and conditional component writes.
It does not infer subjects, poses or task counts with keyword scripts. Completed
files remain available after later failures. Uncertain submissions cannot be
retried. An explicit resume reuses paid checkpoints instead of starting over.

Images explicitly request PNG output and transparency when specified. A pixel
check rejects empty/opaque cutouts and Astra reviews the generated image against
the task before it can be attached to a project entry. Review failure preserves
the draft, blocks dependent tasks, and lets unrelated tasks finish; it does not
launch repair loops. 3D and video remain
specialist adapters. Audio/music and arbitrary program execution are unavailable
until an actual adapter is registered. There is no silent downgrade to local FLUX.

Live evidence: the exact saved Breachwater request produced five separate named
PNG tasks, each with transparency, subject-specific posing and an existing
character destination. One Astra planner call cost $0.592775 (conservative token
estimate), within the existing $1 request cap. No images or project writes were
performed by this evaluation. See `evals/reports/astra-task-planner-live.json`.
This is routing evidence, not visual-quality approval. Product-owner review
remains pending. All revised workflows remain
candidates. Price estimates still require invoice reconciliation; the image
adapter reserves a configured per-image allowance before each submission and
records actual reported usage before review. No request or account spending
limit was increased by the initial migration.

The product owner subsequently requested removing spending caps during experience
development. The local ignored server configuration now explicitly enables
`DEVELOPMENT_UNCAPPED_SPENDING=true`. This bypasses request/account and language
daily spending/reply gates only when `APP_ENV=development`. Production and test
environments retain their limits. Usage, reservations for uncertain submissions,
idempotency, cancellation, storage limits and quality gates remain active. Model
output allowances are no longer reduced to fit a dollar cap in this mode.

The first live image trial exposed a review-input bug: vision inspected hidden
RGB beneath the PNG's alpha channel and called it a background. The stored output
was already transparent. Reviews now receive a checkerboard composite plus alpha
measurements; the downloadable PNG is untouched. Reviews also treat the original
user request as authoritative when it permits alternatives to a planner's chosen
pose. The failed review and charge are preserved. A single explicit review of the
same saved image exercises this correction without regenerating it. Evidence is
recorded in `evals/reports/astra-image-tasks-live/`.

Completed live image evidence: five initial generation calls produced five named
RGBA PNGs. Hollow Infantry, Watcher Drone, Pursuit Hound and Dreadframe passed the
corrected visual review and were conditionally attached to their character
records. Crawlframe failed because eight complete legs/feet were not visible.
The independent Dreadframe task completed despite that failure, reusing every
existing paid checkpoint. A single explicit follow-up edit used the rejected
Crawlframe pixels and a new Astra-authored edit task. It also failed the anatomy
gate and was not attached. Both drafts and their charges remain recorded; no
further repair calls were made. This is a demonstrated limitation of this image
candidate on exact mechanical anatomy, not a 5/5 success or qualification.

Total recorded conservative cost: $1.875496 ($0.592775 original planning,
$0.587078 batch generation/review including the alpha-review correction,
$0.695643 explicit edit planning/generation/review). See
`evals/reports/astra-image-tasks-live/report-final.json` and
`evals/reports/astra-crawlframe-edit/report.json`. No reconstructed meshes were
generated in this evaluation, so image review does not establish downstream 3D
quality. Owner review and broader live suites are still required before promotion.

Official API references checked October 10:
[GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra),
[GPT Image 2.5 Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst),
[image generation](https://developers.openai.com/api/docs/guides/image-generation).

Basic means the cheapest **evaluated model and workflow that meets the experience's quality bar**. It can differ for conversation, language teaching, planning, images, video, and 3D. A model is a candidate until it passes evaluation and product review. Marketing tier names are not quality evidence.

When a small representative test repeatedly fails a core capability, record that failure and compare a stronger model. Do not add repeated repair calls, fake translations, or hard-coded answers to make a weak model appear capable. Keep validation, authentication, bounded context, and reliable billing: those are product requirements at every model level.

No silent downgrade below an experience's approved minimum. Higher tiers are explicit user choices. Each run records its provider, model, reasoning setting, workflow, price version, token limits, usage, and qualification evidence where available. A provider or prompt change requires repeating the relevant quality checks.

## Historical qualification register (before October 10 strategy)

| Experience | Candidate or existing route | Quality status |
| --- | --- | --- |
| Language teaching / Basic | GPT-6.1 Sol, low reasoning | Candidate; hosted live evaluation and owner review pending |
| Language teaching / comparison candidate (not offered in tutor UI) | GPT-6.1 Sol, high reasoning | Candidate; no measured improvement claimed yet |
| Language teaching / comparison candidate (not offered in tutor UI) | GPT-6 Astra, high reasoning | Candidate; hosted live evaluation pending |
| Language teaching / previous local route | Qwen3-4B-Instruct-2507 | Rejected: repeatedly failed the greeting, bilingual output, and word-segment acceptance workflow |
| Request/workflow planner, including media and project intake | GPT-6.1 Sol, high reasoning, strict ExperienceIntent/MediaPlan schema | Candidate; six-case live routing smoke passed; three-session evaluation and owner review pending; no silent local fallback |
| Project interpretation / Basic minimum | GPT-6.1 Sol, low reasoning; promoted to high or Astra for demanding requests | Candidate; strict editor-write contract is behavior-tested, not quality-approved |
| Project interpretation / Smarter and Super | Sol high and Astra high respectively, treated as floors | Candidate; no measured improvement or production quality claim; no silent local fallback |
| General chat dictation | Browser SpeechRecognition, continuous draft input | Candidate; live microphone accuracy and product-owner review pending. Browser chooses the speech service/model; no Powwow paid request or automatic restart. |
| Images, video, 3D | Existing capability-specific routes | Needs separate visual, consistency, geometry and performance gates |
| Full local 3D workflow | Sol high reference preparation, FLUX edit and BiRefNet mask, detailed TRELLIS, Astra high multi-view planning, bounded Blender edits/UV baking, final Astra high gate | Candidate; corrected reconstruction failed geometry quality review; export/preview engineering checks pass; owner review pending |

There is no approved language Basic yet. The tutor now uses a single fixed server baseline and has no intelligence selector. Model provenance and this register retain its candidate status. The implementation offers a usable integration to test; an API key alone does not qualify it.

Project intake uses its own [qualification suite](../evals/project-experience-quality.json) and [workflow](project-experiences.md). A catalog-authored introduction is product copy, never evidence of model quality. A classifier failure stops the turn; it does not trigger a repair loop or a local-model fallback. The current classifier is a candidate with an existing provider integration, not a claim that it beats Gemini Flash or is the cheapest acceptable route. Compare alternate candidates on the same suite before promotion. No classifier can be presumed correct on every input.

## Language promotion gate

1. Run `apps/web/scripts/language-live-qa.mjs` for the configured tier. It uses real model replies, records usage, and stops on the first failure. It never substitutes fixtures or repairs replies with another model call.
2. Review the cases in `evals/language-quality.json` across the offered languages, beginner and intermediate levels, and at least three fresh sessions. Required structure and isolation checks must pass every case.
3. Have a fluent reviewer assess each response for correct meaning, natural dialogue, accurate correction, contextual word help, and level-appropriate explanations. Any materially wrong teaching blocks promotion for that language. Target average >= 4/5 on each dimension, with no score below 3. These are proposed acceptance criteria, not measured results.
4. Record latency (median and p95), actual token usage, conservative cost estimates, failed/abandoned replies, and the full model/workflow configuration. Set a product latency target after the first measured run; reject an experience too slow for natural conversation.
5. The product owner tests their own examples. Only after this review can the candidate become approved Basic. Compare cheaper candidates on exactly the same cases before changing the minimum.

The current six-turn smoke test is necessary but insufficient to certify all 20 language options. Use evaluation results to narrow supported languages if needed. Do not interpret schema compliance as accurate teaching.

## Economics before public paid release

Current implementation: server-side per-reply reservation, output allowance, exact project input counts with budget-based output sizing, account spending limit, and language daily spending/reply limits. Unknown paid submissions keep their reservation and cannot be automatically retried. Known usage is charged to the internal spending ledger even when the reply fails validation or is cancelled.

Still required before a public paid launch: funded allowances tied to subscription/payment state, provider-wide spending protection across all accounts, verified retail margins, invoice reconciliation, durable storage quotas and retention, rate limits against account farming, and infrastructure/support/payment cost allocation. Current account allowances are development limits, not prepaid customer balances. These controls alone do not establish profitability.

October 7 UI revision: the fixed tutor baseline remains GPT-6.1 Sol low. This change does not qualify it as the cheapest functional tutor. Compare candidates and obtain fluent-reviewer/product-owner approval before promotion. No paid model calls were made for the presentation revision. Story & Plot gained premise, genre, themes and setting fields; the interpretation contract remains a candidate pending live evaluation.

October 9 Project Details revision: `project.experience.v2` presents the former generic editors as categories with name, description, and optional image. Interpretation prompts now request a single complete description per entry and honor user-created categories. Existing paid v1 replies retain a local recovery path; model routing, budget reservations, provenance and uncertain-submission rules are unchanged. Migration and browser fixtures verify software behavior only. The revised prompt/workflow is a candidate pending the relevant live suite and product-owner review; no model-quality promotion is claimed.

October 9 component sessions and entry images: component chats now receive only their own conversation history plus shared saved project data. The interpretation policy is versioned `project-response-2026-10-09-component-sessions`; cross-component conversational references require live evaluation. Entry image generation uses the existing `image.create.v1` route after an explicit prompt/cost confirmation, retains the original request key on uncertain submission, and attaches results only if the saved image has not changed. No provider/model change or quality promotion is claimed. Browser fixtures and worker tests cover isolation, upload, recovery, and concurrent edits; visual adherence and owner approval remain pending.


October 9 request-planning correction: the observed TimeSoldier request was routed to 3D by an auto keyword rule before the hosted classifier. Auto routing now always enters the durable budgeted GPT-6.1 Sol high-reasoning planner. Its schema selects the immediate deliverable, exact filename, authorized source image IDs, workflow and steps using the available workflow catalog and component/project context. This is a candidate routing policy, not an approved Basic. The later `request-planner-2026-10-09-production` revision exposes the implemented local production chain and distinguishes it from explicit concept reconstruction. The catalog describes its bounded Blender operations, UV texture baking, and unavailable retopology/rigging/new-artwork capabilities. The planner cannot claim unregistered stages.

Image editing conditions FLUX.2 klein on actual reference pixels and the API verifies source hashes. The first mug edit smoke does not qualify character identity or T-pose fidelity. The first detailed production run reached 1536 resolution and 937,041 triangles but failed visual review because its opaque background became geometry and its walls were distorted. This rejection remains in `evals/reports/production-live.json`. A revised candidate adds pinned upstream BiRefNet foreground isolation before reconstruction; evidence is in `foreground-live/report.json` and `production-masked-live.json`. See [the workflow audit](3d-workflow-audit.md). No visual-quality promotion is claimed.

The masked candidate eliminated the background plane and produced 963,888 triangles. Sol high's finishing plan terminated in an incomplete whitespace loop, with all paid usage retained. An explicit Astra high comparison on the same saved geometry returned valid findings and rejected deformed walls/ridges; no reconstruction or paid preparation was repeated. Multi-view planning and final review now use Astra high as an explicit candidate baseline. The corrected reconstruction remains below the finished-asset quality bar. A separate real-mesh Blender bake/export/reimport test and static-preview browser checks passed; these verify engineering, not visual quality. Evidence: `production-masked-live.json`, `production-export-engineering/evidence.json`, and `model-preview-real/report.json`.


Planner live smoke, October 9: all six cases in `evals/request-planner-quality.json` passed, including the exact TimeSoldier request, explicit concept GLB, discussion without generation, unavailable production finishing, project-detail updates and a still image for future video use. One hosted classifier submission per case; no media generation or workspace mutations. Total token-based conservative cost was $0.063363, median latency 9.055s and nearest-rank p95 14.156s. Evidence: [request-planner-live.json](../evals/reports/request-planner-live.json). This is one live smoke session, not promotion or owner approval; retain candidate status.

The subsequent `request-planner-2026-10-09-production` suite also passed all six cases, now including the available full workflow. One hosted classification per case, no media or workspace writes: $0.069016 total, 11.078s median and 14.485s p95. Evidence: [request-planner-production-live.json](../evals/reports/request-planner-production-live.json). Candidate and owner-review status remain unchanged.
