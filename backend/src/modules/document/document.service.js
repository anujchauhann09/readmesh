import { deriveDocumentTitle } from '@readmesh/shared';
import { ApiError } from '../../common/ApiError.js';
import { requireInternalUserId } from '../user/user.access.js';
import { toPage } from '../../utils/pagination.js';
import * as repo from './document.repository.js';
import { toPublicDocument, toPublicDocumentSummary } from './document.mapper.js';

export const createDocument = async (publicUserId, { content = '' }) => {
  const userId = await requireInternalUserId(publicUserId);
  const created = await repo.create(userId, { title: deriveDocumentTitle(content), content });
  return toPublicDocument(created);
};

export const listDocuments = async (publicUserId, { limit, cursor }) => {
  const userId = await requireInternalUserId(publicUserId);
  const rows = await repo.listForUser(userId, { limit, cursor });
  const { items, meta } = toPage(rows, { limit });
  return { documents: items.map(toPublicDocumentSummary), meta };
};

export const getDocument = async (publicUserId, publicId) => {
  const userId = await requireInternalUserId(publicUserId);
  const doc = await repo.getOwned(publicId, userId);
  if (!doc) throw ApiError.notFound('Document not found');
  return toPublicDocument(doc);
};

export const updateDocument = async (publicUserId, publicId, { content }) => {
  const userId = await requireInternalUserId(publicUserId);
  const updated = await repo.updateOwned(publicId, userId, {
    content,
    title: deriveDocumentTitle(content),
  });
  if (!updated) throw ApiError.notFound('Document not found');
  return toPublicDocument(updated);
};

export const deleteDocument = async (publicUserId, publicId) => {
  const userId = await requireInternalUserId(publicUserId);
  const removed = await repo.deleteOwned(publicId, userId);
  if (!removed) throw ApiError.notFound('Document not found');
};
