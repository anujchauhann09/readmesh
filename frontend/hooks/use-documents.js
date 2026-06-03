'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listDocumentsRequest,
  getDocumentRequest,
  createDocumentRequest,
  updateDocumentRequest,
  deleteDocumentRequest,
} from '@/lib/api/documents';

const LIST_KEY = ['documents'];

export function useDocuments() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: LIST_KEY, queryFn: listDocumentsRequest });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: LIST_KEY });

  const create = useMutation({ mutationFn: createDocumentRequest, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteDocumentRequest, onSuccess: invalidate });

  return {
    documents: query.data ?? [],
    isLoading: query.isPending,
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

  const save = useCallback(
    (content) => {
      setStatus('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => mutateRef.current({ id, content }), AUTOSAVE_DELAY);
    },
    [id],
  );

  return {
    document: query.data ?? null,
    isLoading: query.isPending && Boolean(id),
    isError: query.isError,
    status,
    save,
  };
}
