import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';

const { ANNOTATIONS } = ROUTES;
const base = ANNOTATIONS.BASE;
const byId = (id) => `${base}/${id}`;

export const listAnnotationsRequest = ({ owner, name, ref, path }) =>
  apiClient
    .get(base, { params: { owner, name, ref, ...(path ? { path } : {}) } })
    .then((r) => r.data.data.annotations);

export const createAnnotationRequest = (payload) =>
  apiClient.post(base, payload).then((r) => r.data.data.annotation);

export const updateAnnotationRequest = ({ id, ...payload }) =>
  apiClient.patch(byId(id), payload).then((r) => r.data.data.annotation);

export const deleteAnnotationRequest = (id) => apiClient.delete(byId(id)).then((r) => r.data);
