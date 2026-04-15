'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { createApiClient } from './apiClient';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Dictionary, Locale } from '@/i18n';

interface ApiContextValue {
  url: string;
}

const url = process.env.NEXT_PUBLIC_FRAPPE_URL ?? '';

const ApiContext = createContext<ApiContextValue | null>(null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

interface ApiProviderProps {
  children: React.ReactNode;
  locale: Locale;
  dictionary: Dictionary;
}

export function ApiProvider({ children, locale, dictionary }: ApiProviderProps) {
  useMemo(() => {
    createApiClient();
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ApiContext.Provider value={{ url }}>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider locale={locale} dictionary={dictionary}>
            {children}
          </LanguageProvider>
        </QueryClientProvider>
      </ApiContext.Provider>
    </NextThemesProvider>
  );
}

export function useApiContext(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) {
    throw new Error('useApiContext must be used inside <ApiProvider>.');
  }
  return ctx;
}
