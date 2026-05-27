import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { repoUrlSchema, contentSchema } from './github.dto.js';
import { resolveUrl, loadRepo, getContent } from './github.controller.js';

const { RESOLVE, REPO, CONTENT } = ROUTES.GITHUB;

export const githubRouter = Router();

githubRouter.use(authenticate);

githubRouter.post(RESOLVE, validate(repoUrlSchema), resolveUrl);
githubRouter.post(REPO, validate(repoUrlSchema), loadRepo);
githubRouter.get(CONTENT, validate(contentSchema), getContent);
