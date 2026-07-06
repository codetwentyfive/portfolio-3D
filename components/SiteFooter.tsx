"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/src/i18n/navigation";
import { legalConfig } from "@/legal/config";

const SiteFooter = () => {
  const t = useTranslations();
  const pathname = usePathname();
  const year = new Date().getFullYear();
  const isContactPage = pathname === "/contact";

  return (
    <footer
      className={`footer text-sm font-poppins relative z-[60] ${
        isContactPage ? "footer-contact-bg" : "footer-default-bg"
      }`}
      role="contentinfo"
    >
      <div className="footer-container footer-animated pt-6 font-medium">
        <p className="text-slate-700 text-sm leading-normal font-semibold tracking-[0.01em]">
          &copy; {year} {legalConfig.operator.name}
        </p>
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:w-auto">
          <a
            className="text-slate-600 font-medium transition-colors hover:text-sky-700"
            href={`mailto:${legalConfig.operator.email}`}
          >
            {legalConfig.operator.email}
          </a>
          <Link
            className="font-semibold tracking-[0.01em] text-slate-600 transition-colors hover:text-sky-700"
            href="/rechtliches#impressum"
          >
            {t("impressum")}
          </Link>
          <Link
            className="font-semibold tracking-[0.01em] text-slate-600 transition-colors hover:text-sky-700"
            href="/rechtliches#datenschutz"
          >
            {t("privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
