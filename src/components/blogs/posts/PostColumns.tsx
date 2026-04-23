/* eslint-disable @next/next/no-img-element */
"use client";

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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Dictionary } from "@/i18n";
import { formatPostStatusLabel, formatPostVisibilityLabel } from "@/lib/blog-posts";
import { cn, getBaseUrl } from "@/lib/utils";
import { Post } from "@/types/blogs";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { Archive, Eye, MoreHorizontal, Pencil, Send, SquarePen, Trash2 } from "lucide-react";

export interface PostColumnMeta {
  onView: (post: Post) => void;
  onEdit: (post: Post) => void;
  onPublish: (post: Post) => void;
  onMoveToDraft: (post: Post) => void;
  onArchive: (post: Post) => void;
  onDelete: (post: Post) => void;
  getDepartmentLabel: (post: Post) => string;
  getCategoryLabel: (post: Post) => string;
}

function StatusBadge({ post, t }: { post: Post; t: Dictionary }) {
  const tone =
    post.status === "Published"
      ? "bg-green-500 text-white"
      : post.status === "Archived"
        ? "bg-slate-500 text-white"
        : "bg-amber-500 text-white";

  return (
    <Badge variant="secondary" className={cn(tone)}>
      {formatPostStatusLabel(post.status, t.blogPosts.status)}
    </Badge>
  );
}

export function getPostColumns(t: Dictionary): ColumnDef<Post, unknown>[] {
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
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "thumb",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.blogPosts.table.thumb} />
      ),
      cell: ({ row, table }) => {
        const meta = table.options.meta as PostColumnMeta;
        const post = row.original;

        return (
          <div className="max-w-56 cursor-pointer space-y-1" onClick={() => meta.onView(post)}>
            <img
              src={`${getBaseUrl()}${post.thumb}`}
              alt={post.title}
              className="min-w-56 h-auto rounded-sm aspect-video object-cover"
            />
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.blogPosts.table.title} />
      ),
      cell: ({ row, table }) => {
        const meta = table.options.meta as PostColumnMeta;
        const post = row.original;

        return (
          <div
            className="max-w-[300px] lg:max-w-[500px] cursor-pointer space-y-1 overflow-hidden"
            onClick={() => meta.onView(post)}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-bold text-[16px] hover:underline hover:underline-offset-4 truncate">
                  {post.title}
                </p>
              </TooltipTrigger>
              <TooltipContent>{post.title}</TooltipContent>
            </Tooltip>
            <p className="text-justify text-xs italic text-muted-foreground truncate line-clamp-3 whitespace-normal wrap-break-word">
              {post.excerpt || "-"}
            </p>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.blogPosts.table.department} />
      ),
      cell: ({ row, table }) => {
        const meta = table.options.meta as PostColumnMeta;
        return <Badge variant="outline">{meta.getDepartmentLabel(row.original)}</Badge>;
      },
      enableSorting: true,
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.blogPosts.table.category} />
      ),
      cell: ({ row, table }) => {
        const meta = table.options.meta as PostColumnMeta;
        return <Badge variant="outline">{meta.getCategoryLabel(row.original)}</Badge>;
      },
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.blogPosts.table.status} />
      ),
      cell: ({ row }) => <StatusBadge post={row.original} t={t} />,
      enableSorting: true,
    },
    {
      accessorKey: "visibility",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.blogPosts.table.visibility} />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {formatPostVisibilityLabel(row.original.visibility, t.blogPosts.visibility)}
        </Badge>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "view_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.blogPosts.table.views} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.view_count ?? 0}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "published_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.blogPosts.table.publishedAt} />
      ),
      cell: ({ row }) => {
        const dateValue = row.original.published_at || row.original.creation;

        return dateValue ? (
          <span className="text-muted-foreground">
            {formatDate(new Date(dateValue), " HH:mm dd/MM/yyyy")}
          </span>
        ) : (
          <span className="italic text-muted-foreground">{t.blogPosts.table.noPublishedDate}</span>
        );
      },
      enableSorting: true,
    },
    {
      id: "actions",
      header: t.blogPosts.table.actions,
      cell: ({ row, table }) => {
        const meta = table.options.meta as PostColumnMeta;
        const post = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => meta.onEdit(post)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t.blogPosts.actions.edit}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => meta.onView(post)}>
                <Eye className="mr-2 h-4 w-4" />
                {t.blogPosts.actions.viewDetail}
              </DropdownMenuItem>
              {post.status !== "Published" ? (
                <DropdownMenuItem onClick={() => meta.onPublish(post)} className="text-green-600">
                  <Send className="mr-2 h-4 w-4 text-green-600" />
                  {t.blogPosts.actions.publish}
                </DropdownMenuItem>
              ) : null}
              {post.status !== "Draft" ? (
                <DropdownMenuItem
                  onClick={() => meta.onMoveToDraft(post)}
                  className="text-amber-500"
                >
                  <SquarePen className="mr-2 h-4 w-4 text-amber-500" />
                  {t.blogPosts.actions.moveToDraft}
                </DropdownMenuItem>
              ) : null}
              {post.status !== "Archived" ? (
                <DropdownMenuItem onClick={() => meta.onArchive(post)} className="text-pink-500">
                  <Archive className="mr-2 h-4 w-4 text-pink-500" />
                  {t.blogPosts.actions.archive}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => meta.onDelete(post)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4 text-destructive focus:text-destructive" />
                {t.blogPosts.actions.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}
