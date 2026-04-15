'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Slash } from 'lucide-react';

const BREADCRUMB_MAP: Record<string, string> = {
  admin: 'Dashboard',
  'blog-departments': 'Bộ phận nội dung',
  categories: 'Danh mục',
  topics: 'Chủ đề',
  tags: 'Nhãn',
  posts: 'Bài viết',
  comments: 'Bình luận',
  users: 'Người dùng',
  settings: 'Cài đặt',
};

function formatLabel(slug: string): string {
  if (BREADCRUMB_MAP[slug]) return BREADCRUMB_MAP[slug];
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AdminBreadcrumb() {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin">Admin</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.slice(1).map((segment, index) => {
          const href = '/' + segments.slice(0, index + 2).join('/');
          const isLast = index === segments.slice(1).length - 1;

          return (
            <BreadcrumbItem key={href}>
              <BreadcrumbSeparator>
                <Slash className="h-3 w-3" />
              </BreadcrumbSeparator>
              {isLast ? (
                <BreadcrumbPage>{formatLabel(segment)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={href}>{formatLabel(segment)}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
