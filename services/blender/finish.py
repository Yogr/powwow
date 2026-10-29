"""Bounded model-directed finishing; no generated Python or scene scripts.

Inspect exports four lit views. Finish edits only named meshes/materials, bakes
new albedo atlases into the existing UV maps, exports, reimports and renders
the actual deliverable. All paths are private worker-created paths.
"""
import argparse
import gzip
import json
import math
import shutil
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector


def meshes():
    return sorted((o for o in bpy.context.scene.objects if o.type == 'MESH'), key=lambda o: o.name)


def bounds():
    points = [o.matrix_world @ Vector(p) for o in meshes() for p in o.bound_box]
    if not points or not all(math.isfinite(v) for p in points for v in p):
        raise ValueError('Model has empty or nonfinite bounds')
    lo = Vector([min(p[i] for p in points) for i in range(3)])
    hi = Vector([max(p[i] for p in points) for i in range(3)])
    if (hi - lo).length <= 0:
        raise ValueError('Model has no extent')
    return lo, hi


def inspect():
    lo, hi = bounds()
    result = []
    for index, obj in enumerate(meshes()):
        obj.data.calc_loop_triangles()
        if not obj.data.vertices or not obj.data.loop_triangles:
            raise ValueError('Empty mesh')
        if not all(math.isfinite(v) for vertex in obj.data.vertices for v in vertex.co):
            raise ValueError('Nonfinite mesh coordinates')
        result.append({'index': index, 'name': obj.name, 'vertices': len(obj.data.vertices),
                       'triangles': len(obj.data.loop_triangles), 'uv_maps': len(obj.data.uv_layers),
                       'materials': [m.name if m else None for m in obj.data.materials]})
    if sum(m['triangles'] for m in result) > 2_000_000:
        raise ValueError('Model exceeds 2 million triangles')
    materials = []
    for mat in sorted(bpy.data.materials, key=lambda m: m.name):
        node = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if mat.use_nodes else None
        materials.append({'name': mat.name, 'principled': node is not None,
                          'textures': [n.image.name for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image] if mat.use_nodes else []})
    return {'tool': 'Blender', 'version': bpy.app.version_string, 'mesh_objects': len(result),
            'meshes': result, 'materials': materials, 'triangles': sum(m['triangles'] for m in result),
            'bounds_min': list(lo), 'bounds_max': list(hi), 'simulated': False}


def render_views(directory):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 12
    scene.cycles.use_denoising = True
    scene.render.resolution_x = scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new('Preview studio')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.18, .20, .24, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .5
    scene.view_settings.view_transform = 'AgX'
    lo, hi = bounds()
    center = (lo + hi) / 2
    extent = max(hi - lo)
    for name, pos, energy, color in [('Key', (3, -4, 5), 650, (1, .91, .83)), ('Fill', (-4, -2, 2), 350, (.78, .87, 1)), ('Rim', (2, 4, 4), 500, (1, 1, 1))]:
        data = bpy.data.lights.new(name, 'AREA')
        data.energy = energy * extent * extent
        data.shape, data.size, data.color = 'DISK', extent * 3, color
        light = bpy.data.objects.new(name, data)
        scene.collection.objects.link(light)
        light.location = center + Vector(pos) * extent
        light.rotation_euler = (center - light.location).to_track_quat('-Z', 'Y').to_euler()
    camera = bpy.data.objects.new('Preview camera', bpy.data.cameras.new('Preview camera'))
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type, camera.data.ortho_scale = 'ORTHO', extent * 1.65
    camera.data.clip_start, camera.data.clip_end = extent * .001, extent * 100
    files = []
    for name, direction in [('front', (0, -3, .35)), ('three-quarter', (2.4, -3, 1.5)), ('back', (0, 3, .35)), ('side', (3, 0, .35))]:
        camera.location = center + Vector(direction) * extent
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        path = directory / (name + '.png')
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        files.append(path.name)
    return files


def finish(plan, directory):
    objects = meshes()
    if len(objects) > 16:
        raise ValueError('Finishing supports at most 16 meshes per asset')
    if sum(len(o.material_slots) for o in objects) > 32:
        raise ValueError('Finishing supports at most 32 material slots')
    rotation = plan.get('rotation_degrees', [0, 0, 0])
    if any(rotation):
        lo, hi = bounds()
        center = (lo + hi) / 2
        transform = Matrix.Translation(center) @ Euler([math.radians(v) for v in rotation], 'XYZ').to_matrix().to_4x4() @ Matrix.Translation(-center)
        for obj in objects:
            obj.matrix_world = transform @ obj.matrix_world
    operations = []
    for edit in plan['meshes']:
        obj = objects[edit['index']]
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        before = len(bm.verts)
        if edit['remove_loose']:
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
        if edit['merge_distance_ratio']:
            lo, hi = bounds()
            # Mesh-local distance; no applied transforms or identity changes.
            local_extent = max(obj.dimensions) / max(abs(s) for s in obj.scale)
            bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=local_extent * edit['merge_distance_ratio'])
        if edit['recalculate_normals']:
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        if edit['smooth_shading']:
            for face in obj.data.polygons:
                face.use_smooth = True
        operations.append({**edit, 'vertices_before': before, 'vertices_after': len(obj.data.vertices)})
    edits = {m['name']: m for m in plan['materials']}
    textures = []
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 1
    scene.render.bake.margin = 8
    for index, obj in enumerate(objects):
        if not obj.data.uv_layers:
            raise ValueError('Mesh has no UV map; refusing to invent destructive remapping')
        if not obj.data.materials or any(m is None or not m.use_nodes for m in obj.data.materials):
            raise ValueError('Mesh requires node-based materials')
        # Copy per object, so atlases from different meshes cannot overwrite one another.
        for slot in obj.material_slots:
            slot.material = slot.material.copy()
        baked_images = []
        restores = []
        for slot_index, slot in enumerate(obj.material_slots):
            mat = slot.material
            # Materials can use overlapping UV domains with separate textures.
            # Keep independent atlases; collapsing them would paint over details.
            image = bpy.data.images.new(f'Albedo {index + 1}-{slot_index + 1}', width=plan['texture_size'], height=plan['texture_size'], alpha=False)
            image.colorspace_settings.name = 'sRGB'
            baked_images.append(image)
            nodes, links = mat.node_tree.nodes, mat.node_tree.links
            bsdf = next((n for n in nodes if n.type == 'BSDF_PRINCIPLED'), None)
            out = next((n for n in nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output), None)
            if bsdf is None or out is None:
                raise ValueError('Finishing requires a Principled material')
            original_name = plan['_material_names'][index][slot_index]
            edit = edits.get(original_name)
            base = bsdf.inputs['Base Color']
            color = nodes.new('ShaderNodeRGB')
            color.outputs[0].default_value = base.default_value
            source = base.links[0].from_socket if base.is_linked else color.outputs[0]
            hsv = nodes.new('ShaderNodeHueSaturation')
            if edit:
                hsv.inputs['Saturation'].default_value = edit['saturation']
                hsv.inputs['Value'].default_value = edit['value']
                bsdf.inputs['Roughness'].default_value = edit['roughness']
                bsdf.inputs['Metallic'].default_value = edit['metallic']
                for field in ('Roughness', 'Metallic'):
                    for link in list(bsdf.inputs[field].links):
                        links.remove(link)
            links.new(source, hsv.inputs['Color'])
            mix = nodes.new('ShaderNodeMixRGB')
            mix.blend_type = 'MULTIPLY'
            mix.inputs[0].default_value = edit['tint_strength'] if edit else 0
            mix.inputs[2].default_value = (*edit['tint'], 1) if edit else (1, 1, 1, 1)
            links.new(hsv.outputs[0], mix.inputs[1])
            emission = nodes.new('ShaderNodeEmission')
            links.new(mix.outputs[0], emission.inputs[0])
            old_surface = out.inputs['Surface'].links[0].from_socket if out.inputs['Surface'].is_linked else bsdf.outputs[0]
            links.new(emission.outputs[0], out.inputs['Surface'])
            target = nodes.new('ShaderNodeTexImage')
            target.image = image
            nodes.active = target
            target.select = True
            restores.append((mat, bsdf, out, old_surface, target, [color, hsv, mix, emission]))
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.bake(type='EMIT', use_clear=True)
        for slot_index, image in enumerate(baked_images):
            texture = directory / f'albedo-{index + 1}-{slot_index + 1}.png'
            image.filepath_raw, image.file_format = str(texture), 'PNG'
            image.save()
            image.pack()
            textures.append(texture.name)
        for mat, bsdf, out, old_surface, target, temporary in restores:
            mat.node_tree.links.new(old_surface, out.inputs['Surface'])
            mat.node_tree.links.new(target.outputs['Color'], bsdf.inputs['Base Color'])
            for node in temporary:
                mat.node_tree.nodes.remove(node)
    # Retain an editable scene before adding preview lights and cameras.
    bpy.ops.wm.save_as_mainfile(filepath=str(directory / 'master-uncompressed.blend'), compress=False)
    # Blender supports gzip-compressed .blend files. Keep the editable master
    # without letting duplicate in-memory mesh structures inflate storage.
    with (directory / 'master-uncompressed.blend').open('rb') as src, gzip.open(directory / 'master.blend', 'wb', compresslevel=3) as dst:
        shutil.copyfileobj(src, dst)
    bpy.ops.export_scene.gltf(filepath=str(directory / 'finished.glb'), export_format='GLB', export_yup=True)
    # Inspect the file the user will receive, including embedded images.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(directory / 'finished.glb'))
    used_images = {node.image for mat in bpy.data.materials if mat.use_nodes for node in mat.node_tree.nodes if node.type == 'TEX_IMAGE' and node.image}
    # Blender can keep Render Result images without pixels and lazily decodes
    # imported packed PNGs. Validate the material images, not that global list.
    if not used_images or any(not image.packed_file or not len(image.pixels) for image in used_images):
        raise ValueError('Exported model is missing its embedded textures')
    return operations, textures


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--directory', required=True)
    parser.add_argument('--plan')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    directory = Path(args.directory).resolve()
    directory.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(Path(args.input).resolve()))
    before = inspect()
    operations, textures = [], []
    if args.plan:
        plan = json.loads(Path(args.plan).read_text(encoding='utf-8'))
        plan['_material_names'] = [[m.name for m in obj.data.materials] for obj in meshes()]
        operations, textures = finish(plan, directory)
    result = inspect()
    result.update(operations=operations, rotation_degrees=plan.get('rotation_degrees', [0, 0, 0]) if args.plan else None, textures=textures, before=before, views=render_views(directory),
                  texture_method='material-guided albedo bake into preserved UVs' if args.plan else None,
                  exported_file_reimported=bool(args.plan))
    (directory / 'report.json').write_text(json.dumps(result, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
