import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import kz from './locales/kz.json';
import ru from './locales/ru.json';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'ru';
const supportedLang = ['en', 'ru', 'kz'].includes(deviceLang) ? deviceLang : 'ru';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    kz: { translation: kz },
  },
  lng: supportedLang,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
});

export default i18n;