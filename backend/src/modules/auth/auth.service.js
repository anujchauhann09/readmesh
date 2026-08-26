import crypto from 'node:crypto';
import { PASSWORD_RESET_TTL_MINUTES } from '@readmesh/shared';
import { ApiError } from '../../common/ApiError.js';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import {
  signAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../../utils/jwt.js';
import { parseDurationMs } from '../../utils/duration.js';
import { sendMail } from '../../lib/mailer.js';
import * as userRepo from '../user/user.repository.js';
import { assertAccountUsable, isAccountUsable } from '../user/user.guards.js';
import { toPublicUser } from '../user/user.mapper.js';
import * as tokenRepo from './auth.repository.js';
import { resetEmail } from './auth.emails.js';

const DEFAULT_ROLE = 'developer';
const GENERIC_CREDENTIALS_ERROR = 'Invalid email or password';
// Deliberately identical whether or not the address matches an account.
const RESET_REQUESTED_MESSAGE = 'If that email is registered, a password reset link is on its way.';

export const issueTokens = async (user, ctx) => {
  const accessToken = signAccessToken({ sub: user.publicId, role: user.role.name });
  const { token: refreshToken, tokenHash } = generateRefreshToken({ sub: user.publicId });

  await tokenRepo.createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + parseDurationMs(config.jwt.refreshTtl)),
    userAgent: ctx.userAgent ?? null,
    ipAddress: ctx.ipAddress ?? null,
  });

  return { accessToken, refreshToken };
};

export const register = async ({ email, password, displayName }) => {
  const existing = await userRepo.findByEmailWithSecret(email);
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const role = await userRepo.getRoleByName(DEFAULT_ROLE);
  if (!role) throw ApiError.internal('Default role is not configured (run the seed)');

  const passwordHash = await hashPassword(password);
  const user = await userRepo.createLocalUser({
    email,
    passwordHash,
    displayName,
    roleId: role.id,
  });

  return { user: toPublicUser(user) };
};

export const login = async ({ email, password }, ctx) => {
  const user = await userRepo.findByEmailWithSecret(email);
  const ok = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) throw ApiError.unauthorized(GENERIC_CREDENTIALS_ERROR);
  assertAccountUsable(user);

  const tokens = await issueTokens(user, ctx);
  return { user: toPublicUser(user), tokens };
};

export const refresh = async (rawToken, ctx) => {
  if (!rawToken) throw ApiError.unauthorized('No refresh token provided');

  try {
    verifyRefreshToken(rawToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const record = await tokenRepo.findByTokenHash(hashToken(rawToken));
  if (!record) throw ApiError.unauthorized('Refresh token not recognized');

  if (record.revokedAt) {
    await tokenRepo.revokeAllForUser(record.userId);
    throw ApiError.unauthorized('Refresh token reuse detected — please sign in again');
  }
  if (record.expiresAt < new Date()) throw ApiError.unauthorized('Refresh token expired');

  const { user } = record;
  // A session must not outlive the account behind it: suspension or deletion has
  // to take effect at the next refresh, not a full refresh-TTL later.
  assertAccountUsable(user);

  const { token: refreshToken, tokenHash } = generateRefreshToken({ sub: user.publicId });

  const rotated = await tokenRepo.rotateRefreshToken({
    oldId: record.id,
    newToken: {
      userId: record.userId,
      tokenHash,
      expiresAt: new Date(Date.now() + parseDurationMs(config.jwt.refreshTtl)),
      userAgent: ctx.userAgent ?? null,
      ipAddress: ctx.ipAddress ?? null,
    },
  });

  // Another concurrent refresh won the race and already rotated this token.
  if (!rotated) throw ApiError.unauthorized('Session was refreshed elsewhere — please retry');

  const accessToken = signAccessToken({ sub: user.publicId, role: user.role.name });
  return { tokens: { accessToken, refreshToken }, user: toPublicUser(user) };
};

export const logout = async (rawToken) => {
  if (!rawToken) return;
  const record = await tokenRepo.findByTokenHash(hashToken(rawToken));
  if (record && !record.revokedAt) await tokenRepo.revokeById(record.id);
};

export const getCurrentUser = async (publicId) => {
  const user = await userRepo.findByPublicId(publicId);
  if (!user) throw ApiError.unauthorized();
  return toPublicUser(user);
};

/**
 * Starts a password reset.
 *
 * The response is identical for a known and an unknown address — otherwise this
 * endpoint becomes an account-enumeration oracle. Mail failures are swallowed by
 * the mailer for the same reason.
 */
export const requestPasswordReset = async ({ email }, ctx = {}) => {
  const user = await userRepo.findByEmailWithSecret(email);

  if (isAccountUsable(user)) {
    // Only the newest link should work, so outstanding grants are burned first.
    await tokenRepo.invalidateResetTokensForUser(user.id);

    const token = crypto.randomBytes(32).toString('base64url');
    await tokenRepo.createPasswordResetToken({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000),
      requestedIp: ctx.ipAddress ?? null,
    });

    const link = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await sendMail({ to: user.email, ...resetEmail(link) });
    logger.info({ userId: user.id }, 'Password reset requested');
  }

  return { message: RESET_REQUESTED_MESSAGE };
};

export const resetPassword = async ({ token, password }) => {
  const record = await tokenRepo.findResetByTokenHash(hashToken(token));

  const invalid = ApiError.badRequest('This reset link is invalid or has expired');
  if (!record || record.usedAt || record.expiresAt < new Date()) throw invalid;
  if (!isAccountUsable(record.user)) throw invalid;

  const passwordHash = await hashPassword(password);
  const consumed = await tokenRepo.consumeResetToken({
    tokenId: record.id,
    userId: record.userId,
    passwordHash,
  });
  // Lost a race with another use of the same single-use link.
  if (!consumed) throw invalid;

  logger.info({ userId: record.userId }, 'Password reset completed');
  return { user: toPublicUser(record.user) };
};
