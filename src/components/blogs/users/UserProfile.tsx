"use client";

import * as React from "react";
import { Monitor, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { useAuth, useGetDoc } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type UserRole = {
  role: string;
};

type UserSession = {
  name: string;
  id?: string;
  ip_address?: string;
  user_agent?: string;
  session_created?: string;
  last_updated?: string;
  is_current?: number;
};

type UserProfileDoc = {
  name: string;
  email?: string;
  full_name?: string;
  user_image?: string;
  enabled?: number;
  username?: string;
  user_type?: string;
  time_zone?: string;
  desk_theme?: string;
  notifications?: number;
  search_bar?: number;
  list_sidebar?: number;
  bulk_actions?: number;
  form_sidebar?: number;
  dashboard?: number;
  roles?: UserRole[];
  active_sessions?: UserSession[];
};

function toYesNo(value: number | undefined) {
  return value ? "On" : "Off";
}

function getInitials(value: string | undefined) {
  const text = (value ?? "").trim();
  if (!text) return "U";
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatSessionTime(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("vi-VN", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserProfile() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { data: userProfile, isLoading } = useGetDoc<UserProfileDoc>(
    "User",
    currentUser ?? undefined
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.profile.title}</CardTitle>
          <CardDescription>User profile is not available.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const settings = [
    {
      label: t.users.profile.settingsItems.enabled,
      value: toYesNo(userProfile.enabled),
      isToggle: true,
      raw: userProfile.enabled,
    },
    {
      label: t.users.profile.settingsItems.notifications,
      value: toYesNo(userProfile.notifications),
      isToggle: true,
      raw: userProfile.notifications,
    },
    {
      label: t.users.profile.settingsItems.search_bar,
      value: toYesNo(userProfile.search_bar),
      isToggle: true,
      raw: userProfile.search_bar,
    },
    {
      label: t.users.profile.settingsItems.list_sidebar,
      value: toYesNo(userProfile.list_sidebar),
      isToggle: true,
      raw: userProfile.list_sidebar,
    },
    {
      label: t.users.profile.settingsItems.bulk_actions,
      value: toYesNo(userProfile.bulk_actions),
      isToggle: true,
      raw: userProfile.bulk_actions,
    },
    {
      label: t.users.profile.settingsItems.form_sidebar,
      value: toYesNo(userProfile.form_sidebar),
      isToggle: true,
      raw: userProfile.form_sidebar,
    },
    {
      label: t.users.profile.settingsItems.dashboard,
      value: toYesNo(userProfile.dashboard),
      isToggle: true,
      raw: userProfile.dashboard,
    },
    {
      label: t.users.profile.settingsItems.desk_theme,
      value: userProfile.desk_theme || "-",
      isToggle: false,
      raw: undefined,
    },
    {
      label: t.users.profile.settingsItems.time_zone,
      value: userProfile.time_zone || "-",
      isToggle: false,
      raw: undefined,
    },
  ];

  const sortedSessions = [...(userProfile.active_sessions ?? [])].sort((a, b) => {
    const timeA = a.session_created ? new Date(a.session_created.replace(" ", "T")).getTime() : 0;
    const timeB = b.session_created ? new Date(b.session_created.replace(" ", "T")).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="space-y-6">
      <div className="">
        <h1 className="text-3xl font-bold tracking-tight">{t.users.profile.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.users.profile.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-12 bg-linear-to-r from-primary/20 to-primary/5" />
            <CardHeader className="-mt-10 items-center text-center">
              <div className="flex flex-col items-center justify-center">
                <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                  <AvatarImage
                    src={`${process.env.NEXT_PUBLIC_FRAPPE_URL || ""}${userProfile.user_image}`}
                    alt={userProfile.full_name}
                  />
                  <AvatarFallback>{getInitials(userProfile.full_name)}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-lg">{userProfile.full_name || userProfile.name}</CardTitle>
              <CardDescription className="-mt-2">{userProfile.email || "-"}</CardDescription>
              <div className="pt-1">
                <Badge
                  variant="default"
                  className="rounded-full bg-primary text-primary-foreground"
                >
                  {userProfile.enabled ? t.users.profile.On : t.users.profile.Off}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-primary/15">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t.users.profile.settings}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-1">
                    {t.users.profile.settingsDescription}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {settings.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2.5">
              {settings.map((setting, index) => (
                <div
                  key={`${setting.label}-${index}`}
                  className="flex items-center justify-between rounded-xl border bg-card/70 px-3 py-2.5"
                >
                  <span className="text-sm text-muted-foreground">{setting.label}</span>
                  {setting.isToggle ? (
                    <Badge
                      variant="outline"
                      className={`rounded-full min-w-12 justify-center border-border/60 bg-muted/40 text-muted-foreground ${setting.value === "On" ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      {setting.value === "On" ? t.users.profile.On : t.users.profile.Off}
                    </Badge>
                  ) : (
                    <span className="text-sm font-medium">{setting.value}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t.users.profile.importantInformation.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {t.users.profile.importantInformation.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {t.users.profile.importantInformation.core_identity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border bg-card/70 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  {t.users.profile.importantInformation.items.full_name}
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {userProfile.full_name || userProfile.name}
                </p>
              </div>
              <div className="rounded-xl border bg-card/70 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  {t.users.profile.importantInformation.items.username}
                </p>
                <p className="mt-1 text-sm font-semibold">{userProfile.username || "-"}</p>
              </div>
              <div className="rounded-xl border bg-card/70 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  {t.users.profile.importantInformation.items.email}
                </p>
                <p className="mt-1 text-sm font-semibold">{userProfile.email || "-"}</p>
              </div>
              <div className="rounded-xl border bg-card/70 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  {t.users.profile.importantInformation.items.user_type}
                </p>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/60 bg-muted/40 text-muted-foreground"
                  >
                    {userProfile.user_type || "-"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t.users.profile.roles.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {t.users.profile.roles.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {(userProfile.roles?.length ?? 0).toString()} roles
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2.5 max-h-[150px] overflow-y-auto">
                {userProfile.roles?.length ? (
                  userProfile.roles.map(item => (
                    <Badge
                      key={item.role}
                      variant="outline"
                      className="rounded-full border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      {item.role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">{t.users.profile.roles.no_role_assigned}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.users.profile.active_sessions.title}</CardTitle>
              <CardDescription className="mt-1">
                {t.users.profile.active_sessions.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedSessions.length ? (
                <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                  {sortedSessions.map(session => (
                    <div
                      key={session.name}
                      className="rounded-xl border bg-card/70 p-4 shadow-sm transition-colors hover:bg-muted/20"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {session.id || session.name}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {session.user_agent || "-"}
                          </p>
                        </div>
                        {session.is_current ? (
                          <Badge
                            variant="outline"
                            className="rounded-full bg-primary text-primary-foreground"
                          >
                            {t.users.profile.active_sessions.current}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-full border-border/60 bg-muted/30 text-muted-foreground"
                          >
                            {t.users.profile.active_sessions.active}
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-2 text-xs sm:grid-cols-3">
                        <div className="rounded-md border bg-muted/30 px-2.5 py-2">
                          <p className="mb-1 flex items-center gap-1 text-muted-foreground">
                            <Wifi className="h-3.5 w-3.5" />
                            IP Address
                          </p>
                          <p className="font-medium">{session.ip_address || "-"}</p>
                        </div>
                        <div className="rounded-md border bg-muted/30 px-2.5 py-2">
                          <p className="mb-1 flex items-center gap-1 text-muted-foreground">
                            <Monitor className="h-3.5 w-3.5" />
                            Created
                          </p>
                          <p className="font-medium">
                            {formatSessionTime(session.session_created)}
                          </p>
                        </div>
                        <div className="rounded-md border bg-muted/30 px-2.5 py-2">
                          <p className="mb-1 flex items-center gap-1 text-muted-foreground">
                            <Smartphone className="h-3.5 w-3.5" />
                            Last Updated
                          </p>
                          <p className="font-medium">{formatSessionTime(session.last_updated)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Badge variant="outline">No active session</Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
