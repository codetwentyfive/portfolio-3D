import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { planets } from "@/components/scenes/planets/planet-data";
import { worldIndex } from "@/components/scenes/planets/world-navigation";
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
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ world?: string }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;

  return buildPageMetadata("home", locale);
}

export default async function HomePage(props: Props) {
  const { locale } = await props.params;

  setRequestLocale(locale);
  const { world } = await props.searchParams;
  const initialIndex = worldIndex(world, planets.map((entry) => entry.kind));

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
      <HomeScene key={`${locale}-${initialIndex}`} initialIndex={initialIndex} />
    </>
  );
}
