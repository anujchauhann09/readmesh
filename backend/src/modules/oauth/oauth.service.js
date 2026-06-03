import { config } from '../../config/env.js';
import { ApiError } from '../../common/ApiError.js';
import * as userRepo from '../user/user.repository.js';
import { getGoogleUser, getGithubUser } from './oauth.providers.js';

const DEFAULT_ROLE = 'developer';

const PROVIDERS = {
  google: {
    enum: 'GOOGLE',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    fetchUser: getGoogleUser,
  },
  github: {
    enum: 'GITHUB',
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'read:user user:email',
    fetchUser: getGithubUser,
  },
};

export const getAuthorizationUrl = (provider, state) => {
  const p = PROVIDERS[provider];
  const cfg = config.oauth[provider];
  if (!p || !cfg?.clientId || !cfg?.callbackUrl) {
    throw ApiError.badRequest('This sign-in provider is not configured');
  }
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.callbackUrl,
    response_type: 'code',
    scope: p.scope,
    state,
  });
  return `${p.authUrl}?${params.toString()}`;
};

export const authenticateWithProvider = async (provider, code) => {
  const p = PROVIDERS[provider];
  if (!p) throw ApiError.badRequest('Unsupported sign-in provider');

  const profile = await p.fetchUser(code);
  if (!profile?.email || !profile?.providerUserId) {
    throw ApiError.unauthorized('Could not read your profile from that provider.');
  }

  const linked = await userRepo.findByProviderAccount(p.enum, profile.providerUserId);
  if (linked) return linked;

  const byEmail = await userRepo.findByEmailWithSecret(profile.email);
  if (byEmail) {
    return userRepo.linkAuthAccount(byEmail.publicId, {
      provider: p.enum,
      providerAccountId: profile.providerUserId,
    });
  }

  const role = await userRepo.getRoleByName(DEFAULT_ROLE);
  if (!role) throw ApiError.internal('Default role is not configured (run the seed)');

  return userRepo.createOAuthUser({
    email: profile.email,
    displayName: profile.name,
    roleId: role.id,
    provider: p.enum,
    providerAccountId: profile.providerUserId,
  });
};
