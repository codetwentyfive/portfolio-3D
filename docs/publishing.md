# Publishing pages and articles

The site has one shared publishing contract. Keep visible content, metadata, language links, structured data, social previews and machine-readable exports in agreement.

## Articles

Publish MDX under `content/blog/<slug>.<en|de>.mdx`. Files in `content/drafts` are not public. Each published translation needs:

```yaml
title: "A specific, useful title"
description: "A concise description of what the reader will learn."
date: "2026-10-02"
dateModified: "2026-10-02"
image: "/images/worlds/representative-artwork.png"
imageAlt: "An accurate description that identifies illustrations as illustrations."
tags: ["Relevant topic"]
```

Keep the original publication date when revising an article. Set `dateModified` only after a substantive edit and explain material changes in the article. Use original experience, concrete examples, short sections and primary sources for technical claims. Attribute the author's actual role; do not invent clients, outcomes, privacy guarantees or performance results.

The build validates required fields and real images. Article pages automatically add visible authorship, publication/update dates, canonical URLs, real translation links, BlogPosting and breadcrumb data, and generated social images. Missing translations redirect to a real version and are excluded from hreflang and sitemap claims.

## Pages and projects

Register page metadata in `seo/config.ts`, then use `buildPageMetadata` and shared structured-data helpers on the route. Keep important descriptions in rendered HTML so the 3D canvas is an enhancement. Add a representative local `image` when the page benefits from it. Generated `/og/<locale>/<path>` cards, sitemap and public text exports derive from the registry; legacy redirect-only pages are excluded from the sitemap.

The production canonical host is `https://www.chingis.dev`. The existing cross-site Person identifier `https://chingis.dev/#person` intentionally remains stable. Version immutable 3D asset filenames whenever model bytes change.

## Release checks

- `npm run build` runs the SEO contract tests before compiling.
- `node --test scripts/*.test.mjs` checks the existing runtime and model contracts too.
- Start the production build, then run `BASE_URL=http://127.0.0.1:3101 npm run check:publication`.
- Inspect new content on a phone-sized and desktop viewport; check line breaks, links, dates, image descriptions and social cards.
- After deploying, run `BASE_URL=https://www.chingis.dev npm run check:publication`. Confirm the deployment commit matches the intended release.
- For scene changes also run `PREVIEW_URL=<origin> node scripts/denkpause-browser-check.mjs`.

The publication check follows the sitemap and checks delivered HTML, metadata, schemas, images and discovery files. This means newly registered pages and published articles join the same release check automatically.

## Search and AI discovery

Search/answer visibility relies on crawlable, useful, attributable content, consistent URLs and real evidence. `robots.txt` permits crawling. The sitemap contains all published translations. `llms.txt` and `llms-full.txt` are convenience exports generated from public material at build time, not a ranking mechanism or a requirement for AI search.

References checked 2 October 2026:

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google: localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [OpenAI: crawler controls](https://developers.openai.com/api/docs/bots)

Indexing, rankings and AI citations are outcomes to observe in search reporting; a deployment check cannot guarantee them.
