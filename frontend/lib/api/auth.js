import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';

const { AUTH } = ROUTES;
const path = (route) => `${AUTH.BASE}${route}`;


export const registerRequest = (payload) =>
  apiClient.post(path(AUTH.REGISTER), payload).then((r) => r.data.data.user);

export const loginRequest = (payload) =>
  apiClient.post(path(AUTH.LOGIN), payload).then((r) => r.data.data.user);

export const logoutRequest = () => apiClient.post(path(AUTH.LOGOUT)).then((r) => r.data);

export const meRequest = () => apiClient.get(path(AUTH.ME)).then((r) => r.data.data.user);
