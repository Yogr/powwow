# Reuse the installed local TRELLIS.2 runtime

Powwow can use the Windows TRELLIS.2 SPZ installation already used by Startagang. Configure the path to your own installation, including its Python environment, native mesh libraries, and model cache. Startagang's project, launch scripts, original images, and generated assets are not changed.

## Configuration

Set these values in Powwow's ignored `.env`, then restart its local services with the Powwow scripts:

```dotenv
POWWOW_TRELLIS_LOCAL_ROOT=C:/path/to/trellis/code
LOCAL_MEDIA_CAPABILITIES=text_to_image,image_to_3d
BLENDER_BINARY=C:/Program Files/Blender Foundation/Blender 5.2/blender.exe
POWWOW_BLENDER_SCRIPT=C:/path/to/powwow/services/blender/validate.py
```

For local Supabase Storage only, also configure `POWWOW_UPLOAD_HOSTS=127.0.0.1,localhost` and `POWWOW_ALLOW_LOCAL_STORAGE_HTTP=1`. This permits API-issued uploads to an explicitly allowed loopback host. Cloud deployments require HTTPS and the exact Supabase project host; leave the HTTP flag off there. Neither the GPU worker nor the installed TRELLIS environment needs the Supabase service-role key.

The private media endpoint remains `http://127.0.0.1:8188`. Its image and 3D requests share one execution lock. The application worker must also serialize local chat and media to keep Ollama from competing for the same 16 GB GPU. Other applications using the GPU are outside Powwow's lock; avoid running Startagang's separate TRELLIS service concurrently.

## What runs

Each 3D request starts the existing TRELLIS Python executable in a new Powwow run directory. It loads the cached TRELLIS.2-4B snapshot `af44b45f2e35a493886929c6d786e563ec68364d`, the cached sparse decoder snapshot `25e0d31ffbebe4b5a97464dd851910efc3002d96`, and the bundled DINOv3 encoder. Offline mode prevents implicit weight downloads. Model dependencies retain their own licenses; local availability is not a commercial license grant.

Defaults are a 512-resolution draft, 12 steps, 50,000 target faces, a 1024 texture, and seed 42. The 512 path omits unused 1024 flow models from its temporary configuration, reducing host RAM use. This reduces memory requirements on constrained machines. A 1024 run needs more memory and has not been established by a 512 test.

Use an image of one isolated object, ideally with an alpha channel. The adapter preserves the supplied foreground and does not load the installation's BRIA background-removal model. Opaque backgrounds and adjacent objects may appear in the reconstruction. The text prompt describes the job; this TRELLIS model is conditioned by the selected image.

The result includes two GLBs: the raw generated model and a Blender-validated export. Blender imports the model, checks nonempty bounded geometry and material/image references, and re-exports it. This establishes structural validity, not watertightness, animation readiness, or visual quality. Both outputs use signed private uploads when provided by the API. Original input, conditioned image, logs, generation metadata, and both GLBs are retained under `.data/trellis-runs/<run-id>/` for local diagnostics.

Generation ends with the separate process exiting, which releases its GPU allocation. A failed or timed-out job retains its diagnostic folder; the application does not automatically resubmit it. The existing service on port 7960 is not launched or modified by this adapter.

Read `evals/reports/trellis-local-generation.json` for actual generation evidence when present. A health endpoint reporting available CUDA and installed files is not proof that a full generation completed.

## Historical local validation

On October 1, 2026, the cached Windows runtime reconstructed the existing FLUX mug fixture at the defaults above on the RTX 5080 Laptop GPU. Native generation took **101.36 seconds**; generation plus Blender export took **112.36 seconds**. The raw GLB was 4,168,884 bytes and the validated GLB 3,887,788 bytes. Blender 5.2.1 reported one mesh, 38,976 vertices, 47,081 triangles, one material, two images, and no missing images. These are measurements of one local request, not cloud throughput or visual-quality benchmarks.

The raw artifact is uploaded before Blender runs. If validation, export, or the final upload fails, the worker returns the raw artifact with an explicit error. The API preserves that artifact and marks the run failed. It never labels an unvalidated raw model as a successful Blender export.
