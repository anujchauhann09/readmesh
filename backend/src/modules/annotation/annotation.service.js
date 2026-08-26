import { requireInternalUserId } from '../user/user.access.js';
import { ApiError } from '../../common/ApiError.js';
import { toPage } from '../../utils/pagination.js';
import * as repo from './annotation.repository.js';
import { toPublicAnnotation } from './annotation.mapper.js';

export const createAnnotation = async (publicUserId, data) => {
  const userId = await requireInternalUserId(publicUserId);
  const created = await repo.create(userId, data);
  return toPublicAnnotation(created);
};

export const listAnnotations = async (publicUserId, { owner, name, ref, path, limit, cursor }) => {
  const userId = await requireInternalUserId(publicUserId);
  const rows = await repo.listForUser(
    userId,
    { repoOwner: owner, repoName: name, repoRef: ref, filePath: path },
    { limit, cursor },
  );
  const { items, meta } = toPage(rows, { limit });
  return { annotations: items.map(toPublicAnnotation), meta };
};

export const updateAnnotation = async (publicUserId, publicId, data) => {
  const userId = await requireInternalUserId(publicUserId);
  const updated = await repo.updateOwned(publicId, userId, data);
  if (!updated) throw ApiError.notFound('Annotation not found');
  return toPublicAnnotation(updated);
};

export const deleteAnnotation = async (publicUserId, publicId) => {
  const userId = await requireInternalUserId(publicUserId);
  const removed = await repo.deleteOwned(publicId, userId);
  if (!removed) throw ApiError.notFound('Annotation not found');
};
