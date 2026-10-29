# Project builder

Powwow organizes creative work around a project. New projects open the shared chat interface with no required tools. Conversation-driven setup adds the relevant editors, a provisional blueprint and roadmap after identifying the user's intent. See [Conversation-driven project experiences](project-experiences.md) for the current intake and update path.

The catalog is the source of truth for supported project types, setup questions, and available components: `apps/api/powwow/builder_catalog.py`. The roadmap templates and intent detection live in `apps/api/powwow/builder.py`.

## Project types and components

The starter plans below include **Project Blueprint** and **Task Board**; blank projects do not. Components can also be added with **Add components**, or through structured chat updates when content belongs in another editor. Hiding a tool removes it from the sidebar and preserves its records. Project Memory captures durable facts and glossary entries when useful.

| Project type | Specialized components added during setup | Setup decisions |
| --- | --- | --- |
| Game | Game Design, Characters, World Builder, Moodboard, Asset Library, Audio Studio, Release Checklist | 2D/3D, camera perspective, building tool, target device, single player/local/online play |
| Movie | Characters, Story & Plot, Storyboard, Book & Script Editor, Timeline, Audio Studio, Moodboard, Asset Library, Release Checklist | Short/feature/series, visual style, first finished duration, viewing format |
| Book | Characters, Story & Plot, Book & Script Editor, Timeline, World Builder, Research Notebook, Moodboard, Asset Library, Release Checklist | Book format, genre, length, digital/print/private sharing |
| Comic | Characters, Story & Plot, Storyboard, Book & Script Editor, World Builder, Moodboard, Asset Library, Release Checklist | Pages/vertical scroll/strips, artwork style, color treatment, first production scope |
| Website | Pages & Screens, Book & Script Editor, Moodboard, Asset Library, Research Notebook, Release Checklist | Site purpose, visual style, existing content, interaction level |
| App | Pages & Screens, Moodboard, Asset Library, Research Notebook, Release Checklist | Platform, audience, data location, prototype/release scope |
| Podcast | Audio Studio, Book & Script Editor, Timeline, Research Notebook, Moodboard, Asset Library, Release Checklist | Show format, episode duration, voice source, release cadence |
| Music | Audio Studio, Book & Script Editor, Timeline, Moodboard, Asset Library, Release Checklist | Song/instrumental/soundtrack, mood, vocals, release destination |
| Course | Lesson Builder, Book & Script Editor, Storyboard, Research Notebook, Audio Studio, Asset Library, Release Checklist | Learner audience, lesson format, course length, assessment method |
| Language learning | Language learning | Target language when missing; app language supplies the fluent language, with beginner starting level and separate daily logs |
| Brand | Moodboard, Asset Library, Book & Script Editor, Research Notebook, Release Checklist | Identity purpose, tone, first asset kit |
| Research | Research Notebook, Book & Script Editor, Timeline, Asset Library, Release Checklist | Research goal, depth, final deliverable |
| Something else | Research Notebook, Moodboard, Asset Library, Release Checklist | Intended outcome, audience, first scope |

Creative setup also asks how much guidance the user wants. Intelligence and account usage controls are handled separately; setup does not ask for an AI spending budget.

## Reusable component responsibilities

| Component | Saved work |
| --- | --- |
| Task Board | Tasks, status, phase, description, acceptance checks, prerequisites, and the related creative tool |
| Project Blueprint | Editable Markdown brief, scope, setup decisions, assumptions, tools, milestones, and release checks |
| Project Memory | Durable facts, goals, constraints and glossary notes, with Markdown export |
| Characters | Identity, appearance, personality, voice, motivation, relationships, and reference images |
| Story & Plot | Premise, beats, conflicts, arcs, and continuity notes |
| Storyboard | Ordered scenes/shots, script and dialogue, camera direction, first and last frame references, and transitions |
| Book & Script Editor | Chapters or scenes, draft text, notes, and editorial status |
| Timeline | Ordered narrative or production events with timing and continuity notes |
| Game Design | Mechanics, player controls, levels, core loop, and playtest notes |
| World Builder | Locations, lore, world rules, and reference material |
| Audio Studio | Track or episode plans, dialogue, sound cues, voice notes, and source permissions |
| Moodboard | Visual references, palette and style notes, and source information |
| Asset Library | Planned or linked media, status, provenance, and licensing notes |
| Pages & Screens | Screen purpose, content, navigation, interactions, and accessibility notes |
| Lesson Builder | Learning goals, lesson content, practice, and assessment checks |
| Language learning | Separate learner profiles, daily conversation logs, contextual translations, corrections, and saved phrase reviews; see the [language guide](language-learning.md) |
| Research Notebook | Questions, findings, evidence links, reliability notes, and unresolved issues |
| Release Checklist | Deliverables, destinations, credits, packaging, and launch requirements |

Characters, plot, manuscript, world, assets, and other records belong to the project and are shared across its tools. For example, a movie and a book use the same character editor implementation. A mixed project can attach both Storyboard and Book & Script Editor without creating a second copy of its characters.

## Guided setup

### When it runs

- Every ordinary chat request goes through the shared classifier, including later messages and standalone chats. Project context settings still control access to existing workspace data.
- A supported creation request attaches the matching experience and returns its authored welcome. Asset-sized requests such as a movie poster, chapter, or game character should not trigger whole-project setup; this distinction is part of classifier qualification.
- Setup can also be opened explicitly from the Task Board, Project Blueprint, or a planning request such as `/wayfinder` in chat. Explicit setup can revisit an existing project.
- An archived project must be restored before its plan or workspace can be changed.
- Follow-up messages can add or update structured editor records, task details, blueprint sections and memory. They do not regenerate the entire roadmap on every request.
- A first learning request such as “I want to learn Spanish” saves its practice roadmap and creates a learner directly using the app language. Only an unspecified target language needs an inline choice. A deeper AI planning pass remains an explicit option on the task board.

### Explicit roadmap editor

Ordinary intake opens the relevant experience directly. The separate, explicitly opened roadmap editor retains the following steps:

1. **Your idea:** an editable brief and a graphical project type picker.
2. **A few choices:** one decision at a time, with graphical radio cards, practical tradeoffs, and a recommended starting point. The server extracts choices already stated in the brief; those choices are shown together and can be changed. Unresolved decisions include the relevant creative settings, and guidance preference.
3. **Your roadmap:** an editable idea, the tools that will appear in the project sidebar, and a summary of decisions. Recommendations are labeled **Starting assumption**. An edited brief is checked again before saving so old inferred choices are not silently applied to a new idea.

**Choose for me** selects the catalog recommendation. The user can also use recommendations for all remaining choices. Recommendations are deliberately omitted from the submitted explicit answers so the planner records them as assumptions rather than confirmed decisions.

The preview endpoint does not save a workspace. Only the final **Create my roadmap** or **Update project roadmap** action persists the plan. Failed requests retain the edited idea and choices. Planning does not start paid media generation.

### Starter roadmap

The first roadmap includes scope, unknown decisions, tools, a small complete prototype, production tasks, checks with a new user, release, and feedback. Each task has a concrete description and one or more acceptance checks. Dependencies identify prerequisites; the board also supports phase and text filters and list/board layouts.

Options add relevant work. Online multiplayer adds network validation. Mobile or console targets add platform access and delivery checks. Accounts, payments, or cloud data add privacy and recovery work.

Explicit replanning is additive. Existing records, task edits, completion states, custom design text, and the original brief remain intact. Stable task IDs prevent duplicate template tasks. Changed choices and new template tasks are merged into the workspace; users can revise existing tasks and their blueprint directly.

## Component ordering and regular chats

`GET /v1/builder/catalog` returns each component's numeric `priority`. Lower numbers appear first. Project Blueprint (`design`) is fixed at 1 and Task Board (`tasks`) at 2. Other components default to spaced priorities and can be configured per account with `PATCH /v1/account/preferences`, for example:

```json
{"component_priorities": {"storyboard": 3, "characters": 4}}
```

The server rejects overrides of the fixed first two positions. The web sidebar and component picker sort the catalog by these priorities. The sidebar applies current preference overrides immediately.

Chats without a project use `project_id: null` and appear below Projects. They can move into or out of projects. Their own conversation history supplies context. A supported creation request can create a project and attach the original conversation after classification. Ordinary discussion leaves the chat standalone.

## Storage and API

All project workspace endpoints enforce project ownership. `project_workspaces` holds a versioned document for each project. A project without a workspace receives an empty document when read; setup and edits persist it.

| Method and endpoint | Purpose |
| --- | --- |
| `GET /v1/builder/catalog` | Return project types, components, question options, and recommended choices |
| `GET /v1/projects/{project_id}/workspace` | Return `{version, workspace}` |
| `PUT /v1/projects/{project_id}/workspace` | Save `{version, workspace}` using optimistic concurrency |
| `GET /v1/projects/{project_id}/memory.md` | Export the owned project's brief and editor records as Markdown |
| `POST /v1/projects/{project_id}/plan-preview` | Read-only eligibility check, type detection, and answer extraction |
| `POST /v1/projects/{project_id}/plan` | Generate and persist an eligible starter plan |
| `POST /v1/projects/{project_id}/plan-refinement` | Start an actual model run to propose a deeper project plan |
| `GET /v1/projects/{project_id}/plan-refinements/{run_id}` | Read a validated refinement proposal |
| `POST /v1/projects/{project_id}/apply-refinement` | Apply a reviewed proposal against its original workspace version |

Both planning endpoints accept `{prompt, kind?, answers?, explicit?}`. Preview returns `{eligible, reason?, kind, answers}`. Planning returns `{eligible, reason?, version, workspace}`. `explicit` defaults to false; clients set it only for a user-requested setup or replan.

The workspace contains `kind`, `initialized`, `brief`, `answers`, `assumptions`, `components`, `tasks`, `records`, `design`, and `plan_prompt`. Creative records have an ID, title, and a dictionary of typed-editor field values. First and last frame references store project image artifact IDs in record fields; binary media stays in the existing artifact store.

Writes require the last observed version. A stale save returns HTTP 409 and leaves the server document unchanged. Task IDs must be unique; prerequisites must exist and cannot form cycles. The server checks component IDs, bounds document and field sizes, and rejects writes to archived projects.

### AI refinement contract

`plan-refinement` accepts `{budget_usd, idempotency_key}` and returns the existing `RunOut` type. It creates a durable model run through Powwow's normal provider and budget controls. The refinement prompt supplies the project's brief, choices, starter tasks, and a bounded sample of editor records, and asks for structured JSON containing a richer blueprint and proposed tasks.

`plan-refinements/{run_id}` returns `{run_id, version, design, tasks}` after the successful model output has passed validation. The model run must belong to the same project and be tagged as a builder refinement. Proposed task statuses must be `todo`; component names and dependency references must be valid; dependencies cannot form cycles. Invalid output returns HTTP 422 and leaves the current project untouched.

`apply-refinement` accepts `{run_id, version}`. It requires the workspace version captured when refinement started. A concurrent project edit returns HTTP 409, preserving that edit and preventing a stale proposal from replacing the blueprint. Applying a valid reviewed proposal replaces the blueprint and adds new task IDs while preserving existing task content, statuses, and all editor records. The model output is a proposal until this explicit apply action succeeds.

## AI context and execution boundaries

Project chat receives the saved blueprint, task summary, and creative records within the existing context policy. This gives the assistant a consistent description of the current project. **Ask Powwow** prepares a focused chat request from a task or editor record; the user submits it through the normal chat flow and its existing provider/budget controls.

Starter roadmap content comes from structured templates. Conversation-driven setup first uses a paid classifier; the explicit roadmap endpoint can still generate a template without a model call. A template has not researched current technologies, proven feasibility, or verified provider availability and prices. Unanswered choices remain assumptions.

Rich intake and later chat requests use the structured project response stage to capture supplied details. **Deepen with AI** remains a separate explicit proposal with review/apply controls. Failed submissions retain an idempotency key for safe recovery. A generated plan is not evidence that an engine, service, price, or delivery route has been tested. Research, prototypes, and acceptance checks still establish that evidence.

The editors organize creative work and persist structured content. They do not themselves install Unity, Unreal, or Godot; run a game engine; edit and render a final film; mix audio; distribute a book; or publish to stores. Existing Powwow model capabilities can support text and available media generation through chat. External build execution, additional hosted tools, and full production exports require separate implementation or a configured integration.

## Extending the builder

1. Add or update the declarative type, questions, and components in `builder_catalog.py`. Each option needs a stable ID, plain-language label, tradeoff, and an icon. Keep recommendations practical for a small first project.
2. Add concrete roadmap steps and option-dependent work in `builder.py`. The catalog component list must include all tools used by the generated tasks so setup review matches the resulting sidebar.
3. Add the editor schema and rendering behavior in `apps/web/src/BuilderEditors.tsx`. Keep shared concepts in shared editors rather than duplicating project-type-specific versions.
4. Extend `apps/web/src/builder.ts` for any changed wire types or icons. The setup question UI reads the server catalog and does not need a new hard-coded form for each type.
5. Verify intent gating, extraction, persistence, ownership, conflicts, saved edits, small-screen behavior, and one complete novice journey. Test the result with a new creator who has not been coached through the interface.


## Verification (October 3, 2026)

- Backend suite: 105 tests passed; 2 PostgreSQL-only tests skipped in the SQLite unit suite. Live authenticated tests exercised persistence against local Supabase PostgreSQL.
- Browser checks covered first-prompt setup, inferred settings, saved tasks and design, archived chat access, draft navigation protection, editor CRUD, chapter reading and ordering, first/last frames, and 390px/320px reflow. Fixtures are explicitly identified in the editor QA scripts.
- A real local Ollama run (`qwen3:4b-instruct-2507-q4_K_M`) produced a validated project design and 9 proposed game tasks. Review did not alter the project; explicit application preserved existing work, survived reload, and rejected duplicate application. No provider charge was recorded.
- Additional runtime/search checks: 13 passed. The production web build passes. Regenerated Dart client analysis has no errors and reports two existing redundant null-check warnings in its upload method.
- Reports and screenshots: `evals/reports/project-builder/`, `evals/reports/project-builder-editor/`, and `evals/reports/project-builder-refinement/`.
- The child-led build is still the next product acceptance test. This update supplies planning and creator workspaces; it does not yet provide a hosted code runner or game preview/export pipeline.

