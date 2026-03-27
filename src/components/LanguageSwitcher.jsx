import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const languageFlags = {
  de: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 rounded-full" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#ffce00" />
      <path d="M0 0h24v8H0z" fill="#000" />
      <path d="M0 8h24v8H0z" fill="#dd0000" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 rounded-full" aria-hidden="true">
      <defs>
        <clipPath id="language-switcher-uk-flag">
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath="url(#language-switcher-uk-flag)">
        <rect width="24" height="24" fill="#012169" />
        <path d="M0 0l24 24M24 0L0 24" stroke="#fff" strokeWidth="6" />
        <path d="M0 0l24 24M24 0L0 24" stroke="#c8102e" strokeWidth="3" />
        <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="8" />
        <path d="M12 0v24M0 12h24" stroke="#c8102e" strokeWidth="4" />
      </g>
    </svg>
  ),
};

const languageLabels = {
  de: "German",
  en: "English",
};

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(
    i18n.resolvedLanguage || localStorage.getItem("language") || "de"
  );

  useEffect(() => {
    // Update the language if it changes from another component
    const handleLanguageChange = (lng) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const selectedLanguage = currentLanguage === "en" ? "en" : "de";
  const nextLanguage = selectedLanguage === "en" ? "de" : "en";

  const toggleLanguage = () => {
    const newLanguage = selectedLanguage === "en" ? "de" : "en";
    i18n.changeLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
  };

  return (
    <div className="relative inline-block mx-2">
      <button
        type="button"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-md"
        onClick={toggleLanguage}
        aria-label={`Current language: ${languageLabels[selectedLanguage]}. Switch to ${languageLabels[nextLanguage]}.`}
      >
        {languageFlags[selectedLanguage]}
      </button>
    </div>
  );
}

export default LanguageSwitcher;
