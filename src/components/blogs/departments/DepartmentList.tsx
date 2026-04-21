"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useGetList, useDeleteDoc, useGetCount } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { BlogDepartment } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import { DepartmentForm } from "@/components/blogs/departments/DepartmentForm";
import { DepartmentTable } from "@/components/blogs/departments/DepartmentTable";
import { getDepartmentColumns } from "@/components/blogs/departments/DepartmentColumns";
import { Search, Plus, Building2, Trash2 } from "lucide-react";

const PAGE_SIZE = 20;

export function DepartmentList() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const copy = t.blogDepartments;
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
  const [editingDepartment, setEditingDepartment] =
    React.useState<BlogDepartment | null>(null);
  const [deletingDepartment, setDeletingDepartment] =
    React.useState<BlogDepartment | null>(null);
  const [bulkDeletingDepts, setBulkDeletingDepts] = React.useState<
    BlogDepartment[]
  >([]);

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
      ["department_name", "like", `%${search.trim()}%`],
      ["department_code", "like", `%${search.trim()}%`],
    ];
  }, [search]);

  const orderBy = React.useMemo(() => {
    if (sorting.length === 0)
      return { field: "creation", order: "asc" as const };
    const s = sorting[0];
    return {
      field: s.id,
      order: s.desc ? ("desc" as const) : ("asc" as const),
    };
  }, [sorting]);

  const {
    data: departments,
    isLoading,
    error,
    mutate: refetch,
  } = useGetList<BlogDepartment>("blog_departments", {
    fields: ["*"],
    filters: apiFilters,
    orFilters: searchOrFilters,
    orderBy,
    limit_start: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
  });

  const { data: totalCount } = useGetCount(
    "blog_departments",
    apiFilters,
    false,
    undefined,
    searchOrFilters,
  );

  const { deleteDoc: deleteDepartment, loading: isDeleting } =
    useDeleteDoc("blog_departments");

  const handleOpenCreateForm = React.useCallback(() => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEditForm = React.useCallback((dept: BlogDepartment) => {
    setEditingDepartment(dept);
    setIsFormOpen(true);
  }, []);

  const handleViewDetail = React.useCallback(
    (dept: BlogDepartment) => {
      router.push(
        buildLocalePath(locale, `/admin/blog-departments/${dept.name}`),
      );
    },
    [locale, router],
  );

  const handleToggleStatus = React.useCallback(async (dept: BlogDepartment) => {
    setEditingDepartment(dept);
    setIsFormOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deletingDepartment) return;
    try {
      await deleteDepartment(deletingDepartment.name);
      showCrudSuccess(
        copy.deleteSuccess,
        `${copy.deleteSuccessDescriptionPrefix} "${deletingDepartment.department_name}"`,
      );
      setDeletingDepartment(null);
      refetch();
    } catch (err) {
      showCrudError(copy.deleteFailure, err, copy.deleteFailureDescription);
    }
  }, [
    copy.deleteFailure,
    copy.deleteFailureDescription,
    copy.deleteSuccess,
    copy.deleteSuccessDescriptionPrefix,
    deleteDepartment,
    deletingDepartment,
    refetch,
  ]);

  const handleFormSuccess = React.useCallback(() => {
    setIsFormOpen(false);
    setEditingDepartment(null);
    refetch();
  }, [refetch]);

  const handleDeleteClick = React.useCallback((dept: BlogDepartment) => {
    setDeletingDepartment(dept);
  }, []);

  const handleBulkDeleteClick = React.useCallback(
    (selectedDepts: BlogDepartment[]) => {
      setBulkDeletingDepts(selectedDepts);
    },
    [],
  );

  const handleBulkDeleteConfirm = React.useCallback(async () => {
    if (bulkDeletingDepts.length === 0) return;
    try {
      await Promise.all(
        bulkDeletingDepts.map((dept) => deleteDepartment(dept.name)),
      );
      showCrudSuccess(
        copy.deleteSuccess,
        copy.bulkDeleteSuccessDescription.replace(
          "{count}",
          String(bulkDeletingDepts.length),
        ),
      );
      setBulkDeletingDepts([]);
      setRowSelection({});
      refetch();
    } catch (err) {
      showCrudError(copy.deleteFailure, err, copy.deleteFailureDescription);
    }
  }, [
    bulkDeletingDepts,
    copy.bulkDeleteSuccessDescription,
    copy.deleteFailure,
    copy.deleteFailureDescription,
    copy.deleteSuccess,
    deleteDepartment,
    refetch,
  ]);

  const columnMeta = React.useMemo(
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

  const statusCode = (error as { response?: { status?: number } } | null)
    ?.response?.status;
  const isForbidden = statusCode === 403;

  const columns: ColumnDef<BlogDepartment, unknown>[] = React.useMemo(
    () => getDepartmentColumns(t),
    [t],
  );

  if (isForbidden) {
    return (
      <AdminAccessDenied
        description={t.errors.blogDepartmentAccessDeniedDescription}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex sm:flex-row flex-col gap-6 sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
            <p className="text-muted-foreground mt-1">{copy.description}</p>
          </div>
          <Button onClick={handleOpenCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            {copy.addDepartment}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            onValueChange={(v) => {
              setStatusFilter(v as typeof statusFilter);
              setPagination((prev) =>
                prev.pageIndex === 0 ? { ...prev } : { ...prev, pageIndex: 0 },
              );
            }}
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
                  departments?.filter((_, i) => rowSelection[i] === true) ?? [],
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.common.deleteSelected}
            </Button>
          </div>
        )}

        <DepartmentTable
          columns={columns}
          data={departments ?? []}
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
          meta={columnMeta}
          emptyMessage={
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="rounded-full bg-muted p-3">
                <Building2 className="h-6 w-6 text-muted-foreground" />
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
                {copy.addDepartment}
              </Button>
            </div>
          }
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment
                ? copy.editDepartmentTitle
                : copy.addDepartmentTitle}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? copy.editDepartmentDescription
                : copy.addDepartmentDescription}
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm
            department={editingDepartment}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingDepartment}
        onOpenChange={(open) => !open && setDeletingDepartment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteDescriptionStart} &ldquo;
              {deletingDepartment?.department_name}&rdquo;?{" "}
              {copy.deleteDescriptionEnd}
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
        open={bulkDeletingDepts.length > 0}
        onOpenChange={(open) => !open && setBulkDeletingDepts([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {copy.bulkDeleteTitle ?? copy.deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              {bulkDeletingDepts.length === 1 ? (
                `${copy.deleteDescriptionStart} "${bulkDeletingDepts[0]?.department_name}"? ${copy.deleteDescriptionEnd}`
              ) : (
                <span className="block space-y-1">
                  {bulkDeletingDepts.slice(0, 5).map((dept) => (
                    <span key={dept.name} className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">-</span>
                      <span>{dept.department_name}</span>
                    </span>
                  ))}
                  {bulkDeletingDepts.length > 5 && (
                    <span className="block text-muted-foreground">
                      ... {bulkDeletingDepts.length - 5}{" "}
                      {copy.itemsWillBeDeleted ?? "mục khác"}
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
