import { ApiError } from '../../common/ApiError.js';
import { config } from '../../config/env.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import {
  signAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../../utils/jwt.js';
import { parseDurationMs } from '../../utils/duration.js';
import * as userRepo from '../user/user.repository.js';
import { toPublicUser } from '../user/user.mapper.js';
import * as tokenRepo from './auth.repository.js';

const DEFAULT_ROLE = 'developer';
const GENERIC_CREDENTIALS_ERROR = 'Invalid email or password';

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
  if (user.status !== 'ACTIVE') throw ApiError.forbidden('This account is not active');

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
  const accessToken = signAccessToken({ sub: user.publicId, role: user.role.name });
  const { token: refreshToken, tokenHash } = generateRefreshToken({ sub: user.publicId });

  await tokenRepo.rotateRefreshToken({
    oldId: record.id,
    newToken: {
      userId: record.userId,
      tokenHash,
      expiresAt: new Date(Date.now() + parseDurationMs(config.jwt.refreshTtl)),
      userAgent: ctx.userAgent ?? null,
      ipAddress: ctx.ipAddress ?? null,
    },
  });

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
