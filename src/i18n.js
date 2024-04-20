import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from '../translations/en.json';
import translationDE from '../translations/de.json';

i18n
  .use(initReactI18next) 
  .init({
    lng: 'de', 
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

export default i18n;
