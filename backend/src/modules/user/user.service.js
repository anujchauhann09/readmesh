import { ApiError } from '../../common/ApiError.js';
import * as userRepo from './user.repository.js';
import { toPublicUser } from './user.mapper.js';

export const getProfile = async (publicId) => {
  const user = await userRepo.findByPublicId(publicId);
  if (!user) throw ApiError.notFound('User not found');
  return toPublicUser(user);
};

export const updateProfile = async (publicId, data) => {
  const user = await userRepo.findByPublicId(publicId);
  if (!user) throw ApiError.notFound('User not found');
  const updated = await userRepo.updateProfile(publicId, data);
  return toPublicUser(updated);
};

export const getPreferences = async (publicId) => {
  const user = await userRepo.findByPublicId(publicId);
  if (!user) throw ApiError.notFound('User not found');
  return user.preferences ?? null;
};

export const updatePreferences = async (publicId, data) => {
  const user = await userRepo.findByPublicId(publicId);
  if (!user) throw ApiError.notFound('User not found');
  const updated = await userRepo.upsertPreferences(publicId, data);
  return toPublicUser(updated).preferences;
};

export const deleteAccount = async (publicId) => {
  const user = await userRepo.findByPublicId(publicId);
  if (!user) throw ApiError.notFound('User not found');
  await userRepo.softDelete(publicId);
};
