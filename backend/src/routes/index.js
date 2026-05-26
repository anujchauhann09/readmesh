import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { healthRouter } from '../modules/health/health.route.js';


export const apiRouter = Router();

apiRouter.use(ROUTES.HEALTH, healthRouter);


