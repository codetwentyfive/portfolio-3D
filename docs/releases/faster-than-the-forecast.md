# Faster Than the Forecast — publication and edit, 30 October 2026

## Editorial revision after reader feedback

Chingis found the first release slow and slightly AI-written, and requested substantial cuts plus persistent writing guidance. Main reading text now has 1,144 English words (from 2,400; 52% shorter) and 1,158 German words (from 2,461; 53% shorter). Counts include headings/captions and exclude contents, the context note, table, statistic cards and references.

The revised opening leads with the changed work. Removed the benchmark chronology, international labour-market tour, company code-volume anecdotes and repeated qualifications. Five relevant primary sources remain, with their necessary limits next to the claims. All three illustrations remain. The 11-row career table is now an optional native disclosure after the main article. Publication date remains 2026-10-30; this same-day edit sets dateModified to the same date.

`docs/writing-memory.md` records the requested voice and editing workflow; root `AGENTS.md` points future editorial tasks to it. `docs/ideas/it-changes-and-hacks.md` captures the next topic for nontechnical readers. No incidents or unverified claims were published as part of that idea.

The acceptance script now checks five citation/backlink pairs and keyboard access to the initially collapsed career table. The build, five SEO tests, local publication checker (20 pages/six article translations/22 cards) and both-language essay checker passed for this revision. Fresh mobile opening/ending screenshots were reviewed. Post-deployment results and the exact production identity are recorded in the project handoff; the original checks below describe the first release.

## Original publication

The author approved publishing the September essay on 30 October 2026. The English and German editions use `/blog/faster-than-the-forecast`, with a visible September-reflection note and the actual first-publication date, 2026-10-30. The existing KRZ profile release is the base; the separate rain prototype is not part of this release.

### Content and source checks

The original v5 draft and three AI-generated comic illustrations came from the older portfolio's `drafts/it-roles/`. The published MDX files are the maintained article sources. All 16 cited primary sources were checked for this release. Retained survey and benchmark figures keep their populations, dates and limitations; career mappings are the author's interpretation.

Corrections made before publication:

- METR: canonical January 2026 URL; 89-day estimate explicitly dated; the 12-hour horizon is the February–March snapshot reported in May, with a 5–61-hour interval. Clarified the 50% benchmark threshold.
- Anthropic: bibliography title “When AI builds itself,” published 4 June 2026; the body correctly describes its May code-volume report.
- Stanford: the August update's 19% relative gap is explicitly dated to June 2026. BLS developer growth remains 10% for 2025–2035, and the bibliography labels the page's last-updated date accurately.
- OpenAI: million-line total includes application code, infrastructure, tooling and documentation. Veracode: test pass rates, not a proportion of all generated code; date given as Spring 2026.
- Google: experience report, not a comparative study. Sonar: surveyed developers. METR follow-up: selection effects and unreliable time tracking are separate limitations.

All three illustrations retain their compositions, alt text and AI-generation credits. WebP assets preserve aspect ratios; the first image is the hero. Native contents, citations/backlinks, a scoped table and lazy inline figures work without JavaScript. Optional hero dimensions/captions retain older articles' defaults.

### Verification

- Production build, TypeScript/lint and five SEO contract tests passed. One pre-existing `HomeInfo.tsx` image lint warning remains.
- `BASE_URL=http://127.0.0.1:3105 npm run check:publication`: 20 indexable pages, six article translations, 22 social PNGs; canonical/hreflang/schema/image consistency, robots, sitemap, public text exports and missing-article 404s passed with JavaScript disabled.
- `BASE_URL=http://127.0.0.1:3105 node scripts/essay-check.mjs`: blog-to-article navigation, three loaded illustrations, 16 source entries, citation/backlink targets, 11 career rows, contents navigation and dates passed in both languages. No page overflow at 1440, 390 or 320 pixels, no browser runtime errors; small-screen table scrolls internally.
- Desktop and fresh mobile screenshots visually reviewed. Source conversion separately reviewed for German gender stars, paragraph retention, images, table and citations.
- Blog assets are included in the deployed OG route's file tracing. Each localized article is automatically included in the blog index, sitemap, reciprocal language metadata and public text exports.

Re-run the two browser checks against `https://www.chingis.dev` after the matching Git deployment is READY. Production commit/deployment evidence is recorded in the project handoff. These checks establish delivery and technical discoverability; search rankings and AI citations have not been measured. No recurring publishing schedule was created.
