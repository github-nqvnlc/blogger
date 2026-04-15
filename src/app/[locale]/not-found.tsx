"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Search, MessageSquare } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";

export default function NotFoundPage() {
  const { locale, t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
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
            {t.errors.notFoundDescription}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href={buildLocalePath(locale, "/")}>
              <Home className="size-4 mr-2" />
              {t.common.backHome}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={buildLocalePath(locale, "/admin")}>
              <ArrowLeft className="size-4 mr-2" />
              {t.common.backAdmin}
            </Link>
          </Button>
        </div>

        <div className="border-t pt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            {t.errors.notFoundHint}
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center justify-center gap-2">
              <Search className="size-3" />
              {t.common.checkUrl}
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
