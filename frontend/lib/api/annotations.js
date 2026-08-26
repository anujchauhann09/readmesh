import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapAck, unwrapPage } from './envelope';

const { ANNOTATIONS } = ROUTES;
const base = ANNOTATIONS.BASE;
const byId = (id) => `${base}/${id}`;

export const listAnnotationsRequest = ({ owner, name, ref, path, cursor, limit }) =>
  apiClient
    .get(base, {
      params: {
        owner,
        name,
        ref,
        ...(path ? { path } : {}),
        ...(cursor ? { cursor } : {}),
        ...(limit ? { limit } : {}),
      },
    })
    .then(unwrapPage('annotations'));

export const createAnnotationRequest = (payload) =>
  apiClient.post(base, payload).then(unwrap('annotation'));

export const updateAnnotationRequest = ({ id, ...payload }) =>
  apiClient.patch(byId(id), payload).then(unwrap('annotation'));

export const deleteAnnotationRequest = (id) => apiClient.delete(byId(id)).then(unwrapAck);
