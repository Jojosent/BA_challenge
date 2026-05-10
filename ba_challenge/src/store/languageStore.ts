import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import { create } from 'zustand';

type Language = 'ru' | 'kz' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

const LANGUAGE_KEY = 'app_language';

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'ru',

  setLanguage: async (language) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
    set({ language });
  },

  loadLanguage: async () => {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

    if (savedLanguage === 'ru' || savedLanguage === 'kz' || savedLanguage === 'en') {
      await i18n.changeLanguage(savedLanguage);
      set({ language: savedLanguage });
    }
  },
}));