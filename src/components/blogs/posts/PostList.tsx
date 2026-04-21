"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import {
  Archive,
  FolderOpen,
  Plus,
  Search,
  Send,
  SquarePen,
  Trash2,
} from "lucide-react";
import { useDeleteDoc, useGetCount, useGetList, useUpdateDoc } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { buildLocalePath } from "@/i18n";
import { BlogDepartment, Category, Post, PostStatus } from "@/types/blogs";
import { Filter } from "@/types/hooks";
import { AdminAccessDenied } from "@/components/layout/admin-access-denied";
import {
  getPostColumns,
  type PostColumnMeta,
} from "@/components/blogs/posts/PostColumns";
import { PostTable } from "@/components/blogs/posts/PostTable";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { formatFrappeDatetime } from "@/lib/blog-posts";
import { DepartmentFilterCombobox } from "@/components/common/DepartmentFilterCombobox";
import { CategoryFilterCombobox } from "@/components/common/CategoryFilterCombobox";
import { TopicFilterCombobox } from "@/components/common/TopicFilterCombobox";
import { TagFilterCombobox } from "@/components/common/TagFilterCombobox";
const PAGE_SIZE = 20;

function mapQueryStatus(value: string | null): "all" | PostStatus {
  switch (value) {
    case "draft":
      return "Draft";
    case "published":
      return "Published";
    case "archived":
      return "Archived";
    default:
      return "all";
  }
}

export function PostList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useLanguage();
  const copy = t.blogPosts;
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "creation", desc: true },
  ]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [statusFilter, setStatusFilter] = React.useState<"all" | PostStatus>(
    "all",
  );
  const [visibilityFilter, setVisibilityFilter] = React.useState<
    "all" | Post["visibility"]
  >("all");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [topicFilter, setTopicFilter] = React.useState<string>("all");
  const [tagFilter, setTagFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [deletingPost, setDeletingPost] = React.useState<Post | null>(null);
  const [bulkDeletingPosts, setBulkDeletingPosts] = React.useState<Post[]>([]);

  React.useEffect(() => {
    setStatusFilter(mapQueryStatus(searchParams.get("status")));
  }, [searchParams]);

  const apiFilters = React.useMemo<Filter[]>(() => {
    const result: Filter[] = [];

    if (statusFilter !== "all") {
      result.push(["status", "=", statusFilter]);
    }

    if (visibilityFilter !== "all") {
      result.push(["visibility", "=", visibilityFilter]);
    }

    if (departmentFilter !== "all") {
      result.push(["department", "=", departmentFilter]);
    }

    if (categoryFilter !== "all") {
      result.push(["category", "=", categoryFilter]);
    }

    if (topicFilter !== "all") {
      result.push(["topic", "=", topicFilter]);
    }

    if (tagFilter !== "all") {
      result.push(["tag", "=", tagFilter]);
    }

    return result;
  }, [
    categoryFilter,
    departmentFilter,
    statusFilter,
    topicFilter,
    tagFilter,
    visibilityFilter,
  ]);

  const searchOrFilters = React.useMemo<Filter[]>(() => {
    const keyword = search.trim();
    if (!keyword) return [];

    return [
      ["title", "like", `%${keyword}%`],
      ["slug", "like", `%${keyword}%`],
      ["excerpt", "like", `%${keyword}%`],
    ];
  }, [search]);

  const orderBy = React.useMemo(() => {
    if (sorting.length === 0) {
      return { field: "creation", order: "desc" as const };
    }

    const s = sorting[0];
    return {
      field: s.id,
      order: s.desc ? ("desc" as const) : ("asc" as const),
    };
  }, [sorting]);

  const {
    data: posts,
    isLoading,
    error,
    mutate: refetch,
  } = useGetList<Post>("posts", {
    fields: [
      "name",
      "title",
      "slug",
      "thumb",
      "excerpt",
      "published_at",
      "status",
      "visibility",
      "view_count",
      "category",
      "department",
      "creation",
    ],
    filters: apiFilters,
    orFilters: searchOrFilters,
    orderBy,
    limit_start: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
  });

  const { data: totalCount } = useGetCount(
    "posts",
    apiFilters,
    false,
    undefined,
    searchOrFilters,
  );

  const [departments, setDepartments] = React.useState<BlogDepartment[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const { updateDoc: updatePost } = useUpdateDoc<Post>("posts");
  const { deleteDoc: deletePost } = useDeleteDoc("posts");

  const departmentLabelMap = React.useMemo(
    () => new Map(departments.map((item) => [item.name, item.department_name])),
    [departments],
  );
  const categoryLabelMap = React.useMemo(
    () => new Map(categories.map((item) => [item.name, item.category])),
    [categories],
  );

  const getDepartmentLabel = React.useCallback(
    (post: Post) => {
      const value =
        typeof post.department === "string"
          ? post.department
          : post.department?.name;
      return value
        ? (departmentLabelMap.get(value) ?? value)
        : copy.table.unknownDepartment;
    },
    [copy.table.unknownDepartment, departmentLabelMap],
  );

  const getCategoryLabel = React.useCallback(
    (post: Post) => {
      const value =
        typeof post.category === "string" ? post.category : post.category?.name;
      return value
        ? (categoryLabelMap.get(value) ?? value)
        : copy.table.unknownCategory;
    },
    [categoryLabelMap, copy.table.unknownCategory],
  );

  const handleViewDetail = React.useCallback(
    (post: Post) => {
      router.push(buildLocalePath(locale, `/admin/posts/${post.name}`));
    },
    [locale, router],
  );

  const handleEdit = React.useCallback(
    (post: Post) => {
      router.push(buildLocalePath(locale, `/admin/posts/${post.name}/edit`));
    },
    [locale, router],
  );

  const handleStatusUpdate = React.useCallback(
    async (post: Post, nextStatus: PostStatus) => {
      try {
        const payload: Partial<Post> = { status: nextStatus };

        if (nextStatus === "Published" && !post.published_at) {
          payload.published_at = formatFrappeDatetime(new Date());
        }

        await updatePost(post.name, payload);
        showCrudSuccess(
          copy.toast.statusUpdateSuccess,
          copy.toast.statusUpdateSuccessDescription
            .replace("{title}", post.title)
            .replace("{status}", copy.status[nextStatus]),
        );
        refetch();
      } catch (err) {
        showCrudError(
          copy.toast.statusUpdateFailure,
          err,
          copy.toast.statusUpdateFailureDescription,
        );
      }
    },
    [
      copy.status,
      copy.toast.statusUpdateFailure,
      copy.toast.statusUpdateFailureDescription,
      copy.toast.statusUpdateSuccess,
      copy.toast.statusUpdateSuccessDescription,
      refetch,
      updatePost,
    ],
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!deletingPost) return;

    try {
      await deletePost(deletingPost.name);
      showCrudSuccess(
        copy.toast.deleteSuccess,
        copy.toast.deleteSuccessDescription.replace(
          "{title}",
          deletingPost.title,
        ),
      );
      setDeletingPost(null);
      refetch();
    } catch (err) {
      showCrudError(
        copy.toast.deleteFailure,
        err,
        copy.toast.deleteFailureDescription,
      );
    }
  }, [
    copy.toast.deleteFailure,
    copy.toast.deleteFailureDescription,
    copy.toast.deleteSuccess,
    copy.toast.deleteSuccessDescription,
    deletePost,
    deletingPost,
    refetch,
  ]);

  const handleBulkDeleteConfirm = React.useCallback(async () => {
    if (bulkDeletingPosts.length === 0) return;

    try {
      await Promise.all(bulkDeletingPosts.map((post) => deletePost(post.name)));
      showCrudSuccess(
        copy.toast.deleteSuccess,
        copy.toast.bulkDeleteSuccessDescription.replace(
          "{count}",
          String(bulkDeletingPosts.length),
        ),
      );
      setBulkDeletingPosts([]);
      setRowSelection({});
      refetch();
    } catch (err) {
      showCrudError(
        copy.toast.deleteFailure,
        err,
        copy.toast.deleteFailureDescription,
      );
    }
  }, [
    bulkDeletingPosts,
    copy.toast.bulkDeleteSuccessDescription,
    copy.toast.deleteFailure,
    copy.toast.deleteFailureDescription,
    copy.toast.deleteSuccess,
    deletePost,
    refetch,
  ]);

  const handleBulkStatusUpdate = React.useCallback(
    async (nextStatus: PostStatus) => {
      const selectedPosts =
        posts?.filter((_, index) => rowSelection[index] === true) ?? [];
      if (selectedPosts.length === 0) return;

      try {
        await Promise.all(
          selectedPosts.map((post) =>
            updatePost(post.name, {
              status: nextStatus,
              published_at:
                nextStatus === "Published" && !post.published_at
                  ? formatFrappeDatetime(new Date())
                  : undefined,
            }),
          ),
        );
        showCrudSuccess(
          copy.toast.statusUpdateSuccess,
          copy.toast.bulkStatusUpdateSuccessDescription
            .replace("{count}", String(selectedPosts.length))
            .replace("{status}", copy.status[nextStatus]),
        );
        setRowSelection({});
        refetch();
      } catch (err) {
        showCrudError(
          copy.toast.statusUpdateFailure,
          err,
          copy.toast.statusUpdateFailureDescription,
        );
      }
    },
    [
      copy.status,
      copy.toast.bulkStatusUpdateSuccessDescription,
      copy.toast.statusUpdateFailure,
      copy.toast.statusUpdateFailureDescription,
      copy.toast.statusUpdateSuccess,
      posts,
      refetch,
      rowSelection,
      updatePost,
    ],
  );

  const columnMeta = React.useMemo<PostColumnMeta>(
    () => ({
      onView: handleViewDetail,
      onEdit: handleEdit,
      onPublish: (post) => handleStatusUpdate(post, "Published"),
      onMoveToDraft: (post) => handleStatusUpdate(post, "Draft"),
      onArchive: (post) => handleStatusUpdate(post, "Archived"),
      onDelete: setDeletingPost,
      getDepartmentLabel,
      getCategoryLabel,
    }),
    [
      getCategoryLabel,
      getDepartmentLabel,
      handleEdit,
      handleStatusUpdate,
      handleViewDetail,
    ],
  );

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [apiFilters, orderBy, search]);

  React.useEffect(() => {
    if (departmentFilter === "all" || categoryFilter === "all") {
      return;
    }

    const categoryExists = categories.some(
      (item) => item.name === categoryFilter,
    );
    if (!categoryExists) {
      setCategoryFilter("all");
    }
  }, [categories, categoryFilter, departmentFilter]);

  const statusCode = (error as { response?: { status?: number } } | null)
    ?.response?.status;

  const columns: ColumnDef<Post, unknown>[] = React.useMemo(
    () => getPostColumns(t),
    [t],
  );

  if (statusCode === 403) {
    return (
      <AdminAccessDenied description={t.errors.postAccessDeniedDescription} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {copy.list.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {copy.list.description}
          </p>
        </div>
        <Button asChild>
          <Link href={buildLocalePath(locale, "/admin/posts/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {copy.list.addPost}
          </Link>
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative w-full lg:w-1/2">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={copy.filters.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-3 lg:w-1/2">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as typeof statusFilter)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={copy.filters.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.filters.allStatuses}</SelectItem>
              <SelectItem value="Draft">{copy.status.Draft}</SelectItem>
              <SelectItem value="Published">{copy.status.Published}</SelectItem>
              <SelectItem value="Archived">{copy.status.Archived}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={visibilityFilter}
            onValueChange={(value) =>
              setVisibilityFilter(value as typeof visibilityFilter)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={copy.filters.visibility} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.filters.allVisibility}</SelectItem>
              <SelectItem value="Public">{copy.visibility.Public}</SelectItem>
              <SelectItem value="Internal">
                {copy.visibility.Internal}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <DepartmentFilterCombobox
          value={departmentFilter}
          onChange={setDepartmentFilter}
          onDepartmentsChange={setDepartments}
          isLoading={isLoading}
          placeholder={copy.filters.department}
          allLabel={copy.filters.allDepartments}
        />

        <CategoryFilterCombobox
          departmentValue={departmentFilter}
          value={categoryFilter}
          onChange={setCategoryFilter}
          onCategoriesChange={setCategories}
          isLoading={isLoading}
          placeholder={copy.filters.category}
          allLabel={copy.filters.allCategories}
        />

        <TopicFilterCombobox
          departmentValue={departmentFilter}
          value={topicFilter}
          onChange={setTopicFilter}
          isLoading={isLoading}
          placeholder={copy.filters.topic}
          allLabel={copy.filters.allTopics}
        />

        <TagFilterCombobox
          value={tagFilter}
          onChange={setTagFilter}
          isLoading={isLoading}
          placeholder={copy.filters.tag}
          allLabel={copy.filters.allTags}
        />
      </div>

      {Object.keys(rowSelection).length > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <span className="text-sm font-medium">
            {Object.keys(rowSelection).length} {t.common.selected}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate("Published")}
            >
              <Send className="mr-2 h-4 w-4" />
              {copy.actions.publish}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate("Draft")}
            >
              <SquarePen className="mr-2 h-4 w-4" />
              {copy.actions.moveToDraft}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusUpdate("Archived")}
            >
              <Archive className="mr-2 h-4 w-4" />
              {copy.actions.archive}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                setBulkDeletingPosts(
                  posts?.filter((_, index) => rowSelection[index] === true) ??
                    [],
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.common.deleteSelected}
            </Button>
          </div>
        </div>
      ) : null}

      <PostTable
        columns={columns}
        data={posts ?? []}
        isLoading={isLoading}
        totalCount={totalCount ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        meta={columnMeta as unknown as Record<string, unknown>}
        emptyMessage={
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="rounded-full bg-muted p-3">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{copy.list.emptyTitle}</p>
              <p className="text-sm text-muted-foreground">
                {copy.list.emptyDescription}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={buildLocalePath(locale, "/admin/posts/new")}>
                <Plus className="mr-2 h-4 w-4" />
                {copy.list.addPost}
              </Link>
            </Button>
          </div>
        }
      />

      <AlertDialog
        open={Boolean(deletingPost)}
        onOpenChange={(open) => {
          if (!open) setDeletingPost(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.actions.delete}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.list.deleteConfirmDescription.replace(
                "{title}",
                deletingPost?.title ?? "",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeletingPosts.length > 0}
        onOpenChange={(open) => {
          if (!open) setBulkDeletingPosts([]);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.deleteSelected}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.list.bulkDeleteConfirmDescription.replace(
                "{count}",
                String(bulkDeletingPosts.length),
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeleteConfirm}>
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
