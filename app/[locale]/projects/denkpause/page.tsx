import JsonLd from "@/components/JsonLd";
import { createWebPageSchema, createBreadcrumbSchema } from "@/seo/structured-data";
import DenkpauseViewer from "@/components/scenes/DenkpauseViewer";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { buildPageMetadata } from "@/seo/metadata";
import type { Locale } from "@/src/i18n/routing";

type Props = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: Props) {
  return buildPageMetadata("denkpause", (await params).locale);
}
export default async function DenkpauseCase({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [d, c] = await Promise.all([getTranslations({locale, namespace: "denkpause"}), getTranslations({locale, namespace: "denkpauseCase"})]);
  const decisions = c.raw("decisions") as {title: string; text: string}[];
  const flow = c.raw("flow") as string[];
  return <article className="max-container denkpause-case">
    <JsonLd schemas={[createWebPageSchema("denkpause", locale), createBreadcrumbSchema("denkpause", locale)]} />
    <header className="case-hero">
      <p className="editorial-kicker">{d("discipline")}</p>
      <h1 className="head-text">denk.pause</h1>
      <p className="case-purpose">{d("purpose")}</p>
      <p className="case-ownership">{d("ownership")}</p>
      <p>{d("role")} · {c("period")}</p>
      <p>{d("stage")}<br/><span className="case-date">{c("reviewed")}</span></p>
      <a href="https://web.denkpause.app" target="_blank" rel="noopener noreferrer" className="studio-open">{d("openApp")} ↗</a>
      <span className="case-date">{d("phoneNote")}</span>
    </header>
    <DenkpauseViewer />
    <section><h2>{c("problemTitle")}</h2><p>{c("problem")}</p></section>
    <section><h2>{c("architectureTitle")}</h2>
      <ol className="case-flow" aria-label={c("architectureTitle")}>{flow.map((label, i) => <li key={label}><span>{String(i + 1).padStart(2, "0")}</span>{label}{i < flow.length - 1 && <b aria-hidden="true">→</b>}</li>)}</ol>
      <p className="case-date">{c("architectureNote")}</p>
    </section>
    <section><h2>{c("decisionsTitle")}</h2><div className="case-decisions">{decisions.map(decision => <section key={decision.title}><h3>{decision.title}</h3><p>{decision.text}</p></section>)}</div></section>
    {(["results", "quality"] as const).map(key => <section key={key}><h2>{c(`${key}Title`)}</h2><p>{c(key)}</p></section>)}
    <footer className="case-contact"><Link href="/contact" className="studio-open">{c("contact")} ↗</Link><Link href="/projects">{c("more")} →</Link></footer>
  </article>;
}
