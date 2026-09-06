export function wrapWorld(index: number, count: number) {
  if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1)
    return 0;
  return ((index % count) + count) % count;
}

export type WorldSwipe = {
  pointer: number;
  x: number;
  y: number;
  cancelled: boolean;
};

export function startWorldSwipe(
  pointer: number,
  x: number,
  y: number,
): WorldSwipe {
  return { pointer, x, y, cancelled: false };
}

export function moveWorldSwipe(
  swipe: WorldSwipe,
  pointer: number,
  x: number,
  y: number,
) {
  if (pointer !== swipe.pointer) return;
  // Once the gesture becomes a page scroll, never reinterpret it as navigation.
  const dx = Math.abs(x - swipe.x);
  const dy = Math.abs(y - swipe.y);
  if (dy > 12 && dy > dx) swipe.cancelled = true;
}

export function finishWorldSwipe(
  swipe: WorldSwipe,
  pointer: number,
  x: number,
  y: number,
): -1 | 0 | 1 {
  if (swipe.cancelled || pointer !== swipe.pointer) return 0;
  const dx = x - swipe.x;
  const dy = y - swipe.y;
  if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}
