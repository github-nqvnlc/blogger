"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, FolderOpen } from "lucide-react";
import { formatDate } from "date-fns";
import { notFound } from "next/navigation";
import { useGetCount, useGetDoc, useGetList } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { BlogDepartment, Category, Post } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CategoryDetailProps {
  categoryId: string;
}

function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <Badge
      variant={active ? "default" : "secondary"}
      className={active ? "bg-green-500 text-white" : "bg-gray-500 text-white"}
    >
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value?: number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value ?? 0}</div>
      </CardContent>
    </Card>
  );
}

export function CategoryDetail({ categoryId }: CategoryDetailProps) {
  const { locale, t } = useLanguage();
  const copy = t.blogCategories.detail;
  const common = t.common;

  const {
    data: category,
    isLoading: isLoadingCategory,
    error: categoryError,
  } = useGetDoc<Category>("categories", categoryId);

  const departmentId =
    typeof category?.department === "string"
      ? category.department
      : category?.department?.name;

  const { data: department } = useGetDoc<BlogDepartment>(
    "blog_departments",
    departmentId,
  );

  const categoryFilter = React.useMemo(
    () => [["category", "=", categoryId]] as Filter[],
    [categoryId],
  );

  const { data: posts, isLoading: isLoadingPosts } = useGetList<Post>("posts", {
    fields: ["name", "title", "status", "visibility", "published_at", "creation"],
    filters: [...categoryFilter],
    orderBy: { field: "creation", order: "desc" },
    limit: 100,
  });

  const { data: totalPosts } = useGetCount("posts", [...categoryFilter]);

  const statusCode = (categoryError as { response?: { status?: number } } | null)
    ?.response?.status;

  if (statusCode === 403) {
    return (
      <AdminAccessDenied
        description={t.errors.categoryAccessDeniedDescription}
      />
    );
  }

  if (isLoadingCategory) {
    return <OverviewSkeleton />;
  }

  if (!category) {
    return notFound();
  }

  const departmentName =
    department?.department_name ??
    (typeof category.department === "string"
      ? category.department
      : category.department.department_name);

  const departmentCode =
    department?.department_code ??
    (typeof category.department === "string"
      ? ""
      : category.department.department_code);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-start sm:justify-between">
          <Button asChild variant="ghost" size="sm" className="w-fit px-0">
            <Link href={buildLocalePath(locale, "/admin/categories")}>
              <ArrowLeft className="h-4 w-4" />
              {copy.backToList}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {category.category}
            </h1>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <StatusBadge
            active={category.is_active === 1}
            activeLabel={t.blogCategories.table.active}
            inactiveLabel={t.blogCategories.table.inactive}
          />
          <p className="text-sm font-semibold italic text-muted-foreground">
            {category.creation
              ? formatDate(new Date(category.creation), " HH:mm - dd/MM/yyyy")
              : "-"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title={copy.totalPosts} value={totalPosts} icon={BookOpen} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {copy.department}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold">{departmentName}</div>
            {departmentCode ? <Badge variant="outline">{departmentCode}</Badge> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{copy.overview}</CardTitle>
            <CardDescription>{copy.overviewDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{copy.slug}</p>
              <p className="font-medium">{category.slug || copy.noSlug}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{copy.department}</p>
              <p className="font-medium">{departmentName}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-muted-foreground">{copy.description}</p>
              <p className="font-medium">
                {category.description || copy.noDescription}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.departmentOwner}</CardTitle>
            <CardDescription>{copy.departmentOwnerDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{departmentName}</p>
              {departmentCode ? (
                <p className="text-sm text-muted-foreground">{departmentCode}</p>
              ) : null}
            </div>
            {departmentId ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={buildLocalePath(
                    locale,
                    `/admin/blog-departments/${departmentId}`,
                  )}
                >
                  {copy.viewDepartment}
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="posts"
        className="space-y-2 rounded-xl bg-card p-2 shadow-2xl lg:p-4"
      >
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="posts">{copy.posts}</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>{copy.posts}</CardTitle>
              <CardDescription>
                {copy.totalPosts}: {totalPosts ?? 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPosts ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : !posts?.length ? (
                <EmptyState icon={FolderOpen} label={copy.noPosts} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.posts}</TableHead>
                      <TableHead>{common.status}</TableHead>
                      <TableHead>{copy.visibility}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.name}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{post.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {post.published_at
                                ? formatDate(
                                    new Date(post.published_at),
                                    " HH:mm dd/MM/yyyy",
                                  )
                                : formatDate(
                                    new Date(post.creation ?? Date.now()),
                                    " HH:mm dd/MM/yyyy",
                                  )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{post.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {post.visibility}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
