export type StageSound =
  | "kick" | "snare" | "cymbal" | "guitar"
  | "handpan" | "xylophone" | "bell";

type Voice = {
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  endsAt: number;
};

function browserContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Constructor = window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Constructor ? new Constructor() : null;
}

/** A gesture-driven synth. Creating the controller never creates or starts audio. */
export function createStageAudio({
  createContext = browserContext,
  maxVoices = 8,
}: {
  createContext?: () => AudioContext | null;
  maxVoices?: number;
} = {}) {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let resuming: Promise<void> | null = null;
  let enabled = true;
  let disposed = false;
  let epoch = 0;
  const voices = new Set<Voice>();
  const limit = Math.max(1, Math.min(12, Math.floor(maxVoices) || 8));

  function release(voice: Voice) {
    if (!voices.delete(voice)) return;
    for (const source of voice.sources) {
      source.onended = null;
      try { source.stop(); } catch { /* A completed source is already stopped. */ }
    }
    voice.nodes.forEach((node) => node.disconnect());
  }

  async function play(sound: StageSound, note = 0): Promise<boolean> {
    if (disposed || !enabled) return false;
    const requestEpoch = epoch;
    let scheduledVoice: Voice | undefined;
    try {
      // Both construction and resume happen in the originating click/key gesture.
      if (!context) {
        context = createContext();
        if (!context) return false;
        master = context.createGain();
        master.gain.value = 0.4;
        master.connect(context.destination);
      }
      const active = context;
      if (active.state === "suspended") {
        if (!resuming) {
          resuming = active.resume().finally(() => { resuming = null; });
        }
        await resuming;
      }
      if (disposed || !enabled || epoch !== requestEpoch || active.state !== "running") return false;
      for (const voice of voices) if (voice.endsAt <= active.currentTime) release(voice);
      while (voices.size >= limit) release(voices.values().next().value!);
      const now = active.currentTime + 0.005;
      const voice: Voice = { sources: [], nodes: [], endsAt: now };
      scheduledVoice = voice;
      voices.add(voice);
      let finalSource: AudioScheduledSourceNode | undefined;

      function envelope(source: AudioScheduledSourceNode, output: AudioNode,
        duration: number, level: number, offset = 0) {
        const start = now + offset;
        const gain = active.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(level, start + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        output.connect(gain);
        gain.connect(master!);
        source.start(start);
        source.stop(start + duration + 0.025);
        voice.sources.push(source);
        voice.nodes.push(source, gain);
        if (start + duration + 0.025 >= voice.endsAt) {
          voice.endsAt = start + duration + 0.025;
          finalSource = source;
        }
      }

      function tone(frequency: number, duration: number, level: number,
        type: OscillatorType = "sine", offset = 0, endFrequency?: number) {
        const source = active.createOscillator();
        source.type = type;
        source.frequency.setValueAtTime(frequency, now + offset);
        if (endFrequency) source.frequency.exponentialRampToValueAtTime(endFrequency, now + offset + 0.13);
        envelope(source, source, duration, level, offset);
      }

      function hiss(duration: number, level: number, frequency: number, type: BiquadFilterType) {
        if (!noise) {
          noise = active.createBuffer(1, active.sampleRate, active.sampleRate);
          const samples = noise.getChannelData(0);
          for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        }
        const source = active.createBufferSource();
        source.buffer = noise;
        const filter = active.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        filter.Q.value = 0.65;
        source.connect(filter);
        voice.nodes.push(filter);
        envelope(source, filter, duration, level);
      }

      const step = Math.abs(Math.floor(Number.isFinite(note) ? note : 0)) % 7;
      const pentatonic = [0, 3, 5, 7, 10, 12, 15][step];
      if (sound === "kick") {
        tone(132, 0.4, 0.2, "sine", 0, 43);
      } else if (sound === "snare") {
        tone(155 * 2 ** (pentatonic / 24), 0.16, 0.065, "triangle");
        hiss(0.19, 0.12, 1500, "highpass");
      } else if (sound === "cymbal") {
        hiss(0.62, 0.085, 6700, "highpass");
        [211, 317, 421, 587, 743].forEach((frequency) => tone(frequency * 8, 0.27, 0.007, "square"));
      } else if (sound === "guitar") {
        [110, 164.81, 220, 261.63, 329.63, 440].forEach((frequency, index) =>
          tone(frequency, 0.82 - index * 0.035, 0.032, "triangle", index * 0.018));
      } else {
        const base = (sound === "handpan" ? 220 : sound === "xylophone" ? 523.25 : 440) * 2 ** (pentatonic / 12);
        if (sound === "handpan") {
          tone(base, 1.2, 0.1);
          tone(base * 2, 0.65, 0.038);
          tone(base * 3, 0.36, 0.018);
        } else if (sound === "xylophone") {
          tone(base, 0.46, 0.12);
          tone(base * 3, 0.11, 0.032);
        } else {
          [1, 2.76, 5.4, 8.93].forEach((ratio, index) =>
            tone(base * ratio, 1.45 / (1 + index * 0.45), 0.075 / (index + 1)));
        }
      }
      if (finalSource) finalSource.onended = () => release(voice);
      return true;
    } catch {
      if (scheduledVoice) release(scheduledVoice);
      // Unsupported/blocked audio leaves the click's visual feedback available.
      return false;
    }
  }

  return {
    play,
    setEnabled(value: boolean) {
      enabled = value;
      if (!value) {
        epoch++;
        for (const voice of voices) release(voice);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      epoch++;
      for (const voice of voices) release(voice);
      master?.disconnect();
      if (context && context.state !== "closed") void context.close().catch(() => {});
      context = null;
      master = null;
      noise = null;
    },
  };
}
