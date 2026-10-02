import type { MetadataRoute } from "next";
import { routing } from "@/src/i18n/routing";
import { getAllPosts } from "@/lib/blog";
import { seoConfig, type SeoPageKey } from "@/seo/config";
import { languageAlternates, localizedUrl } from "@/seo/urls";

// Legal pages are intentionally noindex; their redirect aliases also stay out.
const staticPages = (Object.keys(seoConfig.pages) as SeoPageKey[])
  .filter((page) => !["legal", "impressum", "privacy"].includes(page));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticPages.flatMap((page) => {
    const path = seoConfig.pages[page].path;
    return routing.locales.map((locale) => ({
      url: localizedUrl(path, locale),
      alternates: { languages: languageAlternates(path) },
    }));
  });

  const postsByLocale = await Promise.all(routing.locales.map(getAllPosts));
  for (const [index, posts] of postsByLocale.entries()) {
    for (const post of posts) {
      // A fallback is useful for visitors, but is not a published translation.
      if (post.locale !== routing.locales[index]) continue;
      const path = `/blog/${post.slug}`;
      entries.push({
        url: localizedUrl(path, post.locale),
        lastModified: post.dateModified ?? post.date,
        alternates: { languages: languageAlternates(path, post.availableLocales) },
        ...(post.image ? { images: [new URL(post.image, seoConfig.siteUrl).href] } : {}),
      });
    }
  }

  return entries;
}
