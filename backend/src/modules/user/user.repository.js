import { prisma } from '../../lib/prisma.js';


const BASE_SELECT = {
  id: true,
  publicId: true,
  email: true,
  status: true,
  createdAt: true,
  role: { select: { name: true } },
  profile: {
    select: { displayName: true, bio: true },
  },
  preferences: { select: { theme: true, locale: true } },
};

export const findByEmailWithSecret = (email) =>
  prisma.user.findUnique({
    where: { email },
    select: { ...BASE_SELECT, passwordHash: true },
  });

export const findByPublicId = (publicId) =>
  prisma.user.findFirst({ where: { publicId, deletedAt: null }, select: BASE_SELECT });

export const getRoleByName = (name) => prisma.role.findUnique({ where: { name } });

export const createLocalUser = ({ email, passwordHash, displayName, roleId }) =>
  prisma.user.create({
    data: {
      email,
      passwordHash,
      roleId,
      profile: { create: { displayName: displayName ?? null } },
      preferences: { create: {} },
      authAccounts: { create: { provider: 'LOCAL', providerAccountId: email } },
    },
    select: BASE_SELECT,
  });

export const updateProfile = (publicId, data) =>
  prisma.user.update({
    where: { publicId },
    data: { profile: { update: data } },
    select: BASE_SELECT,
  });

export const upsertPreferences = async (publicId, data) => {
  const user = await prisma.user.update({
    where: { publicId },
    data: {
      preferences: {
        upsert: { create: data, update: data },
      },
    },
    select: BASE_SELECT,
  });
  return user;
};

export const softDelete = (publicId) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { publicId },
      data: { status: 'DELETED', deletedAt: new Date() },
      select: { id: true },
    });
    await tx.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });
