import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  TranslationKey,
  TranslationParams,
  translations,
} from './index';

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const STORAGE_LANGUAGE = 'tttracker.language';

const I18nContext = createContext<I18nContextValue | null>(null);

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'de' || value === 'en';
}

function readTranslation(key: TranslationKey, language: AppLanguage) {
  const segments = key.split('.');
  let current: unknown = translations[language];

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = params[name];
    return value === null || value === undefined ? match : String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    let active = true;

    async function loadLanguage() {
      const storedLanguage = await AsyncStorage.getItem(STORAGE_LANGUAGE);

      if (!active) return;

      setLanguageState(isAppLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE);
    }

    loadLanguage().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,

      async setLanguage(nextLanguage) {
        const resolvedLanguage = isAppLanguage(nextLanguage) ? nextLanguage : DEFAULT_LANGUAGE;
        setLanguageState(resolvedLanguage);
        await AsyncStorage.setItem(STORAGE_LANGUAGE, resolvedLanguage);
      },

      t(key, params) {
        const translated =
          readTranslation(key, language) ??
          readTranslation(key, DEFAULT_LANGUAGE) ??
          key;

        return interpolate(translated, params);
      },
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }

  return context;
}
