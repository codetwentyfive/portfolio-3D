/** Release acceptance against the delivered site, without client-side JavaScript.
 * BASE_URL=http://127.0.0.1:3101 node scripts/publication-check.mjs
 * BASE_URL=https://www.chingis.dev node scripts/publication-check.mjs
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = new URL(process.env.BASE_URL || "http://127.0.0.1:3101");
const canonicalOrigin = "https://www.chingis.dev";
const personId = "https://chingis.dev/#person";
const requiredArticles = ["self-hosted-ai-assistant", "vite-to-nextjs-migration"];
const corePaths = ["", "/about", "/projects", "/projects/denkpause", "/services", "/blog", "/contact"];
const failures = [];
const snapshots = new Map();
const socialImages = new Set();
const articleImages = new Set();
const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const localUrl = (value) => {
  const url = new URL(value, canonicalOrigin);
  assert.equal(url.origin, canonicalOrigin, `unexpected public origin: ${value}`);
  return new URL(`${url.pathname}${url.search}`, base).href;
};
const noindex = (value) => /(?:^|[,;]\s*|\s)(?:noindex|none)(?:$|[,;\s])/i.test(value ?? "");
const flattenSchemas = (value) => Array.isArray(value)
  ? value.flatMap(flattenSchemas)
  : value && typeof value === "object"
    ? [value, ...(value["@graph"] ? flattenSchemas(value["@graph"]) : [])]
    : [];
const hasType = (schema, type) => [schema["@type"]].flat().includes(type);

async function check(label, operation) {
  try { await operation(); }
  catch (error) { failures.push(`${label}: ${error.message}`); console.error(`FAIL ${label}: ${error.message}`); }
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const request = context.request;
let pageCount = 0;
let articleCount = 0;
let imageCount = 0;
try {
  const sitemapResponse = await request.get(new URL("/sitemap.xml", base).href);
  assert.equal(sitemapResponse.status(), 200, "sitemap must return 200");
  assert.match(sitemapResponse.headers()["content-type"], /xml/);
  const entries = await page.evaluate((xml) => {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("invalid sitemap XML");
    return [...doc.documentElement.children].filter((node) => node.localName === "url").map((node) => ({
      url: [...node.children].find((child) => child.localName === "loc")?.textContent,
      lastModified: [...node.children].find((child) => child.localName === "lastmod")?.textContent,
      languages: Object.fromEntries([...node.children].filter((child) => child.localName === "link")
        .map((child) => [child.getAttribute("hreflang"), child.getAttribute("href")])),
    }));
  }, await sitemapResponse.text());
  const urls = new Set(entries.map(({ url }) => url));
  assert.equal(urls.size, entries.length, "duplicate sitemap URLs");
  assert.ok(entries.length >= 2 * (corePaths.length + requiredArticles.length), "expected both languages, all core pages and both articles");
  for (const locale of ["de", "en"]) {
    for (const path of corePaths) assert.ok(urls.has(`${canonicalOrigin}/${locale}${path}`), `missing ${locale}${path}`);
    for (const slug of requiredArticles) assert.ok(urls.has(`${canonicalOrigin}/${locale}/blog/${slug}`), `missing ${locale}/${slug}`);
  }

  console.log(`Checking ${entries.length} published URLs at ${base.origin} (JavaScript disabled).`);
  for (const entry of entries) {
    const pathname = new URL(entry.url).pathname;
    await check(pathname, async () => {
      const response = await page.goto(localUrl(entry.url), { waitUntil: "domcontentloaded", timeout: 30000 });
      assert.equal(response?.status(), 200, "published URL must return 200");
      assert.equal(new URL(page.url()).pathname, pathname, "canonical URL must not redirect");
      assert.ok(!noindex(response.headers()["x-robots-tag"]), "HTTP header blocks indexing");
      const data = await page.evaluate(() => {
        const metas = (selector) => [...document.querySelectorAll(selector)].map((node) => node.getAttribute("content"));
        const content = document.querySelector("main") ?? document.body;
        return {
          title: document.title,
          language: document.documentElement.lang,
          description: metas('meta[name="description"]'),
          robots: metas('meta[name="robots"],meta[name="googlebot"],meta[name="bingbot"]'),
          canonical: [...document.querySelectorAll('link[rel="canonical"]')].map((node) => node.href),
          languages: Object.fromEntries([...document.querySelectorAll('link[rel="alternate"][hreflang]')]
            .map((node) => [node.hreflang, node.href])),
          ogUrl: metas('meta[property="og:url"]'),
          ogTitle: metas('meta[property="og:title"]'),
          ogDescription: metas('meta[property="og:description"]'),
          ogType: metas('meta[property="og:type"]'),
          ogImage: metas('meta[property="og:image"]'),
          twitterImage: metas('meta[name="twitter:image"]'),
          published: metas('meta[property="article:published_time"]'),
          modified: metas('meta[property="article:modified_time"]'),
          h1: [...document.querySelectorAll("h1")].map((node) => node.textContent),
          visibleText: content.innerText,
          articleText: document.querySelector(".article-body")?.innerText,
          authorLinks: [...document.querySelectorAll('a[rel~="author"]')].map((node) => ({ href: node.getAttribute("href"), text: node.innerText })),
          dates: [...document.querySelectorAll("article time[datetime]")].map((node) => node.dateTime),
          visibleImages: [...document.querySelectorAll("article img")].filter((node) => node.getClientRects().length)
            .map((node) => ({ source: node.getAttribute("src"), alt: node.getAttribute("alt") })),
          schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) => JSON.parse(node.textContent)),
        };
      });
      const locale = pathname.split("/")[1];
      assert.equal(data.language, locale, "HTML language mismatch");
      assert.ok(clean(data.title).length >= 5, "missing page title");
      assert.equal(data.description.length, 1, "exactly one meta description required");
      assert.ok(clean(data.description[0]).length >= 30, "description is empty or too short");
      assert.ok(data.robots.every((value) => !noindex(value)), "HTML metadata blocks indexing");
      assert.deepEqual(data.canonical, [entry.url], "canonical mismatch");
      assert.deepEqual(data.ogUrl, [entry.url], "Open Graph URL mismatch");
      assert.deepEqual(data.ogTitle, [data.title], "social title differs from page title");
      assert.deepEqual(data.ogDescription, data.description, "social description differs from page description");
      assert.equal(data.h1.length, 1, "exactly one H1 required");
      assert.ok(clean(data.h1[0]), "H1 is empty");
      assert.ok(clean(data.visibleText).length >= 160, "insufficient visible server-rendered text");
      assert.deepEqual(data.languages, entry.languages, "HTML and sitemap hreflang disagree");
      assert.equal(data.languages[locale], entry.url, "hreflang must include self");
      assert.ok(data.languages["x-default"], "missing fallback language URL");
      for (const alternative of Object.values(data.languages)) assert.ok(urls.has(alternative), `hreflang points outside sitemap: ${alternative}`);
      assert.equal(data.ogImage.length, 1, "one generated social card required");
      const expectedImage = `${canonicalOrigin}/og/${locale}/${pathname.split("/").slice(2).join("/") || "home"}`;
      assert.equal(data.ogImage[0], expectedImage, "social image route mismatch");
      assert.deepEqual(data.twitterImage, data.ogImage, "Twitter image differs from Open Graph image");
      socialImages.add(data.ogImage[0]);
      const schemas = data.schemas.flatMap(flattenSchemas);
      assert.ok(schemas.some((schema) => hasType(schema, "Person") && schema["@id"] === personId), "missing stable person identity");
      const article = schemas.find((schema) => hasType(schema, "BlogPosting"));
      if (/\/(de|en)\/blog\/[^/]+$/.test(pathname)) {
        assert.ok(article, "missing BlogPosting schema");
        assert.equal(article.url, entry.url, "article URL mismatch");
        assert.equal(article.mainEntityOfPage?.["@id"], entry.url, "article mainEntityOfPage mismatch");
        assert.equal(article.inLanguage, locale, "article language mismatch");
        assert.equal(clean(article.headline), clean(data.h1[0]), "schema headline differs from visible H1");
        assert.equal(article.description, data.description[0], "schema description mismatch");
        assert.match(article.datePublished, /^\d{4}-\d{2}-\d{2}$/);
        assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(Date.parse(article.dateModified) >= Date.parse(article.datePublished), "modification precedes publication");
        assert.deepEqual(data.published, [article.datePublished], "publication metadata mismatch");
        assert.deepEqual(data.modified, [article.dateModified], "modification metadata mismatch");
        assert.ok(entry.lastModified.startsWith(article.dateModified), "sitemap modification date mismatch");
        assert.ok(data.dates.includes(article.datePublished), "publication date must be visible");
        if (article.dateModified !== article.datePublished) assert.ok(data.dates.includes(article.dateModified), "updated date must be visible");
        assert.equal(article.author?.["@id"], personId, "article author identity mismatch");
        assert.equal(article.author?.name, "Chingis Zwecker E.", "article author name mismatch");
        assert.equal(article.author?.url, `${canonicalOrigin}/${locale}/about`, "article author URL mismatch");
        assert.ok(data.authorLinks.some(({ href, text }) => href === `/${locale}/about` && text.includes(article.author.name)), "missing visible author link");
        assert.ok(clean(data.articleText).length >= 500, "article body is empty or incomplete without JavaScript");
        assert.ok(article.image, "missing representative article image");
        const imagePath = new URL(article.image).pathname;
        assert.ok(data.visibleImages.some(({ source, alt }) => decodeURIComponent(source).includes(imagePath) && clean(alt)), "schema image lacks a visible image with alt text");
        articleImages.add(article.image);
        articleCount++;
      } else {
        assert.ok(schemas.some((schema) => ["WebPage", "ProfilePage", "CollectionPage"].some((type) => hasType(schema, type)) && schema.url === entry.url), "missing localized page schema");
      }
      if (pathname.split("/").filter(Boolean).length > 1) {
        const breadcrumb = schemas.find((schema) => hasType(schema, "BreadcrumbList"));
        assert.ok(breadcrumb, "missing breadcrumbs");
        assert.equal(breadcrumb.itemListElement.at(-1).item, entry.url, "breadcrumb target mismatch");
        assert.ok(breadcrumb.itemListElement.every((item, index) => item.position === index + 1 && item.item.startsWith(`${canonicalOrigin}/${locale}`)), "breadcrumb locale/order mismatch");
      }
      snapshots.set(entry.url, data);
      pageCount++;
      console.log(`OK ${pathname}`);
    });
  }

  await check("reciprocal hreflang", async () => {
    for (const [url, data] of snapshots) {
      for (const alternate of Object.values(data.languages)) {
        const peer = snapshots.get(alternate);
        assert.ok(peer, `unchecked alternate ${alternate}`);
        assert.deepEqual(peer.languages, data.languages, `non-reciprocal hreflang: ${url} and ${alternate}`);
      }
    }
  });

  // Legal content stays available to visitors, but must not appear in an indexing sitemap.
  for (const locale of ["de", "en"]) await check(`${locale} legal noindex`, async () => {
    const url = `${canonicalOrigin}/${locale}/rechtliches`;
    assert.ok(!urls.has(url), "noindex legal page must be excluded from sitemap");
    const response = await page.goto(localUrl(url), { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), url);
    assert.ok(noindex(await page.locator('meta[name="robots"]').getAttribute("content")), "legal noindex policy changed");
    const image = await page.locator('meta[property="og:image"]').getAttribute("content");
    assert.equal(image, `${canonicalOrigin}/og/${locale}/rechtliches`);
    socialImages.add(image);
  });

  for (const image of socialImages) {
    await check(new URL(image).pathname, async () => {
      const response = await request.get(localUrl(image), { timeout: 30000 });
      assert.equal(response.status(), 200, "social image must return 200");
      assert.match(response.headers()["content-type"], /^image\/png/);
      const bytes = await response.body();
      assert.ok(bytes.length > 1000, "empty social PNG");
      assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "invalid PNG signature");
      assert.equal(bytes.subarray(12, 16).toString(), "IHDR", "missing PNG header");
      assert.equal(bytes.readUInt32BE(16), 1200, "social image width");
      assert.equal(bytes.readUInt32BE(20), 630, "social image height");
      imageCount++;
    });
  }
  for (const image of articleImages) await check(new URL(image).pathname, async () => {
    const response = await request.get(localUrl(image));
    assert.equal(response.status(), 200, "representative image must return 200");
    assert.match(response.headers()["content-type"], /^image\//);
    assert.ok((await response.body()).length > 1000, "empty representative image");
  });

  await check("robots.txt", async () => {
    const response = await request.get(new URL("/robots.txt", base).href);
    assert.equal(response.status(), 200);
    const body = await response.text();
    assert.match(body, /User-Agent:\s*\*/i);
    assert.match(body, /Allow:\s*\/\s*(?:\r?\n|$)/i);
    assert.ok(!/^Disallow:\s*\/\s*$/im.test(body), "robots blocks the site");
    assert.ok(body.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`), "robots sitemap host mismatch");
  });
  for (const path of ["/llms.txt", "/llms-full.txt"]) await check(path, async () => {
    const response = await request.get(new URL(path, base).href);
    assert.equal(response.status(), 200);
    assert.match(response.headers()["content-type"], /^text\/plain/);
    const body = await response.text();
    for (const locale of ["de", "en"]) {
      assert.ok(body.includes(`${canonicalOrigin}/${locale}/projects/denkpause`), "case study missing from public text export");
      for (const slug of requiredArticles) assert.ok(body.includes(`${canonicalOrigin}/${locale}/blog/${slug}`), `missing ${locale}/${slug}`);
    }
    assert.ok(!body.includes("/content/drafts/"), "export leaks draft paths");
    if (path === "/llms-full.txt") assert.ok(body.length > 10000, "full export lacks article bodies");
  });
  for (const locale of ["de", "en"]) await check(`${locale} unknown article`, async () => {
    const response = await request.get(new URL(`/${locale}/blog/publication-check-missing-article`, base).href);
    assert.equal(response.status(), 404, "unknown article must return a real 404");
  });

  if (failures.length) throw new Error(`${failures.length} publication acceptance check(s) failed:\n${failures.join("\n")}`);
  console.log(`PASS: ${pageCount} pages, ${articleCount} article translations, ${imageCount} social PNGs; reciprocal hreflang, schemas, images, robots, public exports and 404s verified.`);
} finally {
  await context.close();
  await browser.close();
}
