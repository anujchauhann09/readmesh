import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../common/ApiError.js';

const PROVIDER_ERROR = 'Could not sign in with that provider. Please try again.';

const fail = (scope, detail) => {
  logger.warn({ scope, detail }, 'OAuth provider request failed');
  return ApiError.unauthorized(PROVIDER_ERROR);
};

export const getGoogleUser = async (code) => {
  const cfg = config.oauth.google;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: cfg.callbackUrl,
    }),
  });
  if (!tokenRes.ok) throw fail('google.token', tokenRes.status);
  const { access_token: accessToken } = await tokenRes.json();
  if (!accessToken) throw fail('google.token', 'no access_token');

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) throw fail('google.userinfo', userRes.status);
  const data = await userRes.json();

  return {
    providerUserId: String(data.id),
    email: data.email,
    name: data.name,
    avatar: data.picture,
  };
};

export const getGithubUser = async (code) => {
  const cfg = config.oauth.github;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      redirect_uri: cfg.callbackUrl,
    }),
  });
  if (!tokenRes.ok) throw fail('github.token', tokenRes.status);
  const { access_token: accessToken } = await tokenRes.json();
  if (!accessToken) throw fail('github.token', 'no access_token');

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'readmesh',
  };

  const profileRes = await fetch('https://api.github.com/user', { headers });
  if (!profileRes.ok) throw fail('github.user', profileRes.status);
  const profile = await profileRes.json();

  let email = profile.email;
  if (!email) {
    const emailRes = await fetch('https://api.github.com/user/emails', { headers });
    if (emailRes.ok) {
      const emails = await emailRes.json();
      email =
        emails.find((e) => e.primary && e.verified)?.email ??
        emails.find((e) => e.verified)?.email ??
        null;
    }
  }
  if (!email) {
    throw ApiError.unauthorized('Your GitHub account has no verified email. Add one and try again.');
  }

  return {
    providerUserId: String(profile.id),
    email,
    name: profile.name || profile.login,
    avatar: profile.avatar_url,
  };
};
