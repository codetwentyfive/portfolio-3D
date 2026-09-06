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
STONE = mat("Concrete", (.27, .31, .28), .95)
LIGHTSTONE = mat("Cut limestone", (.48, .51, .43), .88)
WOOD = mat("Oiled timber", (.25, .12, .057), .75)
WOOD2 = mat("Timber end grain", (.4, .23, .1), .8)
LEAF = mat("Olive foliage", (.105, .19, .061), .92)
LEAF2 = mat("Sunlit foliage", (.24, .31, .085), .9)
RUBBER = mat("Rubber and cables", (.013, .02, .017), .88)
TEAL = mat("Petrol enamel", (.025, .18, .175), .38, .2)
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
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, location=xyz(p))
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
    box("Foundation edge",(0,-.27,0),(width,.52,depth),IRON,.2)
    box("Cast surface",(0,-.04,0),(width+.08,.15,depth+.08),m,.16)
    for x in [-width/2+.25,width/2-.25]:
        for z in [-depth/2+.25,depth/2-.25]:
            rod("Recessed bolt",(x,.04,z),(x,.053,z),.04,STEEL)
    for x in [-1.8,-.9,0,.9,1.8]:
        box("Underside brace",(x,-.46,0),(.1,.14,depth-.35),STEEL,.025)


def plant(p, scale=1):
    x,y,z=p
    rod("Plant stem",p,(x,y+.6*scale,z),.018*scale,WOOD)
    for i in range(7):
        a=i*2.4
        h=y+(.15+i*.065)*scale
        q=(x+math.sin(a)*.24*scale,h+.04,z+math.cos(a)*.24*scale)
        rod("Branch",(x,h-.1,z),q,.009*scale,WOOD)
        sphere("Leaf",q,(.13*scale,.045*scale,.09*scale),LEAF if i%2 else LEAF2)


def crate(p, scale=1, parent=None):
    x,y,z=p
    box("Parcel",p,(.48*scale,.4*scale,.4*scale),WOOD2,.02,parent)
    box("Packing tape",(x,y+.204*scale,z),(.08*scale,.007,.4*scale),CREAM,.001,parent)
    box("Shipping label",(x+.09*scale,y+.211*scale,z+.03),(.14*scale,.008,.18*scale),PAPER,.001,parent)
    for i in range(6):
        box("Label barcode",(x+.045*scale+i*.018*scale,y+.217*scale,z+.03),(.006,.002,.12*scale),IRON,0,parent)


def export(name):
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
        for z in [-1.25,.4]:
            box("Column shoe",(x,.13,z),(.22,.24,.22),IRON)
            box("Steel column",(x,1.12,z),(.085,2,.085),TEAL)
        rod("Roof diagonal",(x,1.8,-1.25),(x,2.2,.4),.035,STEEL)
    box("Canopy fascia",(0,2.18,-.45),(3.6,.14,2.05),TEAL,.04)
    for i in range(18):
        box("Standing roof seam",(-1.68+i*.198,2.265,-.45),(.035,.025,2.04),STEEL,.006)
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
            rod("Belt leg",(x,.06,z),(x,.43,z),.045,STEEL)
    for i in range(25):
        x=-2.12+i*.176
        rod("Conveyor roller",(x,.64,.64),(x,.64,1.26),.065,STEEL,vertices=12)
    for z in [.55,1.35]:
        box("Belt rail",(0,.73,z),(4.6,.07,.05),BRASS)
    for i,x in enumerate([-1.55,-.25,1.1]):
        moving=pivot(f"parcel_{i}",(x,.91,.95))
        crate((x,.91,.95),1,moving)
    for z in [.48,1.42]:
        box("Scanner arch leg",(.2,1.04,z),(.12,.82,.12),RUST)
    box("Barcode scanner bridge",(.2,1.48,.95),(.16,.12,1.08),RUST)
    box("Sensor lens",(.2,1.4,.95),(.12,.05,.3),GREEN)
    box("Control stand",(2,.5,-.7),(.52,.94,.48),TEAL,.04)
    box("Terminal face",(2,1.03,-.64),(.56,.13,.55),IRON,.025)
    box("Terminal screen",(2,1.104,-.72),(.4,.015,.24),GREEN)
    for i in range(3):
        rod("Pushbutton",(1.86+i*.14,1.1,-.45),(1.86+i*.14,1.13,-.45),.038,RUST if i==2 else CREAM)
    for x,y,z in [(-1.7,.27,-.65),(-1.7,.69,-.65),(-2.13,.27,-.1),(.9,.27,-.7)]:
        crate((x,y,z))
    cable("Power conduit",[(2,.18,-.85),(2.35,.06,-1),(2.35,.06,1.5),(.4,.06,1.5)],.028,RUBBER)
    for x in [-2.2,2.2]:
        rod("Safety bollard",(x,.08,-1.7),(x,.48,-1.7),.07,RUST)
        ring("Bollard stripe",(x,.35,-1.7),.071,.017,CREAM)
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
        height=.16*(i+1)
        box("Stage step",(0,height/2,1.76-i*.22),(1.2,height,.25),WOOD2,.02)
    # Two light towers and a curved cable with actual hanging bulbs.
    for x in [-2.02,2.02]:
        box("Tower foot",(x,.57,-1.38),(.3,.13,.3),IRON)
        rod("Lighting tower",(x,.58,-1.38),(x,2.45,-1.38),.04,IRON)
        for y in [.9,1.3,1.7,2.1]:
            rod("Tower diagonal",(x-.08,y,-1.38),(x+.08,y+.3,-1.38),.016,STEEL)
    cable("Festoon",[(-2.02,2.4,-1.38),(-1,2.12,-1.38),(0,2.03,-1.38),(1,2.12,-1.38),(2.02,2.4,-1.38)],.012,RUBBER)
    for i in range(11):
        x=-1.9+i*.38
        y=2.03+.36*(x/2)**2
        rod("Bulb socket",(x,y,-1.38),(x,y-.075,-1.38),.023,IRON)
        sphere("Warm bulb",(x,y-.11,-1.38),(.045,.055,.045),AMBER)
    # Bass drum and toms include skins, rims and tension lugs.
    rod("Kick shell",(0,.96,-.62),(0,.96,-.03),.39,RUST,vertices=40)
    rod("Kick front skin",(0,.96,-.018),(0,.96,-.01),.365,CREAM,vertices=40)
    for z in [-.64,0]:
        ring("Kick rim",(0,.96,z),.39,.022,STEEL,"z")
    seeds_logo = brand_material("seeds", "The Strange Seeds official logo")
    brand_decal("Kick drum sunflower logo", (0, .96, .015), .63, seeds_logo)
    for i in range(8):
        a=i*math.tau/8
        rod("Kick lug",(math.sin(a)*.4,.96+math.cos(a)*.4,-.6),(math.sin(a)*.4,.96+math.cos(a)*.4,-.04),.012,STEEL)
    for x,y,z,r in [(-.34,1.43,-.46,.21),(.24,1.48,-.6,.23),(.62,1.04,-.68,.25),(-.59,1.04,-.2,.23)]:
        rod("Tom shell",(x,y-.22,z),(x,y,z),r,RUST,vertices=24)
        rod("Drum skin",(x,y,z),(x,y+.01,z),r*.95,CREAM,vertices=24)
        ring("Tom rim",(x,y+.015,z),r,.018,STEEL)
    for i,(x,z,y,r) in enumerate([(-.95,-.65,1.69,.34),(.9,-.92,1.8,.4),(-.73,.18,1.38,.25)]):
        rod("Cymbal stand",(x,.55,z),(x,y,z),.014,STEEL)
        for a in [0,2.1,4.2]:
            rod("Tripod",(x,.7,z),(x+math.sin(a)*.22,.54,z+math.cos(a)*.22),.012,STEEL)
        sway=pivot(f"cymbal_{i}",(x,y,z))
        sphere("Hammered cymbal",(x,y,z),(r,.023,r),BRASS,sway)
        sphere("Cymbal bell",(x,y+.028,z),(.07,.035,.07),BRASS,sway)
    rod("Drummer stool",(0,.55,-1.1),(0,.99,-1.1),.025,IRON)
    sphere("Stool pad",(0,1.01,-1.1),(.18,.055,.18),RUBBER)
    # Amplifier stacks with woven grilles, knobs and corner protectors.
    for x in [-1.5,1.5]:
        box("Amp cabinet",(x,.96,-.43),(.67,.86,.48),IRON,.035)
        box("Speaker grille",(x,.97,-.18),(.59,.65,.018),STONE,.005)
        for y in [.8,1.14]:
            rod("Speaker",(x,y,-.15),(x,y,-.14),.145,RUBBER,vertices=24)
            ring("Speaker surround",(x,y,-.133),.15,.011,STEEL,"z")
        box("Amp head",(x,1.46,-.42),(.7,.16,.44),IRON,.02)
        for i in range(5):
            sphere("Amp dial",(x-.23+i*.115,1.46,-.188),(.025,.025,.025),BRASS)
    # A recognisable offset-body electric guitar, neck, pickups and six strings.
    gx,gz=1.2,.43
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
    for x,z in [(-1.05,.65),(.95,.85)]:
        rod("Mic stand",(x,.55,z),(x,1.7,z),.016,IRON)
        rod("Mic boom",(x,1.7,z),(x-.25,1.8,z+.06),.012,STEEL)
        rod("Microphone",(x-.25,1.8,z+.06),(x-.36,1.81,z+.06),.032,IRON)
        cable("Audio cable",[(x-.36,1.81,z+.06),(x-.02,1.2,z),(x,.54,z),(x+.4,.55,z+.14),(x+.65,.54,z-.1)],.012,RUBBER)
    box("Pedalboard",(.78,.56,.99),(.55,.075,.3),IRON)
    for i,m in enumerate([TEAL,CREAM,RUST]):
        box("Effects pedal",(.6+i*.17,.64,.99),(.13,.07,.2),m,.015)
        sphere("Footswitch",(.6+i*.17,.69,1.035),(.019,.015,.019),STEEL)
    for i in range(30):
        x=random.uniform(-2.65,2.65)
        z=random.choice([-1.95,1.95])+random.uniform(-.12,.12)
        plant((x,.03,z),random.uniform(.35,.75))
        if i%4==0:
            sphere("Moss stone",(x,.05,z),(.16,.08,.13),moss)
    export("seeds")


def potera():
    clear()
    plaster=mat("Sage plaster",(.37,.43,.32),.96)
    platform(5.35,4.15,LIGHTSTONE)
    # Courtyard paving is modeled as courses, not a flat color disk.
    for row in range(9):
        for col in range(13):
            x=-2.4+col*.39+(row%2)*.18
            if x<2.52:
                box("Courtyard stone",(x,.055,-1.7+row*.41),(.37,.055,.39),LIGHTSTONE if (row+col)%4 else STONE,.012)
    box("Townhouse facade",(0,1.38,-.95),(3.65,2.7,.45),plaster,.035)
    box("Stone plinth",(0,.2,-.66),(3.9,.29,.16),CREAM)
    for y in [1.42,2.73,2.84]:
        box("Cornice",(0,y,-.92),(3.92,.1,.61),CREAM,.02)
    box("Roof cap",(0,2.94,-.99),(3.99,.16,.87),IRON,.035)
    for x in [-1.25,0,1.25]:
        for y in [.84,2.06]:
            box("Window reveal",(x,y,-.698),(.86,.99,.07),CREAM,.015)
            box("Window pane",(x,y,-.65),(.7,.86,.022),GLASS,.007)
            for dx in [-.35,0,.35]:
                box("Window mullion",(x+dx,y,-.624),(.038,.88,.025),CREAM,.003)
            box("Transom",(x,y+.08,-.615),(.71,.035,.028),CREAM,.003)
            box("Window sill",(x,y-.53,-.64),(.98,.1,.28),CREAM,.012)
    box("Door frame",(-1.25,.73,-.58),(.89,1.46,.12),CREAM,.018)
    box("Entry door",(-1.25,.71,-.49),(.7,1.36,.045),TEAL,.008)
    for y in [.43,1.05]:
        box("Door inset",(-1.25,y,-.46),(.52,.46,.016),GLASS if y>1 else IRON,.012)
    sphere("Door handle",(-1,.77,-.405),(.028,.028,.028),BRASS)
    box("Door step",(-1.25,.13,-.28),(1.02,.16,.42),CREAM,.02)
    label("Address","25",(-1.83,1.1,-.62),.12,IRON)
    # A planted side wall, downpipe, handrail and cleaning access ladder.
    box("Garden wall",(-2.38,.4,.0),(.12,.74,2.85),plaster,.02)
    cable("Downpipe",[(1.96,2.75,-.9),(2.03,2.6,-.66),(2.03,.22,-.66),(2.15,.1,-.55)],.043,TEAL)
    for y in [.4,1.3,2.3]:
        box("Pipe bracket",(2.03,y,-.7),(.16,.04,.15),STEEL,.005)
    for x in [.6,1.05]:
        rod("Ladder side",(x,.09,.63),(x,2.55,-.53),.025,STEEL)
    for i in range(10):
        y=.22+i*.23
        z=.63-(y-.09)*1.16/2.46
        rod("Ladder rung",(.6,y,z),(1.05,y,z),.026,STEEL)
    # Janitorial cart: trays, caster wheels, bucket, bottles, cloth and squeegee.
    cx,cz=.2,1.27
    for dx in [-.34,.34]:
        for dz in [-.26,.26]:
            rod("Cart caster",(cx+dx-.045,.14,cz+dz),(cx+dx+.045,.14,cz+dz),.075,RUBBER,vertices=16)
            rod("Cart upright",(cx+dx,.22,cz+dz),(cx+dx,.94,cz+dz),.025,STEEL)
    for y in [.25,.69]:
        box("Cart shelf",(cx,y,cz),(.78,.075,.62),TEAL,.03)
    cable("Cart handle",[(cx-.35,.93,cz+.26),(cx-.35,1.06,cz+.26),(cx+.35,1.06,cz+.26),(cx+.35,.93,cz+.26)],.025,STEEL)
    rod("Bucket body",(cx-.15,.73,cz),(cx-.15,1.01,cz),.16,TEAL,vertices=24)
    ring("Bucket lip",(cx-.15,1.02,cz),.163,.018,CREAM)
    cable("Bucket handle",[(cx-.31,1,cz),(cx-.27,1.19,cz),(cx-.02,1.19,cz),(cx+.01,1,cz)],.009,STEEL)
    for i,m in enumerate([CREAM,RUST]):
        rod("Cleaning bottle",(cx+.13+i*.14,.74,cz-.05),(cx+.13+i*.14,.92,cz-.05),.052,m)
        box("Bottle spray head",(cx+.13+i*.14,.96,cz-.03),(.06,.07,.12),IRON,.012)
    box("Folded cloth",(cx+.19,.77,cz+.19),(.29,.055,.18),CREAM,.025)
    # Brand the contractor's equipment, not the customer's townhouse.
    potera_logo = brand_material("potera", "Potera Reinigung official logo")
    box("Cart brand panel", (cx, .48, cz+.32), (.72,.40,.025), PAPER, .018)
    brand_decal("Cart Potera logo", (cx,.48,cz+.335), .37, potera_logo)
    # A portable contractor sign makes the identity legible at island scale.
    sx, sz = 1.10, 1.28
    for dx in [-.31,.31]:
        rod("Service sign front leg", (sx+dx,.09,sz+.16), (sx+dx,.99,sz-.12), .025, TEAL)
        rod("Service sign rear leg", (sx+dx,.09,sz-.47), (sx+dx,.99,sz-.12), .025, TEAL)
    box("Service sign enamel", (sx,.62,sz), (.67,.72,.04), PAPER, .035)
    brand_decal("Service sign Potera logo", (sx,.62,sz+.023), .61, potera_logo)
    rod("Squeegee pole",(-.65,.08,.97),(-.33,1.87,.52),.017,STEEL)
    rod("Squeegee blade",(-.55,1.87,.52),(-.11,1.87,.52),.03,RUBBER)
    box("Drain grate",(1.9,.096,.3),(.3,.025,1.25),IRON)
    for i in range(12):
        box("Drain slot",(1.9,.113,-.24+i*.1),(.25,.01,.018),STEEL,0)
    for x,z in [(-1.75,1.3),(2.15,1.3)]:
        box("Planter",(x,.23,z),(.49,.37,.49),CREAM,.045)
        plant((x,.4,z),1.45)
    export("potera")


def assistant():
    from types import SimpleNamespace
    if str(ROOT / "scripts") not in sys.path:
        sys.path.insert(0, str(ROOT / "scripts"))
    from home_room import build
    build(SimpleNamespace(**globals()))
    export("assistant")


builders = {"payments": payments, "seeds": seeds, "potera": potera, "assistant": assistant}
requested = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else list(builders)
for kind in requested:
    builders[kind]()
