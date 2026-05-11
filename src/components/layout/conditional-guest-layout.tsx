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
  const isAdmin = pathname?.includes("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return <GuestLayoutWithPrefetch>{children}</GuestLayoutWithPrefetch>;
}
