"""Build original, animation-ready shop miniatures with Blender 4.0+.

Run: blender --background --factory-startup --python scripts/build-shop-assets.py
Coordinates below use the web scene's Y-up convention. Exported GLBs preserve it.
"""

import math
import random
from pathlib import Path

import bpy
from mathutils import Vector

OUTPUT = Path(__file__).resolve().parents[1] / "public" / "3d" / "shop"
OUTPUT.mkdir(parents=True, exist_ok=True)
random.seed(25)


def xyz(p):
    return Vector((p[0], -p[2], p[1]))


def material(name, color, roughness=0.7, metallic=0, sheen=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Sheen Weight"].default_value = sheen
    return mat


def setup():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def finish(obj, name, mat, parent=None):
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    for polygon in getattr(obj.data, "polygons", []):
        polygon.use_smooth = True
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def pivot(name, p=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = xyz(p)
    bpy.context.view_layer.update()
    return obj


def ellipsoid(name, p, scale, mat, parent=None, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=xyz(p))
    obj = bpy.context.object
    obj.scale = (scale[0], scale[2], scale[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, parent)


def box(name, p, size, mat, bevel=0.025, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
    obj = bpy.context.object
    obj.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Soft crafted edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.data.use_auto_smooth = True
        normals = obj.modifiers.new("Weighted surface normals", "WEIGHTED_NORMAL")
        bpy.ops.object.modifier_apply(modifier=normals.name)
    return finish(obj, name, mat, parent)


def tube(name, points, radius, mat, parent=None, resolution=3):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, p in zip(spline.bezier_points, points):
        point.co = xyz(p)
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    return finish(obj, name, mat, parent)


def ring(name, p, radius, thickness, mat, parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=thickness, major_segments=64, minor_segments=8, location=xyz(p))
    return finish(bpy.context.object, name, mat, parent)


def lathe(name, profile, mat, parent=None, segments=96, start=0, end=math.tau, folds=0):
    vertices, faces = [], []
    for level, (radius, height) in enumerate(profile):
        for i in range(segments + 1):
            a = start + (end - start) * i / segments
            wrinkle = folds * math.sin(a * 32) * math.sin(level / (len(profile) - 1) * math.pi)
            vertices.append(xyz(((radius + wrinkle) * math.sin(a), height, (radius + wrinkle) * math.cos(a))))
    for j in range(len(profile) - 1):
        for i in range(segments):
            k = j * (segments + 1) + i
            faces.append((k, k + 1, k + segments + 2, k + segments + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, mat, parent)


def export(name):
    # Merge static meshes by material and animation parent to keep draw calls bounded.
    groups = {}
    for obj in list(bpy.context.scene.objects):
        if obj.type == "MESH":
            mat = obj.data.materials[0].name if obj.data.materials else "none"
            groups.setdefault((obj.parent, mat), []).append(obj)
    for (parent, mat), objects in groups.items():
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects) > 1:
            bpy.ops.object.join()
        bpy.context.object.name = f"{parent.name if parent else name}_{mat}"
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / f"{name}.glb"), export_format="GLB", export_yup=True, export_animations=False, export_cameras=False, export_lights=False)
    print(f"ASSET {name}: {sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')} faces")


FELT = material("Ger_felt", (0.72, 0.66, 0.49), 0.95, sheen=0.32)
WOOD = material("Ger_wood", (0.23, 0.075, 0.031), 0.6)
RED = material("Ger_trim", (0.31, 0.07, 0.029), 0.72)
ROPE = material("Ger_rope", (0.30, 0.22, 0.13), 0.93)
GOLD = material("Brass", (0.47, 0.28, 0.075), 0.3, 0.72)
STITCH = material("Flax_thread", (0.75, 0.62, 0.38), 0.86)
LATTICE = material("Ger_structure", (0.36, 0.17, 0.065), 0.8)

setup()
lathe("Felt wall", [(1.115, .10), (1.14, .15), (1.15, .38), (1.14, .68), (1.12, .92)], FELT, start=.255, end=math.tau-.255, folds=.012)
lathe("Soft felt roof", [(1.245, .91), (1.25, .96), (1.15, 1.015), (1.02, 1.075), (.87, 1.15), (.71, 1.25), (.53, 1.365), (.34, 1.48), (.255, 1.505)], FELT, folds=.009)
lathe("Roof embroidered valance", [(1.145, .86), (1.15, .94)], RED)
lathe("Bottom woven band", [(1.145, .13), (1.16, .2)], RED)
lathe("Timber floor", [(0, .02), (1.21, .02), (1.23, .07), (1.2, .11), (0, .11)], WOOD)
for y, r in [(.27, 1.155), (.73, 1.142)]:
    ring("Wool tension rope", (0, y, 0), r, .018, ROPE)
for i in range(32):
    a = math.tau * i / 32
    sin, cos = math.sin(a), math.cos(a)
    tube("Felt radial seam", [(sin * r, y + .003, cos * r) for r, y in [(1.24, .966), (1.02, 1.085), (.7, 1.265), (.26, 1.513)]], .0038, STITCH)
    tube("Roof timber", [(sin * .25, 1.48, cos * .25), (sin * .72, 1.21, cos * .72), (sin * 1.1, .88, cos * 1.1)], .012, LATTICE)
    if .32 < a < math.tau-.32:
        for direction in [-1, 1]:
            tube("Lattice lath", [(math.sin(a) * 1.105, .16, math.cos(a) * 1.105), (math.sin(a + direction * .34) * 1.105, .89, math.cos(a + direction * .34) * 1.105)], .009, LATTICE)
    if i % 2 == 0:
        points = [(math.sin(a + d) * 1.157, h, math.cos(a + d) * 1.157) for d, h in [(-.024, .902), (0, .875), (.024, .902), (0, .929), (-.024, .902)]]
        tube("Valance embroidery", points, .004, STITCH)
ring("Crown outer rim", (0, 1.525, 0), .26, .039, RED)
ring("Crown inner rim", (0, 1.533, 0), .22, .014, GOLD)
for a in [0, math.pi/2]:
    tube("Crown spoke", [(-math.cos(a)*.22, 1.52, -math.sin(a)*.22), (math.cos(a)*.22, 1.52, math.sin(a)*.22)], .012, WOOD)
for x in [-.27, .27]:
    box("Carved jamb", (x, .47, 1.115), (.066, .87, .095), WOOD, .014)
box("Lintel", (0, .897, 1.112), (.63, .085, .105), RED, .018)
box("Door", (0, .46, 1.115), (.49, .77, .065), RED, .018)
for y in [.29, .64]:
    box("Inset door panel", (0, y, 1.155), (.36, .26, .014), WOOD, .012)
    tube("Door motif", [(-.13, y, 1.17), (0, y+.095, 1.17), (.13, y, 1.17), (0, y-.095, 1.17), (-.13, y, 1.17)], .009, GOLD)
for y in [.27, .67]:
    box("Door hinge", (-.218, y, 1.16), (.08, .028, .016), GOLD, .006)
ellipsoid("Door handle", (.17, .46, 1.18), (.025, .028, .025), GOLD)
box("Front step", (0, .06, 1.36), (.65, .12, .32), WOOD, .035)
for side in [-1, 1]:
    tube("Guy rope", [(side*1.0, .81, .43), (side*1.25, .45, .55), (side*1.41, .05, .64)], .012, ROPE)
    tube("Ground stake", [(side*1.41, 0, .64), (side*1.39, .19, .64)], .025, WOOD)
export("ger")

setup()
SKIN = material("Skin_warm", (.46, .255, .12), .53)
CHEEK = material("Skin_cheek", (.48, .205, .115), .6)
DEEL = material("Deel_teal", (.025, .13, .145), .83, sheen=.28)
DEEL_EDGE = material("Deel_edge", (.06, .21, .205), .72)
LEATHER = material("Leather", (.23, .105, .041), .63)
HIDE = material("Leather_work", (.40, .205, .085), .68)
BOOT = material("Boot_leather", (.047, .028, .017), .42)
HAIR = material("Hair_silver", (.52, .48, .37), .87)
WHITE = material("Eyes_ivory", (.86, .83, .68), .27)
IRIS = material("Eyes_umber", (.055, .031, .014), .28)
PUPIL = material("Eyes_pupil", (.004, .008, .008), .17)
TIMBER = material("Bench_walnut", (.20, .095, .034), .67)
HAT = material("Hat_felt", (.26, .19, .095), .88, sheen=.3)
root = pivot("craftsman")
head = pivot("craftsman_head", (0, 1.11, 0))
arm = pivot("stitch_arm", (.235, .87, .04))
head.parent = root
arm.parent = root

box("Stool cushion", (0, .35, -.08), (.46, .105, .39), LEATHER, .055, root)
for x in [-.17, .17]:
    for z in [-.24, .065]:
        tube("Stool leg", [(x*1.2, .02, z), (x, .31, z)], .035, TIMBER, root)
ellipsoid("Deel seated skirt", (0, .46, .12), (.28, .19, .30), DEEL, root)
ellipsoid("Deel torso", (0, .77, -.01), (.24, .32, .19), DEEL, root)
ellipsoid("Shoulder left", (-.20, .90, .01), (.115, .115, .12), DEEL, root)
ellipsoid("Shoulder right", (.20, .90, .01), (.115, .115, .12), DEEL, arm)
box("Leather apron", (0, .65, .185), (.29, .38, .055), LEATHER, .045, root)
tube("Collar piping", [(-.16, .985, .10), (-.06, .91, .184), (.09, .87, .175), (.18, .76, .15)], .012, DEEL_EDGE, root)
for i in range(3):
    ellipsoid("Deel closure", (.14, .88-i*.07, .18), (.015, .012, .012), GOLD, root, 12, 8)
for side in [-1, 1]:
    tube("Apron shoulder strap", [(side*.09, .85, .2), (side*.16, .96, .14), (side*.18, .89, -.10)], .013, LEATHER, root)
    ellipsoid("Trouser knee", (side*.16, .39, .31), (.103, .15, .13), DEEL, root)
    tube("Trouser shin", [(side*.16, .36, .32), (side*.17, .14, .36)], .077, DEEL, root)
    ellipsoid("Curved leather boot", (side*.17, .085, .43), (.09, .078, .18), BOOT, root)
    ellipsoid("Upturned toe", (side*.17, .12, .565), (.073, .054, .06), BOOT, root)
    tube("Boot cuff", [(side*.17-.075, .21, .35), (side*.17, .225, .415), (side*.17+.075, .21, .35)], .012, LEATHER, root)
    for i in range(3):
        tube("Tunic fabric fold", [(side*(.07+i*.038), .60, .235), (side*(.10+i*.038), .5, .32), (side*(.12+i*.032), .40, .355)], .006, DEEL_EDGE, root)

ellipsoid("Neck", (0, 1.04, .005), (.09, .11, .09), SKIN, root)
ellipsoid("Head sculpt", (0, 1.20, .018), (.187, .223, .175), SKIN, head, 40, 28)
ellipsoid("Lower face", (0, 1.115, .09), (.145, .13, .118), SKIN, head)
for side in [-1, 1]:
    ellipsoid("Ear", (side*.186, 1.2, .008), (.045, .074, .036), SKIN, head)
    ellipsoid("Ear inner", (side*.195, 1.2, .034), (.020, .044, .008), CHEEK, head)
    ellipsoid("Cheek", (side*.102, 1.15, .16), (.069, .065, .032), CHEEK, head)
    ellipsoid("Eyeball", (side*.079, 1.238, .171), (.053, .043, .023), WHITE, head)
    ellipsoid("Iris", (side*.077, 1.23, .193), (.026, .028, .01), IRIS, head)
    ellipsoid("Pupil", (side*.076, 1.23, .203), (.014, .02, .006), PUPIL, head)
    ellipsoid("Eye catchlight", (side*.076-.006, 1.24, .209), (.006, .006, .003), WHITE, head, 12, 8)
    tube("Soft lower eyelid", [(side*.032, 1.227, .177), (side*.075, 1.204, .184), (side*.126, 1.225, .155)], .008, SKIN, head)
    tube("Silver eyebrow", [(side*.028, 1.287, .161), (side*.076, 1.303, .173), (side*.127, 1.281, .144)], .016, HAIR, head)
    tube("Smile crease", [(side*.077, 1.15, .187), (side*.097, 1.108, .18), (side*.081, 1.08, .167)], .005, CHEEK, head)
ellipsoid("Nose bridge", (0, 1.219, .178), (.039, .077, .04), SKIN, head)
ellipsoid("Nose tip", (0, 1.173, .211), (.048, .037, .042), SKIN, head)
ellipsoid("Beard mass", (0, 1.047, .16), (.109, .104, .059), HAIR, head)
for i in range(14):
    a = math.tau*i/14
    ellipsoid("Beard strand", (math.sin(a)*.075, 1.053+math.cos(a)*.052, .17), (.026, .073, .031), HAIR, head, 12, 8)
for side in [-1, 1]:
    tube("Swept moustache", [(0, 1.12, .22), (side*.044, 1.12, .218), (side*.078, 1.105, .2)], .023, HAIR, head)
for y, width in [(1.327, .092), (1.35, .078)]:
    tube("Forehead crease", [(-width, y, .141), (0, y+.006, .159), (width, y, .141)], .003, CHEEK, head)
ellipsoid("Hat brim", (0, 1.393, .0), (.232, .048, .209), HAT, head)
ellipsoid("Hat crown", (0, 1.456, -.007), (.169, .132, .16), HAT, head)
tube("Hat braid", [(-.16, 1.407, .065), (0, 1.414, .168), (.16, 1.407, .065)], .015, RED, head)
ellipsoid("Hat finial", (0, 1.595, -.007), (.019, .028, .019), GOLD, head)

for name, shoulder, elbow, handpos, parent in [
    ("Rest", (-.21, .88, .015), (-.30, .69, .21), (-.10, .652, .55), root),
    ("Stitch", (.22, .88, .025), (.32, .72, .20), (.07, .73, .57), arm),
]:
    tube(name+" sleeve", [shoulder, elbow], .077, DEEL, parent)
    tube(name+" forearm", [elbow, tuple((elbow[i]+handpos[i])*.5 for i in range(3)), handpos], .040, SKIN, parent)
    ellipsoid(name+" hand", handpos, (.062, .038, .056), SKIN, parent)
    for i in range(4):
        x = handpos[0] + (i-1.5)*.022
        tube(name+" finger", [(x, handpos[1], handpos[2]+.02), (x, handpos[1]-.025, handpos[2]+.06)], .010, SKIN, parent)
tube("Awl handle", [(.07, .73, .60), (.07, .68, .61)], .014, TIMBER, arm)
tube("Awl tip", [(.07, .68, .61), (.07, .635, .615)], .0035, GOLD, arm)
export("craftsman")

setup()
box("Workbench top", (0, .59, .67), (.93, .10, .57), TIMBER, .033)
for x in [-.36, .36]:
    for z in [.47, .88]:
        box("Bench leg", (x, .29, z), (.065, .58, .065), TIMBER, .01)
box("Shelf", (0, .20, .67), (.8, .035, .41), TIMBER, .012)
box("Drawer", (0, .48, .93), (.55, .13, .035), WOOD, .012)
ellipsoid("Drawer knob", (0, .48, .965), (.023, .023, .019), GOLD)
box("Work hide", (-.07, .654, .64), (.45, .023, .33), HIDE, .014)
for side in [-1, 1]:
    for i in range(12):
        tube("Leather stitching", [(-.264+i*.035, .668, .64+side*.133), (-.25+i*.035, .668, .64+side*.145)], .0025, STITCH)
box("Folded wallet", (-.21, .232, .62), (.21, .04, .14), LEATHER, .017)
box("Apron offcut", (.13, .232, .76), (.3, .022, .22), HIDE, .012)
for r, y in [(.042, .657), (.026, .69), (.042, .723)]:
    ellipsoid("Thread spool", (.32, y, .8), (r, .018, r), STITCH)
tube("Tool handle", [(.29, .655, .49), (.39, .655, .56)], .015, WOOD)
tube("Tool blade", [(.39, .655, .56), (.43, .655, .59)], .01, GOLD)
for i in range(3):
    tube("Wood grain", [(-.40, .646, .45+i*.18), (-.15, .646, .47+i*.18), (.11, .646, .46+i*.18), (.39, .646, .45+i*.18)], .002, WOOD)
export("workbench")

setup()
WOOL = material("Wool_cream", (.72, .67, .53), .95, sheen=.55)
WOOL_LIGHT = material("Wool_highlight", (.80, .76, .64), .93, sheen=.55)
FACE = material("Sheep_face", (.14, .10, .068), .78)
EAR = material("Sheep_ear", (.36, .21, .13), .79)
HOOF = material("Sheep_hoof", (.045, .035, .025), .42)
root = pivot("sheep")
head = pivot("sheep_head", (0, .43, .35))
head.parent = root
ellipsoid("Wool body", (0, .46, 0), (.315, .30, .46), WOOL, root, 32, 20)
for i in range(116):
    theta = i * 2.399963
    v = 1 - 2*(i+.5)/116
    radius = math.sqrt(1-v*v)
    p = (math.cos(theta)*radius*.286, .46+v*.264, math.sin(theta)*radius*.424)
    size = .061 + random.random()*.028
    ellipsoid("Wool curl", p, (size, size*.91, size), WOOL_LIGHT if i%5 == 0 else WOOL, root, 12, 8)
for x in [-.17, .17]:
    for z in [-.27, .27]:
        tube("Leg", [(x, .32, z), (x*.98, .08, z+.02)], .043, FACE, root)
        box("Hoof", (x*.98, .055, z+.035), (.093, .08, .105), HOOF, .025, root)
        tube("Hoof split", [(x*.98, .03, z+.09), (x*.98, .075, z+.09)], .003, FACE, root)
ellipsoid("Tail", (0, .45, -.47), (.10, .11, .13), WOOL, root)
ellipsoid("Head", (0, .47, .44), (.163, .193, .175), FACE, head, 32, 20)
ellipsoid("Muzzle", (0, .378, .566), (.127, .098, .10), FACE, head)
for side in [-1, 1]:
    ellipsoid("Floppy ear", (side*.20, .56, .40), (.13, .042, .07), WOOL, head)
    ellipsoid("Ear velvet", (side*.225, .566, .425), (.083, .014, .034), EAR, head)
    ellipsoid("Eye", (side*.105, .516, .567), (.045, .049, .024), WHITE, head)
    ellipsoid("Iris", (side*.104, .509, .587), (.021, .029, .012), IRIS, head)
    ellipsoid("Pupil", (side*.103, .51, .597), (.012, .021, .006), PUPIL, head)
    ellipsoid("Catchlight", (side*.103-.005, .52, .603), (.005, .006, .003), WHITE, head, 12, 8)
    ellipsoid("Nostril", (side*.041, .392, .653), (.016, .010, .007), HOOF, head, 12, 8)
for i in range(7):
    ellipsoid("Forelock", ((i-3)*.036, .645+math.sin(i)*.02, .457), (.052, .055, .055), WOOL_LIGHT, head, 16, 10)
tube("Smile", [(-.045, .345, .62), (0, .334, .638), (.045, .345, .62)], .0035, HOOF, head)
export("sheep")

print("Shop asset build complete.")
