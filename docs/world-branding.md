# Original project branding

September 6, 2026. The Strange Seeds and Potera worlds use the projects' original artwork, not generated initials or approximations.

## Sources and placement

- The Strange Seeds: `strange-seeds/public/images/_BandLogo.png` from the sibling band-site repository. The complete sunflower and wordmark replace the kick drum initials. The right microphone stand is moved out of the logo's main viewing line.
- Potera: `potera/public/images/logo.svg`, the actual logo referenced by that site's header. It appears on the cleaning cart and a portable contractor sign in the courtyard. The customer's building is not branded as Potera's office.

Prepared 512px-bounded PNGs and source SHA-256 records live in `assets/world-branding/`. Preparation only removes empty canvas and downsizes proportionally; artwork, colors and alpha are retained. No fonts, logos or proportions are recreated. The PNGs are embedded byte-for-byte into their GLBs.

The logo planes use UV coordinates and masked alpha on matte, nonmetallic materials. This avoids floating opaque rectangles and transparency-sorting artifacts. All logo geometry is batched with its world and shares the existing turntable. Potera's two logo placements share one material batch and one texture.

## Rebuild

The prepared textures are committed, so model rebuilds do not require the sibling repositories. To refresh them from original sources, run:

```powershell
node scripts/prepare-world-branding.mjs
# Optional first argument: another directory containing strange-seeds/ and potera/.
```

Rebuild only the two affected models and thumbnails:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 4.0/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/build-project-worlds.py -- seeds potera
& 'C:/Program Files/Blender Foundation/Blender 4.0/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/render-world-previews.py -- seeds potera
```

`assets/world-versions.json` is shared by both runtime loaders, the project catalog, Blender scripts and asset tests. Seeds and Potera now use v3; other worlds are unchanged. Published v2 assets remain for compatibility with cached older pages, but current navigation and catalog links use v3.

## Verification

`node --test scripts/project-assets.test.mjs` checks embedded artwork against the prepared originals, provenance hashes, UVs, alpha mode, texture limits, geometry budgets, material batching and animation pivots. It also prevents the generator from reintroducing the drum's placeholder initials.

The updated GLBs are approximately 3.29 MB (Seeds) and 1.21 MB (Potera), each still below the 4 MB per-world budget. Both 720x520 previews remain below 500 KB. No new runtime dependencies or separate texture requests are introduced. Blender emits a sampler-selection warning when exporting linked color/alpha; exported PNG bytes and alpha mode are verified by the tests.

Production build and all 41 regression tests pass. Local browser verification covers both logos, keyboard rotation, world switching and phone-sized layout, with no console errors. The production catalog resolves the v3 preview URLs. Release uses the existing Vercel Git integration on `main`; unrelated local drafts are excluded.
