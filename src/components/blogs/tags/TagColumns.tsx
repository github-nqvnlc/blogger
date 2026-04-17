"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  BookOpen,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { formatDate } from "date-fns";
import { Tag } from "@/types/blogs";
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

export interface TagColumnMeta {
  onView: (tag: Tag) => void;
  onEdit: (tag: Tag) => void;
  onToggle: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
}

export function getTagColumns(t: Dictionary): ColumnDef<Tag, unknown>[] {
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
      accessorKey: "tag_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.blogTags.table.name} />
      ),
      cell: ({ row, table }) => {
        const meta = table.options.meta as TagColumnMeta;
        const tag = row.original;
        return (
          <span
            className="cursor-pointer font-medium hover:underline hover:underline-offset-4"
            onClick={() => meta.onView(tag)}
          >
            {tag.tag_name}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "slug",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.blogTags.table.slug} />
      ),
      cell: ({ row }) =>
        row.original.slug ? (
          <code className="text-xs text-muted-foreground">
            {row.original.slug}
          </code>
        ) : (
          <span className="italic text-muted-foreground">
            {t.blogTags.table.noSlug}
          </span>
        ),
      enableSorting: true,
    },
    {
      accessorKey: "description",
      header: t.blogTags.table.description,
      cell: ({ row }) =>
        row.original.description ? (
          <span className="block max-w-[300px] truncate text-muted-foreground">
            {row.original.description}
          </span>
        ) : (
          <span className="italic text-muted-foreground">
            {t.blogTags.table.noDescription}
          </span>
        ),
      enableSorting: false,
    },
    {
      accessorKey: "is_active",
      header: t.blogTags.table.status,
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
            ? t.blogTags.table.active
            : t.blogTags.table.inactive}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "creation",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.blogTags.table.creation}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(
            new Date(row.original.creation ?? new Date()),
            " HH:mm dd/MM/yyyy",
          )}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "actions",
      header: t.blogTags.table.actions,
      cell: ({ row, table }) => {
        const meta = table.options.meta as TagColumnMeta;
        const tag = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => meta.onEdit(tag)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t.blogTags.table.edit}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => meta.onView(tag)}>
                <BookOpen className="mr-2 h-4 w-4" />
                {t.blogTags.table.viewDetail}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => meta.onToggle(tag)}
                className={cn(
                  tag.is_active === 1 ? "text-amber-600" : "text-green-600",
                )}
              >
                {tag.is_active === 1 ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    {t.blogTags.table.deactivate}
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    {t.blogTags.table.activate}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => meta.onDelete(tag)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.blogTags.table.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
