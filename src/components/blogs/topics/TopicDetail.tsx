"use client";

import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge as StatusBadgePost } from "@/components/ui/badge-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteDoc, useGetDoc, useGetList, useLazyLoadList } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { getApiClient } from "@/lib/apiClient";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { BlogDepartment, Post, PostTopic, Topic } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { formatDate } from "date-fns";
import { ArrowLeft, BookOpen, FolderOpen, Newspaper, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import * as React from "react";
import { TopicForm } from "./TopicForm";

type RelationItem = { name: string; post?: string };

async function getRelationCount(
  resource: string,
  filterField: string,
  filterValue: string
): Promise<number> {
  const apiClient = getApiClient();
  const res = await apiClient.get(`/api/resource/${resource}`, {
    params: {
      fields: JSON.stringify(["name"]),
      filters: JSON.stringify([[filterField, "=", filterValue]]),
      limit_page_length: 99999,
      limit_start: 0,
    },
  });
  const raw = (res.data ?? []) as { data?: unknown[] } | unknown[];
  const list = Array.isArray(raw) ? raw : (raw.data ?? []);
  return list.length;
}

async function getRelationItems(
  resource: string,
  filterField: string,
  filterValue: string,
  labelField: string
): Promise<RelationItem[]> {
  const apiClient = getApiClient();
  const res = await apiClient.get(`/api/resource/${resource}`, {
    params: {
      fields: JSON.stringify(["name", labelField]),
      filters: JSON.stringify([[filterField, "=", filterValue]]),
      limit_page_length: 99999,
      limit_start: 0,
    },
  });
  const raw = (res.data ?? []) as { data?: RelationItem[] } | RelationItem[];
  const list = Array.isArray(raw) ? raw : (raw.data ?? []);
  return list;
}

interface TopicDetailProps {
  topicId: string;
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

export function TopicDetail({ topicId }: TopicDetailProps) {
  const router = useRouter();
  const PAGE_SIZE = 5;
  const { locale, t } = useLanguage();
  const copy = t.blogTopics.detail;
  const common = t.common;
  const copyList = t.blogTopics;
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deletingTopic, setDeletingTopic] = React.useState<Topic | null>(null);
  const [blockedTopic, setBlockedTopic] = React.useState<Topic | null>(null);
  const [blockedItems, setBlockedItems] = React.useState<{
    posts: RelationItem[];
  }>({ posts: [] });
  const { deleteDoc: deleteTopic, loading: isDeleting } = useDeleteDoc("topics");

  const checkTopicRelations = React.useCallback(async (topicName: string) => {
    const [posts, postItems] = await Promise.all([
      getRelationCount("post_topics", "topic", topicName),
      getRelationItems("post_topics", "topic", topicName, "post"),
    ]);
    return {
      counts: { posts },
      items: { posts: postItems },
    };
  }, []);

  const handleDeleteClick = React.useCallback(
    async (topic: Topic) => {
      try {
        const { counts, items } = await checkTopicRelations(topic.name);
        if (counts.posts > 0) {
          setBlockedItems(items);
          setBlockedTopic(topic);
        } else {
          setDeletingTopic(topic);
        }
      } catch {
        setDeletingTopic(topic);
      }
    },
    [checkTopicRelations]
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deletingTopic) return;
    try {
      await deleteTopic(deletingTopic.name);
      showCrudSuccess(
        copyList.deleteSuccess,
        `${copyList.deleteSuccessDescriptionPrefix} "${deletingTopic.topic}"`
      );
      setDeletingTopic(null);
      router.push(buildLocalePath(locale, "/admin/topics"));
    } catch (err) {
      showCrudError(copyList.deleteFailure, err, copyList.deleteFailureDescription);
    }
  }, [copyList, deleteTopic, deletingTopic, locale, router]);

  const {
    data: topic,
    isLoading: isLoadingTopic,
    error: topicError,
    mutate: refetchTopic,
  } = useGetDoc<Topic>("topics", topicId);

  const departmentId =
    typeof topic?.department === "string" ? topic.department : topic?.department?.name;

  const { data: department } = useGetDoc<BlogDepartment>("blog_departments", departmentId);

  const topicFilter = React.useMemo(() => [["topic", "=", topicId]] as Filter[], [topicId]);

  const {
    loadedItems: accumulatedPostTopics,
    isLoading: isLoadingPostTopics,
    total: totalPosts,
    scrollRef: postsScrollRef,
    handleScroll: handlePostsScroll,
  } = useLazyLoadList<PostTopic>({
    resource: "post_topics",
    fields: ["name", "post", "topic"],
    filters: topicFilter,
    pageSize: PAGE_SIZE,
    enabled: !!topic,
  });

  const relatedPostIds = React.useMemo(
    () => Array.from(new Set(accumulatedPostTopics.map(item => item.post))),
    [accumulatedPostTopics]
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

  const statusCode = (topicError as { response?: { status?: number } } | null)?.response?.status;

  if (statusCode === 403) {
    return <AdminAccessDenied description={t.errors.topicAccessDeniedDescription} />;
  }

  if (isLoadingTopic) {
    return <OverviewSkeleton />;
  }

  if (!topic) {
    return notFound();
  }

  const departmentName =
    department?.department_name ??
    (typeof topic.department === "string" ? topic.department : topic.department.department_name);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit px-0">
        <Link href={buildLocalePath(locale, "/admin/topics")}>
          <ArrowLeft className="h-4 w-4" />
          {copy.backToList}
        </Link>
      </Button>

      <div className="-mt-4 flex flex-col gap-4 sm:flex-row-reverse sm:items-start sm:justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(topic)}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t.common.delete}
          </Button>
          <Button size="sm" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Chỉnh sửa
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{topic.topic}</h1>
          <p className="mt-1 text-muted-foreground">{topic.desc || copy.noDescription}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 rounded-lg border px-4 py-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{copy.department}:</span>
            <Link
              href={buildLocalePath(locale, `/admin/blog-departments/${departmentId}`)}
              className="text-sm font-bold hover:underline underline-offset-4"
            >
              {departmentName}
            </Link>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-wrap justify-between items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{copy.totalPosts}:</span>
            <span className="text-sm font-bold">{totalPosts}</span>
          </div>
        </div>
        <div className="flex flex-row items-center gap-3">
          <p className="text-sm font-semibold italic text-muted-foreground">
            {topic.creation ? formatDate(new Date(topic.creation), " HH:mm - dd/MM/yyyy") : "-"}
          </p>
          <div className="h-4 w-px bg-border" />
          <StatusBadge
            active={topic.is_active === 1}
            activeLabel={t.blogTopics.table.active}
            inactiveLabel={t.blogTopics.table.inactive}
          />
        </div>
      </div>

      {isLoadingPostTopics && !loadedPosts?.length ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : !loadedPosts?.length ? (
        <EmptyState icon={FolderOpen} label={copy.noPosts} />
      ) : (
        <div
          ref={postsScrollRef}
          onScroll={handlePostsScroll}
          className="max-h-[550px] overflow-y-auto rounded-md border"
        >
          <Table noWrapper>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>{copy.posts}</TableHead>
                <TableHead>{common.status}</TableHead>
                <TableHead>{copy.visibility}</TableHead>
                <TableHead>{copy.createdAt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(loadedPosts ?? []).map((post: Post) => (
                <TableRow key={post.name}>
                  <TableCell
                    onClick={() =>
                      router.push(buildLocalePath(locale, `/admin/posts/${post.name}`))
                    }
                    className="cursor-pointer"
                  >
                    <p className="font-medium">{post.title}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadgePost status={post.status} t={t} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{post.visibility}</TableCell>
                  <TableCell>
                    <p className="text-sm italic text-muted-foreground">
                      {post.creation
                        ? formatDate(new Date(post.creation), " HH:mm - dd/MM/yyyy")
                        : "-"}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
              {isLoadingPostTopics && loadedPosts.length > 0 && (
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.blogTopics.editTopicTitle}</DialogTitle>
            <DialogDescription>{t.blogTopics.editTopicDescription}</DialogDescription>
          </DialogHeader>
          <TopicForm
            topic={topic}
            onSuccess={() => {
              setEditDialogOpen(false);
              refetchTopic();
            }}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTopic} onOpenChange={open => !open && setDeletingTopic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copyList.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copyList.deleteDescriptionStart} &ldquo;{deletingTopic?.topic}&rdquo;?{" "}
              {copyList.deleteDescriptionEnd}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner /> : null}
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!blockedTopic} onOpenChange={open => !open && setBlockedTopic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copyList.deleteBlockedTitle}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-6">
              <span className="block">{copyList.deleteBlockedDescription}</span>
              {blockedItems.posts.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {copyList.deleteBlockedLinkPosts} ({blockedItems.posts.length})
                  </span>
                  <ul className="pl-4 space-y-1 max-h-32 overflow-y-auto">
                    {blockedItems.posts.map((item, index) => (
                      <li key={item.name}>
                        <Link
                          href={buildLocalePath(locale, `/admin/posts/${item.post}`)}
                          target="blank"
                          className="text-foreground underline underline-offset-3 hover:text-muted-foreground text-sm"
                          onClick={() => setBlockedTopic(null)}
                        >
                          {t.blogPosts.post}: {index + 1}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.close}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
