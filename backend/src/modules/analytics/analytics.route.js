import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { recordEventSchema, summarySchema } from './analytics.dto.js';
import { recordEvent, summary } from './analytics.controller.js';

const { EVENTS, SUMMARY } = ROUTES.ANALYTICS;

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.post(EVENTS, validate(recordEventSchema), recordEvent);
analyticsRouter.get(SUMMARY, validate(summarySchema), summary);
