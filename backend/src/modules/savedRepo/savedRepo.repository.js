import { prisma } from '../../lib/prisma.js';
import { toPrismaPage } from '../../utils/pagination.js';

const SELECT = {
  publicId: true,
  owner: true,
  name: true,
  ref: true,
  description: true,
  stars: true,
  language: true,
  lastOpenedAt: true,
  createdAt: true,
};

/**
 * Saving a repo is idempotent — the same repo bookmarked twice is one row with a
 * fresher `lastOpenedAt`, which is also what makes this safe to call on every
 * repo open without the client tracking whether it is already saved.
 */
export const save = (userId, { owner, name, ...rest }) =>
  prisma.savedRepo.upsert({
    where: { userId_owner_name: { userId, owner, name } },
    create: { userId, owner, name, ...rest, lastOpenedAt: new Date() },
    update: { ...rest, lastOpenedAt: new Date() },
    select: SELECT,
  });

export const listForUser = (userId, page) =>
  prisma.savedRepo.findMany({
    where: { userId },
    select: SELECT,
    orderBy: [{ lastOpenedAt: 'desc' }, { id: 'desc' }],
    ...toPrismaPage(page),
  });

export const deleteOwned = async (publicId, userId) => {
  const result = await prisma.savedRepo.deleteMany({ where: { publicId, userId } });
  return result.count > 0;
};
