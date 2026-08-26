import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapAck } from './envelope';

const { USERS } = ROUTES;
const path = (route) => `${USERS.BASE}${route}`;

/**
 * `GET /users/me` is intentionally absent: it returns the same public user as
 * `GET /auth/me`, which the session query already owns. Two client functions for
 * one resource only invite the two copies to drift.
 */
export const updateProfileRequest = (payload) =>
  apiClient.patch(path(USERS.ME), payload).then(unwrap('user'));

export const deleteAccountRequest = () => apiClient.delete(path(USERS.ME)).then(unwrapAck);

export const updatePreferencesRequest = (payload) =>
  apiClient.patch(path(USERS.PREFERENCES), payload).then(unwrap('preferences'));
