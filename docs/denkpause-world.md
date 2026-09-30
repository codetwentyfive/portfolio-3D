# denk.pause presentation

Implemented 24 September 2026 in the Next.js gallery. `denkpause` is the stable
first registry identity; the existing six worlds retain their IDs and assets.
Plain and invalid URLs select it. Explicit `?world=` values are server-rendered;
selection pushes history, popstate restores selection, and language switching
preserves the query. No persisted last-world preference overrides a plain visit.

## Content and loading

The HTML includes the role H1, selected project H2, sole stack ownership, dated
stage, case-study link and poster. One shared caption avoids duplicate desktop /
mobile headings. Mobile places copy and CTA before the scene and status after it.
Natural scrolling takes precedence over fitting short viewports.

Canvas is a deferred client enhancement. Only the selected world's GLB loads at
startup; its geometry and texture commit must render before the poster is covered.
Readiness is scoped to the selection. Model errors, context loss and a 12-second
load timeout keep the poster and links usable, with a local retry. Navigation
never waits on assets. Reduced motion, Save-Data and 2G connections start static.
A deliberate enhancement button remains available. The courtyard stays still;
its demand render loop wakes for explicit drag, zoom or reset. Other worlds retain
their interactions. Sound starts muted. A low-priority next-world prefetch waits
five seconds after readiness, and only runs on visible, non-reduced-motion scenes
with a reported 4G connection, at least 5 Mbps and no Save-Data.

## Original art and provenance

- `scripts/build-denkpause-world.mjs` deterministically authors the limestone
  island, curved mineral wall, sloped pavilion roof, supported phone and panels,
  reading bench, stepping stones and single airy tree using Three.js geometry.
  Geometry is merged into 11 material batches. No unrelated art is regenerated.
- `public/images/denkpause/welcome.png`: genuine untouched empty welcome state
  captured from `https://web.denkpause.app/` at 390 × 844 on 24 September 2026.
  No account, conversation, fictional testimonial or user data is present.
- `public/images/denkpause/mark.png`: rasterized directly from the official
  `design/system/assets/denkpause-wortbildmarke.svg` in the denk.pause repository,
  owned by beWirken / design by Florian. Original colours retained. Not redrawn.
- Scene materials use the brief's proposed stone/mint/lilac/timber swatches;
  these are scene art direction, not claimed official brand tokens.
- The original pixels of both PNGs are embedded into the GLB and checked by tests.
- `scripts/render-denkpause-poster.mjs` captures the actual WebGL camera, lighting
  and scene at 1200 × 760, hides surrounding HTML, and encodes a WebP poster.
  It requires a local server and Chrome. Override its URL with `PREVIEW_URL`.

Rebuild with `node scripts/build-denkpause-world.mjs`, start the site, then run
`node scripts/render-denkpause-poster.mjs`. Increment the manifest and matching
filenames for any asset revisions after publication (immutable cache headers).
The optional two-state phone interaction was omitted: the display is a faithful,
static welcome screen and navigation/CTAs do not depend on the canvas.

## Public narrative

Both `/en/projects/denkpause` and `/de/projects/denkpause` include product purpose,
sole stack selection/planning/implementation, architecture flow, three decisions,
delivered results, applied AI engineering and contact.
Stage and 67 local policy checks are explicitly dated to the September review.
Following the owner’s 24 September copy revision, public copy omits teammate
names and credits pending consent, and focuses on demonstrated contributions.
Uncompleted evaluation work and production cutover are not presented as achievements. Public app
availability was checked on 24 September; TestFlight remains the dated report's
status, not a newly audited distribution claim. No private report, commit inventory,
internal infrastructure IDs or user records were copied into public assets.

## Verification

See `docs/denkpause-verification.md` for recorded checks and measurements.
The browser suite is `node scripts/denkpause-browser-check.mjs`; use
`PREVIEW_URL` and `CHECK_OUTPUT` to select server and screenshot/report directory.
