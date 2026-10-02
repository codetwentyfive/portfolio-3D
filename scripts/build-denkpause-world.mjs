/**
 * denk.pause — The Quiet Garden, v2.
 * Deterministic, original geometry. No external model/texture services.
 * Run: node scripts/build-denkpause-world.mjs
 */
import * as T from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const versions = JSON.parse(await fs.readFile(path.join(root, 'assets/world-versions.json'), 'utf8'));
const version = versions.denkpause;
globalThis.FileReader = class {
  async readAsArrayBuffer(blob) { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
  async readAsDataURL(blob) { this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`; this.onloadend?.(); }
};
let seed = 240926;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const range = (a, b) => a + random() * (b - a);
const scene = new T.Scene();
const batches = new Map();
const palette = {
  stone: ['#d8cdb9', .88], stoneLight: ['#eee5d1', .81], stoneDark: ['#a39a84', .95],
  earth: ['#716e59', 1], gravel: ['#a8a68f', 1],
  bronze: ['#665842', .35, .75], brass: ['#b59b61', .3, .68],
  timber: ['#97744f', .68], endgrain: ['#b6966d', .8],
  leaf: ['#68734c', .78], leafLight: ['#95a574', .76], leafSilver: ['#b0b69a', .83],
  bark: ['#74634d', .92], moss: ['#78856a', 1],
  lilac: ['#b6a2c4', .68], linen: ['#e9dfc8', .96],
  ink: ['#282d2b', .3, .4], screen: ['#ffffff', .75], logo: ['#ffffff', .8],
  glow: ['#ffe4ab', .4], water: ['#527f76', .19, .18], ripple: ['#9fbfb0', .23, .1],
};
const materials = Object.fromEntries(Object.entries(palette).map(([name, [color, roughness, metalness = 0]]) => {
  const physical = name === 'water' || name === 'ink';
  const material = new (physical ? T.MeshPhysicalMaterial : T.MeshStandardMaterial)({
    name, color, roughness, metalness,
    vertexColors: !['screen', 'logo'].includes(name),
    side: name.startsWith('leaf') || name === 'logo' ? T.DoubleSide : T.FrontSide,
    ...(physical ? { clearcoat: 1, clearcoatRoughness: .16 } : {}),
    ...(name === 'glow' ? { emissive: '#ffd291', emissiveIntensity: .7 } : {}),
  });
  return [name, material];
}));

function mesh(name, geometry, material, p = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  if (['screen', 'logo'].includes(material)) {
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  }
  const matrix = new T.Matrix4().compose(new T.Vector3(...p), new T.Quaternion().setFromEuler(new T.Euler(...rotation)), new T.Vector3(...scale));
  geometry.applyMatrix4(matrix);
  if (!geometry.index) geometry.setIndex(Array.from({ length: geometry.attributes.position.count }, (_, i) => i));
  if (!geometry.attributes.uv) geometry.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
  if (!['screen', 'logo'].includes(material)) {
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const shade = range(.9, 1.04);
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      // Slow mineral variation plus subtle darkening where forms meet the ground.
      const grain = material.startsWith('stone') ? Math.sin(x * 38 + Math.sin(z * 17) * 1.6 + y * 61) * .018 : 0;
      const contact = ['stone', 'timber', 'bark'].includes(material) ? .9 + .1 * Math.min(1, Math.max(0, y) / .9) : 1;
      const v = (shade + grain) * contact;
      colors.set([v, v, v], i * 3);
    }
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  }
  if (!batches.has(material)) batches.set(material, []);
  batches.get(material).push(mergeVertices(geometry, .00001));
}
const box = (name, p, size, material, rotation) => mesh(name, new T.BoxGeometry(...size), material, p, rotation);
function roundShape(w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2), x = -w / 2, y = -h / 2;
  const s = new T.Shape();
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); s.closePath();
  return s;
}
function rounded(name, p, size, material, radius = .035, rotation = [0, 0, 0]) {
  const g = new T.ExtrudeGeometry(roundShape(size[0], size[1], radius), { depth: size[2], bevelEnabled: true, bevelSize: .009, bevelThickness: .009, bevelSegments: 1, curveSegments: 3, steps: 1 });
  g.translate(0, 0, -size[2] / 2);
  mesh(name, g, material, p, rotation);
}
function slab(name, p, w, d, h, material, r = .04, angle = 0) {
  rounded(name, p, [w, d, h], material, r, [-Math.PI / 2, 0, angle]);
}
function cylinder(name, p, top, bottom, height, material, segments = 48) {
  mesh(name, new T.CylinderGeometry(top, bottom, height, segments), material, p);
}
function rod(name, a, b, r, material, r2 = r, segments = 8) {
  const d = new T.Vector3(...b).sub(new T.Vector3(...a));
  const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize());
  mesh(name, new T.CylinderGeometry(r2, r, d.length(), segments), material, new T.Vector3(...a).addScaledVector(d, .5).toArray(), new T.Euler().setFromQuaternion(q).toArray().slice(0, 3));
}
function arc(name, p, inner, outer, start, end, depth, material, bevel = .012) {
  const s = new T.Shape();
  s.absarc(0, 0, outer, start, end, false);
  s.absarc(0, 0, inner, end, start, true); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: Math.max(2, Math.ceil((end - start) * 10)) });
  g.rotateX(-Math.PI / 2);
  mesh(name, g, material, p);
}
function stone(name, p, size, material = 'stoneDark') {
  const g = new T.IcosahedronGeometry(1, 1);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = 1 + .1 * Math.sin(x * 7 + z * 3 + y * 9);
    pos.setXYZ(i, x * n, y * n, z * n);
  }
  g.computeVertexNormals(); mesh(name, g, material, p, [range(-.2, .2), range(0, 6.28), range(-.1, .1)], size);
}

// A hand-laid limestone island. The dark reveal separates the two dressed courses.
cylinder('Lower mineral foundation', [0, -.35, 0], 2.56, 2.4, .38, 'stoneDark', 96);
cylinder('Bronze shadow reveal', [0, -.13, 0], 2.56, 2.56, .045, 'bronze', 96);
cylinder('Terrace foundation', [0, -.025, 0], 2.65, 2.6, .16, 'stone', 96);
for (let i = 0; i < 56; i++) {
  const a = i / 56 * Math.PI * 2;
  arc('Individual radial coping', [0, .05, 0], 2.38, 2.63, a + .009, a + Math.PI * 2 / 56 - .009, .13, 'stoneLight', .008);
  if (i % 2 === 0) arc('Lower dressed blocks', [0, -.43, 0], 2.36, 2.54, a + .008, a + Math.PI * 4 / 56 - .008, .21, 'stone', .008);
}
cylinder('Inner limestone deck', [0, .095, 0], 2.4, 2.4, .13, 'stone', 96);
// Large, separated paving slabs create readable scale and fine shadow lines.
for (let ix = -3; ix <= 3; ix++) for (let iz = -3; iz <= 3; iz++) {
  const x = ix * .61, z = iz * .61;
  if (Math.hypot(Math.abs(x) + .3, Math.abs(z) + .3) < 2.38)
    slab('Honed paving', [x, .171, z], .593, .593, .025, (ix + iz) % 4 === 0 ? 'stoneLight' : 'stone', .012);
}
// Two welcome steps project just beyond the circular edge.
slab('Lower entry tread', [-.64, -.22, 2.48], 1.26, .48, .15, 'stoneDark', .065);
slab('Upper entry tread', [-.64, -.045, 2.26], 1.26, .5, .14, 'stoneLight', .06);
for (const z of [2.35, 2.12]) box('Entry tread bronze inset', [-.64, z === 2.35 ? -.138 : .032, z], [1.05, .008, .012], 'brass');

// Twin vaulted portals: genuine openings, bevelled arrises, and a cedar ribbed vault.
function portal(z) {
  const cx = -.87, floor = .22, spring = 1.43, outer = 1.05, inner = .82;
  const s = new T.Shape();
  s.moveTo(-outer, 0); s.lineTo(-outer, spring);
  s.absarc(0, spring, outer, Math.PI, 0, true);
  s.lineTo(outer, 0); s.lineTo(inner, 0); s.lineTo(inner, spring);
  s.absarc(0, spring, inner, 0, Math.PI, false); s.lineTo(-inner, 0); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: .22, bevelEnabled: true, bevelSize: .022, bevelThickness: .022, bevelSegments: 3, curveSegments: 40 });
  mesh('Carved travertine portal', g, 'stoneLight', [cx, floor, z]);
  for (const x of [cx - .94, cx + .94]) {
    slab('Portal foot', [x, .24, z + .11], .34, .4, .12, 'stone', .03);
    for (let y = .58; y < 1.55; y += .33) box('Horizontal stone joint', [x, y, z + .244], [.21, .008, .005], 'stoneDark');
  }
  // Radial voussoir joints on the front arch.
  for (let i = 1; i < 15; i++) {
    const a = i * Math.PI / 15;
    rod('Radial voussoir joint', [cx + Math.cos(a) * .837, floor + spring + Math.sin(a) * .837, z + .245], [cx + Math.cos(a) * 1.037, floor + spring + Math.sin(a) * 1.037, z + .245], .0045, 'stoneDark', .0045, 5);
  }
}
portal(-.76); portal(-1.5);
for (let i = 0; i < 27; i++) {
  const a = .06 + i / 26 * (Math.PI - .12);
  const x = -.87 + Math.cos(a) * .91, y = 1.65 + Math.sin(a) * .91;
  rounded('Cedar vault louvre', [x, y, -1.08], [.048, .07, 1.05], i % 4 ? 'timber' : 'endgrain', .012, [0, 0, a - Math.PI / 2]);
}
// Rear timber screen, joints and a reading ledge visible through the arch.
for (let i = 0; i < 14; i++) rounded('Vertical rear cedar screen', [-1.59 + i * .11, .93, -1.63], [.048, 1.45, .065], 'timber', .012);
slab('Interior reading ledge', [-.86, .66, -1.41], 1.62, .33, .07, 'timber');
for (const x of [-1.42, -.29]) rod('Reading ledge bronze support', [x, .25, -1.39], [x, .63, -1.39], .022, 'bronze');
// Curved side enclosure meets the tree garden without blocking the app.
arc('Low garden wall', [0, .18, 0], 2.11, 2.31, .12, 1.75, .31, 'stone', .02);
arc('Garden wall coping', [0, .5, 0], 2.08, 2.34, .12, 1.75, .055, 'stoneLight');

// Reflection garden: inset dark basin, raised dressed lip, still reflective water.
const pool = [1.05, .207, .58];
slab('Reflecting pool basin', pool, 1.46, 2.25, .09, 'bronze', .26);
slab('Still garden water', [pool[0], .259, pool[2]], 1.34, 2.13, .01, 'water', .24);
for (const x of [.305, 1.795]) slab('Pool edge coping', [x, .28, .58], .115, 2.23, .16, 'stoneLight', .045);
for (const z of [-.57, 1.73]) slab('Pool end coping', [1.05, .28, z], 1.59, .13, .16, 'stoneLight', .045);
// Thin ripple arcs sit on the water, sparse enough to remain calm at thumbnail scale.
for (let i = 0; i < 4; i++) arc('Water ripple', [1.16, .273, .91], .16 + i * .095, .165 + i * .095, .25, 2.4, .001, 'ripple', 0);
for (const [x, z, a] of [[.9, 1.23, .5], [1.39, .9, -.4]]) {
  arc('Water lily leaf', [x, .28, z], 0, .085, .15, Math.PI * 2 - .15, .007, 'leaf', 0);
}
// A single bridge/touchdown separates app hardware from the garden.
slab('Phone landing bridge', [.44, .385, .18], .94, .78, .12, 'stoneLight', .06);
slab('Phone pedestal foot', [.44, .51, .19], .62, .43, .14, 'stone', .035);
rounded('Phone pedestal', [.44, .72, .16], [.33, .4, .27], 'stoneLight', .035);
// Rounded graphite shell, machined metal perimeter, tiny speakers and side controls.
const phone = [.44, 1.44, .29];
rounded('Titanium device perimeter', phone, [.795, 1.53, .108], 'bronze', .103);
rounded('Graphite glass surround', [.44, 1.44, .351], [.754, 1.484, .027], 'ink', .089);
const screenGeometry = new T.ShapeGeometry(roundShape(.65, 1.407, .066), 12);
const screenUV = screenGeometry.attributes.uv;
for (let i = 0; i < screenUV.count; i++) screenUV.setXY(i, (screenUV.getX(i) + .325) / .65, (screenUV.getY(i) + .7035) / 1.407);
mesh('Authentic app welcome screen', screenGeometry, 'screen', [.44, 1.435, .382]);
rounded('Earpiece', [.44, 2.116, .376], [.1, .012, .004], 'ink', .005);
cylinder('Lens', [.515, 2.116, .376], .012, .012, .004, 'ink', 12);
for (const [x, y, h] of [[.844, 1.76, .13], [.037, 1.8, .1], [.037, 1.64, .1]]) rounded('Side button', [x, y, .302], [.012, h, .035], 'brass', .004);
for (let i = 0; i < 6; i++) box('Bottom speaker port', [.3 + i * .057, .669, .325], [.018, .008, .026], 'ink');
// Official identity on an inset enamel plaque — original image pixels retained.
rounded('Enamel identity plaque', [-.87, 1.15, -.505], [.65, .36, .036], 'linen', .035);
mesh('Official denk.pause mark', new T.PlaneGeometry(.58, .27), 'logo', [-.87, 1.15, -.477]);
for (const x of [-1.1, -.64]) rod('Plaque suspension', [x, 1.33, -.49], [x, 2.4, -.52], .005, 'bronze', .005, 6);
for (const x of [-1.13, -.61]) mesh('Plaque brass pin', new T.SphereGeometry(.009, 8, 6), 'brass', [x, 1.28, -.464]);

// Hand-built curved bench: bronze frame, individual warm timber slats and linen pad.
for (const a of [2.6, 3.7]) {
  const x = -.87 + Math.cos(a) * .74, z = .68 - Math.sin(a) * .74;
  box('Bench bronze leg', [x, .39, z], [.065, .43, .085], 'bronze');
  slab('Bench foot', [x, .21, z], .18, .19, .04, 'bronze', .02);
}
for (let i = 0; i < 22; i++) {
  const a = 2.3 + i * .068;
  const x = -.87 + Math.cos(a) * .77, z = .68 - Math.sin(a) * .77;
  slab('Radial seat slat', [x, .61, z], .045, .37, .06, i % 5 ? 'timber' : 'endgrain', .012, a - Math.PI / 2);
}
slab('Linen seat pad', [-1.59, .659, .56], .29, .3, .037, 'linen', .05, .05);
// Reading table, open book with separate leaf edges, and a ceramic cup.
cylinder('Side table pedestal', [-.79, .43, .72], .045, .065, .43, 'bronze', 16);
cylinder('Side table honed top', [-.79, .65, .72], .285, .27, .05, 'stoneLight', 48);
slab('Book linen cover', [-.84, .697, .72], .26, .21, .025, 'lilac', .012, -.18);
for (let i = 0; i < 4; i++) slab('Visible book pages', [-.84, .714 + i * .004, .72], .243, .194, .002, 'linen', .008, -.18);
cylinder('Ceramic cup', [-.63, .728, .64], .043, .037, .095, 'linen', 24);
cylinder('Coffee surface', [-.63, .779, .64], .034, .034, .003, 'bark', 24);
mesh('Cup handle', new T.TorusGeometry(.026, .009, 6, 16), 'linen', [-.58, .743, .64], [Math.PI / 2, 0, 0]);

// Sculptural olive tree with tapered, curved limbs and thousands of distinct leaves.
cylinder('Tree planter bronze reveal', [1.11, .19, -1.28], .68, .63, .1, 'bronze', 64);
cylinder('Tree planter stone', [1.11, .295, -1.28], .7, .65, .17, 'stone', 64);
cylinder('Earth', [1.11, .388, -1.28], .626, .626, .013, 'earth', 64);
function branch(points, radius, endRadius) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
  const g = new T.TubeGeometry(curve, 12, radius, 7, false);
  const pos = g.attributes.position;
  for (let i = 0; i <= 12; i++) {
    const center = curve.getPointAt(i / 12), factor = 1 + (endRadius / radius - 1) * (i / 12);
    for (let j = 0; j <= 7; j++) {
      const n = i * 8 + j;
      const v = new T.Vector3().fromBufferAttribute(pos, n).sub(center).multiplyScalar(factor).add(center);
      pos.setXYZ(n, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals(); mesh('Olive branch', g, 'bark');
}
branch([[1.11, .38, -1.28], [1.02, .85, -1.24], [1.22, 1.5, -1.25], [1.13, 2.04, -1.21], [1.25, 2.62, -1.2]], .11, .025);
const crowns = [
  [.55, 2.55, -1.21, .49], [1.17, 2.94, -1.31, .51], [1.77, 2.75, -1.17, .49],
  [1.95, 2.21, -.87, .43], [.71, 2.02, -.96, .39], [1.42, 2.43, -1.71, .43],
  [1.42, 2.54, -.63, .44], [.55, 2.8, -1.69, .35],
];
const leafGeometry = new T.BufferGeometry();
leafGeometry.setAttribute('position', new T.Float32BufferAttribute([0, -.09, 0, -.029, -.015, 0, 0, 0, .014, .029, -.015, 0, -.018, .055, .002, .018, .055, .002, 0, .105, 0], 3));
leafGeometry.setIndex([0, 1, 2, 0, 2, 3, 1, 4, 2, 3, 2, 5, 4, 6, 2, 2, 6, 5]);
leafGeometry.computeVertexNormals();
for (const [idx, [cx, cy, cz, r]] of crowns.entries()) {
  branch([[1.16, 1.61 + idx * .057, -1.24], [(cx + 1.16) / 2, cy - .28, (cz - 1.24) / 2], [cx, cy, cz]], .048, .011);
  for (let twig = 0; twig < 12; twig++) {
    const angle = twig / 12 * Math.PI * 2;
    const ex = cx + Math.cos(angle) * r * .8, ez = cz + Math.sin(angle) * r * .8, ey = cy + range(-.12, .22);
    rod('Fine olive twig', [cx, cy - .07, cz], [ex, ey, ez], .009, 'bark', .003, 5);
  }
  for (let i = 0; i < 210; i++) {
    const theta = range(0, 2 * Math.PI), u = range(-1, 1), rad = Math.cbrt(random()) * r;
    const p = [cx + Math.cos(theta) * Math.sqrt(1 - u * u) * rad, cy + u * rad * .63, cz + Math.sin(theta) * Math.sqrt(1 - u * u) * rad];
    mesh('Olive leaf', leafGeometry.clone(), ['leaf', 'leafLight', 'leafSilver'][i % 3], p, [range(-1.2, 1.2), range(0, 6.28), range(-1.2, 1.2)], [range(.7, 1.1), range(.75, 1.25), 1]);
  }
}
// Root flare and carefully placed river stones at the trunk.
for (let i = 0; i < 7; i++) {
  const a = i / 7 * Math.PI * 2;
  rod('Olive root flare', [1.09, .58, -1.26], [1.11 + Math.cos(a) * .3, .395, -1.28 + Math.sin(a) * .3], .041, 'bark', .006, 7);
}
for (let i = 0; i < 46; i++) {
  const a = range(0, 6.28), r = range(.24, .57);
  stone('Planter river pebble', [1.11 + Math.cos(a) * r, .416, -1.28 + Math.sin(a) * r], [range(.035, .075), range(.017, .035), range(.03, .06)], i % 4 ? 'gravel' : 'stoneLight');
}
// Small plants are geometry rather than opaque foliage blobs.
function grass(x, y, z, height, mat = 'moss') {
  for (let i = 0; i < 9; i++) {
    const a = range(0, 6.28), h = range(height * .6, height), lean = range(.06, .15);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute([x, y, z, x + Math.cos(a) * lean / 2 - .012, y + h * .55, z + Math.sin(a) * lean / 2, x + Math.cos(a) * lean / 2 + .012, y + h * .55, z + Math.sin(a) * lean / 2, x + Math.cos(a) * lean, y + h, z + Math.sin(a) * lean], 3));
    g.setIndex([0, 1, 2, 1, 3, 2]); g.computeVertexNormals(); mesh('Fine garden grass', g, mat);
  }
}
for (const [x, z] of [[-2.0, -.55], [-1.93, -.98], [-1.56, -1.95], [.34, -1.99], [1.8, -1.15], [1.93, -.45], [-1.87, 1.04], [-1.72, 1.39]]) {
  stone('Garden moss cushion', [x, .24, z], [.16, .065, .13], 'moss');
  grass(x, .24, z, .28, 'leaf');
  for (let i = 0; i < 5; i++) {
    const px = x + range(-.17, .17), pz = z + range(-.14, .14);
    const h = range(.2, .4);
    rod('Lavender stem', [px, .25, pz], [px + .025, .25 + h, pz], .004, 'moss', .003, 5);
    for (let j = 0; j < 3; j++) mesh('Lavender flower', new T.IcosahedronGeometry(.016, 0), 'lilac', [px + .025, .25 + h + j * .025, pz], [0, j, 0], [1, 1.4, 1]);
  }
}
// Warm bollards, each with a physical inset light source and bronze cap.
for (const [x, z] of [[-1.1, 1.89], [1.85, .34], [-2.03, .23]]) {
  slab('Lantern footing', [x, .215, z], .18, .18, .04, 'stoneDark', .025);
  rounded('Bronze garden lantern', [x, .39, z], [.11, .32, .11], 'bronze', .022);
  rounded('Warm lantern inset', [x, .415, z + .058], [.063, .17, .008], 'glow', .013);
  slab('Lantern cap', [x, .56, z], .145, .145, .035, 'bronze', .018);
}

// Merge by material: sculptural detail without thousands of runtime draw calls.
let triangles = 0;
for (const [material, geometries] of batches) {
  const merged = mergeGeometries(geometries);
  triangles += merged.index.count / 3;
  // Native glTF quantization needs no decoder download. A shared 1/8192 grid
  // preserves joints across material batches and is below visible detail size.
  const pos = merged.attributes.position;
  merged.setAttribute('position', new T.BufferAttribute(Int16Array.from(pos.array, value => Math.round(value * 8192)), 3));
  const color = merged.attributes.color;
  if (color) merged.setAttribute('color', new T.BufferAttribute(Uint8Array.from(color.array, value => Math.round(Math.min(1, value) * 255)), 3, true));
  if (!['stone', 'stoneLight', 'stoneDark', 'timber', 'endgrain', 'bark', 'screen', 'logo'].includes(material)) merged.deleteAttribute('uv');
  const obj = new T.Mesh(merged, materials[material]); obj.scale.setScalar(1 / 8192); obj.name = `Quiet Garden ${material}`; scene.add(obj);
}
const buffer = Buffer.from(await new GLTFExporter().parseAsync(scene, { binary: true }));
const jsonSize = buffer.readUInt32LE(12);
const doc = JSON.parse(buffer.subarray(20, 20 + jsonSize));
// Align quantized vertex strides to the glTF four-byte boundary. Three r162's
// exporter otherwise emits tightly packed VEC3 byte/short attributes.
const sourceBin = buffer.subarray(28 + jsonSize);
const chunks = [];
let byteOffset = 0;
for (const view of doc.bufferViews) {
  let data = sourceBin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  if (view.byteStride && view.byteStride % 4) {
    const stride = Math.ceil(view.byteStride / 4) * 4;
    const count = view.byteLength / view.byteStride;
    const padded = Buffer.alloc(count * stride);
    for (let i = 0; i < count; i++) data.copy(padded, i * stride, i * view.byteStride, (i + 1) * view.byteStride);
    data = padded; view.byteStride = stride;
  }
  view.byteOffset = byteOffset; view.byteLength = data.length;
  const padding = Buffer.alloc((4 - data.length % 4) % 4);
  chunks.push(data, padding); byteOffset += data.length + padding.length;
}
let bin = Buffer.concat(chunks);
doc.images = []; doc.textures = []; doc.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }, { magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
function embed(png, name, names, repeat = false) {
  const start = bin.length;
  bin = Buffer.concat([bin, png, Buffer.alloc((4 - png.length % 4) % 4)]);
  doc.bufferViews.push({ buffer: 0, byteOffset: start, byteLength: png.length });
  doc.images.push({ name, bufferView: doc.bufferViews.length - 1, mimeType: 'image/png' });
  doc.textures.push({ sampler: repeat ? 1 : 0, source: doc.images.length - 1 });
  for (const material of names) doc.materials.find(m => m.name === material).pbrMetallicRoughness.baseColorTexture = { index: doc.textures.length - 1 };
}
for (const [material, file] of [['screen', 'welcome.png'], ['logo', 'mark.png']]) {
  embed(await fs.readFile(path.join(root, 'public/images/denkpause', file)), material, [material]);
  if (material === 'logo') { const mat = doc.materials.find(m => m.name === material); mat.alphaMode = 'BLEND'; mat.doubleSided = true; }
}
// Small authored surface maps: visible pores in stone, directional grain in timber.
for (const type of ['stone', 'wood']) {
  const size = 256, data = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const noise = random();
    const wave = Math.sin(y * .37 + Math.sin(x * .021) * 3) * Math.sin(y * .047 + x * .005);
    const v = type === 'stone' ? 241 + wave * 5 + noise * 9 - (noise < .025 ? 28 : 0) : 226 + Math.sin(x * .43 + Math.sin(y * .032) * 1.7) * 11 + noise * 10;
    const index = (y * size + x) * 3;
    data[index] = data[index + 1] = data[index + 2] = Math.min(255, Math.max(0, v));
  }
  const png = await sharp(data, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer();
  embed(png, `Authored ${type} grain`, type === 'stone' ? ['stone', 'stoneLight', 'stoneDark'] : ['timber', 'endgrain', 'bark'], true);
}
doc.buffers[0].byteLength = bin.length;
let json = Buffer.from(JSON.stringify(doc)); json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + bin.length, 8); header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length); bh.writeUInt32LE(0x004e4942, 4);
const destination = path.join(root, `public/3d/worlds/denkpause-v${version}.glb`);
await fs.writeFile(destination, Buffer.concat([header, json, bh, bin]));
console.log(`denkpause-v${version}.glb: ${28 + json.length + bin.length} bytes, ${doc.meshes.length} material batches, ${triangles} triangles`);
