import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CTA = () => {
  const { t } = useTranslation();

  return (
    <section className="cta">
      <p className="cta-text">
        {t("cta_text1")}
        <br />
        {t("cta_text2")}
      </p>
      <Link to="/contact" className="btn">
        {t("cta_button_text")}
      </Link>
    </section>
  );
};

export default CTA;
