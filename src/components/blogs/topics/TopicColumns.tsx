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
import { Topic } from "@/types/blogs";
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

export interface TopicColumnMeta {
  onView: (topic: Topic) => void;
  onEdit: (topic: Topic) => void;
  onToggle: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
  getDepartmentLabel: (topic: Topic) => string;
}

export function getTopicColumns(t: Dictionary): ColumnDef<Topic, unknown>[] {
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
      accessorKey: "topic",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.blogTopics.table.name}
        />
      ),
      cell: ({ row, table }) => {
        const meta = table.options.meta as TopicColumnMeta;
        const topic = row.original;
        return (
          <span
            className="cursor-pointer font-medium hover:underline hover:underline-offset-4"
            onClick={() => meta.onView(topic)}
          >
            {topic.topic}
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
          title={t.blogTopics.table.department}
        />
      ),
      cell: ({ row, table }) => {
        const meta = table.options.meta as TopicColumnMeta;
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
          title={t.blogTopics.table.slug}
        />
      ),
      cell: ({ row }) =>
        row.original.slug ? (
          <code className="text-xs text-muted-foreground">
            {row.original.slug}
          </code>
        ) : (
          <span className="italic text-muted-foreground">
            {t.blogTopics.table.noSlug}
          </span>
        ),
      enableSorting: true,
    },
    {
      accessorKey: "desc",
      header: t.blogTopics.table.description,
      cell: ({ row }) =>
        row.original.desc ? (
          <span className="block max-w-[300px] truncate text-muted-foreground">
            {row.original.desc}
          </span>
        ) : (
          <span className="italic text-muted-foreground">
            {t.blogTopics.table.noDescription}
          </span>
        ),
      enableSorting: false,
    },
    {
      accessorKey: "is_active",
      header: t.blogTopics.table.status,
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
            ? t.blogTopics.table.active
            : t.blogTopics.table.inactive}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "creation",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.blogTopics.table.creation}
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
      header: t.blogTopics.table.actions,
      cell: ({ row, table }) => {
        const meta = table.options.meta as TopicColumnMeta;
        const topic = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => meta.onEdit(topic)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t.blogTopics.table.edit}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => meta.onView(topic)}>
                <Eye className="mr-2 h-4 w-4" />
                {t.blogTopics.table.viewDetail}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => meta.onToggle(topic)}
                className={cn(
                  topic.is_active === 1 ? "text-amber-600" : "text-green-600",
                )}
              >
                {topic.is_active === 1 ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    {t.blogTopics.table.deactivate}
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    {t.blogTopics.table.activate}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => meta.onDelete(topic)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.blogTopics.table.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
