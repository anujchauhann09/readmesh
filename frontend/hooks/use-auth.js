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

  const login = useMutation({ mutationFn: loginRequest, onSuccess: setUser });
  const register = useMutation({ mutationFn: registerRequest });
  const logout = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => setUser(null),
  });

  return {
    user: meQuery.data ?? null,
    isAuthenticated: Boolean(meQuery.data),
    isLoading: meQuery.isPending,
    login,
    register,
    logout,
  };
}
