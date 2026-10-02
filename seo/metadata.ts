import type { Metadata } from "next";
import type { Post } from "@/lib/blog";
import { seoConfig, type SeoLocale, type SeoPageKey } from "./config";
import { absoluteUrl, languageAlternates, localizedUrl, socialImageUrl } from "./urls";

interface LocalizedMetadataOptions {
  path: string;
  locale: SeoLocale;
  title: string;
  description: string;
  image?: string;
  availableLocales?: readonly SeoLocale[];
}

export function buildLocalizedMetadata({
  path, locale, title, description, image, availableLocales,
}: LocalizedMetadataOptions): Metadata {
  const url = localizedUrl(path, locale);
  const imageUrl = image ? absoluteUrl(image) : socialImageUrl(path, locale);
  const languages = languageAlternates(path, availableLocales);
  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: seoConfig.siteName,
      images: [{ url: imageUrl, alt: title, ...(!image ? { width: 1200, height: 630 } : {}) }],
      locale: locale === "de" ? "de_DE" : "en_US",
      alternateLocale: Object.keys(languages)
        .filter((language) => language !== locale && language !== "x-default")
        .map((language) => language === "de" ? "de_DE" : "en_US"),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function buildPageMetadata(page: SeoPageKey, locale: SeoLocale): Metadata {
  const pageConfig = seoConfig.pages[page];
  return buildLocalizedMetadata({
    ...pageConfig[locale], path: pageConfig.path, locale,
  });
}

export function buildBlogMetadata(post: Post): Metadata {
  const metadata = buildLocalizedMetadata({
    path: `/blog/${post.slug}`,
    locale: post.locale,
    title: post.title,
    description: post.description,
    availableLocales: post.availableLocales,
  });
  return {
    ...metadata,
    authors: [{ name: seoConfig.siteName, url: localizedUrl("/about", post.locale) }],
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.dateModified ?? post.date,
      authors: [localizedUrl("/about", post.locale)],
      tags: post.tags,
    },
  };
}
