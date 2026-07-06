import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import ContactContent from "@/components/pages/ContactContent";
import JsonLd from "@/components/JsonLd";
import { buildPageMetadata } from "@/seo/metadata";
import { createWebPageSchema, createBreadcrumbSchema } from "@/seo/structured-data";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: { locale: Locale };
}

export function generateMetadata({ params: { locale } }: Props): Metadata {
  return buildPageMetadata("contact", locale);
}

export default function ContactPage({ params: { locale } }: Props) {
  setRequestLocale(locale);

  return (
    <>
      <JsonLd
        schemas={[
          createWebPageSchema("contact", locale),
          createBreadcrumbSchema("contact", locale),
        ]}
      />
      <ContactContent />
    </>
  );
}
