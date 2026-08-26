'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meRequest, loginRequest, registerRequest, logoutRequest } from '@/lib/api/auth';

export const AUTH_ME_KEY = ['auth', 'me'];

export function useAuth() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: meRequest,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const setUser = (user) => queryClient.setQueryData(AUTH_ME_KEY, user);

  /**
   * Wipes every cached query on sign-out.
   *
   * Only resetting the user left documents, annotations and conversations in the
   * cache, so signing into a second account in the same tab could briefly render
   * the previous user's data before the refetches landed.
   */
  const endSession = () => {
    queryClient.clear();
    setUser(null);
  };

  const login = useMutation({ mutationFn: loginRequest, onSuccess: setUser });
  const register = useMutation({ mutationFn: registerRequest });
  const logout = useMutation({
    mutationFn: logoutRequest,
    // The local session must end even if the server call fails, otherwise the UI
    // keeps showing a signed-in state the cookies no longer back.
    onSettled: endSession,
  });

  return {
    user: meQuery.data ?? null,
    isAuthenticated: Boolean(meQuery.data),
    isLoading: meQuery.isPending,
    login,
    register,
    logout,
    endSession,
  };
}
