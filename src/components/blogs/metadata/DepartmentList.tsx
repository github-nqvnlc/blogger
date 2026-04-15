'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useGetList, useDeleteDoc } from '@/hooks';
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
import { DepartmentForm } from '@/components/blogs/metadata/DepartmentForm';
import { DepartmentTable } from '@/components/blogs/metadata/DepartmentTable';
import { DepartmentColumns } from '@/components/blogs/metadata/DepartmentColumns';

import {
  Search,
  Plus,
  Building2,
} from 'lucide-react';

const PAGE_SIZE = 20;

export function DepartmentList() {
  // ─── Table State (TanStack Table) ───────────────────────────
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'sort_order', desc: false },
  ]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // ─── Filter Bar State (additional server-side filters) ─────
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

  // ─── Dialog & Selection State ────────────────────────────────
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingDepartment, setEditingDepartment] = React.useState<BlogDepartment | null>(null);
  const [deletingDepartment, setDeletingDepartment] = React.useState<BlogDepartment | null>(null);

  // ─── Build API Filters ──────────────────────────────────────
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

  // ─── Build OrderBy from TanStack Table sorting ──────────────
  const orderBy = React.useMemo(() => {
    if (sorting.length === 0) return { field: 'sort_order', order: 'asc' as const };
    const s = sorting[0];
    return {
      field: s.id,
      order: s.desc ? 'desc' as const : 'asc' as const,
    };
  }, [sorting]);

  // ─── Fetch Data ────────────────────────────────────────────
  const { data: departments, isLoading, mutate: refetch } = useGetList<BlogDepartment>(
    'blog_departments',
    {
      fields: ['*'],
      filters: apiFilters,
      orderBy,
      limit_start: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
    },
  );

  // ─── Delete Mutation ───────────────────────────────────────
  const { deleteDoc: deleteDepartment, loading: isDeleting } = useDeleteDoc('blog_departments');

  // ─── Handlers ─────────────────────────────────────────────
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
      toast.success('Xóa thành công', {
        description: `Đã xóa bộ phận nội dung "${deletingDepartment.department_name}"`,
      });
      setDeletingDepartment(null);
      refetch();
    } catch {
      toast.error('Xóa thất bại', {
        description: 'Không thể xóa bộ phận nội dung này. Vui lòng thử lại.',
      });
    }
  }, [deletingDepartment, deleteDepartment, refetch]);

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

  // ─── Reset page when filters change ────────────────────────
  React.useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [apiFilters, orderBy]);

  const totalCount = departments?.length ?? 0;

  const columns: ColumnDef<BlogDepartment, unknown>[] = DepartmentColumns;

  return (
    <>
      <div className="space-y-6">
        {/* ─── Page Header ─── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bộ phận nội dung</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách bộ phận nội dung
            </p>
          </div>
          <Button onClick={handleOpenCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm bộ phận
          </Button>
        </div>

        {/* ─── Filter Bar ─── */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, mã bộ phận..."
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

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={v => setStatusFilter(v as typeof statusFilter)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ─── Data Table ─── */}
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
                <p className="font-medium">Không tìm thấy bộ phận nội dung nào</p>
                <p className="text-sm text-muted-foreground">
                  Thử thay đổi bộ lọc hoặc tạo mới
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleOpenCreateForm}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm bộ phận nội dung
              </Button>
            </div>
          }
        />
      </div>

      {/* ─── Form Dialog ─── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Chỉnh sửa bộ phận nội dung' : 'Thêm bộ phận nội dung mới'}
            </DialogTitle>
          </DialogHeader>
          <DepartmentForm
            department={editingDepartment}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <AlertDialog
        open={!!deletingDepartment}
        onOpenChange={open => !open && setDeletingDepartment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bộ phận nội dung &ldquo;{deletingDepartment?.department_name}&rdquo;?
              Hành động này không thể hoàn tác và có thể ảnh hưởng đến các bài viết đang sử dụng bộ phận nội dung này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner /> : null}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
