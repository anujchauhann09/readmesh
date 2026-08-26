import axios from 'axios';
import { API_PREFIX, ROUTES } from '@readmesh/shared';

/**
 * Resolves the API origin.
 *
 * A hardcoded localhost fallback is right for local development and wrong for a
 * deploy: a missing env var would silently point production at the developer's
 * own machine. In production the fallback is same-origin instead, and the misconfig
 * is logged loudly rather than disguised.
 */
const resolveBaseUrl = () => {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured) return configured;

  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[readmesh] NEXT_PUBLIC_API_BASE_URL is not set — falling back to same-origin ' +
        `"${API_PREFIX}". Set it to your API URL at build time.`,
    );
    return API_PREFIX;
  }
  return `http://localhost:8080${API_PREFIX}`;
};

export const API_BASE_URL = resolveBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

const { AUTH } = ROUTES;

const isAuthEndpoint = (url = '') =>
  [AUTH.LOGIN, AUTH.REGISTER, AUTH.REFRESH].some((p) => url.includes(`${AUTH.BASE}${p}`));

let refreshPromise = null;

/**
 * Refreshes the session, de-duplicated: several requests failing with 401 at once
 * share a single refresh call instead of racing (which the server now treats as
 * token reuse and punishes by revoking the whole family).
 *
 * Exported because `fetch`-based callers — the SSE chat stream — are not covered
 * by the axios interceptor and need to drive the same recovery.
 */
export const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = apiClient.post(`${AUTH.BASE}${AUTH.REFRESH}`).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

/**
 * Turns an axios failure into a real `Error` carrying the server's code, HTTP
 * status and validation details, so callers can branch on *why* something failed
 * rather than string-matching the message.
 */
const normalizeError = (error) => {
  const payload = error.response?.data?.error;
  const normalized = new Error(
    payload?.message ?? error.message ?? 'Network request failed',
  );
  normalized.code = payload?.code ?? error.code ?? 'NETWORK_ERROR';
  normalized.status = error.response?.status ?? null;
  if (payload?.details !== undefined) normalized.details = payload.details;
  return normalized;
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
        // Refresh failed — fall through and surface the original 401.
      }
    }

    return Promise.reject(normalizeError(error));
  },
);
