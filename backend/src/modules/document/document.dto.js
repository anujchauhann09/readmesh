import { z } from 'zod';
import { DOCUMENT_LIMITS } from '@readmesh/shared';
import { paginationQuery } from '../../utils/pagination.js';

const content = z.string().max(DOCUMENT_LIMITS.CONTENT_MAX, 'Document is too large');

export const createDocumentSchema = z.object({
  body: z.object({ content: content.optional().default('') }),
});

export const updateDocumentSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid document id') }),
  body: z.object({ content }),
});

export const documentIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid document id') }),
});

export const listDocumentsSchema = z.object({
  query: z.object(paginationQuery),
});
