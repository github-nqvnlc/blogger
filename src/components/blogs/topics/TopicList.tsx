"use client";

import { getTopicColumns, type TopicColumnMeta } from "@/components/blogs/topics/TopicColumns";
import { TopicForm } from "@/components/blogs/topics/TopicForm";
import { TopicTable } from "@/components/blogs/topics/TopicTable";
import { DepartmentFilterCombobox } from "@/components/common/DepartmentFilterCombobox";
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
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { BlogDepartment, Topic } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { ColumnDef, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { FolderOpen, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

const PAGE_SIZE = 20;

export function TopicList() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const copy = t.blogTopics;
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "creation", desc: true }]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<Topic | null>(null);
  const [deletingTopic, setDeletingTopic] = React.useState<Topic | null>(null);
  const [bulkDeletingTopics, setBulkDeletingTopics] = React.useState<Topic[]>([]);
  const [departments, setDepartments] = React.useState<BlogDepartment[]>([]);

  const apiFilters = React.useMemo<Filter[]>(() => {
    const result: Filter[] = [];

    if (statusFilter === "active") {
      result.push(["is_active", "=", 1]);
    } else if (statusFilter === "inactive") {
      result.push(["is_active", "=", 0]);
    }

    if (departmentFilter !== "all") {
      result.push(["department", "=", departmentFilter]);
    }

    return result;
  }, [statusFilter, departmentFilter]);

  const searchOrFilters = React.useMemo<Filter[]>(() => {
    if (!search.trim()) return [];

    return [
      ["topic", "like", `%${search.trim()}%`],
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
    data: topics,
    isLoading,
    error,
    mutate: refetch,
  } = useGetList<Topic>("topics", {
    fields: ["name", "topic", "department", "desc", "slug", "is_active", "creation"],
    filters: apiFilters,
    orFilters: searchOrFilters,
    orderBy,
    limit_start: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
  });

  const { data: totalCount } = useGetCount("topics", apiFilters, false, undefined, searchOrFilters);

  const { deleteDoc: deleteTopic, loading: isDeleting } = useDeleteDoc("topics");

  const getDepartmentLabel = React.useCallback(
    (topic: Topic) => {
      const department = topic.department;

      if (!department) {
        return "-";
      }

      if (typeof department !== "string") {
        return department.department_name ?? department.name;
      }

      return departments.find(d => d.name === department)?.department_name ?? "-";
    },
    [departments]
  );

  const handleOpenCreateForm = React.useCallback(() => {
    setEditingTopic(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEditForm = React.useCallback((topic: Topic) => {
    setEditingTopic(topic);
    setIsFormOpen(true);
  }, []);

  const handleViewDetail = React.useCallback(
    (topic: Topic) => {
      router.push(buildLocalePath(locale, `/admin/topics/${topic.name}`));
    },
    [locale, router]
  );

  const handleToggleStatus = React.useCallback(async (topic: Topic) => {
    setEditingTopic(topic);
    setIsFormOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deletingTopic) return;

    try {
      await deleteTopic(deletingTopic.name);
      showCrudSuccess(
        copy.deleteSuccess,
        `${copy.deleteSuccessDescriptionPrefix} "${deletingTopic.topic}"`
      );
      setDeletingTopic(null);
      refetch();
    } catch (err) {
      showCrudError(copy.deleteFailure, err, copy.deleteFailureDescription);
    }
  }, [
    copy.deleteFailure,
    copy.deleteFailureDescription,
    copy.deleteSuccess,
    copy.deleteSuccessDescriptionPrefix,
    deleteTopic,
    deletingTopic,
    refetch,
  ]);

  const handleFormSuccess = React.useCallback(() => {
    setIsFormOpen(false);
    setEditingTopic(null);
    refetch();
  }, [refetch]);

  const handleDeleteClick = React.useCallback((topic: Topic) => {
    setDeletingTopic(topic);
  }, []);

  const handleBulkDeleteClick = React.useCallback((selectedTopics: Topic[]) => {
    setBulkDeletingTopics(selectedTopics);
  }, []);

  const handleBulkDeleteConfirm = React.useCallback(async () => {
    if (bulkDeletingTopics.length === 0) return;

    try {
      await Promise.all(bulkDeletingTopics.map(topic => deleteTopic(topic.name)));
      showCrudSuccess(
        copy.deleteSuccess,
        copy.bulkDeleteSuccessDescription.replace("{count}", String(bulkDeletingTopics.length))
      );
      setBulkDeletingTopics([]);
      setRowSelection({});
      refetch();
    } catch (err) {
      showCrudError(copy.deleteFailure, err, copy.deleteFailureDescription);
    }
  }, [
    bulkDeletingTopics,
    copy.bulkDeleteSuccessDescription,
    copy.deleteFailure,
    copy.deleteFailureDescription,
    copy.deleteSuccess,
    deleteTopic,
    refetch,
  ]);

  const columnMeta = React.useMemo<TopicColumnMeta>(
    () => ({
      onView: handleViewDetail,
      onEdit: handleOpenEditForm,
      onToggle: handleToggleStatus,
      onDelete: handleDeleteClick,
      getDepartmentLabel,
    }),
    [
      getDepartmentLabel,
      handleDeleteClick,
      handleOpenEditForm,
      handleToggleStatus,
      handleViewDetail,
    ]
  );

  const statusCode = (error as { response?: { status?: number } } | null)?.response?.status;

  const columns: ColumnDef<Topic, unknown>[] = React.useMemo(() => getTopicColumns(t), [t]);

  if (statusCode === 403) {
    return <AdminAccessDenied description={t.errors.topicAccessDeniedDescription} />;
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
            {copy.addTopic}
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

          <DepartmentFilterCombobox
            value={departmentFilter}
            onChange={(v) => {
              setDepartmentFilter(v);
              setPagination((prev) =>
                prev.pageIndex === 0 ? { ...prev } : { ...prev, pageIndex: 0 },
              );
            }}
            onDepartmentsChange={setDepartments}
            isLoading={isLoading}
            placeholder={copy.filterByDepartment}
            allLabel={copy.allDepartments}
          />
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
                handleBulkDeleteClick(topics?.filter((_, i) => rowSelection[i] === true) ?? [])
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.common.deleteSelected}
            </Button>
          </div>
        )}

        <TopicTable
          columns={columns}
          data={topics ?? []}
          isLoading={isLoading}
          totalCount={totalCount ?? 0}
          pagination={pagination}
          onPaginationChange={(updater) => {
            setPagination((prev) => {
              const next =
                typeof updater === "function" ? updater(prev) : updater;
              if (next.pageIndex === 0) return next;
              return { ...next, pageIndex: 0 };
            });
          }}
          sorting={sorting}
          onSortingChange={(updater) => {
            setSorting(updater);
            setPagination((prev) =>
              prev.pageIndex === 0 ? { ...prev } : { ...prev, pageIndex: 0 },
            );
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
                {copy.addTopic}
              </Button>
            </div>
          }
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? copy.editTopicTitle : copy.addTopicTitle}
            </DialogTitle>
            <DialogDescription>
              {editingTopic
                ? copy.editTopicDescription
                : copy.addTopicDescription}
            </DialogDescription>
          </DialogHeader>
          <TopicForm
            topic={editingTopic}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTopic} onOpenChange={open => !open && setDeletingTopic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteDescriptionStart} &ldquo;{deletingTopic?.topic}
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
        open={bulkDeletingTopics.length > 0}
        onOpenChange={open => !open && setBulkDeletingTopics([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.bulkDeleteTitle ?? copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              {bulkDeletingTopics.length === 1 ? (
                `${copy.deleteDescriptionStart} "${bulkDeletingTopics[0]?.topic}"? ${copy.deleteDescriptionEnd}`
              ) : (
                <span className="block space-y-1">
                  {bulkDeletingTopics.slice(0, 5).map(topic => (
                    <span key={topic.name} className="flex items-start gap-2">
                      <span className="shrink-0 text-muted-foreground">-</span>
                      <span>{topic.topic}</span>
                    </span>
                  ))}
                  {bulkDeletingTopics.length > 5 && (
                    <span className="block text-muted-foreground">
                      ... {bulkDeletingTopics.length - 5} {copy.itemsWillBeDeleted ?? "items"}
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
