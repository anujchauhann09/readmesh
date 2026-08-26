import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import { ApiError } from '../../common/ApiError.js';
import * as healthService from './health.service.js';

export const checkHealth = asyncHandler(async (_req, res) => {
  const data = await healthService.getHealthStatus();

  // A degraded check is a failure, so it goes out through the normal error
  // envelope rather than as `success: true` with a 503 stapled to it.
  if (data.status !== 'ok') {
    throw new ApiError(503, 'One or more dependencies are unavailable', {
      code: 'SERVICE_UNAVAILABLE',
      details: data,
    });
  }

  sendSuccess(res, { data });
});
