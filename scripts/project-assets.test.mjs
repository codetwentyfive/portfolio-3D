import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const root = new URL("../", import.meta.url);
const kinds = ["payments", "seeds", "potera", "assistant"];
const expectedPivots = { payments: 3, seeds: 3, potera: 0, assistant: 4 };

for (const kind of kinds) {
  test(`${kind}: self-contained, detailed GLB stays within web budgets`, () => {
    const file = readFileSync(new URL(`public/3d/worlds/${kind}-v2.glb`, root));
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
    const file = new URL(`public/images/worlds/${kind}-v2.png`, root);
    assert.ok(statSync(file).size < 500000);
    const png = readFileSync(file);
    assert.equal(png.readUInt32BE(16), 720);
    assert.equal(png.readUInt32BE(20), 520);
  }
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
