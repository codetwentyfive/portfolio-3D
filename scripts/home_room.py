"""Photo-informed living-room model. Geometry is authored, not a photo billboard."""
import math

import bpy
import numpy as np


def build(g):
    g.clear()
    root = g.ROOT / "assets/home-room"
    root.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(2509)

    def image(name, rgb, color_space="sRGB"):
        height, width = rgb.shape[:2]
        picture = bpy.data.images.new(name, width=width, height=height, alpha=False)
        picture.colorspace_settings.name = color_space
        rgba = np.concatenate((np.clip(rgb, 0, 1), np.ones((height, width, 1))), axis=2)
        picture.pixels.foreach_set(rgba.astype(np.float32).ravel())
        picture.filepath_raw = str(root / f"{name}.png")
        picture.file_format = "PNG"
        picture.save()
        picture.pack()
        return picture

    def surface(name, picture, rough=.65):
        material = g.mat(name, (1, 1, 1), rough)
        node = material.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = picture
        material.node_tree.links.new(node.outputs["Color"], material.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])
        return material

    y, x = np.mgrid[0:256, 0:512].astype(float)
    warp = 1.8*np.sin(y*.025) + .8*np.sin(y*.071) + .12*np.sin(x*.065+y*.044)
    grain = .86 + .08*np.sin(x*.52+warp) + .035*np.sin(x*2.35+warp*2)
    grain += rng.normal(0, .012, grain.shape)
    woods = []
    for name, color, rough in [
        ("walnut", (.27,.135,.067), .43),
        ("oak", (.47,.285,.135), .48),
        ("rosewood", (.20,.075,.046), .44),
    ]:
        woods.append(surface(f"Room {name}", image(name, grain[...,None]*np.array(color)), rough))
    walnut, oak, rosewood = woods
    normal = np.zeros((256,512,3))
    normal[:,:,0] = .5-np.gradient(grain,axis=1)*.4
    normal[:,:,1] = .5-np.gradient(grain,axis=0)*.4
    normal[:,:,2] = 1
    grain_normal = image("wood-normal", normal, "Non-Color")
    for material in woods:
        nodes, links = material.node_tree.nodes, material.node_tree.links
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = grain_normal
        bump = nodes.new("ShaderNodeNormalMap")
        bump.inputs["Strength"].default_value = .24
        links.new(texture.outputs["Color"], bump.inputs["Color"])
        links.new(bump.outputs["Normal"], nodes.get("Principled BSDF").inputs["Normal"])
    weave_y, weave_x = np.mgrid[0:256,0:256]
    weave = .9+.055*np.sin(weave_x*math.pi/2)+.035*np.sin(weave_y*math.pi/2)
    velvet = surface("Room burgundy upholstery", image("upholstery", weave[...,None]*np.array([.35,.052,.069])), .93)
    plaster = .97+rng.normal(0,.008,(256,256))
    wall = surface("Room warm plaster", image("plaster", plaster[...,None]*np.array([.70,.655,.555])), .97)
    black = g.mat("Room satin graphite", (.018,.022,.021), .35, .18)
    grille = surface("Room speaker weave", image("speaker-cloth", weave[...,None]*np.array([.036,.039,.037])), .96)
    steel = g.mat("Room brushed hardware", (.25,.28,.27), .32, .75)
    aluminum = g.mat("Room Mac mini aluminum", (.67,.70,.72), .29, .72)
    spark_gold = g.mat("Room DGX Spark champagne", (.48,.33,.15), .32, .68)
    brass = g.mat("Room aged brass", (.49,.32,.11), .28, .78)
    ivory = g.mat("Room glazed porcelain", (.76,.73,.65), .21)
    blue = g.mat("Room porcelain cobalt", (.018,.038,.09), .25)
    leaf_dark = g.mat("Room deep green foliage", (.028,.105,.038), .46)
    leaf_light = g.mat("Room variegated foliage", (.09,.19,.045), .53)
    clay = g.mat("Room glazed olive planter", (.21,.235,.15), .31)
    glass = g.mat("Room cabinet glass", (.31,.36,.32), .12)
    glass.node_tree.nodes.get("Principled BSDF").inputs["Alpha"].default_value = .13
    glass.blend_method = "BLEND"
    glass.use_screen_refraction = True
    glass.use_backface_culling = True
    posters = surface("Room framed prints", bpy.data.images.load(str(root/"wall-prints.jpg")), .93)
    still = bpy.data.images.load(str(root/"matrix-still.png"))
    screen = surface("Room OLED screen", still, .24)
    s = screen.node_tree.nodes.get("Principled BSDF")
    texture = next(n for n in screen.node_tree.nodes if n.type=="TEX_IMAGE")
    screen.node_tree.links.new(texture.outputs["Color"], s.inputs["Emission Color"])
    s.inputs["Emission Strength"].default_value = .85

    def face(name, p, width, height, material, u0=0, u1=1):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata([g.xyz((p[0]+dx,p[1]+dy,p[2])) for dx,dy in [
            (-width/2,-height/2),(width/2,-height/2),(width/2,height/2),(-width/2,height/2),
        ]], [], [(0,1,2,3)])
        uv=mesh.uv_layers.new(name="Surface UV")
        for loop,coord in zip(uv.data,[(u0,0),(u1,0),(u1,1),(u0,1)]): loop.uv=coord
        mesh.update()
        obj=bpy.data.objects.new(name,mesh)
        bpy.context.collection.objects.link(obj)
        g.finish(obj,name,material)
        return obj

    def lathe(name, p, profile, material, segments=24):
        verts=[g.xyz((p[0]+r*math.cos(a*math.tau/segments),p[1]+h,p[2]+r*math.sin(a*math.tau/segments))) for h,r in profile for a in range(segments)]
        faces=[(j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i) for j in range(len(profile)-1) for i in range(segments)]
        mesh=bpy.data.meshes.new(name)
        mesh.from_pydata(verts,[],faces)
        mesh.update()
        for polygon in mesh.polygons: polygon.use_smooth=True
        obj=bpy.data.objects.new(name,mesh)
        bpy.context.collection.objects.link(obj)
        return g.finish(obj,name,material)

    def leaf(name, base, end, width, material):
        a,b=g.xyz(base),g.xyz(end)
        axis=(b-a).normalized()
        side=axis.cross(g.xyz((0,0,1)))
        if side.length<.1: side=axis.cross(g.xyz((1,0,0)))
        side.normalize()
        vertices=[]
        for i in range(7):
            t=i/6
            center=a.lerp(b,t)+g.xyz((0,0,math.sin(t*math.pi)*width*.45))
            spread=math.sin(t*math.pi)**.75*width
            vertices.extend([center-side*spread,center+g.xyz((0,.012,0)),center+side*spread])
        faces=[]
        for i in range(6):
            for j in range(2): faces.append((i*3+j,(i+1)*3+j,(i+1)*3+j+1,i*3+j+1))
        mesh=bpy.data.meshes.new(name)
        mesh.from_pydata(vertices,[],faces)
        mesh.update()
        for polygon in mesh.polygons: polygon.use_smooth=True
        obj=bpy.data.objects.new(name,mesh)
        bpy.context.collection.objects.link(obj)
        g.finish(obj,name,material)

    def pot(p, radius=.16, height=.24, material=clay):
        lathe("Ceramic planter",p,[(0,radius*.68),(.025,radius*.8),(height*.88,radius),(height,radius),(height,radius*.89),(height-.025,radius*.89)],material)
        g.rod("Potting soil",(p[0],p[1]+height-.03,p[2]),(p[0],p[1]+height-.025,p[2]),radius*.85,walnut)

    def trailing_plant(p, scale=1):
        pot(p,.16*scale,.23*scale)
        # Carry every stem over the front of the cornice before it drops.
        # Radial vines used to pass through the cabinet top and the adjacent urn.
        for vine in range(5):
            spread=(vine-2)*.082*scale
            drop=(.37+.055*(vine%3))*scale
            points=[(p[0],p[1]+.20*scale,p[2]),
                    (p[0]+spread*.5,p[1]+.32*scale,p[2]+.14*scale),
                    (p[0]+spread,p[1]+.17*scale,p[2]+.39*scale)]
            for i in range(6):
                t=i/5
                q=(p[0]+spread+math.sin(t*math.pi)*.018*scale,
                   p[1]+.12*scale-t*drop,p[2]+(.43+t*.05)*scale)
                points.append(q)
                side=1 if i%2 else -1
                leaf("Pothos leaf",q,(q[0]+side*.07*scale,q[1]-.085*scale,q[2]+.075*scale),.043*scale,leaf_light if i%3==0 else leaf_dark)
            g.cable("Trailing vine",points,.007*scale,leaf_dark)

    def speaker(p, scale=1):
        x,y,z=p
        g.box("Monitor speaker cabinet",p,(.34*scale,.59*scale,.29*scale),black,.018)
        face("Woven speaker baffle",(x,y,z+.15*scale),.30*scale,.55*scale,grille)
        g.rod("Woofer cone",(x,y-.085*scale,z+.155*scale),(x,y-.085*scale,z+.165*scale),.116*scale,black,vertices=32)
        g.ring("Woofer surround",(x,y-.085*scale,z+.17*scale),.12*scale,.013*scale,black,"z")
        g.sphere("Speaker dust cap",(x,y-.085*scale,z+.176*scale),(.055*scale,.055*scale,.018*scale),black)
        g.box("Ribbon tweeter recess",(x,y+.17*scale,z+.158*scale),(.11*scale,.085*scale,.009),black,.004)
        for i in range(8): g.box("Ribbon tweeter fold",(x-.043*scale+i*.012*scale,y+.17*scale,z+.166*scale),(.005*scale,.065*scale,.008),brass,.001)

    def device_shell(name, p, width, height, depth, radius, material):
        # Rounded plan corners with a much smaller top-edge bevel than a soft cube.
        outline = []
        for sx, sz, start in [(1,1,0),(-1,1,90),(-1,-1,180),(1,-1,270)]:
            for i in range(9):
                angle = math.radians(start+i*90/8)
                outline.append((sx*(width/2-radius)+radius*math.cos(angle),
                                sz*(depth/2-radius)+radius*math.sin(angle)))
        n = len(outline)
        vertices = [g.xyz((p[0]+x,p[1]+y,p[2]+z)) for y in [-height/2,height/2] for x,z in outline]
        faces = [tuple(range(n)),tuple(range(2*n-1,n-1,-1))]
        faces += [(i,n+i,n+(i+1)%n,(i+1)%n) for i in range(n)]
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices,[],faces)
        mesh.update()
        for polygon in mesh.polygons: polygon.use_smooth = len(polygon.vertices)==4
        obj = bpy.data.objects.new(name,mesh)
        bpy.context.collection.objects.link(obj)
        bpy.context.view_layer.objects.active = obj
        bevel = obj.modifiers.new("Precision lid edge","BEVEL")
        bevel.width = .003
        bevel.segments = 2
        bevel.limit_method = "ANGLE"
        bpy.ops.object.modifier_apply(modifier=bevel.name)
        return g.finish(obj,name,material)

    def power_lead(name, points, radius):
        # These thin rear wires are hidden by the furniture. Eight-sided tubing
        # and fewer path samples retain their route without ornamental tessellation.
        curve=bpy.data.curves.new(name,"CURVE")
        curve.dimensions="3D"
        curve.resolution_u=3
        curve.bevel_depth=radius
        curve.bevel_resolution=1
        spline=curve.splines.new("BEZIER")
        spline.bezier_points.add(len(points)-1)
        for point,p in zip(spline.bezier_points,points):
            point.co=g.xyz(p)
            point.handle_left_type=point.handle_right_type="AUTO"
        bpy.ops.object.select_all(action="DESELECT")
        obj=bpy.data.objects.new(name,curve)
        bpy.context.collection.objects.link(obj)
        obj.select_set(True)
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.convert(target="MESH")
        return g.finish(obj,name,black)

    def mac_mini(x, shelf, z):
        # M4-era proportions, slightly enlarged with the other miniature electronics.
        width, height = .36, .142
        g.rod("Mac mini recessed foot",(x,shelf,z),(x,shelf+.012,z),.132,black,vertices=32)
        device_shell("Mac mini unibody",(x,shelf+.078,z),width,height-.012,width,.049,aluminum)
        front, back = z+width/2+.001, z-width/2-.002
        for dx in [-.080,-.022]:
            g.box("Mac mini front USB-C",(x+dx,shelf+.078,front),(.026,.010,.003),black,.004)
        g.rod("Mac mini headphone socket",(x+.065,shelf+.078,front),(x+.065,shelf+.078,front+.002),.0065,black,vertices=12)
        g.sphere("Mac mini white status light",(x+.122,shelf+.078,front),(.003,.003,.002),ivory)
        for dx in [-.028,.026,.080]:
            g.box("Mac mini rear Thunderbolt",(x+dx,shelf+.070,back),(.024,.009,.004),black,.003)
        g.box("Mac mini rear Ethernet",(x-.114,shelf+.073,back),(.030,.025,.004),black,.002)
        g.box("Mac mini rear HDMI",(x-.067,shelf+.070,back),(.032,.009,.004),black,.002)
        g.rod("Mac mini underside power button",(x-.108,shelf+.010,z-.095),(x-.108,shelf+.012,z-.095),.012,black,vertices=12)
        power_lead("Mac mini rear power lead",[(x+.13,shelf+.065,back),(x+.15,shelf+.045,back-.10),(x+.15,shelf+.025,-.965),(x+.15,.255,-1.035)],.004)

    def dgx_spark(x, shelf, z):
        width, height = .425, .143
        device_shell("DGX Spark rubber base",(x,shelf+.008,z),.39,.016,.39,.025,black)
        device_shell("DGX Spark vented chassis",(x,shelf+.075,z),width,height-.016,width,.030,spark_gold)
        device_shell("DGX Spark dark top",(x,shelf+height-.008,z),.404,.014,.404,.026,black)
        front, back = z+width/2+.001, z-width/2-.003
        g.box("DGX Spark inset intake",(x,shelf+.075,front),(.362,.095,.003),black,.004)
        # A restrained diagonal lattice reads as ventilation without thousands of holes.
        for direction in [-1,1]:
            for i in range(16):
                dx=-.171+i*.021
                g.rod("DGX Spark diagonal grille",(x+dx,shelf+.035,front+.002),(x+dx+direction*.032,shelf+.112,front+.002),.0025,spark_gold,vertices=6)
        g.box("DGX Spark badge",(x+.111,shelf+.081,front+.006),(.094,.033,.003),black,.002)
        g.label("DGX Spark wordmark","DGX",(x+.111,shelf+.072,front+.009),.023,ivory)
        g.sphere("DGX Spark status light",(x-.16,shelf+.121,front+.003),(.003,.003,.002),ivory)
        for dx in [-.12,-.07,-.02,.03]:
            g.box("DGX Spark rear USB-C",(x+dx,shelf+.09,back),(.023,.008,.003),black,.002)
        g.box("DGX Spark HDMI",(x+.10,shelf+.095,back),(.032,.01,.003),black,.002)
        g.box("DGX Spark Ethernet",(x-.12,shelf+.045,back),(.032,.026,.003),black,.002)
        for dx in [.045,.115]:
            g.box("DGX Spark QSFP cage",(x+dx,shelf+.046,back),(.056,.029,.007),steel,.003)
            g.box("DGX Spark QSFP opening",(x+dx,shelf+.046,back-.004),(.047,.02,.002),black,.002)
        power_lead("DGX Spark connected power",[(x-.12,shelf+.09,back),(x-.16,shelf+.06,back-.10),(x-.16,shelf+.04,-.965),(x-.16,.255,-1.035)],.005)

    # Architectural cutaway: oak strip flooring and a real wall, not a server platform.
    g.box("Room subfloor",(0,-.12,.13),(5.85,.22,3.77),walnut,.055)
    for row in range(20):
        z=-1.61+row*.184
        boundaries=[-2.88]+[v for v in [-2.3+(row%3)*.41,-.96+(row%3)*.41,.38+(row%3)*.41,1.72+(row%3)*.41] if -2.88<v<2.88]+[2.88]
        for a,b in zip(boundaries,boundaries[1:]):
            g.box("Individual oak floor strip",((a+b)/2,.012,z),(b-a-.002,.045,.182),oak,.001)
    g.box("Plaster back wall",(0,1.79,-1.65),(5.84,3.58,.12),wall,.018)
    g.box("Left cutaway wall",(-2.86,.37,-.96),(.12,.74,1.42),wall,.012)
    g.box("Skirting board",(0,.115,-1.562),(5.72,.19,.055),ivory,.01)
    g.box("Left skirting return",(-2.787,.115,-.96),(.055,.19,1.4),ivory,.009)

    # Glass-front antique cabinet: panelled base, curved crown, shelves and ceramics.
    cx,cz=-2.17,-1.02
    g.box("Antique cabinet base",(cx,.53,cz),(1.19,.98,.65),rosewood,.035)
    for dx in [-.46,.46]:
        for dz in [-.23,.23]: lathe("Turned cabinet foot",(cx+dx,.025,cz+dz),[(0,.045),(.07,.058),(.12,.04)],rosewood,16)
    for dx in [-.29,.29]:
        g.box("Raised lower door",(cx+dx,.55,cz+.336),(.53,.78,.035),walnut,.014)
        g.box("Recessed door field",(cx+dx,.55,cz+.36),(.40,.62,.018),rosewood,.014)
        g.sphere("Brass cupboard pull",(cx+dx+(.19 if dx<0 else -.19),.57,cz+.39),(.016,.025,.02),brass)
    g.box("Cabinet shelf cornice",(cx,1.06,cz),(1.27,.11,.73),walnut,.025)
    g.box("Cabinet inner back",(cx,1.81,cz-.28),(1.1,1.38,.055),rosewood,.01)
    for dx in [-.56,.56]: g.box("Cabinet side stile",(cx+dx,1.79,cz),(.075,1.42,.6),walnut,.014)
    for y0 in [1.13,1.54,1.97,2.43]: g.box("Display shelf",(cx,y0,cz),(1.12,.045,.61),walnut,.008)
    for dx in [-.52,0,.52]: g.box("Glazed door mullion",(cx+dx,1.79,cz+.335),(.036,1.36,.04),walnut,.005)
    for y0 in [1.12,1.56,1.98,2.46]: g.box("Glazed door rail",(cx,y0,cz+.335),(1.09,.035,.04),walnut,.006)
    for dx in [-.26,.26]: face("Cabinet glass pane",(cx+dx,1.79,cz+.32),.47,1.29,glass)
    for shelf_y in [1.54,1.97]:
        shelf_top=shelf_y+.0225
        for dx in [-.35,.15,.38]:
            if dx<0:
                lathe("Cabinet ceramic",(cx+dx,shelf_top,cz+.04),[(0,.052),(.025,.07),(.14,.068),(.20,.035),(.23,.043)],ivory,16)
                g.ring("Porcelain blue band",(cx+dx,shelf_top+.155,cz+.04),.056,.006,blue)
            else:
                lathe("China teacup",(cx+dx,shelf_top+.005,cz+.04),[(0,.033),(.015,.039),(.08,.055),(.10,.052),(.10,.046),(.026,.029)],ivory,16)
                g.ring("Teacup handle",(cx+dx+.054,shelf_top+.065,cz+.04),.027,.006,ivory,"z")
                g.rod("Porcelain saucer",(cx+dx,shelf_top,cz+.04),(cx+dx,shelf_top+.005,cz+.04),.075,ivory)
    for offset,width in [(0,1.22),(.06,1.29),(.115,1.22)]: g.box("Crown moulding",(cx,2.48+offset,cz),(width,.065,.73),walnut,.02)
    lathe("Decorated lidded urn",(cx-.16,2.63,cz),[(0,.11),(.035,.15),(.13,.19),(.29,.16),(.36,.115),(.39,.14),(.43,.11),(.49,.05)],ivory,32)
    for h,r in [(.06,.164),(.31,.15),(.39,.14)]: g.ring("Cobalt urn band",(cx-.16,2.63+h,cz),r,.009,blue)
    for i in range(16):
        a=i*math.tau/16
        g.sphere("Urn painted motif",(cx-.16+math.cos(a)*.184,2.83,cz+math.sin(a)*.184),(.018,.033,.018),blue)
    g.sphere("Urn finial",(cx-.16,3.16,cz),(.028,.055,.028),blue)
    trailing_plant((cx+.31,2.6275,cz+.11),.9)

    # Low open media console, amplifier, soundbar and a full-size modern screen.
    for x0 in [-1.23,1.23]:
        for z0 in [-.84,-.14]: g.rod("Tapered console leg",(x0*1.05,.045,z0+.04),(x0,.79,z0),.032,walnut)
    for y0 in [.15,.47,.80]: g.box("Media console shelf",(0,y0,-.49),(2.62,.06,.88),walnut,.013)
    for x0 in [-.34,.58]: g.box("Open console divider",(x0,.31,-.49),(.035,.28,.84),walnut,.006)
    for x0 in [-.52,.79]: g.box("Upper console divider",(x0,.64,-.49),(.034,.29,.80),walnut,.005)
    for x0,w in [(-.87,.59),(.87,.46)]:
        y0=.282  # .18 shelf surface + .012 feet + half the .18 chassis.
        for dx in [-w*.34,w*.34]:
            for dz in [-.17,.17]:
                foot=g.box("Hi-fi isolation foot",(x0+dx,.186,-.45+dz),(.035,.012,.035),black,0)
                # The first graphite mesh supplies settings when the exporter
                # joins this material; retain the hardware's weighted normals.
                foot.data.use_auto_smooth=True
        g.box("Hi-fi component",(x0,y0,-.45),(w,.18,.49),black,.012)
        g.box("Component brushed face",(x0,y0,-.196),(w-.04,.14,.012),black,.007)
        g.sphere("Volume knob",(x0+w*.30,y0,-.18),(.024,.024,.018),brass)
        g.box("Hi-fi display",(x0-w*.18,y0+.014,-.185),(w*.25,.038,.006),blue,.003)
    mac_mini(-.26,.50,-.25)
    mac_mini(.25,.50,-.25)
    dgx_spark(.12,.18,-.29)
    g.box("OLED bezel",(0,1.72,-.42),(2.97,1.705,.062),black,.025)
    face("OLED picture surface",(0,1.72,-.382),2.89,1.625625,screen)
    g.box("Monitor stand neck",(0,.895,-.47),(.17,.23,.13),black,.017)
    g.box("Monitor pedestal",(0,.842,-.42),(.67,.026,.30),black,.035)
    for x0 in [-.29,.29]: g.box("Soundbar rubber foot",(x0,.832,-.16),(.055,.004,.08),black,0)
    g.box("Soundbar",(0,.904,-.16),(.82,.14,.15),black,.027)
    face("Soundbar woven grille",(0,.904,-.082),.77,.10,grille)
    g.sphere("Wireless mouse",(.81,.870,-.18),(.09,.032,.05),black)
    g.box("Mouse pad",(.81,.834,-.18),(.29,.008,.20),grille,.02)
    # The narrow MIDI keyboard sits beside, clear of the console's left edge.
    g.box("Keyboard resting foot",(-1.46,.039,.04),(.12,.009,.11),black,.002)
    g.box("Upright keyboard chassis",(-1.46,.48,.04),(.15,.88,.15),black,.015)
    for i in range(25):
        y0=.08+i*.032
        g.box("Piano ivory key",(-1.46,y0,.123),(.135,.029,.026),ivory,.003)
        if i%7 in [1,2,4,5,6]: g.box("Piano black key",(-1.42,y0+.014,.142),(.062,.012,.021),black,.002)

    # The walnut-slatted desktop case from the reference, with restrained cabling.
    px,pz=1.63,-.04
    g.box("Desktop PC chassis",(px,.5645,pz),(.47,.98,.69),black,.026)
    for i in range(11): g.box("Walnut ventilation slat",(px-.194+i*.039,.5645,pz+.354),(.020,.87,.019),oak,.004)
    for z0 in [-.23,.23]: g.box("PC rubber foot",(px,.0545,pz+z0),(.40,.04,.055),black,.01)
    g.sphere("PC power button",(px+.13,1.055,pz+.20),(.018,.006,.018),steel)
    for i in range(3): g.box("PC top IO",(px-.12+i*.075,1.055,pz+.20),(.032,.003,.012),black,.002)
    # A single rear sleeve receives short parallel leads, clear of shelf edges.
    g.rod("Rear cable management sleeve",(-.4,.255,-1.035),(1.46,.255,-1.035),.028,black,vertices=10)
    for i in range(4):
        power_lead("Equipment lead",[(px-.12+i*.055,.19+i*.016,pz-.348),(1.40+i*.018,.22+i*.009,-.53),(1.38+i*.022,.255,-.81),(1.38+i*.022,.255,-1.035)],.005)
    for x0 in [.95,1.10]:
        g.box("Wall outlet plate",(x0,.25,-1.571),(.12,.14,.012),ivory,.01)
        g.ring("Recessed outlet",(x0,.25,-1.557),.035,.006,ivory,"z")
        g.rod("Connected wall plug",(x0,.25,-1.551),(x0,.25,-1.52),.019,black)
        power_lead("Sleeved wall power lead",[(x0,.255,-1.035),(x0,.235,-1.28),(x0,.25,-1.52)],.006)

    # Right-hand chest and the brass clock, phone and snake plant on top.
    rx,rz=2.23,-.99
    g.box("Chest recessed plinth",(rx,.062,rz),(.96,.055,.49),rosewood,.009)
    g.box("Tall walnut chest",(rx,1.02,rz),(1.12,1.95,.65),rosewood,.029)
    g.box("Chest overhanging top",(rx,2.025,rz),(1.20,.065,.73),walnut,.017)
    for y0,h in [(.42,.62),(1.11,.65),(1.68,.40)]:
        g.box("Chest front panel",(rx,y0,rz+.337),(1.045,h,.026),walnut,.011)
        g.box("Panel raised field",(rx,y0,rz+.356),(.91,h-.12,.018),rosewood,.013)
        g.sphere("Chest keyhole escutcheon",(rx,y0+.1,rz+.378),(.017,.026,.005),brass)
    # Dial lies in the frontal XY plane; all details are physical geometry.
    kx,kz=rx+.03,rz+.12
    chest_top=2.0575
    dial_y=chest_top+.245
    g.box("Clock plinth",(kx,chest_top+.035,kz),(.35,.07,.19),brass,.012)
    g.box("Mantel clock case",(kx,chest_top+.235,kz),(.29,.37,.14),brass,.04)
    g.rod("Clock dial",(kx,dial_y,kz+.073),(kx,dial_y,kz+.081),.127,black,vertices=40)
    g.ring("Clock bezel",(kx,dial_y,kz+.085),.129,.012,brass,"z")
    for i in range(12):
        a=i*math.tau/12
        g.rod("Clock hour marker",(kx+math.sin(a)*.099,dial_y+math.cos(a)*.099,kz+.088),(kx+math.sin(a)*.113,dial_y+math.cos(a)*.113,kz+.088),.0035,ivory,vertices=8)
    g.rod("Clock minute hand",(kx,dial_y,kz+.092),(kx-.064,dial_y+.065,kz+.092),.004,ivory,vertices=8)
    g.rod("Clock hour hand",(kx,dial_y,kz+.096),(kx+.045,dial_y+.015,kz+.096),.005,brass,vertices=8)
    g.cable("Clock carry handle",[(kx-.08,chest_top+.42,kz),(kx-.06,chest_top+.47,kz),(kx+.06,chest_top+.47,kz),(kx+.08,chest_top+.42,kz)],.011,brass)
    g.box("Cordless phone base",(rx+.36,chest_top+.025,rz+.1),(.14,.05,.20),black,.024)
    g.box("Cordless handset",(rx+.36,chest_top+.16,rz+.05),(.09,.26,.07),black,.025)
    face("Telephone display",(rx+.36,chest_top+.21,rz+.088),.06,.08,blue)
    pot((rx-.41,chest_top,rz),.13,.22,black)
    for i in range(11):
        a=i*2.4
        leaf("Snake plant blade",(rx-.41,2.24,rz),(rx-.41+math.sin(a)*.17,2.66+(i%4)*.09,rz+math.cos(a)*.17),.030,leaf_light if i%3==0 else leaf_dark)

    # Mismatched framed prints reproduce the composition, not private screen content.
    for index,x0,y0,w,h in [(0,-1.28,2.99,.43,.86),(1,.20,3.08,.39,.78),(2,1.48,2.96,.43,.86)]:
        g.box("Print backing",(x0,y0,-1.555),(w+.05,h+.05,.037),black,.004)
        face("Printed wall artwork",(x0,y0,-1.531),w,h,posters,index/3+.004,(index+1)/3-.004)
        for dx in [-w/2-.012,w/2+.012]: g.box("Frame vertical",(x0+dx,y0,-1.517),(.024,h+.06,.038),black,.004)
        for dy in [-h/2-.012,h/2+.012]: g.box("Frame horizontal",(x0,y0+dy,-1.517),(w+.045,.024,.038),black,.004)
    g.box("Small antique picture frame",(2.44,2.88,-1.536),(.34,.41,.08),walnut,.018)
    g.box("Antique inner gold frame",(2.44,2.88,-1.488),(.27,.34,.025),brass,.007)
    g.box("Antique miniature canvas",(2.44,2.88,-1.469),(.21,.28,.01),blue,.002)
    g.sphere("Miniature portrait silhouette",(2.44,2.91,-1.458),(.046,.066,.005),ivory)

    def chair(p, upholstered):
        x0,z0=p
        for dx in [-.21,.21]:
            for dz in [-.21,.21]:
                g.cable("Curved chair leg",[(x0+dx*1.1,.05,z0+dz*1.1),(x0+dx,.29,z0+dz),(x0+dx,.52,z0+dz)],.025,rosewood)
        g.box("Chair seat frame",(x0,.51,z0),(.52,.08,.52),rosewood,.045)
        g.box("Upholstered cushion",(x0,.58,z0),(.52,.13,.51),upholstered,.065)
        g.cable("Upholstery piping",[(x0-.23,.605,z0-.22),(x0+.23,.605,z0-.22),(x0+.24,.605,z0+.22),(x0-.24,.605,z0+.22),(x0-.23,.605,z0-.22)],.006,upholstered)
        for dx in [-.23,.23]:
            g.cable("Chair back upright",[(x0+dx,.50,z0-.20),(x0+dx*1.08,.88,z0-.25),(x0+dx*.93,1.19,z0-.28)],.025,rosewood)
        g.box("Chair upholstered back",(x0,1.00,z0-.267),(.46,.35,.09),upholstered,.06)
        g.cable("Chair carved crest",[(x0-.23,1.18,z0-.28),(x0,1.23,z0-.28),(x0+.23,1.18,z0-.28)],.034,rosewood)
    chair((2.28,.69),velvet)
    speaker((2.28,.645+.59*1.05/2,.71),1.05)
    chair((-1.90,.43),grille)
    speaker((-1.90,.645+.59*1.08/2,.45),1.08)
    pot((-2.52,.04,1.06),.22,.37)
    for i in range(12):
        a=i*2.4
        leaf("Floor plant leaf",(-2.52,.37,1.06),(-2.52+math.sin(a)*.38,1.12+(i%3)*.18,1.06+math.cos(a)*.33),.053,leaf_dark if i%2 else leaf_light)
    # A small woven rug edge gives the foreground the lived-in warmth of the photo.
    g.box("Woven rug",(-.78,.056,1.44),(1.62,.015,.57),velvet,.011)
    for x0 in [-1.56,-1.50,.00,.06]: g.box("Rug border stripe",(x0,.066,1.44),(.025,.003,.54),ivory,.001)
    for i in range(25):
        x0=-1.56+i*.064
        g.rod("Rug fringe",(x0,.064,1.73),(x0+.012,.06,1.79),.004,ivory,vertices=6)

    # Blender primitives supply UVs even for solid-color materials. Removing
    # unused maps avoids exporting empty texture coordinates and splitting
    # otherwise identical vertices at invisible UV seams. Textured wood, cloth,
    # posters and screens retain every texture coordinate and their full images.
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or not obj.data.materials:
            continue
        if any(material and material.use_nodes and
               any(node.type == "TEX_IMAGE" for node in material.node_tree.nodes)
               for material in obj.data.materials):
            continue
        while obj.data.uv_layers:
            obj.data.uv_layers.remove(obj.data.uv_layers[0])
