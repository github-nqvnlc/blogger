import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiProvider } from "@/lib/ApiProvider";
import { getDictionary, isValidLocale, localizeMetadataPath } from "@/i18n";

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
    <ApiProvider locale={locale} dictionary={dictionary}>
      {children}
    </ApiProvider>
  );
}
