# Crafted project worlds — September 2026

## Visual direction

The project miniatures use dark stone, patinated teal, warm timber and small brass accents, with vegetation particular to each setting. Architectural silhouettes draw on the strong shapes and warm/cool contrasts of [Hades](https://www.supergiantgames.com/games/hades/) and the miniature environments of [Bastion](https://www.supergiantgames.com/games/bastion/). All new geometry is original. Subtle stepped borders, door carving and woven rug details suggest Mongolian craft without attaching large emblems to every building. The shop now centres on a peaceful steppe landscape; the portfolio retains its original OG island.

- **Shop:** a broad Mongolian steppe landscape with three sheep, a small ger and open stretches of rolling pasture. The ger and flock sit within the landscape instead of filling its footprint. Sparse grasses, rocky ridges and a winding stream create depth, with restrained woven and carved details on the ger. The explicit pastoral direction requested on September 17 supersedes the earlier atelier and brand-book preference against a ger-led scene.
- **Commerce:** pitched copper trade pavilion, stone pier bases, roof trusses and working conveyor.
- **Portfolio:** the original OG floating island is restored from `public/3d/island.glb`, with its existing v2 catalog preview.
- **Strange Seeds:** garden amphitheatre, drum kit and instruments framed by an open masonry arch; sunflowers, feather grass and shale replace the generic plants.
- **Potera:** a complete limestone and plaster townhouse in a broad tended courtyard, with a closed slate roof, side and rear windows, lavender beds, an ornamental tree and a bench. A compact supported cleaning station leaves the entry route open. Branding belongs on the contractor's equipment.
- **Home lab:** the photo-informed room retains its layout and equipment, with carved cornice trim and a small woven diamond pattern in the rug. Its pothos and snake plants remain distinct from the outdoor vegetation.

## Logo correction

The original project artwork stays embedded without alteration. It now has comfortable margins and a physical backing; the service sign has a real enamel frame. Logo geometry is separated from its backing. In WebGL, only the official artwork uses isolated materials with alpha-to-coverage and anisotropic filtering; it neither casts nor receives shadows. This avoids backing-surface shadow bias being drawn across the letters. Only those cloned materials and textures are disposed on unmount; cached GLTF resources stay untouched.

The stone slab is inset from the edge courses to avoid coplanar faces and flickering. World centering derives from actual exported bounds, and inspection magnification is reduced to keep the taller roofs in frame.

## Layout cleanup

- The shop uses open pasture between three sheep, the smaller ger and the water. Terrain contours carry the composition; grasses and stones gather in patches rather than forming a uniform carpet. Hooves and the ger base meet the terrain. The stream sits in a carved bed with grounded banks, restrained reflections and gentle surface motion.
- Pavilion piers clear the conveyor rails, scanner shoes connect to the chassis, and the animated parcels stay fully on the belt. The spare bollards and duplicate roof seams are removed.
- The stage has one lighting rig, elevated rack toms, separate cymbal and microphone stands, a guitar cradle and cables routed to the sides. Sunflowers are clear of the masonry.
- The full-depth townhouse has its own entrance and a framed picture window. Upper glazing fits its stone arches; cart wheels and supplies meet their supports. The parked squeegee rests in a cart-mounted socket with two retaining clips and rubber collars.
- The room has supported electronics, ceramics and speakers, a keyboard clear of the console, forward-facing pothos vines and bundled rear wiring.

## Interaction

### Discovery and controls

The island is the focus. Desktop previous/next arrows overlay the scene edges without reserving canvas space. They hide below 1024px or in viewports no taller than 560px, where the compact lower navigation remains available. A discreet three-dot **Scene options** button reveals zoom, pause, reset and the current world's interactions. Shop finishes and stage instruments live in this same overlay. Opening or closing it never resizes the canvas or resets its view. The panel scrolls when space is limited and uses a viewport-bound overlay in short landscape layouts. Escape and the close button return focus to the launcher; clicking outside dismisses it.

Visitors can discover actions by clicking objects directly or use the keyboard-accessible controls. Arrow keys rotate a focused island, and Home resets its view. Mobile retains swipe navigation plus separate 44px previous/next buttons. Commerce runs a short dispatch, the original island turns, the courtyard window gets a wipe, and the room display wakes. Dragging, including a drag that returns to its starting point, does not activate click actions.

### Three sheep with natural movement

In the shop, tapping a sheep activates only that animal. With the island focused, keys **1–3** select individual sheep. The hidden scene options also provide **Low**, **Middle** and **High** voice buttons. Landscape geometry blocks clicks on hidden sheep.

| Key | Sheep | Reaction |
| --- | --- | --- |
| 1 | Grazer | Chews in small pauses, slowly raises its head, listens with separate ear flicks, turns toward the visitor and returns to grazing. |
| 2 | Alert adult | A shoulder shake follows through its head, ears and tail while its hooves stay planted. |
| 3 | Lamb | Anticipates one small spring, tucks its legs, lands softly and settles with delayed ear movement. |

Movement comes from articulated body parts and coordinated weight shifts. Heads, jaws, ears, tails and legs use dedicated pivots. Each sheep has an independent reaction clock in `components/scenes/planets/sheep-motion.ts`, so interacting with one leaves the others running. Repeated clicks during an active response still sing, while the existing pose or jump completes without restarting. Motion returns to the authored rest pose and respects terrain clearance. Subtle breathing, grazing and ear movements run at different phases while ambient animation is enabled. Reduced motion keeps geometry still and uses brief, stable material feedback with redraws only at feedback start and end.

### Sheep choir

Every accepted tap advances one shared, original 16-note G-major pentatonic melody. The grazer sings in G2–E3, the adult in G3–E4 and the lamb in G4–E5. Selecting another sheep transposes the next note into its fixed register, so either a single sheep or any mixed order can complete the tune. Each voice uses distinct vocal formants, breath, vibrato and bleat envelopes. A small mouth movement follows the audible note, within the existing jaw clearance limits.

Web Audio is created and resumed only inside a direct click or key gesture. Notes have a 220 ms minimum spacing and a 450 ms queue ceiling; rejected taps do not skip melody notes. **Sound on/off** lives inside scene options and shares the scene sound setting with the stage. Muting or hiding the page cancels active and queued sound, and changing worlds disposes the audio context. Reduced motion and paused ambient movement still allow deliberate musical play. The separate music player keeps its own playback state.

### Playable stage

The stage has synthesized percussion and guitar, plus a guest station for a handpan, xylophone or bell. Notes on guest instruments are individually clickable. One guest instrument occupies the station at a time, preserving clear spacing. Its selection and sound setting survive closing the options panel. Audio starts only on an explicit play action; mute stops active voices, and leaving the stage disposes its audio context. Reduced motion uses brief stable feedback. Opening scene options pauses idle motion; playing an instrument also holds the stage still without opening controls. That automatic hold applies only to the stage and clears when changing worlds, independently of the visitor's explicit pause setting.

### Potera window cleaning

The picture window, cart and contractor placard are clickable. One modeled rubber-bladed squeegee makes an eased downward pass, removes the glass haze, briefly reveals a reflection and withdraws. The clean window remains clean until the next deliberate replay. Other parts of the landscape occlude these targets and do not trigger the action. The hidden **Clean a window** button provides keyboard access; reduced motion makes the window clean immediately. Hiding or leaving the scene clears transient geometry. Owned overlays and cloned glass materials are disposed without modifying loader-cached resources.

The spare broom/squeegee is physically supported on the cart: a lower socket carries its weight and two clips with rubber collars attach the handle to the cart frame. No loose tool stands in the walking route.

## Rebuild

Blender 4.0.2 was used. From the repository root:

```sh
blender --background --factory-startup --python-exit-code 1 --python scripts/build-shop-steppe.py
blender --background --factory-startup --python-exit-code 1 --python scripts/build-project-worlds.py
blender --background --factory-startup --python-exit-code 1 --python scripts/render-world-previews.py
```

`world_art.py` contains the shared masonry, plant silhouettes, architectural additions and restrained vertex-color washes. Every build starts from deterministic geometry. The existing room generator keeps its embedded material maps and digital-rain display. The OG island remains a retained source asset and is not regenerated by the project-world builder.

`assets/world-versions.json` drives shop GLB URLs as well as the other worlds and all six catalog thumbnails. Shop v7 uses `public/3d/shop/steppe-v7.glb`, `components/scenes/planets/ShopSteppe.tsx` and `public/images/worlds/shop-v7.png`. Previously published asset files are retained for cached clients.

## Checks

Use `node --test scripts/*.test.mjs`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Check the versioned steppe asset and sheep motion pivots, the four generated project worlds, original embedded logos, draw-call and triangle budgets, animation pivots and all six catalog previews. Keep generated project worlds below 4 MB and confirm sizes from the exported files.

The shop asset contract requires exactly three articulated sheep, visible geometry beneath every required joint, and a dedicated river surface with finite flow UVs. It also checks all twelve hoof contacts, every river vertex and each river triangle centroid against the exported terrain. These checks use the actual GLB triangles rather than only the generator's smooth height function.

Browser checks should cover all three sheep reactions through direct taps, keys 1–3 and the options button; overlapping reactions and repeat clicks; drag suppression; reduced motion; and world navigation. Check the river from the initial and rotated views for intersecting banks, detached highlights or exposed bed seams. Confirm that opening options leaves canvas dimensions unchanged, dismissal restores focus where appropriate, and guest instruments and audio still work after closing the panel. Check zoom/reset, short portrait and landscape layouts, and console errors. Retain the checks for both logo worlds. Blender catalog previews use their own lighting; the browser remains the source of truth for runtime appearance. `scripts/sheep-motion.test.mjs` covers independent clocks, replay behavior, bounded articulation, distinct trajectories, exact rest poses and reduced motion.

`scripts/sheep-audio.test.mjs` checks fixed voice ranges, the shared melody, bounded scheduling, source cleanup, failure recovery and mute/visibility cancellation during browser resume. Browser audio checks should also exercise repeated solo taps during an active reaction, switching voices, the hidden sound button, reduced motion and leaving the shop.

Run `blender --background --factory-startup --python-exit-code 1 --python scripts/verify-world-layout.py` for selected pre-batching support and clearance checks. It does not export or modify assets.

### Historical local verification — September 15, 2026

These results cover the previous atelier release. The steppe replacement has its own verification below.

- 64 Node tests, TypeScript, lint and production build passed (with the existing `HomeInfo.tsx` image warning).
- Browser checks at 1440×1000, 390×844 and 844×390, including German and reduced motion.
- Actual canvas drum click creates a Web Audio voice; a drag returning to its start does not. Muted play creates no voice. Leaving the stage closes the context.
- Handpan, xylophone and bell selection, 3D drum hit targets, keyboard play and background occlusion were exercised. The phone controls leave a measured 6px gap below the canvas; landscape moves the controls beside it.
- Verification was performed against the local preview.

### Historical steppe asset verification — September 17, 2026

These results cover the initial six-sheep steppe and greeting implementation, before the discovery controls and the broader v7 landscape.

- All 64 Node tests, TypeScript, lint and the production build pass; the existing `HomeInfo.tsx` image warning remains. The asset checks passed again after the final roof-seam export.
- The self-contained GLB is 2.39 MB. Both the OG island and the steppe fit a maximum dimension of six scene units; the crag and tree give the steppe a slightly taller silhouette.
- Exported-mesh checks cover 72 head poses and all 24 hooves. Head clearance stays above 0.034 authored units, hoof contacts are within 0.0015 units of the triangulated ground, and neck contact stays connected without head/leg collisions.
- Desktop 1440×1000, phone 390×844 and landscape 844×390 checks pass, including English, German, keyboard greeting and reduced motion. No browser errors or horizontal overflow were found.
- Browser captures confirm flock greeting, individual sheep greeting, and no greeting after an out-and-back drag. Reduced motion holds a stable pose.
- Fine roof seams follow the full felt profile with straight interpolation and an offset above the surface. Their subtle ivory material skips self-shadowing to keep the small detail clean in WebGL.
- The current result is available in the local preview. No production deployment was performed for this revision.

### Historical discovery controls and six sheep personalities — September 17, 2026

These results cover the v6 island, before the broader landscape and three-sheep articulation changes.

- All 71 Node tests, TypeScript, lint and the production build pass; the existing `HomeInfo.tsx` image warning remains.
- All six keyboard-triggered reactions were captured and visually reviewed. Motion tests cover independent clocks, exact rest poses, bounded head angles, two grounded lamb hops and stable reduced-motion feedback.
- Opening options preserves the canvas dimensions at 1440×1000, 390×844, 844×390, 390×600 and 1024×570, with no horizontal overflow. Mobile navigation retains accessible previous/next buttons and the swipe surface without a visible instruction block.
- Restored desktop scene arrows navigate in both directions and leave the 1136×721 canvas unchanged at 1440×1000. They hide in 390×844 portrait and 844×390 landscape; the lower 44px navigation buttons stay available. Canvas keyboard help updates when switching worlds.
- The production preview confirms handpan spawning and playback, Escape dismissal, retained instrument selection, and stage-only automatic pause clearing when switching back to the shop. No browser errors were reported.
- The final build was verified in the local preview before publishing the revision to the production branch.

### Broad landscape and three articulated sheep — September 17, 2026

Earlier test counts, clearance measurements and deployment statements above describe historical revisions, not this change.

- All 14 asset contract tests pass, including the three-sheep rig, river UVs, exported ground contacts and all six catalog previews.
- The current self-contained GLB is 1.52 MB, with 42,513 triangles and 74 material primitives. Its catalog preview is 720×520 and 271 KB.
- An independent audit applies all runtime joint transforms to 753 sampled poses. All 3,650,544 tested sheep vertices remain above the exported terrain apart from floating-point contact tolerance. Minimum head clearance, including ears and jaw, is 0.0353 authored units; the lamb's articulated feet remain clear throughout its spring and landing.
- All 75 tests, TypeScript and lint pass; the existing `HomeInfo.tsx` image warning remains.
- The browser shows the final landscape at 1440×1000, 390×844 and 844×390 without overflow or shader errors. Direct sheep clicking, keyboard reactions, material changes and mobile world navigation work. Two reduced-motion captures taken 900 ms apart are byte-identical, including the water.
- The shop camera sits closer and higher to show more of the terrain; framing for the other worlds remains unchanged. `SteppeWater.tsx` shades shallow banks and darker channel depth, with small flowing ripples that pause with the scene and with reduced motion. Cached GLTF resources remain unchanged.
- The production build passes. The local production preview on port 3001 renders the final model and animated river in the in-app browser. This revision has not been published.

### Three-voice sheep choir — September 17, 2026

- All 86 tests, TypeScript, lint and the production build pass; only the existing `HomeInfo.tsx` image warning remains.
- Browser Web Audio observation confirms repeated solo notes during an active animation, register changes through keys and the hidden controls, direct sheep tapping, silent drags, mute, reduced-motion audio and a closed context after leaving the island.
- Opening the choir controls preserves the 1136×721 desktop canvas and the 350×562 phone canvas. English and German controls render without browser errors or horizontal overflow.
- Offline rendering at the fastest permitted note spacing produces no clipping: the three voice RMS levels are 0.063, 0.064 and 0.066, with a mixed-voice peak of 0.359. The melody and timbres are original synthesized audio; no sound files or new dependencies are downloaded.
- The final production build is served in the local preview on port 3001. This revision has not been published.

### Potera courtyard — September 18, 2026

- Potera v6 replaces the shallow facade with a full-depth townhouse, closed hipped roof, finished side and rear elevations, and a broad garden courtyard. Lavender, clipped shrubs and one ornamental tree give it distinct planting. The entrance, bench and cleaning station have separate spaces.
- The self-contained GLB is 2,104,796 bytes, 41,348 triangles and 29 material primitives. Interactive equipment and glazing retain separate parents; Potera's draw-call budget is 32. The original logo remains embedded unchanged in two placements sharing one material. The versioned catalog image is 720×520, under 500 KB.
- Authored geometry checks pass for roof coverage, side/rear elevations, clear entrance approach, fitted arches and picture window, wheel/bottle/bench support, and the parked tool's socket and two cart clips. The moving squeegee clears its jambs and projecting sill across 1,147,360 sampled triangle checks.
- All 90 tests, TypeScript, lint and the production build pass, with the existing `HomeInfo.tsx` image warning. The 18 asset/motion tests also pass against the final export.
- Browser checks cover direct cleaning, its clean finish, hidden controls, English/German text, reduced motion and responsive framing at 1440×1000, 390×844 and 844×390. No browser errors or horizontal overflow were detected. Potera is normalized to six scene units, with its own closer camera; the shop and other worlds retain their framing.
- The final model is available in the local production preview on port 3001. No deployment was performed.
