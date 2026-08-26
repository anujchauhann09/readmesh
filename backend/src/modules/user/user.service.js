import { Prisma } from '@prisma/client';
import { ApiError } from '../../common/ApiError.js';
import * as userRepo from './user.repository.js';
import { toPublicUser } from './user.mapper.js';

/**
 * Writes target `{ publicId, deletedAt: null }`, so a missing row means the
 * account is gone (or soft-deleted) rather than that the update was malformed.
 * Translating it here keeps callers from having to read Prisma error codes.
 */
const withUserNotFound = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw ApiError.notFound('User not found');
    }
    throw error;
  }
};

export const getProfile = async (publicId) => {
  const user = await userRepo.findByPublicId(publicId);
  if (!user) throw ApiError.notFound('User not found');
  return toPublicUser(user);
};

export const updateProfile = async (publicId, data) => {
  const updated = await withUserNotFound(() => userRepo.updateProfile(publicId, data));
  return toPublicUser(updated);
};

export const getPreferences = async (publicId) => {
  const user = await userRepo.findByPublicId(publicId);
  if (!user) throw ApiError.notFound('User not found');
  return toPublicUser(user).preferences;
};

export const updatePreferences = async (publicId, data) => {
  const updated = await withUserNotFound(() => userRepo.upsertPreferences(publicId, data));
  return toPublicUser(updated).preferences;
};

export const deleteAccount = async (publicId) => {
  await withUserNotFound(() => userRepo.softDelete(publicId));
};
