"""Original miniature working environments. Blender 4.0+.

Coordinates use the site's Y-up convention. Static geometry is joined by material;
named mechanical pivots are kept separate for small, meaningful web animations.
Brand artwork is sourced from the clients' local repositories, not generated.
"""
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/3d/worlds"
VERSIONS = json.loads((ROOT / "assets/world-versions.json").read_text())
OUT.mkdir(parents=True, exist_ok=True)
random.seed(25)


def xyz(p):
    return Vector((p[0], -p[2], p[1]))


def mat(name, color, rough=.7, metal=0, emission=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    s = m.node_tree.nodes.get("Principled BSDF")
    s.inputs["Base Color"].default_value = (*color, 1)
    s.inputs["Roughness"].default_value = rough
    s.inputs["Metallic"].default_value = metal
    if emission:
        s.inputs["Emission Color"].default_value = (*color, 1)
        s.inputs["Emission Strength"].default_value = emission
    return m


IRON = mat("Graphite enamel", (.032, .045, .043), .38, .45)
STEEL = mat("Brushed aluminum", (.38, .43, .42), .32, .75)
BRASS = mat("Warm brass", (.48, .29, .085), .32, .7)
RUST = mat("Oxide paint", (.39, .105, .045), .7)
CREAM = mat("Warm chalk", (.7, .68, .56), .85)
STONE = mat("Concrete", (.23, .28, .31), .95)
LIGHTSTONE = mat("Cut limestone", (.52, .48, .38), .88)
WOOD = mat("Oiled timber", (.25, .12, .057), .75)
WOOD2 = mat("Timber end grain", (.4, .23, .1), .8)
LEAF = mat("Olive foliage", (.045, .15, .12), .92)
LEAF2 = mat("Sunlit foliage", (.24, .32, .16), .9)
RUBBER = mat("Rubber and cables", (.013, .02, .017), .88)
TEAL = mat("Petrol enamel", (.028, .21, .22), .38, .2)
GLASS = mat("Smoked window", (.045, .105, .095), .12, .65)
GREEN = mat("Phosphor", (.19, .65, .38), .5, emission=.6)
AMBER = mat("Amber indicator", (.95, .36, .06), .4, emission=.5)
RED = mat("Red leather", (.34, .028, .02), .7)
PAPER = mat("Paper labels", (.82, .79, .66), .95)


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def finish(o, name, material, parent=None):
    o.name = name
    o.data.materials.append(material)
    if parent:
        o.parent = parent
        o.matrix_parent_inverse = parent.matrix_world.inverted()
    return o


def pivot(name, p):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.location = xyz(p)
    bpy.context.view_layer.update()
    return o


def box(name, p, size, m, bevel=.015, parent=None, angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
    o = bpy.context.object
    o.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        b = o.modifiers.new("Machined edges", "BEVEL")
        b.width = bevel
        b.segments = 2
        bpy.ops.object.modifier_apply(modifier=b.name)
        o.data.use_auto_smooth = True
        n = o.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
        bpy.ops.object.modifier_apply(modifier=n.name)
    o.rotation_euler.z = angle
    return finish(o, name, m, parent)


def sphere(name, p, size, m, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, location=xyz(p))
    o = bpy.context.object
    o.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for f in o.data.polygons:
        f.use_smooth = True
    return finish(o, name, m, parent)


def rod(name, a, b, radius, m, parent=None, vertices=16):
    start, end = xyz(a), xyz(b)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=(end-start).length, location=(start+end)/2)
    o = bpy.context.object
    o.rotation_euler = (end-start).to_track_quat("Z", "Y").to_euler()
    for f in o.data.polygons:
        f.use_smooth = len(f.vertices) == 4
    return finish(o, name, m, parent)


def cable(name, points, radius, m, parent=None):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 6
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points)-1)
    for point, p in zip(spline.bezier_points, points):
        point.co = xyz(p)
        point.handle_left_type = point.handle_right_type = "AUTO"
    bpy.ops.object.select_all(action="DESELECT")
    o = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(o)
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
    return finish(o, name, m, parent)


def ring(name, p, radius, tube, m, axis="y", parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=tube, major_segments=40, minor_segments=8, location=xyz(p))
    o = bpy.context.object
    if axis == "z":
        o.rotation_euler.x = math.pi/2
    elif axis == "x":
        o.rotation_euler.y = math.pi/2
    for f in o.data.polygons:
        f.use_smooth = True
    return finish(o, name, m, parent)


def profile(name, points, depth, p, m):
    # Extruded silhouettes, used for instruments rather than stacks of primitives.
    n = len(points)
    verts = [xyz((p[0]+x, p[1]+y, p[2]+z)) for z in [-depth/2, depth/2] for x,y in points]
    faces = [tuple(range(n-1,-1,-1)), tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    return finish(o,name,m)


def label(name, value, p, size, m=CREAM):
    bpy.ops.object.text_add(location=xyz(p))
    o = bpy.context.object
    o.data.body = value
    o.data.size = size
    o.data.align_x = "CENTER"
    o.data.extrude = .0006
    o.rotation_euler.x = math.pi/2
    bpy.ops.object.convert(target="MESH")
    return finish(o,name,m)


def brand_material(kind, name):
    image = bpy.data.images.load(str(ROOT / f"assets/world-branding/{kind}-logo.png"), check_existing=True)
    image.pack()
    material = mat(name, (1, 1, 1), .82)
    material.blend_method = "CLIP"
    material.alpha_threshold = .08
    material.use_backface_culling = True
    texture = material.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = image
    shader = material.node_tree.nodes.get("Principled BSDF")
    material.node_tree.links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    material.node_tree.links.new(texture.outputs["Alpha"], shader.inputs["Alpha"])
    return material, image.size[0] / image.size[1]


def brand_decal(name, p, height, artwork):
    material, aspect = artwork
    width = height * aspect
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([xyz((p[0]+x, p[1]+y, p[2])) for x, y in [
        (-width/2, -height/2), (width/2, -height/2),
        (width/2, height/2), (-width/2, height/2),
    ]], [], [(0, 1, 2, 3)])
    uv = mesh.uv_layers.new(name="Logo UV")
    for loop, coord in zip(uv.data, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop.uv = coord
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    return finish(o, name, material)


def platform(width=5.3, depth=4.2, m=STONE):
    art.foundation(width, depth, m)


def crate(p, scale=1, parent=None):
    x,y,z=p
    box("Parcel",p,(.48*scale,.4*scale,.4*scale),WOOD2,.02,parent)
    box("Packing tape",(x,y+.204*scale,z),(.08*scale,.007,.4*scale),CREAM,.001,parent)
    box("Shipping label",(x+.09*scale,y+.211*scale,z+.03),(.14*scale,.008,.18*scale),PAPER,.001,parent)
    for i in range(6):
        box("Label barcode",(x+.045*scale+i*.018*scale,y+.217*scale,z+.03),(.006,.002,.12*scale),IRON,0,parent)


def export(name):
    art.tint_meshes()
    groups={}
    for o in list(bpy.context.scene.objects):
        if o.type == "MESH":
            groups.setdefault((o.parent,o.data.materials[0].name),[]).append(o)
    for (parent,material),objects in groups.items():
        bpy.ops.object.select_all(action="DESELECT")
        for o in objects:
            o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:
            bpy.ops.object.join()
        bpy.context.object.name=f"{parent.name if parent else name}_{material}"
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=str(OUT/f"{name}-v{VERSIONS[name]}.glb"),export_format="GLB",export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
    print(f"WORLD {name}: {sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')} polygons / {len(groups)} material groups")


def payments():
    clear()
    platform(m=LIGHTSTONE)
    # A rail-mounted sorting hall, with the roof lifted on slender steel trusses.
    for x in [-1.6,1.6]:
        for z in [-1.25,.28]:
            box("Column shoe",(x,.13,z),(.22,.24,.22),IRON)
            box("Steel column",(x,1.12,z),(.085,2,.085),TEAL)
        rod("Roof diagonal",(x,1.8,-1.25),(x,2.2,.28),.035,STEEL)
    box("Canopy fascia",(0,2.18,-.45),(3.6,.14,2.05),TEAL,.04)
    box("Warehouse rear",(0,.9,-1.3),(3.25,1.8,.1),CREAM,.02)
    box("Loading bay recess",(-.78,.8,-1.23),(1.12,1.5,.06),IRON)
    for y in [.3,.44,.58,.72,.86,1,1.14,1.28,1.42]:
        box("Roller shutter",(-.78,y,-1.18),(1.04,.11,.045),STEEL,.007)
    label("Hall number","02",(1,1.17,-1.2),.48,TEAL)
    box("Dispatch sign backing",(0,2.02,.595),(1.55,.29,.045),IRON,.015)
    label("Dispatch sign","DISPATCH",(0,1.94,.626),.18)
    # The belt crosses the foreground, making the data-flow analogy tangible.
    box("Conveyor chassis",(0,.5,.95),(4.4,.23,.76),IRON,.04)
    for x in [-1.8,-.6,.6,1.8]:
        for z in [.67,1.23]:
            rod("Belt leg",(x,.04,z),(x,.43,z),.045,STEEL)
    for i in range(25):
        x=-2.12+i*.176
        rod("Conveyor roller",(x,.64,.64),(x,.64,1.26),.065,STEEL,vertices=12)
    for z in [.55,1.35]:
        box("Belt rail",(0,.73,z),(4.6,.07,.05),BRASS)
    for i,x in enumerate([-1.55,-.25,1.1]):
        moving=pivot(f"parcel_{i}",(x,.91,.95))
        crate((x,.91,.95),1,moving)
    for z in [.48,1.42]:
        box("Scanner mounting shoe",(.2,.615,z),(.20,.12,.24),IRON,.012)
        box("Scanner arch leg",(.2,1.04,z),(.12,.82,.12),RUST)
    box("Barcode scanner bridge",(.2,1.48,.95),(.16,.12,1.08),RUST)
    box("Sensor lens",(.2,1.4,.95),(.12,.05,.3),GREEN)
    box("Control stand",(2,.5,-.7),(.52,.94,.48),TEAL,.04)
    box("Terminal face",(2,1.03,-.64),(.56,.13,.55),IRON,.025)
    box("Terminal screen",(2,1.104,-.72),(.4,.015,.24),GREEN)
    for i in range(3):
        rod("Pushbutton",(1.86+i*.14,1.1,-.45),(1.86+i*.14,1.13,-.45),.038,RUST if i==2 else CREAM)
    for x,y,z in [(-1.7,.27,-.65),(-1.7,.69,-.65),(-2.13,.27,-.1),(.9,.27,-.7)]:
        crate((x,y-.03,z))
    cable("Power conduit",[(2,.18,-.85),(2.32,.068,-.99),(2.32,.068,-1.52),(.4,.068,-1.52)],.028,RUBBER)
    art.dispatch()
    export("payments")


def seeds():
    clear()
    earth=mat("Dark earth",(.085,.105,.052),.98)
    moss=mat("Meadow",(.19,.24,.09),1)
    platform(5.6,4.4,earth)
    # Broad planks, end grain, fasteners, stage apron and a three-step entry.
    box("Stage riser",(0,.25,-.2),(4.15,.44,2.85),WOOD,.055)
    for i in range(18):
        x=-1.96+i*.231
        box("Stage plank",(x,.495,-.2),(.22,.075,2.85),WOOD if i%3 else WOOD2,.009)
        for z in [-1.5,1.1]:
            rod("Plank nail",(x,.535,z),(x,.54,z),.012,IRON,vertices=8)
    for i in range(3):
        height=.164*(i+1)
        box("Stage step",(0,.04+height/2,1.76-i*.22),(1.2,height,.25),WOOD2,.02)
    # Suspend a single festoon from the arch: no duplicate towers through its piers.
    cable("Festoon",[(-1.72,2.93,-1.42),(-.86,2.64,-1.42),(0,2.55,-1.42),(.86,2.64,-1.42),(1.72,2.93,-1.42)],.012,RUBBER)
    for x in [-1.72,1.72]:
        rod("Festoon eyelet mount",(x,2.93,-1.61),(x,2.93,-1.42),.016,IRON,vertices=8)
    for i in range(11):
        x=-1.6+i*.32
        y=2.55+.38*(x/1.72)**2
        rod("Bulb socket",(x,y,-1.42),(x,y-.075,-1.42),.023,IRON)
        sphere("Warm bulb",(x,y-.11,-1.42),(.045,.055,.045),AMBER)
    # Bass drum and toms include skins, rims and tension lugs.
    rod("Kick shell",(0,.96,-.62),(0,.96,-.03),.39,RUST,vertices=40)
    rod("Kick front skin",(0,.96,-.018),(0,.96,-.01),.365,CREAM,vertices=40)
    for z in [-.64,0]:
        ring("Kick rim",(0,.96,z),.39,.022,STEEL,"z")
    seeds_logo = brand_material("seeds", "The Strange Seeds official logo")
    brand_decal("Kick drum sunflower logo", (0, .96, .027), .49, seeds_logo)
    for i in range(8):
        a=i*math.tau/8
        rod("Kick lug",(math.sin(a)*.4,.96+math.cos(a)*.4,-.6),(math.sin(a)*.4,.96+math.cos(a)*.4,-.04),.012,STEEL)
    for x,y,z,r in [(-.28,1.62,-.48,.19),(.28,1.66,-.62,.20),(.72,1.08,-.78,.23),(-.69,1.05,-.02,.21)]:
        rod("Tom shell",(x,y-.22,z),(x,y,z),r,RUST,vertices=24)
        rod("Drum skin",(x,y,z),(x,y+.01,z),r*.95,CREAM,vertices=24)
        ring("Tom rim",(x,y+.015,z),r,.018,STEEL)
    # Mounts and legs support every drum without passing through a neighbouring shell.
    for x,y,z in [(-.28,1.40,-.48),(.28,1.44,-.62)]:
        box("Rack tom base foot",(x,.5475,-.82),(.17,.03,.23),IRON,.009)
        rod("Rack tom support",(x,.5485,-.82),(x,y,-.82),.014,STEEL)
        rod("Rack tom mounting arm",(x,y,-.82),(x,y,z),.014,STEEL)
    for side in [-1,1]:
        box("Kick spur foot",(side*.43,.5485,.12),(.10,.032,.11),RUBBER,.008)
        rod("Kick spur",(side*.29,.715,-.21),(side*.43,.5485,.12),.017,STEEL)
    box("Kick rear support",(0,.55125,-.55),(.10,.0375,.10),RUBBER,.006)
    for x,y,z in [(.72,.86,-.78),(-.69,.83,-.02)]:
        for angle in [0,2.1,4.2]:
            dx,dz=math.sin(angle)*.16,math.cos(angle)*.16
            rod("Drum support leg",(x+dx,.54,z+dz),(x+dx,y+.04,z+dz),.013,STEEL)
    for i,(x,z,y,r) in enumerate([(-.98,-.95,1.83,.29),(.94,-.97,1.91,.31),(-.99,.29,1.38,.22)]):
        rod("Cymbal stand",(x,.55,z),(x,y,z),.014,STEEL)
        for a in [0,2.1,4.2]:
            rod("Tripod",(x,.7,z),(x+math.sin(a)*.22,.54,z+math.cos(a)*.22),.012,STEEL)
        sway=pivot(f"cymbal_{i}",(x,y,z))
        sphere("Hammered cymbal",(x,y,z),(r,.023,r),BRASS,sway)
        sphere("Cymbal bell",(x,y+.028,z),(.07,.035,.07),BRASS,sway)
    rod("Drummer stool",(0,.55,-1.1),(0,.99,-1.1),.025,IRON)
    for angle in [math.pi,math.pi+math.tau/3,math.pi+2*math.tau/3]:
        fx,fz=math.sin(angle)*.20,-1.1+math.cos(angle)*.20
        box("Stool tripod foot",(fx,.5485,fz),(.08,.032,.08),RUBBER,.007)
        rod("Stool tripod leg",(0,.68,-1.1),(fx,.5485,fz),.013,STEEL)
    sphere("Stool pad",(0,1.01,-1.1),(.18,.055,.18),RUBBER)
    # Amplifier stacks with woven grilles, knobs and corner protectors.
    for x in [-1.62,1.62]:
        box("Amp cabinet",(x,.96,-.8),(.67,.86,.48),IRON,.035)
        box("Speaker grille",(x,.97,-.55),(.59,.65,.018),STONE,.005)
        for y in [.8,1.14]:
            rod("Speaker",(x,y,-.52),(x,y,-.51),.145,RUBBER,vertices=24)
            ring("Speaker surround",(x,y,-.503),.15,.011,STEEL,"z")
        box("Amp head",(x,1.46,-.79),(.7,.16,.44),IRON,.02)
        for i in range(5):
            sphere("Amp dial",(x-.23+i*.115,1.46,-.558),(.025,.025,.025),BRASS)
    # A recognisable offset-body electric guitar, neck, pickups and six strings.
    gx,gz=1.35,.52
    outline=[(-.07,0),(-.24,.07),(-.26,.24),(-.14,.38),(-.19,.51),(-.1,.58),(-.05,.43),(.07,.45),(.14,.6),(.23,.49),(.14,.34),(.26,.19),(.21,.06),(.07,0)]
    profile("Offset guitar body",outline,.08,(gx,.58,gz),RUST)
    box("Guitar neck",(gx,1.44,gz),(.075,.8,.045),WOOD2,.008)
    box("Fingerboard",(gx,1.44,gz+.03),(.063,.8,.014),IRON,.002)
    box("Headstock",(gx+.025,1.91,gz),(.12,.19,.045),WOOD2,.015)
    for y in [.76,.9]:
        box("Guitar pickup",(gx,y,gz+.052),(.13,.04,.022),CREAM,.006)
    for i in range(6):
        rod("Guitar string",(gx-.024+i*.009,.71,gz+.064),(gx-.024+i*.009,1.95,gz+.04),.0015,STEEL,vertices=4)
    for i in range(12):
        box("Guitar fret",(gx,1.1+i*.06,gz+.043),(.065,.004,.006),STEEL,0)
    for dx in [-.17,.17]:
        rod("Guitar stand foot",(gx,.55,gz-.1),(gx+dx,.54,gz+.18),.015,IRON)
    rod("Guitar stand upright",(gx,.54,gz-.1),(gx,.84,gz-.1),.016,IRON)
    cable("Guitar stand cradle",[(gx-.16,.64,gz+.04),(gx-.12,.60,gz+.08),(gx+.12,.60,gz+.08),(gx+.16,.64,gz+.04)],.012,IRON)
    for x,z in [(-1.25,.82),(.72,.77)]:
        rod("Mic stand",(x,.55,z),(x,1.7,z),.016,IRON)
        for angle in [0,math.tau/3,2*math.tau/3]:
            fx,fz=x+math.sin(angle)*.20,z+math.cos(angle)*.20
            box("Mic tripod foot",(fx,.5485,fz),(.075,.032,.075),RUBBER,.007)
            rod("Mic tripod leg",(x,.68,z),(fx,.5485,fz),.012,IRON)
        rod("Mic boom",(x,1.7,z),(x-.25,1.8,z+.06),.012,STEEL)
        rod("Microphone",(x-.25,1.8,z+.06),(x-.36,1.81,z+.06),.032,IRON)
        side=-1 if x<0 else 1
        cable("Routed microphone cable",[(x-.36,1.81,z+.06),(x,1.6,z),(x,.55,z),(side*1.89,.55,z),(side*1.89,.55,-.49)],.009,RUBBER)
    box("Pedalboard",(1.35,.57,1.02),(.55,.075,.3),IRON)
    for i,m in enumerate([TEAL,CREAM,RUST]):
        box("Effects pedal",(1.18+i*.17,.6425,1.02),(.13,.07,.2),m,.015)
        sphere("Footswitch",(1.18+i*.17,.6925,1.065),(.019,.015,.019),STEEL)
    art.stage()
    export("seeds")


def potera():
    from potera_courtyard import build
    build(SimpleNamespace(**globals()))


def assistant():
    from types import SimpleNamespace
    if str(ROOT / "scripts") not in sys.path:
        sys.path.insert(0, str(ROOT / "scripts"))
    from home_room import build
    build(SimpleNamespace(**globals()))
    art.room()
    export("assistant")


if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))
import world_art as art
from types import SimpleNamespace
art.bind(SimpleNamespace(**globals()))

builders = {"payments": payments, "seeds": seeds, "potera": potera, "assistant": assistant}
requested = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else list(builders)
for kind in requested:
    builders[kind]()
