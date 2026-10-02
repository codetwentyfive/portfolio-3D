import { socialLinks } from "@/constants";
import { services } from "@/constants/services";
import { planets } from "@/components/scenes/planets/planet-data";
import { getAllPosts } from "@/lib/blog";
import { seoConfig, type SeoPageKey } from "@/seo/config";
import { localizedUrl } from "@/seo/urls";
import { routing, type Locale } from "@/src/i18n/routing";

// These legacy URLs redirect to the combined legal page; list only real pages.
export const publicationPages = Object.entries(seoConfig.pages).filter(
  ([key]) => key !== "impressum" && key !== "privacy",
) as [SeoPageKey, (typeof seoConfig.pages)[SeoPageKey]][];

export async function getPublishedTranslations(locale: Locale) {
  return (await getAllPosts(locale)).filter((post) => post.locale === locale);
}

/** A convenience export of public site content, not a search-engine requirement. */
export async function buildPublicationText(full = false): Promise<string> {
  const sections = await Promise.all(routing.locales.map(async (locale) => {
    const posts = await getPublishedTranslations(locale);
    const lines = [
      `## ${locale === "de" ? "Deutsch" : "English"}`,
      "",
      seoConfig.pages.home[locale].description,
      "",
      `### ${locale === "de" ? "Seiten" : "Pages"}`,
      "",
      ...publicationPages.map(([, page]) =>
        `- [${page[locale].title}](${localizedUrl(page.path, locale)}): ${page[locale].description}`,
      ),
      "",
      `### ${locale === "de" ? "Veröffentlichte Artikel" : "Published articles"}`,
      "",
      ...posts.map((post) =>
        `- [${post.title}](${localizedUrl(`/blog/${post.slug}`, locale)}): ${post.description} (${post.date})`,
      ),
    ];

    if (full) {
      lines.push("", `### ${locale === "de" ? "Projekte" : "Projects"}`, "");
      for (const project of planets) {
        lines.push(
          `#### ${project.name[locale]}`,
          "",
          project.descriptions[locale],
          "",
          ...(project.status ? [`Status: ${project.status[locale]}`, ""] : []),
          `[Portfolio](${localizedUrl(project.caseStudy ?? "/projects", locale)})`,
          ...(project.link ? [`[${locale === "de" ? "Projekt-Website" : "Project website"}](${project.link})`] : []),
          ...(project.github ? [`[GitHub](${project.github})`] : []),
          "",
        );
      }
      lines.push(`### ${locale === "de" ? "Leistungen" : "Services"}`, "");
      for (const service of services) {
        lines.push(`#### ${service.title[locale]}`, "", service.description[locale], "");
      }
      lines.push(`### ${locale === "de" ? "Artikeltexte" : "Article text"}`, "");
      for (const post of posts) {
        lines.push(
          `#### ${post.title}`,
          "",
          `URL: ${localizedUrl(`/blog/${post.slug}`, locale)}`,
          `${locale === "de" ? "Autor" : "Author"}: ${seoConfig.siteName}`,
          `${locale === "de" ? "Veröffentlicht" : "Published"}: ${post.date}`,
          ...(post.dateModified ? [`${locale === "de" ? "Aktualisiert" : "Updated"}: ${post.dateModified}`] : []),
          "",
          post.description,
          "",
          post.content.trim(),
          "",
        );
      }
    }
    return lines.join("\n");
  }));

  return [
    `# ${seoConfig.siteName}`,
    "",
    "> Public portfolio, services, and articles in German and English.",
    "",
    `Website: ${seoConfig.siteUrl}`,
    `Author: ${seoConfig.siteName}`,
    ...socialLinks.filter((link) => /^https:\/\//.test(link.link)).map((link) => `${link.name}: ${link.link}`),
    "",
    "This file is generated from the public website and published articles. Follow the linked pages for the canonical content and context.",
    ...(full ? [] : ["", `[Full public text](${seoConfig.siteUrl}/llms-full.txt)`]),
    "",
    ...sections,
    "",
  ].join("\n");
}

export const publicationTextHeaders = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=0, must-revalidate",
  "X-Content-Type-Options": "nosniff",
};
