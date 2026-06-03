import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';

const { DOCUMENTS } = ROUTES;
const base = DOCUMENTS.BASE;
const byId = (id) => `${base}/${id}`;

export const listDocumentsRequest = () =>
  apiClient.get(base).then((r) => r.data.data.documents);

export const getDocumentRequest = (id) =>
  apiClient.get(byId(id)).then((r) => r.data.data.document);

export const createDocumentRequest = (payload = {}) =>
  apiClient.post(base, payload).then((r) => r.data.data.document);

export const updateDocumentRequest = ({ id, ...payload }) =>
  apiClient.patch(byId(id), payload).then((r) => r.data.data.document);

export const deleteDocumentRequest = (id) => apiClient.delete(byId(id)).then((r) => r.data);
