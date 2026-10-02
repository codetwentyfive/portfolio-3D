# denk.pause verification — 2 October 2026

Local production preview on branch `codex/denkpause-crafted-world`, based on
`b6f7ce5`. Checkout: `~/Documents/ChatGPT/Portfolio/chingis-dev`. Not deployed.

## Current checks

- `npm run build` passed, including TypeScript, lint and 24 generated pages.
  The existing `next/no-img-element` warning in `components/HomeInfo.tsx` remains.
- All **93** tests in `node --test scripts/*.test.mjs` passed. Updated asset checks
  cover byte-exact source artwork, budgets, native quantization, aligned strides,
  finite dequantized bounds and manifest-selected posters.
- Targeted ESLint passed for the viewer and changed Three.js components.
- A second deterministic builder run produced the identical GLB SHA-256:
  `c9994c66fa04647ad3d134c06238b7a6873368dd1245c50aa5f049dcecc4a739`.
- The expanded production browser suite passed EN/DE HTML and layout checks at
  1440×900, 1280×800, 390×844, 320×740 and 844×390. No horizontal overflow.
  The case-study scene renders in both locales; rotation changes its pixels and
  zoom/reset controls work. Canonicals remain correct.
- All seven worlds rendered. URL selection, history, locale switching, rapid
  selection and options focus still work. Normal browsing produced no page errors.
- Home and case-study poster fallbacks passed with reduced motion, Save-Data,
  unavailable WebGL, failed assets and disabled JavaScript. Explicit enhancement
  works under reduced motion and Save-Data. Case-study retry succeeds after a
  blocked GLB is made available again. 200% text remains usable and scrollable.
- Inspected the actual desktop and mobile renders. Corrected screen depth/UVs,
  framing, plaque suspension and the reflective pool. Other world assets unchanged.

## Current asset and loading observations

- GLB: **4,089,672 bytes**, **22 material batches**, **63,732 triangles**.
  Two original product PNGs plus two deterministic grain maps are embedded.
  Native glTF quantization needs no remote decoder or external texture download.
- WebP poster: **61,398 bytes**, 1200×760, captured from the real browser scene.
- Cold synthetic phone: Chrome, 390×844, DPR 2, touch/mobile emulation, cache off,
  150 ms latency, 200,000 bytes/s down, 93,750 bytes/s up, 4× CPU slowdown.
  First contentful paint **932 ms**; poster decoded **1,897 ms**; interactive
  scene observed ready at **11,646 ms**. Project copy and CTA were available.
- GLB transfer including response overhead: **1,238,902 bytes**, request from
  **4,942 ms** to **11,298 ms**. The richer model costs more to load than v1;
  the poster is available independently and the scene remains a deferred enhancement.
- These are one-run local synthetic measurements, not field or physical-phone
  measurements. Physical iOS Safari remains unverified.

Production preview: `npm run start -- --hostname 127.0.0.1 --port 3101`.
Run browser checks with `PREVIEW_URL=http://127.0.0.1:3101
CHECK_OUTPUT=/tmp/denkpause-v2-check node scripts/denkpause-browser-check.mjs`.
Screenshots and metrics are in `/tmp/denkpause-v2-check/`.

---

# Historical v1 verification — 24 September 2026

Local production build on branch `codex/refine-project-worlds`. Not deployed.

## Completed checks

- `npm run build`: passed, including type checks and lint. One pre-existing
  `next/no-img-element` warning remains in `components/HomeInfo.tsx`.
- `npx tsc --noEmit`: passed. Targeted ESLint on changed components passed.
- `node --experimental-strip-types --test scripts/*.test.mjs`: 93 tests passed.
  Added seven-world URL/default checks, immediate selection while loading,
  stale readiness protection, compact courtyard budgets and byte-for-byte
  checks of the embedded welcome screen / official mark.
- `node scripts/denkpause-browser-check.mjs`: production browser acceptance
  covers EN/DE initial HTML, explicit/invalid world URLs, back/forward,
  language changes, rapid selection, all seven rendered worlds, options focus,
  case-study direct loads/canonicals, and no-JS / no-WebGL / failed-asset /
  reduced-motion / Save-Data fallbacks.
- Layouts checked at 1440×900, 1280×800, 390×844, 320×740 and 844×390 in both
  languages. Mobile title, ownership and CTA precede the island. No horizontal
  overflow; desktop CTA remains above the fold. Enlarged text uses natural
  scrolling, including wrapping footer links. Mobile navigation scrolls away instead of
  covering enlarged text. Navigation keys are scoped to
  focused scene/pager controls; the existing vertical-swipe guard is tested.
- Poster captured from the actual rendered world. Visual inspection corrected
  screen UV orientation, the curved wall, phone support and sign placement.
  All prior GLBs are unchanged. The new GLB has 11 material batches and no
  remote texture dependencies. The initial waterfall requests only denk.pause;
  conditional next-world prefetch starts after first-scene readiness.

## Asset and cold-load measurements

- WebP poster: **30,152 bytes** (1200×760).
- Self-contained GLB, including screen and mark: **220,716 bytes**.
- Recorded compressed GLB transfer: **71,536 bytes**, including response overhead.
- Cold production run in Chrome: 390×844, DPR 2, mobile/touch emulation,
  cache disabled, 150 ms latency, 200,000 bytes/s download, 93,750 bytes/s upload,
  4× CPU slowdown. First contentful paint: **912 ms**; poster decoded:
  **1,069 ms**; interactive scene observed ready: **5,454 ms**.
- In this run the selected GLB request began at 4,797 ms and completed at
  5,316 ms. The copy and CTA were usable while the enhancement loaded.
- These are one-run local synthetic observations, not field performance or
  physical-device measurements. Real iOS Safari / physical-phone verification
  remains useful before publication; no hardware test is claimed.

Browser screenshots and the full resource timing report are generated under
`/tmp/denkpause-portfolio-check/` by default (override `CHECK_OUTPUT`). No private
career reports or internal infrastructure identifiers are included in outputs.
