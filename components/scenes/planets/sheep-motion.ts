/** Pose offsets are in the sheep's authored, unscaled local coordinates. */
export const SHEEP_REACTION_DURATIONS = [3.6, 2.8, 2.5] as const;
export const SHEEP_COUNT = SHEEP_REACTION_DURATIONS.length;
export const SHEEP_HEAD_LIMITS = [
  { pitch: [-.43, .03], yaw: .12 },
  { pitch: [-.16, .05], yaw: .16 },
  { pitch: [-.22, .025], yaw: .06 },
] as const;

export type SheepPose = {
  pitch: number;
  yaw: number;
  jawPitch: number;
  jawYaw: number;
  hop: number;
  bodyLift: number;
  bodyPitch: number;
  bodyRoll: number;
  bodyStretch: number;
  earLeft: number;
  earRight: number;
  tail: number;
  frontLeg: number;
  backLeg: number;
};
export type SheepReaction = SheepPose & { active: boolean; progress: number };

const rest = (): SheepPose => ({
  pitch: 0, yaw: 0, jawPitch: 0, jawYaw: 0, hop: 0, bodyLift: 0, bodyPitch: 0, bodyRoll: 0,
  bodyStretch: 0, earLeft: 0, earRight: 0, tail: 0, frontLeg: 0, backLeg: 0,
});
const clamp = (value: number) => Math.max(0, Math.min(1, value));
// Quintic easing makes positions, velocities and acceleration meet at each phase.
const ease = (value: number) => { const x = clamp(value); return x * x * x * (x * (x * 6 - 15) + 10); };
const pulse = (p: number, start: number, peak: number, end: number) =>
  p < peak ? ease((p - start) / (peak - start)) : 1 - ease((p - peak) / (end - peak));
const held = (p: number, start: number, up: number, down: number, end: number) =>
  ease((p - start) / (up - start)) * (1 - ease((p - down) / (end - down)));
const springArc = (p: number, start: number, end: number) => {
  if (p <= start || p >= end) return 0;
  const t = (p - start) / (end - start);
  // A rounded ballistic arc, without a hovering hold at its apex.
  return 16 * t * t * (1 - t) * (1 - t);
};

export function createSheepClocks(): number[] {
  return Array.from({ length: SHEEP_COUNT }, () => -1);
}

export function startSheepReaction(clocks: number[], index: number): boolean {
  if (!Number.isInteger(index) || index < 0 || index >= SHEEP_COUNT || clocks[index] >= 0) return false;
  // Every response finishes its follow-through before replaying, including adults.
  clocks[index] = 0;
  return true;
}

export function advanceSheepClocks(clocks: number[], delta: number): boolean {
  let active = false;
  for (let index = 0; index < SHEEP_COUNT; index++) {
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
  const result = { ...rest(), active, progress: p };
  if (!active || !movement) return result;
  if (index === 0) {
    // Lift away from the grass, listen, look towards the visitor, then resume grazing.
    const attention = held(p, 0, .24, .66, 1);
    result.pitch = -.40 * attention;
    result.yaw = .108 * pulse(p, .20, .48, .86);
    result.earLeft = .22 * pulse(p, .25, .30, .39) - .10 * pulse(p, .40, .45, .52);
    result.earRight = -.17 * pulse(p, .32, .37, .46);
    result.tail = .09 * pulse(p, .47, .55, .69);
  } else if (index === 1) {
    // A small shake travels from the shoulders through the head, ears and tail.
    const shake = held(p, .13, .27, .49, .72);
    result.pitch = -.10 * pulse(p, 0, .22, .85);
    result.yaw = .125 * Math.sin((p - .13) * Math.PI * 11) * shake;
    result.bodyRoll = .022 * Math.sin((p - .17) * Math.PI * 11) * shake;
    result.bodyStretch = .009 * Math.sin((p - .18) * Math.PI * 11) * shake;
    result.earLeft = .22 * Math.sin((p - .18) * Math.PI * 11) * shake;
    result.earRight = -.20 * Math.sin((p - .22) * Math.PI * 11) * shake;
    result.tail = .15 * Math.sin((p - .20) * Math.PI * 9) * held(p, .18, .34, .58, .91);
  } else if (index === 2) {
    // Anticipation, a single playful spring, and a soft landing with delayed ear follow-through.
    const anticipation = pulse(p, 0, .16, .27);
    const landing = pulse(p, .47, .55, .78);
    const flight = springArc(p, .25, .49);
    const tuck = held(p, .29, .335, .395, .45);
    result.hop = .30 * flight;
    result.bodyLift = -.014 * anticipation - .018 * landing;
    result.bodyStretch = -.030 * anticipation + .020 * flight - .034 * landing;
    result.bodyPitch = -.025 * flight + .018 * landing;
    result.pitch = -.17 * pulse(p, .09, .38, .90);
    result.yaw = -.028 * pulse(p, .68, .79, 1);
    result.frontLeg = .45 * tuck;
    result.backLeg = -.38 * tuck;
    result.earLeft = -.18 * flight + .15 * pulse(p, .49, .59, .79);
    result.earRight = .16 * flight - .13 * pulse(p, .52, .62, .83);
    result.tail = -.12 * pulse(p, .16, .43, .83);
  }
  return result;
}

/** Slow asynchronous life, with planted hooves and occasional individual ear flicks. */
export function sampleSheepIdle(index: number, seconds: number, movement = true): SheepPose {
  const result = rest();
  if (!movement || index < 0 || index >= SHEEP_COUNT) return result;
  const phase = seconds + index * 2.73;
  const fade = ease(seconds / 1.2);
  result.bodyStretch = Math.sin(phase * 1.8) * .006 * fade;
  result.pitch = Math.sin(phase * (index === 0 ? 1.55 : .43)) * (index === 0 ? .014 : .009) * fade;
  result.yaw = Math.sin(phase * .31) * .011 * fade;
  if (index === 0) {
    const chew = held((phase % 4.9) / 4.9, .06, .20, .68, .93) * fade;
    result.jawPitch = .011 * (1 - Math.cos(phase * 7.2)) * .5 * chew;
    result.jawYaw = .027 * Math.sin(phase * 7.2) * chew;
  }
  const flick = (phase % 9.7) / 9.7;
  result.earLeft = .10 * pulse(flick, .69, .709, .748) * fade;
  result.earRight = -.08 * pulse(flick, .718, .737, .78) * fade;
  result.tail = .035 * pulse(flick, .32, .35, .41) * fade;
  return result;
}

/** Idle and click movement overlap smoothly; clicking never drops the current idle pose. */
export function sampleSheepPose(index: number, seconds: number, idleSeconds: number, idleWeight: number, movement = true): SheepReaction {
  const result = sampleSheepReaction(index, seconds, movement);
  const idle = sampleSheepIdle(index, idleSeconds, movement);
  const weight = clamp(idleWeight);
  for (const key of Object.keys(idle) as (keyof SheepPose)[]) result[key] += idle[key] * weight;
  // The grazing sheep finishes chewing as it raises its head to listen.
  const chewing = 1 - ease((-result.pitch - .035) / .20);
  result.jawPitch *= chewing;
  result.jawYaw *= chewing;
  const limits = SHEEP_HEAD_LIMITS[index];
  if (limits) {
    result.pitch = Math.max(limits.pitch[0], Math.min(limits.pitch[1], result.pitch));
    result.yaw = Math.max(-limits.yaw, Math.min(limits.yaw, result.yaw));
  }
  return result;
}
