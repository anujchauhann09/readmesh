'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  listDocumentsRequest,
  getDocumentRequest,
  createDocumentRequest,
  updateDocumentRequest,
  deleteDocumentRequest,
} from '@/lib/api/documents';

const LIST_KEY = ['documents'];

/**
 * The document list, paged.
 *
 * The API caps collections, so a plain query silently stopped at the first page —
 * documents past it simply vanished from the dashboard and the editor's switcher.
 * An infinite query keeps that explicit: `hasMore` drives a visible "Load more".
 */
export function useDocuments() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: LIST_KEY,
    queryFn: ({ pageParam }) => listDocumentsRequest({ cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: LIST_KEY });

  const create = useMutation({ mutationFn: createDocumentRequest, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteDocumentRequest, onSuccess: invalidate });

  return {
    documents: query.data?.pages.flatMap((page) => page.items) ?? [],
    isLoading: query.isPending,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
    create,
    remove,
  };
}

const AUTOSAVE_DELAY = 800;

export function useDocumentAutosave(id) {
  const queryClient = useQueryClient();
  const key = ['documents', id];
  const [status, setStatus] = useState('idle');
  const timer = useRef(null);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getDocumentRequest(id),
    enabled: Boolean(id),
  });

  const mutation = useMutation({
    mutationFn: updateDocumentRequest,
    onSuccess: (doc) => {
      queryClient.setQueryData(key, doc);
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      setStatus('saved');
    },
    onError: () => setStatus('error'),
  });

  const mutateRef = useRef(mutation.mutate);
  mutateRef.current = mutation.mutate;

  // Holds the edit the debounce is still sitting on, so unmount can flush it.
  const pending = useRef(null);

  const save = useCallback(
    (content) => {
      setStatus('saving');
      pending.current = { id, content };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        pending.current = null;
        mutateRef.current({ id, content });
      }, AUTOSAVE_DELAY);
    },
    [id],
  );

  // Navigating away inside the debounce window would otherwise silently discard
  // the last keystrokes, so the outstanding edit is sent instead of cancelled.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (pending.current) {
        mutateRef.current(pending.current);
        pending.current = null;
      }
    },
    [],
  );

  return {
    document: query.data ?? null,
    isLoading: query.isPending && Boolean(id),
    isError: query.isError,
    status,
    save,
  };
}
