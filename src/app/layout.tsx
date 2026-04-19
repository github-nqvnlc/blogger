import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { normalizeLocale } from "@/i18n";

export const metadata: Metadata = {
  title: "Windify Blog CMS",
  description: "Windify blog administration powered by Next.js and Frappe.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const locale = normalizeLocale(headerStore.get("x-locale"));

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
