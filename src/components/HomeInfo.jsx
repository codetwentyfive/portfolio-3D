import React from "react";
import { Link } from "react-router-dom";
import { arrow } from "../assets/icons";
import { useTranslation } from "react-i18next";

const HintBox = () => (
  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 animate-fade-in">
    <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-100/20 animate-float">
      <p className="text-sm text-gray-700 flex items-center gap-2">
        <span className="text-blue-500">✨</span>
        <span className="font-medium">Drag to rotate & explore</span>
      </p>
    </div>
  </div>
);

const InfoBox = ({ text, link, btnText }) => (
  <div className="info-box">
    <p className="font-medium sm:text-xl text-center">{text}</p>
    <Link to={link} className="neo-brutalism-white neo-btn">
      <div className="flex items-center justify-center gap-2">
        <span>{btnText}</span>
        <img
          src={arrow}
          className="w-4 h-4 object-contain"
          alt="Arrow icon"
        />
      </div>
    </Link>
  </div>
);

const HomeInfo = ({ currentStage }) => {
  const { t } = useTranslation();

  const renderContent = {
    1: (
      <>
        <h1 className="sm:text-xl sm:leading-snug text-center greeting py-4 px-8 text-white mx-5 animated-gradient-bg rounded-2xl">
          <span className="relative z-10">
            {t("hi_message")} <span className="font-semibold">{t("name")}</span> 👋
            <br />
            {t("location")}
          </span>
        </h1>
        <HintBox />
      </>
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
            {t("lets_build_together1")} <br />
            {t("lets_build_together2")}
          </>
        }
        link="/contact"
        btnText={t("lets_talk") + "!"}
      />
    ),
  };

  return renderContent[currentStage] || null;
};

export default HomeInfo;
