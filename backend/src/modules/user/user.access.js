import { ApiError } from '../../common/ApiError.js';
import { resolveInternalId } from './user.repository.js';

/**
 * Resolves the caller's external UUID to the internal id that ownership filters
 * run against, or 404s. Every user-scoped module goes through this instead of
 * re-implementing the lookup, so the soft-delete filter cannot drift between them.
 */
export const requireInternalUserId = async (publicId) => {
  const userId = await resolveInternalId(publicId);
  if (!userId) throw ApiError.notFound('User not found');
  return userId;
};
