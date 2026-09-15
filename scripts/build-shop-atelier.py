"""Build Chingis' contemporary material atelier as an original, Y-up GLB.

The composition draws on chingis-studio's brand book: contemporary makers,
natural materials and quiet product presentation. This is a concept gallery,
not a representation of confirmed inventory or a real artisan's workshop.
Run with Blender 4.0: blender -b --factory-startup --python build-shop-atelier.py
"""

from pathlib import Path
import math
import json
import sys
import bpy
import bmesh
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / "assets/world-versions.json").read_text())["shop"]
OUTPUT = ROOT / f"public/3d/shop/atelier-v{VERSION}.glb"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def xyz(p):
    return Vector((p[0], -p[2], p[1]))


def material(name, color, roughness=.7, metallic=0, sheen=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Sheen Weight"].default_value = sheen
    return mat


STONE = material("Atelier_limestone", (.64, .60, .50), .88)
FLOOR = material("Atelier_floor", (.40, .395, .345), .86)
BASE = material("Atelier_basalt", (.105, .125, .123), .92)
STRATA = material("Atelier_strata", (.175, .185, .16), .9)
TIMBER = material("Atelier_timber", (.065, .033, .019), .61)
METAL = material("Atelier_metal", (.29, .135, .058), .33, .7)
LEATHER = material("Atelier_leather", (.32, .105, .033), .55, sheen=.08)
EDGE = material("Atelier_leather_edge", (.16, .044, .015), .62)
THREAD = material("Atelier_stitch", (.53, .30, .125), .79)
FELT = material("Atelier_felt", (.68, .63, .52), .96, sheen=.32)
CAMEL = material("Atelier_cashmere", (.385, .27, .157), .96, sheen=.3)
BLUE = material("Atelier_moonstone", (.11, .22, .245), .92, sheen=.2)
PAPER = material("Atelier_kraft", (.52, .40, .25), .9)
STEEL = material("Atelier_tool", (.22, .235, .23), .36, .65)


def pivot(name, p):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = xyz(p)
    bpy.context.view_layer.update()
    return obj


def finish(obj, name, mat, parent=None, smooth=False):
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = smooth
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj


def mesh(name, vertices, faces, mat, parent=None, smooth=False):
    data = bpy.data.meshes.new(name)
    data.from_pydata([xyz(v) for v in vertices], [], faces)
    data.update()
    normals = bmesh.new()
    normals.from_mesh(data)
    bmesh.ops.recalc_face_normals(normals, faces=list(normals.faces))
    normals.to_mesh(data)
    normals.free()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, mat, parent, smooth)


def box(name, p, size, mat, bevel=.025, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
    obj = bpy.context.object
    obj.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Crafted eased edge", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.data.use_auto_smooth = True
        modifier = obj.modifiers.new("Face normals", "WEIGHTED_NORMAL")
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return finish(obj, name, mat, parent)


def sphere(name, p, size, mat, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, location=xyz(p))
    obj = bpy.context.object
    obj.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, parent, True)


def tube(name, points, radius, mat, parent=None):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 5
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
    return finish(obj, name, mat, parent, True)


def ring_mesh(name, profile, mat, segments=64, exponent=2.5):
    vertices, faces = [], []
    for rx, rz, y in profile:
        for i in range(segments):
            a = i * math.tau / segments
            c, s = math.cos(a), math.sin(a)
            vertices.append((rx * math.copysign(abs(c) ** (2 / exponent), c), y,
                             rz * math.copysign(abs(s) ** (2 / exponent), s)))
    for j in range(len(profile) - 1):
        for i in range(segments):
            a = j * segments + i
            b = j * segments + (i + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces += [tuple(reversed(range(segments))),
              tuple((len(profile) - 1) * segments + i for i in range(segments))]
    return mesh(name, vertices, faces, mat)


def arc_band(name, inner, outer, low, high, mat, start=-.99, end=.72):
    vertices, faces = [], []
    steps = 44
    for i in range(steps + 1):
        a = start + (end - start) * i / steps
        for r, y in [(inner, low), (outer, low), (outer, high), (inner, high)]:
            vertices.append((math.sin(a) * r, y, .67 - math.cos(a) * r))
        if i < steps:
            j = i * 4
            for k in range(4):
                faces.append((j+k, j+(k+1)%4, j+(k+1)%4+4, j+k+4))
    faces += [(3, 2, 1, 0), (steps*4, steps*4+1, steps*4+2, steps*4+3)]
    return mesh(name, vertices, faces, mat)


# A restrained floating stone foundation with purposeful, broad strata.
ring_mesh("Dark floating foundation", [(2.95, 2.06, .06), (2.91, 2.01, -.13),
          (2.64, 1.79, -.35), (2.15, 1.37, -.64), (1.35, .86, -.89),
          (.58, .4, -1.04)], BASE, 32, 2.45)
ring_mesh("Foundation warm reveal", [(2.96, 2.065, .07), (2.96, 2.065, .14)], STRATA, 64)
ring_mesh("Honed exhibition floor", [(2.94, 2.045, .14), (2.9, 2.0, .21)], FLOOR, 64)
ring_mesh("Inset limestone terrace", [(2.75, 1.88, .213), (2.75, 1.88, .244)], STONE, 64)

# One curved mineral backdrop, with a slender timber canopy and copper reveal.
arc_band("Curved mineral gallery wall", 2.40, 2.54, .245, 2.51, STONE)
arc_band("Wall skirting", 2.378, 2.545, .245, .335, TIMBER)
arc_band("Timber canopy", 2.02, 2.63, 2.52, 2.62, TIMBER, -1.015, .745)
arc_band("Copper fascia", 2.015, 2.038, 2.526, 2.585, METAL, -1.015, .745)
for a in [-.99, .72]:
    x, z = math.sin(a)*2.37, .67-math.cos(a)*2.37
    box("Wall end timber", (x, 1.40, z), (.055, 2.31, .075), TIMBER, .01)
    sphere("Flush brass wall fixing", (x, 2.34, z+.045), (.019, .019, .01), METAL)

# A small five-bound-arrows relief taken from the shop's actual icon.svg.
def sign_z(x):
    return .67-math.sqrt(2.367**2-x*x)


for index in range(5):
    x = -.78 + (index-2)*.052
    tip = 2.18 - abs(index-2)*.041
    box("Bound arrows relief", (x, (1.88+tip)/2, sign_z(x)), (.022, tip-1.88, .015), METAL, .003)
    mesh("Arrow head", [(x-.020,tip-.025,sign_z(x-.02)+.009),(x+.020,tip-.025,sign_z(x+.02)+.009),(x,tip+.009,sign_z(x)+.009)], [(0,1,2)], METAL)
tube("Arrow binding",[(x,1.946,sign_z(x)+.015) for x in [-.907,-.85,-.78,-.71,-.653]],.013,TIMBER)
bpy.ops.object.text_add()
word = bpy.context.object
word.name = "Discreet CHINGIS maker wordmark"
word.data.body = "CHINGIS"
word.data.align_x = "CENTER"
word.data.size = .205
word.data.space_character = 1.14
word.data.extrude = .008
word.data.bevel_depth = .0012
word.data.materials.append(METAL)
bpy.context.view_layer.objects.active = word
bpy.ops.object.convert(target="MESH")
# Bend the actual kerned lettering to the wall instead of spacing glyphs by eye.
for vertex in word.data.vertices:
    x=.20+vertex.co.x
    vertex.co=xyz((x,1.952+vertex.co.y,sign_z(x)+vertex.co.z))

# Main product, seated on a chamfered mineral display plinth.
box("Hero plinth shadow foot", (.61,.28,.71), (1.35,.072,.97), TIMBER, .055)
box("Hero mineral plinth", (.61,.607,.71), (1.29,.61,.91), STONE, .065)
box("Leather display pad", (.61,.92,.71), (1.10,.018,.70), CAMEL, .055)
bag = pivot("atelier_bag", (.61, 1.286, .71))
bx, by, bz = .61, 1.286, .71


def bagp(x,y,z):
    return (bx+x,by+y,bz+z)


vertices, faces = [], []
profile = [(.36,.135,-.35),(.445,.18,-.32),(.50,.218,-.22),(.515,.225,.03),
           (.49,.204,.24),(.425,.152,.345)]
segments = 64
for rx, rz, y in profile:
    for i in range(segments):
        a = i*math.tau/segments
        c, s = math.cos(a), math.sin(a)
        x = rx*math.copysign(abs(c)**.63,c)
        z = rz*math.copysign(abs(s)**.63,s)
        vertices.append(bagp(x,y,z))
for j in range(len(profile)-1):
    for i in range(segments):
        a=j*segments+i;b=j*segments+(i+1)%segments
        faces.append((a,b,b+segments,a+segments))
faces += [tuple(reversed(range(segments))), tuple((len(profile)-1)*segments+i for i in range(segments))]
mesh("Sculpted full-grain leather bag",vertices,faces,LEATHER,bag,True)

# Sewn front panel follows the rounded body; side gussets stay tonal.
def bag_front(x,y,lift=.006):
    for lower,upper in zip(profile,profile[1:]):
        if lower[2]<=y<=upper[2]:
            t=(y-lower[2])/(upper[2]-lower[2])
            rx=lower[0]+(upper[0]-lower[0])*t
            rz=lower[1]+(upper[1]-lower[1])*t
            z=rz*max(0,1-(abs(x)/rx)**(2/.63))**(.63/2)
            return bagp(x,y,z+lift)
    raise ValueError(f"Bag seam height {y} outside the leather profile")


outline=[(-.395,.26,.201),(-.467,.08,.224),(-.438,-.225,.207),
         (-.345,-.305,.172),(0,-.314,.19),(.345,-.305,.172),
         (.438,-.225,.207),(.467,.08,.224),(.395,.26,.201)]
tube("Leather panel piping",[bag_front(p[0],p[1],.004) for p in outline],.007,EDGE,bag)
for side in [-1,1]:
    tube("Soft gusset fold",[bagp(side*.445,.27,-.02),bagp(side*.505,.04,-.015),bagp(side*.452,-.25,-.01)],.006,EDGE,bag)
    # Top-handle tabs are stitched to the bag, not suspended above it.
    for z in [-.132,.156]:
        box("Handle leather tab",bagp(side*.273,.25,z),(.075,.20,.027),EDGE,.018,bag)
        sphere("Handle rivet",bagp(side*.273,.228,z+(.018 if z>0 else -.018)),(.013,.013,.006),METAL,bag)
for z in [-.132,.156]:
    points=[bagp(-.273,.333,z),bagp(-.286,.59,z),bagp(-.18,.77,z),
            bagp(0,.824,z),bagp(.18,.77,z),bagp(.286,.59,z),bagp(.273,.333,z)]
    tube("Rolled leather top handle",points,.025,LEATHER,bag)
    tube("Handle edge stitching",[(x,y,zp+.023) for x,y,zp in points],.0022,THREAD,bag)
tube("Top zipper seam",[bagp(-.36,.347,0),bagp(0,.357,0),bagp(.36,.347,0)],.008,EDGE,bag)
box("Zipper pull",bagp(.325,.372,.024),(.070,.012,.030),METAL,.006,bag)
# Closely spaced saddle stitches are geometry, never a painted logo decal.
for i in range(25):
    x=-.35+i*.0292
    tube("Saddle stitch",[bag_front(x,-.278),bag_front(x+.014,-.278)],.0019,THREAD,bag)
for side in [-1,1]:
    for i in range(11):
        y=-.22+i*.041
        x=side*(.431+.013*math.sin((y+.22)*6))
        tube("Side saddle stitch",[bag_front(x,y),bag_front(x,y+.018)],.0019,THREAD,bag)
box("Bag maker stamp",bagp(0,.135,.233),(.13,.039,.004),EDGE,.004,bag)
for i in range(5):
    h=.024-abs(i-2)*.003
    box("Tiny bound-arrow brand stamp",bagp((i-2)*.016,.135+h*.2,.237),(.005,h,.003),THREAD,.001,bag)

# Textile display at the left, given its own generous, clear floor area.
for x in [-1.92,-.77]:
    box("Textile rail foot",(x,.267,.00),(.28,.046,.40),TIMBER,.025)
    tube("Slender textile upright",[(x,.29,.00),(x,1.77,.00)],.021,METAL)
tube("Textile top rail",[(-1.94,1.77,.00),(-.75,1.77,.00)],.024,METAL)
textile = pivot("atelier_textile", (-1.345,1.80,0))
verts, faces = [], []
nx, ny = 18, 25
for j in range(ny+1):
    t=j/ny
    if t<.08:
        a=t/.08*math.pi
        y=1.768+math.sin(a)*.036
        basez=-math.cos(a)*.046
    else:
        hang=(t-.08)/.92
        y=1.768-hang*.89
        basez=.046+.03*hang*hang
    for i in range(nx+1):
        u=i/nx
        x=-1.345+(u-.5)*.74
        z=basez+math.sin(u*math.pi*6)*.014*max(0,(t-.08)/.92)
        verts.append((x,y,z))
        if j<ny and i<nx:
            a=j*(nx+1)+i
            faces.append((a,a+1,a+nx+2,a+nx+1))
cloth=mesh("Draped natural cashmere",verts,faces,FELT,textile,True)
modifier=cloth.modifiers.new("Woven cloth thickness","SOLIDIFY");modifier.thickness=.007
bpy.context.view_layer.objects.active=cloth;bpy.ops.object.modifier_apply(modifier=modifier.name)
for i in range(20):
    x=-1.695+i*.0369
    z=.076+math.sin(i/19*math.pi*6)*.014
    tube("Fine cashmere fringe",[(x,.881,z),(x+.004,.845,z+.002)],.0022,FELT,textile)
tube("Quiet textile hem",[(-1.708,.918,.076),(-1.53,.916,.08),(-1.345,.918,.073),(-1.16,.916,.08),(-.982,.918,.076)],.005,CAMEL,textile)
box("Folded textile low display",(-1.35,.415,.84),(1.12,.34,.74),TIMBER,.035)
for y, width, color in [(.641,.89,CAMEL),(.728,.82,FELT),(.809,.77,BLUE)]:
    box("Folded textile layer",(-1.35,y,.84),(width,.080,.53),color,.036)
    tube("Folded textile front seam",[(-1.35-width*.41,y-.020,1.108),(-1.35,y-.022,1.113),(-1.35+width*.41,y-.020,1.108)],.0025,FELT)

# A compact, orderly making station gives the label a human craft context.
cx,cz=1.99,-.64
for dx in [-.33,.33]:
    for dz in [-.25,.25]:
        box("Bench mortised leg",(cx+dx,.505,cz+dz),(.063,.52,.063),TIMBER,.008)
box("Craft bench lower shelf",(cx,.38,cz),(.75,.037,.53),TIMBER,.012)
box("Craft bench top",(cx,.804,cz),(.91,.10,.73),TIMBER,.022)
box("Cutting mat",(cx-.13,.861,cz+.025),(.46,.013,.45),CAMEL,.008)
box("Leather wallet in process",(cx-.15,.882,cz+.035),(.27,.028,.23),LEATHER,.018)
box("Folded maker card",(cx+.21,.866,cz+.18),(.13,.009,.17),PAPER,.004)
tube("Bench awl handle",[(cx+.24,.88,cz-.03),(cx+.32,.88,cz-.13)],.018,TIMBER)
tube("Bench awl steel tip",[(cx+.32,.88,cz-.13),(cx+.365,.88,cz-.186)],.004,STEEL)
box("Straight brass measure",(cx-.09,.861,cz-.29),(.50,.008,.038),METAL,.002)
for i in range(11):
    box("Ruler etched tick",(cx-.30+i*.044,.866,cz-.29),(.002,.001,.015 if i%5 else .025),TIMBER,.0003)
for y,r in [(.871,.033),(.905,.023),(.939,.033)]:
    sphere("Flax spool",(cx+.30,y,cz+.28),(r,.012,r),FELT)
box("Kraft parcel on shelf",(cx-.12,.452,cz),(.40,.108,.33),PAPER,.010)
box("Parcel linen band",(cx-.12,.508,cz),(.034,.005,.335),FELT,.001)

# Merge meshes by material and animation parent; preserve exactly two pivots.
groups={}
for obj in list(bpy.context.scene.objects):
    if obj.type=="MESH":
        name=obj.data.materials[0].name if obj.data.materials else "None"
        groups.setdefault((obj.parent,name),[]).append(obj)
for (parent,name),objects in groups.items():
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    bpy.context.object.name=f"{parent.name if parent else 'Atelier'}_{name}"
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format="GLB",export_yup=True,
                          export_animations=False,export_cameras=False,export_lights=False)
bpy.context.view_layer.update()
meshes=[obj for obj in bpy.context.scene.objects if obj.type=="MESH"]
bounds=[obj.matrix_world@Vector(c) for obj in meshes for c in obj.bound_box]
low=tuple(min(p[i] for p in bounds) for i in range(3))
high=tuple(max(p[i] for p in bounds) for i in range(3))
print(f"ATELIER: {len(meshes)} mesh groups; {sum(len(o.data.polygons) for o in meshes)} faces")
print(f"BLENDER BOUNDS: {low} -> {high}; FILE: {OUTPUT.stat().st_size} bytes")

if "--preview" in sys.argv:
    scene=bpy.context.scene
    scene.render.engine="BLENDER_EEVEE"
    scene.eevee.use_gtao=True
    scene.eevee.gtao_distance=3
    scene.eevee.gtao_factor=1.05
    scene.eevee.taa_render_samples=96
    scene.render.resolution_x=1200
    scene.render.resolution_y=900
    scene.render.resolution_percentage=100
    scene.render.film_transparent=True
    scene.world.use_nodes=True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value=(.72,.76,.78,1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value=.55
    for p,energy,size,color in [((-4,-5,7),650,5,(1,.9,.77)),((5,2,5),500,4,(.76,.86,1)),((0,-6,3),170,4,(1,.95,.87))]:
        bpy.ops.object.light_add(type="AREA",location=p)
        light=bpy.context.object
        light.data.energy=energy;light.data.shape="DISK";light.data.size=size;light.data.color=color
        light.rotation_euler=(Vector((0,0,.7))-light.location).to_track_quat("-Z","Y").to_euler()
    bpy.ops.object.camera_add(location=(5.6,-8.8,5.6))
    camera=bpy.context.object
    camera.data.type="ORTHO";camera.data.ortho_scale=7.8
    camera.rotation_euler=(Vector((0,0,.65))-camera.location).to_track_quat("-Z","Y").to_euler()
    scene.camera=camera
    scene.render.image_settings.file_format="PNG"
    scene.render.filepath="/tmp/chingis-atelier-v5.png"
    bpy.ops.render.render(write_still=True)
