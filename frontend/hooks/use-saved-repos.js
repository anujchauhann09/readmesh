'use client';

import { useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSavedReposRequest,
  saveRepoRequest,
  removeSavedRepoRequest,
} from '@/lib/api/saved-repos';

const LIST_KEY = ['saved-repos'];

export function useSavedRepos() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: LIST_KEY,
    queryFn: ({ pageParam }) => listSavedReposRequest({ cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: LIST_KEY });

  const save = useMutation({ mutationFn: saveRepoRequest, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: removeSavedRepoRequest, onSuccess: invalidate });

  return {
    repos: query.data?.pages.flatMap((page) => page.items) ?? [],
    isLoading: query.isPending,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
    save,
    remove,
  };
}

/**
 * Records a repo as recently opened. Fire-and-forget: bookkeeping must never make
 * opening a repository fail, so a rejection is swallowed rather than surfaced.
 */
export function useTrackRepoOpen() {
  const queryClient = useQueryClient();

  return useCallback(
    (repo, ref) => {
      if (!repo?.owner || !repo?.name) return;
      saveRepoRequest({
        owner: repo.owner,
        name: repo.name,
        ref: ref ?? null,
        description: repo.description ?? null,
        stars: typeof repo.stars === 'number' ? repo.stars : null,
        language: repo.language ?? null,
      })
        .then(() => queryClient.invalidateQueries({ queryKey: LIST_KEY }))
        .catch(() => {});
    },
    [queryClient],
  );
}
