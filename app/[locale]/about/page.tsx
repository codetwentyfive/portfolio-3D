import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import AboutContent from "@/components/pages/AboutContent";
import JsonLd from "@/components/JsonLd";
import { buildPageMetadata } from "@/seo/metadata";
import { createWebPageSchema, createBreadcrumbSchema } from "@/seo/structured-data";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: { locale: Locale };
}

export function generateMetadata({ params: { locale } }: Props): Metadata {
  return buildPageMetadata("about", locale);
}

export default function AboutPage({ params: { locale } }: Props) {
  setRequestLocale(locale);

  return (
    <>
      <JsonLd
        schemas={[
          createWebPageSchema("about", locale),
          createBreadcrumbSchema("about", locale),
        ]}
      />
      <AboutContent />
    </>
  );
}
