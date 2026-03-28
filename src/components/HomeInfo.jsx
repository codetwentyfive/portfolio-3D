import React from "react";
import { Link } from "react-router-dom";
import { arrow } from "../assets/icons";
import { useTranslation } from "react-i18next";

const HintBox = () => {
  const { t } = useTranslation();
  return (
    <div
      className="hidden lg:block fixed bottom-28 left-1/2 -translate-x-1/2 z-40 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2.5 animate-float">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-blue-500 flex-shrink-0"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 11-6.22-8.56" />
          <path d="M21 3v5h-5" />
        </svg>
        <p className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {t("hint_drag_rotate")}
        </p>
      </div>
    </div>
  );
};

const InfoBox = ({ text, link, btnText }) => (
  <div className="info-box">
    <p className="font-medium sm:text-xl text-center">{text}</p>
    <Link 
      to={link} 
      className="neo-brutalism-white neo-btn"
      role="button"
      aria-label={btnText}
    >
      <div className="flex items-center justify-center gap-2">
        <span>{btnText}</span>
        <img
          src={arrow}
          className="w-4 h-4 object-contain"
          alt="Navigate to section"
          aria-hidden="true"
        />
      </div>
    </Link>
  </div>
);

const HomeInfo = ({ currentStage }) => {
  const { t } = useTranslation();

  const renderContent = {
    1: (
      <div role="region" aria-label="Welcome section">
        <h1 className="hero-greeting text-center greeting py-4 px-8 text-slate-900 mx-5 animated-gradient-bg rounded-2xl">
          <span className="relative z-10">
            {t("hi_message")} <span className="font-semibold">{t("name")}</span> 
            <span aria-hidden="true">👋</span>
            <br />
            {t("location")}
          </span>
        </h1>
        <HintBox />
      </div>
    ),
    2: (
      <section aria-labelledby="about-heading">
        <h2 id="about-heading" className="sr-only">About Me</h2>
        <InfoBox
          text={t("digital_nomad_message")}
          link="/about"
          btnText={t("learn_more")}
        />
      </section>
    ),
    3: (
      <section aria-labelledby="skills-heading">
        <h2 id="skills-heading" className="sr-only">My Skills</h2>
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
      </section>
    ),
    4: (
      <section aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="sr-only">Contact Me</h2>
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
      </section>
    ),
  };

  return renderContent[currentStage] || null;
};

export default HomeInfo;
