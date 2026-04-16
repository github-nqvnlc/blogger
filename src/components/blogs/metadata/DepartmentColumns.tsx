"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { BlogDepartment } from "@/types/blogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "date-fns";

export interface DepartmentColumnMeta {
  onEdit: (dept: BlogDepartment) => void;
  onToggle: (dept: BlogDepartment) => void;
  onDelete: (dept: BlogDepartment) => void;
}

export function getDepartmentColumns(
  t: Dictionary,
): ColumnDef<BlogDepartment, unknown>[] {
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
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
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
      accessorKey: "department_name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.blogDepartments.table.name}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.department_name}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "department_code",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.blogDepartments.table.codeShort}
        />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.department_code}</Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "description",
      header: t.blogDepartments.table.description,
      cell: ({ row }) =>
        row.original.description ? (
          <span className="text-muted-foreground max-w-[300px] truncate block">
            {row.original.description}
          </span>
        ) : (
          <span className="italic text-muted-foreground">
            {t.blogDepartments.table.noDescription}
          </span>
        ),
      enableSorting: false,
    },
    {
      accessorKey: "is_active",
      header: t.blogDepartments.table.status,
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
            ? t.blogDepartments.table.active
            : t.blogDepartments.table.inactive}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "creation",
      header: t.blogDepartments.table.creation,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(new Date(row.original.creation), " HH:mm dd/MM/yyyy")}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: "actions",
      header: t.blogDepartments.table.actions,
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
                {t.blogDepartments.table.edit}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => meta.onToggle(dept)}
                className={cn(
                  dept.is_active === 1 ? "text-amber-600" : "text-green-600",
                )}
              >
                {dept.is_active === 1 ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    {t.blogDepartments.table.deactivate}
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    {t.blogDepartments.table.activate}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => meta.onDelete(dept)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.blogDepartments.table.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
