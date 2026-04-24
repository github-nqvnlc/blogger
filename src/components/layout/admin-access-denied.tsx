"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { ArrowLeft, LayoutDashboard, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface AdminAccessDeniedProps {
  description: string;
  title?: string;
}

export function AdminAccessDenied({ description, title }: AdminAccessDeniedProps) {
  const { locale, t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md space-y-6 text-center">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="inline-flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-10" />
            </div>
          </div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">
            {title ?? t.errors.accessDeniedTitle}
          </h1>
          <p className="text-base text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href={buildLocalePath(locale, "/admin")}>
              <LayoutDashboard className="mr-2 size-4" />
              {t.common.backDashboard}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={buildLocalePath(locale, "/")}>
              <ArrowLeft className="mr-2 size-4" />
              {t.common.backHome}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
