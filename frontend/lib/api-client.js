import axios from 'axios';
import { API_PREFIX } from '@readmesh/shared';

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? `http://localhost:8080${API_PREFIX}`;

/**
 * Shared HTTP client. `withCredentials` lets the browser send/receive the
 * httpOnly auth cookies introduced in Phase 2. The response interceptor
 * normalizes errors to the backend's `{ code, message, details }` shape so
 * callers (and TanStack Query) always handle a consistent error object.
 */
export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = error.response?.data?.error ?? {
      code: error.code ?? 'NETWORK_ERROR',
      message: error.message ?? 'Network request failed',
    };
    // Token-refresh-and-retry logic is wired in here in Phase 2 (on 401).
    return Promise.reject(normalized);
  },
);
