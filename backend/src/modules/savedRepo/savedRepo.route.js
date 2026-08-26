import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { saveRepoSchema, listSavedReposSchema, savedRepoIdSchema } from './savedRepo.dto.js';
import { save, list, remove } from './savedRepo.controller.js';

const { ROOT, BY_ID } = ROUTES.SAVED_REPOS;

export const savedRepoRouter = Router();

savedRepoRouter.use(authenticate);

savedRepoRouter.get(ROOT, validate(listSavedReposSchema), list);
savedRepoRouter.post(ROOT, validate(saveRepoSchema), save);
savedRepoRouter.delete(BY_ID, validate(savedRepoIdSchema), remove);
