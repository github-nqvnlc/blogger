"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getApiClient } from "@/lib/apiClient";
import { BlogDepartment, Category, Tag, Topic } from "@/types/blogs";

// ─── Query Keys (cố định để cache share toàn app) ────────────────────────────

export const GUEST_METADATA_KEYS = {
  categories: [
    "categories",
    "list",
    { fields: ["name", "category", "slug", "department"], limit: 500 },
  ] as const,
  tags: ["tags", "list", { fields: ["name", "tag_name", "slug"], limit: 500 }] as const,
  topics: ["topics", "list", { fields: ["name", "topic", "slug"], limit: 500 }] as const,
  blogDepartments: [
    "blog_departments",
    "list",
    {
      fields: [
        "name",
        "department_name",
        "department_code",
        "description",
        "is_active",
        "creation",
      ],
      limit: 500,
    },
  ] as const,
};

// ─── Fetch helper (dùng cùng apiClient với useGetList) ───────────────────────

async function fetchResource<T>(resource: string, fields: string[], limit: number): Promise<T[]> {
  const apiClient = getApiClient();
  const res = await apiClient.get<T[]>(`/api/resource/${resource}`, {
    params: {
      fields: JSON.stringify(fields),
      limit,
    },
  });
  return (res.data as { data?: T[] }).data ?? (res.data as T[]);
}

// ─── Individual Hooks ─────────────────────────────────────────────────────────

export function useAllBlogDepartments() {
  return useQuery<BlogDepartment[]>({
    queryKey: GUEST_METADATA_KEYS.blogDepartments,
    queryFn: () =>
      fetchResource<BlogDepartment>(
        "blog_departments",
        ["name", "department_name", "department_code", "description", "is_active", "creation"],
        500
      ),
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 30 * 60 * 1000, // giữ cache 30 phút
  });
}

export function useAllCategories() {
  return useQuery<Category[]>({
    queryKey: GUEST_METADATA_KEYS.categories,
    queryFn: () =>
      fetchResource<Category>("categories", ["name", "category", "slug", "department"], 500),
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 30 * 60 * 1000, // giữ cache 30 phút
  });
}

export function useAllTags() {
  return useQuery<Tag[]>({
    queryKey: GUEST_METADATA_KEYS.tags,
    queryFn: () => fetchResource<Tag>("tags", ["name", "tag_name", "slug"], 500),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAllTopics() {
  return useQuery<Topic[]>({
    queryKey: GUEST_METADATA_KEYS.topics,
    queryFn: () => fetchResource<Topic>("topics", ["name", "topic", "slug"], 500),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// ─── Derived map helpers ──────────────────────────────────────────────────────

export function useCategoryMap(department_name?: string): Record<string, string> {
  const { data } = useAllCategories();
  const map: Record<string, string> = {};
  data
    ?.filter(c => {
      if (!department_name) return true;
      const department = c.department;
      return typeof department === "string"
        ? department === department_name
        : department.name === department_name;
    })
    .forEach(c => {
      map[c.name] = c.category;
    });
  return map;
}

export function useTagMap(): Record<string, string> {
  const { data } = useAllTags();
  const map: Record<string, string> = {};
  data?.forEach(t => {
    map[t.name] = t.tag_name;
  });
  return map;
}

export function useTopicMap(): Record<string, string> {
  const { data } = useAllTopics();
  const map: Record<string, string> = {};
  data?.forEach(t => {
    map[t.name] = t.topic;
  });
  return map;
}

// ─── Prefetch hook (dùng trong layout, không cần return value) ────────────────

export function usePrefetchGuestMetadata() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: GUEST_METADATA_KEYS.categories,
      queryFn: () => fetchResource<Category>("categories", ["name", "category", "slug"], 500),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: GUEST_METADATA_KEYS.tags,
      queryFn: () => fetchResource<Tag>("tags", ["name", "tag_name", "slug"], 500),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: GUEST_METADATA_KEYS.topics,
      queryFn: () => fetchResource<Topic>("topics", ["name", "topic", "slug"], 500),
      staleTime: 5 * 60 * 1000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
