"use client";

import * as React from "react";
import {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useLanguage } from "@/hooks/useLanguage";

interface TagTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  totalCount?: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: OnChangeFn<Record<string, boolean>>;
  emptyMessage?: React.ReactNode;
  meta?: Record<string, unknown>;
}

export function TagTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  totalCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  emptyMessage,
  meta,
}: TagTableProps<TData, TValue>) {
  const { t } = useLanguage();

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    pageCount: totalCount !== undefined ? Math.ceil(totalCount / pagination.pageSize) : -1,
    state: {
      pagination,
      sorting,
      rowSelection: rowSelection ?? {},
    },
    onPaginationChange,
    onSortingChange,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    meta,
  });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-md border">
        <TableComponent>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {table.getAllColumns().map(column => (
                    <TableCell key={column.id}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-32 text-center">
                  {emptyMessage ?? <span className="text-muted-foreground">{t.table.noData}</span>}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableComponent>
      </div>

      <DataTablePagination table={table} totalCount={totalCount} />
    </div>
  );
}
