import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { services, serviceProcess } from "@/constants/services";
import type { Locale } from "@/src/i18n/routing";

interface Props {
  params: { locale: Locale };
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale });
  return {
    title: t("services_meta_title"),
    description: t("services_meta_description"),
    alternates: {
      canonical: `https://chingis.dev/${locale}/services`,
      languages: {
        de: "https://chingis.dev/de/services",
        en: "https://chingis.dev/en/services",
        "x-default": "https://chingis.dev/de/services",
      },
    },
  };
}

const serviceIcons: Record<string, JSX.Element> = {
  "web-apps": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d="M8 6l-5 6 5 6" />
      <path d="M16 6l5 6-5 6" />
      <path d="M13.5 4l-3 16" />
    </svg>
  ),
  ecommerce: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d="M6 7h12l1.5 12.5a1 1 0 01-1 1.1H5.5a1 1 0 01-1-1.1L6 7z" />
      <path d="M9 10V6a3 3 0 016 0v4" />
    </svg>
  ),
  legacy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d="M21 12a9 9 0 11-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      <path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z" />
    </svg>
  ),
  hosting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </svg>
  ),
  "3d": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
      <path d="M12 11l8-4.5M12 11v9M12 11L4 6.5" />
    </svg>
  ),
};

const checkIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 h-3.5 w-3.5 shrink-0 text-sky-600" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default async function ServicesPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Chingis Zwecker E.",
    url: "https://chingis.dev",
    areaServed: "DE",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Karlsruhe",
      addressCountry: "DE",
    },
    makesOffer: services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.title[locale],
        description: service.description[locale],
      },
    })),
  };

  return (
    <section className="max-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="head-text">
        {t("services_heading")}{" "}
        <span className="gradient_text font-semibold drop-shadow">
          {t("services_heading_span")}
        </span>
      </h1>
      <p className="mt-5 text-slate-500 max-w-3xl">{t("services_intro")}</p>

      <div className="mt-16 grid gap-8 sm:grid-cols-2">
        {services.map((service) => (
          <div
            key={service.key}
            className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white/70 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/80 sm:p-7"
          >
            <div className="block-container w-12 h-12">
              <div className={`btn-back rounded-xl ${service.theme}`} />
              <div className="btn-front rounded-xl flex justify-center items-center text-slate-700">
                {serviceIcons[service.key]}
              </div>
            </div>
            <h2 className="mt-6 text-2xl font-poppins font-semibold text-slate-900">
              {service.title[locale]}
            </h2>
            <p className="mt-2 text-slate-500">{service.description[locale]}</p>
            <ul className="mt-5 space-y-2.5">
              {service.points[locale].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-slate-600">
                  {checkIcon}
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="py-16 mt-8">
        <h3 className="subhead-text">
          {t("services_process_heading")}{" "}
          <span className="gradient_text font-semibold">
            {t("services_process_heading_span")}
          </span>
        </h3>
        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {serviceProcess.map((step, index) => (
            <li key={step.key} className="relative flex flex-col">
              <span className="gradient_text font-poppins text-4xl font-bold tracking-[-0.05em]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h4 className="mt-3 font-poppins text-lg font-semibold text-slate-900">
                {step.title[locale]}
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {step.description[locale]}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <hr className="border-slate-200" />

      <div className="cta">
        <p className="cta-text">{t("services_cta")}</p>
        <Link href="/contact" className="btn" aria-label={t("services_cta_button")}>
          {t("services_cta_button")}
        </Link>
      </div>
    </section>
  );
}
