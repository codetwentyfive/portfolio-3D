import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  wrapWorld,
  startWorldSwipe,
  moveWorldSwipe,
  finishWorldSwipe,
} from "../components/scenes/planets/world-navigation.ts";

test("world selection loops in both directions, including repeated cycles", () => {
  assert.equal(wrapWorld(-1, 6), 5);
  assert.equal(wrapWorld(6, 6), 0);
  assert.equal(wrapWorld(-13, 6), 5);
  assert.equal(wrapWorld(25, 6), 1);
  assert.equal(wrapWorld(1, 0), 0);
});
test("left swipe advances and right swipe goes back", () => {
  assert.equal(finishWorldSwipe(startWorldSwipe(1, 160, 50), 1, 70, 54), 1);
  assert.equal(finishWorldSwipe(startWorldSwipe(1, 160, 50), 1, 250, 54), -1);
});
test("taps, short movements, diagonal swipes and other pointers do not navigate", () => {
  const swipe = startWorldSwipe(1, 160, 50);
  assert.equal(finishWorldSwipe(swipe, 1, 160, 50), 0);
  assert.equal(finishWorldSwipe(swipe, 1, 125, 50), 0);
  assert.equal(finishWorldSwipe(swipe, 1, 100, 100), 0);
  assert.equal(finishWorldSwipe(swipe, 2, 70, 50), 0);
});
test("a vertical scroll cannot become a world switch later in the gesture", () => {
  const swipe = startWorldSwipe(1, 160, 50);
  moveWorldSwipe(swipe, 1, 162, 90);
  moveWorldSwipe(swipe, 1, 40, 91);
  assert.equal(finishWorldSwipe(swipe, 1, 40, 91), 0);
});
test("a different pointer cannot cancel the primary horizontal gesture", () => {
  const swipe = startWorldSwipe(1, 160, 50);
  moveWorldSwipe(swipe, 2, 160, 200);
  moveWorldSwipe(swipe, 1, 40, 51);
  assert.equal(finishWorldSwipe(swipe, 1, 40, 51), 1);
});
test("both locales explain all six worlds and expose mobile navigation hints", () => {
  const read = (locale) =>
    JSON.parse(
      fs.readFileSync(
        new URL(`../messages/${locale}.json`, import.meta.url),
        "utf8",
      ),
    ).archive;
  for (const locale of ["en", "de"]) {
    const archive = read(locale);
    assert.deepEqual(
      Object.keys(archive.mobile.descriptions).sort(),
      Object.keys(archive.names).sort(),
    );
    for (const text of Object.values(archive.mobile.descriptions))
      assert.ok(text.length > 20);
    for (const key of [
      "eyebrow",
      "context",
      "rotate",
      "view",
      "swipe",
      "swipeLabel",
      "previous",
      "next",
      "loading",
      "loadFailed",
    ])
      assert.ok(archive.mobile[key].length > 0);
  }
});
