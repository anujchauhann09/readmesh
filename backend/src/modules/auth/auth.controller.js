import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from '../../utils/cookies.js';
import * as authService from './auth.service.js';


const contextOf = (req) => ({
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip,
});

export const register = asyncHandler(async (req, res) => {
  const { user } = await authService.register(req.validated.body);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Account created — please sign in',
    data: { user },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.login(req.validated.body, contextOf(req));
  setAuthCookies(res, tokens);
  sendSuccess(res, { message: 'Signed in', data: { user } });
});

export const refresh = asyncHandler(async (req, res) => {
  const { tokens, user } = await authService.refresh(req.cookies?.[REFRESH_COOKIE], contextOf(req));
  setAuthCookies(res, tokens);
  sendSuccess(res, { message: 'Session refreshed', data: { user } });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(res);
  sendSuccess(res, { message: 'Signed out', data: null });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.publicId);
  sendSuccess(res, { data: { user } });
});
