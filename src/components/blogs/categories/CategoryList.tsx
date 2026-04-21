"use client";

import * as React from "react";
import { flushSync } from "react-dom";
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
import { BlogDepartment, Category } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import {
  getCategoryColumns,
  type CategoryColumnMeta,
} from "@/components/blogs/categories/CategoryColumns";
import { CategoryForm } from "@/components/blogs/categories/CategoryForm";
import { CategoryTable } from "@/components/blogs/categories/CategoryTable";
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
import { DepartmentFilterCombobox } from "@/components/common/DepartmentFilterCombobox";

const PAGE_SIZE = 20;

export function CategoryList() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const copy = t.blogCategories;
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
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [departments, setDepartments] = React.useState<BlogDepartment[]>([]);
  const [search, setSearch] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] =
    React.useState<Category | null>(null);
  const [bulkDeletingCategories, setBulkDeletingCategories] = React.useState<
    Category[]
  >([]);

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
      ["category", "like", `%${search.trim()}%`],
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
    data: categories,
    isLoading,
    error,
    mutate: refetch,
  } = useGetList<Category>("categories", {
    fields: [
      "name",
      "category",
      "department",
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

  const departmentLabelMap = React.useMemo(
    () => new Map(departments.map((item) => [item.name, item.department_name])),
    [departments],
  );

  const { data: totalCount } = useGetCount(
    "categories",
    apiFilters,
    false,
    undefined,
    searchOrFilters,
  );

  const { deleteDoc: deleteCategory, loading: isDeleting } =
    useDeleteDoc("categories");

  const getDepartmentLabel = React.useCallback(
    (category: Category) => {
      const value =
        typeof category.department === "string"
          ? category.department
          : category.department?.name;
      return value
        ? (departmentLabelMap.get(value) ?? value)
        : copy.table.unknownDepartment;
    },
    [copy.table.unknownDepartment, departmentLabelMap],
  );

  const handleOpenCreateForm = React.useCallback(() => {
    setEditingCategory(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEditForm = React.useCallback((category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  }, []);

  const handleViewDetail = React.useCallback(
    (category: Category) => {
      router.push(
        buildLocalePath(locale, `/admin/categories/${category.name}`),
      );
    },
    [locale, router],
  );

  const handleToggleStatus = React.useCallback(async (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deletingCategory) return;

    try {
      await deleteCategory(deletingCategory.name);
      showCrudSuccess(
        copy.deleteSuccess,
        `${copy.deleteSuccessDescriptionPrefix} "${deletingCategory.category}"`,
      );
      setDeletingCategory(null);
      refetch();
    } catch (err) {
      showCrudError(copy.deleteFailure, err, copy.deleteFailureDescription);
    }
  }, [
    copy.deleteFailure,
    copy.deleteFailureDescription,
    copy.deleteSuccess,
    copy.deleteSuccessDescriptionPrefix,
    deleteCategory,
    deletingCategory,
    refetch,
  ]);

  const handleFormSuccess = React.useCallback(() => {
    setIsFormOpen(false);
    setEditingCategory(null);
    refetch();
  }, [refetch]);

  const handleDeleteClick = React.useCallback((category: Category) => {
    setDeletingCategory(category);
  }, []);

  const handleBulkDeleteClick = React.useCallback(
    (selectedCategories: Category[]) => {
      setBulkDeletingCategories(selectedCategories);
    },
    [],
  );

  const handleBulkDeleteConfirm = React.useCallback(async () => {
    if (bulkDeletingCategories.length === 0) return;

    try {
      await Promise.all(
        bulkDeletingCategories.map((category) => deleteCategory(category.name)),
      );
      showCrudSuccess(
        copy.deleteSuccess,
        copy.bulkDeleteSuccessDescription.replace(
          "{count}",
          String(bulkDeletingCategories.length),
        ),
      );
      setBulkDeletingCategories([]);
      setRowSelection({});
      refetch();
    } catch (err) {
      showCrudError(copy.deleteFailure, err, copy.deleteFailureDescription);
    }
  }, [
    bulkDeletingCategories,
    copy.bulkDeleteSuccessDescription,
    copy.deleteFailure,
    copy.deleteFailureDescription,
    copy.deleteSuccess,
    deleteCategory,
    refetch,
  ]);

  const columnMeta = React.useMemo<CategoryColumnMeta>(
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
    ],
  );

  const resetPagination = React.useCallback(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? { ...prev } : { ...prev, pageIndex: 0 },
    );
  }, []);

  React.useEffect(() => {
    flushSync(() => {
      resetPagination();
    });
  }, [apiFilters, departmentFilter, orderBy, resetPagination]);

  const statusCode = (error as { response?: { status?: number } } | null)
    ?.response?.status;

  const columns: ColumnDef<Category, unknown>[] = React.useMemo(
    () => getCategoryColumns(t),
    [t],
  );

  if (statusCode === 403) {
    return (
      <AdminAccessDenied
        description={t.errors.categoryAccessDeniedDescription}
      />
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
            {copy.addCategory}
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

          <DepartmentFilterCombobox
            value={departmentFilter}
            onChange={setDepartmentFilter}
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
                handleBulkDeleteClick(
                  categories?.filter((_, i) => rowSelection[i] === true) ?? [],
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.common.deleteSelected}
            </Button>
          </div>
        )}

        <CategoryTable
          columns={columns}
          data={categories ?? []}
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
                {copy.addCategory}
              </Button>
            </div>
          }
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? copy.editCategoryTitle : copy.addCategoryTitle}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteDescriptionStart} &ldquo;{deletingCategory?.category}
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
        open={bulkDeletingCategories.length > 0}
        onOpenChange={(open) => !open && setBulkDeletingCategories([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {copy.bulkDeleteTitle ?? copy.deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              {bulkDeletingCategories.length === 1 ? (
                `${copy.deleteDescriptionStart} "${bulkDeletingCategories[0]?.category}"? ${copy.deleteDescriptionEnd}`
              ) : (
                <span className="block space-y-1">
                  {bulkDeletingCategories.slice(0, 5).map((category) => (
                    <span
                      key={category.name}
                      className="flex items-start gap-2"
                    >
                      <span className="shrink-0 text-muted-foreground">-</span>
                      <span>{category.category}</span>
                    </span>
                  ))}
                  {bulkDeletingCategories.length > 5 && (
                    <span className="block text-muted-foreground">
                      ... {bulkDeletingCategories.length - 5}{" "}
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
