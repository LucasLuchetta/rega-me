import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './pt.json';

// O app é publicado apenas em português. Fixar o idioma evita telas
// meio traduzidas quando o aparelho está configurado em outra língua.
export const APP_LOCALE = 'pt-BR';

i18n
  .use(initReactI18next)
  .init({
    resources: { pt: { translation: pt } },
    lng: 'pt',
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
