import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapAck, unwrapPage } from './envelope';

const { DOCUMENTS } = ROUTES;
const base = DOCUMENTS.BASE;
const byId = (id) => `${base}/${id}`;

export const listDocumentsRequest = ({ cursor, limit } = {}) =>
  apiClient
    .get(base, { params: { ...(cursor ? { cursor } : {}), ...(limit ? { limit } : {}) } })
    .then(unwrapPage('documents'));

export const getDocumentRequest = (id) => apiClient.get(byId(id)).then(unwrap('document'));

export const createDocumentRequest = (payload = {}) =>
  apiClient.post(base, payload).then(unwrap('document'));

export const updateDocumentRequest = ({ id, ...payload }) =>
  apiClient.patch(byId(id), payload).then(unwrap('document'));

export const deleteDocumentRequest = (id) => apiClient.delete(byId(id)).then(unwrapAck);
