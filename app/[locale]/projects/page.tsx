import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { planets } from "@/components/scenes/planets/planet-data";
import worldVersions from "@/assets/world-versions.json";
import { ControlGlyph } from "@/components/scenes/planets/WorldGlyph";
import CTA from "@/components/CTA";
import JsonLd from "@/components/JsonLd";
import { buildPageMetadata } from "@/seo/metadata";
import {
  createWebPageSchema,
  createBreadcrumbSchema,
} from "@/seo/structured-data";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;

  return buildPageMetadata("projects", locale);
}

export default async function ProjectsPage(props: Props) {
  const { locale } = await props.params;

  setRequestLocale(locale);
  const a = await getTranslations({ locale, namespace: "archive" });
  return (
    <section className="max-container">
      <JsonLd
        schemas={[
          createWebPageSchema("projects", locale),
          createBreadcrumbSchema("projects", locale),
        ]}
      />
      <p className="editorial-kicker mb-5">Chingis / 01 &ndash; 06</p>
      <h1 className="head-text">{a("index")}</h1>
      <p className="editorial-intro mt-7">{a("catalogIntro")}</p>
      <div className="project-catalog">
        {planets.map((project, index) => (
          <article key={project.kind} className="catalog-entry">
            <div className="studio-eyebrow justify-between">
              <span>{project.number}</span>
              <span>{a(`disciplines.${project.kind}`)}</span>
            </div>
            <Link
              href={{ pathname: "/", query: { world: project.kind } }}
              className="catalog-preview"
              aria-label={`${a("inspect")}: ${project.name[locale]}`}
            >
              <Image
                src={`/images/worlds/${project.kind}-v${worldVersions[project.kind]}.png`}
                alt=""
                width={720}
                height={520}
                sizes="(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 540px"
                priority={index === 0}
              />
              <span>
                <ControlGlyph name="zoom" />
                {a("inspect")}
              </span>
            </Link>
            <h2 className="font-sans text-[1.65rem] font-medium leading-tight tracking-[-0.045em]">
              {project.name[locale]}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {a(`descriptions.${project.kind}`)}
            </p>
            <details className="catalog-notes">
              <summary>
                {a("notes")}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{project.descriptions[locale] || project.descriptions.en}</p>
            </details>
            <div className="catalog-links">
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {a("open")}
                  <ControlGlyph name="enter" />
                </a>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {a("code")}
                  <ControlGlyph name="enter" />
                </a>
              )}
              {project.status && <span>{project.status[locale]}</span>}
            </div>
          </article>
        ))}
      </div>
      <hr className="border-slate-300" />
      <CTA />
    </section>
  );
}
