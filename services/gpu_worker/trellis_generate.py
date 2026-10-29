"""Pinned TRELLIS.2 pipeline and GLB export, executed only inside its runtime."""
import argparse
import json
import os
import sys
import tempfile
from pathlib import Path
os.environ.setdefault("OPENCV_IO_ENABLE_OPENEXR", "1")
os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")
sys.path.insert(0, os.environ.get("POWWOW_TRELLIS_ROOT", "/opt/TRELLIS.2"))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--weights", required=True)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--steps", type=int, default=12)
    parser.add_argument("--resolution", type=int, choices=[512, 1024, 1536], default=512)
    parser.add_argument("--faces", type=int, default=50)
    parser.add_argument("--texture-size", type=int, default=1024)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()
    from PIL import Image
    from huggingface_hub import snapshot_download
    from trellis2.pipelines import Trellis2ImageTo3DPipeline, rembg
    import o_voxel
    # The upstream config downloads BRIA RMBG-2.0 under separate commercial
    # terms. This worker instead accepts a manually prepared foreground image.
    class PreparedInput:
        def __init__(self):
            pass
        def to(self, *_):
            return self
        def cpu(self):
            return self
        def __call__(self, image):
            return image.convert("RGBA")
    rembg.PowwowPreparedInput = PreparedInput
    encoder = snapshot_download("facebook/dinov3-vitl16-pretrain-lvd1689m",
                                revision="ea8dc2863c51be0a264bab82070e3e8836b02d51")
    decoder = snapshot_download("microsoft/TRELLIS-image-large",
                                revision="25e0d31ffbebe4b5a97464dd851910efc3002d96",
                                allow_patterns=["ckpts/ss_dec_conv3d_16l8_fp16*"])
    config = json.loads((Path(args.weights) / "pipeline.json").read_text())
    config["args"]["rembg_model"] = {"name": "PowwowPreparedInput", "args": {}}
    config["args"]["image_cond_model"]["args"]["model_name"] = encoder
    config["args"]["models"]["sparse_structure_decoder"] = str(Path(decoder) / "ckpts/ss_dec_conv3d_16l8_fp16")
    with tempfile.TemporaryDirectory(prefix="powwow-trellis-config-") as temp:
        root = Path(temp)
        (root / "ckpts").symlink_to(Path(args.weights) / "ckpts", target_is_directory=True)
        (root / "pipeline.json").write_text(json.dumps(config))
        pipeline = Trellis2ImageTo3DPipeline.from_pretrained(str(root))
        pipeline.cuda()
        pipeline_type = "512" if args.resolution == 512 else f"{args.resolution}_cascade"
        meshes, latent = pipeline.run(
            Image.open(args.input), seed=args.seed, pipeline_type=pipeline_type, return_latent=True,
            sparse_structure_sampler_params={"steps": args.steps, "guidance_strength": 7.5, "guidance_rescale": 0.7, "rescale_t": 5.0},
            shape_slat_sampler_params={"steps": args.steps, "guidance_strength": 7.5, "guidance_rescale": 0.5, "rescale_t": 3.0},
            tex_slat_sampler_params={"steps": args.steps, "guidance_strength": 1.0, "guidance_rescale": 0.0, "rescale_t": 3.0})
        mesh = meshes[0]
        effective_resolution = int(latent[2])
        del latent
    mesh.simplify(16777216)
    glb = o_voxel.postprocess.to_glb(
        vertices=mesh.vertices, faces=mesh.faces, attr_volume=mesh.attrs,
        coords=mesh.coords, attr_layout=mesh.layout, voxel_size=mesh.voxel_size,
        aabb=[[-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]], decimation_target=args.faces * 1000,
        texture_size=args.texture_size, remesh=True, remesh_band=1, remesh_project=0, verbose=True)
    glb.export(args.output, extension_webp=False)
    Path(args.report).write_text(json.dumps({"requested_resolution": args.resolution,
        "effective_resolution": effective_resolution, "steps": args.steps,
        "texture_size": args.texture_size, "decimation_target": args.faces * 1000,
        "pipeline_type": pipeline_type}, indent=2))

if __name__ == "__main__":
    main()
