/** An original call-and-response phrase. Sheep pass the same tune between registers. */
export const SHEEP_MELODY = [0, 4, 7, 4, 2, 0, 2, 4, 7, 9, 7, 4, 2, 4, 2, 0] as const;
export const SHEEP_REGISTERS = [43, 55, 67] as const; // G2, G3, G4; each stays below the next G.
export const SHEEP_NOTE_SPACING = .22;
export const SHEEP_MAX_LOOKAHEAD = .45;

export type SheepNote = {
  sheepIndex: number;
  step: number;
  midi: number;
  frequency: number;
  duration: number;
};

const VOICES = [
  { duration: .65, formants: [470, 960, 1920], breath: .032, vibrato: 5.4, depth: 16, pulse: .12, warmth: .22, level: 1 },
  { duration: .59, formants: [610, 1320, 2580], breath: .044, vibrato: 6.3, depth: 21, pulse: .16, warmth: .18, level: .9 },
  { duration: .53, formants: [830, 1770, 3200], breath: .058, vibrato: 7.2, depth: 25, pulse: .13, warmth: .15, level: .72 },
] as const;

export function planSheepNote(sheepIndex: number, step: number): SheepNote | null {
  if (!Number.isInteger(sheepIndex) || sheepIndex < 0 || sheepIndex >= SHEEP_REGISTERS.length) return null;
  const cursor = Number.isFinite(step) ? ((Math.floor(step) % SHEEP_MELODY.length) + SHEEP_MELODY.length) % SHEEP_MELODY.length : 0;
  const midi = SHEEP_REGISTERS[sheepIndex] + SHEEP_MELODY[cursor];
  return { sheepIndex, step: cursor, midi, frequency: 440 * 2 ** ((midi - 69) / 12), duration: VOICES[sheepIndex].duration };
}

type SynthVoice = {
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  endsAt: number;
  onEnded: AudioScheduledSourceNode;
};

/** Formant-shaped glottal sound, breath and a soft bleat; shared by live and offline rendering. */
export function synthesizeSheepNote(
  context: BaseAudioContext, output: AudioNode, note: SheepNote, startTime: number,
): SynthVoice {
  const profile = VOICES[note.sheepIndex];
  const end = startTime + note.duration;
  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [];
  const own = <T extends AudioNode>(node: T): T => { nodes.push(node); return node; };
  const source = <T extends AudioScheduledSourceNode>(node: T): T => { sources.push(node); return own(node); };

  try {
    const envelope = own(context.createGain());
    envelope.gain.setValueAtTime(.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(.53 * profile.level, startTime + .033);
    envelope.gain.exponentialRampToValueAtTime(.46 * profile.level, startTime + .10);
    envelope.gain.exponentialRampToValueAtTime(.31 * profile.level, end - .16);
    envelope.gain.exponentialRampToValueAtTime(.0001, end);

    // A rounded glottal pulse supplies the harmonics. No raw saw/square reaches the output.
    const glottis = source(context.createOscillator());
    const real = new Float32Array(40), imaginary = new Float32Array(40);
    for (let harmonic = 1; harmonic < imaginary.length; harmonic++) {
      imaginary[harmonic] = (harmonic % 2 ? 1 : .72) / harmonic ** 1.15;
    }
    glottis.setPeriodicWave(context.createPeriodicWave(real, imaginary));
    glottis.frequency.setValueAtTime(note.frequency * .981, startTime);
    glottis.frequency.exponentialRampToValueAtTime(note.frequency, startTime + .065);
    glottis.frequency.setValueAtTime(note.frequency, end - .13);
    glottis.frequency.exponentialRampToValueAtTime(note.frequency * .99, end);

    // Each sheep has a different throat size, with a short closed-to-open "b-aa" vowel.
    profile.formants.forEach((frequency, index) => {
      const formant = own(context.createBiquadFilter());
      formant.type = "bandpass";
      formant.frequency.setValueAtTime(frequency * (index ? .87 : .62), startTime);
      formant.frequency.exponentialRampToValueAtTime(frequency, startTime + .10);
      formant.frequency.exponentialRampToValueAtTime(frequency * .92, end);
      formant.Q.value = [3.5, 5, 6][index];
      const weight = own(context.createGain());
      weight.gain.value = [1.25, .86, .43][index];
      glottis.connect(formant);
      formant.connect(weight);
      weight.connect(envelope);
    });

    // Keep the fundamental audible on small speakers, underneath the vocal formants.
    const body = own(context.createBiquadFilter());
    body.type = "lowpass";
    body.frequency.value = note.frequency * 2.2;
    body.Q.value = .55;
    const bodyLevel = own(context.createGain());
    bodyLevel.gain.value = profile.warmth;
    glottis.connect(body);
    body.connect(bodyLevel);
    bodyLevel.connect(envelope);

    const vibrato = source(context.createOscillator());
    vibrato.frequency.value = profile.vibrato;
    const pitchDepth = own(context.createGain());
    pitchDepth.gain.setValueAtTime(0, startTime);
    pitchDepth.gain.linearRampToValueAtTime(profile.depth, startTime + .15);
    vibrato.connect(pitchDepth);
    pitchDepth.connect(glottis.detune);
    const bleatDepth = own(context.createGain());
    bleatDepth.gain.value = profile.pulse;
    vibrato.connect(bleatDepth);
    // This gain trembles around 1 without ever closing; the note remains legible.
    const bleat = own(context.createGain());
    bleat.gain.value = 1;
    bleatDepth.connect(bleat.gain);
    envelope.connect(bleat);
    bleat.connect(output);

    const breath = source(context.createBufferSource());
    const buffer = context.createBuffer(1, Math.ceil((note.duration + .02) * context.sampleRate), context.sampleRate);
    const samples = buffer.getChannelData(0);
    let seed = 211 + note.sheepIndex * 977;
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      samples[i] = seed / 2147483648;
    }
    breath.buffer = buffer;
    const breathFilter = own(context.createBiquadFilter());
    breathFilter.type = "bandpass";
    breathFilter.frequency.value = profile.formants[1];
    breathFilter.Q.value = .7;
    const breathLevel = own(context.createGain());
    breathLevel.gain.setValueAtTime(profile.breath, startTime);
    breathLevel.gain.exponentialRampToValueAtTime(profile.breath * .24, startTime + .10);
    breathLevel.gain.exponentialRampToValueAtTime(.0001, end);
    breath.connect(breathFilter);
    breathFilter.connect(breathLevel);
    breathLevel.connect(envelope);

    for (const active of sources) {
      active.start(startTime);
      active.stop(end + .015);
    }
    return { sources, nodes, endsAt: end + .015, onEnded: glottis };
  } catch (error) {
    for (const active of sources) {
      try { active.stop(); } catch { /* A source may not have started yet. */ }
    }
    for (const node of nodes) node.disconnect();
    throw error;
  }
}

function browserContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Constructor = window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Constructor ? new Constructor() : null;
}

type LiveVoice = SynthVoice & { timer: ReturnType<typeof setTimeout> | null };

/** Silent until a gesture; one melody cursor survives changes between the three sheep. */
export class SheepAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private resuming: Promise<void> | null = null;
  private enabled = true;
  private disposed = false;
  private epoch = 0;
  private step = 0;
  private lastStart = -Infinity;
  private pending = 0;
  private voices = new Set<LiveVoice>();
  private createContext: () => AudioContext | null;

  constructor({ createContext = browserContext }: { createContext?: () => AudioContext | null } = {}) {
    this.createContext = createContext;
  }

  private release(voice: LiveVoice) {
    if (!this.voices.delete(voice)) return;
    if (voice.timer !== null) clearTimeout(voice.timer);
    for (const source of voice.sources) {
      source.onended = null;
      try { source.stop(); } catch { /* A completed source is already stopped. */ }
    }
    voice.nodes.forEach((node) => node.disconnect());
  }

  async play(index: number, onNote?: (note: SheepNote) => void): Promise<boolean> {
    if (this.disposed || !this.enabled || !planSheepNote(index, 0) || this.pending >= 3) return false;
    const requestEpoch = this.epoch;
    this.pending++;
    try {
      // Construct and call resume synchronously inside the click/key gesture.
      if (!this.context) {
        const context = this.createContext();
        if (!context) return false;
        try {
          const master = context.createGain();
          master.gain.value = .55;
          master.connect(context.destination);
          this.context = context;
          this.master = master;
        } catch (error) {
          void context.close().catch(() => {});
          throw error;
        }
      }
      const context = this.context;
      if (context.state === "suspended") {
        if (!this.resuming) this.resuming = context.resume().finally(() => { this.resuming = null; });
        await this.resuming;
      }
      if (this.disposed || !this.enabled || this.epoch !== requestEpoch || context.state !== "running") return false;
      for (const voice of this.voices) if (voice.endsAt <= context.currentTime) this.release(voice);
      const startsAt = Math.max(context.currentTime + .005, this.lastStart + SHEEP_NOTE_SPACING);
      // At most three taps queue up. Extra frantic clicks never skip notes or leave a long tail.
      if (startsAt - context.currentTime > SHEEP_MAX_LOOKAHEAD || this.voices.size >= 5) return false;
      const note = planSheepNote(index, this.step)!;
      const voice: LiveVoice = { ...synthesizeSheepNote(context, this.master!, note, startsAt), timer: null };
      this.voices.add(voice);
      voice.onEnded.onended = () => this.release(voice);
      this.step = (this.step + 1) % SHEEP_MELODY.length;
      this.lastStart = startsAt;
      if (onNote) {
        const emit = () => {
          voice.timer = null;
          if (this.disposed || !this.enabled || this.epoch !== requestEpoch || !this.voices.has(voice)) return;
          try { onNote(note); } catch { /* A visual callback must not interrupt the choir. */ }
        };
        const delay = (startsAt - context.currentTime) * 1000;
        if (delay <= 10) emit();
        else voice.timer = setTimeout(emit, delay);
      }
      return true;
    } catch {
      // Blocked audio still allows the sheep's visual interaction.
      return false;
    } finally {
      this.pending--;
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
    if (!value) this.stop();
  }

  /** Also cancels gestures awaiting a browser resume. The next click continues the phrase. */
  stop() {
    this.epoch++;
    this.lastStart = -Infinity;
    for (const voice of this.voices) this.release(voice);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.master?.disconnect();
    if (this.context && this.context.state !== "closed") void this.context.close().catch(() => {});
    this.context = null;
    this.master = null;
  }
}
