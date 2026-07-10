"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useAuth } from "@/hooks";

interface ThemeProviderWrapperProps {
  children: React.ReactNode;
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function AuthAwareTheme() {
  const { currentUser, isLoading } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (isLoading) return;
    if (currentUser) return;
    setTheme("light");
  }, [currentUser, isLoading, setTheme]);

  return null;
}

export function ThemeProviderWrapper({ children }: ThemeProviderWrapperProps) {
  const mounted = useMounted();

  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </NextThemesProvider>
  );
}
