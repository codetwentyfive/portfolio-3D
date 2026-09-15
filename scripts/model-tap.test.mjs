import test from "node:test";
import assert from "node:assert/strict";
import {
  beginModelGesture,
  moveModelGesture,
  endModelGesture,
  isModelTap,
  clearModelGesture,
} from "../components/scenes/planets/model-tap.ts";

test("a completed tap accepts up to six pixels of movement", () => {
  const canvas = {};
  assert.equal(isModelTap(canvas), false);
  beginModelGesture(canvas, 1, 100, 100);
  assert.equal(isModelTap(canvas), false);
  moveModelGesture(canvas, 1, 106, 100);
  endModelGesture(canvas, 1, false);
  assert.equal(isModelTap(canvas), true);
});

test("a drag remains rejected after returning to the starting point", () => {
  const canvas = {};
  beginModelGesture(canvas, 1, 100, 100);
  moveModelGesture(canvas, 1, 180, 100);
  moveModelGesture(canvas, 1, 100, 100);
  endModelGesture(canvas, 1, false);
  assert.equal(isModelTap(canvas), false);
});

test("diagonal movement uses Euclidean distance", () => {
  const canvas = {};
  beginModelGesture(canvas, 1, 0, 0);
  moveModelGesture(canvas, 1, 5, 5);
  endModelGesture(canvas, 1, false);
  assert.equal(isModelTap(canvas), false);
});

test("cancellation suppresses a click until a new gesture starts", () => {
  const canvas = {};
  beginModelGesture(canvas, 1, 50, 50);
  endModelGesture(canvas, 1, true);
  endModelGesture(canvas, 1, false);
  assert.equal(isModelTap(canvas), false);
  beginModelGesture(canvas, 2, 70, 70);
  endModelGesture(canvas, 2, false);
  assert.equal(isModelTap(canvas), true);
});

test("a second pointer cannot replace, move, or cancel the accepted gesture", () => {
  const canvas = {};
  beginModelGesture(canvas, 1, 10, 10);
  beginModelGesture(canvas, 2, 200, 200);
  moveModelGesture(canvas, 2, 300, 300);
  endModelGesture(canvas, 2, true);
  moveModelGesture(canvas, 1, 13, 14);
  endModelGesture(canvas, 1, false);
  assert.equal(isModelTap(canvas), true);
});

test("a new gesture clears the distance accumulated by a previous drag", () => {
  const canvas = {};
  beginModelGesture(canvas, 1, 0, 0);
  moveModelGesture(canvas, 1, 100, 0);
  endModelGesture(canvas, 1, false);
  beginModelGesture(canvas, 1, 200, 0);
  moveModelGesture(canvas, 1, 202, 1);
  endModelGesture(canvas, 1, false);
  assert.equal(isModelTap(canvas), true);
});

test("canvas state is isolated and cleanup rejects stale clicks", () => {
  const first = {}, second = {};
  beginModelGesture(first, 1, 0, 0);
  endModelGesture(first, 1, false);
  assert.equal(isModelTap(first), true);
  assert.equal(isModelTap(second), false);
  clearModelGesture(first);
  assert.equal(isModelTap(first), false);
});
