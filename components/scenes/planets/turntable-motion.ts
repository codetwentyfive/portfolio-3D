export const SPIN_SPEED = 0.055;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function createTurntable() {
  return {
    yaw: 0,
    pitch: 0,
    velocity: SPIN_SPEED,
    pointer: null as number | null,
    x: 0,
    y: 0,
    time: 0,
  };
}

export type TurntableState = ReturnType<typeof createTurntable>;

export function hold(
  state: TurntableState,
  id: number,
  x: number,
  y: number,
  time: number,
) {
  if (state.pointer !== null) return false;
  Object.assign(state, { pointer: id, x, y, time, velocity: SPIN_SPEED });
  return true;
}

export function drag(
  state: TurntableState,
  id: number,
  x: number,
  y: number,
  time: number,
  width: number,
) {
  if (state.pointer !== id) return false;
  const radians = ((x - state.x) / Math.max(width, 1)) * Math.PI * 2;
  state.yaw += radians;
  state.pitch = clamp(
    state.pitch + ((y - state.y) / Math.max(width, 1)) * 1.4,
    -0.25,
    0.3,
  );
  state.velocity = clamp(
    radians / Math.max((time - state.time) / 1000, 0.016),
    -1.6,
    1.6,
  );
  Object.assign(state, { x, y, time });
  return true;
}

export function release(
  state: TurntableState,
  id: number,
  time: number,
  cancelled = false,
) {
  if (state.pointer !== id) return false;
  state.pointer = null;
  if (cancelled || time - state.time > 100) state.velocity = SPIN_SPEED;
  return true;
}

export function advance(state: TurntableState, delta: number, motion: boolean) {
  if (!motion || state.pointer !== null) return;
  const dt = clamp(delta, 0, 0.05);
  // Analytic damping keeps the release glide consistent at 30/60/120 Hz.
  const decay = Math.exp(-3 * dt);
  state.yaw +=
    SPIN_SPEED * dt + ((state.velocity - SPIN_SPEED) * (1 - decay)) / 3;
  state.velocity = SPIN_SPEED + (state.velocity - SPIN_SPEED) * decay;
  state.yaw %= Math.PI * 2;
}
