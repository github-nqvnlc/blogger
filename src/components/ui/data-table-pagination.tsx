'use client';

import { type Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalCount?: number;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  totalCount,
  pageSizeOptions = [10, 20, 25, 30, 50],
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground mb-2 lg:mb-0">
        {totalCount !== undefined ? (
          <>
            Hiển thị{' '}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            –
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
              totalCount,
            )}{' '}
            trong {totalCount} bản ghi
          </>
        ) : (
          <>
            {table.getFilteredRowModel().rows.length} bản ghi
          </>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
        <div className="flex items-center justify-between lg:justify-start gap-2 w-full lg:w-auto">
          <p className="text-sm font-medium">Số dòng / trang</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={value => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue
                placeholder={table.getState().pagination.pageSize}
              />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map(pageSize => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-row justify-between lg:justify-start items-center gap-2 w-full lg:w-auto">
          <div className="flex lg:w-[100px] w-full items-center justify-between text-sm font-medium">
            Trang {table.getState().pagination.pageIndex + 1} /{' '}
            {table.getPageCount()}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Đến trang đầu</span>
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Trang trước</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Trang sau</span>
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Đến trang cuối</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
