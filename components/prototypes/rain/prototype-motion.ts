export type PhonePose = { alpha: number; beta: number; gamma: number; screen: number };
export type CameraTilt = { x: number; y: number };

const radians = Math.PI / 180;

// Device orientation is Rz(alpha) Rx(beta) Ry(gamma). Comparing basis vectors
// avoids Euler-angle jumps around an upright grip and across the ±180° seam.
function basis(pose: PhonePose) {
  const a = pose.alpha * radians, b = pose.beta * radians, g = pose.gamma * radians;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const cg = Math.cos(g), sg = Math.sin(g);
  return [
    [ca * cg - sa * sb * sg, sa * cg + ca * sb * sg, -cb * sg],
    [-sa * cb, ca * cb, sb],
    [ca * sg + sa * sb * cg, sa * sg - ca * sb * cg, cb * cg],
  ];
}

export function cameraTilt(neutral: PhonePose, current: PhonePose): CameraTilt {
  const axes = basis(neutral), normal = basis(current)[2];
  const dot = (axis: number[]) => axis.reduce((sum, n, i) => sum + n * normal[i], 0);
  const horizontal = Math.atan2(dot(axes[0]), dot(axes[2]));
  const vertical = Math.atan2(-dot(axes[1]), dot(axes[2]));
  const angle = current.screen * radians;
  // A small dead zone removes hand tremor; 18° of phone tilt reaches the limit.
  // Wider camera travel makes a comfortable wrist movement visibly steer the view.
  const response = (value: number) => Math.abs(value) <= 0.4 * radians ? 0
    : Math.sign(value) * Math.min(1, (Math.abs(value) - 0.4 * radians) / (17.6 * radians));
  return {
    x: response(Math.cos(angle) * horizontal + Math.sin(angle) * vertical) * 18 * radians,
    y: response(-Math.sin(angle) * horizontal + Math.cos(angle) * vertical) * 10 * radians,
  };
}

export function easeCameraTilt(current: CameraTilt, target: CameraTilt, delta: number) {
  const amount = 1 - Math.exp(-Math.max(0, Math.min(delta, 0.05)) / 0.2);
  current.x += (target.x - current.x) * amount;
  current.y += (target.y - current.y) * amount;
  const moving = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.00005;
  if (!moving) { current.x = target.x; current.y = target.y; }
  return moving;
}

// One per page tree, shared by the existing permission hook and the 3D canvas.
// Sensor samples update this mutable target without rendering the React tree.
export function createPrototypeMotion() {
  let latest: PhonePose | undefined, neutral: PhonePose | undefined;
  const listeners = new Set<() => void>();
  const target = { x: 0, y: 0 };
  const publish = (tilt: CameraTilt) => {
    if (target.x === tilt.x && target.y === tilt.y) return;
    target.x = tilt.x; target.y = tilt.y;
    listeners.forEach((listener) => listener());
  };
  return {
    target,
    update(pose: PhonePose) {
      if (!neutral || neutral.screen !== pose.screen) neutral = pose;
      latest = pose;
      publish(cameraTilt(neutral, pose));
    },
    recenter() {
      neutral = latest;
      publish({ x: 0, y: 0 });
    },
    reset() {
      latest = neutral = undefined;
      publish({ x: 0, y: 0 });
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

export type PrototypeMotion = ReturnType<typeof createPrototypeMotion>;
