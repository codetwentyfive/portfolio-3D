import test from "node:test";
import assert from "node:assert/strict";
import {
  SHEEP_REACTION_DURATIONS, createSheepClocks, startSheepReaction,
  advanceSheepClocks, sampleSheepReaction,
} from "../components/scenes/planets/sheep-motion.ts";

test("all reaction trajectories stay within the checked head clearance envelope", () => {
  for (let index = 0; index < 6; index++) {
    for (let step = 0; step <= 1000; step++) {
      const value = sampleSheepReaction(index, SHEEP_REACTION_DURATIONS[index] * step / 1000);
      assert.ok(value.pitch >= -.485 && value.pitch <= .035, `sheep ${index} pitch`);
      assert.ok(value.yaw >= -.125 && value.yaw <= .125, `sheep ${index} yaw`);
      assert.ok(value.hop >= 0 && value.hop <= .19, `sheep ${index} height`);
    }
  }
});

test("lamb has two separate hops with exact grounded starts and landings", () => {
  const at = (p) => sampleSheepReaction(2, p * SHEEP_REACTION_DURATIONS[2]).hop;
  for (const p of [0, .12, .38, .43, .48, .79, .99, 1]) assert.equal(at(p), 0);
  assert.ok(at(.25) > .13);
  assert.ok(at(.635) > .18);
  for (const index of [0, 1, 3, 4, 5]) assert.equal(sampleSheepReaction(index, .7).hop, 0);
});

test("clicking or replaying one sheep preserves other reactions", () => {
  const clocks = createSheepClocks();
  startSheepReaction(clocks, 0);
  for (let frame = 0; frame < 10; frame++) advanceSheepClocks(clocks, .02);
  startSheepReaction(clocks, 4);
  const firstTime = clocks[0];
  assert.ok(firstTime > 0);
  assert.equal(clocks[4], 0);
  advanceSheepClocks(clocks, .02);
  startSheepReaction(clocks, 4);
  assert.ok(clocks[0] > firstTime);
  assert.equal(clocks[4], 0);
  assert.equal(startSheepReaction(clocks, -1), false);
  assert.equal(startSheepReaction(clocks, 6), false);
});

test("repeated lamb clicks let the current hops land without a position jump", () => {
  const clocks = createSheepClocks();
  startSheepReaction(clocks, 2);
  for (let frame = 0; frame < 30; frame++) advanceSheepClocks(clocks, .02);
  const before = sampleSheepReaction(2, clocks[2]);
  assert.ok(before.hop > 0);
  assert.equal(startSheepReaction(clocks, 2), false);
  assert.equal(sampleSheepReaction(2, clocks[2]).hop, before.hop);
  for (let frame = 0; frame < 130; frame++) advanceSheepClocks(clocks, .02);
  assert.equal(clocks[2], -1);
  assert.equal(startSheepReaction(clocks, 2), true);
});

test("reactions finish independently and return all geometry to its exact rest pose", () => {
  const clocks = createSheepClocks();
  for (let index = 0; index < 6; index++) startSheepReaction(clocks, index);
  for (let frame = 0; frame < 50; frame++) advanceSheepClocks(clocks, .05);
  assert.equal(clocks[1], -1);
  assert.ok(clocks[4] > 0);
  for (let frame = 0; frame < 30; frame++) advanceSheepClocks(clocks, .05);
  assert.equal(advanceSheepClocks(clocks, .05), false);
  assert.deepEqual(clocks, [-1, -1, -1, -1, -1, -1]);
  for (let index = 0; index < 6; index++) {
    const { pitch, yaw, hop, wool, accent } = sampleSheepReaction(index, clocks[index]);
    assert.deepEqual({ pitch, yaw, hop, wool, accent }, { pitch: 0, yaw: 0, hop: 0, wool: 0, accent: 0 });
  }
});

test("reduced motion keeps geometry and accents still while retaining feedback timing", () => {
  for (let index = 0; index < 6; index++) {
    const value = sampleSheepReaction(index, .75, false);
    assert.equal(value.active, true);
    assert.deepEqual([value.pitch, value.yaw, value.hop, value.wool, value.accent], [0, 0, 0, 0, 0]);
  }
});

test("the six reactions have distinct trajectories", () => {
  const signatures = SHEEP_REACTION_DURATIONS.map((duration, index) => JSON.stringify(
    [.25, .5, .75].map((p) => {
      const { pitch, yaw, hop, wool, accent } = sampleSheepReaction(index, duration * p);
      return [pitch, yaw, hop, wool, accent];
    }),
  ));
  assert.equal(new Set(signatures).size, 6);
});
