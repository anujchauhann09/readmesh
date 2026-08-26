import { ApiError } from '../../common/ApiError.js';

/**
 * The single place that decides whether an account may hold a session.
 *
 * Every entry point that mints tokens — password sign-in, OAuth sign-in, token
 * refresh — runs this. Keeping it in one function is what stops the checks from
 * drifting apart: an account that is refused at the login form but accepted by
 * OAuth or by a refresh is not actually suspended.
 *
 * Deliberately free of data-access imports so the policy stays pure and testable;
 * the lookup that pairs with it lives in `user.access.js`.
 */
export const assertAccountUsable = (user) => {
  if (!user || user.deletedAt) throw ApiError.unauthorized('This account is no longer available');
  if (user.status === 'SUSPENDED') throw ApiError.forbidden('This account is suspended');
  if (user.status !== 'ACTIVE') throw ApiError.forbidden('This account is not active');
  return user;
};

/** Non-throwing form, for paths that must not reveal whether an account exists. */
export const isAccountUsable = (user) =>
  Boolean(user) && !user.deletedAt && user.status === 'ACTIVE';
