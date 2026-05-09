/**
 * ThemeContext.tsx
 *
 * AsyncStorage орнату (егер жоқ болса):
 *   npx expo install @react-native-async-storage/async-storage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { THEMES, ThemeKey, ThemeTokens } from './themes';

interface ThemeContextValue {
  theme: ThemeTokens;
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES.violet,
  themeKey: 'violet',
  setTheme: () => {},
  isDark: false,
});

const STORAGE_KEY = '@app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('violet');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved: string | null) => {
        if (saved !== null && (saved in THEMES)) {
          setThemeKey(saved as ThemeKey);
        }
      })
      .catch(console.error);
  }, []);

  const setTheme = useCallback((key: ThemeKey) => {
    setThemeKey(key);
    AsyncStorage.setItem(STORAGE_KEY, key).catch(console.error);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: THEMES[themeKey],
      themeKey,
      setTheme,
      isDark: themeKey === 'midnight',
    }),
    [themeKey, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}