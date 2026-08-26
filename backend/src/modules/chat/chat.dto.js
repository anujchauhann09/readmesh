import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination.js';

const conversationId = z.string().uuid('Invalid conversation id');

export const listConversationsSchema = z.object({
  query: z.object({
    owner: z.string().trim().min(1).max(100).optional(),
    name: z.string().trim().min(1).max(100).optional(),
    ref: z.string().trim().min(1).max(255).optional(),
    ...paginationQuery,
  }),
});

export const conversationIdSchema = z.object({
  params: z.object({ id: conversationId }),
});
