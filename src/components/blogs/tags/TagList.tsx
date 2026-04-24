"use client";

import { getTagColumns, type TagColumnMeta } from "@/components/blogs/tags/TagColumns";
import { TagForm } from "@/components/blogs/tags/TagForm";
import { TagTable } from "@/components/blogs/tags/TagTable";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteDoc, useGetCount, useGetList } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { getApiClient } from "@/lib/apiClient";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { Tag } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { ColumnDef, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { FolderOpen, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

type RelationItem = { name: string; post?: string };

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

const PAGE_SIZE = 20;

export function TagList() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const copy = t.blogTags;
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "creation", desc: true }]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTag, setEditingTag] = React.useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = React.useState<Tag | null>(null);
  const [bulkDeletingTags, setBulkDeletingTags] = React.useState<Tag[]>([]);
  const [blockedTag, setBlockedTag] = React.useState<Tag | null>(null);
  const [blockedItems, setBlockedItems] = React.useState<{
    posts: RelationItem[];
  }>({ posts: [] });

  const apiFilters = React.useMemo<Filter[]>(() => {
    const result: Filter[] = [];

    if (statusFilter === "active") {
      result.push(["is_active", "=", 1]);
    } else if (statusFilter === "inactive") {
      result.push(["is_active", "=", 0]);
    }

    return result;
  }, [statusFilter]);

  const searchOrFilters = React.useMemo<Filter[]>(() => {
    if (!search.trim()) return [];

    return [
      ["tag_name", "like", `%${search.trim()}%`],
      ["slug", "like", `%${search.trim()}%`],
    ];
  }, [search]);

  const orderBy = React.useMemo(() => {
    if (sorting.length === 0) {
      return { field: "creation", order: "desc" as const };
    }

    const s = sorting[0];
    return {
      field: s.id,
      order: s.desc ? ("desc" as const) : ("asc" as const),
    };
  }, [sorting]);

  const {
    data: tags,
    isLoading,
    error,
    mutate: refetch,
  } = useGetList<Tag>("tags", {
    fields: ["name", "tag_name", "description", "slug", "is_active", "creation"],
    filters: apiFilters,
    orFilters: searchOrFilters,
    orderBy,
    limit_start: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
  });

  const { data: totalCount } = useGetCount("tags", apiFilters, false, undefined, searchOrFilters);

  const { deleteDoc: deleteTag, loading: isDeleting } = useDeleteDoc("tags");

  const handleOpenCreateForm = React.useCallback(() => {
    setEditingTag(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEditForm = React.useCallback((tag: Tag) => {
    setEditingTag(tag);
    setIsFormOpen(true);
  }, []);

  const handleViewDetail = React.useCallback(
    (tag: Tag) => {
      router.push(buildLocalePath(locale, `/admin/tags/${tag.name}`));
    },
    [locale, router]
  );

  const handleToggleStatus = React.useCallback(async (tag: Tag) => {
    setEditingTag(tag);
    setIsFormOpen(true);
  }, []);

  const checkTagRelations = React.useCallback(async (tagName: string) => {
    const [posts, postItems] = await Promise.all([
      getRelationCount("post_tags", "tag", tagName),
      getRelationItems("post_tags", "tag", tagName, "post"),
    ]);
    return {
      counts: { posts },
      items: { posts: postItems },
    };
  }, []);

  const handleDeleteClick = React.useCallback(
    async (tag: Tag) => {
      try {
        const { counts, items } = await checkTagRelations(tag.name);
        if (counts.posts > 0) {
          setBlockedItems(items);
          setBlockedTag(tag);
        } else {
          setDeletingTag(tag);
        }
      } catch {
        setDeletingTag(tag);
      }
    },
    [checkTagRelations]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deletingTag) return;

    try {
      await deleteTag(deletingTag.name);
      showCrudSuccess(
        copy.deleteSuccess,
        `${copy.deleteSuccessDescriptionPrefix} "${deletingTag.tag_name}"`
      );
      setDeletingTag(null);
      refetch();
    } catch (err) {
      showCrudError(copy.deleteFailure, err, copy.deleteFailureDescription);
    }
  }, [
    copy.deleteFailure,
    copy.deleteFailureDescription,
    copy.deleteSuccess,
    copy.deleteSuccessDescriptionPrefix,
    deleteTag,
    deletingTag,
    refetch,
  ]);

  const handleFormSuccess = React.useCallback(() => {
    setIsFormOpen(false);
    setEditingTag(null);
    refetch();
  }, [refetch]);

  const handleBulkDeleteClick = React.useCallback((selectedTags: Tag[]) => {
    setBulkDeletingTags(selectedTags);
  }, []);

  const handleBulkDeleteConfirm = React.useCallback(async () => {
    if (bulkDeletingTags.length === 0) return;

    try {
      await Promise.all(bulkDeletingTags.map(tag => deleteTag(tag.name)));
      showCrudSuccess(
        copy.deleteSuccess,
        copy.bulkDeleteSuccessDescription.replace("{count}", String(bulkDeletingTags.length))
      );
      setBulkDeletingTags([]);
      setRowSelection({});
      refetch();
    } catch (err) {
      showCrudError(copy.deleteFailure, err, copy.deleteFailureDescription);
    }
  }, [
    bulkDeletingTags,
    copy.bulkDeleteSuccessDescription,
    copy.deleteFailure,
    copy.deleteFailureDescription,
    copy.deleteSuccess,
    deleteTag,
    refetch,
  ]);

  const columnMeta = React.useMemo<TagColumnMeta>(
    () => ({
      onView: handleViewDetail,
      onEdit: handleOpenEditForm,
      onToggle: handleToggleStatus,
      onDelete: handleDeleteClick,
    }),
    [handleDeleteClick, handleOpenEditForm, handleToggleStatus, handleViewDetail]
  );

  const statusCode = (error as { response?: { status?: number } } | null)?.response?.status;

  const columns: ColumnDef<Tag, unknown>[] = React.useMemo(() => getTagColumns(t), [t]);

  if (statusCode === 403) {
    return <AdminAccessDenied description={t.errors.tagAccessDeniedDescription} />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex sm:flex-row flex-col gap-6 sm:items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">{copy.title}</h1>
            <p className="mt-1 text-muted-foreground">{copy.description}</p>
          </div>
          <Button onClick={handleOpenCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            {copy.addTag}
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={copy.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  setPagination(prev => ({ ...prev, pageIndex: 0 }));
                }
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={v => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t.common.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.all}</SelectItem>
              <SelectItem value="active">{t.common.active}</SelectItem>
              <SelectItem value="inactive">{t.common.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {Object.keys(rowSelection).length > 0 && (
          <div className="flex items-center justify-end gap-3 rounded-lg border bg-muted/50 px-4 py-3">
            <span className="text-sm font-medium">
              {Object.keys(rowSelection).length} {t.common.selected}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                handleBulkDeleteClick(tags?.filter((_, i) => rowSelection[i] === true) ?? [])
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.common.deleteSelected}
            </Button>
          </div>
        )}

        <TagTable
          columns={columns}
          data={tags ?? []}
          isLoading={isLoading}
          totalCount={totalCount ?? 0}
          pagination={pagination}
          onPaginationChange={updater => {
            setPagination(prev => {
              const next = typeof updater === "function" ? updater(prev) : updater;
              if (next.pageIndex === 0) return next;
              return { ...next, pageIndex: 0 };
            });
          }}
          sorting={sorting}
          onSortingChange={updater => {
            setSorting(updater);
            setPagination(prev => (prev.pageIndex === 0 ? { ...prev } : { ...prev, pageIndex: 0 }));
          }}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          meta={columnMeta as unknown as Record<string, unknown>}
          emptyMessage={
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="rounded-full bg-muted p-3">
                <FolderOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{copy.emptyTitle}</p>
                <p className="text-sm text-muted-foreground">{copy.emptyDescription}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleOpenCreateForm}>
                <Plus className="mr-2 h-4 w-4" />
                {copy.addTag}
              </Button>
            </div>
          }
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTag ? copy.editTagTitle : copy.addTagTitle}</DialogTitle>
            <DialogDescription>
              {editingTag ? copy.editTagDescription : copy.addTagDescription}
            </DialogDescription>
          </DialogHeader>
          <TagForm
            tag={editingTag}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTag} onOpenChange={open => !open && setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteDescriptionStart} &ldquo;{deletingTag?.tag_name}
              &rdquo;? {copy.deleteDescriptionEnd}
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
        open={bulkDeletingTags.length > 0}
        onOpenChange={open => !open && setBulkDeletingTags([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.bulkDeleteTitle ?? copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              {bulkDeletingTags.length === 1 ? (
                `${copy.deleteDescriptionStart} "${bulkDeletingTags[0]?.tag_name}"? ${copy.deleteDescriptionEnd}`
              ) : (
                <span className="block space-y-1">
                  {bulkDeletingTags.slice(0, 5).map(tag => (
                    <span key={tag.name} className="flex items-start gap-2">
                      <span className="shrink-0 text-muted-foreground">-</span>
                      <span>{tag.tag_name}</span>
                    </span>
                  ))}
                  {bulkDeletingTags.length > 5 && (
                    <span className="block text-muted-foreground">
                      ... {bulkDeletingTags.length - 5} {copy.itemsWillBeDeleted ?? "items"}
                    </span>
                  )}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner /> : null}
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!blockedTag} onOpenChange={open => !open && setBlockedTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteBlockedTitle}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-6">
              <span className="block">{copy.deleteBlockedDescription}</span>
              {blockedItems.posts.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {copy.deleteBlockedLinkPosts} ({blockedItems.posts.length})
                  </span>
                  <ul className="pl-4 space-y-1 max-h-32 overflow-y-auto">
                    {blockedItems.posts.map((item, index) => (
                      <li key={item.name}>
                        <Link
                          href={buildLocalePath(locale, `/admin/posts/${item.post}`)}
                          target="blank"
                          className="text-foreground underline underline-offset-3 hover:text-muted-foreground text-sm"
                          onClick={() => setBlockedTag(null)}
                        >
                          {t.blogPosts.post}: {index + 1}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.close}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
