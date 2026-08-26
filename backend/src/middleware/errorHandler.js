import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../common/ApiError.js';
import { config } from '../config/env.js';

export const notFoundHandler = (req, _res, next) => {
  // The requested path is logged but deliberately not echoed into the response
  // body — there is no reason to reflect caller-controlled text back out.
  req.log?.debug({ method: req.method, url: req.originalUrl }, 'No route matched');
  next(ApiError.notFound('Route not found'));
};

const fromPrisma = (error) => {
  switch (error.code) {
    case 'P2002':
      return ApiError.conflict('A record with these unique fields already exists', {
        fields: error.meta?.target,
      });
    case 'P2025':
      return ApiError.notFound('The requested record was not found');
    case 'P2003':
      return ApiError.badRequest('Related record constraint failed');
    default:
      return new ApiError(400, 'Database request error', { code: `PRISMA_${error.code}` });
  }
};

/** Body-parser failures arrive as plain errors with a `type` discriminator. */
const fromBodyParser = (error) => {
  if (error.type === 'entity.too.large') {
    return new ApiError(413, 'That content is too large to upload', {
      code: 'PAYLOAD_TOO_LARGE',
    });
  }
  if (error.type === 'entity.parse.failed') {
    return ApiError.badRequest('Request body is not valid JSON');
  }
  return null;
};

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (error instanceof ZodError) {
    error = ApiError.badRequest('Validation failed', error.flatten());
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    error = fromPrisma(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    error = ApiError.badRequest('Invalid database query');
  } else if (!(error instanceof ApiError)) {
    error = fromBodyParser(error) ?? ApiError.internal();
  }

  if (!error.isOperational || error.statusCode >= 500) {
    req.log?.error({ err, statusCode: error.statusCode }, err?.message ?? 'Unhandled error');
  }

  // Headers are already on the wire for streaming endpoints (SSE); those handle
  // their own error frames, so there is nothing left to send here.
  if (res.headersSent) return;

  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined && { details: error.details }),
    },
    ...(!config.isProd && err?.stack && { stack: err.stack }),
  });
};
