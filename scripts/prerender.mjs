/**
 * Static prerender step (runs after `vite build`).
 *
 * WHY: the app is a client-only Vite SPA (react-three-fiber + react-router).
 * Its built HTML ships an empty <div id="root">, so crawlers that don't run JS
 * (most AI crawlers, and Google's first pass) see no body content. Node-based
 * SSG (vite-react-ssg) can't run here: it doesn't support Vite 8 / react-router
 * 7, and the app reads localStorage + WebGL at module load. A headless-Chrome
 * prerender can't be verified for the Vercel build sandbox.
 *
 * WHAT: for each public route we take the built dist/index.html, swap in the
 * per-route <head> (title/description/canonical/OG/Twitter + WebPage &
 * Breadcrumb JSON-LD), and inject real textual content into #root — sourced
 * from the SAME translations + SEO config the React app uses, so it can't drift
 * into fiction. On the client, createRoot() replaces this markup on mount, so
 * users get the full SPA; crawlers keep the static content.
 *
 * Content is emitted in English to stay consistent with the site's canonical /
 * OG / JSON-LD (all English). The SPA still switches languages client-side.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { seoConfig } from "../src/seo/config.js";
import {
  professionalServiceSchema,
  createWebPageSchema,
  createBreadcrumbSchema,
} from "../src/seo/structured-data.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const template = readFileSync(join(DIST, "index.html"), "utf8");
const t = JSON.parse(readFileSync(join(ROOT, "translations/en.json"), "utf8"));

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// JSON-LD, safe to inline inside <script> (neutralise </script>).
const ld = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(
    /</g,
    "\\u003c"
  )}</script>`;

const p = (...keys) =>
  keys
    .map((k) => t[k])
    .filter(Boolean)
    .map((v) => `<p>${esc(v)}</p>`)
    .join("\n      ");

const nav = `
      <nav aria-label="Site">
        <a href="/">Home</a> ·
        <a href="/about">About</a> ·
        <a href="/projects">Projects</a> ·
        <a href="/contact">Contact</a>
      </nav>`;

// Per-route body content, built from translation keys the React pages use.
const BODIES = {
  home: () => `
      <h1>${esc(t.name || "Chingis Zwecker E.")}</h1>
      <p><strong>AI Engineer · Developer · IT Architect${
        t.location ? ` — ${esc(t.location)}` : ""
      }</strong></p>
      ${p("hi_message", "digital_nomad_message", "skills_message1", "skills_message2", "lets_build_together1", "lets_build_together2")}
      ${nav}`,
  about: () => `
      <h1>${esc(t.about || "About")}</h1>
      ${p("greeting_about", "short_intro")}
      <h2>${esc(t.my_skills || "Skills")}</h2>
      ${p("timeline_description1", "timeline_description2", "timeline_description3", "cta_text1", "cta_text2")}
      ${nav}`,
  projects: () => `
      <h1>${esc(t.projects || "Projects")}</h1>
      <h2>${esc([t.project_header1, t.project_header2].filter(Boolean).join(" "))}</h2>
      ${p("projects_text1", "projects_text2", "projects_text3", "projects_text4")}
      <p>More on <a href="https://github.com/codetwentyfive">GitHub</a> and the shop at <a href="https://chingis.shop">chingis.shop</a>.</p>
      ${nav}`,
  contact: () => `
      <h1>${esc(t.contact || "Contact")}</h1>
      <h2>${esc([t.contact_heading, t.contact_heading_span].filter(Boolean).join(" "))}</h2>
      <p>Email: <a href="mailto:hello@chingis.dev">hello@chingis.dev</a></p>
      ${nav}`,
  legal: () => `
      <h1>Legal / Rechtliches</h1>
      <p>Impressum and Datenschutz (privacy policy) for chingis.dev.</p>
      ${nav}`,
};

// route path -> seoConfig page key
const ROUTES = [
  { out: "index.html", key: "home", url: "/" },
  { out: "about/index.html", key: "about", url: "/about" },
  { out: "projects/index.html", key: "projects", url: "/projects" },
  { out: "contact/index.html", key: "contact", url: "/contact" },
  { out: "rechtliches/index.html", key: "legal", url: "/rechtliches" },
];

const setMeta = (html, attr, name, value) => {
  const re = new RegExp(
    `(<meta\\s+${attr}="${name}"\\s+content=")[^"]*(")`,
    "i"
  );
  return re.test(html) ? html.replace(re, `$1${esc(value)}$2`) : html;
};

for (const { out, key, url } of ROUTES) {
  const cfg = seoConfig.pages[key];
  const { title, description } = cfg.en;
  const canonical = `${seoConfig.siteUrl}${cfg.path}`;

  let html = template;

  // --- head: per-route title + meta ---
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  html = setMeta(html, "name", "description", description);
  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/i,
    `$1${canonical}$2`
  );
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);

  // --- head: per-route JSON-LD (Person + WebSite already in the template) ---
  const extra = [];
  if (key === "home") extra.push(professionalServiceSchema);
  const webpage = createWebPageSchema(key, "en");
  if (webpage) extra.push(webpage);
  const crumb = createBreadcrumbSchema(key, "en");
  if (crumb) extra.push(crumb);
  if (extra.length) {
    html = html.replace("</head>", `${extra.map(ld).join("\n    ")}\n  </head>`);
  }

  // --- body: inject crawlable content into #root ---
  // Visually hidden (accessible sr-only clip pattern), NOT display:none — the
  // text stays in the raw HTML for crawlers/AI bots (which read HTML, not CSS)
  // and for screen readers, but never visibly "flashes" before the SPA mounts.
  // React's createRoot() clears #root on mount, so this is gone for JS users.
  const srOnly =
    "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:normal;border:0";
  const content = `<div id="prerender-content" style="${srOnly}">${BODIES[key]()}
    </div>`;
  html = html.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root">${content}</div>`
  );

  const dest = join(DIST, out);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  console.log(`prerendered ${url} -> dist/${out}`);
}

console.log(`\n✓ prerendered ${ROUTES.length} routes`);
