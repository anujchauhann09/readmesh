import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, updatePreferencesSchema } from './user.dto.js';
import { getMe, updateMe, deleteMe, getPreferences, updatePreferences } from './user.controller.js';

const { ME, PREFERENCES } = ROUTES.USERS;

export const userRouter = Router();

// Every user route requires a valid session
userRouter.use(authenticate);

userRouter.get(ME, getMe);
userRouter.patch(ME, validate(updateProfileSchema), updateMe);
userRouter.delete(ME, deleteMe);
userRouter.get(PREFERENCES, getPreferences);
userRouter.patch(PREFERENCES, validate(updatePreferencesSchema), updatePreferences);
