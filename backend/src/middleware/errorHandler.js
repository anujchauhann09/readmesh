import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../common/ApiError.js';
import { config } from '../config/env.js';

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
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

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (error instanceof ZodError) {
    error = ApiError.badRequest('Validation failed', error.flatten());
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    error = fromPrisma(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    error = ApiError.badRequest('Invalid database query');
  } else if (!(error instanceof ApiError)) {
    error = ApiError.internal();
  }

  if (!error.isOperational || error.statusCode >= 500) {
    req.log?.error({ err, statusCode: error.statusCode }, err?.message ?? 'Unhandled error');
  }

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
