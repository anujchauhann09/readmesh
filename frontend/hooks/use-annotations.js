'use client';

import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAnnotationsRequest,
  createAnnotationRequest,
  updateAnnotationRequest,
  deleteAnnotationRequest,
} from '@/lib/api/annotations';

export function useAnnotations({ owner, name, ref, path }, { onError } = {}) {
  const queryClient = useQueryClient();
  const enabled = Boolean(owner && name && ref && path);
  const key = ['annotations', owner, name, ref, path];

  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) =>
      listAnnotationsRequest({ owner, name, ref, path, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
    enabled,
    staleTime: 30_000,
  });

  // A document can carry more annotations than one page holds, and unlike a list
  // view there is no sensible "load more" affordance for marks inside prose — an
  // un-rendered highlight just looks like a lost one. So pages are drained eagerly.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  // Annotation writes used to fail silently, which reads as "the app ate my note".
  const mutationOptions = { onSuccess: invalidate, onError };

  const create = useMutation({ mutationFn: createAnnotationRequest, ...mutationOptions });
  const update = useMutation({ mutationFn: updateAnnotationRequest, ...mutationOptions });
  const remove = useMutation({ mutationFn: deleteAnnotationRequest, ...mutationOptions });

  return {
    annotations: query.data?.pages.flatMap((page) => page.items) ?? [],
    isLoading: query.isLoading && enabled,
    create,
    update,
    remove,
  };
}
