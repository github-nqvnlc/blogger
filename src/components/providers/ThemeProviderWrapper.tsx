"use client";

import { useSyncExternalStore } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

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

export function ThemeProviderWrapper({ children }: ThemeProviderWrapperProps) {
  const mounted = useMounted();

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </NextThemesProvider>
  );
}
