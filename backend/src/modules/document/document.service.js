import { DEFAULT_DOCUMENT_TITLE, DOCUMENT_LIMITS } from '@readmesh/shared';
import { ApiError } from '../../common/ApiError.js';
import * as repo from './document.repository.js';
import { toPublicDocument, toPublicDocumentSummary } from './document.mapper.js';

const requireUserId = async (publicUserId) => {
  const userId = await repo.resolveUserId(publicUserId);
  if (!userId) throw ApiError.notFound('User not found');
  return userId;
};

const deriveTitle = (content = '') => {
  const match = content.match(/^#\s+(.+)$/m);
  const title = match ? match[1].trim() : '';
  return (title || DEFAULT_DOCUMENT_TITLE).slice(0, DOCUMENT_LIMITS.TITLE_MAX);
};

export const createDocument = async (publicUserId, { content = '' }) => {
  const userId = await requireUserId(publicUserId);
  const created = await repo.create(userId, { title: deriveTitle(content), content });
  return toPublicDocument(created);
};

export const listDocuments = async (publicUserId) => {
  const userId = await requireUserId(publicUserId);
  const rows = await repo.listForUser(userId);
  return rows.map(toPublicDocumentSummary);
};

export const getDocument = async (publicUserId, publicId) => {
  const userId = await requireUserId(publicUserId);
  const doc = await repo.getOwned(publicId, userId);
  if (!doc) throw ApiError.notFound('Document not found');
  return toPublicDocument(doc);
};

export const updateDocument = async (publicUserId, publicId, { content }) => {
  const userId = await requireUserId(publicUserId);
  const updated = await repo.updateOwned(publicId, userId, {
    content,
    title: deriveTitle(content),
  });
  if (!updated) throw ApiError.notFound('Document not found');
  return toPublicDocument(updated);
};

export const deleteDocument = async (publicUserId, publicId) => {
  const userId = await requireUserId(publicUserId);
  const removed = await repo.deleteOwned(publicId, userId);
  if (!removed) throw ApiError.notFound('Document not found');
};
