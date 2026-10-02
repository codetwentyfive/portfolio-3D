import { seoConfig, type SeoLocale } from "./config";
import { routing } from "@/src/i18n/routing";

export const absoluteUrl = (path: string) => new URL(path, seoConfig.siteUrl).href;

export const localizedUrl = (path: string, locale: SeoLocale) =>
  `${seoConfig.siteUrl}/${locale}${path === "/" ? "" : path}`;

export const socialImageUrl = (path: string, locale: SeoLocale) =>
  `${seoConfig.siteUrl}/og/${locale}/${path === "/" ? "home" : path.replace(/^\//, "")}`;

/** Include only published translations, never a URL that displays a fallback language. */
export function languageAlternates(
  path: string,
  locales: readonly SeoLocale[] = routing.locales,
): Record<string, string> {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, localizedUrl(path, locale)]),
  );
  const defaultLocale = locales.includes(routing.defaultLocale)
    ? routing.defaultLocale
    : locales[0];
  if (defaultLocale) languages["x-default"] = localizedUrl(path, defaultLocale);
  return languages;
}
