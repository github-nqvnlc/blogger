import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiProvider } from "@/lib/ApiProvider";
import { ThemeProviderWrapper, AuthAwareTheme } from "@/components/providers/ThemeProviderWrapper";
import { getDictionary, isValidLocale, localizeMetadataPath } from "@/i18n";
import { ConditionalGuestLayout } from "@/components/layout/conditional-guest-layout";

export function generateStaticParams() {
  return [{ locale: "vi" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const t = getDictionary(locale);

  return {
    title: {
      default: t.metadata.siteTitle,
      template: `%s | ${t.metadata.siteTitle}`,
    },
    description: t.metadata.siteDescription,
    alternates: {
      languages: localizeMetadataPath("/"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <ThemeProviderWrapper>
      <ApiProvider locale={locale} dictionary={dictionary}>
        <AuthAwareTheme />
        <ConditionalGuestLayout>{children}</ConditionalGuestLayout>
      </ApiProvider>
    </ThemeProviderWrapper>
  );
}
