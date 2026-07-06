import type { MetadataRoute } from "next";
import { routing } from "@/src/i18n/routing";
import { getAllPosts } from "@/lib/blog";

const BASE_URL = "https://chingis.dev";

const staticPaths = ["", "/about", "/projects", "/services", "/blog", "/contact", "/rechtliches"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${BASE_URL}/${routing.defaultLocale}${path}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, `${BASE_URL}/${locale}${path}`])
      ),
    },
  }));

  const posts = await getAllPosts(routing.defaultLocale);
  for (const post of posts) {
    entries.push({
      url: `${BASE_URL}/${routing.defaultLocale}/blog/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((locale) => [locale, `${BASE_URL}/${locale}/blog/${post.slug}`])
        ),
      },
    });
  }

  return entries;
}
