import test from "node:test";
import assert from "node:assert/strict";
import {
  SHEEP_COUNT, SHEEP_HEAD_LIMITS, SHEEP_REACTION_DURATIONS,
  createSheepClocks, startSheepReaction, advanceSheepClocks,
  sampleSheepReaction, sampleSheepIdle, sampleSheepPose,
} from "../components/scenes/planets/sheep-motion.ts";

const geometry = ({ active, progress, ...pose }) => Object.fromEntries(
  Object.entries(pose).map(([key, value]) => [key, value + 0]),
);
const at = (index, progress) => sampleSheepReaction(index, progress * SHEEP_REACTION_DURATIONS[index]);

// Include arbitrary idle phases because they continue underneath the click response.
test("all three reactions and idle stay inside their authored joint envelope", () => {
  assert.equal(SHEEP_COUNT, 3);
  for (let index = 0; index < SHEEP_COUNT; index++) {
    const limits = SHEEP_HEAD_LIMITS[index];
    for (let step = 0; step <= 1600; step++) {
      const pose = sampleSheepPose(index, SHEEP_REACTION_DURATIONS[index] * step / 1600, step * .37, 1);
      assert.ok(pose.pitch >= limits.pitch[0] && pose.pitch <= limits.pitch[1], `sheep ${index} pitch`);
      assert.ok(Math.abs(pose.yaw) <= limits.yaw, `sheep ${index} yaw`);
      assert.ok(pose.hop >= 0 && pose.hop <= .30, `sheep ${index} height`);
      assert.ok(Math.abs(pose.bodyRoll) <= .022);
      assert.ok(pose.bodyStretch >= -.04 && pose.bodyStretch <= .027);
      assert.ok(Math.abs(pose.earLeft) <= .32 && Math.abs(pose.earRight) <= .28);
      assert.ok(Math.abs(pose.tail) <= .185);
      assert.ok(pose.jawPitch >= 0 && pose.jawPitch <= .011);
      assert.ok(Math.abs(pose.jawYaw) <= .027);
    }
  }
});

test("adult reactions keep all feet planted and lamb tucks only during flight", () => {
  for (let step = 0; step <= 1000; step++) {
    const p = step / 1000;
    for (const index of [0, 1]) {
      const { hop, frontLeg, backLeg } = at(index, p);
      assert.deepEqual([hop, frontLeg, backLeg], [0, 0, 0]);
    }
    const pose = at(2, p);
    if (pose.frontLeg !== 0 || pose.backLeg !== 0) assert.ok(pose.hop > .05);
    // Conservative heel/toe points from the authored leg pivot, before root scaling.
    for (const pitch of [pose.frontLeg, pose.backLeg]) {
      for (const z of [-.04, .087]) {
        const hoofY = pose.hop + .31 - .31 * Math.cos(pitch) - z * Math.sin(pitch);
        assert.ok(hoofY >= -1e-9, `hoof below ground at ${p}: ${hoofY}`);
      }
    }
  }
});

test("lamb anticipates one spring and cushions its grounded landing", () => {
  assert.ok(at(2, .16).bodyStretch < -.02);
  assert.equal(at(2, .16).hop, 0);
  assert.ok(Math.abs(at(2, .37).hop - .30) < 1e-12);
  assert.ok(at(2, .37).frontLeg > .44 && at(2, .37).backLeg < -.37);
  for (const p of [0, .25, .49, .60, .99, 1]) assert.equal(at(2, p).hop, 0);
  assert.ok(at(2, .60).bodyStretch < -.03);
  assert.equal(at(2, .60).frontLeg, 0);
  assert.ok(at(2, .60).backLeg === 0);
});

test("all poses begin/end with continuous position and zero boundary velocity", () => {
  const epsilon = .00001;
  for (let index = 0; index < SHEEP_COUNT; index++) {
    const zero = geometry(at(index, 0));
    for (const value of Object.values(zero)) assert.equal(value, 0);
    for (const boundary of [0, 1]) {
      const a = geometry(at(index, boundary === 0 ? 0 : 1 - epsilon));
      const b = geometry(at(index, boundary === 0 ? epsilon : 1));
      for (const key of Object.keys(a)) {
        assert.ok(Math.abs(a[key] - b[key]) / epsilon < .001, `${index}/${key} abrupt boundary velocity`);
      }
    }
  }
  // The lamb's root and legs also settle before either foot contact transition.
  for (const p of [.25, .49]) {
    const a = at(2, p - epsilon), b = at(2, p + epsilon);
    assert.ok(Math.abs(a.hop - b.hop) / (epsilon * 2) < .001);
    assert.equal(a.frontLeg, 0);
    assert.equal(b.frontLeg, 0);
  }
});

test("click entry and exit preserve ongoing idle pose without a snap", () => {
  for (let index = 0; index < SHEEP_COUNT; index++) {
    for (const idleSeconds of [1.7, 5.2, 19.7, 26.1]) {
      const before = geometry(sampleSheepPose(index, -1, idleSeconds, .82));
      assert.deepEqual(geometry(sampleSheepPose(index, 0, idleSeconds, .82)), before);
      assert.deepEqual(geometry(sampleSheepPose(index, SHEEP_REACTION_DURATIONS[index], idleSeconds, .82)), before);
    }
  }
});

test("independent clocks and repeated clicks preserve every running pose", () => {
  const clocks = createSheepClocks();
  assert.deepEqual(clocks, [-1, -1, -1]);
  for (let index = 0; index < SHEEP_COUNT; index++) {
    assert.equal(startSheepReaction(clocks, index), true);
    for (let frame = 0; frame < 11; frame++) advanceSheepClocks(clocks, .02);
    const before = [...clocks];
    assert.equal(startSheepReaction(clocks, index), false);
    assert.deepEqual(clocks, before);
  }
  assert.ok(clocks[0] > clocks[1] && clocks[1] > clocks[2]);
  for (const invalid of [-1, 3, 6, .5, NaN]) assert.equal(startSheepReaction(clocks, invalid), false);
  for (let frame = 0; frame < 90; frame++) advanceSheepClocks(clocks, .05);
  assert.equal(advanceSheepClocks(clocks, .05), false);
  assert.deepEqual(clocks, [-1, -1, -1]);
  for (let index = 0; index < SHEEP_COUNT; index++) assert.equal(startSheepReaction(clocks, index), true);
});

test("reduced motion keeps every joint still but retains reaction feedback lifetime", () => {
  for (let index = 0; index < SHEEP_COUNT; index++) {
    const pose = sampleSheepPose(index, .75, 7, 1, false);
    assert.equal(pose.active, true);
    assert.ok(Object.values(geometry(pose)).every((value) => value === 0));
    assert.ok(Object.values(sampleSheepIdle(index, 7, false)).every((value) => value === 0));
    assert.equal(sampleSheepReaction(index, SHEEP_REACTION_DURATIONS[index], false).active, false);
  }
});

test("three responses differ through their physical trajectories", () => {
  const signatures = SHEEP_REACTION_DURATIONS.map((duration, index) => JSON.stringify(
    [.16, .43, .71].map((p) => geometry(sampleSheepReaction(index, duration * p))),
  ));
  assert.equal(new Set(signatures).size, SHEEP_COUNT);
});

test("only the grazer chews, with a pause while it lifts its head to listen", () => {
  const grazing = sampleSheepPose(0, -1, 1.7, 1);
  assert.ok(grazing.jawPitch > 0);
  const listening = sampleSheepPose(0, SHEEP_REACTION_DURATIONS[0] * .48, 1.7, 1);
  assert.equal(listening.jawPitch, 0);
  assert.ok(listening.jawYaw === 0);
  for (const index of [1, 2]) {
    for (let frame = 0; frame < 200; frame++) {
      const idle = sampleSheepIdle(index, frame * .1);
      assert.equal(idle.jawPitch, 0);
      assert.equal(idle.jawYaw, 0);
    }
  }
});
