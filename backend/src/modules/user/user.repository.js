import { prisma } from '../../lib/prisma.js';

const BASE_SELECT = {
  id: true,
  publicId: true,
  email: true,
  status: true,
  deletedAt: true,
  createdAt: true,
  role: { select: { name: true } },
  profile: {
    select: { displayName: true, bio: true },
  },
  preferences: { select: { theme: true, locale: true } },
};

/**
 * Looks up by email in *any* state, soft-deleted included. Registration needs
 * this to report a conflict rather than trip the unique index; sign-in paths must
 * use the account-state guard before trusting the result.
 */
export const findByEmailWithSecret = (email) =>
  prisma.user.findUnique({
    where: { email },
    select: { ...BASE_SELECT, passwordHash: true },
  });

export const findByPublicId = (publicId) =>
  prisma.user.findFirst({ where: { publicId, deletedAt: null }, select: BASE_SELECT });

/**
 * Maps the external UUID to the internal autoincrement id that owns-rows checks
 * run against. Shared by every user-scoped module so the mapping (and its
 * soft-delete filter) lives in exactly one place.
 */
export const resolveInternalId = async (publicId) => {
  const user = await prisma.user.findFirst({
    where: { publicId, deletedAt: null },
    select: { id: true },
  });
  return user?.id ?? null;
};

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

export const findByProviderAccount = (provider, providerAccountId) =>
  prisma.user.findFirst({
    where: { deletedAt: null, authAccounts: { some: { provider, providerAccountId } } },
    select: BASE_SELECT,
  });

export const createOAuthUser = ({ email, displayName, roleId, provider, providerAccountId }) =>
  prisma.user.create({
    data: {
      email,
      passwordHash: null,
      roleId,
      profile: { create: { displayName: displayName ?? null } },
      preferences: { create: {} },
      authAccounts: { create: { provider, providerAccountId } },
    },
    select: BASE_SELECT,
  });

export const linkAuthAccount = (publicId, { provider, providerAccountId }) =>
  prisma.user.update({
    where: { publicId, deletedAt: null },
    data: { authAccounts: { create: { provider, providerAccountId } } },
    select: BASE_SELECT,
  });

/**
 * Upserts rather than updates: a user row created outside the normal flow (an
 * older migration, a manual fix) has no profile row, and `update` would surface
 * that as a confusing "record not found".
 */
export const updateProfile = (publicId, data) =>
  prisma.user.update({
    where: { publicId, deletedAt: null },
    data: {
      profile: {
        upsert: { create: data, update: data },
      },
    },
    select: BASE_SELECT,
  });

export const upsertPreferences = (publicId, data) =>
  prisma.user.update({
    where: { publicId, deletedAt: null },
    data: {
      preferences: {
        upsert: { create: data, update: data },
      },
    },
    select: BASE_SELECT,
  });

export const updatePasswordHash = (userId, passwordHash) =>
  prisma.user.update({ where: { id: userId }, data: { passwordHash }, select: { id: true } });

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
    await tx.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
  });
