'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Newspaper,
  Tags,
  FolderOpen,
  MessageSquare,
  Users,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Menu,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useGetDoc } from '@/hooks/useGetDoc';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
}

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
  items?: NavSubItem[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_ITEMS: NavGroup[] = [
  {
    title: 'Tổng quan',
    items: [
      {
        title: 'Dashboard',
        url: '/admin',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Quản lý Blog',
    items: [
      {
        title: 'Bộ phận nội dung',
        url: '/admin/blog-departments',
        icon: Newspaper,
      },
      {
        title: 'Danh mục',
        url: '/admin/categories',
        icon: FolderOpen,
      },
      {
        title: 'Chủ đề',
        url: '/admin/topics',
        icon: Tags,
      },
      {
        title: 'Nhãn',
        url: '/admin/tags',
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'Bài viết',
    items: [
      {
        title: 'Tất cả bài viết',
        url: '/admin/posts',
        icon: Newspaper,
        badge: '12',
      },
      {
        title: 'Bài nháp',
        url: '/admin/posts?status=draft',
        icon: Newspaper,
        badge: '3',
      },
      {
        title: 'Đã xuất bản',
        url: '/admin/posts?status=published',
        icon: Newspaper,
        badge: '8',
      },
    ],
  },
  {
    title: 'Phản hồi',
    items: [
      {
        title: 'Bình luận',
        url: '/admin/comments',
        icon: MessageSquare,
        badge: '5',
      },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      {
        title: 'Người dùng',
        url: '/admin/users',
        icon: Users,
      },
      {
        title: 'Cài đặt',
        url: '/admin/settings',
        icon: Settings,
      },
    ],
  },
];

function NavBadge({ badge }: { badge?: string }) {
  if (!badge) return null;
  return (
    <Badge
      variant="secondary"
      className="ml-auto h-5 w-5 items-center justify-center p-0 text-xs"
    >
      {badge}
    </Badge>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  const isActive = (url: string) => {
    if (url === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(url.split('?')[0]);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className='border-b'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Newspaper className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Blog Admin</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Hệ thống quản trị
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_ITEMS.map((group, idx) => (
          <SidebarGroup key={idx}>
            {state === 'expanded' && (
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(item => (
                  <SidebarMenuItem key={item.url}>
                    {item.items && item.items.length > 0 ? (
                      <Collapsible defaultOpen={isActive(item.url)}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={isActive(item.url)}
                            tooltip={item.title}
                            className={cn(
                              isActive(item.url) && 'bg-sidebar-accent',
                            )}
                          >
                            {item.icon && <item.icon className="size-4" />}
                            <span>{item.title}</span>
                            <NavBadge badge={item.badge} />
                            <ChevronDown className="ml-auto size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items!.map((subItem: NavSubItem) => (
                              <SidebarMenuSubItem key={subItem.url}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActive(subItem.url)}
                                >
                                  <Link href={subItem.url}>
                                    {subItem.icon && (
                                      <subItem.icon className="size-4" />
                                    )}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                        className={cn(isActive(item.url) && 'bg-sidebar-accent')}
                      >
                        <Link href={item.url}>
                          {item.icon && <item.icon className="size-4" />}
                          <span>{item.title}</span>
                          <NavBadge badge={item.badge} />
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className='border-t'>
        <AdminSidebarFooter />
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminSidebarFooter() {
  const { currentUser, logout } = useAuth();

  const { data: userProfile } = useGetDoc<{
    email: string;
    full_name: string;
    user_image: string;
    name: string;
  }>('User', currentUser ?? undefined);

  const { state } = useSidebar();

  const displayName = userProfile?.full_name || currentUser || 'Unknown';
  const displayEmail = userProfile?.email || '';
  const avatarUrl = userProfile?.user_image
    ? `${process.env.NEXT_PUBLIC_FRAPPE_URL || ''}${userProfile.user_image}`
    : '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
            state === 'collapsed' && 'justify-center',
          )}
        >
          {currentUser ? (
            <>
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              {state === 'expanded' && (
                <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                  <span className="truncate font-semibold text-foreground">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {displayEmail}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <Avatar className="size-8 shrink-0">
                <AvatarFallback>
                  <Loader2 className="size-4 animate-spin" />
                </AvatarFallback>
              </Avatar>
              {state === 'expanded' && (
                <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32 mt-1" />
                </div>
              )}
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Hồ sơ cá nhân</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Cài đặt</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminSidebarInset({ children }: { children: React.ReactNode }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarInset>
      <div className="lg:hidden p-4 border-b border shadow-sm fixed top-0 left-0 right-0 bg-background z-10">
        <SidebarMenuButton
          onClick={() => (isMobile ? setOpenMobile(true) : undefined)}
          className="p-2 bg-accent w-auto rounded-md"
          size="sm"
          variant="outline"
        >
          <Menu className="size-8" />
        </SidebarMenuButton>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 mt-14 lg:mt-0">
        {children}
      </div>
    </SidebarInset>
  );
}
