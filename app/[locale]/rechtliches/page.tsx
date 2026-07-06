import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import LegalContent from "@/components/pages/LegalContent";
import JsonLd from "@/components/JsonLd";
import { buildPageMetadata } from "@/seo/metadata";
import { createWebPageSchema, createBreadcrumbSchema } from "@/seo/structured-data";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: { locale: Locale };
}

export function generateMetadata({ params: { locale } }: Props): Metadata {
  return {
    ...buildPageMetadata("legal", locale),
    robots: { index: false, follow: true },
  };
}

export default function LegalPage({ params: { locale } }: Props) {
  setRequestLocale(locale);

  return (
    <>
      <JsonLd
        schemas={[
          createWebPageSchema("legal", locale),
          createBreadcrumbSchema("legal", locale),
        ]}
      />
      <LegalContent />
    </>
  );
}
