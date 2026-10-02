import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);

// Run actual server helpers without a Next.js build or a test-only implementation.
function moduleLoader() {
  const modules = new Map();
  const load = (filename) => {
    const file = path.extname(filename) ? filename : `${filename}.ts`;
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} };
    modules.set(file, module);
    const code = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      fileName: file,
    }).outputText;
    const localRequire = (specifier) => {
      if (specifier.startsWith("@/")) return load(path.join(root, specifier.slice(2)));
      if (specifier.startsWith(".")) return load(path.resolve(path.dirname(file), specifier));
      return require(specifier);
    };
    new Function("require", "module", "exports", code)(localRequire, module, module.exports);
    return module.exports;
  };
  return (file) => load(path.join(root, file));
}

const load = moduleLoader();
const { seoConfig, PERSON_ID } = load("seo/config.ts");
const { buildPageMetadata, buildBlogMetadata } = load("seo/metadata.ts");
const { createWebPageSchema, createBreadcrumbSchema, createBlogPostingSchema, createBlogBreadcrumbSchema, serializeStructuredData } = load("seo/structured-data.ts");
const { getPost, getAllPosts, getPostSlugs } = load("lib/blog.ts");
const sitemap = load("app/sitemap.ts").default;
const robots = load("app/robots.ts").default;

test("all registered page canonicals, social metadata and schemas agree in both languages", () => {
  for (const [page, config] of Object.entries(seoConfig.pages)) {
    for (const locale of ["de", "en"]) {
      const metadata = buildPageMetadata(page, locale);
      const schema = createWebPageSchema(page, locale);
      const url = `${seoConfig.siteUrl}/${locale}${config.path === "/" ? "" : config.path}`;
      assert.equal(metadata.alternates.canonical, url);
      assert.equal(metadata.openGraph.url, url);
      assert.equal(schema.url, url);
      assert.equal(schema.inLanguage, locale);
      assert.equal(schema.about["@id"], PERSON_ID);
      assert.match(metadata.openGraph.images[0].url, new RegExp(`/og/${locale}/`));
      assert.equal(metadata.twitter.images[0], metadata.openGraph.images[0].url);
      assert.equal(metadata.alternates.languages[locale], url);
      assert.equal(metadata.alternates.languages["x-default"], metadata.alternates.languages.de);
      const breadcrumbs = createBreadcrumbSchema(page, locale);
      if (page === "home") assert.equal(breadcrumbs, null);
      else {
        assert.equal(breadcrumbs.itemListElement.at(-1).item, url);
        assert.ok(breadcrumbs.itemListElement.every(({ item }) => item.startsWith(`${seoConfig.siteUrl}/${locale}`)));
      }
    }
  }
  assert.equal(PERSON_ID, "https://chingis.dev/#person", "cross-site identity must remain stable");
});

test("published articles have accurate authorship, dates, language, social images and breadcrumbs", async () => {
  const slugs = await getPostSlugs();
  assert.ok(slugs.length > 0);
  for (const locale of ["de", "en"]) {
    const posts = await getAllPosts(locale);
    for (const post of posts) {
      const metadata = buildBlogMetadata(post);
      const schema = createBlogPostingSchema(post);
      const url = `${seoConfig.siteUrl}/${post.locale}/blog/${post.slug}`;
      assert.equal(metadata.alternates.canonical, url);
      assert.equal(metadata.openGraph.url, url);
      assert.equal(metadata.openGraph.type, "article");
      assert.equal(metadata.openGraph.publishedTime, post.date);
      assert.equal(metadata.openGraph.modifiedTime, post.dateModified ?? post.date);
      assert.equal(schema.url, url);
      assert.equal(schema.headline, post.title);
      assert.equal(schema.datePublished, post.date);
      assert.equal(schema.dateModified, post.dateModified ?? post.date);
      assert.equal(schema.author["@id"], PERSON_ID);
      assert.equal(schema.author.url, metadata.authors[0].url);
      assert.equal(createBlogBreadcrumbSchema(post).itemListElement.at(-1).item, url);
      assert.ok(post.image, `${post.slug}: provide a representative article image`);
      assert.equal(schema.image, new URL(post.image, seoConfig.siteUrl).href);
      assert.ok(readFileSync(path.join(root, "public", post.image)).length > 0);
      assert.ok(post.imageAlt?.trim(), `${post.slug}: a visible image needs alternative text`);
      assert.ok(metadata.openGraph.images[0].url.endsWith(`/og/${post.locale}/blog/${post.slug}`));
    }
  }
});

test("sitemap includes real translations once, shares alternates and doesn't invent freshness", async () => {
  const entries = await sitemap();
  const urls = new Set(entries.map(({ url }) => url));
  assert.equal(entries.length, urls.size);
  for (const entry of entries) {
    assert.ok(entry.url.startsWith(`${seoConfig.siteUrl}/`));
    const locale = new URL(entry.url).pathname.split("/")[1];
    assert.equal(entry.alternates.languages[locale], entry.url);
    for (const translatedUrl of Object.values(entry.alternates.languages)) assert.ok(urls.has(translatedUrl));
    assert.doesNotMatch(entry.url, /\/(rechtliches|impressum|datenschutz)$/);
    if (!entry.url.includes("/blog/")) assert.equal(entry.lastModified, undefined);
    else {
      const slug = new URL(entry.url).pathname.split("/").at(-1);
      const post = await getPost(slug, locale);
      assert.equal(entry.lastModified, post.dateModified ?? post.date);
    }
  }
  assert.ok(urls.has(`${seoConfig.siteUrl}/de/projects/denkpause`));
  assert.ok(urls.has(`${seoConfig.siteUrl}/en/projects/denkpause`));
  assert.equal(robots().sitemap, `${seoConfig.siteUrl}/sitemap.xml`);
  assert.deepEqual(robots().rules, { userAgent: "*", allow: "/" });
});

test("an absent translation does not become a canonical, hreflang or sitemap claim", async () => {
  const fixture = mkdtempSync(path.join(tmpdir(), "portfolio-seo-"));
  const initialCwd = process.cwd();
  try {
    mkdirSync(path.join(fixture, "content/blog"), { recursive: true });
    const postFile = path.join(fixture, "content/blog/english-only.en.mdx");
    writeFileSync(postFile, '---\ntitle: "English article"\ndescription: "Only available in English"\ndate: 2026-07-06\ndateModified: "2026-10-02"\nimage: "/example.png"\nimageAlt: "Example diagram"\ntags: []\n---\nPublished body.');
    writeFileSync(path.join(fixture, "content/blog/README.mdx"), "Not a post");
    process.chdir(fixture);
    const fixtureLoad = moduleLoader();
    const blog = fixtureLoad("lib/blog.ts");
    assert.deepEqual(await blog.getPostSlugs(), ["english-only"]);
    const post = await blog.getPost("english-only", "de");
    assert.equal(post.locale, "en");
    assert.equal(post.date, "2026-07-06", "unquoted YAML dates remain ISO dates");
    assert.deepEqual(post.availableLocales, ["en"]);
    const metadata = fixtureLoad("seo/metadata.ts").buildBlogMetadata(post);
    assert.equal(metadata.alternates.canonical, `${seoConfig.siteUrl}/en/blog/english-only`);
    assert.deepEqual(Object.keys(metadata.alternates.languages), ["en", "x-default"]);
    const entries = await fixtureLoad("app/sitemap.ts").default();
    assert.deepEqual(entries.filter(({ url }) => url.includes("english-only")).map(({ url }) => url), [metadata.alternates.canonical]);
    assert.equal(await blog.getPost("../../secret", "de"), null);
    writeFileSync(postFile, '---\ntitle: "Bad date"\ndescription: "Reject malformed publication dates"\ndate: "2026-02-30"\n---\nBody.');
    await assert.rejects(blog.getPost("english-only", "en"), /valid YYYY-MM-DD/);
    writeFileSync(postFile, '---\ntitle: "Bad modification"\ndescription: "Reject contradictory chronology"\ndate: "2026-10-02"\ndateModified: "2026-07-06"\n---\nBody.');
    await assert.rejects(blog.getPost("english-only", "en"), /cannot precede publication/);
    writeFileSync(postFile, '---\ntitle: "No image"\ndescription: "Reject incomplete publication metadata"\ndate: "2026-10-02"\n---\nBody.');
    await assert.rejects(blog.getPost("english-only", "en"), /require a representative image and imageAlt/);
  } finally {
    process.chdir(initialCwd);
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("JSON-LD serialization cannot close its script element and preserves text", () => {
  const schema = { headline: '</script><script>alert("x")</script>', description: "An article <example> & details" };
  const serialized = serializeStructuredData(schema);
  assert.doesNotMatch(serialized, /</);
  assert.deepEqual(JSON.parse(serialized), schema);
});
