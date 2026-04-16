"use client";

import { type Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalCount?: number;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  totalCount,
  pageSizeOptions = [10, 20, 50, 100, 200, 500, 1000, 2500],
}: DataTablePaginationProps<TData>) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col xl:flex-row items-center justify-between px-2 gap-4">
      <div className="flex-1 text-sm text-muted-foreground mb-2 lg:mb-0">
        {totalCount !== undefined ? (
          <>
            {t.pagination.showing}{" "}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
            –
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              totalCount,
            )}{" "}
            {t.pagination.of} {totalCount} {t.pagination.records}
          </>
        ) : (
          <>
            {table.getFilteredRowModel().rows.length} {t.pagination.records}
          </>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
        <div className="flex items-center justify-between lg:justify-start gap-2 w-full lg:w-auto">
          <p className="text-sm font-medium">{t.pagination.rowsPerPage}</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-row justify-between lg:justify-start items-center gap-2 w-full lg:w-auto">
          <div className="flex lg:w-[100px] w-full items-center justify-between text-sm font-medium">
            {t.pagination.page} {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{t.pagination.firstPage}</span>
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">{t.pagination.previousPage}</span>
              <ChevronLeft />
            </Button>

            {(() => {
              const totalPages = table.getPageCount();
              const currentPage = table.getState().pagination.pageIndex + 1;
              if (totalPages <= 7) {
                return Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="icon"
                      className="size-8"
                      onClick={() => table.setPageIndex(page - 1)}
                    >
                      {page}
                    </Button>
                  ),
                );
              }
              const pages: (number | "...")[] = [];
              if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, "...", totalPages);
              } else if (currentPage >= totalPages - 3) {
                pages.push(
                  1,
                  "...",
                  totalPages - 4,
                  totalPages - 3,
                  totalPages - 2,
                  totalPages - 1,
                  totalPages,
                );
              } else {
                pages.push(
                  1,
                  "...",
                  currentPage - 1,
                  currentPage,
                  currentPage + 1,
                  "...",
                  totalPages,
                );
              }
              return pages.map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex items-center justify-center size-8 text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    className="size-8"
                    onClick={() => table.setPageIndex(page - 1)}
                  >
                    {page}
                  </Button>
                ),
              );
            })()}

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{t.pagination.nextPage}</span>
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">{t.pagination.lastPage}</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
