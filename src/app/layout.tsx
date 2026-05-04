import type { Metadata } from "next";
import { headers } from "next/headers";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { normalizeLocale } from "@/i18n";

const openSans = Open_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-open-sans",
  display: "swap",
});

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
    <html lang={locale} suppressHydrationWarning className={openSans.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
