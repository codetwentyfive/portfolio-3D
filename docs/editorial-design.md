# Editorial design system

> Records the earlier typography and shared-page pass. [Studio archive](studio-archive.md) describes the current homepage, project catalog, readable desktop navigation, calmer headings, and replacement 3D environments. Verification below applies to that earlier pass unless repeated in the current document.

## Direction

Cool stone, charcoal, rust, and restrained olive replace the previous gradient-led interface. Following feedback that the first fashion pass was too delicate, Archivo's variable width now pairs with heavyweight Barlow Condensed: upright condensed headings, wider sans accents, mismatched navigation initials, strong rules, and numbered editorial entries. Flower-like asterisks and display italics are removed in favor of slashes, registration bars, and monospace indexing. Existing copy, multilingual routes, music, 3D worlds, and project links are preserved.

The initial research drew on [Canva's 2026 design research](https://www.canva.com/newsroom/news/design-trends-2026/). Editorial structure, pared-back palettes, and intentional imperfection remain; the serif direction was superseded by the user's preference for a more grounded, industrial editorial identity. This is a creative interpretation, not a verified demographic claim about Gen Z preferences.

## Implementation

- `app/[locale]/layout.tsx` self-hosts Archivo and Barlow Condensed through `next/font`. Archivo includes the width axis; Barlow loads upright 500/600/700 weights. The earlier Bodoni font and its custom fallback setup are removed.
- `app/globals.css` holds shared tokens, typography, navigation, glass, journal, and planet-control styles. `tailwind.config.js` maps legacy font and color aliases into the new system. Application/component CSS contains no gradient backgrounds or gradient text.
- `components/Navbar.tsx` expands compact initials on hover, keyboard focus, and the active route. Mobile disclosure expands all labels with staggered width transitions. Escape restores focus to the toggle; outside clicks and route changes dismiss the menu. Full accessible names remain available when visual labels are abbreviated.
- The journal and articles use ruled layouts instead of cards. Projects, services, biography, contact, legal panels, and footer share the same visual language. The biography uses a semantic experience list instead of the vertical-timeline component.
- Existing planet rotation and visual-only mobile controls are preserved. Their backdrop is now flat stone; the project dock and turntable controls use the shared glass treatment.

## Transparent glass

`components/GlassFilters.tsx` supplies an original SVG turbulence/displacement lens. `.refractive-glass` has only 3.5% stone tint, a thin rim, and inset edge highlights, without an outer soft shadow. Separate background-only pseudo-elements apply the filter, leaving foreground labels sharp. Desktop uses subtle diffusion; mobile navigation uses 14px blur to prevent underlying headings from competing with navigation labels.

[MDN's backdrop-filter documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) describes the background-filtering mechanism. SVG backdrop refraction has browser limitations, including [WebKit issue 245510](https://bugs.webkit.org/show_bug.cgi?id=245510). Unsupported browsers retain the prefixed/standard CSS diffusion fallback. Do not replace this with an opaque white panel or claim uniform physical refraction across browsers.

Reduced-motion preferences disable decorative transitions. Forced-colors mode replaces glass with system colors. Collapsed music controls use visibility rather than opacity alone so hidden buttons do not remain keyboard-accessible.

## Verification

The grounded type refinement was additionally checked on About, journal, navigation, and the home scene at 1280px and 320px, including German text and keyboard expansion. No overflow or console errors were observed in those checks. Other route checks below describe the preceding editorial pass.

- Production build passes on Next 14.2.35; TypeScript and lint run as part of the build. Existing project/HomeInfo image-optimization warnings and the stale Browserslist notice remain.
- All six turntable-motion regressions pass.
- Chromium visual checks at 1280px, 390px, and 320px cover journal, article, biography, services, projects, contact, navigation, and home. German narrow-screen overflow from a long job title was reproduced and fixed using minimum-width and word-breaking constraints.
- Keyboard tab expansion and Escape dismissal work. Glass distortion/diffusion was visually checked over text and moving 3D content. Project switching and dragging still work. Checked browser error logs were empty.
- Physical touch hardware, Safari SVG refraction, contact submission, and actual third-party music playback were not tested in this design pass. No production deployment or commit was performed.

Local preview: build, then run `npm run start -- --hostname 127.0.0.1 --port 3001`; open `/en/blog` or `/en`.
