import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import * as analyticsService from './analytics.service.js';

export const recordEvent = asyncHandler(async (req, res) => {
  await analyticsService.recordEvent(req.user.publicId, req.validated.body);
  sendSuccess(res, { statusCode: 202, message: 'Event recorded', data: null });
});

export const summary = asyncHandler(async (req, res) => {
  const data = await analyticsService.getSummary(req.user.publicId, req.validated.query);
  sendSuccess(res, { data });
});
