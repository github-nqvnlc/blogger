import type { Metadata } from "next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  AdminSidebar,
  AdminSidebarInset,
} from "@/components/layout/admin-sidebar";
import { AdminBreadcrumb } from "@/components/layout/admin-breadcrumb";
import { getDictionary, isValidLocale, localizeMetadataPath } from "@/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const t = getDictionary(locale);

  return {
    title: t.metadata.adminTitle,
    description: t.metadata.adminDescription,
    alternates: {
      languages: localizeMetadataPath("/admin"),
    },
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={true}>
        <AdminSidebar />
        <AdminSidebarInset>
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:flex hidden" />
            <AdminBreadcrumb />
          </div>
          <div className="lg:px-2">{children}</div>
        </AdminSidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
