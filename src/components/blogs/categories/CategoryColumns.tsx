"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
Eye,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { formatDate } from "date-fns";
import { Category } from "@/types/blogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/utils";

export interface CategoryColumnMeta {
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onToggle: (category: Category) => void;
  onDelete: (category: Category) => void;
  getDepartmentLabel: (category: Category) => string;
}

export function getCategoryColumns(
  t: Dictionary,
): ColumnDef<Category, unknown>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.blogCategories.table.name}
        />
      ),
      cell: ({ row, table }) => {
        const meta = table.options.meta as CategoryColumnMeta;
        const category = row.original;
        return (
          <span
            className="cursor-pointer font-medium hover:underline hover:underline-offset-4"
            onClick={() => meta.onView(category)}
          >
            {category.category}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.blogCategories.table.department}
        />
      ),
      cell: ({ row, table }) => {
        const meta = table.options.meta as CategoryColumnMeta;
        return (
          <Badge variant="outline">
            {meta.getDepartmentLabel(row.original)}
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "slug",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.blogCategories.table.slug}
        />
      ),
      cell: ({ row }) =>
        row.original.slug ? (
          <code className="text-xs text-muted-foreground">
            {row.original.slug}
          </code>
        ) : (
          <span className="italic text-muted-foreground">
            {t.blogCategories.table.noSlug}
          </span>
        ),
      enableSorting: true,
    },
    {
      accessorKey: "description",
      header: t.blogCategories.table.description,
      cell: ({ row }) =>
        row.original.description ? (
          <span className="block max-w-[300px] truncate text-muted-foreground">
            {row.original.description}
          </span>
        ) : (
          <span className="italic text-muted-foreground">
            {t.blogCategories.table.noDescription}
          </span>
        ),
      enableSorting: false,
    },
    {
      accessorKey: "is_active",
      header: t.blogCategories.table.status,
      cell: ({ row }) => (
        <Badge
          variant={row.original.is_active === 1 ? "default" : "secondary"}
          className={cn(
            row.original.is_active === 1
              ? "bg-green-500 text-white"
              : "bg-gray-500 text-white",
          )}
        >
          {row.original.is_active === 1
            ? t.blogCategories.table.active
            : t.blogCategories.table.inactive}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "creation",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.blogCategories.table.creation}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(new Date(row.original.creation), " HH:mm dd/MM/yyyy")}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "actions",
      header: t.blogCategories.table.actions,
      cell: ({ row, table }) => {
        const meta = table.options.meta as CategoryColumnMeta;
        const category = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => meta.onEdit(category)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t.blogCategories.table.edit}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => meta.onView(category)}>
                <Eye className="mr-2 h-4 w-4" />
                {t.blogCategories.table.viewDetail}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => meta.onToggle(category)}
                className={cn(
                  category.is_active === 1
                    ? "text-amber-600"
                    : "text-green-600",
                )}
              >
                {category.is_active === 1 ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    {t.blogCategories.table.deactivate}
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    {t.blogCategories.table.activate}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => meta.onDelete(category)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.blogCategories.table.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
