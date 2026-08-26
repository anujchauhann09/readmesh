'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateProfileRequest,
  updatePreferencesRequest,
  deleteAccountRequest,
} from '@/lib/api/user';
import { AUTH_ME_KEY } from '@/hooks/use-auth';

export function useProfile() {
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: (user) => queryClient.setQueryData(AUTH_ME_KEY, user),
  });

  const updatePreferences = useMutation({
    mutationFn: updatePreferencesRequest,
    onSuccess: (preferences) =>
      queryClient.setQueryData(AUTH_ME_KEY, (prev) => (prev ? { ...prev, preferences } : prev)),
  });

  const deleteAccount = useMutation({
    mutationFn: deleteAccountRequest,
    // Same teardown as sign-out: the account is gone, so nothing it owned should
    // remain readable from the cache.
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(AUTH_ME_KEY, null);
    },
  });

  return { updateProfile, updatePreferences, deleteAccount };
}
