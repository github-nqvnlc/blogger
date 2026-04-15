'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AdminSidebar, AdminSidebarInset } from '@/components/layout/admin-sidebar';
import { AdminBreadcrumb } from '@/components/layout/admin-breadcrumb';
import { Separator } from '@/components/ui/separator';

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
          {children}
        </AdminSidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
