import test from "node:test";
import assert from "node:assert/strict";
import {
  MATRIX_WIDTH, MATRIX_HEIGHT, MATRIX_FPS,
  createMatrixRain, advanceMatrixRain, forEachMatrixGlyph, paintMatrixRain,
} from "../components/scenes/planets/matrix-rain.ts";

const glyphs = (rain) => {
  const output = [];
  forEachMatrixGlyph(rain, (...glyph) => output.push(glyph));
  return output;
};

test("the first frame is populated and deterministic, including when motion is disabled", () => {
  const first = glyphs(createMatrixRain());
  assert.deepEqual(first, glyphs(createMatrixRain()));
  assert.ok(first.length > 300 && first.length < 1700);
  assert.ok(first.some(([, , , , head]) => head));
  assert.ok(first.some(([glyph]) => glyph.codePointAt(0) > 255));
});

test("every glyph stays within the TV texture bounds", () => {
  const rain = createMatrixRain();
  for (let second = 0; second < 120; second++) {
    rain.elapsed = second;
    for (const [glyph, x, y, opacity] of glyphs(rain)) {
      assert.equal(Array.from(glyph).length, 1);
      assert.ok(x >= 0 && x < MATRIX_WIDTH - 13);
      assert.ok(y > 0 && y < MATRIX_HEIGHT);
      assert.ok(opacity > 0 && opacity <= 1);
    }
  }
});

test("pause and invalid deltas do not change animation state", () => {
  const rain = createMatrixRain();
  const original = structuredClone(rain);
  assert.equal(advanceMatrixRain(rain, 90, false), false);
  for (const delta of [0, -1, NaN, Infinity]) {
    assert.equal(advanceMatrixRain(rain, delta, true), false);
  }
  assert.deepEqual(rain, original);
});

test("rain speed is independent of render rate, while uploads are capped at 20 fps", () => {
  const elapsed = [];
  for (const fps of [20, 30, 60, 120, 144]) {
    const rain = createMatrixRain();
    let uploads = 0;
    for (let frame = 0; frame < fps * 10; frame++) {
      if (advanceMatrixRain(rain, 1 / fps, true)) uploads++;
    }
    assert.equal(uploads, MATRIX_FPS * 10, `texture uploads at ${fps} fps`);
    elapsed.push(rain.elapsed);
  }
  assert.ok(elapsed.every((time) => Math.abs(time - 18) < 1e-8));
});

test("resuming after a long idle does not fast-forward the TV", () => {
  const rain = createMatrixRain();
  advanceMatrixRain(rain, 30, true);
  assert.ok(Math.abs(rain.elapsed - 8.1) < 1e-9);
  assert.notDeepEqual(glyphs(rain), glyphs(createMatrixRain()));
});

test("drawing clears the screen and restores canvas state without accumulating trails", () => {
  const calls = [];
  const context = {
    fillRect: (...args) => calls.push(["rect", ...args]),
    fillText: (...args) => calls.push(["glyph", ...args]),
  };
  const rain = createMatrixRain();
  paintMatrixRain(context, rain);
  assert.deepEqual(calls[0], ["rect", 0, 0, MATRIX_WIDTH, MATRIX_HEIGHT]);
  assert.equal(calls.filter(([type]) => type === "glyph").length, glyphs(rain).length);
  assert.equal(context.globalAlpha, 1);
  assert.equal(context.shadowBlur, 0);
});
