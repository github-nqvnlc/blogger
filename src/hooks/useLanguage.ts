'use client';

import { useLanguageContext } from '@/contexts/LanguageContext';
import { Locale } from '@/i18n';

export function useLanguage() {
  const ctx = useLanguageContext();
  return {
    locale: ctx.locale,
    language: ctx.language,
    setLanguage: ctx.setLanguage,
    t: ctx.t,
    supportedLanguages: ctx.supportedLanguages,
    isLanguage: (lang: Locale) => ctx.language === lang,
  };
}
