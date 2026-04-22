"use client";

import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetDoc, useLazyLoadList } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { BlogDepartment, Category, Post } from "@/types/blogs";
import { formatDate } from "date-fns";
import { ArrowLeft, BookOpen, FolderOpen, Hash, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";
import { CategoryForm } from "./CategoryForm";

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
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function CategoryDetail({ categoryId }: CategoryDetailProps) {
  const PAGE_SIZE = 10;
  const { locale, t } = useLanguage();
  const copy = t.blogCategories.detail;
  const common = t.common;
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const {
    data: category,
    isLoading: isLoadingCategory,
    error: categoryError,
    mutate: refetchCategory,
  } = useGetDoc<Category>("categories", categoryId);

  const departmentId =
    typeof category?.department === "string" ? category.department : category?.department?.name;

  const { data: department } = useGetDoc<BlogDepartment>("blog_departments", departmentId);

  const categoryFilter = React.useMemo(
    () => [["category", "=", categoryId]] as [string, "=", string][],
    [categoryId]
  );

  const {
    loadedItems: loadedPosts,
    isLoading: isLoadingPosts,
    total: totalPosts,
    scrollRef: scrollContainerRef,
    handleScroll,
  } = useLazyLoadList<Post>({
    resource: "posts",
    fields: ["name", "title", "status", "visibility", "published_at", "creation"],
    filters: categoryFilter,
    orderBy: { field: "creation", order: "desc" },
    pageSize: PAGE_SIZE,
  });

  const statusCode = (categoryError as { response?: { status?: number } } | null)?.response?.status;

  if (statusCode === 403) {
    return <AdminAccessDenied description={t.errors.categoryAccessDeniedDescription} />;
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
            <h1 className="text-3xl font-bold tracking-tight">{category.category}</h1>
            <p className="mt-1 text-muted-foreground">
              {category.description || copy.noDescription}
            </p>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-2">
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
          <Button size="sm" onClick={() => setEditDialogOpen(true)}>
            Chỉnh sửa
            <Pencil className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{copy.totalPosts}:</span>
          <span className="text-sm font-bold">{totalPosts ?? 0}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{copy.department}:</span>
          <Link
            href={buildLocalePath(locale, `/admin/blog-departments/${departmentId}`)}
            className="text-sm font-bold hover:underline underline-offset-4"
          >
            {departmentName}
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.posts}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPosts && !loadedPosts.length ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : !loadedPosts.length ? (
            <EmptyState icon={FolderOpen} label={copy.noPosts} />
          ) : (
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="max-h-[450px] overflow-y-auto rounded-md border"
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>{copy.posts}</TableHead>
                    <TableHead>{common.status}</TableHead>
                    <TableHead>{copy.visibility}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadedPosts.map(post => (
                    <TableRow key={post.name}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{post.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {post.published_at
                              ? formatDate(new Date(post.published_at), " HH:mm dd/MM/yyyy")
                              : formatDate(
                                  new Date(post.creation ?? new Date()),
                                  " HH:mm dd/MM/yyyy"
                                )}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{post.visibility}</TableCell>
                    </TableRow>
                  ))}
                  {isLoadingPosts && loadedPosts.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-8 w-full rounded-md" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.blogCategories.editCategoryTitle}</DialogTitle>
            <DialogDescription>{t.blogCategories.editCategoryDescription}</DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={category}
            onSuccess={() => {
              setEditDialogOpen(false);
              refetchCategory();
            }}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
