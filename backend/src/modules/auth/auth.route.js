import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { strictRateLimiter } from '../../middleware/rateLimit.js';
import { registerSchema, loginSchema } from './auth.dto.js';
import { register, login, refresh, logout, me } from './auth.controller.js';

const { REGISTER, LOGIN, LOGOUT, REFRESH, ME } = ROUTES.AUTH;

export const authRouter = Router();

authRouter.post(REGISTER, strictRateLimiter, validate(registerSchema), register);
authRouter.post(LOGIN, strictRateLimiter, validate(loginSchema), login);
authRouter.post(REFRESH, refresh);
authRouter.post(LOGOUT, logout);
authRouter.get(ME, authenticate, me);
