import { ApiError } from '../../common/ApiError.js';
import { requireInternalUserId } from '../user/user.access.js';
import { toPage } from '../../utils/pagination.js';
import * as repo from './savedRepo.repository.js';
import { toPublicSavedRepo } from './savedRepo.mapper.js';

export const saveRepo = async (publicUserId, data) => {
  const userId = await requireInternalUserId(publicUserId);
  const saved = await repo.save(userId, {
    owner: data.owner,
    name: data.name,
    ref: data.ref ?? null,
    description: data.description ?? null,
    stars: data.stars ?? null,
    language: data.language ?? null,
  });
  return toPublicSavedRepo(saved);
};

export const listSavedRepos = async (publicUserId, { limit, cursor }) => {
  const userId = await requireInternalUserId(publicUserId);
  const rows = await repo.listForUser(userId, { limit, cursor });
  const { items, meta } = toPage(rows, { limit });
  return { repos: items.map(toPublicSavedRepo), meta };
};

export const removeSavedRepo = async (publicUserId, publicId) => {
  const userId = await requireInternalUserId(publicUserId);
  const removed = await repo.deleteOwned(publicId, userId);
  if (!removed) throw ApiError.notFound('Saved repository not found');
};
