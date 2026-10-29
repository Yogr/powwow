# 1. Product and interface

Date: September 30, 2026. Status: requirements and proposed PoC scope. [Planning index](../../README.md).

## Product direction

Powwow lets a user describe what they want to achieve and receive a useful, editable result. Powwow supplies the model selection, focused agents, skills, tool connections, and workflow steps behind that result. Its differentiator is the quality and completeness of its packaged workflows, supported by a workspace that expands as the task requires.

The initial backend runs existing models on hardware rented and operated by Powwow. Premium access to OpenAI, Anthropic, and Grok supplements those models. Model training from scratch is outside this plan.

The long-term vision covers many kinds of creation and work. The first release proves three generation paths and the common infrastructure they need.

## Requirements preserved from the founder's brief

| Requirement | PoC treatment | Later expansion |
|---|---|---|
| Start with a simple outcome prompt | Central composer with attachments and a few examples | Voice and richer multimodal input |
| Projects and chats | Create, rename, archive, search, move chats, restore archived items | Team collaboration |
| Isolate or share context across the account | Explicit context scopes and links, explained below | More selective retrieval and memory controls |
| Self-host open models on rented hardware | Live image, video, and 3D workers | Broader catalog and hardware pool |
| Premium OpenAI, Anthropic, and Grok | Provider-neutral chat UI and adapters; staged activation | Expanded provider capabilities and paid subscriptions |
| Refined skills and reusable workflows | Three versioned recipes with evaluations | Workflow library and specialized agents |
| TRELLIS.2 plus Blender refinement | Image-to-3D baseline and deterministic Blender validation/export | Port the founder's full refinement and texture workflow |
| Advanced tools | Media previews, job tasks, artifact versions | Video editor, storyboard, book writer, more workspaces |
| Lightweight first-pass classifier | Server routing interface with a small-model candidate | Optional client model using the same classification schema |
| Modular routing and hardware | Capability registry, workflow versions, provider adapters | Personal and peer workers after separate validation |
| Flutter mobile | Shared contracts and an early Flutter client slice | Complete iOS and Android apps |

"Jev style" is interpreted here as inexpensive intent classification followed by selection of specialist capabilities. No existing Jev implementation has been supplied. The founder's Trellis/Blender skill is described in the conversation; its implementation is not present in this repository.

## PoC user journeys

1. **Create an image.** Open a project, ask for an image, adjust aspect ratio or style if desired, generate, inspect, download, and reuse it.
2. **Animate an image.** Upload or select a generated image, describe motion, generate a short clip, preview it, and download MP4.
3. **Create a 3D asset.** Upload or select an image, generate a mesh, orbit the preview, inspect materials, and download GLB.
4. **Reuse context deliberately.** Keep a project isolated, share a selected source with another project, inspect the context used, and revoke the link.
5. **Continue from another device.** Open the same project in Flutter, see job progress and artifacts, and submit a supported task.

Text-to-image-to-3D is a composed extension of journeys 1 and 3. Ship it after those stages work separately. The founder's premium Blender and texture passes are a subsequent refinement, not a prerequisite for the first mesh.

## Interface structure

### Empty state

- Header: project name and account menu.
- Collapsible left navigation: new chat, projects, recent chats, search, library.
- Main composer: **What do you want to achieve?**
- Attachment button and concise capability suggestions: Create an image, Animate an image, Make a 3D model.
- Default quality choice: Standard; Premium available when configured and allowed for the account.
- Advanced model/runtime choices remain in an expandable settings surface.

Submitting an ordinary supported request starts work within the user's configured budget. Ask for missing required information only when a useful default is unavailable. A cost increase outside that budget requires a clear choice.

### Active workspace

Desktop expands from navigation + conversation to navigation + conversation + artifact workspace. The artifact area can grow while conversation remains available. Use resizable panels, collapse controls, and keyboard navigation.

| Workspace | PoC controls | Future controls |
|---|---|---|
| Image | Zoom, variants, prompt/settings, download, animate, make 3D | Masking, regional edits, layers, reference collections |
| Video | Playback, poster, duration/resolution, download, source image | Timeline, trim, tracks, captions, storyboard shots |
| 3D | Orbit, zoom, reset camera, lit/wireframe view, material preview, GLB export | Geometry repair, UV/material editing, texture replacement |
| Writing | Extension slot documented | Chapters, characters, plot, timeline, style guide, continuity notes |
| Tasks | Current workflow stages and status | Dependencies, assignment, scheduling, reusable plans |

On phones, use Chat / Output / Details navigation instead of squeezing desktop columns into the viewport. Uploads, downloads, and long-running tasks must survive navigation and application suspension. Show a static poster when interactive 3D is unavailable, with the original asset still downloadable.

### Progress and recovery

Show meaningful stages: preparing, queued, loading model, generating, processing, complete. Display percentages only when the runtime supplies useful measurements. Give an elapsed time and an estimate range when calibrated data exists.

Support cancellation, visible failure reasons, retry, and navigation away during work. Keep completed intermediate outputs when a later stage fails. An interrupted network connection must not silently launch another paid generation.

## Project and chat context

Default: a chat can use its own history and the explicitly enabled context of its project. Account-wide history is excluded unless the user opts into selected sources.

Three selectable modes:

- **This chat only:** this conversation and its attachments.
- **This project:** this chat plus eligible project sources and summaries.
- **Selected sources:** explicit chats, artifacts, or projects elsewhere in the same account.

Sharing is a directional grant from a source to a destination. The first implementation supports selected chat/artifact snapshots and an explicit whole-project link. Snapshot imports have a visible capture time; live project links resolve current eligible sources at each new run. Whole-project access never follows links recursively.

The UI must show source names, scope, snapshot/live behavior, and a remove action. Moving a chat changes its home project and the default context for future runs; it does not silently rewrite prior messages or copy all old project context.

Revocation prevents future retrieval. It cannot erase information already included in an answer or an imported copy; the UI must distinguish those cases. Every run records which source versions were used. Isolation is enforced in retrieval and storage access, including summaries and caches, rather than through a prompt instruction alone.

## Quality and product behavior

- Natural writing means honoring the user's style, concrete wording, and editorial revision. Do not promise to defeat AI detectors.
- Users can inspect the selected workflow, model, and cost details without needing to configure the underlying stack.
- Save original inputs, generated versions, selected favorites, and a downloadable result in the project library.
- A multi-stage result shows its lineage: input image, generated mesh, processed mesh, textures, and final export.
- Label simulated results during interface development. A sample asset must never appear to be a completed live inference job.
- Support keyboard-only operation, accessible names, visible focus, sufficient contrast, and responsive layouts at phone, tablet, and desktop sizes.

## Explicitly deferred

Public peer inference, contributor payouts, full video editing, a complete book-writing suite, arbitrary user-installed MCP servers, autonomous publishing, and a catalog containing every available model. These remain future directions; the architecture makes room for them without requiring them for the PoC.
