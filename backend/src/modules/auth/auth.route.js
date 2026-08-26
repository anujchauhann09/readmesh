import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { strictRateLimiter } from '../../middleware/rateLimit.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.dto.js';
import {
  register,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
} from './auth.controller.js';

const { REGISTER, LOGIN, LOGOUT, REFRESH, ME, FORGOT_PASSWORD, RESET_PASSWORD } = ROUTES.AUTH;

export const authRouter = Router();

authRouter.post(REGISTER, strictRateLimiter, validate(registerSchema), register);
authRouter.post(LOGIN, strictRateLimiter, validate(loginSchema), login);
authRouter.post(REFRESH, refresh);
authRouter.post(LOGOUT, logout);
authRouter.get(ME, authenticate, me);

// Credential-recovery endpoints are the classic brute-force and enumeration
// target, so they sit behind the strict limiter alongside login/register.
authRouter.post(FORGOT_PASSWORD, strictRateLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post(RESET_PASSWORD, strictRateLimiter, validate(resetPasswordSchema), resetPassword);
