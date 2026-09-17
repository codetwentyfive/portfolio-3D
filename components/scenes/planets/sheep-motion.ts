/** Authored head clearances were checked over this entire pitch/yaw envelope. */
export const SHEEP_REACTION_DURATIONS = [2.8, 2.25, 2.5, 2.9, 3.8, 3.2] as const;

export type SheepReaction = {
  active: boolean;
  progress: number;
  pitch: number;
  yaw: number;
  hop: number;
  wool: number;
  accent: number;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const x = clamp(value); return x * x * (3 - 2 * x); };
const window = (p: number, start: number, end: number) => ease(p / start) * (1 - ease((p - end) / (1 - end)));
const hop = (p: number, start: number, end: number, height: number) => {
  if (p <= start || p >= end) return 0;
  // Zero velocity at takeoff/landing keeps the tiny jumps gentle.
  return height * Math.sin((p - start) / (end - start) * Math.PI) ** 2;
};

export function createSheepClocks(): number[] {
  return Array.from({ length: 6 }, () => -1);
}

export function startSheepReaction(clocks: number[], index: number): boolean {
  if (!Number.isInteger(index) || index < 0 || index >= SHEEP_REACTION_DURATIONS.length) return false;
  // Let the airborne lamb land before replaying; resetting its clock would snap it down.
  if (index === 2 && clocks[index] >= 0) return false;
  clocks[index] = 0;
  return true;
}

export function advanceSheepClocks(clocks: number[], delta: number): boolean {
  let active = false;
  for (let index = 0; index < clocks.length; index++) {
    if (clocks[index] < 0) continue;
    clocks[index] += Math.max(0, Math.min(delta, .05));
    if (clocks[index] >= SHEEP_REACTION_DURATIONS[index]) clocks[index] = -1;
    else active = true;
  }
  return active;
}

export function sampleSheepReaction(index: number, seconds: number, movement = true): SheepReaction {
  const duration = SHEEP_REACTION_DURATIONS[index];
  const active = duration !== undefined && seconds >= 0 && seconds < duration;
  const p = active ? clamp(seconds / duration) : 1;
  const result = { active, progress: p, pitch: 0, yaw: 0, hop: 0, wool: 0, accent: 0 };
  if (!active || !movement) return result;
  const held = window(p, .18, .7);
  switch (index) {
    case 0: // A slow, friendly turn and one little heart.
      result.pitch = -.34 * held;
      result.yaw = .115 * held * Math.sin(p * Math.PI);
      result.accent = window(p, .34, .64);
      break;
    case 1: // Only the wool moves; feet and face stay planted.
      result.pitch = -.09 * held;
      result.wool = Math.sin(p * Math.PI * 13) * window(p, .13, .64);
      result.accent = window(p, .24, .57);
      break;
    case 2: // Two little bounds, with a grounded pause between them.
      result.hop = hop(p, .12, .38, .135) + hop(p, .48, .79, .19);
      result.pitch = -.09 * held;
      result.accent = 0;
      break;
    case 3: // Short grazing nods within the audited ground clearance.
      result.pitch = -.045 * held + .07 * held * Math.sin(p * Math.PI * 10);
      result.yaw = .022 * Math.sin(p * Math.PI * 4) * held;
      result.accent = window(p, .21, .7);
      break;
    case 4: // A drowsy stir, then settle back into the grass.
      result.pitch = -.15 * held;
      result.yaw = -.075 * Math.sin(p * Math.PI) * held;
      result.accent = window(p, .28, .64);
      break;
    case 5: // A distinct left/right look, followed by one shy nod.
      result.pitch = -.24 * held + .08 * Math.sin(p * Math.PI * 3) * held;
      result.yaw = .12 * Math.sin(p * Math.PI * 2) * held;
      result.accent = window(p, .2, .6);
      break;
  }
  result.pitch = Math.max(-.485, Math.min(.035, result.pitch));
  result.yaw = Math.max(-.125, Math.min(.125, result.yaw));
  return result;
}
