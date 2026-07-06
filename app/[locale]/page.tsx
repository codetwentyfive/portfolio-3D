import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import HomeScene from "@/components/scenes/HomeScene";
import JsonLd from "@/components/JsonLd";
import { buildPageMetadata } from "@/seo/metadata";
import {
  personSchema,
  websiteSchema,
  professionalServiceSchema,
  createWebPageSchema,
  createBreadcrumbSchema,
} from "@/seo/structured-data";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: { locale: Locale };
}

export function generateMetadata({ params: { locale } }: Props): Metadata {
  return buildPageMetadata("home", locale);
}

export default function HomePage({ params: { locale } }: Props) {
  setRequestLocale(locale);

  return (
    <>
      <JsonLd
        schemas={[
          personSchema,
          websiteSchema,
          professionalServiceSchema,
          createWebPageSchema("home", locale),
          createBreadcrumbSchema("home", locale),
        ]}
      />
      <HomeScene />
    </>
  );
}
