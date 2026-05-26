import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import { clearAuthCookies } from '../../utils/cookies.js';
import * as userService from './user.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.publicId);
  sendSuccess(res, { data: { user } });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.publicId, req.validated.body);
  sendSuccess(res, { message: 'Profile updated', data: { user } });
});

export const deleteMe = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user.publicId);
  clearAuthCookies(res);
  sendSuccess(res, { message: 'Account deleted', data: null });
});

export const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await userService.getPreferences(req.user.publicId);
  sendSuccess(res, { data: { preferences } });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await userService.updatePreferences(req.user.publicId, req.validated.body);
  sendSuccess(res, { message: 'Preferences updated', data: { preferences } });
});
