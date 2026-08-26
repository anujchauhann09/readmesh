import { prisma } from '../../lib/prisma.js';

export const createRefreshToken = (data) => prisma.refreshToken.create({ data });

export const findByTokenHash = (tokenHash) =>
  prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { role: true, profile: true, preferences: true } } },
  });

export const revokeById = (id) =>
  prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });

export const revokeAllForUser = (userId) =>
  prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

/**
 * Rotates a refresh token, atomically.
 *
 * The revoke is written first as a conditional `updateMany` on `revokedAt: null`,
 * which takes a row lock: two tabs refreshing with the same cookie at once are
 * serialized, and the loser matches zero rows and gets `null` instead of a second
 * valid token. Without that, both requests read "not revoked" and both minted.
 */
export const rotateRefreshToken = ({ oldId, newToken }) =>
  prisma.$transaction(async (tx) => {
    const claimed = await tx.refreshToken.updateMany({
      where: { id: oldId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (claimed.count === 0) return null;

    const created = await tx.refreshToken.create({ data: newToken });
    await tx.refreshToken.update({ where: { id: oldId }, data: { replacedById: created.id } });
    return created;
  });

export const createPasswordResetToken = (data) => prisma.passwordResetToken.create({ data });

export const findResetByTokenHash = (tokenHash) =>
  prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { role: true, profile: true, preferences: true } } },
  });

/** Supersedes any outstanding reset grants so only the newest link works. */
export const invalidateResetTokensForUser = (userId) =>
  prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

/**
 * Consumes the grant and re-keys the account in one transaction: marking the token
 * used, writing the new hash, and cutting every existing session loose so a
 * password reset actually evicts whoever prompted it.
 */
export const consumeResetToken = ({ tokenId, userId, passwordHash }) =>
  prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: tokenId, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return false;

    await tx.user.update({ where: { id: userId }, data: { passwordHash } });
    await tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return true;
  });

/** Housekeeping for the background cleanup job. */
export const deleteExpiredTokens = async (now = new Date()) => {
  const [refreshTokens, resetTokens] = await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  return { refreshTokens: refreshTokens.count, resetTokens: resetTokens.count };
};
