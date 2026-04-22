"use client";

import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/hooks/useAuth";
import { useMounted } from "@/hooks/useMounted";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const THEME_MAP_TO_SERVER: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  system: "Automatic",
};

const THEME_MAP_FROM_SERVER: Record<string, string> = {
  Light: "light",
  Dark: "dark",
};

function LanguageSetting() {
  const { locale, setLanguage, t } = useLanguage();
  const { currentUser } = useAuth();
  const { updateSettings, isSaving } = useUserSettings(currentUser);

  const handleChange = (value: string) => {
    setLanguage(value as "vi" | "en");
    updateSettings({ language: value });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{t.settings.language}</Label>
        <p className="text-sm text-muted-foreground">{t.settings.languageDescription}</p>
      </div>
      <div className="flex items-center gap-2">
        {isSaving && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        <Select value={locale} onValueChange={handleChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map(lang => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ThemeSetting() {
  const { t, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { currentUser } = useAuth();
  const { data: settings, updateSettings, isSaving } = useUserSettings(currentUser);
  const mounted = useMounted();

  useEffect(() => {
    if (!settings) return;
    if (settings.desk_theme) {
      const mapped = THEME_MAP_FROM_SERVER[settings.desk_theme] ?? "light";
      setTheme(mapped);
    }
    if (settings.language) {
      setLanguage(settings.language as "vi" | "en");
    }
  }, [settings, setTheme, setLanguage]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{t.settings.theme}</Label>
          <p className="text-sm text-muted-foreground">{t.settings.themeDescription}</p>
        </div>
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
    );
  }

  const handleChange = (value: string) => {
    setTheme(value);
    updateSettings({ desk_theme: THEME_MAP_TO_SERVER[value] });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{t.settings.theme}</Label>
        <p className="text-sm text-muted-foreground">{t.settings.themeDescription}</p>
      </div>
      <div className="flex items-center gap-2">
        {isSaving && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        <Select value={theme} onValueChange={handleChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">{t.settings.themeLight}</SelectItem>
            <SelectItem value="dark">{t.settings.themeDark}</SelectItem>
            <SelectItem value="system">{t.settings.themeSystem}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.settings.title}</h1>
        <p className="text-muted-foreground mt-1">{t.settings.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.appearance}</CardTitle>
          <CardDescription>{t.settings.appearanceDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LanguageSetting />
          <Separator />
          <ThemeSetting />
        </CardContent>
      </Card>
    </div>
  );
}
