"""Original peaceful steppe island for chingis.shop. Blender 4.0+, Y-up export.

Run: blender -b --factory-startup --python build-shop-steppe.py -- --preview
Geometry and palette are authored here, with no downloaded models or textures.
"""

from pathlib import Path
import math
import json
import random
import sys
import bpy
import bmesh
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
VERSION=json.loads((ROOT/"assets/world-versions.json").read_text())["shop"]
OUTPUT=ROOT/f"public/3d/shop/steppe-v{VERSION}.glb"
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
rng=random.Random(628)


def xyz(p):return Vector((p[0],-p[2],p[1]))


def mat(name,color,rough=.8,metal=0,sheen=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    s=m.node_tree.nodes.get("Principled BSDF")
    s.inputs["Base Color"].default_value=(*color,1)
    s.inputs["Roughness"].default_value=rough;s.inputs["Metallic"].default_value=metal
    s.inputs["Sheen Weight"].default_value=sheen
    return m


M={
    "grass":mat("Steppe_meadow",(.29,.40,.16)),
    "grass_light":mat("Steppe_sunlit_grass",(.40,.49,.215)),
    "grass_dark":mat("Steppe_sage_grass",(.20,.32,.17)),
    "straw":mat("Steppe_seed_heads",(.56,.47,.23)),
    "soil":mat("Steppe_turf_earth",(.23,.17,.10)),
    "rock":mat("Steppe_slate",(.16,.215,.21)),
    "rock_light":mat("Steppe_weathered_rock",(.25,.30,.265)),
    "rock_dark":mat("Steppe_deep_rock",(.075,.13,.145)),
    "wood":mat("Ger_timber",(.18,.085,.038),.7),
    "felt":mat("Ger_ivory_felt",(.78,.73,.60),.95,sheen=.2),
    "felt_shadow":mat("Ger_felt_panel",(.65,.63,.515),.95,sheen=.2),
    "felt_seam":mat("Ger_felt_seam",(.70,.665,.555),.95),
    "blue":mat("Ger_blue_woven_trim",(.045,.18,.225)),
    "door":mat("Ger_terracotta_door",(.46,.135,.075),.7),
    "stitch":mat("Ger_flax_seam",(.59,.48,.28)),
    "brass":mat("Ger_warm_brass",(.44,.27,.085),.4,.65),
    "wool":mat("Sheep_wool",(.80,.77,.66),.97,sheen=.25),
    "face":mat("Sheep_face",(.16,.14,.10),.88),
    "ear":mat("Sheep_ear",(.51,.32,.245)),
    "eye":mat("Sheep_eye",(.009,.017,.016),.27),
    "water":mat("Steppe_spring_water",(.10,.40,.44),.18,.1),
    "foam":mat("Steppe_water_glints",(.61,.80,.75),.35),
    "leaf":mat("Steppe_larch_foliage",(.16,.33,.235)),
    "leaf_light":mat("Steppe_larch_tips",(.31,.44,.235)),
    "flower":mat("Steppe_wildflower",(.60,.47,.66)),
}


def finish(o,name,material,parent=None,smooth=False):
    o.name=name
    if material:o.data.materials.append(material)
    for p in o.data.polygons:p.use_smooth=smooth
    if parent:
        o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    return o


def mesh(name,vertices,faces,material,parent=None,smooth=False):
    d=bpy.data.meshes.new(name);d.from_pydata([xyz(p) for p in vertices],[],faces);d.update()
    b=bmesh.new();b.from_mesh(d);bmesh.ops.recalc_face_normals(b,faces=list(b.faces));b.to_mesh(d);b.free()
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    return finish(o,name,material,parent,smooth)


def box(name,p,size,material,bevel=.02,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object
    o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new("Soft handworked edges","BEVEL");mod.width=bevel;mod.segments=2
        bpy.ops.object.modifier_apply(modifier=mod.name)
        o.data.use_auto_smooth=True
        mod=o.modifiers.new("Crafted normals","WEIGHTED_NORMAL");bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,name,material,parent)


def oval(name,p,scale,material,parent=None,segments=16,rings=10):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=xyz(p));o=bpy.context.object
    o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,material,parent,True)


def rock(name,p,scale,material,parent=None,subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions,radius=1,location=xyz(p));o=bpy.context.object
    o.scale=(scale[0],scale[2],scale[1]);o.rotation_euler=(rng.uniform(-.18,.18),rng.uniform(-.2,.2),rng.random()*2)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,material,parent)


def tube(name,points,radius,material,parent=None,resolution=3,handles="AUTO"):
    d=bpy.data.curves.new(name,"CURVE");d.dimensions="3D";d.resolution_u=resolution
    d.bevel_depth=radius;d.bevel_resolution=1
    s=d.splines.new("BEZIER");s.bezier_points.add(len(points)-1)
    for v,p in zip(s.bezier_points,points):v.co=xyz(p);v.handle_left_type=handles;v.handle_right_type=handles
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target="MESH");o.select_set(False)
    return finish(o,name,material,parent,True)


def pivot(name,p=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=xyz(p)
    bpy.context.view_layer.update()
    if parent:o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
    return o


def lathe(name,profile,material,parent=None,segments=64,start=0,end=math.tau):
    v=[];f=[]
    for j,(radius,y) in enumerate(profile):
        for i in range(segments+1):
            a=start+(end-start)*i/segments
            v.append((math.sin(a)*radius,y,math.cos(a)*radius))
            if j<len(profile)-1 and i<segments:
                k=j*(segments+1)+i;f.append((k,k+1,k+segments+2,k+segments+1))
    return mesh(name,v,f,material,parent,True)


def ring(name,p,radius,thickness,material,parent=None):
    return tube(name,[(p[0]+math.sin(a)*radius,p[1],p[2]+math.cos(a)*radius) for a in [i*math.tau/64 for i in range(65)]],thickness,material,parent,1)


GER=(-.97,.66,-.88)
STREAM=[(1.74,1.32),(1.92,1.60),(1.99,1.97),(2.11,2.42)]
SHEEP=[(-1.90,1.30,.75,.88,"graze"),(-.62,1.44,-.45,.92,"graze"),
       (.29,1.81,-.60,.60,"alert"),(1.44,-.43,-.30,.91,"graze"),
       (.72,-1.76,1.0,.87,"rest"),(-2.57,-.94,-.50,.80,"alert")]


def edge(a):return 1+.047*math.sin(a*3+.8)+.032*math.sin(a*7-.3)+.020*math.cos(a*11)


def segment_distance(x,z,a,b):
    dx,dz=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)))
    return math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)


def terrain_height(x,z):
    h=.38+.24*math.exp(-((x+1.1)**2/2.8+(z+1.0)**2/1.5))
    h+=.10*math.sin(x*.9)*math.cos(z*1.1)+.21*math.exp(-((x-1.9)**2/1.5+(z+1.5)**2/.7))
    ger=math.hypot(x-GER[0],z-GER[2])
    if ger<1.33:
        blend=min(1,max(0,(1.33-ger)/.23));h=h*(1-blend)+GER[1]*blend
    pond=math.hypot((x-1.72)/.67,(z-1.05)/.50)
    if pond<1.20:
        blend=min(1,(1.20-pond)/.19);h=h*(1-blend)+.225*blend
    stream=min(segment_distance(x,z,a,b) for a,b in zip(STREAM,STREAM[1:]))
    if stream<.21:
        blend=min(1,(.21-stream)/.07);h=h*(1-blend)+.258*blend
    return h


def ground(x,z):
    h=terrain_height(x,z)
    # Tiny level hoof patches blend into the meadow rather than letting feet
    # hang over the changing terrain height.
    for sx,sz,yaw,scale,pose in SHEEP:
        dx,dz=x-sx,z-sz
        lx=dx*math.cos(yaw)-dz*math.sin(yaw);lz=dx*math.sin(yaw)+dz*math.cos(yaw)
        distance=math.hypot(lx/(scale*.43),lz/(scale*.82))
        if distance<1.10:
            blend=min(1,(1.10-distance)/.25)
            h=h*(1-blend)+terrain_height(sx,sz)*blend
    return h


# Rolling meadow with an irregular thick turf edge, continuous with its rock crag.
N=72;R=18;v=[(0,ground(0,0),0)];f=[]
for j in range(1,R+1):
    for i in range(N):
        a=i*math.tau/N;r=j/R*3.54*edge(a);x=math.sin(a)*r;z=math.cos(a)*r*.80
        v.append((x,ground(x,z),z))
        k=1+(j-1)*N+i;kn=1+(j-1)*N+(i+1)%N
        if j==1:f.append((0,k,kn))
        else:
            prev=k-N;pn=kn-N
            if (j+i)%2:f.extend([(prev,k,kn),(prev,kn,pn)])
            else:f.extend([(prev,k,pn),(k,kn,pn)])
land=mesh("Continuous rolling steppe",v,f,M["grass"])
land.data.materials.append(M["grass_light"]);land.data.materials.append(M["grass_dark"])
for p in land.data.polygons:
    center=p.center;x,z=center.x,-center.y
    patch=math.sin(x*1.5+z*.7)+math.cos(z*1.8-x*.5)
    p.material_index=1 if patch>.75 else 2 if patch<-.85 else 0

profiles=[(1,0),(1.015,-.17),(.97,-.43),(.87,-.83),(.77,-1.19),(.60,-1.58),(.41,-1.96),(.20,-2.25),(.045,-2.38)]
v=[];f=[]
for j,(scale,y) in enumerate(profiles):
    for i in range(N):
        a=i*math.tau/N;r=3.54*edge(a)*scale
        r+=0 if j<2 else .13*math.sin(a*5+j*1.9)
        x=math.sin(a)*r+.12*math.sin(j*.8);z=math.cos(a)*r*.8
        yy=ground(x,z)-.015 if j==0 else y+math.sin(a*4+j)*(.05 if j<3 else .11)
        v.append((x,yy,z))
        if j<len(profiles)-1:
            k=j*N+i;kn=j*N+(i+1)%N
            f.extend([(k,kn,k+N),(kn,kn+N,k+N)])
f.append(tuple((len(profiles)-1)*N+i for i in range(N)))
cliff=mesh("Faceted floating slate crag",v,f,M["soil"])
for key in ["rock_light","rock","rock_dark"]:cliff.data.materials.append(M[key])
for p in cliff.data.polygons:
    band=p.index//(N*2)
    p.material_index=0 if band==0 else 1 if band<3 and p.index%11<7 else 3 if band>=5 else 2
for x,y,z,s in [(-2.7,-.65,.5,.6),(2.4,-.75,-.55,.56),(-1.3,-1.6,-.9,.43),(1.35,-1.6,.75,.51),(-2.0,-.55,-1.65,.46)]:
    rock("Embedded weathered crag",(x,y,z),(s,s*.83,s*.70),M["rock_light"])

# Little ger: original felt shell and real seams; the carved door has a hinge pivot.
ger=pivot("ger",GER)
lathe("Ger timber floor",[(0,.0),(1.105,.0),(1.125,.09),(1.10,.12),(0,.12)],M["wood"],ger)
lathe("Ivory felt wall",[(1.045,.10),(1.06,.18),(1.064,.50),(1.05,.88)],M["felt"],ger,start=.25,end=math.tau-.25)
roof_profile=[(1.17,.87),(1.18,.925),(1.08,.985),(.93,1.08),(.74,1.22),(.53,1.385),(.32,1.515),(.22,1.545)]
lathe("Ivory felt roof",roof_profile,M["felt"],ger)
lathe("Blue roof valance",[(1.061,.795),(1.066,.875)],M["blue"],ger)
lathe("Blue lower felt binding",[(1.066,.14),(1.075,.19)],M["blue"],ger)
for y,r in [(.33,1.070),(.67,1.066)]:
    tube("Woven blue tension rope",[(math.sin(a)*r,y,math.cos(a)*r) for a in [.286+i*(math.tau-.572)/64 for i in range(65)]],.014,M["blue"],ger,1)
for i in range(24):
    a=i*math.tau/24
    # Match every piecewise-linear roof segment. Smooth Bezier handles can dip
    # through the felt between controls and leave dashed depth-fighting marks.
    tube("Stitched radial felt panel",[(math.sin(a)*r,y+.010,math.cos(a)*r) for r,y in roof_profile[1:]],.004,M["felt_seam"],ger,resolution=1,handles="VECTOR")
    if i%2==0:
        points=[(math.sin(a+delta)*1.073,y,math.cos(a+delta)*1.073) for delta,y in [(-.026,.837),(0,.812),(.026,.837),(0,.861),(-.026,.837)]]
        tube("Quiet woven diamond",points,.0036,M["felt"],ger)
ring("Crown timber ring",(0,1.562,0),.245,.038,M["door"],ger)
ring("Crown brass inner edge",(0,1.574,0),.204,.009,M["brass"],ger)
for a in [0,math.pi/2]:tube("Crown cross bar",[(-math.sin(a)*.20,1.563,-math.cos(a)*.20),(math.sin(a)*.20,1.563,math.cos(a)*.20)],.01,M["wood"],ger)
for x in [-.266,.266]:box("Carved doorway jamb",(x,.48,1.047),(.074,.79,.12),M["wood"],.014,ger)
box("Terracotta door lintel",(0,.899,1.047),(.65,.074,.14),M["door"],.014,ger)
door=pivot("ger_door",(-.222,.15,1.074),ger)
box("Terracotta door",(0,.496,1.063),(.456,.70,.065),M["door"],.018,door)
for y in [.32,.66]:
    box("Door inset panel",(0,y,1.101),(.344,.232,.014),M["wood"],.013,door)
    tube("Carved door diamond",[(-.112,y,1.116),(0,y+.083,1.116),(.112,y,1.116),(0,y-.083,1.116),(-.112,y,1.116)],.0065,M["stitch"],door)
oval("Brass latch",(.156,.505,1.126),(.023,.027,.014),M["brass"],door)
box("Entry timber step",(0,.085,1.245),(.67,.15,.33),M["wood"],.035,ger)
for side in [-1,1]:
    px,pz=side*1.30,.66
    gx=GER[0]+px*math.cos(-.07)+pz*math.sin(-.07)
    gz=GER[2]-px*math.sin(-.07)+pz*math.cos(-.07)
    py=ground(gx,gz)-GER[1]
    tube("Ger guy rope",[(side*.91,.78,.43),(side*1.12,.43,.57),(px,py+.045,pz)],.011,M["stitch"],ger)
    tube("Ger ground peg",[(px,py-.035,pz),(px-.02*side,py+.16,pz)],.022,M["wood"],ger)
# All ger geometry above was made in local coordinates; put that group on its rise.
ger.location=(0,0,0);ger.matrix_world.translation=(0,0,0)
for child in ger.children:
    child.matrix_parent_inverse.identity()
ger.location=xyz(GER)
ger.rotation_euler.z=-.07

# Curving stepping stones lead into open grazing space, without bisecting the flock.
for i,(x,z) in enumerate([(-1.04,.69),(-1.07,1.00)]):
    rock("Worn entry stepping stone",(x,ground(x,z)+.016,z),(.22,.04,.13),M["rock_light"])


def sheep(index,x,z,yaw,scale,pose):
    root=pivot(f"sheep_{index}")
    resting=pose=="rest";body_y=.30 if resting else .48
    oval("Soft sheep body",(0,body_y,0),(.30,.265,.43),M["wool"],root)
    for i in range(48):
        angle=i*2.399963;v=1-2*(i+.5)/48;rr=math.sqrt(1-v*v)
        p=(math.cos(angle)*rr*.274,body_y+v*.228,math.sin(angle)*rr*.394)
        if resting and p[1]<.13:continue
        s=.071+rng.random()*.025
        curl=rock("Chunky wool curl",p,(s,s*.89,s),M["wool"],root,1)
        for face in curl.data.polygons:face.use_smooth=True
    for lx in [-.17,.17]:
        for lz in [-.265,.25]:
            if resting:
                oval("Tucked sheep hoof",(lx,.09,lz),(.071,.055,.12),M["face"],root)
            else:
                tube("Short sheep leg",[(lx,.33,lz),(lx,.068,lz+.015)],.037,M["face"],root)
                oval("Sheep hoof",(lx,.047,lz+.025),(.050,.047,.062),M["face"],root)
    oval("Wool tail",(0,body_y,-.43),(.075,.092,.12),M["wool"],root)
    oval("Soft connected sheep neck",(0,.23 if resting else .37,.33),(.12,.13,.13),M["face"],root)
    head_y=.25 if resting else .355
    head=pivot(f"sheep_head_{index}",(0,head_y,.355),root)
    def hp(p):
        px,py,pz=p;py+=head_y-.355
        if pose in ["alert","rest"]:
            a=-.67;dy=py-head_y;dz=pz-.355
            py=head_y+dy*math.cos(a)-dz*math.sin(a)
            pz=.355+dy*math.sin(a)+dz*math.cos(a)
        return (px,py,pz)
    oval("Gentle sheep face",hp((0,.316,.497)),(.146,.173,.157),M["face"],head)
    oval("Connected rounded nose bridge",hp((0,.211,.590)),(.105,.118,.105),M["face"],head)
    oval("Grazing sheep muzzle",hp((0,.131,.637)),(.110,.080,.100),M["face"],head)
    for side in [-1,1]:
        oval("Floppy wool ear",hp((side*.203,.410,.46)),(.117,.034,.061),M["wool"],head)
        oval("Warm inner ear",hp((side*.225,.422,.467)),(.076,.011,.04),M["ear"],head)
        oval("Kind eye white",hp((side*.105,.328,.606)),(.033,.036,.016),M["wool"],head)
        oval("Kind eye",hp((side*.109,.324,.622)),(.017,.022,.009),M["eye"],head)
        oval("Eye catchlight",hp((side*.109-.005,.334,.630)),(.006,.008,.003),M["wool"],head,12,8)
        oval("Little nostril",hp((side*.039,.132,.725)),(.009,.008,.005),M["eye"],head,12,8)
    for i in range(5):
        curl=rock("Wool forehead curl",hp(((i-2)*.044,.457+math.sin(i)*.012,.512)),(.057,.061,.059),M["wool"],head)
        for face in curl.data.polygons:face.use_smooth=True
    root.location=xyz((x,ground(x,z)-(.035*scale if resting else 0),z));root.rotation_euler.z=yaw;root.scale=(scale,)*3
    return root


for i,args in enumerate(SHEEP):sheep(i,*args)

# Clear spring, a small outlet and a short waterfall embedded into the rock edge.
vertices=[(1.72,.300,1.05)];faces=[]
for i in range(65):
    a=i*math.tau/64;r=1+.035*math.sin(a*5)
    vertices.append((1.72+math.cos(a)*.75*r,.300,1.05+math.sin(a)*.56*r))
    if i<64:faces.append((0,i+1,i+2))
mesh("Clear steppe spring",vertices,faces,M["water"])
v=[];f=[]
for i,(x,z) in enumerate(STREAM):
    width=.18 if i<len(STREAM)-1 else .108
    v.extend([(x-width,.303,z),(x+width,.303,z)])
    if i<len(STREAM)-1:f.append((i*2,i*2+1,i*2+3,i*2+2))
mesh("Spring outlet",v,f,M["water"])
mesh("Small cliffside waterfall",[(2.002,.303,2.39),(2.218,.303,2.39),(2.23,.21,2.52),(2.012,.21,2.52),(2.10,-.75,2.37),(2.245,-.71,2.37),(2.17,-.83,2.35)],[(0,1,2,3),(3,2,5,6,4)],M["water"],smooth=True)
for d in [-.048,.025,.073]:tube("Waterfall silver thread",[(2.11+d,.25,2.5),(2.12+d,-.15,2.49),(2.17+d,-.74,2.386)],.008,M["foam"])
for i in range(11):
    a=i*math.tau/11
    if .85<a<1.63:continue
    x=1.72+math.cos(a)*.74;z=1.05+math.sin(a)*.56
    rock("Spring bank stone",(x,ground(x,z)+.012,z),(.12+rng.random()*.07,.10,.11),M["rock_light"])
for r in [.25,.38]:
    tube("Quiet spring ripple",[(1.67+math.sin(a)*r,.308,1.00+math.cos(a)*r*.48) for a in [.35+i*.065 for i in range(26)]],.005,M["foam"],resolution=1)

# Practical camp details, aligned on the rear meadow and away from animal paths.
for x in [.44,1.40]:
    h=ground(x,-2.25)
    tube("Wooden hitching post",[(x,h,-2.25),(x,h+.74,-2.25)],.037,M["wood"])
    rock("Hitch post foot stone",(x,h-.01,-2.25),(.12,.08,.11),M["rock_light"])
tube("Hitching cross rail",[(.40,ground(.44,-2.25)+.65,-2.25),(1.45,ground(1.40,-2.25)+.65,-2.25)],.032,M["wood"])
for i in range(3):
    y=ground(-2.01,-1.90)+.06+i*.085
    tube("Neat camp firewood",[(-2.31,y,-1.84),(-1.76,y,-1.99)],.046,M["wood"])
for i,(x,z) in enumerate([(.25,.28),(.55,.23)]):
    y=ground(x,z)
    oval("Camp earthenware water vessel",(x,y+.14,z),(.115,.16,.115),M["door"])
    ring("Vessel lip",(x,y+.282,z),.054,.010,M["wood"])

# One sheltered larch gives the rear silhouette height without turning steppe into forest.
tx,tz=2.05,-1.55;ty=ground(tx,tz)
tube("Weathered larch trunk",[(tx,ty,tz),(tx-.09,ty+.85,tz+.05),(tx+.02,ty+1.65,tz-.05),(tx-.06,ty+2.28,tz)],.055,M["wood"])
for i in range(7):
    a=i*2.4;h=.76+i*.18;length=.58-i*.041
    end=(tx+math.sin(a)*length,ty+h+.10,tz+math.cos(a)*length)
    tube("Larch branch",[(tx,ty+h,tz),end],.024 if i<3 else .017,M["wood"])
    rock("Soft larch foliage",(end[0],end[1]+.14,end[2]),(.42-i*.020,.25,.35-i*.017),M["leaf_light" if i%3==0 else "leaf"],subdivisions=1)
rock("Larch crown",(tx-.06,ty+2.04,tz),(.30,.40,.29),M["leaf_light"])
for x,z in [(2.49,-1.63),(2.44,-1.19),(-2.5,.35)]:
    y=ground(x,z)
    for dx,dz,s in [(-.11,0,.23),(.11,.05,.20),(0,-.12,.18)]:
        rock("Sheltered dwarf willow",(x+dx,y+.17,z+dz),(s,.23,s*.85),M["leaf"])


def open_meadow(x,z,margin=0):
    if math.hypot(x-GER[0],z-GER[2])<1.38+margin:return False
    dx,dz=x-GER[0],z-GER[2]
    lx=dx*math.cos(-.07)-dz*math.sin(-.07);lz=dx*math.sin(-.07)+dz*math.cos(-.07)
    if abs(abs(lx)-1.25)<.21+margin and .35<lz<.86:return False
    if -.30<z<1.40 and abs(x+1.0)<.30+margin:return False
    if math.hypot((x-1.72)/.89,(z-1.05)/.67)<1+margin:return False
    if min(segment_distance(x,z,a,b) for a,b in zip(STREAM,STREAM[1:]))<.25+margin:return False
    if .20<x<1.62 and -2.44<z<-2.10:return False
    if math.hypot(x-2.05,z+1.55)<.26+margin:return False
    if math.hypot(x-.25,z-.28)<.23 or math.hypot(x-.55,z-.23)<.24:return False
    for sx,sz,yaw,scale,pose in SHEEP:
        dx,dz=x-sx,z-sz;lx=dx*math.cos(yaw)-dz*math.sin(yaw);lz=dx*math.sin(yaw)+dz*math.cos(yaw)
        if (lx/(scale*.40+margin))**2+((lz-.09*scale)/(scale*.76+margin))**2<1:return False
    return True


# Broad grassy patches and individual seed heads, with clear contact under all props.
grass_v=[[],[],[]];grass_f=[[],[],[]]
for i in range(1700):
    a=rng.random()*math.tau;r=math.sqrt(rng.random())*3.44*edge(a)
    x=math.sin(a)*r;z=math.cos(a)*r*.8
    if not open_meadow(x,z):continue
    y=ground(x,z);group=i%3
    for k in range(3):
        angle=a+k*2.15;h=rng.uniform(.07,.19);w=.019
        dx,dz=math.cos(angle)*w,math.sin(angle)*w
        n=len(grass_v[group]);grass_v[group].extend([(x-dx,y,z-dz),(x+dx,y,z+dz),(x+dx*1.7,y+h,z+dz*1.7)])
        grass_f[group].append((n,n+1,n+2))
for i,key in enumerate(["grass","grass_light","grass_dark"]):mesh("Meadow blade clusters",grass_v[i],grass_f[i],M[key])
for sx,sz,yaw,scale,pose in SHEEP:
    if pose!="graze":continue
    v=[];f=[]
    for i in range(11):
        lx=(i%4-1.5)*.049;lz=.77+(i//4)*.034
        x=sx+(lx*math.cos(yaw)+lz*math.sin(yaw))*scale
        z=sz+(-lx*math.sin(yaw)+lz*math.cos(yaw))*scale;y=ground(x,z)
        k=len(v);v.extend([(x-.009,y,z),(x+.009,y,z),(x+.005,y+.045+rng.random()*.027,z+.012)]);f.append((k,k+1,k+2))
    mesh("Freshly grazed small tufts",v,f,M["grass_light"])
for i in range(46):
    a=i*2.39996;r=2.4+rng.random()*.7;x=math.sin(a)*r;z=math.cos(a)*r*.8
    if not open_meadow(x,z,.1):continue
    y=ground(x,z);h=.18+rng.random()*.13
    tube("Steppe flowering stem",[(x,y,z),(x+.025,y+h,z+.01)],.005,M["grass_dark"])
    for k in range(3):
        color=M["flower"] if i%3==0 else M["straw"]
        rock("Tiny meadow blossom",(x+.025+(k-1)*.026,y+h+math.sin(k)*.016,z+.01),(.036,.026,.029),color)
for i in range(14):
    a=i*2.4;r=3.16;x=math.sin(a)*r;z=math.cos(a)*r*.8
    if not open_meadow(x,z,.12):continue
    rock("Meadow edge pebble",(x,ground(x,z)-.022,z),(.10+rng.random()*.08,.09,.10),M["rock_light"])

# Deterministic support checks run before batching while each authored part exists.
for a in [i*math.tau/24 for i in range(24)]:
    assert abs(ground(GER[0]+math.sin(a)*1.08,GER[2]+math.cos(a)*1.08)-GER[1])<.012,"Ger floor must meet the meadow"
for i,(sx,sz,yaw,scale,pose) in enumerate(SHEEP):
    for lx in [-.17,.17]:
        for lz in [-.265,.25]:
            x=sx+(lx*math.cos(yaw)+lz*math.sin(yaw))*scale
            z=sz+(-lx*math.sin(yaw)+lz*math.cos(yaw))*scale
            assert abs(ground(sx,sz)-ground(x,z))<.012,f"Sheep {i} hoof support"
    head=bpy.data.objects[f"sheep_head_{i}"]
    for angle in [-.485,0,.035]:
        head.rotation_euler.x=angle;bpy.context.view_layer.update()
        for part in head.children:
            for vertex in part.data.vertices:
                p=part.matrix_world@vertex.co
                assert p.z-ground(p.x,-p.y)>-.012,f"Sheep {i} head crosses meadow at {angle}"
    head.rotation_euler.x=0
assert ground(1.72,1.05)<.30,"Spring water must sit above its carved bed"
for x,z in STREAM:assert ground(x,z)<.303,"Stream must sit in its channel"

# Apply mesh rotations before joining so rotated boulder bounds cannot enlarge
# the world framing. Individual animation pivots keep their authored transforms.
bpy.ops.object.select_all(action="DESELECT")
for o in bpy.context.scene.objects:
    if o.type=="MESH":o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)

# Mesh merging respects the individual sheep/head/door pivots.
groups={}
for o in list(bpy.context.scene.objects):
    if o.type=="MESH":
        key=(o.parent,tuple(m.name for m in o.data.materials))
        groups.setdefault(key,[]).append(o)
for (parent,names),objects in groups.items():
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    bpy.context.object.name=f"{parent.name if parent else 'Steppe'}_{names[0]}"
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=str(OUTPUT),export_format="GLB",export_yup=True,export_animations=False,export_cameras=False,export_lights=False)
bpy.context.view_layer.update()
objects=[o for o in bpy.context.scene.objects if o.type=="MESH"]
bounds=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
print("STEPPE",len(objects),"groups",sum(len(o.data.polygons) for o in objects),"faces",OUTPUT.stat().st_size,"bytes")
print("BLENDER BOUNDS",[min(p[i] for p in bounds) for i in range(3)],[max(p[i] for p in bounds) for i in range(3)])

if "--preview" in sys.argv:
    scene=bpy.context.scene;scene.render.engine="BLENDER_EEVEE";scene.eevee.use_gtao=True
    scene.eevee.gtao_distance=3;scene.eevee.gtao_factor=1.05;scene.eevee.taa_render_samples=96
    scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
    scene.render.film_transparent=True;scene.world.use_nodes=True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value=(.75,.83,.85,1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value=.55
    for p,energy,size,color in [((-4,-5,8),750,5,(1,.91,.77)),((5,2,6),650,5,(.77,.86,1)),((0,-7,3),140,4,(.94,1,.91))]:
        bpy.ops.object.light_add(type="AREA",location=p);o=bpy.context.object
        o.data.energy=energy;o.data.shape="DISK";o.data.size=size;o.data.color=color
        o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat("-Z","Y").to_euler()
    bpy.ops.object.camera_add(location=(6,-10,7));camera=bpy.context.object
    camera.data.type="ORTHO";camera.data.ortho_scale=9.3
    camera.rotation_euler=(Vector((0,0,.15))-camera.location).to_track_quat("-Z","Y").to_euler();scene.camera=camera
    scene.render.image_settings.file_format="PNG";scene.render.filepath="/tmp/chingis-steppe-v6.png"
    bpy.ops.render.render(write_still=True)
