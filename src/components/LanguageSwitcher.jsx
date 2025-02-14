import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem('language') || 'de');

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

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === "en" ? "de" : "en";
    i18n.changeLanguage(newLanguage);
    setCurrentLanguage(newLanguage);
  };

  return (
    <div className="relative inline-block bg-white shadow-md rounded-full w-8 h-8 mx-2">
      <button 
        className="flex cursor-pointer" 
        onClick={toggleLanguage}
        aria-label={`Switch to ${currentLanguage === "de" ? "English" : "German"}`}
      >
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {currentLanguage === "de" ? "🇬🇧" : "🇩🇪"}
        </span>
      </button>
    </div>
  );
}

export default LanguageSwitcher;
