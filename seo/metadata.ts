import type { Metadata } from "next";
import { seoConfig, type SeoLocale, type SeoPageKey } from "@/seo/config";
import { routing } from "@/src/i18n/routing";

const localizedUrl = (path: string, locale: string) =>
  `${seoConfig.siteUrl}/${locale}${path === "/" ? "" : path}`;

export function buildPageMetadata(page: SeoPageKey, locale: SeoLocale): Metadata {
  const pageConfig = seoConfig.pages[page];
  const meta = pageConfig[locale] || pageConfig.en;
  const url = localizedUrl(pageConfig.path, locale);

  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, localizedUrl(pageConfig.path, l)])
  );
  languages["x-default"] = localizedUrl(pageConfig.path, routing.defaultLocale);

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: "website",
      url,
      title: meta.title,
      description: meta.description,
      siteName: seoConfig.siteName,
      images: [{ url: seoConfig.ogImage, width: 1200, height: 630 }],
      locale: locale === "de" ? "de_DE" : "en_US",
      alternateLocale: locale === "de" ? "en_US" : "de_DE",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [seoConfig.ogImage],
    },
  };
}
