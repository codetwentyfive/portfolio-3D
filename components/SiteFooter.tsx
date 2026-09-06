"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { legalConfig } from "@/legal/config";

export default function SiteFooter() {
  const t = useTranslations();
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div>
          <p className="footer-wordmark">
            Chingis<span className="ml-1 text-accent">/</span>
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-slate-500">
            &copy; {new Date().getFullYear()} {legalConfig.operator.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] text-slate-600">
          <a
            href={`mailto:${legalConfig.operator.email}`}
            className="min-h-11 content-center hover:text-accent"
          >
            {legalConfig.operator.email}
          </a>
          <Link
            href="/rechtliches#impressum"
            className="min-h-11 content-center hover:text-accent"
          >
            {t("impressum")}
          </Link>
          <Link
            href="/rechtliches#datenschutz"
            className="min-h-11 content-center hover:text-accent"
          >
            {t("privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
