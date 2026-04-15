'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useGetList, useDeleteDoc } from '@/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { BlogDepartment } from '@/types/blogs';
import { Filter } from '@/types/hooks';
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdminAccessDenied } from '@/components/layout/admin-access-denied';
import { DepartmentForm } from '@/components/blogs/metadata/DepartmentForm';
import { DepartmentTable } from '@/components/blogs/metadata/DepartmentTable';
import { getDepartmentColumns } from '@/components/blogs/metadata/DepartmentColumns';
import {
  Search,
  Plus,
  Building2,
} from 'lucide-react';

const PAGE_SIZE = 20;

export function DepartmentList() {
  const { t } = useLanguage();
  const copy = t.blogDepartments;
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'sort_order', desc: false },
  ]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingDepartment, setEditingDepartment] = React.useState<BlogDepartment | null>(null);
  const [deletingDepartment, setDeletingDepartment] = React.useState<BlogDepartment | null>(null);

  const apiFilters = React.useMemo<Filter[]>(() => {
    const result: Filter[] = [];

    if (statusFilter === 'active') {
      result.push(['is_active', '=', 1]);
    } else if (statusFilter === 'inactive') {
      result.push(['is_active', '=', 0]);
    }

    const searchValue = columnFilters.find(f => f.id === 'search')?.value as string | undefined;
    if (searchValue && searchValue.trim()) {
      result.push(['name', 'like', `%${searchValue.trim()}%`]);
    }

    return result;
  }, [statusFilter, columnFilters]);

  const orderBy = React.useMemo(() => {
    if (sorting.length === 0) return { field: 'sort_order', order: 'asc' as const };
    const s = sorting[0];
    return {
      field: s.id,
      order: s.desc ? 'desc' as const : 'asc' as const,
    };
  }, [sorting]);

  const { data: departments, isLoading, error, mutate: refetch } = useGetList<BlogDepartment>(
    'blog_departments',
    {
      fields: ['*'],
      filters: apiFilters,
      orderBy,
      limit_start: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
    },
  );

  const { deleteDoc: deleteDepartment, loading: isDeleting } = useDeleteDoc('blog_departments');

  const handleOpenCreateForm = React.useCallback(() => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEditForm = React.useCallback((dept: BlogDepartment) => {
    setEditingDepartment(dept);
    setIsFormOpen(true);
  }, []);

  const handleToggleStatus = React.useCallback(async (dept: BlogDepartment) => {
    setEditingDepartment(dept);
    setIsFormOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deletingDepartment) return;
    try {
      await deleteDepartment(deletingDepartment.name);
      toast.success(copy.deleteSuccess, {
        description: `${copy.deleteSuccessDescriptionPrefix} "${deletingDepartment.department_name}"`,
      });
      setDeletingDepartment(null);
      refetch();
    } catch {
      toast.error(copy.deleteFailure, {
        description: copy.deleteFailureDescription,
      });
    }
  }, [copy.deleteFailure, copy.deleteFailureDescription, copy.deleteSuccess, copy.deleteSuccessDescriptionPrefix, deleteDepartment, deletingDepartment, refetch]);

  const handleFormSuccess = React.useCallback(() => {
    setIsFormOpen(false);
    setEditingDepartment(null);
    refetch();
  }, [refetch]);

  const handleDeleteClick = React.useCallback((dept: BlogDepartment) => {
    setDeletingDepartment(dept);
  }, []);

  const columnMeta = React.useMemo(() => ({
    onEdit: handleOpenEditForm,
    onToggle: handleToggleStatus,
    onDelete: handleDeleteClick,
  }), [handleOpenEditForm, handleToggleStatus, handleDeleteClick]);

  React.useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [apiFilters, orderBy]);

  const statusCode = (error as { response?: { status?: number } } | null)?.response?.status;
  const isForbidden = statusCode === 403;

  const totalCount = departments?.length ?? 0;
  const columns: ColumnDef<BlogDepartment, unknown>[] = React.useMemo(
    () => getDepartmentColumns(t),
    [t],
  );

  if (isForbidden) {
    return (
      <AdminAccessDenied description={t.errors.blogDepartmentAccessDeniedDescription} />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
            <p className="text-muted-foreground mt-1">
              {copy.description}
            </p>
          </div>
          <Button onClick={handleOpenCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            {copy.addDepartment}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={copy.searchPlaceholder}
                  value={(columnFilters.find(f => f.id === 'search')?.value as string) ?? ''}
                  onChange={e =>
                    setColumnFilters(prev => {
                      const existing = prev.find(f => f.id === 'search');
                      if (existing) {
                        return prev.map(f => f.id === 'search' ? { ...f, value: e.target.value } : f);
                      }
                      return [...prev, { id: 'search', value: e.target.value }];
                    })
                  }
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
          </CardContent>
        </Card>

        <DepartmentTable
          columns={columns}
          data={departments ?? []}
          isLoading={isLoading}
          totalCount={totalCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
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
              <Button variant="outline" size="sm" onClick={handleOpenCreateForm}>
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
              {editingDepartment ? copy.editDepartmentTitle : copy.addDepartmentTitle}
            </DialogTitle>
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
        onOpenChange={open => !open && setDeletingDepartment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteDescriptionStart} &ldquo;{deletingDepartment?.department_name}&rdquo;?{' '}
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
    </>
  );
}
