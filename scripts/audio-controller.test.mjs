import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createSoundCloudController,
  formatAudioTime,
} from "../lib/audio/soundcloud-controller.ts";

const events = Object.fromEntries(
  ["READY", "PLAY", "PAUSE", "PLAY_PROGRESS", "SEEK", "FINISH", "ERROR"].map(
    (name) => [name, name],
  ),
);

function fixture() {
  const listeners = new Map();
  const jobs = new Set();
  const calls = [];
  let currentIndex = 0;
  let state;
  const sounds = [
    { id: 1, title: "First" },
    { id: 2, title: "Second" },
  ];
  const widget = {
    bind: (event, listener) => listeners.set(event, listener),
    unbind: (event) => listeners.delete(event),
    play: () => calls.push("play"),
    pause: () => calls.push("pause"),
    skip: (index) => {
      calls.push(["skip", index]);
      currentIndex = index;
    },
    seekTo: (position) => calls.push(["seek", position]),
    setVolume: (volume) => calls.push(["volume", volume]),
    isPaused: (callback) => callback(true),
    getCurrentSoundIndex: (callback) => callback(currentIndex),
    getCurrentSound: (callback) => callback(sounds[currentIndex]),
    getSounds: (callback) => callback(sounds),
    getDuration: (callback) => callback(120000),
  };
  const schedule = (callback) => {
    jobs.add(callback);
    return () => jobs.delete(callback);
  };
  const controller = createSoundCloudController(
    widget,
    events,
    (next) => {
      state = next;
    },
    schedule,
  );
  return {
    controller,
    calls,
    widget,
    listeners,
    jobs,
    get state() {
      return state;
    },
    emit: (event, data) => listeners.get(event)?.(data),
    expire: () => {
      for (const job of [...jobs]) {
        jobs.delete(job);
        job();
      }
    },
  };
}

test("connecting does not autoplay; only PLAY confirms audible state", () => {
  const f = fixture();
  f.emit("READY");
  assert.equal(f.state.status, "ready");
  assert.ok(!f.calls.includes("play"));
  f.controller.play();
  assert.equal(f.state.status, "starting");
  f.emit("PLAY_PROGRESS", { currentPosition: 1000 });
  assert.equal(f.state.status, "starting");
  f.emit("PLAY");
  assert.equal(f.state.status, "playing");
  assert.equal(f.jobs.size, 0);
});

test("rapid double toggle cancels pending play; late playback cannot undo pause", () => {
  const f = fixture();
  f.emit("READY");
  f.controller.toggle();
  f.controller.toggle();
  assert.equal(f.state.status, "pausing");
  f.emit("PAUSE");
  f.emit("PLAY_PROGRESS", { currentPosition: 2000 });
  f.emit("PLAY");
  assert.equal(f.state.status, "paused");
  assert.equal(f.calls.filter((call) => call === "play").length, 1);
  f.controller.play();
  f.emit("PAUSE");
  f.emit("PLAY");
  assert.equal(f.state.status, "playing");
});

test("blocked playback stops waiting without autoplay retries", () => {
  const f = fixture();
  f.emit("READY");
  f.controller.play();
  f.expire();
  assert.equal(f.state.status, "blocked");
  assert.equal(f.calls.filter((call) => call === "play").length, 1);
  f.emit("PAUSE");
  f.emit("PLAY");
  assert.equal(f.state.status, "blocked");
  f.controller.allowNativeControls();
  f.emit("PLAY");
  assert.equal(f.state.status, "playing");
});

test("loading and unresponsive pause requests have bounded failures", () => {
  const f = fixture();
  f.expire();
  assert.equal(f.state.status, "error");
  const p = fixture();
  p.emit("READY");
  p.controller.play();
  p.emit("PLAY");
  p.widget.isPaused = () => {};
  p.controller.pause();
  p.expire();
  p.expire();
  assert.equal(p.state.status, "error");
});

test("dispose removes listeners/timers and ignores stale metadata callbacks", () => {
  const f = fixture();
  let reply;
  f.widget.getCurrentSound = (callback) => {
    reply = callback;
  };
  f.emit("READY");
  f.controller.play();
  f.controller.dispose();
  const snapshot = f.state;
  reply({ title: "Stale response" });
  f.expire();
  f.emit("PLAY");
  assert.equal(f.state, snapshot);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.jobs.size, 0);
});

test("track navigation stays paused when paused and clamps seek/volume values", () => {
  const f = fixture();
  f.emit("READY");
  f.controller.navigate(1);
  f.emit("PLAY");
  assert.equal(f.state.index, 1);
  assert.equal(f.state.title, "Second");
  assert.equal(f.state.status, "paused");
  f.controller.seek(999999);
  assert.equal(f.state.position, 120000);
  f.controller.seek(-100);
  assert.equal(f.state.position, 0);
  f.controller.volume(150);
  assert.equal(f.state.volume, 100);
  f.controller.volume(-1);
  assert.equal(f.state.volume, 0);
});

test("finish does not double-advance the playlist and repeat wraps only its end", () => {
  const f = fixture();
  f.emit("READY");
  f.controller.play();
  f.emit("PLAY");
  f.emit("FINISH");
  assert.ok(!f.calls.some((call) => Array.isArray(call) && call[0] === "skip"));
  f.controller.navigate(1);
  f.controller.play();
  f.emit("PLAY");
  f.emit("FINISH");
  assert.deepEqual(
    f.calls.filter((call) => Array.isArray(call) && call[0] === "skip").at(-1),
    ["skip", 0],
  );
});

test("cleanup remains safe after a route removes the SoundCloud iframe", () => {
  const f = fixture();
  f.emit("READY");
  f.widget.unbind = () => { throw new TypeError("Frame is detached"); };
  f.widget.pause = () => { throw new TypeError("Frame is detached"); };
  assert.doesNotThrow(() => f.controller.dispose());
  assert.doesNotThrow(() => f.controller.dispose());
  assert.equal(f.jobs.size, 0);
});

test("time formatting and music translations are valid", () => {
  assert.equal(formatAudioTime(NaN), "0:00");
  assert.equal(formatAudioTime(-12), "0:00");
  assert.equal(formatAudioTime(132000), "2:12");
  const keys = (value) =>
    Object.entries(value)
      .flatMap(([key, item]) =>
        typeof item === "object"
          ? keys(item).map((part) => key + "." + part)
          : [key],
      )
      .sort();
  const locale = (name) =>
    JSON.parse(
      readFileSync(
        new URL("../messages/" + name + ".json", import.meta.url),
        "utf8",
      ),
    ).music;
  assert.deepEqual(keys(locale("en")), keys(locale("de")));
});
