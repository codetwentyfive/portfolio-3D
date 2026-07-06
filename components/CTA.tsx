"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";

const CTA = () => {
  const t = useTranslations();

  return (
    <section className="cta">
      <p className="cta-text">
        {t("cta_text1")}
        <br />
        {t("cta_text2")}
      </p>
      <Link href="/contact" className="btn">
        {t("cta_button_text")}
      </Link>
    </section>
  );
};

export default CTA;
