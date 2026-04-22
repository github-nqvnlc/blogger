"use client";

import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { useGetCount } from "./useGetCount";
import { useGetList } from "./useGetList";
import { Filter } from "@/types/hooks";

export interface UseLazyLoadListArgs<T> {
  resource: string;
  fields?: (keyof T | string)[];
  filters?: Filter[];
  orderBy?: { field: string; order: "asc" | "desc" };
  pageSize?: number;
  scrollThreshold?: number;
  enabled?: boolean;
}

export interface UseLazyLoadListResult<T> {
  loadedItems: T[];
  isLoading: boolean;
  total: number | undefined;
  hasMore: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
}

/**
 * Generic scroll-based lazy-loading hook.
 *
 * Manages pagination state, item accumulation, and scroll detection so each
 * detail page only needs to attach `scrollRef` and `handleScroll` to its
 * scrollable container.
 *
 * Resets automatically whenever `filters` or `resource` changes.
 *
 * @example
 * const { loadedItems, isLoading, hasMore, scrollRef, handleScroll } =
 *   useLazyLoadList<Post>({
 *     resource: "posts",
 *     fields: ["name", "title", "status"],
 *     filters: [["department", "=", departmentId]],
 *     orderBy: { field: "creation", order: "desc" },
 *   });
 */
export function useLazyLoadList<T extends { name: string }>({
  resource,
  fields,
  filters,
  orderBy,
  pageSize = 10,
  scrollThreshold = 80,
  enabled = true,
}: UseLazyLoadListArgs<T>): UseLazyLoadListResult<T> {
  const [pageStart, setPageStart] = useState(0);
  const [accumulated, setAccumulated] = useState<T[]>([]);
  const [prevPage, setPrevPage] = useState<T[] | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const resetKey = `${resource}::${JSON.stringify(filters)}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPageStart(0);
    setAccumulated([]);
    setPrevPage(undefined);
  }

  const { data: page, isLoading } = useGetList<T>(
    resource,
    { fields, filters, orderBy, limit_start: pageStart, limit: pageSize },
    { enabled }
  );

  const { data: total } = useGetCount(resource, filters ?? [], undefined, { enabled });

  if (page && page.length > 0 && page !== prevPage) {
    setPrevPage(page);
    setAccumulated(prev => {
      if (pageStart === 0) return page;
      const next = [...prev];
      for (const item of page) {
        if (!next.some(e => e.name === item.name)) next.push(item);
      }
      return next;
    });
  }

  const hasMore = accumulated.length < (total ?? 0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isLoading || !hasMore) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - scrollThreshold;
    if (nearBottom) {
      setPageStart(prev => prev + pageSize);
    }
  }, [isLoading, hasMore, pageSize, scrollThreshold]);

  return { loadedItems: accumulated, isLoading, total, hasMore, scrollRef, handleScroll };
}
