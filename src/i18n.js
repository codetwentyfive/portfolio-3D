import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from '../translations/en.json';
import translationDE from '../translations/de.json';

// Get the saved language from localStorage or default to 'de'
const savedLanguage = localStorage.getItem('language') || 'de';

i18n
  .use(initReactI18next) 
  .init({
    lng: savedLanguage,
    fallbackLng: 'de',
    resources: {
      en: {
        translation: translationEN,
      },
      de: {
        translation: translationDE,
      },
    },
    interpolation: {
      escapeValue: false, // React already does escaping
    },
  });

// Listen for language changes and save to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
