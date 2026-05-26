import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { healthRouter } from '../modules/health/health.route.js';
import { authRouter } from '../modules/auth/auth.route.js';
import { userRouter } from '../modules/user/user.route.js';

export const apiRouter = Router();

apiRouter.use(ROUTES.HEALTH, healthRouter);
apiRouter.use(ROUTES.AUTH.BASE, authRouter);
apiRouter.use(ROUTES.USERS.BASE, userRouter);


