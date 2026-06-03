import crypto from 'node:crypto';
import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import { ApiError } from '../../common/ApiError.js';
import {
  setAuthCookies,
  setOAuthStateCookie,
  clearOAuthStateCookie,
  OAUTH_STATE_COOKIE,
} from '../../utils/cookies.js';
import { issueTokens } from '../auth/auth.service.js';
import { toPublicUser } from '../user/user.mapper.js';
import * as oauthService from './oauth.service.js';

const contextOf = (req) => ({
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip,
});

export const start = asyncHandler(async (req, res) => {
  const { provider } = req.validated.params;
  const state = crypto.randomUUID();
  setOAuthStateCookie(res, state);
  res.redirect(oauthService.getAuthorizationUrl(provider, state));
});

export const callback = asyncHandler(async (req, res) => {
  const { provider } = req.validated.params;
  const { code, state } = req.validated.body;

  const expected = req.cookies?.[OAUTH_STATE_COOKIE];
  if (!expected || state !== expected) {
    throw ApiError.unauthorized('Your sign-in session expired. Please try again.');
  }
  clearOAuthStateCookie(res);

  const user = await oauthService.authenticateWithProvider(provider, code);
  const tokens = await issueTokens(user, contextOf(req));
  setAuthCookies(res, tokens);

  sendSuccess(res, { message: 'Signed in', data: { user: toPublicUser(user) } });
});
