import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';
import { unwrapData } from './envelope';

const { GITHUB } = ROUTES;
const path = (route) => `${GITHUB.BASE}${route}`;

export const resolveRepoRequest = (url) =>
  apiClient.post(path(GITHUB.RESOLVE), { url }).then(unwrapData);

export const loadRepoRequest = ({ url, ref }) =>
  apiClient.post(path(GITHUB.REPO), { url, ...(ref ? { ref } : {}) }).then(unwrapData);

export const getContentRequest = ({ owner, repo, ref, path: filePath }) =>
  apiClient
    .get(path(GITHUB.CONTENT), { params: { owner, repo, ref, path: filePath } })
    .then(unwrapData);
