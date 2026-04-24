"use client";

import { RichContent } from "@/components/blogs/editor/rich-content";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteDoc, useGetDoc, useGetList, useUpdateDoc } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import {
  formatFrappeDatetime,
  formatPostStatusLabel,
  formatPostVisibilityLabel,
} from "@/lib/blog-posts";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { getBaseUrl } from "@/lib/utils";
import { BlogDepartment, Category, Post, PostTag, PostTopic, Tag, Topic } from "@/types/blogs";
import { formatDate } from "date-fns";
import { Archive, ArrowLeft, Eye, FolderTree, Pencil, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import * as React from "react";

interface PostDetailProps {
  postId: string;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value?: React.ReactNode;
  icon: React.ElementType;
  href?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">
          {href ? (
            <Link href={href} className="hover:underline underline-offset-4">
              {value}
            </Link>
          ) : (
            value
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PostDetail({ postId }: PostDetailProps) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const copy = t.blogPosts.detail;
  const common = t.common;
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const {
    data: post,
    isLoading: isLoadingPost,
    error: postError,
    mutate: refetchPost,
  } = useGetDoc<Post>("posts", postId);

  const departmentId =
    typeof post?.department === "string" ? post.department : post?.department?.name;
  const categoryId = typeof post?.category === "string" ? post.category : post?.category?.name;

  const { data: department } = useGetDoc<BlogDepartment>("blog_departments", departmentId, {
    enabled: !!departmentId,
  });
  const { data: category } = useGetDoc<Category>("categories", categoryId, {
    enabled: !!categoryId,
  });

  const { data: postTopics } = useGetList<PostTopic>(
    "post_topics",
    {
      fields: ["name", "post", "topic"],
      filters: [["post", "=", postId]],
      limit: 100,
    },
    { enabled: !!post }
  );

  const { data: postTags } = useGetList<PostTag>(
    "post_tags",
    {
      fields: ["name", "post", "tag"],
      filters: [["post", "=", postId]],
      limit: 100,
    },
    { enabled: !!post }
  );

  const topicIds = React.useMemo(
    () => Array.from(new Set((postTopics ?? []).map(item => item.topic))),
    [postTopics]
  );
  const tagIds = React.useMemo(
    () => Array.from(new Set((postTags ?? []).map(item => item.tag))),
    [postTags]
  );

  const { data: topics } = useGetList<Topic>(
    "topics",
    {
      fields: ["name", "topic", "slug"],
      filters: topicIds.length ? [["name", "in", topicIds]] : undefined,
      limit: topicIds.length || 50,
    },
    { enabled: topicIds.length > 0 }
  );

  const { data: tags } = useGetList<Tag>(
    "tags",
    {
      fields: ["name", "tag_name", "slug"],
      filters: tagIds.length ? [["name", "in", tagIds]] : undefined,
      limit: tagIds.length || 50,
    },
    { enabled: tagIds.length > 0 }
  );

  const { updateDoc: updatePost } = useUpdateDoc<Post>("posts");
  const { deleteDoc: deletePost } = useDeleteDoc("posts");
  const { deleteDoc: deletePostTopic } = useDeleteDoc("post_topics");
  const { deleteDoc: deletePostTag } = useDeleteDoc("post_tags");

  const handleStatusUpdate = React.useCallback(
    async (nextStatus: Post["status"]) => {
      if (!post) return;

      try {
        await updatePost(post.name, {
          status: nextStatus,
          published_at:
            nextStatus === "Published" && !post.published_at
              ? formatFrappeDatetime(new Date())
              : undefined,
        });
        showCrudSuccess(
          t.blogPosts.toast.statusUpdateSuccess,
          t.blogPosts.toast.statusUpdateSuccessDescription
            .replace("{title}", post.title)
            .replace("{status}", t.blogPosts.status[nextStatus])
        );
        refetchPost();
      } catch (err) {
        showCrudError(
          t.blogPosts.toast.statusUpdateFailure,
          err,
          t.blogPosts.toast.statusUpdateFailureDescription
        );
      }
    },
    [post, refetchPost, t.blogPosts.status, t.blogPosts.toast, updatePost]
  );

  const handleDelete = React.useCallback(async () => {
    if (!post) return;

    try {
      await Promise.all([
        ...(postTopics ?? []).map(pt => deletePostTopic(pt.name)),
        ...(postTags ?? []).map(pt => deletePostTag(pt.name)),
      ]);
      await deletePost(post.name);
      showCrudSuccess(
        t.blogPosts.toast.deleteSuccess,
        t.blogPosts.toast.deleteSuccessDescription.replace("{title}", post.title)
      );
      router.push(buildLocalePath(locale, "/admin/posts"));
    } catch (err) {
      showCrudError(
        t.blogPosts.toast.deleteFailure,
        err,
        t.blogPosts.toast.deleteFailureDescription
      );
    }
  }, [
    deletePost,
    deletePostTag,
    deletePostTopic,
    locale,
    post,
    postTags,
    postTopics,
    router,
    t.blogPosts.toast,
  ]);

  const statusCode = (postError as { response?: { status?: number } } | null)?.response?.status;

  if (statusCode === 403) {
    return <AdminAccessDenied description={t.errors.postAccessDeniedDescription} />;
  }

  if (isLoadingPost) {
    return <OverviewSkeleton />;
  }

  if (!post) {
    return notFound();
  }

  const coverSrc =
    post.thumb && !post.thumb.startsWith("http") ? `${getBaseUrl()}${post.thumb}` : post.thumb;
  const departmentName =
    department?.department_name ??
    (typeof post.department === "string" ? post.department : post.department?.department_name);
  const categoryName =
    category?.category ??
    (typeof post.category === "string" ? post.category : post.category?.category);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Button asChild variant="ghost" size="sm" className="w-fit px-0">
              <Link href={buildLocalePath(locale, "/admin/posts")}>
                <ArrowLeft className="h-4 w-4" />
                {copy.backToList}
              </Link>
            </Button>
            <div className="space-y-2">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{formatPostStatusLabel(post.status, t.blogPosts.status)}</Badge>
                <Badge variant="secondary">
                  {formatPostVisibilityLabel(post.visibility, t.blogPosts.visibility)}
                </Badge>
                {post.slug ? <Badge variant="outline">/{post.slug}</Badge> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={buildLocalePath(locale, `/admin/posts/${post.name}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t.blogPosts.actions.edit}
              </Link>
            </Button>
            {post.status !== "Published" ? (
              <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("Published")}>
                <Send className="mr-2 h-4 w-4" />
                {t.blogPosts.actions.publish}
              </Button>
            ) : null}
            {post.status !== "Draft" ? (
              <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("Draft")}>
                {t.blogPosts.actions.moveToDraft}
              </Button>
            ) : null}
            {post.status !== "Archived" ? (
              <Button size="sm" variant="outline" onClick={() => handleStatusUpdate("Archived")}>
                <Archive className="mr-2 h-4 w-4" />
                {t.blogPosts.actions.archive}
              </Button>
            ) : null}
            <Button size="sm" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t.blogPosts.actions.delete}
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {post.published_at
            ? formatDate(new Date(post.published_at), " HH:mm - dd/MM/yyyy")
            : post.creation
              ? formatDate(new Date(post.creation), " HH:mm - dd/MM/yyyy")
              : copy.noPublishedDate}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="col-span-2 space-y-4">
          {coverSrc ? (
            <figure className="space-y-2">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverSrc}
                  alt={post.thumb_desc || post.title}
                  className="h-full w-full object-cover"
                />
              </div>
              {post.thumb_desc ? (
                <figcaption className="text-center text-xs text-muted-foreground italic">
                  {post.thumb_desc}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{copy.summary}</CardTitle>
              <CardDescription>{post.excerpt || copy.noExcerpt}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{copy.topics}</p>
                  <div className="flex flex-wrap gap-2">
                    {topics?.length ? (
                      topics.map(topic => (
                        <Badge key={topic.name} variant="outline">
                          {topic.topic}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">{copy.noTopics}</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">{copy.tags}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags?.length ? (
                      tags.map(tag => (
                        <Badge key={tag.name} variant="outline">
                          {tag.tag_name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">{copy.noTags}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.content}</CardTitle>
              <CardDescription>{copy.contentDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <RichContent value={post.content} emptyText={copy.noContent} />
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="space-y-4">
            <StatCard
              title={copy.department}
              value={departmentName ?? copy.noDepartment}
              icon={FolderTree}
              href={
                departmentId
                  ? buildLocalePath(locale, `/admin/blog-departments/${departmentId}`)
                  : undefined
              }
            />
            <StatCard
              title={copy.category}
              value={categoryName ?? copy.noCategory}
              icon={FolderTree}
              href={
                categoryId ? buildLocalePath(locale, `/admin/categories/${categoryId}`) : undefined
              }
            />
            <StatCard title={copy.views} value={post.view_count ?? 0} icon={Eye} />
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.blogPosts.actions.delete}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteConfirmDescription.replace("{title}", post.title)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
