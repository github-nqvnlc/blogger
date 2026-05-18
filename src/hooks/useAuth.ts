"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@/lib/apiClient";
import { buildLocalePath, normalizeLocale } from "@/i18n";

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
    return normalizeLocale(window.location.pathname.split("/")[1] || null);
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
          "/api/method/frappe.auth.get_logged_user"
        );
        const user = res.data?.message;
        // console.error("res: ", res);
        // Guest is now a valid role — return as-is instead of null
        return user ?? null;
      } catch (err: unknown) {
        // 403 = guest/unauthenticated — expected, not an error worth logging
        const status = (err as { response?: { status?: number } })?.response?.status;
        const message = (err as Error)?.message ?? "";
        const isGuestError =
          status === 403 ||
          message.includes("not whitelisted") ||
          message.includes("not permitted");

        if (!isGuestError) {
          console.error("[useAuth] unexpected error:", err);
        }

        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const login = useCallback(
    async (usr: string, pwd: string): Promise<FrappeLoginResponse> => {
      const res = await apiClient.post<FrappeLoginResponse>("/api/method/login", { usr, pwd });
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      return res.data;
    },
    [apiClient, queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/api/method/logout");
    } finally {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();
      if (typeof window !== "undefined") {
        const locale = getCurrentLocale();
        window.location.href = buildLocalePath(locale, "/");
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
