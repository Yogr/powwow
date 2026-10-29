# 6. Next-chat handoff

> Implementation update, September 30, 2026: the application now exists. See [current status and evidence](07-implementation-status.md) and the [selected Runpod stack](../setup/01-provider-decision.md). This document preserves the original planning baseline.

Date: September 30, 2026. [Planning index](../../README.md).

## Current repository state

The repository contains planning documents and earlier feasibility research. No application scaffold, runtime, cloud deployment, model installation, benchmark, or paid API integration has been completed by this planning task.

The active direction is a prompt-first web app backed by Powwow-managed rented hardware, with Flutter iOS/Android clients using the same backend. Public peer hardware and its privacy design are deferred. The first generation capabilities are text to image, image to video, and image to 3D.

## Paste into the implementation chat

> Build the first Powwow interface milestone in this workspace. Read README.md and docs/poc/01-product-and-interface.md through docs/poc/05-implementation-plan.md before editing. These September 30 documents supersede the earlier personal-hardware-first rollout.
>
> Start with Milestones 0 and 1: a responsive React/TypeScript web app, shared API/event contracts, and clearly labeled simulated adapters for text-to-image, image-to-video, and image-to-3D. Use the proposed defaults unless I change them. Make a working interface, not only a landing page. Do not provision paid cloud resources as part of this interface milestone.
>
> Include project/chat creation, renaming, archive/restore, search, chat movement, explicit context sharing, a simple outcome composer, attachments, job progress/cancel/retry states, artifact history, and image/video/3D previews. Desktop workspaces should expand horizontally; phone layouts should switch between Chat, Output, and Details. Sample results must be identified as simulated. Use realistic sample media with known usage rights.
>
> Prepare for a Python/FastAPI backend and Flutter mobile through shared OpenAPI and event schemas, stable capability IDs, and provider interfaces. Keep model/hosting logic out of UI components. Record how TypeScript and Dart clients will be generated and how a Flutter slice will use the same API. Do not claim Flutter support has been verified until it has actually been built and tested.
>
> Keep credentials out of browser code. Validate the interface in a real browser at phone/tablet/desktop sizes and exercise the three workflows, context controls, and error states. Finish with run instructions, what works, what is simulated, tests performed, and the next live-backend milestone. Update the milestone status in the documentation with evidence.

## Subsequent chat: live generation

After reviewing the interface, continue Milestones 2-4. Choose a provider, region, and experiment budget using the hosting document; confirm available GPU quota. Build persistent accounts/projects/jobs/artifacts, a Flutter slice, then deploy one image worker before adding video and TRELLIS.2.

Use the model shortlist as a starting point. Recheck current source revisions, component licenses, prices, and compatibility before downloading or provisioning. Record exact versions and actual performance. Preserve the ability to switch compute providers through adapters.

## Information to bring when available

- AWS/GCP account preference, credits, region, and spending ceiling.
- Access to the founder's existing text/image/Trellis/Blender/texture workflow, scripts, and reference outputs.
- Desired visual direction or examples for the web interface.
- Acceptable generation wait and quality examples for each capability.
- Provider API credentials through the chosen secret mechanism when premium integrations begin.
- A Mac/macOS CI path for iOS validation and eventual signing.

These inputs need not delay the first interface milestone. Avoid inventing missing benchmark results, claiming a sampled output came from a live model, or treating a draft architectural choice as a settled founder decision.


