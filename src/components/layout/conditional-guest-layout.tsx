"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { GuestLayout } from "@/components/layout/guest-layout";
import { usePrefetchGuestMetadata } from "@/hooks/useGuestMetadata";

function GuestLayoutWithPrefetch({ children }: { children: React.ReactNode }) {
  usePrefetchGuestMetadata();
  return <GuestLayout>{children}</GuestLayout>;
}

export function ConditionalGuestLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pathSegments = pathname?.split("/").filter(Boolean) ?? [];
  const isAdmin = pathSegments[1] === "admin";
  const isLogin = pathSegments.length === 2 && pathSegments[1] === "login";
  const isDev = pathSegments[1] === "dev";

  if (isAdmin || isLogin || isDev) {
    return <>{children}</>;
  }

  return <GuestLayoutWithPrefetch>{children}</GuestLayoutWithPrefetch>;
}
