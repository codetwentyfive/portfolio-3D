"""Shared craft language, with distinct architecture and botany for each world.

All detail is exported geometry/vertex color: no runtime noise shaders or downloads.
The small stepped borders borrow the rhythm of Mongolian alkhan khee ornament;
these are original abstract trims, not replicas of sacred emblems.
"""
import math
import random
import re
import bpy


def bind(g):
    global G
    G = g


def rock(name, p, scale, material, seed=0):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=G.xyz(p))
    obj = bpy.context.object
    rng = random.Random(seed)
    for v in obj.data.vertices:
        v.co *= rng.uniform(.86, 1.13)
    obj.scale = (scale[0], scale[2], scale[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return G.finish(obj, name, material)


def foundation(width, depth, surface):
    # A floating slice of masonry over split rock, not a rounded presentation tray.
    G.box("Basalt bed", (0,-.29,0), (width-.12,.48,depth-.12), G.IRON,.08)
    for side in [-1,1]:
        for i in range(9):
            x=-width/2+.3+i*(width-.6)/8
            G.box("Hand cut edge course",(x,-.1,side*(depth/2-.13)),((width-.2)/9-.025,.28,.28),G.STONE,.03)
            rock("Split basalt underside",(x,-.43,side*(depth/2-.34)),(.46,.33+(i%3)*.12,.42),G.IRON, i+10)
    for side in [-1,1]:
        for i in range(5):
            z=-depth/2+.5+i*(depth-1)/4
            rock("Side outcrop",(side*(width/2-.24),-.42,z),(.4,.32+(i%2)*.16,.5),G.STONE,i+30)
    G.box("Dressed surface",(0,-.025,0),(width-.52,.13,depth-.52),surface,.025)
    # Thin reveal catches warm light without a metallic gold perimeter.
    G.box("Front stone reveal",(0,-.08,depth/2+.006),(width-.45,.025,.018),G.WOOD2,.003)


def fret(p, width, material, count=5, scale=.10):
    x,y,z=p
    step=width/count
    for i in range(count):
        cx=x-width/2+(i+.5)*step
        pts=[(-.85,-.45),(-.85,.45),(.35,.45),(.35,-.05),(-.25,-.05)]
        for a,b in zip(pts,pts[1:]):
            G.rod("Stepped border inlay",(cx+a[0]*scale,y+a[1]*scale,z),(cx+b[0]*scale,y+b[1]*scale,z),.009,material,vertices=6)


def arch(p, radius, thickness, depth, material, segments=11):
    x,y,z=p
    for i in range(segments):
        a=i*math.pi/segments+.016
        b=(i+1)*math.pi/segments-.016
        pts=[(math.cos(a)*radius,math.sin(a)*radius),(math.cos(b)*radius,math.sin(b)*radius),
             (math.cos(b)*(radius+thickness),math.sin(b)*(radius+thickness)),(math.cos(a)*(radius+thickness),math.sin(a)*(radius+thickness))]
        G.profile("Radial arch stone",pts,depth,p,material)


def lantern(p, scale=1):
    x,y,z=p
    G.box("Lantern foot",(x,y,z),(.2*scale,.045*scale,.2*scale),G.IRON,.008)
    G.box("Amber lantern glass",(x,y+.16*scale,z),(.13*scale,.27*scale,.13*scale),G.AMBER,.008)
    for dx in [-.08,.08]:
        for dz in [-.08,.08]:
            G.rod("Lantern frame",(x+dx*scale,y,z+dz*scale),(x+dx*scale,y+.31*scale,z+dz*scale),.012*scale,G.IRON,vertices=6)
    G.box("Lantern cap",(x,y+.33*scale,z),(.23*scale,.055*scale,.23*scale),G.IRON,.015)


def blade(name, base, tip, width, material):
    a,b=G.xyz(base),G.xyz(tip)
    axis=b-a
    from mathutils import Vector
    side=axis.cross(Vector((0,0,1)))
    if side.length<.01: side=Vector((1,0,0))
    side.normalize()
    mid=a.lerp(b,.52)
    vertices=[a,mid-side*width,mid+Vector((0,0,.026)),mid+side*width,b]
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(vertices,[],[(0,1,2),(0,2,3),(1,4,2),(2,4,3)])
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    G.finish(obj,name,material)
    material.use_backface_culling=False


def grass(p, scale=1, seed=1, material=None):
    rng=random.Random(seed)
    x,y,z=p
    for i in range(9):
        a=rng.random()*math.tau
        h=rng.uniform(.18,.48)*scale
        blade("Feather grass",(x,y,z),(x+math.cos(a)*.22*scale,y+h,z+math.sin(a)*.22*scale),.018*scale,material or G.LEAF2)


def sunflower(p, scale=1):
    x,y,z=p
    G.rod("Sunflower stalk",p,(x+.07*scale,y+.83*scale,z),.014*scale,G.LEAF,vertices=8)
    for i in range(3):
        h=y+(.22+i*.16)*scale
        side=1 if i%2 else -1
        blade("Sunflower pointed leaf",(x,h,z),(x+side*.3*scale,h+.11*scale,z+.06),.085*scale,G.LEAF)
    cx,cy=x+.07*scale,y+.83*scale
    for i in range(11):
        a=i*math.tau/11
        blade("Ochre sunflower petal",(cx,cy,z+.01),(cx+math.cos(a)*.16*scale,cy+math.sin(a)*.16*scale,z+.025),.042*scale,G.WOOD2)
    G.rod("Sunflower seed heart",(cx,cy,z),(cx,cy,z+.05*scale),.065*scale,G.WOOD,vertices=12)


def cypress(p, scale=1):
    x,y,z=p
    G.rod("Cypress trunk",p,(x,y+1.1*scale,z),.04*scale,G.WOOD,vertices=8)
    for i in range(5):
        h=(.32+i*.20)*scale
        r=(.29-i*.046)*scale
        rock("Cypress sculpted foliage",(x+math.sin(i)*.025,y+h,z),(r,.32*scale,r*.85),G.LEAF,i+40)


def stage():
    # A ruined garden amphitheatre with a large, clear silhouette behind the band.
    for x in [-2.22,2.22]:
        for y,w in [(.15,.48),(.4,.37),(1.61,.43),(1.76,.52)]:
            G.box("Stage pier dressed stone",(x,y,-1.63),(w,.18,w),G.STONE,.025)
        G.box("Stage pier shaft",(x,.97,-1.63),(.28,1.25,.3),G.TEAL,.025)
        fret((x,1.4,-1.465),.22,G.WOOD2,1,.09)
    arch((0,1.82,-1.63),2.0,.22,.22,G.STONE,15)
    # Open arch keeps the drum kit readable, and the break creates asymmetry.
    for x in [-2.22,2.22]:
        G.rod("Stage lantern bracket",(x,1.06,-1.49),(x,1.06,-1.28),.02,G.IRON,vertices=8)
        lantern((x,1.08,-1.28),.7)
    fret((0,.28,1.231),3.5,G.WOOD2,11,.1)
    for i,(x,z) in enumerate([(-2.47,-1.15),(-2.5,-.5),(2.43,-1.48),(2.45,-.85)]):
        sunflower((x,.07,z),.8+(i%3)*.15)
    for i,(x,z) in enumerate([(-2.4,1.7),(-1.73,1.8),(-1.05,1.98),(1.45,1.9),(2.45,1.6),(2.6,.45)]):
        grass((x,.065,z),.9,i)
        rock("Garden shale",(x+.15,.1,z-.12),(.2,.1,.17),G.STONE,i)


def courtyard():
    # Deep cornices, arch crowns, fluted piers and a patinated copper mansard.
    for x in [-1.88,-.63,.63,1.88]:
        G.box("Facade pilaster",(x,1.42,-.665),(.13,2.57,.12),G.CREAM,.016)
        for y in [.24,1.44,2.61]: G.box("Pilaster capital",(x,y,-.63),(.23,.12,.22),G.LIGHTSTONE,.013)
    for x in [-1.25,0,1.25]:
        arch((x,2.15,-.62),.35,.095,.10,G.CREAM)
    # Roof is a shaped solid rather than one thin black slab.
    G.profile("Patinated mansard",[(-2,0),(-1.62,.54),(1.62,.54),(2,0)],.93,(0,2.99,-.99),G.TEAL)
    for i in range(12):
        x=-1.55+i*.28
        G.rod("Mansard standing seam",(x,3.03,-.52),(x,3.49,-.52),.009,G.BRASS,vertices=6)
    G.box("Roof ridge",(0,3.55,-.99),(3.43,.09,.98),G.IRON,.02)
    fret((0,2.81,-.595),3.6,G.WOOD2,12,.075)
    for x in [-1.84,1.83]:
        G.box("Sconce bracket",(x,1.65,-.52),(.09,.09,.32),G.IRON,.01)
        lantern((x,1.51,-.34),.62)
    for i,(x,z,s) in enumerate([(-1.88,1.25,1.05),(2.13,.94,.8)]):
        G.box("Terracotta planter foot",(x,.13,z),(.49,.17,.49),G.WOOD,.03)
        G.box("Terracotta planter",(x,.31,z),(.46,.27,.46),G.RUST,.035)
        G.box("Planter lip",(x,.45,z),(.51,.06,.51),G.WOOD2,.013)
        cypress((x,.46,z),s)
    for i in range(5):
        grass((-2.19,.08,-.45+i*.34),.55,i,G.LEAF)


def dispatch():
    # Fortified trade pavilion: carved piers, exposed trusses, lifted copper roof.
    for x in [-1.6,1.6]:
        for z in [-1.25,.28]:
            G.box("Trade hall pier",(x,.58,z),(.28,1.05,.28),G.STONE,.026)
            G.box("Trade hall capital",(x,1.12,z),(.37,.13,.37),G.WOOD2,.022)
    for z in [-1.51,.62]:
        for side in [-1,1]:
            G.rod("Timber roof truss",(side*1.75,2.29,z),(0,2.91,z),.04,G.WOOD,vertices=8)
    for x in [-1.85,1.85]:
        G.rod("Canopy diagonal strut",(x*.865,1.7,.28),(x*.93,2.17,.28),.035,G.WOOD2,vertices=8)
    G.profile("Copper pitched canopy",[(-1.9,0),(0,.63),(1.9,0),(1.9,.09),(0,.74),(-1.9,.09)],2.17,(0,2.26,-.45),G.TEAL)
    G.rod("Roof ridge brass seam",(0,3,-1.55),(0,3,.65),.033,G.BRASS,vertices=8)
    fret((0,2.17,.582),3.55,G.WOOD2,11,.09)
    for x in [-2.3,2.3]:
        lantern((x,.0614,-1.65),.95)
        grass((x,.065,-1.25),.65,int(x*10)+30,G.TEAL)


def room():
    # Architectural framing and woven inlay; the user's home lab stays recognisable.
    mats={m.name:m for m in bpy.data.materials}
    wood=mats['Room walnut']; brass=mats['Room aged brass']; ivory=mats['Room glazed porcelain']
    for x in [-2.82,2.82]:
        G.box("Room carved upright",(x,1.85,-1.55),(.13,3.56,.15),wood,.018)
        G.box("Room post capital",(x,3.49,-1.5),(.24,.15,.21),wood,.022)
    G.box("Room deep timber cornice",(0,3.6,-1.58),(5.95,.15,.26),wood,.025)
    fret((0,3.56,-1.435),5.45,brass,18,.074)
    # An understated woven diamond rhythm in the foreground rug.
    for i in range(5):
        x=-1.37+i*.30
        for a,b in [((0,-.11),(.09,0)),((.09,0),(0,.11)),((0,.11),(-.09,0)),((-.09,0),(0,-.11))]:
            G.rod("Rug diamond weave",(x+a[0],.069,1.44+a[1]),(x+b[0],.069,1.44+b[1]),.004,ivory,vertices=4)


def tint_meshes():
    # Broad, deterministic face washes survive glTF export as COLOR_0. Avoid noise
    # on artwork, display screens and room textures: their supplied colors matter.
    for obj in bpy.context.scene.objects:
        if obj.type!='MESH' or not obj.data.materials: continue
        mat=obj.data.materials[0]
        if mat.name.startswith('Room '): continue
        if not re.search(r'stone|roof|plank|pier|facade|wall|basalt|outcrop|surface|canopy', obj.name, re.I): continue
        if any(n.type=='TEX_IMAGE' for n in mat.node_tree.nodes): continue
        if 'indicator' in mat.name or 'Phosphor' in mat.name: continue
        colors=obj.data.color_attributes.new(name='Craft wash',type='BYTE_COLOR',domain='CORNER')
        for poly in obj.data.polygons:
            center=poly.center
            tone=.90+.065*math.sin(center.x*4.7+center.y*2.9+center.z*7.1)
            for index in poly.loop_indices: colors.data[index].color=(tone,tone*.985,tone*.965,1)
