"""Original procedural fixture for viewer/tool validation. Not model inference."""
from pathlib import Path
import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12)
obj = bpy.context.object
obj.name = 'Procedural viewer fixture (not AI-generated)'
obj.scale = (1, 1, 1.3)
material = bpy.data.materials.new('Terracotta fixture')
material.diffuse_color = (.65, .28, .16, 1)
obj.data.materials.append(material)
for polygon in obj.data.polygons:
    polygon.use_smooth = True
output = Path('evals/fixtures/procedural-viewer-fixture.glb').resolve()
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB')
