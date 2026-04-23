"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getApiClient } from "@/lib/apiClient";

type UseGetMethodOptions<T> = Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">;

export function useGetMethod<T = Record<string, unknown>>(
  /** Method path theo dotted format */
  method: string,
  /** Query params truyền vào method */
  params?: Record<string, unknown>,
  /** TanStack Query options */
  options?: UseGetMethodOptions<T>
) {
  const apiClient = getApiClient();

  const query = useQuery<T, Error>({
    queryKey: ["method", method, params],
    queryFn: async () => {
      const res = await apiClient.get<T>(`/api/method/blogs.blogs.api.${method}`, { params });
      return (res.data as { message?: T }).message ?? res.data;
    },
    enabled: !!method && options?.enabled !== false,
    ...options,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isValidating: query.isFetching,
    error: query.error,
    mutate: query.refetch,
  };
}
