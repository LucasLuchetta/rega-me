import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import pt from './plants_pt.json';
import en from './plants_en.json';

const resources = {
  pt: { translation: pt },
  en: { translation: en },
};

const getLanguage = () => {
    // Tenta pegar a linguagem do dispositivo. Fallback para 'pt'.
    // expo-localization retorna uma lista de locales
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
        return locales[0].languageCode ?? 'pt';
    }
    return 'pt';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getLanguage(), // Detecta idioma do sistema
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
