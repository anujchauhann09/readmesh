import { prisma } from '../../lib/prisma.js';

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

export const resolveUserId = async (publicId) => {
  const user = await prisma.user.findFirst({
    where: { publicId, deletedAt: null },
    select: { id: true },
  });
  return user?.id ?? null;
};

export const create = (userId, data) =>
  prisma.annotation.create({ data: { ...data, userId }, select: SELECT });

export const listForUser = (userId, { repoOwner, repoName, repoRef, filePath }) =>
  prisma.annotation.findMany({
    where: {
      userId,
      repoOwner,
      repoName,
      repoRef,
      ...(filePath ? { filePath } : {}),
    },
    select: SELECT,
    orderBy: { createdAt: 'asc' },
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
