import test from "node:test";
import assert from "node:assert/strict";
import {
  initialWorldTransition,
  worldTransition as step,
} from "../components/scenes/planets/world-transition.ts";

const request = (state, index = 1, direction = "next") =>
  step(state, { type: "request", index, direction });
const ready = (state, reduced = false, index = state.target) =>
  step(state, { type: "prepared", index, reduced });
const advance = (state) => step(state, { type: "advance", phase: state.phase });

test("the current scene stays mounted until the target loads and exits", () => {
  const loading = request(initialWorldTransition());
  assert.equal(loading.current, 0);
  assert.equal(loading.target, 1);
  assert.equal(loading.phase, "loading");
  const exiting = ready(loading);
  assert.equal(exiting.current, 0);
  assert.equal(exiting.phase, "exiting");
  const entering = advance(exiting);
  assert.equal(entering.current, 1);
  assert.equal(entering.phase, "entering");
  assert.equal(advance(entering).phase, "idle");
});

test("rapid navigation cannot replace a pending transition", () => {
  let state = request(initialWorldTransition());
  for (let i = 0; i < 3; i++) {
    assert.equal(request(state, 4), state);
    state = i === 0 ? ready(state) : advance(state);
  }
  assert.equal(request(state, 4).target, 4);
});

test("selecting the same scene is a no-op", () => {
  const state = initialWorldTransition(2);
  assert.equal(request(state, 2), state);
});

test("wraparound preserves the requested visual direction", () => {
  const previous = request(initialWorldTransition(), 5, "previous");
  assert.equal(advance(ready(previous)).direction, "previous");
  const next = request(initialWorldTransition(5), 0, "next");
  assert.equal(advance(ready(next)).direction, "next");
});

test("unrelated or stale loading callbacks cannot commit a scene", () => {
  const loading = request(initialWorldTransition());
  assert.equal(ready(loading, false, 4), loading);
  const restored = step(loading, { type: "restore", index: 3 });
  assert.equal(ready(restored, false, 1), restored);
  assert.equal(step(restored, { type: "advance", phase: "exiting" }), restored);
});

test("reduced motion still waits for assets but bypasses both animations", () => {
  const loading = request(initialWorldTransition());
  assert.equal(step(loading, { type: "reduce" }), loading);
  const done = ready(loading, true);
  assert.equal(done.current, 1);
  assert.equal(done.phase, "idle");
});

test("enabling reduced motion during either animation settles immediately", () => {
  const exiting = ready(request(initialWorldTransition()));
  for (const state of [exiting, advance(exiting)]) {
    const done = step(state, { type: "reduce" });
    assert.equal(done.current, 1);
    assert.equal(done.phase, "idle");
  }
});

test("a loading timeout keeps the current world and allows a clean retry", () => {
  const loading = request(initialWorldTransition());
  const failed = step(loading, { type: "timeout" });
  assert.equal(failed.current, 0);
  assert.equal(failed.target, 0);
  assert.equal(failed.phase, "idle");
  assert.equal(failed.failed, true);
  assert.equal(ready(failed, false, 1), failed);
  const retry = request(failed);
  assert.equal(retry.failed, false);
  assert.equal(retry.phase, "loading");
  const exiting = ready(retry);
  assert.equal(step(exiting, { type: "timeout" }), exiting);
});
