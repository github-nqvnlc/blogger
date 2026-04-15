"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@/lib/apiClient";
import {
  buildLocalePath,
  extractLocaleFromPathname,
  normalizeLocale,
} from "@/i18n";

export interface FrappeUser {
  name: string;
  full_name: string;
  user_image?: string;
  email?: string;
  roles?: string[];
}

interface FrappeLoginResponse {
  message: string;
  home_page: string;
  full_name: string;
}

const AUTH_QUERY_KEY = ["auth", "currentUser"];

export function useAuth() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  const getCurrentLocale = useCallback(() => {
    if (typeof window === "undefined") return normalizeLocale(null);
    return normalizeLocale(extractLocaleFromPathname(window.location.pathname));
  }, []);

  const {
    data: currentUser,
    isLoading,
    isFetching: isValidating,
    error,
    refetch,
  } = useQuery<string | null, Error>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ message: string }>(
          "/api/method/frappe.auth.get_logged_user",
        );
        const user = res.data?.message;
        return user && user !== "Guest" ? user : null;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } }).response
          ?.status;
        if (
          (status === 401 || status === 403) &&
          typeof window !== "undefined"
        ) {
          const locale = getCurrentLocale();
          const loginPath = buildLocalePath(locale, "/login");
          if (!window.location.pathname.startsWith(loginPath)) {
            window.location.href = loginPath;
          }
        }
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const login = useCallback(
    async (usr: string, pwd: string): Promise<FrappeLoginResponse> => {
      const res = await apiClient.post<FrappeLoginResponse>(
        "/api/method/login",
        { usr, pwd },
      );
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      return res.data;
    },
    [apiClient, queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/api/method/logout");
    } finally {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();
      if (typeof window !== "undefined") {
        const locale = getCurrentLocale();
        window.location.href = buildLocalePath(locale, "/login");
      }
    }
  }, [apiClient, getCurrentLocale, queryClient]);

  const updateCurrentUser = useCallback(() => {
    refetch();
  }, [refetch]);

  const getUserCookie = useCallback(() => {
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
  }, [queryClient]);

  return {
    currentUser: currentUser ?? null,
    isLoading,
    isValidating,
    error,
    login,
    logout,
    updateCurrentUser,
    getUserCookie,
  };
}
