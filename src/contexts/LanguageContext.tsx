"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  buildLocalePath,
  Dictionary,
  Locale,
  LOCALE_COOKIE_KEY,
  SUPPORTED_LANGUAGES,
  isValidLocale,
} from "@/i18n";

interface LanguageContextValue {
  language: Locale;
  locale: Locale;
  setLanguage: (lang: Locale) => void;
  t: Dictionary;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  locale,
  dictionary,
}: {
  children: React.ReactNode;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const setLanguage = useCallback(
    (lang: Locale) => {
      if (!isValidLocale(lang)) return;
      const nextPath = buildLocalePath(lang, pathname || "/");
      document.cookie = `${LOCALE_COOKIE_KEY}=${lang}; path=/; max-age=31536000; samesite=lax`;
      router.push(nextPath);
    },
    [pathname, router],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language: locale,
      locale,
      setLanguage,
      t: dictionary,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [dictionary, locale, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguageContext must be used inside LanguageProvider");
  }
  return ctx;
}
