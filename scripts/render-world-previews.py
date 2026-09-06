"""Render catalog thumbnails from the original local GLBs with Blender 4.0."""
from pathlib import Path
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"public/images/worlds"
OUT.mkdir(parents=True,exist_ok=True)


def xyz(p):
    return Vector((p[0],-p[2],p[1]))


def load(path,p=(0,0,0),scale=1):
    before=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    objects=set(bpy.context.scene.objects)-before
    root=bpy.data.objects.new("Placement",None)
    bpy.context.collection.objects.link(root)
    for o in objects:
        if o.parent not in objects:
            o.parent=root
    root.location=xyz(p)
    root.scale=(scale,)*3


def area(p,energy,size,color):
    bpy.ops.object.light_add(type="AREA",location=p)
    o=bpy.context.object
    o.data.energy=energy
    o.data.shape="DISK"
    o.data.size=size
    o.data.color=color
    o.rotation_euler=(Vector((0,0,.2))-o.location).to_track_quat("-Z","Y").to_euler()


for kind in ["shop","payments","portfolio","seeds","potera","assistant"]:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    if kind=="shop":
        load(ROOT/"public/3d/shop/ger.glb",(-.65,.11,-.4))
        load(ROOT/"public/3d/shop/craftsman.glb",(1.13,.12,.14),.93)
        load(ROOT/"public/3d/shop/workbench.glb",(1.13,.12,.14),.93)
        for p in [(-1.95,.12,.8),(.05,.12,1.68),(1.98,.12,-.61)]:
            load(ROOT/"public/3d/shop/sheep.glb",p,.8)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=24,location=(0,0,-.5))
        o=bpy.context.object
        o.scale=(3.05,2.55,.6)
        m=bpy.data.materials.new("Meadow")
        m.diffuse_color=(.22,.34,.1,1)
        o.data.materials.append(m)
        for face in o.data.polygons:
            face.use_smooth=True
    elif kind=="portfolio":
        load(ROOT/"public/3d/island.glb")
        for m in bpy.data.materials:
            if m.use_nodes:
                for n in m.node_tree.nodes:
                    if n.type=="BSDF_PRINCIPLED":
                        n.inputs["Emission Strength"].default_value=0
    else:
        load(ROOT/f"public/3d/worlds/{kind}-v2.glb")
    bpy.context.view_layer.update()
    meshes=[o for o in bpy.context.scene.objects if o.type=="MESH"]
    bounds=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
    low=Vector(tuple(min(p[i] for p in bounds) for i in range(3)))
    high=Vector(tuple(max(p[i] for p in bounds) for i in range(3)))
    center=(low+high)/2
    factor=5.6/max(high.x-low.x,high.y-low.y,high.z-low.z)
    roots=[o for o in bpy.context.scene.objects if o.parent is None]
    container=bpy.data.objects.new("Framing",None)
    bpy.context.collection.objects.link(container)
    for o in roots:
        o.parent=container
    container.scale=(factor,)*3
    container.location=-center*factor
    scene=bpy.context.scene
    scene.render.engine="BLENDER_EEVEE"
    scene.eevee.use_gtao=True
    scene.eevee.gtao_distance=3
    scene.eevee.gtao_factor=1.1
    scene.eevee.taa_render_samples=64
    scene.render.resolution_x=720
    scene.render.resolution_y=520
    scene.render.resolution_percentage=100
    scene.render.film_transparent=True
    scene.render.image_settings.file_format="PNG"
    scene.render.image_settings.color_mode="RGBA"
    scene.world.use_nodes=True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value=(.7,.76,.78,1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value=.55
    area((-4,-5,7),600,5,(1,.9,.76))
    area((5,2,4),450,4,(.73,.86,1))
    area((1,-6,1),90,3,(.85,1,.91))
    bpy.ops.object.camera_add(location=(5.8,-8.7,5.1))
    camera=bpy.context.object
    camera.data.type="ORTHO"
    camera.data.ortho_scale=8.15
    camera.rotation_euler=(-camera.location).to_track_quat("-Z","Y").to_euler()
    scene.camera=camera
    scene.render.filepath=str(OUT/f"{kind}-v2.png")
    bpy.ops.render.render(write_still=True)
    print(f"PREVIEW {kind}")
