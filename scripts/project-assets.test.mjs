import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

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
      primitives.length <= 26,
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

test("shop: contemporary atelier is self-contained and preserves product pivots", () => {
  const file = readFileSync(new URL(`public/3d/shop/atelier-v${versions.shop}.glb`, root));
  const json = JSON.parse(file.subarray(20, 20 + file.readUInt32LE(12)).toString());
  assert.ok(file.length < 2_000_000, "atelier download budget");
  assert.ok(json.buffers.every((buffer) => !buffer.uri));
  assert.ok((json.images || []).every((image) => !image.uri));
  assert.ok(json.meshes.flatMap((mesh) => mesh.primitives).length <= 28);
  for (const name of ["atelier_bag", "atelier_textile"]) {
    assert.ok(json.nodes.some((node) => node.name === name && node.mesh === undefined), name);
  }
  for (const name of ["Atelier_leather", "Atelier_felt", "Atelier_timber"]) {
    assert.ok(json.materials.some((material) => material.name === name), name);
  }
});
