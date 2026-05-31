import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { aiLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { tldrSchema, commandsSchema, beginnerSchema, translateSchema } from './summary.dto.js';
import { tldr, commands, beginner, translate } from './summary.controller.js';

const { TLDR, COMMANDS, BEGINNER, TRANSLATE } = ROUTES.SUMMARY;

export const summaryRouter = Router();

summaryRouter.use(authenticate);
summaryRouter.use(aiLimiter);

summaryRouter.post(TLDR, validate(tldrSchema), tldr);
summaryRouter.post(COMMANDS, validate(commandsSchema), commands);
summaryRouter.post(BEGINNER, validate(beginnerSchema), beginner);
summaryRouter.post(TRANSLATE, validate(translateSchema), translate);
