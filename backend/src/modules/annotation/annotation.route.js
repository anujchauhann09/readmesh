import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createAnnotationSchema,
  listAnnotationsSchema,
  updateAnnotationSchema,
  annotationIdSchema,
} from './annotation.dto.js';
import { create, list, update, remove } from './annotation.controller.js';

const { ROOT, BY_ID } = ROUTES.ANNOTATIONS;

export const annotationRouter = Router();

annotationRouter.use(authenticate);

annotationRouter.get(ROOT, validate(listAnnotationsSchema), list);
annotationRouter.post(ROOT, validate(createAnnotationSchema), create);
annotationRouter.patch(BY_ID, validate(updateAnnotationSchema), update);
annotationRouter.delete(BY_ID, validate(annotationIdSchema), remove);
