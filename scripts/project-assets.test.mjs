import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { DoubleSide, Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const root = new URL("../", import.meta.url);
const versions = JSON.parse(
  readFileSync(new URL("assets/world-versions.json", root), "utf8"),
);
const kinds = ["payments", "seeds", "potera", "assistant"];
const expectedPivots = { payments: 3, seeds: 3, potera: 0, assistant: 0 };

for (const kind of kinds) {
  test(`${kind}: self-contained, detailed GLB stays within web budgets`, () => {
    const file = readFileSync(
      new URL(`public/3d/worlds/${kind}-v${versions[kind]}.glb`, root),
    );
    assert.equal(file.readUInt32LE(0), 0x46546c67);
    assert.equal(file.readUInt32LE(4), 2);
    assert.equal(file.readUInt32LE(8), file.length);
    const json = JSON.parse(
      file.subarray(20, 20 + file.readUInt32LE(12)).toString(),
    );
    assert.ok(file.length < 4_000_000, "single world must stay below 4 MB");
    assert.ok(
      json.buffers.every((buffer) => !buffer.uri),
      "no external geometry dependency",
    );
    assert.ok(
      (json.images || []).every((image) => !image.uri),
      "no remote textures",
    );
    const primitives = json.meshes.flatMap((mesh) => mesh.primitives);
    assert.ok(
      primitives.length <= (kind === "potera" ? 32 : 26),
      "static geometry must remain material-batched",
    );
    const triangles = primitives.reduce(
      (sum, p) => sum + json.accessors[p.indices].count / 3,
      0,
    );
    assert.ok(
      triangles > 5000 && triangles < 150000,
      `triangle budget: ${triangles}`,
    );
    for (const p of primitives) {
      const positions = json.accessors[p.attributes.POSITION];
      assert.ok(
        [...positions.min, ...positions.max].every(
          (value) => Number.isFinite(value) && Math.abs(value) < 30,
        ),
      );
      assert.notEqual(p.attributes.NORMAL, undefined);
    }
    const pivots = json.nodes.filter(
      (node) =>
        /^(parcel|cymbal|fan|reel)_/.test(node.name) && node.mesh === undefined,
    );
    assert.equal(
      pivots.length,
      expectedPivots[kind],
      "animation pivots must survive export",
    );
  });
}

test("six catalog previews are present and bounded", () => {
  for (const kind of ["shop", ...kinds, "portfolio"]) {
    const file = new URL(
      `public/images/worlds/${kind}-v${versions[kind]}.png`,
      root,
    );
    assert.ok(statSync(file).size < 500000);
    const png = readFileSync(file);
    assert.equal(png.readUInt32BE(16), 720);
    assert.equal(png.readUInt32BE(20), 520);
  }
});

test("potera: window and equipment keep their independent interactive anchors", () => {
  const file = readFileSync(new URL(`public/3d/worlds/potera-v${versions.potera}.glb`, root));
  const json = JSON.parse(file.subarray(20, 20 + file.readUInt32LE(12)).toString());
  for (const name of ["potera_cleanable_window", "potera_equipment", "potera_service_sign"]) {
    const anchor = json.nodes.find((node) => node.name === name);
    assert.ok(anchor?.children?.length, `${name} must retain clickable child geometry`);
    assert.equal(anchor.mesh, undefined, "interaction anchors must survive material batching");
    assert.ok(anchor.children.some((index) => json.nodes[index].mesh !== undefined));
  }
  const pane = json.nodes.find((node) => node.name === "potera_cleanable_window");
  for (const [index, expected] of [.20, 1.08, -.315].entries()) {
    assert.ok(Math.abs(pane.translation[index] - expected) < .00001, "cleaning overlay must remain aligned with its authored window");
  }
  const child = json.nodes[pane.children[0]];
  const primitive = json.meshes[child.mesh].primitives[0];
  assert.equal(json.materials[primitive.material].name, "Potera bay glass");
  const positions = json.accessors[primitive.attributes.POSITION];
  assert.ok(Math.abs(positions.max[0] - positions.min[0] - 1.38) < .00001);
  assert.ok(Math.abs(positions.max[1] - positions.min[1] - .94) < .00001);
});

for (const [kind, name, decalCount] of [
  ["seeds", "The Strange Seeds official logo", 1],
  ["potera", "Potera Reinigung official logo", 2],
]) {
  test(`${kind}: the original logo is embedded with UVs and transparent edges`, () => {
    const file = readFileSync(
      new URL(`public/3d/worlds/${kind}-v${versions[kind]}.glb`, root),
    );
    const jsonLength = file.readUInt32LE(12);
    const json = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
    const materialIndex = json.materials.findIndex((m) => m.name === name);
    assert.ok(materialIndex >= 0, "dedicated official-brand material");
    const material = json.materials[materialIndex];
    assert.equal(material.alphaMode, "MASK");
    assert.equal(material.pbrMetallicRoughness.metallicFactor, 0);
    assert.ok(material.pbrMetallicRoughness.roughnessFactor > 0.7);
    const textureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
    const image = json.images[json.textures[textureIndex].source];
    assert.equal(image.mimeType, "image/png");
    const view = json.bufferViews[image.bufferView];
    const offset = 28 + jsonLength + (view.byteOffset || 0);
    const embedded = file.subarray(offset, offset + view.byteLength);
    const source = readFileSync(
      new URL(`assets/world-branding/${kind}-logo.png`, root),
    );
    assert.deepEqual(
      embedded,
      source,
      "GLB must embed the prepared original artwork unchanged",
    );
    const provenance = JSON.parse(
      readFileSync(
        new URL("assets/world-branding/provenance.json", root),
        "utf8",
      ),
    );
    assert.equal(
      createHash("sha256").update(source).digest("hex"),
      provenance[kind].textureSha256,
    );
    const decals = json.meshes
      .flatMap((m) => m.primitives)
      .filter((p) => p.material === materialIndex);
    assert.equal(decals.length, 1, "repeated logos share one material batch");
    assert.equal(json.accessors[decals[0].indices].count, decalCount * 6);
    assert.notEqual(decals[0].attributes.TEXCOORD_0, undefined);
    assert.ok(
      Math.max(source.readUInt32BE(16), source.readUInt32BE(20)) <= 512,
    );
  });
}

test("the band generator cannot reintroduce the placeholder initials", () => {
  const generator = readFileSync(
    new URL("scripts/build-project-worlds.py", root),
    "utf8",
  );
  assert.doesNotMatch(generator, /["']SS["']/);
  assert.match(generator, /brand_decal\("Kick drum sunflower logo"/);
});

test("archive UI keys match across both locales", () => {
  const keys = (value, prefix = "") =>
    Object.entries(value)
      .flatMap(([key, item]) =>
        typeof item === "object"
          ? keys(item, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      )
      .sort();
  const en = JSON.parse(
    readFileSync(new URL("messages/en.json", root), "utf8"),
  ).archive;
  const de = JSON.parse(
    readFileSync(new URL("messages/de.json", root), "utf8"),
  ).archive;
  assert.deepEqual(keys(en), keys(de));
});

test("home room has a dedicated UV-mapped TV and embedded room textures", () => {
  const file = readFileSync(new URL(`public/3d/worlds/assistant-v${versions.assistant}.glb`, root));
  const length = file.readUInt32LE(12);
  const json = JSON.parse(file.subarray(20, 20 + length).toString());
  const index = json.materials.findIndex((m) => m.name === "Room OLED screen");
  assert.ok(index >= 0, "runtime must be able to find the OLED material");
  const screen = json.materials[index];
  assert.notEqual(screen.emissiveTexture, undefined, "static previews still show digital rain");
  const primitives = json.meshes.flatMap((mesh) => mesh.primitives).filter((p) => p.material === index);
  assert.equal(primitives.length, 1);
  assert.equal(json.accessors[primitives[0].indices].count, 6, "one flat 16:9 screen");
  assert.notEqual(primitives[0].attributes.TEXCOORD_0, undefined);
  const textureIndex = screen.pbrMetallicRoughness.baseColorTexture.index;
  const view = json.bufferViews[json.images[json.textures[textureIndex].source].bufferView];
  const offset = 28 + length + (view.byteOffset || 0);
  assert.deepEqual(file.subarray(offset, offset + view.byteLength), readFileSync(new URL("assets/home-room/matrix-still.png", root)));
  const required = ["Room walnut", "Room oak", "Room rosewood", "Room warm plaster", "Room speaker weave", "Room burgundy upholstery", "Room framed prints"];
  for (const name of required) {
    const material = json.materials.find((m) => m.name === name);
    assert.notEqual(material?.pbrMetallicRoughness.baseColorTexture, undefined, name);
  }
  const glass = json.materials.find((m) => m.name === "Room cabinet glass");
  assert.equal(glass.alphaMode, "BLEND");
  assert.ok(glass.pbrMetallicRoughness.baseColorFactor[3] < 0.2);
});

test("home-room shelves contain both Mac minis and a metallic DGX Spark", () => {
  const file = readFileSync(new URL(`public/3d/worlds/assistant-v${versions.assistant}.glb`, root));
  const json = JSON.parse(file.subarray(20, 20 + file.readUInt32LE(12)).toString());
  const primitives = json.meshes.flatMap((mesh) => mesh.primitives);
  for (const name of ["Room Mac mini aluminum", "Room DGX Spark champagne"]) {
    const index = json.materials.findIndex((material) => material.name === name);
    assert.ok(index >= 0, name);
    const material = json.materials[index].pbrMetallicRoughness;
    assert.ok(material.metallicFactor > 0.6);
    assert.ok(material.roughnessFactor > 0.2 && material.roughnessFactor < 0.4);
    const hardware = primitives.filter((p) => p.material === index);
    assert.equal(hardware.length, 1, "hardware of one finish shares one batch");
    if (name === "Room Mac mini aluminum") {
      const positions = json.accessors[hardware[0].attributes.POSITION];
      assert.ok(positions.max[0] - positions.min[0] > 0.8, "both separated mini enclosures survive batching");
    }
  }
  assert.equal(json.images.length, 9, "small hardware needs no extra texture downloads");
});

test("shop: broad landscape is self-contained and preserves three articulated sheep", () => {
  const file = readFileSync(new URL(`public/3d/shop/steppe-v${versions.shop}.glb`, root));
  const json = JSON.parse(file.subarray(20, 20 + file.readUInt32LE(12)).toString());
  assert.equal(file.readUInt32LE(0), 0x46546c67);
  assert.equal(file.readUInt32LE(4), 2);
  assert.equal(file.readUInt32LE(8), file.length);
  assert.ok(file.length < 4_000_000, "pastoral island download budget");
  assert.ok(json.buffers.every((buffer) => !buffer.uri));
  assert.ok((json.images || []).every((image) => !image.uri));
  const primitives = json.meshes.flatMap((mesh) => mesh.primitives);
  assert.ok(primitives.length <= 120, "batch static landscape while retaining sheep articulation");
  const triangles = primitives.reduce((sum, p) => sum + json.accessors[p.indices].count / 3, 0);
  assert.ok(triangles > 5000 && triangles < 100000, `triangle budget: ${triangles}`);
  for (const primitive of primitives) {
    const positions = json.accessors[primitive.attributes.POSITION];
    assert.ok([...positions.min, ...positions.max].every((value) => Number.isFinite(value) && Math.abs(value) < 30));
    assert.notEqual(primitive.attributes.NORMAL, undefined);
  }
  const contains = (index, target) => (json.nodes[index].children || []).some((child) => child === target || contains(child, target));
  const hasGeometry = (index) => json.nodes[index].mesh !== undefined || (json.nodes[index].children || []).some(hasGeometry);
  assert.equal(json.nodes.filter((node) => /^sheep_\d+$/.test(node.name)).length, 3, "the open pasture has exactly three sheep");
  for (let i = 0; i < 3; i++) {
    const rootIndex = json.nodes.findIndex((node) => node.name === `sheep_${i}`);
    const headIndex = json.nodes.findIndex((node) => node.name === `sheep_head_${i}`);
    assert.ok(rootIndex >= 0 && headIndex >= 0, `sheep ${i} survives export`);
    for (const part of ["head", "body", "tail", "jaw", "ear_left", "ear_right", "leg_front_left", "leg_front_right", "leg_back_left", "leg_back_right"]) {
      const [kind, ...side] = part.split("_");
      const name = `sheep_${kind}_${i}${side.length ? `_${side.join("_")}` : ""}`;
      const index = json.nodes.findIndex((node) => node.name === name);
      assert.ok(index >= 0, `${name}: articulation pivot survives export`);
      assert.equal(json.nodes[index].mesh, undefined, `${name}: rotation is separated from its geometry`);
      assert.ok(contains(rootIndex, index), `${name}: belongs to its own sheep`);
      assert.ok(hasGeometry(index), `${name}: pivot controls visible geometry`);
      if (kind === "ear" || kind === "jaw") {
        assert.ok(contains(headIndex, index), `${name}: follows the head`);
      }
    }
  }
});

test("shop: the river has finite flow UVs across its full width", () => {
  const file = readFileSync(new URL(`public/3d/shop/steppe-v${versions.shop}.glb`, root));
  const jsonLength = file.readUInt32LE(12);
  const json = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
  const node = json.nodes.find((entry) => entry.name === "Steppe_water_surface");
  assert.notEqual(node?.mesh, undefined, "runtime can find the dedicated water surface");
  const materialIndex = json.materials.findIndex((material) => material.name === "Steppe_river_water");
  assert.ok(materialIndex >= 0, "runtime can find the river material");
  const river = json.meshes[node.mesh].primitives;
  assert.ok(river.length > 0);
  for (const primitive of river) {
    assert.equal(primitive.material, materialIndex);
    const accessor = json.accessors[primitive.attributes.TEXCOORD_0];
    assert.notEqual(accessor, undefined, "water motion needs flow UVs");
    assert.equal(accessor.type, "VEC2");
    assert.equal(accessor.componentType, 5126, "UV coordinates use floats");
    assert.equal(accessor.count, json.accessors[primitive.attributes.POSITION].count);
    const view = json.bufferViews[accessor.bufferView];
    const start = 28 + jsonLength + (view.byteOffset || 0) + (accessor.byteOffset || 0);
    const stride = view.byteStride || 8;
    const minimum = [Infinity, Infinity];
    const maximum = [-Infinity, -Infinity];
    for (let vertex = 0; vertex < accessor.count; vertex++) {
      for (let component = 0; component < 2; component++) {
        const value = file.readFloatLE(start + vertex * stride + component * 4);
        assert.ok(Number.isFinite(value), "river UVs stay finite");
        minimum[component] = Math.min(minimum[component], value);
        maximum[component] = Math.max(maximum[component], value);
      }
    }
    assert.ok(Math.abs(minimum[0]) < 0.001 && Math.abs(maximum[0] - 1) < 0.001, "cross-stream UVs cover both banks");
    assert.ok(maximum[1] - minimum[1] > 4, "longitudinal UVs retain the winding river's authored length");
  }
});

test("shop: hooves and river fit the exported terrain triangles", async () => {
  const file = readFileSync(new URL(`public/3d/shop/steppe-v${versions.shop}.glb`, root));
  const { scene } = await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), "");
  scene.updateMatrixWorld(true);
  const terrain = scene.getObjectByName("Steppe_Steppe_meadow_terrain");
  assert.ok(terrain, "export retains the continuous terrain surface");
  const groundMeshes = [];
  terrain.traverse((object) => {
    if (object.isMesh) {
      object.material.side = DoubleSide;
      groundMeshes.push(object);
    }
  });
  const ray = new Raycaster();
  const point = new Vector3();
  const down = new Vector3(0, -1, 0);
  const clearance = (position) => {
    ray.set(new Vector3(position.x, 30, position.z), down);
    const hit = ray.intersectObjects(groundMeshes, false)[0];
    assert.ok(hit, "ground continues beneath each sampled point");
    return position.y - hit.point.y;
  };
  for (let i = 0; i < 3; i++) {
    for (const side of ["front_left", "front_right", "back_left", "back_right"]) {
      const leg = scene.getObjectByName(`sheep_leg_${i}_${side}`);
      assert.ok(leg);
      const contact = new Vector3(0, Infinity, 0);
      leg.traverse((object) => {
        if (!object.isMesh) return;
        const positions = object.geometry.attributes.position;
        for (let vertex = 0; vertex < positions.count; vertex++) {
          point.fromBufferAttribute(positions, vertex).applyMatrix4(object.matrixWorld);
          if (point.y < contact.y) contact.copy(point);
        }
      });
      assert.ok(Math.abs(clearance(contact)) < 0.002, `${leg.name}: hoof contacts the triangulated meadow`);
    }
  }
  const water = scene.getObjectByName("Steppe_water_surface");
  const positions = water.geometry.attributes.position;
  const indices = water.geometry.index;
  for (let vertex = 0; vertex < positions.count; vertex++) {
    point.fromBufferAttribute(positions, vertex).applyMatrix4(water.matrixWorld);
    assert.ok(clearance(point) > 0.015, "river vertices clear their carved bed");
  }
  const corner = new Vector3();
  for (let triangle = 0; triangle < indices.count; triangle += 3) {
    point.set(0, 0, 0);
    for (let offset = 0; offset < 3; offset++) {
      corner.fromBufferAttribute(positions, indices.getX(triangle + offset)).applyMatrix4(water.matrixWorld);
      point.addScaledVector(corner, 1 / 3);
    }
    assert.ok(clearance(point) > 0.015, "terrain triangles do not cut through the river's interior");
  }
});
