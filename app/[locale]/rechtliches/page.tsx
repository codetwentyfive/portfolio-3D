import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import LegalContent from "@/components/pages/LegalContent";
import JsonLd from "@/components/JsonLd";
import { buildPageMetadata } from "@/seo/metadata";
import { createWebPageSchema, createBreadcrumbSchema } from "@/seo/structured-data";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;

  return {
    ...buildPageMetadata("legal", locale),
    robots: { index: false, follow: true },
  };
}

export default async function LegalPage(props: Props) {
  const { locale } = await props.params;

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
