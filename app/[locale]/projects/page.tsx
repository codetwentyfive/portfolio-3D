import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { arrow, github } from "@/assets/icons";
import { projects, type Project } from "@/constants";
import CTA from "@/components/CTA";
import JsonLd from "@/components/JsonLd";
import { buildPageMetadata } from "@/seo/metadata";
import { createWebPageSchema, createBreadcrumbSchema } from "@/seo/structured-data";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: { locale: Locale };
}

export function generateMetadata({ params: { locale } }: Props): Metadata {
  return buildPageMetadata("projects", locale);
}

export default async function ProjectsPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const getProjectDescription = (project: Project) =>
    project.descriptions[locale] || project.descriptions.en;

  const getProjectName = (project: Project) =>
    typeof project.name === "object"
      ? project.name[locale] || project.name.en
      : project.name;

  const getProjectStatus = (project: Project) => {
    if (!project.status) return null;
    return project.status[locale] || project.status.en;
  };

  return (
    <section className="max-container">
      <JsonLd
        schemas={[
          createWebPageSchema("projects", locale),
          createBreadcrumbSchema("projects", locale),
        ]}
      />
      <h1 className="head-text">
        {t("project_header1")}{" "}
        <span className="gradient_text font-semibold drop-shadow">
          {t("project_header2")}
        </span>
      </h1>

      <div className="mt-5 flex flex-col gap-3 text-slate-500">
        <p>
          {t("projects_text1")} <br />
          {t("projects_text2")} <br />
          {t("projects_text3")} <br />
          {t("projects_text4")}
        </p>
      </div>
      <div className="flex flex-wrap my-20 gap-16">
        {projects.map((project) => (
          <div className="lg:w-[400px] w-full" key={getProjectName(project)}>
            <div className="block-container w-12 h-12">
              <div className={`btn-back rounded-xl ${project.theme}`} />
              <div className="btn-front rounded-xl flex justify-center items-center">
                <img
                  src={project.iconUrl.src}
                  alt="Project Icon"
                  className="w-1/2 h-1/2 object-contain"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-col">
              <h4 className="text-2xl font-poppins font-semibold">
                {getProjectName(project)}
              </h4>
              <p className="mt-2 text-slate-500">
                {getProjectDescription(project)}
              </p>
              <div className="flex flex-row justify-between">
                <div className="mt-5 flex items-center gap-2 font-poppins">
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600"
                  >
                    Live Link
                  </a>

                  <img
                    src={arrow.src}
                    alt="arrow"
                    className="w-4 h-4 object-contain"
                  />
                </div>
                {getProjectStatus(project) ? (
                  <div className="mt-5 flex items-center gap-2 font-poppins">
                    <span className="font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-sm">
                      {getProjectStatus(project)}
                    </span>
                  </div>
                ) : (
                  project.github && (
                    <div className="mt-5 flex items-center gap-2 font-poppins">
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600"
                      >
                        Github
                      </a>

                      <img
                        src={github.src}
                        alt="arrow"
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <hr className="border-slate-200" />
      <CTA />
    </section>
  );
}
