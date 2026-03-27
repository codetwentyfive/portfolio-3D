import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { legalConfig } from "../legal/config";

const SiteFooter = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const year = new Date().getFullYear();
  const isContactPage = location.pathname === "/contact";

  return (
    <footer
      className={`footer text-sm font-poppins relative z-[60] ${
        isContactPage ? "footer-contact-bg" : "footer-default-bg"
      }`}
      role="contentinfo"
    >
      <div className="footer-container footer-animated border-t border-white/20 pt-6 font-medium">
        <p className="text-white/95 text-sm leading-normal font-semibold tracking-[0.01em]">
          &copy; {year} {legalConfig.operator.name}
        </p>
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:w-auto">
          <a
            className="text-white/90 font-medium transition-colors hover:text-white"
            href={`mailto:${legalConfig.operator.email}`}
          >
            {legalConfig.operator.email}
          </a>
          <Link
            className="font-semibold tracking-[0.01em] text-white/90 transition-colors hover:text-white"
            to="/rechtliches#impressum"
          >
            {t("impressum")}
          </Link>
          <Link
            className="font-semibold tracking-[0.01em] text-white/90 transition-colors hover:text-white"
            to="/rechtliches#datenschutz"
          >
            {t("privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
