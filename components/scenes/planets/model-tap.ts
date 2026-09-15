type ModelGesture = {
  pointer: number | null;
  x: number;
  y: number;
  maximumDistance: number;
  cancelled: boolean;
};

const gestures = new WeakMap<HTMLCanvasElement, ModelGesture>();

export function beginModelGesture(canvas: HTMLCanvasElement, pointer: number, x: number, y: number) {
  if (gestures.get(canvas)?.pointer != null) return;
  gestures.set(canvas, { pointer, x, y, maximumDistance: 0, cancelled: false });
}

export function moveModelGesture(canvas: HTMLCanvasElement, pointer: number, x: number, y: number) {
  const gesture = gestures.get(canvas);
  if (!gesture || gesture.pointer !== pointer) return;
  gesture.maximumDistance = Math.max(gesture.maximumDistance, Math.hypot(x - gesture.x, y - gesture.y));
}

export function endModelGesture(canvas: HTMLCanvasElement, pointer: number, cancelled: boolean) {
  const gesture = gestures.get(canvas);
  if (!gesture || gesture.pointer !== pointer) return;
  gesture.pointer = null;
  gesture.cancelled = cancelled;
}

export function isModelTap(canvas: HTMLCanvasElement) {
  const gesture = gestures.get(canvas);
  // Keep the completed gesture for the click dispatched after pointerup. A drag
  // remains a drag even when the pointer returns to its original coordinates.
  return Boolean(gesture && gesture.pointer === null && !gesture.cancelled && gesture.maximumDistance <= 6);
}

export function clearModelGesture(canvas: HTMLCanvasElement) {
  gestures.delete(canvas);
}
