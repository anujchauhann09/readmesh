import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapAck } from './envelope';

const { AUTH } = ROUTES;
const path = (route) => `${AUTH.BASE}${route}`;

export const registerRequest = (payload) =>
  apiClient.post(path(AUTH.REGISTER), payload).then(unwrap('user'));

export const loginRequest = (payload) => apiClient.post(path(AUTH.LOGIN), payload).then(unwrap('user'));

export const logoutRequest = () => apiClient.post(path(AUTH.LOGOUT)).then(unwrapAck);

export const refreshRequest = () => apiClient.post(path(AUTH.REFRESH)).then(unwrap('user'));

export const meRequest = () => apiClient.get(path(AUTH.ME)).then(unwrap('user'));

export const forgotPasswordRequest = (payload) =>
  apiClient.post(path(AUTH.FORGOT_PASSWORD), payload).then(unwrapAck);

export const resetPasswordRequest = (payload) =>
  apiClient.post(path(AUTH.RESET_PASSWORD), payload).then(unwrapAck);
