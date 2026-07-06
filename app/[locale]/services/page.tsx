import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { services } from "@/constants/services";
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

      <div className="mt-16 grid gap-12 sm:grid-cols-2">
        {services.map((service) => (
          <div key={service.key} className="flex flex-col">
            <div className="block-container w-12 h-12">
              <div className={`btn-back rounded-xl ${service.theme}`} />
              <div className="btn-front rounded-xl flex justify-center items-center">
                <span className="gradient_text font-poppins font-bold text-lg">
                  {service.title[locale].charAt(0)}
                </span>
              </div>
            </div>
            <h2 className="mt-5 text-2xl font-poppins font-semibold text-slate-900">
              {service.title[locale]}
            </h2>
            <p className="mt-2 text-slate-500">{service.description[locale]}</p>
            <ul className="mt-4 list-disc ml-5 space-y-2">
              {service.points[locale].map((point) => (
                <li key={point} className="text-black-500/50 font-normal pl-1 text-sm">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <hr className="mt-16 border-slate-200" />

      <div className="cta">
        <p className="cta-text">
          {t("services_cta")}
        </p>
        <Link href="/contact" className="btn" aria-label={t("services_cta_button")}>
          {t("services_cta_button")}
        </Link>
      </div>
    </section>
  );
}
