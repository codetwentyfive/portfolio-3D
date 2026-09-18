import test from "node:test";
import assert from "node:assert/strict";
import { POTERA_CLEANING_DURATION, POTERA_PANE, samplePoteraCleaning } from "../components/scenes/planets/potera-motion.ts";

test("the squeegee clears the whole pane in one monotonic pass without leaving its frame", () => {
  let previousCleaned = 0, previousY = Infinity;
  assert.ok(POTERA_PANE.bladeWidth < POTERA_PANE.width);
  for (let step = 0; step <= 3000; step++) {
    const pose = samplePoteraCleaning(POTERA_CLEANING_DURATION * step / 3000);
    assert.ok(pose.cleaned >= previousCleaned && pose.cleaned <= 1);
    assert.ok(pose.bladeY <= previousY);
    assert.ok(Math.abs(pose.bladeY) + .021 < POTERA_PANE.height / 2);
    assert.ok(pose.toolOpacity >= 0 && pose.toolOpacity <= 1);
    assert.ok(pose.toolZ >= 0 && pose.toolZ <= .055);
    previousCleaned = pose.cleaned;
    previousY = pose.bladeY;
  }
  assert.equal(previousCleaned, 1);
});

test("entry and contact finish are smooth, and sheen only appears on the cleaned pane", () => {
  assert.equal(samplePoteraCleaning(0).toolOpacity, 0);
  assert.equal(samplePoteraCleaning(.18).toolOpacity, 1);
  assert.equal(samplePoteraCleaning(.20).cleaned, 0);
  for (const time of [.20, 2.02]) {
    const epsilon = .00001;
    const a = samplePoteraCleaning(time - epsilon), b = samplePoteraCleaning(time + epsilon);
    assert.ok(Math.abs(a.bladeY - b.bladeY) / (2 * epsilon) < .0001);
  }
  for (let step = 0; step < 300; step++) {
    const pose = samplePoteraCleaning(step * .01);
    if (pose.sheen > .0001) assert.equal(pose.cleaned, 1);
  }
});

test("completion removes the tool and transient sheen while retaining clean glass", () => {
  for (const time of [POTERA_CLEANING_DURATION, 50, NaN, Infinity]) {
    const pose = samplePoteraCleaning(time);
    assert.equal(pose.active, false);
    assert.equal(pose.cleaned, 1);
    assert.equal(pose.toolOpacity, 0);
    assert.ok(pose.sheen < 1e-20);
  }
  const replay = samplePoteraCleaning(0);
  assert.equal(replay.active, true);
  assert.equal(replay.cleaned, 0);
});
