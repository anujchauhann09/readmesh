import { prisma } from '../../lib/prisma.js';

const FULL = {
  publicId: true,
  title: true,
  content: true,
  createdAt: true,
  updatedAt: true,
};

const SUMMARY = {
  publicId: true,
  title: true,
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
  prisma.document.create({ data: { ...data, userId }, select: FULL });

export const listForUser = (userId) =>
  prisma.document.findMany({
    where: { userId },
    select: SUMMARY,
    orderBy: { updatedAt: 'desc' },
  });

export const getOwned = (publicId, userId) =>
  prisma.document.findFirst({ where: { publicId, userId }, select: FULL });

export const updateOwned = async (publicId, userId, data) => {
  const result = await prisma.document.updateMany({ where: { publicId, userId }, data });
  if (result.count === 0) return null;
  return prisma.document.findUnique({ where: { publicId }, select: FULL });
};

export const deleteOwned = async (publicId, userId) => {
  const result = await prisma.document.deleteMany({ where: { publicId, userId } });
  return result.count > 0;
};
