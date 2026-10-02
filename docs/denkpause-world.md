# denk.pause presentation

`denkpause` is the first world in the Next.js gallery. The original courtyard
shipped locally on 24 September 2026; the 2 October revision replaces it with
**The Quiet Garden**, a more detailed architectural miniature. The current GLB
and poster versions come from `assets/world-versions.json`. The other six worlds
retain their identities and assets.

Plain and invalid URLs select denk.pause. Explicit `?world=` values are rendered
on the server; selection pushes history, popstate restores it, and language
switching preserves the query. A plain visit is not overridden by a saved world.

## Content and loading

Initial HTML includes the role H1, selected project H2, product description,
ongoing-development status, case-study link and poster. One caption serves both
desktop and mobile. Mobile places copy and CTA before the scene and status after
it. Short viewports can scroll naturally.

Canvas is a deferred enhancement. Only the selected GLB loads at startup, and its
geometry and textures must render before the poster is covered. Readiness is
scoped to the selection. Model errors, context loss and a 12-second timeout keep
the poster and links usable, with a local retry. Navigation never waits on assets.
Reduced motion, Save-Data and 2G connections start static, with an explicit button
to load the scene. The garden stays still until drag, zoom or reset; its demand
render loop does not animate continuously. Other worlds keep their interactions.
Sound starts muted. Next-world prefetch waits five seconds after readiness and
requires a visible scene, no reduced motion or Save-Data, reported 4G and at least
5 Mbps.

The case-study page also uses the current poster and lazy-loads the shared scene
near the viewport, with explicit rotate, reset and zoom controls. Reduced-motion,
Save-Data and slow connections retain the poster until deliberately enabled.
Its product text and app link remain ordinary HTML.

## The Quiet Garden

`scripts/build-denkpause-world.mjs` deterministically authors the complete scene:

- A circular limestone terrace with individual radial coping stones, dressed
  foundation courses, bronze reveals, separate paving slabs and entry steps.
- Twin carved travertine portals with true openings, bevelled edges and radial
  joints, a cedar ribbed vault, rear timber screen and reading ledge.
- An inset reflecting pool with stone coping, sparse ripples and lily leaves.
- A supported phone with a rounded shell, metal perimeter, side controls,
  speaker ports and the genuine app welcome screen. The official mark appears
  on an inset enamel plaque.
- A curved slatted bench, linen cushion, side table, layered book and ceramic cup.
- A sculptural olive tree with tapered curved branches, fine twigs, individual
  leaves, root flares and a stone planter; grasses, lavender, pebbles and lanterns
  complete the garden.

Geometry is merged by material. Positions use a shared signed 16-bit grid with
1/8192 node scale; normalized vertex colours add subtle material variation. The
GLB declares `KHR_mesh_quantization` as required. It needs no remote model,
external texture or separate compression decoder. Two deterministic 256 × 256
maps add mineral pores and timber grain alongside the two original product images.
The intentional budgets are at most 4.5 MB, at most 24 material batches, fewer
than 100,000 triangles and exactly four embedded PNGs.

Denkpause has dedicated warm key and cool fill lighting, a generated environment
for reflections, soft cast shadows and a single-frame contact shadow. Water uses
a clear-coated physical material in the self-contained export; the website replaces
that surface with a 256px planar reflection, updated only on requested scene frames.
The phone screen and mark use anisotropic
filtering and do not receive biased shadows from their backing. Camera framing
adapts to viewport width; pixel density is capped for the interactive scene.

## Original artwork and provenance

- `public/images/denkpause/welcome.png` is the untouched empty welcome state
  captured from `https://web.denkpause.app/` at 390 × 844 on 24 September 2026.
  It contains no account, conversation, fictional testimonial or user data.
- `public/images/denkpause/mark.png` was rasterized from the official
  `design/system/assets/denkpause-wortbildmarke.svg` in the denk.pause repository.
  Original colours are retained. The mark is not redrawn.
- Both source PNGs are embedded unchanged; asset tests compare the embedded bytes
  to those files. The stone and timber maps are authored by the deterministic
  builder. Scene colours are art direction, not claimed official brand tokens.
- The earlier v1 GLB and poster remain as historical assets. That scene used a
  simple limestone island, mineral wall, sloped timber pavilion, bench and airy
  tree in 11 material batches. The v4 manifest selects the replacement garden.

`scripts/render-denkpause-poster.mjs` captures the actual WebGL scene with its
runtime camera and lighting at 1200 × 760, hides surrounding HTML and encodes a
WebP. It requires a local server and Chrome; `PREVIEW_URL` overrides the server.
Rebuild with `node scripts/build-denkpause-world.mjs`, then start the site and run
`node scripts/render-denkpause-poster.mjs`. Increment the manifest and matching
filenames for revisions after publication because asset cache headers are
immutable. The phone remains a faithful static welcome screen; CTAs do not depend
on interacting with it.

## Public narrative

Both locales describe an ongoing engagement since February 2026. Chingis
continues to develop denk.pause as an external developer and advises on its
architecture, application structure and development approach. The homepage and
project catalogue identify ongoing external development and technical consulting;
the case study covers product purpose, technical scope, architecture flow, three
engineering decisions, delivered work and continuing development.

Public copy is restrained and product-first. It omits teammate names and credits
pending consent, repeated claims of sole ownership, private infrastructure details
and unmeasured outcomes. The September soft-launch milestone and 67 local policy
checks remain explicitly dated; continued development is stated separately.
The 2 October copy update does not assert a new audit of app availability or
release status. No private report, commit inventory or user records are published.

## Verification

`node --test scripts/project-assets.test.mjs` checks GLB structure, material and
triangle budgets, embedded original artwork and grain maps, declared quantization,
absence of external dependencies or decoders, and finite scene bounds after
applying node transforms. It also resolves the current poster through the manifest.

See `docs/denkpause-verification.md` for recorded checks and measurements.
The browser suite is `node scripts/denkpause-browser-check.mjs`; use `PREVIEW_URL`
and `CHECK_OUTPUT` to select the server and screenshot/report directory.

## Planter clearance correction — 2 October 2026

The v2 planter extended through the curved wall when viewed from behind. V3
reduces the stone radius to 0.54 and moves the bed from (1.11, -1.28) to
(0.85, -1.23). A smooth deformation reanchors the lower trunk and leaves the
canopy in its original position, clear of the portal. Soil and pebble scattering
fit the smaller bed. The builder checks every transformed planter/root/pebble
vertex against the wall's beveled inner radius, with a 0.02-unit margin.
The matching GLB and browser-rendered poster have new v3 URLs for cache safety.

## Whole-scene clearance and support correction — v4

A second user review identified wall planting and a screen podium crossing the
pool edge. V4 replaces eight loose plant clusters with three shallow planting
bowls, each with bounded soil/foliage. It moves the complete phone assembly onto
a solid dry-deck podium, moves the right lantern away from the pool, separates
coping corner joints, and adds continuous bench rails and transverse bearers.
Foundations, table and reading-ledge supports reach the underlying deck even
where paving slabs end. The independent canopy audit found no portal penetration.

The generator checks transformed plant geometry against nearby solid-part bounds
and the curved-wall envelope, foliage against soil radii, planter roots against
the wall, and support bottoms against deck height. Intended stacked construction
joints and roots entering soil remain normal assembled geometry. Eight browser
angles were independently inspected; no visible clipping remained.

V4 assets: GLB 4,065,264 bytes, 22 material batches, 64,074 triangles; matching
WebP 60,156 bytes, 1200×760. Versioned filenames update cached clients cleanly.
