import { prisma } from '../../lib/prisma.js';

export const createRefreshToken = (data) => prisma.refreshToken.create({ data });

export const findByTokenHash = (tokenHash) =>
  prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { role: true } } },
  });

export const revokeById = (id) =>
  prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });

export const revokeAllForUser = (userId) =>
  prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

export const rotateRefreshToken = ({ oldId, newToken }) =>
  prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({ data: newToken });
    await tx.refreshToken.update({
      where: { id: oldId },
      data: { revokedAt: new Date(), replacedById: created.id },
    });
    return created;
  });
