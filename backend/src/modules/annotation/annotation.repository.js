import { prisma } from '../../lib/prisma.js';
import { toPrismaPage } from '../../utils/pagination.js';

const SELECT = {
  publicId: true,
  type: true,
  repoOwner: true,
  repoName: true,
  repoRef: true,
  filePath: true,
  exact: true,
  prefix: true,
  suffix: true,
  textPosition: true,
  sectionId: true,
  sectionTitle: true,
  color: true,
  body: true,
  createdAt: true,
  updatedAt: true,
};

export const create = (userId, data) =>
  prisma.annotation.create({ data: { ...data, userId }, select: SELECT });

export const listForUser = (userId, { repoOwner, repoName, repoRef, filePath }, page) =>
  prisma.annotation.findMany({
    where: {
      userId,
      repoOwner,
      repoName,
      repoRef,
      ...(filePath ? { filePath } : {}),
    },
    select: SELECT,
    // `id` breaks ties so the ordering is total — a cursor over a non-unique sort
    // key can otherwise skip or repeat rows created in the same millisecond.
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    ...toPrismaPage(page),
  });

export const updateOwned = async (publicId, userId, data) => {
  const result = await prisma.annotation.updateMany({
    where: { publicId, userId },
    data,
  });
  if (result.count === 0) return null;
  return prisma.annotation.findUnique({ where: { publicId }, select: SELECT });
};

export const deleteOwned = async (publicId, userId) => {
  const result = await prisma.annotation.deleteMany({ where: { publicId, userId } });
  return result.count > 0;
};
