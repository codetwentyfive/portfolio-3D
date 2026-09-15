import test from "node:test";
import assert from "node:assert/strict";
import { createStageAudio } from "../components/scenes/planets/stage-audio.ts";

function fixture({ suspended = false, maxVoices = 8 } = {}) {
  const nodes = [], sources = [];
  let constructions = 0, closeCalls = 0, resolveResume;
  const parameter = () => ({
    value: 0, events: [],
    setValueAtTime(value, time) { this.events.push(["set", value, time]); },
    exponentialRampToValueAtTime(value, time) { this.events.push(["ramp", value, time]); },
  });
  const node = (kind) => {
    const result = {
      kind, gain: parameter(), frequency: parameter(), Q: parameter(),
      connections: [], disconnects: 0,
      connect(destination) { this.connections.push(destination); },
      disconnect() { this.disconnects++; },
    };
    nodes.push(result);
    return result;
  };
  const source = (kind) => {
    const result = Object.assign(node(kind), {
      starts: [], stops: [], onended: null,
      start(time) { this.starts.push(time); },
      stop(time) { this.stops.push(time); },
    });
    sources.push(result);
    return result;
  };
  const context = {
    state: suspended ? "suspended" : "running",
    currentTime: 10, sampleRate: 48000,
    destination: node("destination"),
    createGain: () => node("gain"),
    createOscillator: () => source("oscillator"),
    createBufferSource: () => source("noise"),
    createBiquadFilter: () => node("filter"),
    createBuffer: (_, length) => ({ getChannelData: () => new Float32Array(length) }),
    resume: () => new Promise((resolve) => { resolveResume = () => { context.state = "running"; resolve(); }; }),
    close: async () => { closeCalls++; context.state = "closed"; },
  };
  const audio = createStageAudio({ createContext: () => { constructions++; return context; }, maxVoices });
  return {
    audio, nodes, sources, context,
    resume: () => resolveResume(),
    get constructions() { return constructions; },
    get closeCalls() { return closeCalls; },
  };
}

test("stage audio stays silent until play and creates one context", async () => {
  const f = fixture();
  assert.equal(f.constructions, 0);
  f.audio.setEnabled(false);
  assert.equal(await f.audio.play("kick"), false);
  assert.equal(f.constructions, 0);
  f.audio.setEnabled(true);
  assert.equal(await f.audio.play("kick"), true);
  assert.equal(await f.audio.play("snare"), true);
  assert.equal(f.constructions, 1);
  assert.equal(f.sources.length, 3);
  f.audio.dispose();
});

test("all instrument voices have bounded durations, positive envelopes and distinct synthesis", async () => {
  const f = fixture();
  for (const sound of ["kick", "snare", "cymbal", "guitar", "handpan", "xylophone", "bell"]) {
    assert.equal(await f.audio.play(sound), true, sound);
    f.context.currentTime += 2;
  }
  for (const source of f.sources) {
    assert.equal(source.starts.length, 1);
    const duration = source.stops[0] - source.starts[0];
    assert.ok(duration > 0 && duration < 1.6, `${source.kind} duration ${duration}`);
  }
  for (const gain of f.nodes.filter((item) => item.kind === "gain" && item.gain.events.length)) {
    assert.ok(gain.gain.events.every(([, value]) => value > 0 && value <= .2));
    assert.equal(gain.gain.events.at(-1)[1], .0001);
  }
  assert.ok(f.nodes.some((item) => item.kind === "filter" && item.type === "highpass"));
  assert.ok(f.sources.some((item) => item.type === "triangle"));
  assert.ok(f.sources.some((item) => item.type === "square"));
  f.audio.dispose();
});

test("different spawned-instrument notes change pitch within a finite range", async () => {
  const f = fixture();
  await f.audio.play("xylophone", 0);
  const first = f.sources.at(-2).frequency.events[0][1];
  await f.audio.play("xylophone", 4);
  const second = f.sources.at(-2).frequency.events[0][1];
  assert.ok(second > first);
  await f.audio.play("bell", Infinity);
  assert.ok(f.sources.every((source) => source.frequency.events.every(([, frequency]) => Number.isFinite(frequency))));
  f.audio.dispose();
});

test("rapid hits evict the oldest voice and disconnect its nodes", async () => {
  const f = fixture({ maxVoices: 2 });
  await f.audio.play("guitar");
  const oldest = [...f.sources];
  await f.audio.play("kick");
  await f.audio.play("bell");
  assert.ok(oldest.every((source) => source.disconnects === 1 && source.stops.length === 2));
  assert.equal(f.sources.filter((source) => !source.disconnects).length, 5);
  f.audio.dispose();
  assert.ok(f.sources.every((source) => source.disconnects === 1));
});

test("mute cancels pending resume so a delayed permission response cannot play stale hits", async () => {
  const f = fixture({ suspended: true });
  const pending = f.audio.play("kick");
  f.audio.setEnabled(false);
  f.audio.setEnabled(true);
  f.resume();
  assert.equal(await pending, false);
  assert.equal(f.sources.length, 0);
  f.audio.dispose();
});

test("unmount during resume closes context and prevents late playback", async () => {
  const f = fixture({ suspended: true });
  const pending = f.audio.play("bell");
  f.audio.dispose();
  f.resume();
  assert.equal(await pending, false);
  assert.equal(f.sources.length, 0);
  assert.equal(f.closeCalls, 1);
  assert.equal(await f.audio.play("kick"), false);
  f.audio.dispose();
  assert.equal(f.closeCalls, 1);
});

test("finished voices clean themselves up, and unavailable audio remains safe", async () => {
  const f = fixture();
  await f.audio.play("kick");
  f.sources[0].onended();
  assert.equal(f.sources[0].disconnects, 1);
  f.audio.dispose();
  const unavailable = createStageAudio({ createContext: () => null });
  assert.equal(await unavailable.play("kick"), false);
  unavailable.dispose();
});
