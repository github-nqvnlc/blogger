"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { FolderOpen, Plus, Search, Trash2 } from "lucide-react";
import { useDeleteDoc, useGetCount, useGetList } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { Tag } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import {
  getTagColumns,
  type TagColumnMeta,
} from "@/components/blogs/tags/TagColumns";
import { TagForm } from "@/components/blogs/tags/TagForm";
import { TagTable } from "@/components/blogs/tags/TagTable";
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

const PAGE_SIZE = 20;

export function TagList() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const copy = t.blogTags;
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "creation", desc: true },
  ]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all");
  const [search, setSearch] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTag, setEditingTag] = React.useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = React.useState<Tag | null>(null);
  const [bulkDeletingTags, setBulkDeletingTags] = React.useState<Tag[]>([]);

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
    fields: [
      "name",
      "tag_name",
      "description",
      "slug",
      "is_active",
      "creation",
    ],
    filters: apiFilters,
    orFilters: searchOrFilters,
    orderBy,
    limit_start: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
  });

  const { data: totalCount } = useGetCount(
    "tags",
    apiFilters,
    false,
    undefined,
    searchOrFilters,
  );

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
    [locale, router],
  );

  const handleToggleStatus = React.useCallback(async (tag: Tag) => {
    setEditingTag(tag);
    setIsFormOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deletingTag) return;

    try {
      await deleteTag(deletingTag.name);
      showCrudSuccess(
        copy.deleteSuccess,
        `${copy.deleteSuccessDescriptionPrefix} "${deletingTag.tag_name}"`,
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

  const handleDeleteClick = React.useCallback((tag: Tag) => {
    setDeletingTag(tag);
  }, []);

  const handleBulkDeleteClick = React.useCallback((selectedTags: Tag[]) => {
    setBulkDeletingTags(selectedTags);
  }, []);

  const handleBulkDeleteConfirm = React.useCallback(async () => {
    if (bulkDeletingTags.length === 0) return;

    try {
      await Promise.all(bulkDeletingTags.map((tag) => deleteTag(tag.name)));
      showCrudSuccess(
        copy.deleteSuccess,
        copy.bulkDeleteSuccessDescription.replace(
          "{count}",
          String(bulkDeletingTags.length),
        ),
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
    [
      handleDeleteClick,
      handleOpenEditForm,
      handleToggleStatus,
      handleViewDetail,
    ],
  );

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [apiFilters, orderBy]);

  const statusCode = (error as { response?: { status?: number } } | null)
    ?.response?.status;

  const columns: ColumnDef<Tag, unknown>[] = React.useMemo(
    () => getTagColumns(t),
    [t],
  );

  if (statusCode === 403) {
    return (
      <AdminAccessDenied description={t.errors.tagAccessDeniedDescription} />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex sm:flex-row flex-col gap-6 sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
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
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
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
                handleBulkDeleteClick(
                  tags?.filter((_, i) => rowSelection[i] === true) ?? [],
                )
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
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
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
                <p className="text-sm text-muted-foreground">
                  {copy.emptyDescription}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreateForm}
              >
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
            <DialogTitle>
              {editingTag ? copy.editTagTitle : copy.addTagTitle}
            </DialogTitle>
          </DialogHeader>
          <TagForm
            tag={editingTag}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingTag}
        onOpenChange={(open) => !open && setDeletingTag(null)}
      >
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
        onOpenChange={(open) => !open && setBulkDeletingTags([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {copy.bulkDeleteTitle ?? copy.deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              {bulkDeletingTags.length === 1 ? (
                `${copy.deleteDescriptionStart} "${bulkDeletingTags[0]?.tag_name}"? ${copy.deleteDescriptionEnd}`
              ) : (
                <span className="block space-y-1">
                  {bulkDeletingTags.slice(0, 5).map((tag) => (
                    <span key={tag.name} className="flex items-start gap-2">
                      <span className="shrink-0 text-muted-foreground">-</span>
                      <span>{tag.tag_name}</span>
                    </span>
                  ))}
                  {bulkDeletingTags.length > 5 && (
                    <span className="block text-muted-foreground">
                      ... {bulkDeletingTags.length - 5}{" "}
                      {copy.itemsWillBeDeleted ?? "items"}
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
    </>
  );
}
