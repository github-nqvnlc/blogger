"use client";

import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge as StatusBadgePost } from "@/components/ui/badge-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteDoc, useGetDoc, useLazyLoadList } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { getApiClient } from "@/lib/apiClient";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { BlogDepartment, Category, Post } from "@/types/blogs";
import { formatDate } from "date-fns";
import { ArrowLeft, BookOpen, FolderOpen, Newspaper, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import * as React from "react";
import { CategoryForm } from "./CategoryForm";

type RelationItem = { name: string; title?: string };

async function getRelationCount(
  resource: string,
  filterField: string,
  filterValue: string
): Promise<number> {
  const apiClient = getApiClient();
  const res = await apiClient.get(`/api/resource/${resource}`, {
    params: {
      fields: JSON.stringify(["name"]),
      filters: JSON.stringify([[filterField, "=", filterValue]]),
      limit_page_length: 99999,
      limit_start: 0,
    },
  });
  const raw = (res.data ?? []) as { data?: unknown[] } | unknown[];
  const list = Array.isArray(raw) ? raw : (raw.data ?? []);
  return list.length;
}

async function getRelationItems(
  resource: string,
  filterField: string,
  filterValue: string,
  labelField: string
): Promise<RelationItem[]> {
  const apiClient = getApiClient();
  const res = await apiClient.get(`/api/resource/${resource}`, {
    params: {
      fields: JSON.stringify(["name", labelField]),
      filters: JSON.stringify([[filterField, "=", filterValue]]),
      limit_page_length: 99999,
      limit_start: 0,
    },
  });
  const raw = (res.data ?? []) as { data?: RelationItem[] } | RelationItem[];
  const list = Array.isArray(raw) ? raw : (raw.data ?? []);
  return list;
}

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
  const router = useRouter();
  const PAGE_SIZE = 10;
  const { locale, t } = useLanguage();
  const copy = t.blogCategories.detail;
  const common = t.common;
  const copyList = t.blogCategories;
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deletingCategory, setDeletingCategory] = React.useState<Category | null>(null);
  const [blockedCategory, setBlockedCategory] = React.useState<Category | null>(null);
  const [blockedItems, setBlockedItems] = React.useState<{
    posts: RelationItem[];
  }>({ posts: [] });
  const { deleteDoc: deleteCategory, loading: isDeleting } = useDeleteDoc("categories");

  const checkCategoryRelations = React.useCallback(async (catName: string) => {
    const [[posts, postItems]] = await Promise.all([
      Promise.all([
        getRelationCount("posts", "category", catName),
        getRelationItems("posts", "category", catName, "title"),
      ]),
    ]);
    return {
      counts: { posts },
      items: { posts: postItems },
    };
  }, []);

  const handleDeleteClick = React.useCallback(
    async (cat: Category) => {
      try {
        const { counts, items } = await checkCategoryRelations(cat.name);
        if (counts.posts > 0) {
          setBlockedItems(items);
          setBlockedCategory(cat);
        } else {
          setDeletingCategory(cat);
        }
      } catch {
        setDeletingCategory(cat);
      }
    },
    [checkCategoryRelations]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory(deletingCategory.name);
      showCrudSuccess(
        copyList.deleteSuccess,
        `${copyList.deleteSuccessDescriptionPrefix} "${deletingCategory.category}"`
      );
      setDeletingCategory(null);
      router.push(buildLocalePath(locale, "/admin/categories"));
    } catch (err) {
      showCrudError(copyList.deleteFailure, err, copyList.deleteFailureDescription);
    }
  }, [copyList, deleteCategory, deletingCategory, locale, router]);

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
      <Button asChild variant="ghost" size="sm" className="w-fit px-0">
        <Link href={buildLocalePath(locale, "/admin/categories")}>
          <ArrowLeft className="h-4 w-4" />
          {copy.backToList}
        </Link>
      </Button>

      <div className="-mt-4 flex flex-col gap-4 sm:flex-row-reverse sm:items-start sm:justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(category)}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t.common.delete}
          </Button>
          <Button size="sm" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            {t.common.edit}
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{category.category}</h1>
          <p className="mt-1 text-muted-foreground">{category.description || copy.noDescription}</p>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4 rounded-lg border px-4 py-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{copy.department}:</span>
            <Link
              href={buildLocalePath(locale, `/admin/blog-departments/${departmentId}`)}
              className="text-sm font-bold hover:underline underline-offset-4"
            >
              {departmentName}
            </Link>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{copy.totalPosts}:</span>
            <span className="text-sm font-bold">{totalPosts ?? 0}</span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-3">
          <p className="text-sm font-semibold italic text-muted-foreground">
            {category.creation
              ? formatDate(new Date(category.creation), " HH:mm - dd/MM/yyyy")
              : "-"}
          </p>
          <div className="h-4 w-px bg-border" />
          <StatusBadge
            active={category.is_active === 1}
            activeLabel={t.blogCategories.table.active}
            inactiveLabel={t.blogCategories.table.inactive}
          />
        </div>
      </div>

      {isLoadingPosts && !loadedPosts.length ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : !loadedPosts.length ? (
        <EmptyState icon={FolderOpen} label={copy.noPosts} />
      ) : (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="max-h-[550px] overflow-y-auto rounded-md border"
        >
          <Table noWrapper>
            <TableHeader className="bg-background sticky top-0 z-10">
              <TableRow>
                <TableHead>{copy.posts}</TableHead>
                <TableHead>{common.status}</TableHead>
                <TableHead>{copy.visibility}</TableHead>
                <TableHead>{copy.creation}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadedPosts.map(post => (
                <TableRow key={post.name}>
                  <TableCell
                    onClick={() =>
                      router.push(buildLocalePath(locale, `/admin/posts/${post.name}`))
                    }
                    className="cursor-pointer"
                  >
                    <p className="font-medium">{post.title}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadgePost status={post.status} t={t} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{post.visibility}</TableCell>
                  <TableCell>
                    <p className="text-sm italic text-muted-foreground">
                      {post.creation
                        ? formatDate(new Date(post.creation), " HH:mm - dd/MM/yyyy")
                        : "-"}
                    </p>
                  </TableCell>
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

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={open => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copyList.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copyList.deleteDescriptionStart} &ldquo;{deletingCategory?.category}&rdquo;?{" "}
              {copyList.deleteDescriptionEnd}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner /> : null}
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!blockedCategory}
        onOpenChange={open => !open && setBlockedCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copyList.deleteBlockedTitle}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-6">
              <span className="block">{copyList.deleteBlockedDescription}</span>

              {blockedItems.posts.length > 0 && (
                <span className="block space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {copyList.deleteBlockedLinkPosts} ({blockedItems.posts.length})
                  </span>
                  <ul className="pl-4 space-y-1 max-h-32 overflow-y-auto">
                    {blockedItems.posts.map(item => (
                      <li key={item.name}>
                        <Link
                          href={buildLocalePath(locale, `/admin/posts/${item.name}`)}
                          className="text-foreground underline underline-offset-3 hover:text-muted-foreground text-sm"
                          onClick={() => setBlockedCategory(null)}
                        >
                          {item.title || item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.close}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
