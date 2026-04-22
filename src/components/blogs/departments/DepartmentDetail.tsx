"use client";

import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetDoc, useLazyLoadList } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { BlogDepartment, Category, Post, Topic } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { formatDate } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  FolderOpen,
  FolderTree,
  Hash,
  Layers3,
  Lightbulb,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import * as React from "react";
import { DepartmentForm } from "./DepartmentForm";
import { StatusBadge as StatusBadgePost } from "@/components/ui/badge-status";

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

export function DepartmentDetail({ departmentId }: DepartmentDetailProps) {
  const router = useRouter();
  const PAGE_SIZE = 10;
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
    [departmentId]
  );

  const {
    loadedItems: loadedCategories,
    isLoading: isLoadingCategories,
    total: totalCategories,
    scrollRef: categoriesScrollRef,
    handleScroll: handleCategoriesScroll,
  } = useLazyLoadList<Category>({
    resource: "categories",
    fields: ["name", "category", "description", "slug", "is_active", "creation"],
    filters: departmentFilter,
    orderBy: { field: "creation", order: "desc" },
    pageSize: PAGE_SIZE,
  });

  const {
    loadedItems: loadedTopics,
    isLoading: isLoadingTopics,
    total: totalTopics,
    scrollRef: topicsScrollRef,
    handleScroll: handleTopicsScroll,
  } = useLazyLoadList<Topic>({
    resource: "topics",
    fields: ["name", "topic", "desc", "slug", "is_active", "creation"],
    filters: departmentFilter,
    orderBy: { field: "creation", order: "desc" },
    pageSize: PAGE_SIZE,
  });

  const {
    loadedItems: loadedPosts,
    isLoading: isLoadingPosts,
    total: totalPosts,
    scrollRef: postsScrollRef,
    handleScroll: handlePostsScroll,
  } = useLazyLoadList<Post>({
    resource: "posts",
    fields: ["name", "title", "category", "status", "visibility", "published_at", "creation"],
    filters: departmentFilter,
    orderBy: { field: "creation", order: "desc" },
    pageSize: PAGE_SIZE,
  });

  const statusCode = (departmentError as { response?: { status?: number } } | null)?.response
    ?.status;

  if (statusCode === 403) {
    return <AdminAccessDenied description={t.errors.blogDepartmentAccessDeniedDescription} />;
  }

  if (isLoadingDepartment) {
    return <OverviewSkeleton />;
  }

  if (!department) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit px-0">
        <Link href={buildLocalePath(locale, "/admin/blog-departments")}>
          <ArrowLeft className="h-4 w-4" />
          {copy.backToList}
        </Link>
      </Button>

      <div className="-mt-4 flex flex-col gap-4 sm:flex-row-reverse sm:items-start sm:justify-between">
        <Button size="sm" onClick={() => setEditDialogOpen(true)}>
          Chỉnh sửa
          <Pencil className="h-4 w-4 ml-2" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{department.department_name}</h1>
          <p className="mt-1 text-muted-foreground">
            {department.description || copy.noDescription}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 rounded-lg border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{copy.totalCategories}:</span>
            <span className="text-sm font-bold">{totalCategories ?? 0}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{copy.totalTopics}:</span>
            <span className="text-sm font-bold">{totalTopics ?? 0}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{copy.totalPosts}:</span>
            <span className="text-sm font-bold">{totalPosts ?? 0}</span>
          </div>
        </div>
        <div>
          <div className="flex flex-row items-center gap-3 ">
            <p className="font-semibold text-sm italic text-muted-foreground">
              {department.creation
                ? formatDate(new Date(department.creation), " HH:mm - dd/MM/yyyy")
                : "-"}
            </p>
            <div className="h-4 w-px bg-border" />
            <StatusBadge
              active={department.is_active === 1}
              activeLabel={t.blogDepartments.table.active}
              inactiveLabel={t.blogDepartments.table.inactive}
            />
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="categories"
        className="space-y-2 bg-card rounded-xl p-2 lg:p-4 shadow-2xl"
      >
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger
            value="categories"
            className="data-[state=active]:text-primary font-bold after:bg-primary cursor-pointer"
          >
            {copy.categories}
          </TabsTrigger>
          <TabsTrigger
            value="topics"
            className="data-[state=active]:text-primary font-bold after:bg-primary cursor-pointer"
          >
            {copy.topics}
          </TabsTrigger>
          <TabsTrigger
            value="posts"
            className="data-[state=active]:text-primary font-bold after:bg-primary cursor-pointer"
          >
            {copy.posts}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          {isLoadingCategories && !loadedCategories.length ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : !loadedCategories.length ? (
            <EmptyState icon={FolderTree} label={copy.noCategories} />
          ) : (
            <div
              ref={categoriesScrollRef}
              onScroll={handleCategoriesScroll}
              className="max-h-96 overflow-y-auto rounded-md border"
            >
              <Table noWrapper>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>{copy.categories}</TableHead>
                    <TableHead>{copy.description}</TableHead>
                    <TableHead>{common.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadedCategories.map(category => (
                    <TableRow
                      key={category.name}
                      onClick={() =>
                        router.push(buildLocalePath(locale, `/admin/categories/${category.name}`))
                      }
                      className="cursor-pointer"
                    >
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
                  {isLoadingCategories && loadedCategories.length > 0 && (
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
        </TabsContent>

        <TabsContent value="topics">
          {isLoadingTopics && !loadedTopics.length ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : !loadedTopics.length ? (
            <EmptyState icon={Hash} label={copy.noTopics} />
          ) : (
            <div
              ref={topicsScrollRef}
              onScroll={handleTopicsScroll}
              className="max-h-96 overflow-y-auto rounded-md border"
            >
              <Table noWrapper>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>{copy.topics}</TableHead>
                    <TableHead>{copy.description}</TableHead>
                    <TableHead>{common.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadedTopics.map(topic => (
                    <TableRow
                      key={topic.name}
                      onClick={() =>
                        router.push(buildLocalePath(locale, `/admin/topics/${topic.name}`))
                      }
                      className="cursor-pointer"
                    >
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
                  {isLoadingTopics && loadedTopics.length > 0 && (
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
        </TabsContent>

        <TabsContent value="posts">
          {isLoadingPosts && !loadedPosts.length ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : !loadedPosts.length ? (
            <EmptyState icon={Layers3} label={copy.noPosts} />
          ) : (
            <div
              ref={postsScrollRef}
              onScroll={handlePostsScroll}
              className="max-h-[480px] overflow-y-auto rounded-md border"
            >
              <Table noWrapper>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>{copy.posts}</TableHead>
                    <TableHead>{copy.categories}</TableHead>
                    <TableHead>{common.status}</TableHead>
                    <TableHead>{copy.createdAt}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadedPosts.map(post => (
                    <TableRow key={post.name}>
                      <TableCell
                        onClick={() =>
                          router.push(buildLocalePath(locale, `/admin/posts/${post.name}`))
                        }
                        className="cursor-pointer"
                      >
                        <p className="font-medium">{post.title}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {typeof post.category === "string" ? post.category : post.category.category}
                      </TableCell>
                      <TableCell>
                        <StatusBadgePost status={post.status} t={t} />
                      </TableCell>
                      <TableCell className="text-sm italic text-muted-foreground">
                        {post.creation
                          ? formatDate(new Date(post.creation), " HH:mm - dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {isLoadingPosts && loadedPosts.length > 0 && (
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
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.blogDepartments.editDepartmentTitle}</DialogTitle>
            <DialogDescription>{t.blogDepartments.editDepartmentDescription}</DialogDescription>
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
