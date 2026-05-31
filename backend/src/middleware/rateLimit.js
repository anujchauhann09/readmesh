import rateLimit from 'express-rate-limit';
import { ApiError } from '../common/ApiError.js';

const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => next(ApiError.tooManyRequests(message)),
  });

export const apiRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: 'Too many requests, please try again later.',
});


export const strictRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many attempts, please slow down.',
});

export const aiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many AI requests. Please slow down and try again shortly.',
});
