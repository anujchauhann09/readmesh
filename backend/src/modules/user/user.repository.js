import { prisma } from '../../lib/prisma.js';

/**
 * Fields safe to load for application logic. Includes the internal `id` (needed
 * for FKs like refresh tokens) but NOT `passwordHash`. The service maps this to
 * the client shape via `toPublicUser` (which drops the internal id).
 */
const BASE_SELECT = {
  id: true,
  publicId: true,
  email: true,
  emailVerified: true,
  status: true,
  createdAt: true,
  role: { select: { name: true } },
  profile: { select: { displayName: true, avatarUrl: true, bio: true } },
};

/** Login path — includes `passwordHash` for verification. Use nowhere else. */
export const findByEmailWithSecret = (email) =>
  prisma.user.findUnique({
    where: { email },
    select: { ...BASE_SELECT, passwordHash: true },
  });

export const findByPublicId = (publicId) =>
  prisma.user.findUnique({ where: { publicId }, select: BASE_SELECT });

export const getRoleByName = (name) => prisma.role.findUnique({ where: { name } });

/**
 * Creates a local (email/password) user together with its profile and a LOCAL
 * auth account in a single nested write.
 */
export const createLocalUser = ({ email, passwordHash, displayName, roleId }) =>
  prisma.user.create({
    data: {
      email,
      passwordHash,
      roleId,
      profile: { create: { displayName: displayName ?? null } },
      authAccounts: { create: { provider: 'LOCAL', providerAccountId: email } },
    },
    select: BASE_SELECT,
  });
