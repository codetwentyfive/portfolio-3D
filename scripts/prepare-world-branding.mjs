import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const repositories = resolve(
  process.argv[2] || dirname(root.replace(/[\\/]$/, "")),
);
const output = resolve(root, "assets/world-branding");
const sources = {
  seeds: "strange-seeds/public/images/_BandLogo.png",
  potera: "potera/public/images/logo.svg",
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const provenance = {};
await mkdir(output, { recursive: true });

for (const [kind, source] of Object.entries(sources)) {
  const original = await readFile(resolve(repositories, source));
  // Remove empty canvas, not artwork. Preserve the original colors and alpha.
  const png = await sharp(original)
    .trim()
    .resize({
      width: 512,
      height: 512,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(resolve(output, `${kind}-logo.png`), png);
  provenance[kind] = {
    source,
    sourceSha256: hash(original),
    texture: `${kind}-logo.png`,
    textureSha256: hash(png),
    preparation:
      "Trim empty margins; fit inside 512px without changing aspect ratio, colors or transparency.",
  };
  console.log(`${kind}: ${png.length} bytes`);
}
await writeFile(
  resolve(output, "provenance.json"),
  `${JSON.stringify(provenance, null, 2)}\n`,
);
