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
from mathutils import Vector, Quaternion
from mathutils.geometry import delaunay_2d_cdt

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
    "grass":mat("Steppe_meadow",(.325,.395,.21)),
    "grass_light":mat("Steppe_sunlit_grass",(.405,.455,.255)),
    "grass_dark":mat("Steppe_sage_grass",(.255,.355,.235)),
    "straw":mat("Steppe_seed_heads",(.56,.47,.23)),
    "soil":mat("Steppe_turf_earth",(.31,.285,.20)),
    "path":mat("Steppe_worn_path",(.45,.395,.27)),
    "bank":mat("Steppe_river_silt",(.28,.315,.235)),
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
    "water":mat("Steppe_river_water",(.105,.29,.285),.30,.06),
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


# The landscape is deliberately broad: architecture and animals occupy only
# small sheltered pockets, leaving the rolling steppe and river as the main view.
RADIUS=5.85
DEPTH=.79
GER_SCALE=.72
GER=(-2.13,.43,-.48)
SHEEP=[(-1.08,1.42,.68,.76,"graze"),(.37,-.37,.38,.78,"alert"),
       (.55,2.14,-.28,.56,"lamb")]
PATH=[(-2.06,.39),(-2.15,1.12),(-1.87,2.10),(-.95,2.82),(.22,3.00),(1.02,2.68)]
# x,z,water-height,half-width. The final wider reach forms a natural little pool.
RIVER_CONTROLS=[(1.19,-2.91,.71,.015),(1.41,-2.58,.66,.16),
    (2.01,-2.08,.56,.18),(2.63,-1.56,.43,.19),(2.72,-.86,.34,.215),
    (2.31,-.11,.26,.21),(2.16,.60,.225,.235),(2.45,1.29,.205,.30),
    (2.35,1.93,.190,.47),(1.95,2.48,.186,.60),(1.73,2.87,.186,.38),
    (1.72,3.04,.186,.015)]


def catmull(a,b,c,d,t):
    return tuple(.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t) for k in range(len(a)))


RIVER=[]
for i in range(len(RIVER_CONTROLS)-1):
    a=RIVER_CONTROLS[max(0,i-1)];b=RIVER_CONTROLS[i]
    c=RIVER_CONTROLS[i+1];d=RIVER_CONTROLS[min(len(RIVER_CONTROLS)-1,i+2)]
    for j in range(8):RIVER.append(catmull(a,b,c,d,j/8))
RIVER.append(RIVER_CONTROLS[-1])
RIVER_LENGTH=[0]
for a,b in zip(RIVER,RIVER[1:]):RIVER_LENGTH.append(RIVER_LENGTH[-1]+math.hypot(a[0]-b[0],a[1]-b[1]))


def river_normal(i):
    a=RIVER[max(0,i-1)];b=RIVER[min(len(RIVER)-1,i+1)]
    dx,dz=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dz)
    return (-dz/length,dx/length)


def river_at(x,z):
    best=(1e6,0,0,0);best_edge=1e6
    for i,(a,b) in enumerate(zip(RIVER,RIVER[1:])):
        dx,dz=b[0]-a[0],b[1]-a[1]
        t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)))
        distance=math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)
        width=a[3]+(b[3]-a[3])*t
        if distance-width<best_edge:
            best_edge=distance-width;best=(distance,a[2]+(b[2]-a[2])*t,width,i+t)
    return best


def edge(a):
    def bump(center,width):
        delta=math.atan2(math.sin(a-center),math.cos(a-center))
        return math.exp(-(delta/width)**2)
    return 1+.050*math.sin(a*3+.8)+.032*math.sin(a*7-.3)+.017*math.cos(a*11)+.10*bump(.28,.30)-.13*bump(-1.06,.26)+.07*bump(1.34,.24)-.09*bump(2.38,.24)


def inside(x,z,margin=0):
    a=math.atan2(x,z/DEPTH)
    return math.hypot(x,z/DEPTH)<RADIUS*edge(a)-margin


def segment_distance(x,z,a,b):
    dx,dz=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)))
    return math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)


def terrain_height(x,z):
    # Distant hills belong to the terrain itself; the valley opens toward us.
    h=.24+.08*math.sin(x*.78+z*.3)*math.cos(z*.7)
    h+=1.21*math.exp(-((x+3.28)**2/3.4+(z+2.34)**2/1.4))
    h+=1.61*math.exp(-((x+.80)**2/3.7+(z+3.04)**2/1.15))
    h+=1.03*math.exp(-((x-3.86)**2/2.8+(z+1.93)**2/2.5))
    h+=.15*math.exp(-((x+3.90)**2/1.7+(z-1.45)**2/2.5))
    ger=math.hypot(x-GER[0],z-GER[2])
    if ger<1.12:
        blend=min(1,max(0,(1.12-ger)/.24));h=h*(1-blend)+GER[1]*blend
    distance,level,width,_=river_at(x,z)
    outer=width+.32
    if distance<outer:
        # Smooth damp banks slope into a continuous inset bed. Exact constraints
        # along both shores keep coarse terrain triangles out of the water.
        if distance<=width:
            h=level-.12+.065*(distance/max(.015,width))**2
        else:
            t=min(1,(distance-width)/.32);t=t*t*(3-2*t)
            h=(level-.055)*(1-t)+h*t
    return h


def ground(x,z):
    h=terrain_height(x,z)
    for sx,sz,yaw,scale,pose in SHEEP:
        dx,dz=x-sx,z-sz
        lx=dx*math.cos(yaw)-dz*math.sin(yaw);lz=dx*math.sin(yaw)+dz*math.cos(yaw)
        distance=math.hypot(lx/(scale*.48),lz/(scale*.86))
        if distance<1.2:
            blend=min(1,(1.2-distance)/.25)
            h=h*(1-blend)+terrain_height(sx,sz)*blend
    return h


# Constrained triangulation puts the riverbed, shoreline and hoof patches into
# the topography instead of covering a coarse, intersecting lawn with planes.
N=112
boundary=[]
for i in range(N):
    a=i*math.tau/N;r=RADIUS*edge(a)
    boundary.append((math.sin(a)*r,math.cos(a)*r*DEPTH))
points=list(boundary);constraints=[(i,(i+1)%N) for i in range(N)]
for iz in range(-15,16):
    for ix in range(-20,21):
        x=ix*.30+(.15 if iz%2 else 0);z=iz*.30
        if inside(x,z,.09):points.append((x,z))
for factor in [-1.8,-1.22,-1.0,-.55,0,.55,1.0,1.22,1.8]:
    start=len(points)
    for i,(x,z,y,width) in enumerate(RIVER):
        nx,nz=river_normal(i)
        offset=width*factor if abs(factor)<=1 else math.copysign(width+(abs(factor)-1)*.32,factor)
        points.append((x+nx*offset,z+nz*offset))
        if i:constraints.append((start+i-1,start+i))
for sx,sz,yaw,scale,pose in SHEEP:
    for lx in [-.30,-.17,0,.17,.30]:
        for lz in [-.4,-.265,0,.25,.45]:
            points.append((sx+(lx*math.cos(yaw)+lz*math.sin(yaw))*scale,sz+(-lx*math.sin(yaw)+lz*math.cos(yaw))*scale))
# Clockwise authoring coordinates become CCW Blender X/Y coordinates after xyz.
verts2,_,faces,_,_,_=delaunay_2d_cdt([Vector(p) for p in points],constraints,[list(reversed(range(N)))],1,.00001)
land=mesh("Continuous rolling steppe",[(p.x,ground(p.x,p.y),p.y) for p in verts2],faces,M["grass"],smooth=True)
# A vertex-painted shore gives a continuous silt-to-meadow transition rather
# than a serrated boundary made from differently colored terrain triangles.
terrain_material=mat("Steppe_meadow_terrain",(1,1,1))
color_node=terrain_material.node_tree.nodes.new("ShaderNodeVertexColor")
color_node.layer_name="Steppe ground tint"
terrain_material.node_tree.links.new(color_node.outputs["Color"],terrain_material.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])
land.data.materials.clear();land.data.materials.append(terrain_material)
colors=land.data.color_attributes.new(name="Steppe ground tint",type="FLOAT_COLOR",domain="CORNER")
for poly in land.data.polygons:
    center=poly.center;x,z=center.x,-center.y
    patch=math.sin(x*.64+z*.35)+math.cos(z*.88-x*.28)
    grass=M["grass_light" if patch>.85 else "grass_dark" if patch<-.95 else "grass"].diffuse_color
    bank=M["bank"].diffuse_color
    for li in poly.loop_indices:
        point=land.data.vertices[land.data.loops[li].vertex_index].co
        distance,_,width,_=river_at(point.x,-point.y)
        blend=max(0,min(1,(width+.26-distance)/.23))
        blend=blend*blend*(3-2*blend)
        colors.data[li].color=tuple(grass[k]*(1-blend)+bank[k]*blend for k in range(3))+(1,)

# A thin ochre turf seam, then fractured slate strata. No tall cylindrical soil wall.
profiles=[(1,0),(1.003,-.065),(.986,-.27),(.94,-.57),(.82,-.96),(.66,-1.30),(.40,-1.59),(.12,-1.70)]
v=[];f=[]
for j,(scale,depth) in enumerate(profiles):
    for i in range(N):
        a=i*math.tau/N;r=RADIUS*edge(a)*scale
        if j>1:r+=.14*math.sin(a*7+j*1.3)+.065*math.sin(a*13-j)
        x=math.sin(a)*r+.06*math.sin(j);z=math.cos(a)*r*DEPTH
        y=ground(*boundary[i])-.012 if j==0 else ground(*boundary[i])*.45+depth if j<3 else depth+.12*math.sin(a*4+j)+.07*math.cos(a*9)
        v.append((x,y,z))
        if j<len(profiles)-1:
            k=j*N+i;kn=j*N+(i+1)%N
            f.extend([(k,kn,k+N),(kn,kn+N,k+N)])
f.append(tuple((len(profiles)-1)*N+i for i in range(N)))
cliff=mesh("Fractured slate strata",v,f,M["soil"])
for key in ["rock_light","rock","rock_dark"]:cliff.data.materials.append(M[key])
for poly in cliff.data.polygons:
    band=poly.index//(N*2)
    poly.material_index=0 if band==0 else 1 if (poly.index//3+band)%7<2 and band<4 else 3 if band>4 else 2

# Natural rock outcrops continue the same geology onto the distant hills.
for cx,cz,size in [(-3.80,-2.34,.70),(-.70,-3.28,.77),(.12,-3.02,.48),(3.85,-1.83,.65),(-4.65,.42,.46)]:
    for j in range(3):
        x=cx+(j-1)*size*.44;z=cz+math.sin(j*2)*size*.22
        rock("Weathered steppe outcrop",(x,ground(x,z)+size*.12,z),(size*(.68+.12*j),size*(.38+.04*j),size*.53),M["rock_light" if j==1 else "rock"])

# Long low stone shelves distinguish the far hill layers from the grassy basin.
for x,z,rx,rz in [(-3.80,-2.55,.85,.30),(-.80,-3.45,.96,.37),(-.36,-3.13,.75,.30),(3.97,-2.06,.71,.36)]:
    rock("Ridgeline stone shelf",(x,ground(x,z)+.015,z),(rx,.15,rz),M["rock_light"])

# Little ger: original felt shell and real seams; the carved door has a hinge pivot.
ger=pivot("ger")
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
    gx=GER[0]+GER_SCALE*(px*math.cos(-.07)+pz*math.sin(-.07))
    gz=GER[2]+GER_SCALE*(-px*math.sin(-.07)+pz*math.cos(-.07))
    py=(ground(gx,gz)-GER[1])/GER_SCALE
    tube("Ger guy rope",[(side*.91,.78,.43),(side*1.12,.43,.57),(px,py+.045,pz)],.011,M["stitch"],ger)
    tube("Ger ground peg",[(px,py-.035,pz),(px-.02*side,py+.16,pz)],.022,M["wood"],ger)
# All ger geometry above was made in local coordinates; put that group on its rise.
ger.location=(0,0,0);ger.matrix_world.translation=(0,0,0)
for child in ger.children:
    child.matrix_parent_inverse.identity()
ger.location=xyz(GER)
ger.rotation_euler.z=-.07
ger.scale=(GER_SCALE,)*3

# The worn path has its own continuous contour, raycast to the actual terrain.
# This avoids pixel-like triangle material steps or a flat strip cutting hills.
from mathutils.bvhtree import BVHTree
land_bvh=BVHTree.FromPolygons([land.matrix_world@v.co for v in land.data.vertices],[tuple(p.vertices) for p in land.data.polygons])
path_points=[]
for i in range(len(PATH)-1):
    for j in range(10):path_points.append(catmull(PATH[max(0,i-1)],PATH[i],PATH[i+1],PATH[min(len(PATH)-1,i+2)],j/10))
path_points.append(PATH[-1])
pv=[];pf=[]
for i,(x,z) in enumerate(path_points):
    a=path_points[max(0,i-1)];b=path_points[min(len(path_points)-1,i+1)]
    dx,dz=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dz)
    width=.075+.018*math.sin(i*.27)**2
    if i>len(path_points)-6:width*=max(.06,(len(path_points)-i)/6)
    for side in [-1,1]:
        px=x-dz/length*width*side;pz=z+dx/length*width*side
        hit,_,_,_=land_bvh.ray_cast(Vector((px,-pz,8)),Vector((0,0,-1)),20)
        assert hit is not None,"Path support"
        pv.append((px,hit.z+.009,pz))
    if i<len(path_points)-1:pf.append((i*2,i*2+1,i*2+3,i*2+2))
mesh("Winding worn footpath",pv,pf,M["path"],smooth=True)

# A couple of weathered stones at the threshold; the narrow footpath simply
# wears into the topography and winds toward the river.
for x,z in [(-2.04,.49),(-2.08,.73)]:
    rock("Worn entry stepping stone",(x,ground(x,z)+.012,z),(.15,.023,.09),M["rock_light"])


def sheep(index,x,z,yaw,scale,pose):
    root=pivot(f"sheep_{index}")
    body=pivot(f"sheep_body_{index}",(0,.48,0),root)
    oval("Soft sheep body",(0,.48,0),(.30,.265,.43),M["wool"],body)
    for i in range(38):
        angle=i*2.399963;v=1-2*(i+.5)/38;rr=math.sqrt(1-v*v)
        p=(math.cos(angle)*rr*.274,.48+v*.228,math.sin(angle)*rr*.394)
        size=.077+rng.random()*.02
        curl=rock("Soft sculpted wool",p,(size,size*.86,size),M["wool"],body)
        for face in curl.data.polygons:face.use_smooth=True
    for side,lx in [("left",-.17),("right",.17)]:
        for which,lz in [("back",-.265),("front",.25)]:
            leg=pivot(f"sheep_leg_{index}_{which}_{side}",(lx,.31,lz),root)
            tube("Short sheep leg",[(lx,.325,lz),(lx,.068,lz+.015)],.037,M["face"],leg)
            oval("Sheep hoof",(lx,.047,lz+.025),(.050,.047,.062),M["face"],leg)
    tail=pivot(f"sheep_tail_{index}",(0,.48,-.39),root)
    oval("Wool tail",(0,.48,-.45),(.068,.082,.115),M["wool"],tail)
    oval("Soft connected sheep neck",(0,.37,.33),(.12,.13,.13),M["face"],root)
    head=pivot(f"sheep_head_{index}",(0,.355,.355),root)
    angle=0 if pose=="graze" else -.67 if pose=="alert" else -.45
    def hp(p):
        px,py,pz=p;dy=py-.355;dz=pz-.355
        return (px,.355+dy*math.cos(angle)-dz*math.sin(angle),.355+dy*math.sin(angle)+dz*math.cos(angle))
    oval("Gentle sheep face",hp((0,.316,.497)),(.146,.173,.157),M["face"],head)
    oval("Connected rounded nose bridge",hp((0,.211,.590)),(.105,.118,.105),M["face"],head)
    jaw=pivot(f"sheep_jaw_{index}",hp((0,.160,.575)),head)
    oval("Grazing sheep muzzle",hp((0,.131,.637)),(.110,.080,.100),M["face"],jaw)
    for side,name in [(-1,"left"),(1,"right")]:
        ear=pivot(f"sheep_ear_{index}_{name}",hp((side*.135,.410,.46)),head)
        oval("Floppy wool ear",hp((side*.203,.410,.46)),(.117,.034,.061),M["wool"],ear)
        oval("Warm inner ear",hp((side*.225,.422,.467)),(.076,.011,.04),M["ear"],ear)
        oval("Kind eye white",hp((side*.105,.328,.606)),(.030,.033,.015),M["wool"],head)
        oval("Kind eye",hp((side*.109,.324,.622)),(.015,.020,.009),M["eye"],head)
        oval("Eye catchlight",hp((side*.109-.005,.334,.630)),(.005,.007,.003),M["wool"],head,12,8)
        oval("Little nostril",hp((side*.039,.132,.725)),(.009,.008,.005),M["eye"],jaw,12,8)
    for j in range(5):
        curl=rock("Wool forehead curl",hp(((j-2)*.044,.457+math.sin(j)*.012,.512)),(.055,.059,.057),M["wool"],head)
        for face in curl.data.polygons:face.use_smooth=True
    root.location=xyz((x,ground(x,z),z));root.rotation_euler.z=yaw;root.scale=(scale,)*3
    return root


for i,args in enumerate(SHEEP):sheep(i,*args)

# One connected, inset ribbon follows the riverbed into a little natural pool.
# UV u runs bank to bank [0,1], v is cumulative authored stream length.
water_vertices=[];water_faces=[];water_uv=[]
CROSS=8
for i,(x,z,level,width) in enumerate(RIVER):
    nx,nz=river_normal(i)
    for j in range(CROSS+1):
        u=j/CROSS;offset=(u*2-1)*width
        water_vertices.append((x+nx*offset,level,z+nz*offset))
        water_uv.append((u,RIVER_LENGTH[i]))
        if i<len(RIVER)-1 and j<CROSS:
            k=i*(CROSS+1)+j
            water_faces.append((k,k+1,k+CROSS+2,k+CROSS+1))
water=mesh("Steppe_water_surface",water_vertices,water_faces,M["water"],smooth=True)
uv=water.data.uv_layers.new(name="River current coordinates")
for poly in water.data.polygons:
    for li in poly.loop_indices:uv.data[li].uv=water_uv[water.data.loops[li].vertex_index]

# Banks are mostly open silty slopes. A few irregular stone groups describe
# outside bends and the spring, avoiding a ring of identical pond pebbles.
for i,side in [(4,-1),(7,1),(14,1),(18,1),(29,-1),(31,-1),(45,1),(60,-1),(66,-1),(77,1)]:
    x,z,y,width=RIVER[i];nx,nz=river_normal(i)
    for j in range(2 if i%3 else 3):
        offset=(width+.105+j*.07)*side
        px=x+nx*offset+.09*math.sin(j*2.3);pz=z+nz*offset+.09*math.cos(j*2.3)
        size=.10+j*.035
        rock("River weathered bank stone",(px,ground(px,pz)+size*.19,pz),(size*1.5,size*.65,size),M["rock_light" if j%2 else "rock"])
for x,z,size in [(1.16,-2.92,.28),(1.55,-2.91,.25)]:
    rock("Sheltered spring rock",(x,ground(x,z)+size*.15,z),(size,size*.8,size*.83),M["rock_light"])

# A modest larch pair on the far left ridge lends depth without crowding the ger.
for tx,tz,scale in [(-3.39,-1.65,.74),(-3.85,-1.42,.43)]:
    ty=ground(tx,tz)
    tube("Steppe larch trunk",[(tx,ty,tz),(tx-.06*scale,ty+.85*scale,tz),(tx,ty+1.64*scale,tz)],.035*scale,M["wood"])
    for j in range(5):
        angle=j*2.4;h=.50+j*.23;length=(.47-j*.055)*scale
        end=(tx+math.sin(angle)*length,ty+(h+.10)*scale,tz+math.cos(angle)*length)
        tube("Larch branch",[(tx,ty+h*scale,tz),end],.014*scale,M["wood"])
        rock("Larch foliage",(end[0],end[1]+.12*scale,end[2]),((.38-j*.028)*scale,.23*scale,(.30-j*.018)*scale),M["leaf_light" if j%3==0 else "leaf"])
    rock("Larch crown",(tx,ty+1.62*scale,tz),(.22*scale,.32*scale,.23*scale),M["leaf_light"])


def open_meadow(x,z,margin=0):
    if not inside(x,z,.13+margin):return False
    if math.hypot(x-GER[0],z-GER[2])<1.01+margin:return False
    distance,_,width,_=river_at(x,z)
    if distance<width+.19+margin:return False
    if min(segment_distance(x,z,a,b) for a,b in zip(PATH,PATH[1:]))<.19+margin:return False
    for sx,sz,yaw,scale,pose in SHEEP:
        dx,dz=x-sx,z-sz;lx=dx*math.cos(yaw)-dz*math.sin(yaw);lz=dx*math.sin(yaw)+dz*math.cos(yaw)
        if (lx/(scale*.43+margin))**2+((lz-.07*scale)/(scale*.78+margin))**2<1:return False
    return True


# Meadow growth occurs in broad patches, with deliberately clear grazing ground
# and large areas of calm terrain between them. No repeated, uniformly dense lawn.
grass_v=[[],[],[]];grass_f=[[],[],[]]
patches=[(-4.6,-1.9,.45),(-4.3,.8,.55),(-3.7,2.7,.47),(-2.75,3.55,.5),(-.8,3.7,.43),
    (1,3.45,.28),(3.05,2.95,.39),(4.35,1.7,.42),(4.5,-.1,.5),(3.6,-2.8,.4),
    (.4,-3.7,.48),(-2.3,-3.0,.36),(-3.1,-.2,.28),(.5,.85,.23),(.7,-1.9,.33)]
for px,pz,radius in patches:
    for j in range(32):
        angle=rng.random()*math.tau;r=math.sqrt(rng.random())*radius
        x=px+math.sin(angle)*r;z=pz+math.cos(angle)*r
        if not open_meadow(x,z):continue
        y=ground(x,z);group=j%3
        for k in range(3):
            a=angle+k*2.15;h=rng.uniform(.06,.13);w=.012
            dx,dz=math.cos(a)*w,math.sin(a)*w
            n=len(grass_v[group]);grass_v[group].extend([(x-dx,y,z-dz),(x+dx,y,z+dz),(x+dx*2.1,y+h,z+dz*2.1)])
            grass_f[group].append((n,n+1,n+2))
for i,key in enumerate(["grass_light","grass_dark","straw"]):mesh("Sparse steppe tussocks",grass_v[i],grass_f[i],M[key])
# Taller golden seed heads cluster only near banks and sheltered outcrops.
for i in range(32):
    px,pz,radius=patches[i%len(patches)];x=px+rng.uniform(-radius,radius);z=pz+rng.uniform(-radius,radius)
    if not open_meadow(x,z,.04):continue
    y=ground(x,z);h=rng.uniform(.13,.22)
    tube("Dry steppe seed stem",[(x,y,z),(x+.026,y+h,z+.013)],.004,M["grass_dark"])
    rock("Golden seed head",(x+.026,y+h,z+.013),(.019,.045,.014),M["straw"])
for x,z,r in [(-3.62,-1.21,.18),(-3.77,-1.05,.15),(3.2,-1.75,.17),(3.41,-1.6,.15),(-4.02,2.14,.14)]:
    rock("Low sheltered willow",(x,ground(x,z)+r*.4,z),(r,r*.7,r*.9),M["leaf"])
# A close nibbling patch belongs only to the grazer's reach.
sx,sz,yaw,scale,_=SHEEP[0]
for i in range(9):
    lx=(i%3-1)*.034;lz=.77+(i//3)*.031
    x=sx+(lx*math.cos(yaw)+lz*math.sin(yaw))*scale
    z=sz+(-lx*math.sin(yaw)+lz*math.cos(yaw))*scale;y=ground(x,z)
    mesh("Fresh grazing grass",[(x-.006,y,z),(x+.006,y,z),(x+.01,y+.037,z+.008)],[(0,1,2)],M["grass_light"])

# Deterministic support checks run before batching while authored parts exist.
for a in [i*math.tau/24 for i in range(24)]:
    assert abs(ground(GER[0]+math.sin(a)*1.08*GER_SCALE,GER[2]+math.cos(a)*1.08*GER_SCALE)-GER[1])<.012,"Ger floor must meet meadow"
for i,(sx,sz,yaw,scale,pose) in enumerate(SHEEP):
    root=bpy.data.objects[f"sheep_{i}"]
    bpy.context.view_layer.update()
    # Check actual exported-surface contact, not just the analytic heightfield.
    for part in root.children_recursive:
        if part.type!="MESH" or not part.name.startswith("Sheep hoof"):continue
        bottom=min((part.matrix_world@v.co for v in part.data.vertices),key=lambda v:v.z)
        hit,_,_,_=land_bvh.ray_cast(Vector((bottom.x,bottom.y,8)),Vector((0,0,-1)),20)
        assert hit is not None and abs(bottom.z-hit.z)<.0015,f"Sheep {i} hoof contact"
    head=bpy.data.objects[f"sheep_head_{i}"]
    jaw=bpy.data.objects[f"sheep_jaw_{i}"]
    head.rotation_mode="QUATERNION";jaw.rotation_mode="QUATERNION"
    pitch_limits=[(-.43,.03),(-.16,.05),(-.22,.025)][i]
    yaw_limit=[.12,.16,.06][i]
    minimum=10
    for pitch in [pitch_limits[0],0,pitch_limits[1]]:
        for yaw_offset in [-yaw_limit,0,yaw_limit]:
            head.rotation_quaternion=Quaternion((1,0,0),pitch)@Quaternion((0,0,1),yaw_offset)
            jaw.rotation_quaternion=Quaternion((1,0,0),.011 if i==0 else 0)@Quaternion((0,0,1),math.copysign(.027,yaw_offset) if i==0 else 0)
            bpy.context.view_layer.update()
            for part in head.children_recursive:
                if part.type!="MESH":continue
                for vertex in part.data.vertices:
                    pt=part.matrix_world@vertex.co
                    hit,_,_,_=land_bvh.ray_cast(Vector((pt.x,pt.y,8)),Vector((0,0,-1)),20)
                    assert hit is not None,f"Sheep {i} head outside landscape"
                    clearance=pt.z-hit.z;minimum=min(minimum,clearance)
                    assert clearance>.020,f"Sheep {i} head crosses meadow at {pitch},{yaw_offset}"
    head.rotation_quaternion=Quaternion();jaw.rotation_quaternion=Quaternion()
    print(f"SHEEP {i} combined head/jaw/terrain clearance {minimum:.6f}")
for i,(x,z,level,width) in enumerate(RIVER):
    nx,nz=river_normal(i)
    for u in [-1,-.5,0,.5,1]:
        assert ground(x+nx*width*u,z+nz*width*u)<level-.025,"River must clear inset bed"

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
    bpy.context.object.name="Steppe_water_surface" if names[0]=="Steppe_river_water" else f"{parent.name if parent else 'Steppe'}_{names[0]}"
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
    bpy.ops.object.camera_add(location=(8,-13,10));camera=bpy.context.object
    camera.data.type="ORTHO";camera.data.ortho_scale=14.4
    camera.rotation_euler=(Vector((0,0,.15))-camera.location).to_track_quat("-Z","Y").to_euler();scene.camera=camera
    scene.render.image_settings.file_format="PNG";scene.render.filepath=f"/tmp/chingis-steppe-v{VERSION}.png"
    bpy.ops.render.render(write_still=True)
