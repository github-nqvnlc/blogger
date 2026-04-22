"use client";

import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetDoc, useGetList, useLazyLoadList } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { Post, PostTag, Tag } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { formatDate } from "date-fns";
import { ArrowLeft, BookOpen, FolderOpen, Hash, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as React from "react";
import { TagForm } from "./TagForm";

interface TagDetailProps {
  tagId: string;
}

function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <Badge
      variant={active ? "default" : "secondary"}
      className={active ? "bg-green-500 text-white" : "bg-gray-500 text-white"}
    >
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function TagDetail({ tagId }: TagDetailProps) {
  const PAGE_SIZE = 5;
  const { locale, t } = useLanguage();
  const copy = t.blogTags.detail;
  const common = t.common;
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const {
    data: tag,
    isLoading: isLoadingTag,
    error: tagError,
    mutate: refetchTag,
  } = useGetDoc<Tag>("tags", tagId);

  const tagFilter = React.useMemo(() => [["tag", "=", tagId]] as Filter[], [tagId]);

  const {
    loadedItems: accumulatedPostTags,
    isLoading: isLoadingPostTags,
    total: totalPosts,
    scrollRef: postsScrollRef,
    handleScroll: handlePostsScroll,
  } = useLazyLoadList<PostTag>({
    resource: "post_tags",
    fields: ["name", "post", "tag"],
    filters: tagFilter,
    pageSize: PAGE_SIZE,
    enabled: !!tag,
  });

  const relatedPostIds = React.useMemo(
    () => Array.from(new Set(accumulatedPostTags.map(item => item.post))),
    [accumulatedPostTags]
  );

  const relatedPostsFilter = React.useMemo<Filter[]>(() => {
    if (!relatedPostIds.length) return [];
    return [["name", "in", relatedPostIds]];
  }, [relatedPostIds]);

  const { data: loadedPosts } = useGetList<Post>(
    "posts",
    {
      fields: ["name", "title", "status", "visibility", "published_at", "creation"],
      filters: relatedPostsFilter,
      orderBy: { field: "creation", order: "desc" },
      limit: relatedPostIds.length || 100,
    },
    { enabled: relatedPostIds.length > 0 }
  );

  const statusCode = (tagError as { response?: { status?: number } } | null)?.response?.status;

  if (statusCode === 403) {
    return <AdminAccessDenied description={t.errors.tagAccessDeniedDescription} />;
  }

  if (isLoadingTag) {
    return <OverviewSkeleton />;
  }

  if (!tag) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-start sm:justify-between">
          <Button asChild variant="ghost" size="sm" className="w-fit px-0">
            <Link href={buildLocalePath(locale, "/admin/tags")}>
              <ArrowLeft className="h-4 w-4" />
              {copy.backToList}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tag.tag_name}</h1>
            <p className="mt-1 text-muted-foreground">{tag.description || copy.noDescription}</p>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2">
            <StatusBadge
              active={tag.is_active === 1}
              activeLabel={t.blogTags.table.active}
              inactiveLabel={t.blogTags.table.inactive}
            />
            <p className="text-sm font-semibold italic text-muted-foreground">
              {tag.creation ? formatDate(new Date(tag.creation), " HH:mm - dd/MM/yyyy") : "-"}
            </p>
          </div>
          <Button size="sm" onClick={() => setEditDialogOpen(true)}>
            Chỉnh sửa
            <Pencil className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{copy.totalPosts}:</span>
          <span className="text-sm font-bold">{totalPosts}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{copy.slug}:</span>
          <span className="text-sm font-bold">{tag.slug || copy.noSlug}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.posts}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPostTags && !loadedPosts?.length ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : !loadedPosts?.length ? (
            <EmptyState icon={FolderOpen} label={copy.noPosts} />
          ) : (
            <div
              ref={postsScrollRef}
              onScroll={handlePostsScroll}
              className="max-h-96 overflow-y-auto rounded-md border"
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>{copy.posts}</TableHead>
                    <TableHead>{common.status}</TableHead>
                    <TableHead>{copy.visibility}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(loadedPosts ?? []).map((post: Post) => (
                    <TableRow key={post.name}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{post.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {post.published_at
                              ? formatDate(new Date(post.published_at), " HH:mm dd/MM/yyyy")
                              : formatDate(
                                  new Date(post.creation ?? new Date()),
                                  " HH:mm dd/MM/yyyy"
                                )}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{post.visibility}</TableCell>
                    </TableRow>
                  ))}
                  {isLoadingPostTags && loadedPosts.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-8 w-full rounded-md" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.blogTags.editTagTitle}</DialogTitle>
            <DialogDescription>{t.blogTags.editTagDescription}</DialogDescription>
          </DialogHeader>
          <TagForm
            tag={tag}
            onSuccess={() => {
              setEditDialogOpen(false);
              refetchTag();
            }}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
