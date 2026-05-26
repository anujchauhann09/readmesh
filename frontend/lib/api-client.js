import axios from 'axios';
import { API_PREFIX, ROUTES } from '@readmesh/shared';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? `http://localhost:8080${API_PREFIX}`;


export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

const { AUTH } = ROUTES;

const isAuthEndpoint = (url = '') =>
  [AUTH.LOGIN, AUTH.REGISTER, AUTH.REFRESH].some((p) => url.includes(`${AUTH.BASE}${p}`));

let refreshPromise = null;
const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = apiClient.post(`${AUTH.BASE}${AUTH.REFRESH}`).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const normalizeError = (error) =>
  error.response?.data?.error ?? {
    code: error.code ?? 'NETWORK_ERROR',
    message: error.message ?? 'Network request failed',
  };

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true;
      try {
        await refreshSession();
        return apiClient(original);
      } catch {
      }
    }

    return Promise.reject(normalizeError(error));
  },
);
