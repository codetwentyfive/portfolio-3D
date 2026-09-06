# Photo-informed home room

Implemented September 6, 2026. Production release checks completed September 7, 2026; this project deploys from `main` through its existing Vercel Git integration.

## Scene

The `assistant` world replaces the generic CRT/server rack with an authored living-room cutaway based on the user's photograph. The dark glazed cabinet, porcelain urn, trailing pothos, mismatched framed prints, large TV, media console, leaning MIDI keyboard, walnut-slatted PC, mantel clock, chest and studio speakers on upholstered chairs follow the visible arrangement. Hidden depths are inferred, not measured or photogrammetrically reconstructed.

Wood grain and normal maps, plaster, speaker cloth and upholstery are deterministic procedural textures. Bevelled joinery, individual floor strips, mouldings, hardware, ceramics, clock hands, ports and cables provide close-up detail. Cabinet glass is transparent and does not cast opaque runtime shadows. The room has a lower placement than the short dioramas to keep its tall wall centered.

The photograph is reference only and is NOT in the repository, public assets or GLB. Its private computer-screen content is not reproduced. The wall art is newly generated reference-inspired artwork, not an assertion that the original physical prints were recovered exactly.

## Television

`MatrixDisplay.tsx` attaches one owned 768 x 432 canvas texture to the GLB's dedicated `Room OLED screen` material. Multilingual falling characters adapt the idea found in the user's `portfolio-react/src/components/matrixBackground.js`: Katakana, Cyrillic, Latin and numbers, independent column speeds, bright heads, fading trails and restrained scanlines. A short-range green point light provides TV spill without another shadow map.

The animation uses the existing R3F frame loop, not another timer or page-wide overlay. Time progression is frame-rate independent and uploads are capped at 20 fps. Pause, hold, reduced motion, hidden/off-screen state and world transitions use the same motion gate as the scene. Large resume deltas are clamped. A populated first frame is available with motion disabled.

On unmount, the effect restores the cached GLB material and disposes only its own material/texture. It adds no global listeners, React state updates per frame, remote requests, autoplay media or dependencies. The GLB embeds a deterministic digital-rain still for catalog rendering and fallback if canvas creation fails.

## Assets And Budgets

- `assets/world-versions.json`: assistant v4; other worlds unchanged. Published v2 files remain available for cached pages; unpublished v3 is superseded.
- `public/3d/worlds/assistant-v4.glb`: 3,952,996 bytes, 69,024 triangles, 19 material batches, nine embedded textures. Existing limits of 4 MB, 150,000 triangles and 26 batches remain unchanged.
- `public/images/worlds/assistant-v4.png`: 720 x 520 transparent render, 455,109 bytes.
- `assets/home-room/`: source atlas, digital-rain still and reproducible procedural surface maps.

## Regeneration

From the portfolio repository root, using the existing Node/sharp installation and Blender 4.0:

```powershell
node scripts/render-matrix-still.mjs
& 'C:/Program Files/Blender Foundation/Blender 4.0/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/build-project-worlds.py -- assistant
& 'C:/Program Files/Blender Foundation/Blender 4.0/blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/render-world-previews.py -- assistant
```

`scripts/home_room.py` builds the room using the existing shared geometry helpers. It does not rebuild or modify the other worlds when passed `-- assistant`. Blender regenerates and embeds the procedural maps. Keep `wall-prints.jpg`, which is the one non-procedural source asset. Increment the shared version before a future published asset revision because world URLs are immutable-cache assets.

## Generated Wall Artwork

Tool: built-in `image_gen.imagegen`, one reference-guided generation. Original output: `exec-73c8dc1a-dd7e-4658-9e8b-9e3a496b85c7.png`. Delivered atlas: 1536 x 1024 with three equal vertical panels; optimized using sharp to `assets/home-room/wall-prints.jpg`, JPEG quality 86, 4:4:4 chroma. UVs use inset thirds and the model uses the actual 1:2 panel proportions, rather than stretching to the requested aspect ratio.

Final generation prompt:

> Use case: illustration-story. Asset type: ONE flat texture atlas for the three framed prints in a 3D reconstruction of the user's living room. The attached photograph is reference ONLY for the three large wall prints above the television. Do not reproduce the room, the photograph, the television, computer UI, any device screen or private text. Create a wide 2:1 atlas with exactly THREE equal-width portrait panels side by side, full bleed, straight-on, absolutely flat, no frames, no shadows, no perspective, no gaps or gutters. Each panel has a 2:3 portrait aspect ratio. Left panel: vintage cream paper, expressive black cat silhouette with a wavy raised tail, muted brick-red condensed lettering at top reading 'NINE LIVES' and at bottom 'NONE LEFT', inspired by the cat poster in the photo. Middle panel: atmospheric Japanese woodblock-inspired Yoshino mountain landscape, dark teal hills, muted peach and cream blossom clouds, narrow cream caption strip at bottom reading 'Yoshino Mountain'. Right panel: cream paper, elegant deep-navy stylized leaping antelope with spiraling horns and decorative flowing curls, like the animal print in the photo; a compact understated navy letterpress caption at bottom reading 'A LOVELY EVENING'. All three should feel like richly printed physical art on subtly aged paper, maintaining the distinct designs and restrained colors of the reference wall. The output is only the single atlas of three print artworks, no surrounding wall or 3D mockup. Precise equal thirds are essential for texture UVs.

## Verification

The 49-test suite includes new Matrix determinism, bounds, pause, resume, frame-rate and canvas-state checks, plus the exported TV UVs, embedded still, textured room materials, transparent glass and metallic shelf computers. Existing navigation, transition, audio, security-header and other-world branding checks remain included.

```powershell
node --test scripts/world-transition.test.mjs scripts/world-navigation.test.mjs scripts/audio-controller.test.mjs scripts/security-headers.test.mjs scripts/turntable-motion.test.mjs scripts/project-assets.test.mjs scripts/matrix-rain.test.mjs
npm run build
```

The production build passes, including TypeScript and lint; the pre-existing HomeInfo image warning and stale Browserslist notice remain. Browser verification covers 1440 x 1000 desktop, 390 x 844 English and 320 x 568 German viewports, populated/animated TV frames, pause/reset/inspect and leaving/re-entering the room. Both phone layouts have no document overflow. Production-runtime checks show the new model and animated texture with no new console errors. The temporary production server was stopped and the development preview restored on port 3000. Viewport checks are not a substitute for physical touch, low-end-GPU or Safari testing.

## Shelf Computers Follow-up

Two silver Mac minis sit side by side on the upper media shelf and a gold-and-black DGX Spark sits below. They replace two generic hi-fi boxes. Rounded plan corners, machined lid edges, front USB-C/headphone ports, status indicators, recessed feet, rear connections, power leads and the Spark's diagonal intake are authored geometry. No new textures or application dependencies are required.

Proportion/port references: [Apple's 2024 Mac mini specifications](https://support.apple.com/en-ie/121555) and [NVIDIA's DGX Spark hardware overview](https://docs.nvidia.com/dgx/dgx-spark/hardware.html). These are miniature interpretations, not exact CAD replicas. Common shelf hardware is slightly enlarged to stay readable in the diorama. The mini design uses the M4-era enclosure; the user did not specify a generation.

The fresh v4 URL is important even during local iteration: the previous v3 URL remained in the browser's immutable asset cache after rebuilding the file. The shared registry updates both runtime and catalog references.

Release verification (September 7): the production build was rerun successfully with the shelf hardware included, and all 49 tests pass. The updated hardware is visible in the local browser without new console errors. Only the pre-existing HomeInfo image lint warning remains.
