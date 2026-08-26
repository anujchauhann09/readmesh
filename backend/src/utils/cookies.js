import { API_PREFIX } from '@readmesh/shared';
import { config } from '../config/env.js';
import { parseDurationMs } from './duration.js';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const REFRESH_COOKIE_PATH = `${API_PREFIX}${'/auth'}`;

const baseOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
});

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions(),
    path: '/',
    maxAge: parseDurationMs(config.jwt.accessTtl),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions(),
    path: REFRESH_COOKIE_PATH,
    maxAge: parseDurationMs(config.jwt.refreshTtl),
  });
};

export const clearAuthCookies = (res) => {
  const opts = baseOptions();
  res.clearCookie(ACCESS_COOKIE, { ...opts, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...opts, path: REFRESH_COOKIE_PATH });
};

export const OAUTH_STATE_COOKIE = 'rm_oauth_state';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export const setOAuthStateCookie = (res, state) =>
  res.cookie(OAUTH_STATE_COOKIE, state, {
    ...baseOptions(),
    path: '/',
    maxAge: OAUTH_STATE_TTL_MS,
  });

export const clearOAuthStateCookie = (res) =>
  res.clearCookie(OAUTH_STATE_COOKIE, { ...baseOptions(), path: '/' });
