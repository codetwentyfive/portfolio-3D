# Studio archive

Current local design direction, September 5, 2026. Supersedes the concept-world and decorative-control portions of `project-worlds.md` and `editorial-design.md`. Not deployed.

## Direction

The work is represented by miniature working environments, not generic sculptures on interchangeable planets. One large scene, a readable project index, and a single grounded caption replace overlapping slogans, decorative orbit marks, and repeated controls. Cool stone, charcoal, rust, clear glass, and restrained typography carry forward the personal editorial identity without introducing gradients. Existing biography, journal, music, services, and legal content remain.

Desktop navigation shows full words; variable-width movement remains a small interaction rather than a reading obstacle. Mobile keeps the home scene visual-only, with labeled-for-assistive-technology glyphs and controls. The conventional project catalog remains available for visitors who prefer reading to manipulating a model.

The mobile world marks share a 24-unit drawing grid, 1.5-unit stroke and balanced margins. The payments mark is a single card, without competing transfer arrows. The other silhouettes omit tiny ornament; inactive marks use slate-500 for clearer small-screen contrast. Button labels and selected-state indicators remain independent of the decorative SVGs.

[Bruno Simon's portfolio](https://bruno-simon.com/) was an interaction reference for an authored 3D environment. These four models are original Blender geometry, not copied assets or representations of the projects' actual premises.

## Environments

| World | Visual narrative | Local motion |
| --- | --- | --- |
| Shop | Existing ger, leather craftsman, sheep, pasture | Existing character and ger treatments |
| Payments | Dispatch depot, canopy, shutter, scanner, rollers, terminal, labeled parcels | Three parcels travel along the belt |
| Original portfolio | Retained original island, with corrected runtime lighting | Shared turntable |
| Strange Seeds | Timber stage, drum kit, guitar, amps, microphone stands, lighting, cables | Restrained cymbal motion |
| Potera | Townhouse courtyard, paving, ladder, cleaning cart and equipment | Shared turntable |
| Home lab | Cutaway room, server rack, CRT, keyboard, recorder, desk, chair, cables | Cooling fans and recorder reels |

The four replacement models total about 6.74 MB uncompressed. Each is loaded only when selected, then cached. This is more geometry than the primitive placeholders, not a claim of lower total asset bandwidth. Static geometry is batched into 14-23 material groups per world; named pivots retain independent motion. These are detailed browser-scale miniatures, not film-production assets.

## Implementation

- `HomeScene.tsx`: project index, caption, selected-world query, visibility handling, controls and reduced-motion behavior.
- `PlanetCanvas.tsx`: shared lighting and routing to shop, original island or `ProjectDiorama`.
- `ProjectDiorama.tsx`: local GLB loading, instance-owned transform hierarchies, loader-owned geometry/materials and secondary animations.
- `WorldTurntable.tsx`: one rotation parent for the complete environment, pointer capture, hold/drag/release, keyboard arrows/Home and responsive camera fit.
- `MobileWorldHUD.tsx`: project glyphs, inspection zoom, pause/reset, project launch and a disclosed material tray only for the ger.
- `planet-data.ts`: kinds and lookup against the existing project catalog. Actual project details remain the source of truth.
- `app/[locale]/projects/page.tsx`: server-rendered catalog with real model renders, inspect links, original technical notes and available external/code links.
- `messages/en.json` and `messages/de.json`: matching archive descriptions, project disciplines and accessible labels.

`?world=shop|payments|portfolio|seeds|potera|assistant` opens a particular scene. Selection replaces the URL without adding a history entry for every glyph click. Reloads, browser history and locale switching preserve valid selection. The Reset button restores both the inspection zoom and turntable orientation. Keyboard Home resets orientation.

The complete environment, including its base, remains under one transform. Pointer hold pauses it, drag changes orientation, and release returns to a slower automatic spin. Paused, held, reduced-motion, off-screen and hidden scenes retain demand rendering. DPR stays capped at 1.25 on phones and 1.5 on larger displays. No new application dependencies were introduced.

## Regenerate Assets

From the repository root with Blender 4.0:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 4.0/blender.exe' --background --factory-startup --python scripts/build-project-worlds.py
& 'C:/Program Files/Blender Foundation/Blender 4.0/blender.exe' --background --factory-startup --python scripts/render-world-previews.py
```

GLBs are in `public/3d/worlds/*-v2.glb`. Six 720 x 520 transparent previews are in `public/images/worlds/*-v2.png`; Next Image serves responsive optimized versions. The shop thumbnail assembles the actual shop assets on a simplified base, not the full runtime grass field. Preview lighting is rendered in Blender, so it is not an exact screenshot of the WebGL scene.

When changing exported models or previews, version their filenames and update loaders, catalog paths, render scripts and asset tests together. The asset headers are long-lived; overwriting a published URL can leave stale models in visitors' caches. Do not remove or mutate loader-owned buffers when unmounting an instance.

## Verification

```powershell
npm run build
node --test scripts/turntable-motion.test.mjs scripts/project-assets.test.mjs
npm run start -- --hostname 127.0.0.1 --port 3001
```

The production build and all 12 tests pass. Tests cover motion math, pointer lifecycle, asset budgets, finite model bounds, animation pivots, preview dimensions and locale-key parity. Existing `HomeInfo.tsx` image lint and stale Browserslist notices remain.

Chromium checks at desktop, 390px and 320px cover all replacement scenes, project switching, dragging, pause, inspection/reset, material selection, navigation, the catalog, project notes, deep links, locale continuity and reloads. Checked console error logs were empty. These are viewport tests, not physical-touch, low-end-GPU or Safari validation. Contact submission and third-party music playback were not tested in this pass. No commit or deployment was performed.

## Development Server CSP Fix (September 6)

For the subsequent music-control redesign and actual SoundCloud verification, see [Editorial music player](music-player.md). That pass also reran the production build and all 24 combined audio, CSP, motion and asset tests successfully.

If `npm run dev` shows the page shell but no 3D or working controls, check the browser console for a CSP `EvalError`. The original production-only policy also ran in development and blocked Next's React Refresh runtime before hydration. The GLB files themselves were present and served successfully.

`next.config.mjs` now allows JavaScript evaluation only when `NODE_ENV` is exactly `development`, as required by [Next.js development tooling](https://nextjs.org/docs/app/guides/content-security-policy#development-vs-production-considerations). Development also omits forced HTTPS upgrading on local HTTP. Production retains its existing policy, including blocked JavaScript eval and HTTPS upgrading; no asset hosts or other permissions were added.

Run `npm run dev` and open `http://localhost:3000/en`. Restart the server and reload the page after changing response headers; Fast Refresh alone cannot replace the current document's policy. Do not run `next build` and `next dev` concurrently against the same `.next` directory.

`node --test scripts/security-headers.test.mjs scripts/turntable-motion.test.mjs scripts/project-assets.test.mjs` passes all 15 tests. The new tests load the actual Next config in isolated environments and verify that only explicit development gets the exceptions. Type checking and lint pass with the existing HomeInfo image warning. The ger, depot and home lab were checked visually in the actual development server on port 3000; no new CSP errors appeared after reload. The production build was not rerun for this configuration-only follow-up.
