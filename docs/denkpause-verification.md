# denk.pause verification — 24 September 2026

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
