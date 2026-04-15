"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  LayoutDashboard,
  Search,
  MessageSquare,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";

export default function AdminNotFoundPage() {
  const { locale, t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center size-20 rounded-full bg-muted">
              <span className="text-4xl font-bold text-muted-foreground">
                404
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t.errors.notFoundTitle}
          </h1>
          <p className="text-muted-foreground text-base">
            {t.errors.adminNotFoundDescription}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href={buildLocalePath(locale, "/admin")}>
              <LayoutDashboard className="size-4 mr-2" />
              {t.common.backDashboard}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={buildLocalePath(locale, "/")}>
              <ArrowLeft className="size-4 mr-2" />
              {t.common.backHome}
            </Link>
          </Button>
        </div>

        <div className="border-t pt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            {t.errors.adminNotFoundHint}
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center justify-center gap-2">
              <Search className="size-3" />
              {t.errors.adminSidebarAccess}
            </li>
            <li className="flex items-center justify-center gap-2">
              <ArrowLeft className="size-3" />
              {t.common.goBack}
            </li>
            <li className="flex items-center justify-center gap-2">
              <MessageSquare className="size-3" />
              {t.common.contactSupport}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
