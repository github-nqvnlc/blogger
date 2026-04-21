"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, FolderOpen, Hash, Pencil } from "lucide-react";
import { formatDate } from "date-fns";
import { notFound } from "next/navigation";
import { useGetDoc, useGetList } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { BlogDepartment, Post, PostTopic, Topic } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TopicForm } from "./TopicForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

function EmptyState({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  link,
}: {
  title: string;
  value?: number | string;
  icon: React.ElementType;
  link?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">
          {link ? (
            <Link href={link} className="hover:underline underline-offset-4">
              {value ?? 0}
            </Link>
          ) : (
            <span>{value ?? 0}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TopicDetail({ topicId }: TopicDetailProps) {
  const { locale, t } = useLanguage();
  const copy = t.blogTopics.detail;
  const common = t.common;
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const {
    data: topic,
    isLoading: isLoadingTopic,
    error: topicError,
    mutate: refetchTopic,
  } = useGetDoc<Topic>("topics", topicId);

  const departmentId =
    typeof topic?.department === "string"
      ? topic.department
      : topic?.department?.name;

  const { data: department } = useGetDoc<BlogDepartment>(
    "blog_departments",
    departmentId,
  );

  const topicFilter = React.useMemo(
    () => [["topic", "=", topicId]] as Filter[],
    [topicId],
  );

  const { data: postTopics, isLoading: isLoadingPostTopics } =
    useGetList<PostTopic>(
      "post_topics",
      {
        fields: ["name", "post", "topic"],
        filters: topicFilter,
        limit: 100,
      },
      {
        enabled: !!topic,
      },
    );

  const relatedPostIds = React.useMemo(
    () => Array.from(new Set((postTopics ?? []).map((item) => item.post))),
    [postTopics],
  );

  const relatedPostsFilter = React.useMemo<Filter[]>(() => {
    if (!relatedPostIds.length) return [];
    return [["name", "in", relatedPostIds]];
  }, [relatedPostIds]);

  const { data: posts, isLoading: isLoadingPosts } = useGetList<Post>(
    "posts",
    {
      fields: [
        "name",
        "title",
        "status",
        "visibility",
        "published_at",
        "creation",
      ],
      filters: relatedPostsFilter,
      orderBy: { field: "creation", order: "desc" },
      limit: relatedPostIds.length || 100,
    },
    {
      enabled: relatedPostIds.length > 0,
    },
  );

  const totalPosts = posts?.length ?? 0;

  const statusCode = (topicError as { response?: { status?: number } } | null)
    ?.response?.status;

  if (statusCode === 403) {
    return (
      <AdminAccessDenied description={t.errors.topicAccessDeniedDescription} />
    );
  }

  if (isLoadingTopic) {
    return <OverviewSkeleton />;
  }

  if (!topic) {
    return notFound();
  }

  const departmentName =
    department?.department_name ??
    (typeof topic.department === "string"
      ? topic.department
      : topic.department.department_name);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-start sm:justify-between">
          <Button asChild variant="ghost" size="sm" className="w-fit px-0">
            <Link href={buildLocalePath(locale, "/admin/topics")}>
              <ArrowLeft className="h-4 w-4" />
              {copy.backToList}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{topic.topic}</h1>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2">
            <StatusBadge
              active={topic.is_active === 1}
              activeLabel={t.blogTopics.table.active}
              inactiveLabel={t.blogTopics.table.inactive}
            />
            <p className="text-sm font-semibold italic text-muted-foreground">
              {topic.creation
                ? formatDate(new Date(topic.creation), " HH:mm - dd/MM/yyyy")
                : "-"}
            </p>
          </div>
          <Button size="sm" onClick={() => setEditDialogOpen(true)}>
            Chỉnh sửa
            <Pencil className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title={copy.totalPosts} value={totalPosts} icon={BookOpen} />
        <StatCard
          title={copy.department}
          value={departmentName}
          icon={Hash}
          link={buildLocalePath(
            locale,
            `/admin/blog-departments/${departmentId}`,
          )}
        />
      </div>

      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>{copy.description}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <CardDescription>
              {topic.desc || copy.noDescription}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.posts}</CardTitle>
          <CardDescription>
            {copy.totalPosts}: {totalPosts}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPostTopics ||
          (relatedPostIds.length > 0 && isLoadingPosts) ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : !posts?.length ? (
            <EmptyState icon={FolderOpen} label={copy.noPosts} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.posts}</TableHead>
                  <TableHead>{common.status}</TableHead>
                  <TableHead>{copy.visibility}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.name}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{post.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {post.published_at
                            ? formatDate(
                                new Date(post.published_at),
                                " HH:mm dd/MM/yyyy",
                              )
                            : formatDate(
                                new Date(post.creation ?? new Date()),
                                " HH:mm dd/MM/yyyy",
                              )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {post.visibility}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
