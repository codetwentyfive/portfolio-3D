import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { MATRIX_WIDTH, MATRIX_HEIGHT, MATRIX_CELL, createMatrixRain, forEachMatrixGlyph } from "../components/scenes/planets/matrix-rain.ts";

const output = new URL("../assets/home-room/", import.meta.url);
await mkdir(output, { recursive: true });
const glyphs = [];
forEachMatrixGlyph(createMatrixRain(), (glyph, x, y, opacity, head) => {
  glyphs.push(`<text x="${x}" y="${y}" opacity="${opacity.toFixed(3)}" fill="${head ? "#d4ffe4" : "#4afe83"}">&#${glyph.codePointAt(0)};</text>`);
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MATRIX_WIDTH}" height="${MATRIX_HEIGHT}"><rect width="100%" height="100%" fill="#020805"/><g font-family="monospace" font-size="${MATRIX_CELL - 1}">${glyphs.join("")}</g></svg>`;
await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL("matrix-still.png", output)));
