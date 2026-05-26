import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import * as healthService from './health.service.js';

export const checkHealth = asyncHandler(async (_req, res) => {
  const data = await healthService.getHealthStatus();
  const statusCode = data.status === 'ok' ? 200 : 503;
  sendSuccess(res, { statusCode, data });
});
