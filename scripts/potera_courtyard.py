"""A complete client townhouse in a quiet, tended garden. Authored Y-up."""
import math
import random
import bpy


def build(g):
    g.clear()
    rng = random.Random(74)
    b, r = g.box, g.rod
    limestone = g.mat("Potera pale limestone", (.63, .59, .48), .9)
    plaster = g.mat("Potera warm mineral plaster", (.67, .65, .55), .94)
    roof = g.mat("Potera blue slate", (.085, .16, .18), .68, .08)
    seams = g.mat("Potera fine roof seams", (.115, .195, .21), .72)
    lawn = g.mat("Potera garden lawn", (.29, .37, .22), .98)
    soil = g.mat("Potera planted earth", (.13, .16, .105), 1)
    violet = g.mat("Potera lavender", (.30, .28, .40), .95)
    glass = g.mat("Potera bay glass", (.075, .19, .205), .23, .3)
    leaf, leaf2, timber = g.LEAF, g.LEAF2, g.WOOD

    def mesh(name, vertices, faces, material, parent=None):
        data = bpy.data.meshes.new(name)
        data.from_pydata([g.xyz(p) for p in vertices], [], faces)
        data.update()
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        return g.finish(obj, name, material, parent)

    # A broad irregular garden parcel. The rock tapers into a single coherent mass.
    outline = [(-3.75,-2.4),(-2.65,-3.03),(-.9,-3.18),(1.35,-3.05),
               (3.05,-2.5),(3.7,-1.5),(3.82,.1),(3.48,1.85),
               (2.52,2.95),(.8,3.2),(-1.25,3.06),(-2.9,2.5),(-3.8,1.1),(-3.92,-.5)]
    n = len(outline)
    rings = [(1,.055),(.99,-.23),(.96,-.65),(.76,-1.17)]
    vertices = [(x*s,y,z*s) for s,y in rings for x,z in outline] + [(0,-1.43,0)]
    faces = []
    for level in range(3):
        for i in range(n):
            a=level*n+i; c=level*n+(i+1)%n
            faces += [(a,c,c+n),(a,c+n,a+n)]
    faces += [(3*n+i,3*n+(i+1)%n,4*n) for i in range(n)]
    mesh("Garden island stratified rock", vertices, faces, g.STONE)
    mesh("Garden island soil cap", [(0,.065,0)]+[(x,.065,z) for x,z in outline],
         [(0,(i+1)%n+1,i+1) for i in range(n)], lawn)
    # Stone fascia follows the edge but leaves the garden-facing border soft.
    for i in range(n):
        x,z=outline[i]; xx,zz=outline[(i+1)%n]
        if z>.5 and zz>.5:
            length=math.hypot(xx-x,zz-z)
            pieces=max(1,round(length/.48))
            for k in range(pieces):
                f=(k+.5)/pieces
                b("Cut garden edge",(x+(xx-x)*f,-.055,z+(zz-z)*f),
                  (length/pieces-.012,.23,.13),limestone,.025,angle=-math.atan2(zz-z,xx-x))

    # The terrace and arrival walk use different scale/course rhythms.
    b("House terrace foundation",(-.68,.095,-.48),(4.52,.12,4.38),limestone,.045)
    for row in range(7):
        for col in range(8):
            x=-2.63+col*.55
            z=-1.96+row*.55
            b("Terrace paving",(x,.165,z),(.525,.025,.525),limestone if (row+col)%5 else g.LIGHTSTONE,.008)
    # Spacious approach: no tools or garden objects enter the doorway corridor.
    for j in range(4):
        b("Arrival stepping stone",(-1.75+.06*j,.105,1.69+j*.37),(1.04,.08,.33),limestone,.045)
    for z in [-1.78,-1.21,-.64,-.07,.50,1.07]:
        b("Garden side path",(2.45,.12,z),(.74,.105,.49),limestone,.045)

    # Full-depth house, with front, side and rear elevations under a closed hipped roof.
    b("Townhouse complete volume",(-.65,1.565,-1.4),(3.8,2.79,2),plaster,.028)
    b("Continuous stone plinth",(-.65,.34,-1.4),(3.94,.34,2.1),limestone,.02)
    for y,h in [(1.80,.10),(2.98,.13)]:
        b("Townhouse cornice",(-.65,y,-1.4),(4.02,h,2.18),limestone,.024)
    for x in [-2.55,1.25]:
        for z in [-.36,-2.44]:
            for j in range(9):
                b("Corner limestone quoin",(x,.52+j*.26,z),(.23,.18,.11),limestone,.009)
    verts=[(-2.75,3.07,-2.6),(1.45,3.07,-2.6),(1.45,3.07,-.20),(-2.75,3.07,-.20),
           (-2.24,3.71,-2.08),(.94,3.71,-2.08),(.94,3.71,-.72),(-2.24,3.71,-.72)]
    mesh("Complete hipped slate roof",verts,[(4,5,1,0),(5,6,2,1),(6,7,3,2),(7,4,0,3),(7,6,5,4),(0,1,2,3)],roof)
    # Thin slate courses follow the roof slopes instead of floating across the facade.
    for i in range(1,5):
        f=i/5; y=3.07+.64*f
        lo=-2.75+.51*f; hi=1.45-.51*f
        for z in [-.20-.52*f,-2.60+.52*f]:
            r("Slate roof course",(lo,y+.032,z),(hi,y+.032,z),.009,seams,vertices=6)
    for i in range(11):
        x=-2.15+i*.3
        r("Roof standing seam",(x,3.100,-.20),(x,3.740,-.72),.006,seams,vertices=6)
    b("Roof chimney",(-1.93,3.76,-1.85),(.36,.65,.38),limestone,.018)
    b("Chimney cap",(-1.93,4.09,-1.85),(.46,.08,.48),roof,.015)
    b("Chimney flue",(-1.93,4.14,-1.85),(.24,.035,.25),g.IRON,.008)

    def front_window(x,y,z,width=.70,height=.90,arched=False):
        if arched:
            radius=width/2; spring=y+height/2-radius
            points=[(-radius,-height/2),(radius,-height/2)]
            points += [(radius*math.cos(i*math.pi/16),height/2-radius+radius*math.sin(i*math.pi/16)) for i in range(17)]
            g.profile("Upper arched pane",points,.022,(x,y,z),g.GLASS)
            g.art.arch((x,spring,z+.018),radius,.075,.11,limestone,11)
            for dx in [-radius-.038,radius+.038]:
                b("Upper window jamb",(x+dx,(y-height/2+spring)/2,z+.018),(.075,spring-(y-height/2),.11),limestone,.006)
        else:
            b("Rear window pane",(x,y,z),(width,height,.022),g.GLASS,.008)
            for dx in [-width/2-.032,width/2+.032]:
                b("Rear window jamb",(x+dx,y,z+.015),(.065,height+.12,.09),limestone,.006)
            b("Rear lintel",(x,y+height/2+.03,z),(width+.16,.065,.12),limestone,.009)
        b("Window limestone sill",(x,y-height/2-.035,z+.018),(width+.22,.09,.25),limestone,.012)
        b("Window timber mullion",(x,y,z+.033),(.028,height,.025),g.CREAM,.003)
        b("Window crossbar",(x,y+.035,z+.034),(width,.028,.026),g.CREAM,.003)

    for x in [-1.75,-.55,.65]:
        front_window(x,2.36,-.335,.66,.92,True)
    for x in [-1.74,-.54,.66]:
        for y in [1.05,2.36]:
            front_window(x,y,-2.422,.66,.87)
    # Side windows use boxed reveals and are readable when the island is rotated.
    for x in [-2.575,1.275]:
        for z in [-1.76,-.94]:
            for y in [1.10,2.34]:
                b("Side window glazing",(x,y,z),(.025,.77,.52),g.GLASS,.005)
                for dz in [-.30,.30]:
                    b("Side window jamb",(x,y,z+dz),(.09,.87,.065),limestone,.007)
                for dy in [-.43,.43]:
                    b("Side window ledge",(x,y+dy,z),(.15,.075,.69),limestone,.009)
                b("Side window mullion",(x+(.02 if x>0 else -.02),y,z),(.025,.77,.025),g.CREAM,.002)
    # One broad picture window provides a clean, obvious interaction surface.
    clean = g.pivot("potera_cleanable_window",(.20,1.08,-.315))
    b("Cleanable picture pane",(.20,1.08,-.315),(1.38,.94,.018),glass,.004,clean)
    for x in [-.545,.945]:
        b("Picture window jamb",(x,1.08,-.30),(.11,1.15,.14),limestone,.015)
    for y in [.535,1.625]:
        b("Picture window frame",(.20,y,-.30),(1.6,.12,.18),limestone,.014)
    b("Picture window sill",(.20,.485,-.26),(1.76,.085,.34),limestone,.016)
    # Entrance has separate stonework and a small canopy; it remains unobstructed.
    b("Entry door",(-1.75,.92,-.323),(.76,1.49,.075),roof,.012)
    for x in [-2.195,-1.305]:
        b("Entrance stone jamb",(x,.97,-.30),(.12,1.60,.19),limestone,.018)
    b("Entrance lintel",(-1.75,1.80,-.30),(1.05,.13,.25),limestone,.022)
    for y in [.56,1.20]:
        b("Door recessed panel",(-1.75,y,-.276),(.56,.43,.023),g.WOOD,.01)
    r("Door brass pull",(-1.49,.91,-.212),(-1.49,1.07,-.212),.016,g.BRASS)
    b("Door threshold",(-1.75,.21,-.20),(1.12,.08,.48),limestone,.024)
    b("Door canopy",(-1.75,1.96,-.08),(1.28,.065,.81),roof,.018)
    for x in [-2.22,-1.28]:
        r("Canopy bracket",(x,1.72,-.31),(x,1.935,.20),.015,g.IRON,vertices=8)
    b("House number backing",(-1.11,1.43,-.317),(.16,.18,.045),roof,.008)
    g.label("House number","25",(-1.11,1.392,-.288),.10,g.CREAM)
    g.art.lantern((-2.37,1.35,-.15),.53)
    # Gutters, closed downpipes and a discreet terrace drain give the house construction detail.
    for x in [-2.65,1.35]:
        g.cable("Rain downpipe",[(x,3.03,-.32),(x,2.84,-.26),(x,.30,-.26),(x,.20,-.12)],.028,roof)
    b("Terrace channel drain",(.25,.183,.10),(1.86,.012,.095),g.IRON,.005)
    for i in range(23):
        b("Drain grate rib",(-.62+i*.08,.194,.10),(.019,.01,.086),g.STEEL,0)

    # Low garden boundary frames the parcel without walling off the view.
    for x in [-3.23,3.12]:
        b("Garden boundary wall",(x,.36,-1.03),(.20,.58,3.43),limestone,.035)
        b("Garden wall coping",(x,.67,-1.03),(.26,.055,3.52),limestone,.016)
    b("Rear garden wall",(-.15,.36,-2.82),(6.75,.58,.20),limestone,.035)
    b("Rear garden coping",(-.15,.67,-2.82),(6.84,.06,.26),limestone,.018)

    # Lavender border and clipped low shrubs replace the old repeated cypress pots.
    for x,z,w,d in [(2.0,1.65,2.0,1.04),(-2.9,.55,.42,2.1),(2.96,-1.5,.26,2.0)]:
        b("Garden planting bed",(x,.095,z),(w,.045,d),soil,.12)
    for i in range(18):
        x=1.17+(i%6)*.31; z=1.35+(i//6)*.26
        for j in range(5):
            dx=rng.uniform(-.10,.10); dz=rng.uniform(-.08,.08); h=rng.uniform(.18,.29)
            r("Lavender stem",(x+dx,.13,z+dz),(x+dx*.8,.13+h,z+dz*.8),.009,leaf,vertices=5)
            g.art.rock("Lavender flower",(x+dx*.8,.13+h,z+dz*.8),(.034,.060,.031),violet,i*5+j)
    for i in range(7):
        g.art.rock("Clipped boxwood",(-2.89,.30,-.39+i*.25),(.21,.23,.22),leaf2,120+i)

    # One airy ornamental tree, with a bent trunk and small leaf clusters, not shop vegetation.
    tx,tz=2.31,-1.27
    g.art.rock("Tree planted mound",(tx,.09,tz),(.52,.08,.52),soil,301)
    branches=[((tx,.08,tz),(tx-.12,1.12,tz+.04)),((tx-.12,1.12,tz+.04),(tx-.49,1.88,tz-.14)),
              ((tx-.12,.88,tz+.04),(tx+.42,1.58,tz+.19)),((tx-.17,1.30,tz),(tx+.07,2.12,tz+.03))]
    for i,(a,c) in enumerate(branches): r("Garden tree branch",a,c,.049 if i==0 else .028,timber,vertices=8)
    for i,(dx,dy,dz,s) in enumerate([(-.48,1.86,-.18,.40),(-.15,2.13,-.10,.43),(.12,2.25,.02,.36),
                                    (.43,1.74,.20,.38),(.03,1.79,.21,.45),(-.34,1.57,.09,.30)]):
        g.art.rock("Garden tree foliage",(tx+dx,dy,tz+dz),(s,.28,s*.83),leaf if i%3==0 else leaf2,411+i)
    # A useful resting place in the garden, clear of the house and service route.
    for x in [2.02,2.83]:
        for z in [.15,.53]: b("Bench stone foot",(x,.245,z),(.105,.36,.11),limestone,.018)
    for j in range(4): b("Bench seat slat",(2.425,.44,.15+j*.13),(1.22,.065,.105),timber,.014)
    for y in [.69,.85]: b("Bench back slat",(2.425,y,.09),(1.22,.10,.06),timber,.012)
    for x in [1.92,2.93]: r("Bench back upright",(x,.43,.09),(x,.91,.09),.022,g.IRON,vertices=8)

    # One orderly work station. Ground contacts use the terrace's actual top, .1775.
    cx,cz=-.10,.94
    cart=g.pivot("potera_equipment",(cx,.1775,cz))
    for dx in [-.32,.32]:
        for dz in [-.24,.24]:
            r("Cart caster",(cx+dx-.035,.245,cz+dz),(cx+dx+.035,.245,cz+dz),.0675,g.RUBBER,cart,vertices=12)
            r("Cart upright",(cx+dx,.31,cz+dz),(cx+dx,.85,cz+dz),.02,g.STEEL,cart,vertices=10)
    for y in [.35,.69]: b("Cart shelf",(cx,y,cz),(.72,.05,.56),g.TEAL,.026,cart)
    g.cable("Cart handle",[(cx-.32,.84,cz+.24),(cx-.32,.95,cz+.24),(cx+.32,.95,cz+.24),(cx+.32,.84,cz+.24)],.022,g.STEEL,cart)
    # Hollow bucket uses rings/walls; supplies all rest directly on the upper shelf.
    r("Bucket body",(cx-.16,.715,cz-.02),(cx-.16,.925,cz-.02),.13,g.TEAL,cart,vertices=20)
    r("Bucket dark opening",(cx-.16,.928,cz-.02),(cx-.16,.934,cz-.02),.113,soil,cart,vertices=20)
    g.ring("Bucket lip",(cx-.16,.931,cz-.02),.131,.011,g.STEEL,parent=cart)
    for i in range(2):
        x=cx+.095+i*.12
        r("Cleaning bottle",(x,.715,cz-.08),(x,.87,cz-.08),.041,g.PAPER,cart,vertices=12)
        b("Bottle spray head",(x,.895,cz-.05),(.035,.055,.09),g.TEAL,.007,cart)
    b("Folded cloth",(cx+.15,.74,cz+.16),(.24,.05,.14),g.CREAM,.016,cart)
    for j in range(3): b("Folded clean towel",(cx,.392+j*.049,cz),(.38,.045,.32),g.CREAM,.015,cart)
    # Park the spare tool vertically in a proper cart clip, away from the walking route.
    r("Parked squeegee handle",(cx-.39,.396,cz-.20),(cx-.39,1.25,cz-.20),.013,g.STEEL,cart,vertices=10)
    r("Parked squeegee head",(cx-.59,1.25,cz-.20),(cx-.19,1.25,cz-.20),.022,g.RUBBER,cart,vertices=10)
    # A socket carries its weight; two collars tie it back to the cart uprights.
    b("Tool lower support arm",(cx-.35,.36,cz-.20),(.16,.045,.09),g.TEAL,.009,cart)
    b("Tool support socket",(cx-.39,.396,cz-.20),(.07,.055,.07),g.RUBBER,.012,cart)
    for y in [.425,.82]:
        b("Tool retaining clip",(cx-.35,y,cz-.20),(.14,.045,.07),g.TEAL,.008,cart)
        g.ring("Tool rubber collar",(cx-.39,y,cz-.20),.020,.007,g.RUBBER,parent=cart)
    logo=g.brand_material("potera","Potera Reinigung official logo")
    b("Cart brand panel",(cx,.50,cz+.298),(.61,.25,.036),g.PAPER,.014,cart)
    g.brand_decal("Cart Potera logo",(cx,.50,cz+.322),.19,logo)
    # The second logo belongs to a compact enamel contractor placard.
    sx,sz=1.16,.91
    sign=g.pivot("potera_service_sign",(sx,.1775,sz))
    for dx in [-.21,.21]:
        for dz in [-.17,.19]:
            r("Service sign leg",(sx+dx,.19,sz+dz),(sx+dx,.82,sz),.018,g.TEAL,sign,vertices=10)
    b("Service sign frame",(sx,.55,sz+.08),(.51,.60,.04),g.TEAL,.02,sign)
    b("Service sign enamel",(sx,.55,sz+.109),(.455,.545,.026),g.PAPER,.012,sign)
    g.brand_decal("Service sign Potera logo",(sx,.55,sz+.13),.36,logo)

    # A quiet stepped inlay connects the wider world art direction without brand imitation.
    g.art.fret((-.65,1.805,-.292),3.6,g.WOOD2,12,.052)
    g.export("potera")
