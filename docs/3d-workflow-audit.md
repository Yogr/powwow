# 3D workflow audit — October 9, 2026

The original path stopped after TRELLIS and a deterministic Blender check. No orchestration connected image editing, visual reasoning, finishing and texture work. `asset.production.v1` now connects those stages. `asset.image_to_3d.v1` remains available for an explicitly requested concept reconstruction; its raw and validated GLBs are versions of one reconstruction.

## Retained reference

The authority in the local reference project is `docs/ASSET-PIPELINE.md` in the separate reference checkout, with parameters in `Tools/Trellis/hybrid_pipeline_profile.json`. No Start a Gang files were changed. Its targeted garage repairs and registered visibility-tested artwork projection are asset-specific authoring tools, not an unattended generic service. Its profile explicitly states `batch_scheduler_implemented: false`.

The transferable practices are retaining immutable references, generating a detailed master, inspecting actual geometry, repairing observed defects without blanket smoothing/decimation, preserving artwork and UV registration, saving an editable master, and reimporting the exported derivative for inspection.

## Executable production stages

| Stage | Implementation |
| --- | --- |
| Reference preparation | GPT-6.1 Sol high sees the original image and writes an edit brief. FLUX receives actual source pixels; the API verifies source ID/hash evidence. Pinned upstream BiRefNet then isolates the foreground into PNG alpha without changing RGB pixels. |
| Detailed reconstruction | Pinned TRELLIS.2 local SPZ runtime; requested 1536 resolution, 32 steps, 1,000,000 target faces, 4096 texture. Preserve raw and validated meshes with actual parameters and hashes. |
| Mesh inspection | Blender imports the generated GLB, inventories geometry/materials, and renders four lit views. |
| Model-directed finishing | Astra high inspects multiple views and returns a strict plan for bounded loose-vertex removal, very small merge distances, normal recalculation, smooth shading, PBR parameters and subtle albedo corrections. Sol high handles reference preparation; Super also upgrades preparation. Python is fixed server code, never generated Python. |
| Textures and mapping | Bake new 4096px albedo atlases into existing UV maps, independently per material slot. Preserve original markings, other texture channels and registration. This is material-guided baking, not invented artwork or diffusion over a UV atlas. |
| Export and acceptance | Save editable `.blend`, final GLB and texture PNGs. Reimport the GLB, validate its embedded material images, render four views and request final visual review. A rejection preserves outputs and reports defects. |
| Web preview | Use the saved lit PNG. Older GLBs receive one Three.js render when visible; geometry, textures, image bitmaps and WebGL context are then released. Cache the PNG by account, artifact ID, content hash and render version. No animation loop. |

Each stage has a durable checkpoint, immutable input/output hashes, model policy, usage and failure state. Paid replies are charged before schema interpretation. An uncertain submission is never replayed. Explicit retry after a known Blender failure reuses completed image, reconstruction and model-plan stages. A quality rejection requires reviewing output and revising the request, instead of repeating the same model call.

A known incomplete or invalid Sol plan can receive one explicit Super review using the saved geometry and views. This is a separate, accounted-for model comparison; it cannot override a geometry rejection or uncertain submission. Geometry rejected before finishing remains a visible Project Asset marked **Needs review**, with its saved render and specific defects.

The production path requires the configured local image/TRELLIS worker, local Blender and hosted vision model. Cloud reconstruction remains a separate concept path. Arbitrary topology repair, rigging, retopology and creating/projecting new artwork are not implemented. The planner and visual gate must state those limitations. This is not a universal unattended replacement for asset-specific Blender authoring.

## Profiles and qualification

| Profile | Resolution | Steps | Target faces | Texture |
| --- | --- | --- | --- | --- |
| Local concept draft | 512 | 12 | 50,000 | 1024 |
| Cloud concept standard | 1024 | 12 | 100,000 | 2048 |
| Production detailed candidate | 1536 | 32 | 1,000,000 | 4096 |

The development machine has a 16 GB RTX 5080 Laptop GPU and 32 GB RAM. Detailed generation loads additional flow models and takes substantially more memory/time. Upstream cascading can reduce effective resolution based on token count; requested and effective resolutions remain in provenance. No worker silently changes the requested profile or repeats a failed generation. Start a Gang settings alone do not qualify this adapter.

Software tests cover stage accounting, budgets, uncertainty, quality rejection, ownership, naming and resume without paid-stage repetition. A real Blender fixture exercises bounded edits, baking, export/reimport and rendering. Browser checks cover authenticated/local assets, cached thumbnails, no ongoing draw calls, no GLB download for saved PNGs, responsive layout and errors. These are software checks, not AI-quality evidence.

Live evidence is kept in `evals/reports/production-live.json` and the associated output directory. The single-run ledger in `scripts/evaluate-production.py` prevents duplicate submissions. The revised planner suite is `evals/request-planner-quality.json`. Broader visual/geometry evaluation and product-owner review remain required before promotion.

The prior FLUX reference-edit smoke is retained in `evals/reports/flux-reference-edit-2026-10-09/report.json`: 57.17 seconds, 9.20 GB peak allocated GPU memory, mug identity broadly retained but not pixel-identical. It does not establish character/T-pose fidelity.

The first production smoke exposed two real failures. A 58.8 MB reconstruction exceeded inline transport limits; production stages now receive exact signed upload destinations and validate the returned keys. The existing mesh was recovered with matching source pixels/output hash and real Blender validation, without regeneration. The visual gate then rejected the opaque-background floor plane and distorted walls. This failure remains recorded in `production-live.json`; it was not declared successful.

The corrected input path adds upstream `ZhengPeng7/BiRefNet` at revision `e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4`. `scripts/setup-foreground-model.py` explicitly installs that pinned model into ignored local storage with file hashes. Runtime inference is offline; it does not use the separately installed BRIA model. The foreground smoke removed 80.4% of the image into alpha and used 3.35 GB peak allocated GPU memory. The API verifies unchanged RGB pixels and a substantial transparent/background and opaque/foreground region. Corrected full-chain evidence is in `production-masked-live.json`.

The corrected reconstruction completed at 1536 resolution with 963,888 triangles and 4096px textures in 1,086.86 seconds. The floor plane was eliminated. Sol high then returned a truncated plan with a whitespace loop (8,192 output tokens, only 477 reasoning tokens); increasing the token allowance was not treated as a remedy. Its known $0.093620 usage and incomplete reply are retained. An explicit Astra high comparison reused the same model and views without regenerating anything, returned valid structured output, and rejected dents and distorted lower/back ridges that the bounded finishing tools cannot reshape. Astra is now the candidate baseline for multi-view planning and final review. The revised run plus comparison cost $0.236085; neither constitutes an accepted finished-model quality result. Owner review and broader evaluation remain pending.

Separately, `production-export-engineering/evidence.json` records the real rejected mesh passing an identity-preserving Blender export test: new 4096px albedo, editable compressed `.blend`, a 53,757,412-byte GLB, verified embedded textures after reimport, and a 282,993-byte lit PNG. This test does not override the app's rejection or invent model-directed repairs. `model-preview-real/report.json` verifies that actual GLB in the browser, including cached still images and no ongoing draw calls. All software stages are implemented; this reconstruction candidate is not qualified for guaranteed finished asset quality.

`scripts/recover-trellis-output.py` is an operator-only recovery for a known transport failure: it verifies the saved run, reference pixels, detailed profile and output hash, runs Blender validation and registers the existing outputs. It preserves the failed run and its costs; continuation still uses normal explicit retry. It cannot override quality rejection or uncertain billing.

Implementation references: [official FLUX.2 pipeline API](https://huggingface.co/docs/diffusers/api/pipelines/flux2), [pinned TRELLIS pipeline](https://github.com/microsoft/TRELLIS.2/blob/75fbf0183001ed9876c8dbb35de6b68552ee08bd/trellis2/pipelines/trellis2_image_to_3d.py), [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html).
