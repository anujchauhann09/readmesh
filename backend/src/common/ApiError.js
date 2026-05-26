export class ApiError extends Error {
  constructor(statusCode, message, { code, details, isOperational = true } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code ?? 'ERROR';
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, { code: 'BAD_REQUEST', details });
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, { code: 'FORBIDDEN' });
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static conflict(message = 'Resource already exists', details) {
    return new ApiError(409, message, { code: 'CONFLICT', details });
  }

  static unprocessable(message = 'Unprocessable entity', details) {
    return new ApiError(422, message, { code: 'UNPROCESSABLE_ENTITY', details });
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message, { code: 'TOO_MANY_REQUESTS' });
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, { code: 'INTERNAL_ERROR', isOperational: false });
  }

  static badGateway(message = 'Upstream service error') {
    return new ApiError(502, message, { code: 'BAD_GATEWAY' });
  }
}
