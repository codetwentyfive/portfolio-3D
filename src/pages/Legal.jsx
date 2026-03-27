import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO";
import Impressum from "./Impressum";
import Privacy from "./Privacy";
import { legalConfig } from "../legal/config";

const pageCopy = {
  de: {
    kicker: "Rechtliches",
    title: "Rechtliches",
    intro:
      "Auf dieser Seite finden Sie das Impressum und die Datenschutzerklaerung fuer diese Website. Beide Bereiche bleiben klar getrennt, sind aber bewusst auf einer gemeinsamen, dezent verlinkten Seite gebuendelt.",
    reviewLabel: "Stand",
    jumpLabel: "Direkt zu",
    impressum: "Impressum",
    privacy: "Datenschutz",
  },
  en: {
    kicker: "Legal",
    title: "Legal",
    intro:
      "This page combines the legal notice and privacy policy for this website. Both parts remain clearly separated, but are intentionally bundled on one low-visibility page linked from the footer.",
    reviewLabel: "Last reviewed",
    jumpLabel: "Jump to",
    impressum: "Impressum",
    privacy: "Privacy",
  },
};

const formatReviewDate = (lang) =>
  new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-US", {
    dateStyle: "long",
  }).format(new Date(legalConfig.lastReviewed));

const Legal = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const lang = i18n.language === "en" ? "en" : "de";
  const copy = pageCopy[lang];

  useEffect(() => {
    if (!location.hash) return;

    const targetId = location.hash.slice(1);
    const timeoutId = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  return (
    <section className="max-container">
      <SEO page="legal" />

      <div className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          {copy.kicker}
        </p>
        <h1 className="mt-3 head-text">{copy.title}</h1>
        <p className="mt-5 text-base leading-7 text-slate-600">{copy.intro}</p>
        <p className="mt-4 text-sm text-slate-500">
          {copy.reviewLabel}: {formatReviewDate(lang)}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
          <span>{copy.jumpLabel}:</span>
          <a
            className="underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900"
            href="#impressum"
          >
            {copy.impressum}
          </a>
          <a
            className="underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900"
            href="#datenschutz"
          >
            {copy.privacy}
          </a>
        </div>
      </div>

      <div className="mt-12 grid gap-16">
        <Impressum embedded />
        <Privacy embedded impressumHref="/rechtliches#impressum" />
      </div>
    </section>
  );
};

export default Legal;
