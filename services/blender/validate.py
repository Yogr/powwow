"""Run only with Blender: blender --background --factory-startup --python validate.py -- ...

Imports GLB into an empty scene, checks meshes, and exports a new GLB. No user
Python, scripts, addon installation or automatic topology changes are accepted.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--input', required=True)
parser.add_argument('--output', required=True)
parser.add_argument('--report', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
source, output, report = map(lambda value: Path(value).resolve(), [args.input, args.output, args.report])
if source == output or source.suffix.lower() != '.glb' or output.suffix.lower() != '.glb':
    raise ValueError('Distinct input and output GLB paths are required')
if not source.is_file() or source.stat().st_size > 100 * 1024 * 1024:
    raise ValueError('Input must be an existing GLB smaller than 100 MiB')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
if not meshes:
    raise ValueError('GLB contains no mesh objects')
vertices = triangles = 0
bounds = []
for obj in meshes:
    obj.data.calc_loop_triangles()
    vertices += len(obj.data.vertices)
    triangles += len(obj.data.loop_triangles)
    for point in obj.bound_box:
        transformed = obj.matrix_world @ Vector(point)
        if not all(math.isfinite(value) for value in transformed):
            raise ValueError('Mesh bounds contain invalid coordinates')
        bounds.append(list(transformed))
if not vertices or not triangles or triangles > 2_000_000:
    raise ValueError('Expected nonempty mesh within the 2 million triangle inspection limit')
missing_images = [image.name for image in bpy.data.images if image.source == 'FILE' and not image.packed_file and not Path(bpy.path.abspath(image.filepath)).is_file()]
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', export_yup=True)
result = {
    'tool': 'Blender', 'version': bpy.app.version_string, 'simulated': False,
    'validation': 'imported, bounded geometry checked, material references inspected, GLB exported',
    'mesh_objects': len(meshes), 'vertices': vertices, 'triangles': triangles,
    'material_count': len(bpy.data.materials), 'image_count': len(bpy.data.images),
    'missing_images': missing_images,
    'bounds_min': [min(p[i] for p in bounds) for i in range(3)],
    'bounds_max': [max(p[i] for p in bounds) for i in range(3)],
    'watertightness': 'not tested', 'production_topology': 'not evaluated',
    'output_bytes': output.stat().st_size,
}
report.parent.mkdir(parents=True, exist_ok=True)
report.write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps(result))
