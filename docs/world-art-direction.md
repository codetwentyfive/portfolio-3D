# Crafted project worlds — September 2026

## Visual direction

The project miniatures use dark stone, patinated teal, warm timber and small brass accents, with vegetation particular to each setting. Architectural silhouettes draw on the strong shapes and warm/cool contrasts of [Hades](https://www.supergiantgames.com/games/hades/) and the miniature environments of [Bastion](https://www.supergiantgames.com/games/bastion/). All new geometry is original. Subtle stepped borders, door carving and woven rug details suggest Mongolian craft without attaching large emblems to every building. The shop now centres on a peaceful steppe landscape; the portfolio retains its original OG island.

- **Shop:** a peaceful Mongolian steppe island with cute grazing sheep and a lamb, a small detailed ger, native grasses and rocky ground. The landscape and animals are the focus, with restrained woven and carved details on the ger. The explicit pastoral direction requested on September 17 supersedes the earlier atelier and brand-book preference against a ger-led scene.
- **Commerce:** pitched copper trade pavilion, stone pier bases, roof trusses and working conveyor.
- **Portfolio:** the original OG floating island is restored from `public/3d/island.glb`, with its existing v2 catalog preview.
- **Strange Seeds:** garden amphitheatre, drum kit and instruments framed by an open masonry arch; sunflowers, feather grass and shale replace the generic plants.
- **Potera:** mansard roof, radial window arches, pilasters, lamps and terracotta cypress planters. Branding belongs on the contractor's equipment.
- **Home lab:** the photo-informed room retains its layout and equipment, with carved cornice trim and a small woven diamond pattern in the rug. Its pothos and snake plants remain distinct from the outdoor vegetation.

## Logo correction

The original project artwork stays embedded without alteration. It now has comfortable margins and a physical backing; the service sign has a real enamel frame. Logo geometry is separated from its backing. In WebGL, only the official artwork uses isolated materials with alpha-to-coverage and anisotropic filtering; it neither casts nor receives shadows. This avoids backing-surface shadow bias being drawn across the letters. Only those cloned materials and textures are disposed on unmount; cached GLTF resources stay untouched.

The stone slab is inset from the edge courses to avoid coplanar faces and flickering. World centering derives from actual exported bounds, and inspection magnification is reduced to keep the taller roofs in frame.

## Layout cleanup

- The shop gives each sheep room to graze, keeps the ger entrance clear and groups grasses and rocks around open patches of pasture. Hooves and the ger base should meet the terrain, and the sheep's greeting must remain clear of neighbouring objects.
- Pavilion piers clear the conveyor rails, scanner shoes connect to the chassis, and the animated parcels stay fully on the belt. The spare bollards and duplicate roof seams are removed.
- The stage has one lighting rig, elevated rack toms, separate cymbal and microphone stands, a guitar cradle and cables routed to the sides. Sunflowers are clear of the masonry.
- The townhouse doorway replaces the conflicting lower window. Upper glazing follows the arch, while cart contents rest on their shelves.
- The room has supported electronics, ceramics and speakers, a keyboard clear of the console, forward-facing pothos vines and bundled rear wiring.

## Interaction

### Discovery and controls

The island is the focus. Desktop previous/next arrows overlay the scene edges without reserving canvas space. They hide below 1024px or in viewports no taller than 560px, where the compact lower navigation remains available. A discreet three-dot **Scene options** button reveals zoom, pause, reset and the current world's interactions. Shop finishes and stage instruments live in this same overlay. Opening or closing it never resizes the canvas or resets its view. The panel scrolls when space is limited and uses a viewport-bound overlay in short landscape layouts. Escape and the close button return focus to the launcher; clicking outside dismisses it.

Visitors can discover actions by clicking objects directly or use the keyboard-accessible controls. Arrow keys rotate a focused island, and Home resets its view. Mobile retains swipe navigation plus separate 44px previous/next buttons. Commerce runs a short dispatch, the original island turns, the courtyard window gets a wipe, and the room display wakes. Dragging, including a drag that returns to its starting point, does not activate click actions.

### Six sheep personalities

In the shop, tapping a sheep activates only that animal. With the island focused, keys **1–6** select the six personalities below. **Meet a sheep** / **Ein Schaf kennenlernen** steps through them one at a time. Landscape geometry blocks clicks on hidden sheep, and decorative reaction accents do not intercept clicks. All sheep reactions are silent.

| Key | Personality | Reaction |
| --- | --- | --- |
| 1 | Friendly | A slow head turn and one small heart. |
| 2 | Fluffy | A wool shimmy with tiny wool flecks; feet stay planted. |
| 3 | Playful lamb | Two gentle bounds with a grounded pause between them. |
| 4 | Content grazer | Small grazing nods and a few grass fragments. |
| 5 | Sleepy | A drowsy stir and a small drifting sleep mark. |
| 6 | Shy | A look left and right, then a small nod. |

Each sheep has an independent reaction clock in `components/scenes/planets/sheep-motion.ts`. Starting or replaying one reaction leaves the others running. Repeated lamb clicks let its current bounds finish before another starts, avoiding a midair snap to the ground. Head angles stay within the checked clearance envelope, and reactions return to the exact rest pose. Reduced motion keeps geometry and accents still and gives each sheep brief, stable tonal feedback through its material tint.

### Playable stage

The stage has synthesized percussion and guitar, plus a guest station for a handpan, xylophone or bell. Notes on guest instruments are individually clickable. One guest instrument occupies the station at a time, preserving clear spacing. Its selection and sound setting survive closing the options panel. Audio starts only on an explicit play action; mute stops active voices, and leaving the stage disposes its audio context. Reduced motion uses brief stable feedback. Opening scene options pauses idle motion; playing an instrument also holds the stage still without opening controls. That automatic hold applies only to the stage and clears when changing worlds, independently of the visitor's explicit pause setting.

## Rebuild

Blender 4.0.2 was used. From the repository root:

```sh
blender --background --factory-startup --python-exit-code 1 --python scripts/build-shop-steppe.py
blender --background --factory-startup --python-exit-code 1 --python scripts/build-project-worlds.py
blender --background --factory-startup --python-exit-code 1 --python scripts/render-world-previews.py
```

`world_art.py` contains the shared masonry, plant silhouettes, architectural additions and restrained vertex-color washes. Every build starts from deterministic geometry. The existing room generator keeps its embedded material maps and digital-rain display. The OG island remains a retained source asset and is not regenerated by the project-world builder.

`assets/world-versions.json` drives shop GLB URLs as well as the other worlds and all six catalog thumbnails. Shop v6 uses `public/3d/shop/steppe-v6.glb`, `components/scenes/planets/ShopSteppe.tsx` and `public/images/worlds/shop-v6.png`. The review page compares it with the retained `shop-v5.png` atelier preview. Previously published asset files are retained for cached clients.

## Checks

Use `node --test scripts/*.test.mjs`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Check the versioned steppe asset and sheep motion pivots, the four generated project worlds, original embedded logos, draw-call and triangle budgets, animation pivots and all six catalog previews. Keep generated project worlds below 4 MB and confirm sizes from the exported files.

Browser checks should cover all six sheep reactions through direct taps, keys 1–6 and the options button; overlapping reactions and repeated lamb clicks; drag suppression; reduced motion; and world navigation. Confirm that opening options leaves canvas dimensions unchanged, dismissal restores focus where appropriate, and guest instruments and audio still work after closing the panel. Check zoom/reset, short portrait and landscape layouts, and console errors. Retain the checks for both logo worlds. Blender catalog previews use their own lighting; the browser remains the source of truth for runtime appearance. `scripts/sheep-motion.test.mjs` covers independent clocks, replay behavior, head-angle bounds, distinct trajectories, grounded lamb landings and reduced motion.

Run `blender --background --factory-startup --python-exit-code 1 --python scripts/verify-world-layout.py` for selected pre-batching support and clearance checks. It does not export or modify assets.

### Historical local verification — September 15, 2026

These results cover the previous atelier release. The steppe replacement has its own verification below.

- 64 Node tests, TypeScript, lint and production build passed (with the existing `HomeInfo.tsx` image warning).
- Browser checks at 1440×1000, 390×844 and 844×390, including German and reduced motion.
- Actual canvas drum click creates a Web Audio voice; a drag returning to its start does not. Muted play creates no voice. Leaving the stage closes the context.
- Handpan, xylophone and bell selection, 3D drum hit targets, keyboard play and background occlusion were exercised. The phone controls leave a measured 6px gap below the canvas; landscape moves the controls beside it.
- Verification was performed against the local preview.

### Historical steppe asset verification — September 17, 2026

These results cover the initial steppe and greeting implementation, before the six personalities and discovery controls described above.

- All 64 Node tests, TypeScript, lint and the production build pass; the existing `HomeInfo.tsx` image warning remains. The asset checks passed again after the final roof-seam export.
- The self-contained GLB is 2.39 MB. Both the OG island and the steppe fit a maximum dimension of six scene units; the crag and tree give the steppe a slightly taller silhouette.
- Exported-mesh checks cover 72 head poses and all 24 hooves. Head clearance stays above 0.034 authored units, hoof contacts are within 0.0015 units of the triangulated ground, and neck contact stays connected without head/leg collisions.
- Desktop 1440×1000, phone 390×844 and landscape 844×390 checks pass, including English, German, keyboard greeting and reduced motion. No browser errors or horizontal overflow were found.
- Browser captures confirm flock greeting, individual sheep greeting, and no greeting after an out-and-back drag. Reduced motion holds a stable pose.
- Fine roof seams follow the full felt profile with straight interpolation and an offset above the surface. Their subtle ivory material skips self-shadowing to keep the small detail clean in WebGL.
- The current result is available in the local preview. No production deployment was performed for this revision.

### Discovery controls and sheep personalities — September 17, 2026

- All 71 Node tests, TypeScript, lint and the production build pass; the existing `HomeInfo.tsx` image warning remains.
- All six keyboard-triggered reactions were captured and visually reviewed. Motion tests cover independent clocks, exact rest poses, bounded head angles, two grounded lamb hops and stable reduced-motion feedback.
- Opening options preserves the canvas dimensions at 1440×1000, 390×844, 844×390, 390×600 and 1024×570, with no horizontal overflow. Mobile navigation retains accessible previous/next buttons and the swipe surface without a visible instruction block.
- Restored desktop scene arrows navigate in both directions and leave the 1136×721 canvas unchanged at 1440×1000. They hide in 390×844 portrait and 844×390 landscape; the lower 44px navigation buttons stay available. Canvas keyboard help updates when switching worlds.
- The production preview confirms handpan spawning and playback, Escape dismissal, retained instrument selection, and stage-only automatic pause clearing when switching back to the shop. No browser errors were reported.
- The final build was verified in the local preview before publishing the revision to the production branch.
