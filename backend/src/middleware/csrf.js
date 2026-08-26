import { ApiError } from '../common/ApiError.js';
import { config } from '../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const allowedOrigins = new Set(config.server.corsOrigins);

const originOf = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

/**
 * Origin-based CSRF defense for cookie authentication.
 *
 * In production the session cookies are `SameSite=None` (the frontend is on a
 * different site), so the browser will attach them to cross-site requests. CORS
 * stops an attacker *reading* the response but does not stop "simple" requests
 * from being *sent* — a bodyless `POST /auth/logout` from any page would have
 * gone through. Every modern browser sends `Origin` on state-changing requests,
 * so requiring it to be one of ours closes that gap with no client changes.
 *
 * A missing Origin (and Referer) means the caller is not a browser — curl, a
 * server-to-server job, a test — which cannot be tricked into replaying someone
 * else's cookies, so those are allowed through.
 */
export const verifyRequestOrigin = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const stated = req.get('origin') ?? req.get('referer');
  if (!stated) return next();

  const origin = originOf(stated);
  if (origin && allowedOrigins.has(origin)) return next();

  return next(ApiError.forbidden('Request origin is not allowed'));
};
