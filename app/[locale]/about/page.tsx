import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import AboutContent from "@/components/pages/AboutContent";
import JsonLd from "@/components/JsonLd";
import { buildPageMetadata } from "@/seo/metadata";
import { createWebPageSchema, createBreadcrumbSchema } from "@/seo/structured-data";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;

  return buildPageMetadata("about", locale);
}

export default async function AboutPage(props: Props) {
  const { locale } = await props.params;

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
