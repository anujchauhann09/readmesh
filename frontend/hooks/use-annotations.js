'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listAnnotationsRequest,
  createAnnotationRequest,
  updateAnnotationRequest,
  deleteAnnotationRequest,
} from '@/lib/api/annotations';

export function useAnnotations({ owner, name, ref, path }) {
  const queryClient = useQueryClient();
  const enabled = Boolean(owner && name && ref && path);
  const key = ['annotations', owner, name, ref, path];

  const query = useQuery({
    queryKey: key,
    queryFn: () => listAnnotationsRequest({ owner, name, ref, path }),
    enabled,
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const create = useMutation({ mutationFn: createAnnotationRequest, onSuccess: invalidate });
  const update = useMutation({ mutationFn: updateAnnotationRequest, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteAnnotationRequest, onSuccess: invalidate });

  return {
    annotations: query.data ?? [],
    isLoading: query.isLoading && enabled,
    create,
    update,
    remove,
  };
}
