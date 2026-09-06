import test from "node:test";
import assert from "node:assert/strict";
import {
  advance,
  createTurntable,
  drag,
  hold,
  release,
  SPIN_SPEED,
} from "../components/scenes/planets/turntable-motion.ts";

test("idle rotation is frame-rate independent", () => {
  const a = createTurntable(),
    b = createTurntable();
  for (let i = 0; i < 60; i++) advance(a, 1 / 60, true);
  for (let i = 0; i < 120; i++) advance(b, 1 / 120, true);
  assert.ok(Math.abs(a.yaw - b.yaw) < 1e-10);
  assert.ok(Math.abs(a.yaw - SPIN_SPEED) < 1e-10);
});
test("holding freezes automatic rotation; dragging still responds", () => {
  const s = createTurntable();
  hold(s, 1, 100, 100, 0);
  advance(s, 0.05, true);
  assert.equal(s.yaw, 0);
  drag(s, 1, 160, 120, 100, 400);
  assert.ok(s.yaw > 0);
  const yaw = s.yaw;
  advance(s, 0.05, true);
  assert.equal(s.yaw, yaw);
});
test("a second pointer cannot steal or release the gesture", () => {
  const s = createTurntable();
  hold(s, 1, 0, 0, 0);
  assert.equal(hold(s, 2, 0, 0, 0), false);
  assert.equal(drag(s, 2, 80, 0, 20, 400), false);
  assert.equal(release(s, 2, 30), false);
  assert.equal(s.pointer, 1);
});
test("release and cancellation resume spin; pause does not", () => {
  const s = createTurntable();
  hold(s, 3, 0, 0, 0);
  release(s, 3, 500, true);
  advance(s, 0.02, false);
  assert.equal(s.yaw, 0);
  advance(s, 0.02, true);
  assert.ok(s.yaw > 0);
});
test("release inertia decays consistently and long frame gaps are bounded", () => {
  const a = createTurntable(),
    b = createTurntable();
  a.velocity = b.velocity = -1;
  for (let i = 0; i < 30; i++) advance(a, 1 / 30, true);
  for (let i = 0; i < 120; i++) advance(b, 1 / 120, true);
  assert.ok(Math.abs(a.yaw - b.yaw) < 1e-10);
  const c = createTurntable();
  advance(c, 20, true);
  assert.ok(c.yaw < 0.01);
});
test("touch pitch is bounded and a stationary hold drops old momentum", () => {
  const s = createTurntable();
  hold(s, 1, 0, 0, 0);
  drag(s, 1, 90, 9999, 50, 320);
  assert.equal(s.pitch, 0.3);
  drag(s, 1, 90, -9999, 90, 320);
  assert.equal(s.pitch, -0.25);
  release(s, 1, 1000);
  assert.equal(s.velocity, SPIN_SPEED);
});
