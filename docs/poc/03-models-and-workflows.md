# 3. Models and workflows

Research date: September 30, 2026. Status: benchmark shortlist, not installed or tested. [Planning index](../../README.md).

## Selection policy

Use existing weights and invest in prompting, preprocessing, orchestration, refinement, and evaluation. Select the strongest useful result within a cost and latency target. "Best in class" is an evaluation goal, not an established property of this shortlist.

Prefer permissively licensed candidates for the initial commercial catalog. Record weights, code, encoders, segmentation models, adapters, and rendering dependencies separately. An open repository or downloadable checkpoint does not establish that every component has the same license. Record exact revisions before deployment; the names below identify candidates, not immutable production builds.

## Initial model shortlist

| Capability | Proposed baseline | Comparison candidate | Evidence and qualification |
|---|---|---|---|
| Text to image | `black-forest-labs/FLUX.2-klein-4B` | `Qwen/Qwen-Image-2512` | Both model cards list Apache 2.0. Compare prompt adherence, image quality, text rendering, and full workflow cost. [FLUX card](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B), [Qwen card](https://huggingface.co/Qwen/Qwen-Image-2512) |
| Image to video | `Wan-AI/Wan2.2-TI2V-5B` | `Wan-AI/Wan2.2-I2V-A14B` | Wan code/models use Apache 2.0. Upstream documents 24 GB for the 5B offloaded path and 80 GB for the larger I2V command. The smaller model is a feasibility baseline. [Wan repository](https://github.com/Wan-Video/Wan2.2) |
| Image to 3D | `microsoft/TRELLIS.2-4B` | Improved preprocessing and refinement using the same base | Upstream lists MIT for model/code, Linux, at least 24 GB GPU memory, and validation on A100/H100. Dependencies have their own terms. [TRELLIS.2 repository](https://github.com/microsoft/TRELLIS.2) |
| Classifier / inexpensive chat | `Qwen/Qwen3-4B-Instruct-2507` | Rules-only classifier and a stronger configurable model | Candidate for structured routing and basic chat, not a promise of frontier reasoning quality. Model card lists Apache 2.0. [Qwen model card](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507) |

Do not equate minimum VRAM with fast service. Resolution, frames, precision, offload, attention implementation, and concurrent requests change the memory profile. Use one generation per worker as the baseline. Start on a roomy GPU, measure, then evaluate cheaper hardware.

### Newer alternatives worth tracking

- **LTX-2.5:** current Lightricks documentation includes image-to-video and text-to-video paths. Its model card uses a community license with revenue-related commercial terms, rather than Apache/MIT. Keep it as a comparison candidate pending a review of the exact checkpoint and component terms. [LTX model card](https://huggingface.co/Lightricks/LTX-2.5), [official runtime](https://github.com/Lightricks/LTX-2)
- **Qwen-Image-2.1:** the current card identifies a Qwen Research License. Do not automatically replace the permissive 2512 baseline with it for a commercial service; resolve permission first. [Model card](https://huggingface.co/Qwen/Qwen-Image-2.1)
- The FLUX.2 klein 4B and 9B variants have different licenses. The recommendation here names **4B** specifically.

Refresh this shortlist before a live deployment. Promote new models through evaluation and a versioned catalog change, preserving old run provenance.

## Runtime packaging

Use official Python pipelines or Diffusers where supported, with pinned dependencies and reproducible containers. ComfyUI can be a useful internal workflow-authoring tool, but its exported graph and custom nodes must be versioned and executed behind a worker adapter. Do not make the web UI depend on ComfyUI's internal graph format.

Each enabled model manifest must contain:

- Capability and exact source revision, file hashes, complete dependency inventory, and license decision.
- Container digest, CUDA/PyTorch/native extension versions, supported GPU architectures.
- Input/output schemas, permitted sizes, precision, steps, seeds, and offload settings.
- Measured peak GPU/host memory, storage footprint, cold start, warm time, and tested concurrency.
- Evaluation results, known failure cases, per-run limits, and active/disabled status.

Workers download/cache approved weights, verify hashes, warm the selected model, and register readiness. Avoid downloading weights for each job. Separately measure container startup, weight download, model load, inference, and postprocessing.

## Recipe A: polished image

ID: `image.create.v1`.

1. Accept prompt, style preference, aspect ratio, optional reference, and quality tier.
2. Apply a task-specific brief skill that preserves names, requested text, composition, and constraints.
3. Generate with a pinned model/settings profile. Default to one candidate; extra variants consume an explicit budget.
4. Validate dimensions, file integrity, and requested format. Optional visual review uses a declared model and budget.
5. Save preview, original output, settings, and lineage. Offer a bounded revision.

Output: PNG or another explicitly selected image format plus metadata. UI opens the image workspace. Acceptance focuses on fidelity to the brief and useful visual quality, not a favorable self-score from the generator.

## Recipe B: animate an image

ID: `video.animate.v1`.

1. Accept an uploaded/project image and motion description.
2. Validate input, choose a supported size, and disclose any crop. Keep the original.
3. Apply a motion-planning skill: subject motion, camera motion, scene stability, and duration.
4. Generate a short clip using the selected Wan profile.
5. Validate frame count, decodeability, duration, dimensions, and output encoding. Generate a poster and preview.
6. Save MP4 and metadata. Allow a new motion variant without losing the original clip.

Target a roughly five-second 720-class clip for the initial benchmark, using exact dimensions/frame counts supported by the chosen model. This is a test profile, not a claim about measured speed. Audio generation is a later capability. Do not promise arbitrary clip lengths from the first model.

## Recipe C: image to usable 3D

ID: `asset.image_to_3d.v1`.

1. Accept a source image and intended use, such as preview asset, game prop, or design concept.
2. Apply an input-preparation skill: object framing, background treatment, and useful viewing angle. Use manual crop/mask as a valid initial route rather than silently adding an unreviewed segmentation model.
3. Generate using the pinned TRELLIS.2 profile.
4. Run deterministic Blender validation and export: successful import, bounds, normals, material links, texture presence, and a configured triangle budget where applicable.
5. Produce a turntable preview, GLB, texture files where needed, and a validation summary. Preserve the raw model beside the processed result.

A previewable mesh is not automatically production-ready or watertight. Treat game topology, rigging, CAD suitability, and 3D-printability as separate profiles with separate checks. The standard PoC promises a valid, viewable asset and transparent validation results.

### Founder workflow to port after the baseline

`Text brief -> reference image -> TRELLIS.2 -> Astra-guided Blender edits -> texture replacement -> validation/export`.

Locate the existing local skill, scripts, example assets, Blender version, model versions, and success/failure examples in the implementation chat. They are not in this repository yet. First preserve the known working sequence and evaluate it against the baseline. Do not recreate its quality claims from the description alone.

Keep geometry edits and texture replacement as distinct, rerunnable stages. An agent proposes bounded operations; the Blender tool executes them with checkpoints and a time budget. Preserve original mesh and UV/material relationships, and inspect final renders. Limit revision loops to prevent unbounded API/GPU spending.

## Workflow specification example

The following illustrates the intended schema; it is not an executable manifest and must not be dispatched as-is.

```yaml
id: asset.image_to_3d
version: 1
input_schema: ImageTo3DRequest
output_schema: MeshArtifactBundle
workspace: model3d
skills:
  - asset_brief@1
  - mesh_validation@1
stages:
  - id: prepare
    executor: tool
    capability: image.prepare
  - id: generate
    depends_on: [prepare]
    executor: model
    capability: image_to_3d
    model_profile: trellis2_baseline
  - id: validate_export
    depends_on: [generate]
    executor: tool
    capability: blender.validate_export
policy:
  max_attempts_per_stage: 2
  budget_source: run_budget
  preserve_intermediate_artifacts: true
```

The registry resolves a model profile to an immutable deployment manifest. A workflow declares capabilities; a provider binding selects the hardware. This keeps a future hardware change separate from an editorial skill change.

## Quality evaluation and release gate

Create an initial suite of at least 20 representative examples per capability, including difficult cases and the founder's reference examples. Save rights-cleared inputs, expected attributes, pinned seeds where meaningful, and human ratings. Begin with a few smoke examples, then run the full suite before choosing the shipping baseline.

| Capability | Human review | Automated checks |
|---|---|---|
| Image | Composition, requested details, text accuracy, visual defects | Dimensions, decodeability, latency, memory, cost |
| Video | Identity preservation, motion, consistency, flicker, prompt adherence | Duration, frames, dimensions, encoding, cost |
| 3D | Silhouette, multi-view coherence, surface/material quality, editability | GLB import, geometry counts, texture references, bounds, cost |
| Routing | Correct workflow and useful clarification | Labeled intent accuracy, schema validity, unsupported-request handling |

Compare the refined recipe with a plain model call on the same inputs. Count all candidates and failed attempts in cost per accepted result. Record warm/cold performance separately. Establish numerical quality/latency thresholds after this baseline; no measurements exist yet.

Commercial onboarding includes the actual component licenses. TRELLIS.2 explicitly distinguishes its license from rendering dependencies; inspect pinned [nvdiffrast](https://github.com/NVlabs/nvdiffrast/blob/main/LICENSE.txt) and [nvdiffrec](https://github.com/NVlabs/nvdiffrec/blob/main/LICENSE.txt) terms rather than relying on third-party summaries.
