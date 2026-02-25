import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Locale, TranslationKey, messages } from './messages';

const LANGUAGE_STORAGE_KEY = 'ai-smart-trader.language';

type TranslationParams = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return getStoredLanguage();
  });

  const setLocale = useCallback((nextLocale: Locale): void => {
    setLocaleState(nextLocale);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams): string => {
      const dict = messages[locale] as Record<TranslationKey, string>;
      const fallback = messages.fr as Record<TranslationKey, string>;
      const template = dict[key] ?? fallback[key];
      if (!params) {
        return template;
      }
      return Object.entries(params).reduce((current, [name, value]) => {
        return current.replaceAll(`{${name}}`, String(value));
      }, template);
    },
    [locale],
  );

  const context = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale,
      t,
    };
  }, [locale, setLocale, t]);

  return <I18nContext.Provider value={context}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider.');
  }
  return context;
}

export function normalizeLanguage(value: string | null | undefined): Locale {
  if (value === 'en') {
    return 'en';
  }
  return 'fr';
}

export function getStoredLanguage(): Locale {
  return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
}
