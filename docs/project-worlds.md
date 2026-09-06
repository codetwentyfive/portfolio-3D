# Project worlds

> Historical implementation notes for the first world prototype. The shop asset and lighting details below remain useful. The concept worlds, homepage UI, mobile controls, and extension instructions were superseded by [Studio archive](studio-archive.md).

The home route now opens on the chingis.shop world. This is a local, interactive 3D implementation in the portfolio repository, not a change to the shop storefront or the deployed site.

## Art direction

A floating Mongolian pasture communicates the shop's connection to artisans and materials. The ger keeps its circular felt structure, roof crown, ribs, ropes, and carved wooden door. Beside it, an older craftsman stitches leather at a workbench; four sheep graze among grass and small flowers. A drying rack, offcuts, tools, and stitched leather connect the setting to the products.

Four ger materials cycle every 7.2 seconds: painted felt with brief colored displacement smears, a transparent cyan blueprint exposing the lattice, reflective metal, and terracotta. The paint treatment uses an original procedural shader. The models now use smooth, rounded animated-film-inspired forms, but are browser-scale original assets, not Pixar or Arcane production assets.

References informing the direction:

- [Canva's 2026 design research](https://www.canva.com/newsroom/news/design-trends-2026/): tactile surfaces, deliberate imperfection, and surreal visual treatments.
- [Fortiche's Arcane work](https://forticheprod.com/portfolio/arcane-season-2/): reference for the requested interplay of 2D effects and 3D forms.
- [Award-recognized Three.js sites](https://www.webdesignawards.io/technology/three-js): context for interactive portfolio worlds.

## Structure

- `components/scenes/HomeScene.tsx`: localized UI, selected project, material cycling, pause controls, and visibility handling.
- `components/scenes/planets/planet-data.ts`: world registry; matches project names and URLs to the existing catalog by English project name. Put the shop first.
- `components/scenes/planets/PlanetCanvas.tsx`: lighting, GPU fallback, original island, and concept worlds.
- `components/scenes/planets/WorldTurntable.tsx`: the single rotation parent, responsive camera, captured pointer gestures, and keyboard controls.
- `components/scenes/planets/turntable-motion.ts`: independently testable spin, drag, and release dynamics.
- `components/scenes/planets/MobileWorldHUD.tsx` and `WorldGlyph.tsx`: text-free mobile controls, material tiles, project glyphs, and launch links.
- `components/scenes/planets/ShopPlanet.tsx`: organic terrain, instanced grass, flowers, path, drying rack, and asset layout.
- `components/scenes/planets/ShopAssets.tsx`: local GLB loading, isolated materials, ger treatments, and animated character pivots.
- `components/scenes/planets/PaintedMaterial.tsx`: procedural surface texture for terrain and props.
- `scripts/build-shop-assets.py`: reproducible Blender source for the four original shop assets in `public/3d/shop/`.

The other four project worlds are deliberately labeled as world studies: payments infrastructure, Strange Seeds, Potera, and the AI assistant. The original portfolio island is retained using its existing GLB. All shop models are served locally; no external asset service is required.

## Assets and lighting

The Blender generator creates a fabric ger with seams, trim, lattice, a carved door, and crown; a seated artisan with facial features, hands, clothing folds, and leather apron; a beveled workbench with stitched hide and tools; and a sheep with layered wool, expressive eyes, and a separate head pivot. Four sheep share the loaded geometry. Meshes are joined by material and animation parent to limit draw calls. Each placed model owns its material copies, so changing ger styles cannot mutate loader-cached originals.

The four uncompressed GLBs total approximately 2.6 MB. Rebuild with Blender 4.0 or compatible:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 4.0/blender.exe' --background --factory-startup --python scripts/build-shop-assets.py
```

Asset URLs are served with long-lived cache headers. When replacing a previously shipped GLB, version its filename or URL in `ShopAssets.tsx`.

The legacy island's color atlas was also connected to full-strength emission, which washed out lighting. Its runtime material clone disables that emission and enables cast/receive shadows on meshes, without modifying the source GLB. The shared lighting rig uses ACES tone mapping, a warm key, cool rim, restrained environment reflections, native PCF-soft shadows, and a low bounce fill. The editorial redesign now uses a flat warm-paper backdrop; see `editorial-design.md`. The more expensive global PCSS shader patch was removed; some Windows drivers still emit nonfatal warnings for Three's shadow code.

## Interaction and mobile

Every world, including its terrain, lives under one turntable group. Concept sculptures no longer spin independently of their bases. Pointer capture supports mouse, pen, and touch: hold stops the scene, drag changes yaw/pitch, and release eases back to automatic rotation. Cancellation, capture loss, tab hiding, blur, and project/reset changes release the held state. A second pointer cannot steal the active gesture. Animation stays disabled when the user pauses or requests reduced motion.

The canvas is keyboard focusable: arrows turn/tilt the planet and Home resets the view. All icon-only controls have translated accessible labels. Below the desktop breakpoint, the scene occupies the viewport with no visible story text: a transparent project-glyph dock, tactile material tiles, orbital marks, pause/reset, and a citron project-launch button. Site navigation, legal links below the scene, and user-opened audio controls remain available. The audio launcher moves to the header area on this route to avoid the planet dock.

## Extending a world

Add its metadata to the registry, matching the catalog's English project name. Add its kind to `PlanetKind`, a static swatch class in the UI and CSS, and a model branch in `World`. Replace a concept branch with a detailed component when that project is ready for its own art pass. UI strings belong in both `messages/en.json` and `messages/de.json`.

Keep geometry and frame animation inside the dynamically imported canvas. Grass uses one instanced draw call and omits hidden blades rather than using zero-scale instances. DPR is capped at 1.25 on phones and 1.5 on larger views. Animation deltas are capped; held, paused, off-screen, hidden, and reduced-motion views use demand rendering. Release damping is frame-rate independent. Manual material choices stop automatic cycling.

## Local preview

Run `npm run build`, then `npm run start -- --hostname 127.0.0.1 --port 3001`. Open `/en` or `/de` on that server.

Run the six interaction regressions with `node --test scripts/turntable-motion.test.mjs` on Node 24 (or a Node version supporting direct TypeScript execution). These cover hold/drag/release, cancellation, pointer isolation, pitch limits, paused motion, frame-rate independence, and long-frame clamping. Browser checks supplement these tests; physical mobile hardware is not covered by viewport emulation.

Validation covers the production build and browser checks for project switching, all material choices, automatic cycling, rotation, reset, pause, and narrow layouts. The existing image-optimization lint warnings outside this feature remain. No deployment has been performed.
