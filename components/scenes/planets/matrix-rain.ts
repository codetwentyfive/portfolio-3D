// Adapted from portfolio-react/src/components/matrixBackground.js.
// Keep the multilingual rain, without page listeners or an unmanaged interval.
export const MATRIX_WIDTH = 768;
export const MATRIX_HEIGHT = 432;
export const MATRIX_FPS = 20;
export const MATRIX_CELL = 16;
const CELL = MATRIX_CELL;
const ALPHABET = Array.from(
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
    "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
);
const hash = (n: number) => {
  let value = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
};

export function createMatrixRain() {
  return {
    elapsed: 8,
    frameTime: 0,
    columns: Array.from({ length: Math.floor(MATRIX_WIDTH / CELL) }, (_, i) => ({
      x: i * CELL + 1,
      speed: 3 + hash(i + 71) * 7,
      length: 8 + Math.floor(hash(i + 179) * 19),
      start: hash(i + 319) * 80,
      seed: i * 239 + 17,
    })),
  };
}
export type MatrixRain = ReturnType<typeof createMatrixRain>;

export function advanceMatrixRain(rain: MatrixRain, delta: number, running: boolean) {
  if (!running || !Number.isFinite(delta) || delta <= 0) return false;
  const dt = Math.min(delta, 0.1);
  rain.elapsed += dt;
  rain.frameTime += dt;
  if (rain.frameTime + 1e-9 < 1 / MATRIX_FPS) return false;
  rain.frameTime = Math.max(
    0,
    rain.frameTime - Math.floor((rain.frameTime + 1e-9) * MATRIX_FPS) / MATRIX_FPS,
  );
  return true;
}

export function forEachMatrixGlyph(
  rain: MatrixRain,
  visit: (glyph: string, x: number, y: number, opacity: number, head: boolean) => void,
) {
  const rows = MATRIX_HEIGHT / CELL;
  for (const column of rain.columns) {
    const head =
      (column.start + rain.elapsed * column.speed) % (rows + column.length + 8) - 4;
    for (let tail = 0; tail < column.length; tail++) {
      const row = Math.floor(head) - tail;
      if (row < 0 || row >= Math.floor(rows)) continue;
      const tick = Math.floor(rain.elapsed * (tail === 0 ? 11 : 1.6));
      const glyph =
        ALPHABET[Math.floor(hash(column.seed + row * 37 + tick * 13) * ALPHABET.length)];
      visit(
        glyph,
        column.x,
        row * CELL + CELL - 2,
        tail === 0 ? 1 : 0.07 + Math.pow(1 - tail / column.length, 1.5) * 0.85,
        tail === 0,
      );
    }
  }
}

export function paintMatrixRain(
  context: CanvasRenderingContext2D,
  rain: MatrixRain,
) {
  context.globalAlpha = 1;
  context.shadowBlur = 0;
  context.fillStyle = "#020805";
  context.fillRect(0, 0, MATRIX_WIDTH, MATRIX_HEIGHT);
  context.font = `${CELL - 1}px monospace`;
  context.textBaseline = "alphabetic";
  forEachMatrixGlyph(rain, (glyph, x, y, opacity, head) => {
    context.globalAlpha = opacity;
    context.fillStyle = head ? "#d4ffe4" : "#4afe83";
    context.shadowColor = "#65ffa0";
    context.shadowBlur = head ? 6 : 0;
    context.fillText(glyph, x, y);
  });
  context.globalAlpha = 0.13;
  context.shadowBlur = 0;
  context.fillStyle = "#000000";
  for (let y = 0; y < MATRIX_HEIGHT; y += 3) context.fillRect(0, y, MATRIX_WIDTH, 1);
  context.globalAlpha = 1;
}
