import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentIdSchema,
  listDocumentsSchema,
} from './document.dto.js';
import { create, list, get, update, remove } from './document.controller.js';

const { ROOT, BY_ID } = ROUTES.DOCUMENTS;

export const documentRouter = Router();

documentRouter.use(authenticate);

documentRouter.get(ROOT, validate(listDocumentsSchema), list);
documentRouter.post(ROOT, validate(createDocumentSchema), create);
documentRouter.get(BY_ID, validate(documentIdSchema), get);
documentRouter.patch(BY_ID, validate(updateDocumentSchema), update);
documentRouter.delete(BY_ID, validate(documentIdSchema), remove);
