import React from "react";
import { Link } from "react-router-dom";
import { arrow } from "../assets/icons";
import { useTranslation } from "react-i18next";

const InfoBox = ({ text, link, btnText }) => (
  <div className="info-box">
    <p className="font-medium sm:text-xl text-center">{text}</p>
    <Link to={link} className="neo-brutalism-white neo-btn">
      {btnText}
      <img
        src={arrow}
        className="w-4 h-4 object-contain arrow"
        alt="Arrow icon"
      />
      <p className="exclamation-mark">!</p>
    </Link>
  </div>
);

const HomeInfo = ({ currentStage }) => {
  const { t } = useTranslation();

  const renderContent = {
    1: (
      <h1 className="sm:text-xl sm:leading-snug text-center neo-brutalism-blue py-4 px-8 text-white mx-5">
        {t("hi_message")} <span className="font-semibold">{t("name")}</span> 👋
        <br />
        {t("location")}
      </h1>
    ),
    2: (
      <InfoBox
        text={t("digital_nomad_message")}
        link="/about"
        btnText={t("learn_more")}
      />
    ),
    3: (
      <InfoBox
        text={
          <>
            {t("skills_message1")}
            <br />
            {t("skills_message2")}
          </>
        }
        link="/projects"
        btnText={t("visit_portfolio")}
      />
    ),
    4: (
      <InfoBox
        text={
          <>
            {t("lets_build_together1")}
            <br />
            {t("lets_build_together2")}
          </>
        }
        link="/contact"
        btnText={t("lets_talk")}
      />
    ),
  };

  return renderContent[currentStage] || null;
};

export default HomeInfo;
