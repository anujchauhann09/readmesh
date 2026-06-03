import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { validate } from '../../middleware/validate.js';
import { startSchema, callbackSchema } from './oauth.dto.js';
import { start, callback } from './oauth.controller.js';

const { START, CALLBACK } = ROUTES.OAUTH;

export const oauthRouter = Router();

oauthRouter.get(START, validate(startSchema), start);
oauthRouter.post(CALLBACK, validate(callbackSchema), callback);
