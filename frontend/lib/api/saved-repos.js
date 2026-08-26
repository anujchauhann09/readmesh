import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapAck, unwrapPage } from './envelope';

const { SAVED_REPOS } = ROUTES;
const base = SAVED_REPOS.BASE;

export const listSavedReposRequest = ({ cursor, limit } = {}) =>
  apiClient
    .get(base, { params: { ...(cursor ? { cursor } : {}), ...(limit ? { limit } : {}) } })
    .then(unwrapPage('repos'));

/** Idempotent: saving a repo again just refreshes its "last opened" timestamp. */
export const saveRepoRequest = (payload) => apiClient.post(base, payload).then(unwrap('repo'));

export const removeSavedRepoRequest = (id) =>
  apiClient.delete(`${base}/${id}`).then(unwrapAck);
