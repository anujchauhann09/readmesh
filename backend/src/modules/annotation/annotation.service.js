import { ApiError } from '../../common/ApiError.js';
import * as repo from './annotation.repository.js';
import { toPublicAnnotation } from './annotation.mapper.js';


const requireUserId = async (publicUserId) => {
  const userId = await repo.resolveUserId(publicUserId);
  if (!userId) throw ApiError.notFound('User not found');
  return userId;
};

export const createAnnotation = async (publicUserId, data) => {
  const userId = await requireUserId(publicUserId);
  const created = await repo.create(userId, data);
  return toPublicAnnotation(created);
};

export const listAnnotations = async (publicUserId, { owner, name, ref, path }) => {
  const userId = await requireUserId(publicUserId);
  const rows = await repo.listForUser(userId, {
    repoOwner: owner,
    repoName: name,
    repoRef: ref,
    filePath: path,
  });
  return rows.map(toPublicAnnotation);
};

export const updateAnnotation = async (publicUserId, publicId, data) => {
  const userId = await requireUserId(publicUserId);
  const updated = await repo.updateOwned(publicId, userId, data);
  if (!updated) throw ApiError.notFound('Annotation not found');
  return toPublicAnnotation(updated);
};

export const deleteAnnotation = async (publicUserId, publicId) => {
  const userId = await requireUserId(publicUserId);
  const removed = await repo.deleteOwned(publicId, userId);
  if (!removed) throw ApiError.notFound('Annotation not found');
};
