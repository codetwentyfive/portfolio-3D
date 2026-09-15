"""Check selected authored layouts before their meshes are batched by material.

Run with Blender 4.0+, without changing exported assets:
  blender --background --factory-startup --python-exit-code 1 \
    --python scripts/verify-world-layout.py
Append ``-- payments seeds potera`` to select worlds. Only nominated relationships
are checked: structural joints intentionally overlap throughout these models.
"""
import ast
from dataclasses import dataclass
from pathlib import Path
import re
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


ROOT = Path(__file__).resolve().parents[1]
GENERATOR = ROOT / "scripts/build-project-worlds.py"
SUPPORTED = ("payments", "seeds", "potera")
EPS = 0.0001
failures = []
passed = []
geometry_cache = {}


@dataclass
class Geometry:
    points: list
    low: tuple
    high: tuple
    tree: object


def geometry(obj):
    """Evaluated mesh vertices in the author's X/Y-up/Z coordinates."""
    if obj.name not in geometry_cache:
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        try:
            world = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
            points = [(point.x, point.z, -point.y) for point in world]
            faces = [tuple(face.vertices) for face in mesh.polygons]
            assert points, f"{obj.name}: empty evaluated mesh"
            geometry_cache[obj.name] = Geometry(
                points,
                tuple(min(point[axis] for point in points) for axis in range(3)),
                tuple(max(point[axis] for point in points) for axis in range(3)),
                BVHTree.FromPolygons(points, faces),
            )
        finally:
            evaluated.to_mesh_clear()
    return geometry_cache[obj.name]


def named(stem, count=None):
    pattern = re.compile(re.escape(stem) + r"(?:\.\d+)?$")
    found = [obj for obj in bpy.context.scene.objects
             if obj.type == "MESH" and pattern.fullmatch(obj.name)]
    if count is not None:
        assert len(found) == count, f"{stem}: expected {count} meshes, found {len(found)}"
    return found


def center(obj, axis):
    shape = geometry(obj)
    return (shape.low[axis] + shape.high[axis]) / 2


def overlap(a, b, axis):
    ga, gb = geometry(a), geometry(b)
    return min(ga.high[axis], gb.high[axis]) - max(ga.low[axis], gb.low[axis])


def clear(a, b, minimum=0.01):
    """A positive separating-axis gap proves these nominated solids are clear."""
    gap = max(-overlap(a, b, axis) for axis in range(3))
    assert gap >= minimum - EPS, (
        f"{a.name} / {b.name}: separating gap {gap:.4f}, need {minimum:.4f}"
    )
    return gap


def connected(a, b):
    overlaps = [overlap(a, b, axis) for axis in range(3)]
    assert min(overlaps) > EPS, f"{a.name} / {b.name}: disconnected bounds {overlaps}"
    assert geometry(a).tree.overlap(geometry(b).tree), (
        f"{a.name} / {b.name}: bounds overlap but evaluated surfaces do not meet"
    )


def footprint_contains(outer, inner):
    return all(outer.low[axis] <= inner.low[axis] + EPS
               and outer.high[axis] >= inner.high[axis] - EPS for axis in (0, 2))


def payments_piers():
    gaps = [clear(pier, rail, 0.04)
            for pier in named("Trade hall pier", 4) for rail in named("Belt rail", 2)]
    named("Safety bollard", 0)
    return f"piers clear rails by at least {min(gaps):.3f}; obsolete bollards absent"


def payments_scanner():
    chassis = named("Conveyor chassis", 1)[0]
    legs = named("Scanner arch leg", 2)
    for shoe in named("Scanner mounting shoe", 2):
        leg = min(legs, key=lambda obj: abs(center(obj, 2) - center(shoe, 2)))
        connected(shoe, chassis)
        connected(shoe, leg)
    return "both mounting shoes intersect chassis and scanner legs"


def payments_crates():
    floor = geometry(named("Dressed surface", 1)[0])
    crates = [obj for obj in named("Parcel", 7) if obj.parent is None]
    assert len(crates) == 4, f"expected four stationary crates, found {len(crates)}"
    packing = [obj for stem in ("Packing tape", "Shipping label", "Label barcode")
               for obj in named(stem) if obj.parent is None]
    tops = {}
    for crate in crates:
        body = geometry(crate)
        # A stacked box rests on the preceding box's tape/label, not through it.
        details = [geometry(obj) for obj in packing
                   if footprint_contains(body, geometry(obj))
                   and geometry(obj).low[1] >= body.high[1] - EPS
                   and geometry(obj).high[1] <= body.high[1] + 0.03]
        tops[crate.name] = max([body.high[1]] + [detail.high[1] for detail in details])
    gaps = []
    for crate in sorted(crates, key=lambda obj: geometry(obj).low[1]):
        body = geometry(crate)
        supports = [floor.high[1]] if footprint_contains(floor, body) else []
        supports += [tops[other.name] for other in crates if other != crate
                     and geometry(other).high[1] < body.low[1] + EPS
                     and footprint_contains(geometry(other), body)]
        candidates = [body.low[1] - height for height in supports
                      if -EPS <= body.low[1] - height <= 0.006]
        assert candidates, (
            f"{crate.name}: bottom {body.low[1]:.4f} lacks support within 0.006; "
            f"support heights {[round(height, 4) for height in supports]}"
        )
        gaps.append(min(candidates))
    return f"four stationary crates supported; maximum gap {max(gaps):.4f}"


def payments_parcels():
    rollers = [geometry(obj) for obj in named("Conveyor roller", 25)]
    top = max(roller.high[1] for roller in rollers)
    sensor = geometry(named("Sensor lens", 1)[0])
    moving = [obj for obj in named("Parcel", 7) if obj.parent is not None]
    assert len(moving) == 3, "expected three moving parcel bodies"
    for crate in moving:
        body = geometry(crate)
        gap = body.low[1] - top
        assert -EPS <= gap <= 0.006, f"{crate.name}: belt support gap {gap:.4f}"
        # Include the actual label and barcode height, not just the box body.
        top_detail = max(geometry(obj).high[1] for obj in bpy.context.scene.objects
                         if obj.type == "MESH" and obj.parent == crate.parent)
        assert sensor.low[1] - top_detail >= 0.15, (
            f"{crate.name}: scanner clearance {sensor.low[1] - top_detail:.4f}"
        )
        for leg in named("Scanner arch leg", 2):
            clear(crate, leg, 0.05)
    return "three parcels rest on rollers and clear scanner by at least 0.150"


def seeds_drums():
    kick = named("Kick shell", 1)[0]
    gaps = [clear(tom, kick, 0.02) for tom in named("Tom shell", 4)]
    return f"four tom shells clear kick shell; minimum separating gap {min(gaps):.3f}"


def seeds_supports():
    kick = named("Kick shell", 1)[0]
    rims = named("Kick rim", 2)
    racks = [obj for stem in ("Rack tom support", "Rack tom mounting arm", "Rack tom base foot")
             for obj in named(stem, 2)]
    gaps = [clear(part, kick, 0.02) for part in racks]
    for part in racks:
        for rim in rims:
            clear(part, rim, 0.01)
    # Check actual surface joints, not merely visually adjacent bounding boxes.
    for support in named("Rack tom support", 2):
        foot = min(named("Rack tom base foot", 2),
                   key=lambda obj: abs(center(obj, 0) - center(support, 0)))
        arm = min(named("Rack tom mounting arm", 2),
                  key=lambda obj: abs(center(obj, 0) - center(support, 0)))
        connected(support, foot)
        connected(support, arm)
    for spur in named("Kick spur", 2):
        foot = min(named("Kick spur foot", 2),
                   key=lambda obj: abs(center(obj, 0) - center(spur, 0)))
        connected(spur, kick)
        connected(spur, foot)
    rear = geometry(named("Kick rear support", 1)[0])
    assert abs(geometry(kick).low[1] - rear.high[1]) <= EPS, "kick rear support misses shell"
    for stem, stand_stem, count in (("Mic", "Mic stand", 6), ("Stool", "Drummer stool", 3)):
        feet = named(f"{stem} tripod foot", count)
        stands = named(stand_stem, 2 if stem == "Mic" else 1)
        for leg in named(f"{stem} tripod leg", count):
            assert any(geometry(leg).tree.overlap(geometry(stand).tree) for stand in stands), (
                f"{leg.name}: does not connect to a stand"
            )
            assert any(geometry(leg).tree.overlap(geometry(foot).tree) for foot in feet), (
                f"{leg.name}: does not connect to a foot"
            )
    planks = [geometry(obj) for obj in named("Stage plank", 18)]
    feet = [obj for stem, count in (("Rack tom base foot", 2), ("Kick spur foot", 2),
                                   ("Kick rear support", 1), ("Mic tripod foot", 6),
                                   ("Stool tripod foot", 3))
            for obj in named(stem, count)]
    for foot in feet:
        bounds = geometry(foot)
        contacts = 0
        # Sample inside the foot's sole; a foot may safely span a narrow plank seam.
        for dx, dz in ((-.25, -.25), (-.25, .25), (.25, -.25), (.25, .25)):
            x = center(foot, 0) + dx * (bounds.high[0] - bounds.low[0])
            z = center(foot, 2) + dz * (bounds.high[2] - bounds.low[2])
            for plank in planks:
                hit, _, _, _ = plank.tree.ray_cast(
                    Vector((x, bounds.low[1] + .05, z)), Vector((0, -1, 0)), .10)
                if hit is not None and -EPS <= bounds.low[1] - hit.y <= .002:
                    contacts += 1
                    break
        assert contacts >= 2, f"{foot.name}: only {contacts}/4 sole samples meet stage planks"
    return f"rack hardware clears kick by {min(gaps):.3f}; 14 feet grounded; support joints connected"


def seeds_arch():
    for stem in ("Lighting tower", "Tower foot", "Tower diagonal", "Left garden remnant"):
        named(stem, 0)
    named("Stage pier shaft", 2)
    named("Festoon", 1)
    return "single festoon and two arch piers; old towers and garden wall absent"


def potera_door():
    door = named("Entry door", 1)[0]
    named("Window pane", 2)
    windows = [obj for stem in ("Window pane", "Window reveal", "Window mullion",
                               "Transom", "Window sill", "Arched window glass")
               for obj in named(stem)]
    for window in windows:
        assert min(overlap(door, window, 0), overlap(door, window, 1)) <= EPS, (
            f"{window.name}: window geometry remains behind doorway in front elevation"
        )
    return "no window geometry behind the entry door"


def potera_glazing():
    panes = named("Arched window glass", 3)
    jambs = named("Upper window jamb", 6)
    cornices = named("Cornice", 3)
    crowns = named("Radial arch stone", 33)
    gaps = []
    for pane in panes:
        glass = geometry(pane)
        x = center(pane, 0)
        pair = sorted(sorted(jambs, key=lambda obj: abs(center(obj, 0) - x))[:2],
                      key=lambda obj: center(obj, 0))
        left, right = (geometry(obj) for obj in pair)
        assert left.high[0] <= right.low[0], f"{pane.name}: jambs cross"
        assert glass.low[0] >= left.high[0] - EPS, f"{pane.name}: escapes left jamb"
        assert glass.high[0] <= right.low[0] + EPS, f"{pane.name}: escapes right jamb"
        assert glass.low[1] >= max(left.low[1], right.low[1]) - EPS, (
            f"{pane.name}: extends below jambs"
        )
        overhead = [geometry(obj).low[1] for obj in cornices
                    if geometry(obj).low[1] > center(pane, 1)]
        assert overhead, f"{pane.name}: no overhead cornice"
        gap = min(overhead) - glass.high[1]
        assert gap >= 0.02, f"{pane.name}: cornice clearance {gap:.4f}"
        gaps.append(gap)
        # Derive the spring line from actual jambs and inner radius from arch mesh.
        spring = min(left.high[1], right.high[1])
        arch = [obj for obj in crowns if abs(center(obj, 0) - x) < 0.5]
        assert len(arch) == 11, f"{pane.name}: expected eleven crown stones"
        inner_radius = min(((point[0] - x)**2 + (point[1] - spring)**2)**0.5
                           for obj in arch for point in geometry(obj).points)
        for point in glass.points:
            if point[1] > spring + EPS:
                radius = ((point[0] - x)**2 + (point[1] - spring)**2)**0.5
                assert radius <= inner_radius + EPS, (
                    f"{pane.name}: glazing radius {radius:.4f} exceeds arch {inner_radius:.4f}"
                )
        assert max(geometry(obj).high[1] for obj in arch) < min(overhead) - 0.01, (
            f"{pane.name}: stone crown intersects cornice"
        )
    return f"three arched panes fit jambs/crowns; minimum cornice gap {min(gaps):.3f}"


CHECKS = {
    "payments": (payments_piers, payments_scanner, payments_crates, payments_parcels),
    "seeds": (seeds_drums, seeds_supports, seeds_arch),
    "potera": (potera_door, potera_glazing),
}


def verify_scene(kind):
    bpy.context.view_layer.update()
    geometry_cache.clear()
    for check in CHECKS[kind]:
        try:
            detail = check()
            passed.append(check.__name__)
            print(f"LAYOUT PASS {kind}: {detail}", flush=True)
        except AssertionError as error:
            failure = f"{kind}/{check.__name__}: {error}"
            failures.append(failure)
            print(f"LAYOUT FAIL {failure}", flush=True)


def main():
    requested = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else list(SUPPORTED)
    assert requested and all(kind in SUPPORTED for kind in requested), (
        f"Choose one or more worlds from {', '.join(SUPPORTED)}"
    )
    module = ast.parse(GENERATOR.read_text(), filename=str(GENERATOR))
    exports = [node for node in module.body
               if isinstance(node, ast.FunctionDef) and node.name == "export"]
    assert len(exports) == 1, "Expected one top-level export function to intercept"
    # Prevent batching and disk export while preserving the real generators/helpers.
    exports[0].body = ast.parse("_verify_authored_scene(name)").body
    ast.fix_missing_locations(module)
    original_argv = sys.argv
    try:
        sys.argv = [str(GENERATOR), "--", *requested]
        exec(compile(module, str(GENERATOR), "exec"), {
            "__file__": str(GENERATOR), "__name__": "__main__",
            "_verify_authored_scene": verify_scene,
        })
    finally:
        sys.argv = original_argv
    print(f"LAYOUT RESULT {len(passed)} passed, {len(failures)} failed; no GLBs written", flush=True)
    assert not failures, "\n".join(failures)


if __name__ == "__main__":
    main()
