import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';

const { USERS } = ROUTES;
const path = (route) => `${USERS.BASE}${route}`;

export const getMeRequest = () => apiClient.get(path(USERS.ME)).then((r) => r.data.data.user);

export const updateProfileRequest = (payload) =>
  apiClient.patch(path(USERS.ME), payload).then((r) => r.data.data.user);

export const deleteAccountRequest = () => apiClient.delete(path(USERS.ME)).then((r) => r.data);

export const getPreferencesRequest = () =>
  apiClient.get(path(USERS.PREFERENCES)).then((r) => r.data.data.preferences);

export const updatePreferencesRequest = (payload) =>
  apiClient.patch(path(USERS.PREFERENCES), payload).then((r) => r.data.data.preferences);
