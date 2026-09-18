import test from "node:test";
import assert from "node:assert/strict";
import {
  SheepAudio, planSheepNote, SHEEP_MELODY, SHEEP_REGISTERS,
  SHEEP_NOTE_SPACING, SHEEP_MAX_LOOKAHEAD,
} from "../components/scenes/planets/sheep-audio.ts";

function fixture({ suspended = false } = {}) {
  const nodes = [], sources = [], waves = [];
  let constructions = 0, closeCalls = 0, resumeCalls = 0, resolveResume, rejectResume, failSynthesis = false;
  const parameter = () => ({
    value: 0, events: [],
    setValueAtTime(value, time) { this.events.push(["set", value, time]); },
    exponentialRampToValueAtTime(value, time) { this.events.push(["exponential", value, time]); },
    linearRampToValueAtTime(value, time) { this.events.push(["linear", value, time]); },
  });
  const node = (kind) => {
    const result = {
      kind, gain: parameter(), frequency: parameter(), Q: parameter(), detune: parameter(),
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
      setPeriodicWave(wave) { this.wave = wave; },
    });
    sources.push(result);
    return result;
  };
  const context = {
    state: suspended ? "suspended" : "running", currentTime: 10, sampleRate: 48000,
    destination: node("destination"),
    createGain: () => node("gain"),
    createOscillator: () => source("oscillator"),
    createBufferSource: () => source("noise"),
    createBiquadFilter: () => node("filter"),
    createPeriodicWave: (real, imaginary) => { const wave = { real, imaginary }; waves.push(wave); return wave; },
    createBuffer: (_, length) => {
      if (failSynthesis) throw new Error("Audio buffer unavailable");
      const data = new Float32Array(length);
      return { getChannelData: () => data };
    },
    resume: () => {
      resumeCalls++;
      return new Promise((resolve, reject) => {
        resolveResume = () => { context.state = "running"; resolve(); };
        rejectResume = () => reject(new Error("User gesture denied"));
      });
    },
    close: async () => { closeCalls++; context.state = "closed"; },
  };
  const audio = new SheepAudio({ createContext: () => { constructions++; return context; } });
  return {
    audio, nodes, sources, waves, context,
    resume: () => resolveResume(), rejectResume: () => rejectResume(),
    failSynthesis: (value) => { failSynthesis = value; },
    get constructions() { return constructions; },
    get closeCalls() { return closeCalls; },
    get resumeCalls() { return resumeCalls; },
  };
}

test("each sheep alone and any mixed order carry exactly the same melody within fixed registers", () => {
  const orders = [[0], [1], [2], [2, 0, 2, 1, 1, 0, 1, 2, 0]];
  for (const order of orders) {
    for (let step = 0; step < SHEEP_MELODY.length * 4; step++) {
      const index = order[step % order.length];
      const note = planSheepNote(index, step);
      assert.equal(note.midi - SHEEP_REGISTERS[index], SHEEP_MELODY[step % SHEEP_MELODY.length]);
      assert.ok(note.midi >= SHEEP_REGISTERS[index] && note.midi <= SHEEP_REGISTERS[index] + 9);
      assert.ok([7, 9, 11, 2, 4].includes(note.midi % 12));
      assert.ok(note.frequency >= 97 && note.frequency <= 660);
    }
  }
  assert.equal(SHEEP_MELODY[0], 0);
  assert.equal(SHEEP_MELODY.at(-1), 0);
  for (const index of [-1, 3, .5, NaN, Infinity]) assert.equal(planSheepNote(index, 0), null);
  assert.ok(Number.isFinite(planSheepNote(0, Infinity).frequency));
});

test("construction/mute stay silent; first trusted play immediately constructs and resumes", async () => {
  const f = fixture({ suspended: true });
  assert.equal(f.constructions, 0);
  f.audio.setEnabled(false);
  assert.equal(await f.audio.play(0), false);
  assert.equal(f.constructions, 0);
  f.audio.setEnabled(true);
  const notes = [];
  const pending = f.audio.play(0, (note) => notes.push(note));
  assert.equal(f.constructions, 1);
  assert.equal(f.resumeCalls, 1);
  assert.equal(f.sources.length, 0);
  f.resume();
  assert.equal(await pending, true);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].step, 0);
  assert.ok(f.sources[0].starts[0] - f.context.currentTime < .01);
  f.audio.dispose();
});

test("the running controller passes the whole phrase between sheep and loops without resetting", async () => {
  const f = fixture(), notes = [], order = [2, 0, 1, 2, 1, 1, 0];
  for (let step = 0; step < SHEEP_MELODY.length * 2 + 1; step++) {
    const index = order[step % order.length];
    assert.equal(await f.audio.play(index, (note) => notes.push(note)), true);
    assert.equal(notes.at(-1).step, step % SHEEP_MELODY.length);
    assert.equal(notes.at(-1).midi, SHEEP_REGISTERS[index] + SHEEP_MELODY[step % SHEEP_MELODY.length]);
    f.context.currentTime += .9;
  }
  assert.equal(f.constructions, 1);
  f.audio.dispose();
});

test("all three baa voices differ in throat resonance, breath, register and vibrato", async () => {
  const f = fixture();
  const profiles = [];
  for (let index = 0; index < 3; index++) {
    const oldNodes = f.nodes.length, oldSources = f.sources.length;
    assert.equal(await f.audio.play(index), true);
    const addedNodes = f.nodes.slice(oldNodes), addedSources = f.sources.slice(oldSources);
    profiles.push({
      formants: addedNodes.filter((node) => node.kind === "filter" && node.frequency.events.length).map((node) => node.frequency.events[1][1]),
      vibrato: addedSources[1].frequency.value,
      duration: addedSources[0].stops[0] - addedSources[0].starts[0],
      noise: addedSources[2].buffer.getChannelData(0)[0],
    });
    assert.equal(addedSources.length, 3);
    assert.equal(addedSources[0].wave.imaginary.length, 40);
    assert.ok(addedNodes.some((node) => node.kind === "filter" && node.type === "lowpass"));
    for (const oscillator of addedSources.filter((source) => source.kind === "oscillator")) {
      assert.ok(oscillator.connections.every((node) => node.kind === "filter" || node.kind === "gain"));
    }
    for (const source of addedSources) {
      assert.equal(source.starts.length, 1);
      const duration = source.stops[0] - source.starts[0];
      assert.ok(duration > .5 && duration < .7);
    }
    for (const node of addedNodes) {
      for (const parameter of [node.gain, node.frequency]) {
        assert.ok(parameter.events.every(([, value, time]) => Number.isFinite(value) && Number.isFinite(time)));
        assert.ok(parameter.events.filter(([kind]) => kind === "exponential").every(([, value]) => value > 0));
      }
    }
    f.context.currentTime += 1;
  }
  assert.equal(new Set(profiles.map((profile) => JSON.stringify(profile))).size, 3);
  assert.ok(profiles[0].formants[0] < profiles[1].formants[0] && profiles[1].formants[0] < profiles[2].formants[0]);
  f.audio.dispose();
});

test("fast clicks have a short rhythmic queue, reject excess and never skip melody notes", async () => {
  const f = fixture();
  const results = [];
  for (let i = 0; i < 30; i++) results.push(await f.audio.play(i % 3));
  assert.deepEqual(results.slice(0, 3), [true, true, true]);
  assert.ok(results.slice(3).every((value) => !value));
  const starts = f.sources.filter((source) => source.wave).map((source) => source.starts[0]);
  assert.equal(starts.length, 3);
  for (let i = 1; i < starts.length; i++) assert.ok(Math.abs(starts[i] - starts[i - 1] - SHEEP_NOTE_SPACING) < 1e-10);
  assert.ok(starts.at(-1) - f.context.currentTime <= SHEEP_MAX_LOOKAHEAD);
  f.context.currentTime += 1.5;
  const notes = [];
  assert.equal(await f.audio.play(2, (note) => notes.push(note)), true);
  assert.equal(notes[0].step, 3);
  assert.equal(f.sources.filter((source) => !source.disconnects).length, 3);
  f.audio.dispose();
  assert.ok(f.sources.every((source) => source.disconnects === 1));
});

test("mute cancels scheduled notes and callbacks; re-enabling never autoplays", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(), notes = [];
  await f.audio.play(0, (note) => notes.push(note));
  await f.audio.play(1, (note) => notes.push(note));
  assert.equal(notes.length, 1);
  t.mock.timers.tick(100);
  assert.equal(notes.length, 1);
  f.audio.setEnabled(false);
  f.audio.setEnabled(true);
  t.mock.timers.tick(1000);
  assert.equal(notes.length, 1);
  assert.ok(f.sources.every((source) => source.disconnects === 1));
  assert.equal(f.sources.length, 6);
  f.context.currentTime += 2;
  await f.audio.play(2, (note) => notes.push(note));
  assert.equal(notes.at(-1).step, 2);
  f.audio.dispose();
});

test("a queued vocal callback runs at its audible start, independently of the first sheep", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(), notes = [];
  await f.audio.play(0, (note) => notes.push(note));
  await f.audio.play(2, (note) => notes.push(note));
  t.mock.timers.tick(220);
  assert.equal(notes.length, 1);
  t.mock.timers.tick(10);
  assert.deepEqual(notes.map((note) => [note.sheepIndex, note.step]), [[0, 0], [2, 1]]);
  f.audio.dispose();
});

test("pending resume is bounded and stop prevents stale gestures or melody advancement", async () => {
  const f = fixture({ suspended: true });
  const pending = [f.audio.play(0), f.audio.play(1), f.audio.play(2)];
  assert.equal(await f.audio.play(0), false);
  assert.equal(f.resumeCalls, 1);
  f.audio.stop();
  f.resume();
  assert.deepEqual(await Promise.all(pending), [false, false, false]);
  assert.equal(f.sources.length, 0);
  const notes = [];
  assert.equal(await f.audio.play(2, (note) => notes.push(note)), true);
  assert.equal(notes[0].step, 0);
  f.audio.dispose();
});

test("a rejected resume can retry without consuming a note", async () => {
  const f = fixture({ suspended: true });
  const denied = f.audio.play(1);
  f.rejectResume();
  assert.equal(await denied, false);
  const notes = [], accepted = f.audio.play(1, (note) => notes.push(note));
  f.resume();
  assert.equal(await accepted, true);
  assert.equal(notes[0].step, 0);
  f.audio.dispose();
});

test("unmount during resume is terminal and closes the context only once", async () => {
  const f = fixture({ suspended: true });
  const pending = f.audio.play(2);
  f.audio.dispose();
  f.resume();
  assert.equal(await pending, false);
  assert.equal(f.sources.length, 0);
  assert.equal(await f.audio.play(2), false);
  f.audio.dispose();
  assert.equal(f.closeCalls, 1);
});

test("failed synthesis cleans partial nodes, completed voices self-release, unavailable audio is safe", async () => {
  const f = fixture();
  f.failSynthesis(true);
  assert.equal(await f.audio.play(0), false);
  assert.ok(f.sources.every((source) => source.disconnects === 1 && source.starts.length === 0));
  f.failSynthesis(false);
  const notes = [];
  assert.equal(await f.audio.play(0, (note) => notes.push(note)), true);
  assert.equal(notes[0].step, 0);
  const glottis = f.sources.find((source) => !source.disconnects && source.wave);
  glottis.onended();
  assert.ok(f.sources.every((source) => source.disconnects === 1));
  f.audio.dispose();
  const unavailable = new SheepAudio({ createContext: () => null });
  assert.equal(await unavailable.play(0), false);
  unavailable.dispose();
  const failed = new SheepAudio({ createContext: () => { throw new Error("Unavailable"); } });
  assert.equal(await failed.play(0), false);
  failed.dispose();
});
