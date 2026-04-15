'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { BlogDepartment } from '@/types/blogs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { cn } from '@/lib/utils';

export interface DepartmentColumnMeta {
  onEdit: (dept: BlogDepartment) => void;
  onToggle: (dept: BlogDepartment) => void;
  onDelete: (dept: BlogDepartment) => void;
}

export const DepartmentColumns: ColumnDef<BlogDepartment, unknown>[] = [
  {
    accessorKey: 'sort_order',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Thứ tự" />
    ),
    cell: ({ row }) => (
      <span className="text-center block">{row.original.sort_order ?? 0}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã bộ phận" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.name}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'department_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tên bộ phận" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.department_name}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'department_code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã code" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.department_code}</Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'description',
    header: 'Mô tả',
    cell: ({ row }) =>
      row.original.description ? (
        <span className="text-muted-foreground max-w-[300px] truncate block">
          {row.original.description}
        </span>
      ) : (
        <span className="italic text-muted-foreground">Không có mô tả</span>
      ),
    enableSorting: false,
  },
  {
    accessorKey: 'is_active',
    header: 'Trạng thái',
    cell: ({ row }) => (
      <Badge
        variant={row.original.is_active === 1 ? 'default' : 'secondary'}
        className={cn(
          row.original.is_active === 1 ? 'bg-green-500 text-white' : 'bg-gray-500 text-white',
        )}
      >
        {row.original.is_active === 1 ? 'Hoạt động' : 'Không hoạt động'}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const meta = table.options.meta as DepartmentColumnMeta;
      const dept = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => meta.onEdit(dept)}>
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta.onToggle(dept)}
              className={cn(
                dept.is_active === 1 ? 'text-amber-600' : 'text-green-600',
              )}
            >
              {dept.is_active === 1 ? (
                <>
                  <ToggleLeft className="mr-2 h-4 w-4" />
                  Vô hiệu hóa
                </>
              ) : (
                <>
                  <ToggleRight className="mr-2 h-4 w-4" />
                  Kích hoạt
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => meta.onDelete(dept)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
