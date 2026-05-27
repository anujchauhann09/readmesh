import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';

const { GITHUB } = ROUTES;
const path = (route) => `${GITHUB.BASE}${route}`;

export const resolveRepoRequest = (url) =>
  apiClient.post(path(GITHUB.RESOLVE), { url }).then((r) => r.data.data);

export const loadRepoRequest = ({ url, ref }) =>
  apiClient.post(path(GITHUB.REPO), { url, ...(ref ? { ref } : {}) }).then((r) => r.data.data);

export const getContentRequest = ({ owner, repo, ref, path: filePath }) =>
  apiClient
    .get(path(GITHUB.CONTENT), { params: { owner, repo, ref, path: filePath } })
    .then((r) => r.data.data);
