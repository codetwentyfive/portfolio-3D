"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import {
  skills,
  experiences,
  type LocalizedText,
  type Locale,
} from "@/constants";
import CTA from "@/components/CTA";
import { Link } from "@/src/i18n/navigation";

const featuredWork = [
  { key: "denkpause", href: "/projects/denkpause" },
  { key: "assistant", href: "/blog/self-hosted-ai-assistant" },
] as const;

export default function AboutContent() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const translate = (text: LocalizedText) => text[locale] || text.en;

  return (
    <section className="max-container">
      <p className="editorial-kicker mb-6">{t("editorial.about")}</p>
      <h1 className="head-text">
        {t("greeting_about")} <span className="editorial-accent">Chingis Zwecker E.</span>
      </h1>
      <div className="editorial-intro mt-8 space-y-5">
        <p>{t("short_intro")}</p>
        <p>{t("about_work_intro")}</p>
      </div>

      <section className="mt-12" aria-labelledby="about-work-heading">
        <h2 id="about-work-heading" className="editorial-kicker">
          {t("about_work.heading")}
        </h2>
        <ul className="mt-5 grid gap-x-10 sm:grid-cols-2">
          {featuredWork.map(({ key, href }) => (
            <li key={key} className="border-t border-slate-300 py-6">
              <h3 className="font-display text-2xl font-semibold">
                <Link
                  href={href}
                  className="underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  {t(`about_work.${key}.title`)} <span aria-hidden="true">→</span>
                </Link>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {t(`about_work.${key}.description`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 border-t border-slate-300 pt-8">
        <h2 className="subhead-text">{t("my_skills")}</h2>
        <div className="mt-10 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-4">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex min-h-[86px] items-center gap-4 border-b border-slate-200 py-4"
            >
              <Image
                src={skill.imageUrl}
                alt=""
                width={30}
                height={30}
                className="h-[30px] w-[30px] object-contain"
              />
              <span className="text-xs tracking-wide">{skill.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="editorial-intro space-y-4">
          <p>{t("timeline_description1")}</p>
          <p>{t("timeline_description2")}</p>
          <p>{t("timeline_description3")}</p>
        </div>
        <h2 className="subhead-text mb-10 mt-16">{t("timeline")}</h2>
        <ol>
          {experiences.map((experience, index) => (
            <li
              key={`${translate(experience.title)}_${index}`}
              className="grid gap-5 border-t border-slate-300 py-9 md:grid-cols-[190px_1fr] md:gap-12"
            >
              <p className="editorial-kicker pt-2">
                {translate(experience.date)}
              </p>
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0 break-words">
                    <h3 className="font-display text-3xl font-semibold leading-tight tracking-[-0.01em]">
                      {translate(experience.title)}
                    </h3>
                    <p className="mt-2 text-xs uppercase tracking-[0.1em] text-slate-500">
                      {translate(experience.company_name)}
                    </p>
                  </div>
                  <Image
                    src={experience.icon}
                    alt=""
                    width={38}
                    height={38}
                    className="h-[38px] w-[38px] shrink-0 object-contain"
                  />
                </div>
                <ul className="mt-6 max-w-[660px] space-y-3 text-sm leading-relaxed text-slate-600">
                  {experience.points.map((point, pointIndex) => (
                    <li
                      key={pointIndex}
                      className="border-l border-slate-300 pl-4"
                    >
                      {translate(point)}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <hr className="border-slate-300" />
      <CTA />
    </section>
  );
}
