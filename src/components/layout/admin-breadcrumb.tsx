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
import { useLanguage } from '@/hooks/useLanguage';
import { buildLocalePath, stripLocaleFromPathname } from '@/i18n';

function formatLabel(slug: string, map: Record<string, string>): string {
  if (map[slug]) return map[slug];
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const { locale, t } = useLanguage();
  const normalizedPath = stripLocaleFromPathname(pathname);
  const segments = normalizedPath.split('/').filter(Boolean);
  const breadcrumbMap = t.admin.breadcrumbs as Record<string, string>;

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={buildLocalePath(locale, '/admin')}>
              {t.admin.breadcrumbHome}
            </Link>
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
                <BreadcrumbPage>{formatLabel(segment, breadcrumbMap)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={buildLocalePath(locale, href)}>
                    {formatLabel(segment, breadcrumbMap)}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
