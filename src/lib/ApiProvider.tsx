"use client";

import React, { createContext, useContext, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createApiClient } from "./apiClient";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Dictionary, Locale } from "@/i18n";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface ApiContextValue {
  url: string;
}

const url = process.env.NEXT_PUBLIC_FRAPPE_URL ?? "";

const ApiContext = createContext<ApiContextValue | null>(null);
const ADMIN_ACCESS_NOTICE_COOKIE = "admin_access_notice";
const ADMIN_ACCESS_NOTICE_TOAST_ID = "admin-access-required";
let adminAccessNoticeConsumed = false;

export const queryClient = new QueryClient({
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

function getCookieValue(key: string): string | null {
  const match = document.cookie
    .split("; ")
    .find(row => row.startsWith(`${encodeURIComponent(key)}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function clearCookie(key: string) {
  document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
}

function AdminAccessNoticeToast() {
  const { t } = useLanguage();

  useEffect(() => {
    if (getCookieValue(ADMIN_ACCESS_NOTICE_COOKIE) !== "admin_required") return;
    if (adminAccessNoticeConsumed) return;

    adminAccessNoticeConsumed = true;
    clearCookie(ADMIN_ACCESS_NOTICE_COOKIE);
    window.requestAnimationFrame(() => {
      toast.warning(t.home.adminRequiredToast, {
        id: ADMIN_ACCESS_NOTICE_TOAST_ID,
      });
    });
  }, [t.home.adminRequiredToast]);

  return null;
}

export function ApiProvider({ children, locale, dictionary }: ApiProviderProps) {
  useEffect(() => {
    createApiClient();
  }, []);

  return (
    <ApiContext.Provider value={{ url }}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider locale={locale} dictionary={dictionary}>
          {children}
          <Toaster position="top-center" />
          <AdminAccessNoticeToast />
        </LanguageProvider>
      </QueryClientProvider>
    </ApiContext.Provider>
  );
}

export function useApiContext(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) {
    throw new Error("useApiContext must be used inside <ApiProvider>.");
  }
  return ctx;
}
