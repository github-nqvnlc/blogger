'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/apiClient';

interface UserSettings {
  name: string;
  email: string;
  full_name: string;
  language: string;
  desk_theme: string;
  user_image?: string;
}

interface UpdateSettingsPayload {
  language?: string;
  desk_theme?: string;
}

const QUERY_KEY = ['user-settings'];

export function useUserSettings(currentUser: string | null) {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  const query = useQuery<UserSettings, Error>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<UserSettings>(
        `/api/resource/User/${currentUser}`,
      );
      return (res.data as { data?: UserSettings }).data ?? res.data;
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation<
    UserSettings,
    Error,
    UpdateSettingsPayload
  >({
    mutationFn: async (payload) => {
      const res = await apiClient.put<UserSettings>(
        `/api/resource/User/${currentUser}`,
        payload,
      );
      return (res.data as { data?: UserSettings }).data ?? res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<UserSettings>(QUERY_KEY, data);
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isValidating: query.isFetching,
    updateSettings: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
