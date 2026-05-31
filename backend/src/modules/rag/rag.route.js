import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { aiLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { ingestSchema, askSchema } from './rag.dto.js';
import { ingest, ask, askStream } from './rag.controller.js';

const { INGEST, ASK, ASK_STREAM } = ROUTES.RAG;

export const ragRouter = Router();

ragRouter.use(authenticate);
ragRouter.use(aiLimiter);

ragRouter.post(INGEST, validate(ingestSchema), ingest);
ragRouter.post(ASK, validate(askSchema), ask);
ragRouter.post(ASK_STREAM, validate(askSchema), askStream);
