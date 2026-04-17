import { en } from "./locales/en";
import { vi } from "./locales/vi";

export const dictionaries = { en, vi } as const;

export type Locale = keyof typeof dictionaries;
type DeepStringLeaves<T> = T extends string
  ? string
  : { [K in keyof T]: DeepStringLeaves<T[K]> };

export type Dictionary = DeepStringLeaves<typeof en>;

export const DEFAULT_LOCALE: Locale = "vi";
export const SUPPORTED_LOCALES = [
  "vi",
  "en",
] as const satisfies readonly Locale[];
export const LOCALE_COOKIE_KEY = "cds_app_locale";

export const SUPPORTED_LANGUAGES: { code: Locale; label: string }[] = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];

export function isValidLocale(
  value: string | null | undefined,
): value is Locale {
  return value === "vi" || value === "en";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isValidLocale(value) ? value : DEFAULT_LOCALE;
}

export function extractLocaleFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isValidLocale(segment) ? segment : null;
}

export function stripLocaleFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isValidLocale(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

export function buildLocalePath(locale: Locale, pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const barePath = stripLocaleFromPathname(normalizedPath);
  return barePath === "/" ? `/${locale}` : `/${locale}${barePath}`;
}

export function localizeMetadataPath(pathname: string) {
  return {
    vi: buildLocalePath("vi", pathname),
    en: buildLocalePath("en", pathname),
  };
}
