"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  FolderTree,
  Hash,
  Layers3,
  Pencil,
} from "lucide-react";
import { useGetCount, useGetDoc, useGetList } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { BlogDepartment, Category, Post, Topic } from "@/types/blogs";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DepartmentForm } from "./DepartmentForm";
import { notFound } from "next/navigation";
import { formatDate } from "date-fns";

interface DepartmentDetailProps {
  departmentId: string;
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
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
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
}: {
  title: string;
  value?: number;
  icon: React.ElementType;
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
        <div className="text-3xl font-semibold">{value ?? 0}</div>
      </CardContent>
    </Card>
  );
}

export function DepartmentDetail({ departmentId }: DepartmentDetailProps) {
  const { locale, t } = useLanguage();
  const copy = t.blogDepartments.detail;
  const common = t.common;
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const {
    data: department,
    isLoading: isLoadingDepartment,
    error: departmentError,
    mutate: refetchDepartment,
  } = useGetDoc<BlogDepartment>("blog_departments", departmentId);

  const departmentFilter = React.useMemo(
    () => [["department", "=", departmentId]] as Filter[],
    [departmentId],
  );

  const { data: categories, isLoading: isLoadingCategories } =
    useGetList<Category>("categories", {
      fields: [
        "name",
        "category",
        "description",
        "slug",
        "is_active",
        "creation",
      ],
      filters: [...departmentFilter],
      orderBy: { field: "creation", order: "desc" },
      limit: 100,
    });

  const { data: topics, isLoading: isLoadingTopics } = useGetList<Topic>(
    "topics",
    {
      fields: ["name", "topic", "desc", "slug", "is_active", "creation"],
      filters: [...departmentFilter],
      orderBy: { field: "creation", order: "desc" },
      limit: 100,
    },
  );

  const { data: posts, isLoading: isLoadingPosts } = useGetList<Post>("posts", {
    fields: [
      "name",
      "title",
      "category",
      "status",
      "visibility",
      "published_at",
      "creation",
    ],
    filters: [...departmentFilter],
    orderBy: { field: "creation", order: "desc" },
    limit: 100,
  });

  const { data: totalCategories } = useGetCount("categories", [
    ...departmentFilter,
  ]);
  const { data: totalTopics } = useGetCount("topics", [...departmentFilter]);
  const { data: totalPosts } = useGetCount("posts", [...departmentFilter]);

  const statusCode = (
    departmentError as { response?: { status?: number } } | null
  )?.response?.status;

  if (statusCode === 403) {
    return (
      <AdminAccessDenied
        description={t.errors.blogDepartmentAccessDeniedDescription}
      />
    );
  }

  if (isLoadingDepartment) {
    return <OverviewSkeleton />;
  }

  if (!department) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-start sm:justify-between">
          <Button asChild variant="ghost" size="sm" className="w-fit px-0">
            <Link href={buildLocalePath(locale, "/admin/blog-departments")}>
              <ArrowLeft className="h-4 w-4" />
              {copy.backToList}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {department.department_name}
            </h1>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2 ">
            <StatusBadge
              active={department.is_active === 1}
              activeLabel={t.blogDepartments.table.active}
              inactiveLabel={t.blogDepartments.table.inactive}
            />
            <p className="font-semibold text-sm italic text-muted-foreground">
              {department.creation
                ? formatDate(
                    new Date(department.creation),
                    " HH:mm - dd/MM/yyyy",
                  )
                : "-"}
            </p>
          </div>

          <Button size="sm" onClick={() => setEditDialogOpen(true)}>
            Chỉnh sửa
            <Pencil className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={copy.totalCategories}
          value={totalCategories}
          icon={FolderTree}
        />
        <StatCard title={copy.totalTopics} value={totalTopics} icon={Hash} />
        <StatCard title={copy.totalPosts} value={totalPosts} icon={Eye} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.description}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <CardDescription>
            {department.description || copy.noDescription}
          </CardDescription>
        </CardContent>
      </Card>

      <Tabs
        defaultValue="categories"
        className="space-y-2 bg-card rounded-xl p-2 lg:p-4 shadow-2xl"
      >
        <TabsList variant="line" className="w-full justify-start ">
          <TabsTrigger value="categories">{copy.categories}</TabsTrigger>
          <TabsTrigger value="topics">{copy.topics}</TabsTrigger>
          <TabsTrigger value="posts">{copy.posts}</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>{copy.categories}</CardTitle>
              <CardDescription>
                {copy.totalCategories}: {totalCategories ?? 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCategories ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : !categories?.length ? (
                <EmptyState icon={FolderTree} label={copy.noCategories} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.categories}</TableHead>
                      <TableHead>{copy.description}</TableHead>
                      <TableHead>{common.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.name}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{category.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {category.description || copy.noDescription}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            active={category.is_active === 1}
                            activeLabel={t.blogDepartments.table.active}
                            inactiveLabel={t.blogDepartments.table.inactive}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>{copy.topics}</CardTitle>
              <CardDescription>
                {copy.totalTopics}: {totalTopics ?? 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTopics ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : !topics?.length ? (
                <EmptyState icon={Hash} label={copy.noTopics} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.topics}</TableHead>
                      <TableHead>{copy.description}</TableHead>
                      <TableHead>{common.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics.map((topic) => (
                      <TableRow key={topic.name}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{topic.topic}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {topic.desc || copy.noDescription}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            active={topic.is_active === 1}
                            activeLabel={t.blogDepartments.table.active}
                            inactiveLabel={t.blogDepartments.table.inactive}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>{copy.posts}</CardTitle>
              <CardDescription>
                {copy.totalPosts}: {totalPosts ?? 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPosts ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : !posts?.length ? (
                <EmptyState icon={Layers3} label={copy.noPosts} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.posts}</TableHead>
                      <TableHead>{copy.categories}</TableHead>
                      <TableHead>{common.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.name}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{post.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {post.visibility}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {typeof post.category === "string"
                            ? post.category
                            : post.category.category}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{post.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.blogDepartments.editDepartmentTitle}</DialogTitle>
            <DialogDescription>
              {t.blogDepartments.editDepartmentDescription}
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm
            department={department}
            onSuccess={() => {
              setEditDialogOpen(false);
              refetchDepartment();
            }}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
