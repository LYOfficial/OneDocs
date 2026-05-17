import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';

const STORAGE_KEY = 'onedocs.language';

const resolveInitialLanguage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  const browserLanguage = navigator.language || 'en';
  return browserLanguage.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-CN': { translation: zhCN },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'zh-CN'],
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
