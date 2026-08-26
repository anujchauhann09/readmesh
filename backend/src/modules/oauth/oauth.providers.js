import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../common/ApiError.js';
import { fetchWithTimeout, isAbortError } from '../../utils/http.js';

const PROVIDER_ERROR = 'Could not sign in with that provider. Please try again.';
const TIMEOUT_MS = 10_000;

const fail = (scope, detail) => {
  logger.warn({ scope, detail }, 'OAuth provider request failed');
  return ApiError.unauthorized(PROVIDER_ERROR);
};

const call = async (url, init, scope) => {
  try {
    return await fetchWithTimeout(url, { ...init, timeoutMs: TIMEOUT_MS });
  } catch (err) {
    throw fail(scope, isAbortError(err) ? 'timeout' : err.name);
  }
};

export const getGoogleUser = async (code) => {
  const cfg = config.oauth.google;

  const tokenRes = await call(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: cfg.callbackUrl,
      }),
    },
    'google.token',
  );
  if (!tokenRes.ok) throw fail('google.token', tokenRes.status);
  const { access_token: accessToken } = await tokenRes.json();
  if (!accessToken) throw fail('google.token', 'no access_token');

  const userRes = await call(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    { headers: { Authorization: `Bearer ${accessToken}` } },
    'google.userinfo',
  );
  if (!userRes.ok) throw fail('google.userinfo', userRes.status);
  const data = await userRes.json();

  return {
    providerUserId: String(data.id),
    email: data.email,
    // Google returns this per address; an unverified one must not be trusted to
    // prove ownership of a matching readmesh account.
    emailVerified: data.verified_email === true,
    name: data.name,
    avatar: data.picture,
  };
};

export const getGithubUser = async (code) => {
  const cfg = config.oauth.github;

  const tokenRes = await call(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: cfg.callbackUrl,
      }),
    },
    'github.token',
  );
  if (!tokenRes.ok) throw fail('github.token', tokenRes.status);
  const { access_token: accessToken } = await tokenRes.json();
  if (!accessToken) throw fail('github.token', 'no access_token');

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'readmesh',
  };

  const profileRes = await call('https://api.github.com/user', { headers }, 'github.user');
  if (!profileRes.ok) throw fail('github.user', profileRes.status);
  const profile = await profileRes.json();

  // The public profile email carries no verification flag, so the verified list
  // is the only source trusted for identity here.
  const emailRes = await call('https://api.github.com/user/emails', { headers }, 'github.emails');
  let email = null;
  if (emailRes.ok) {
    const emails = await emailRes.json();
    email =
      emails.find((e) => e.primary && e.verified)?.email ??
      emails.find((e) => e.verified)?.email ??
      null;
  }
  if (!email) {
    throw ApiError.unauthorized(
      'Your GitHub account has no verified email. Add one and try again.',
    );
  }

  return {
    providerUserId: String(profile.id),
    email,
    emailVerified: true,
    name: profile.name || profile.login,
    avatar: profile.avatar_url,
  };
};
