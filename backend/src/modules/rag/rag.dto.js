import { z } from 'zod';
import { isSafeRef } from '../github/github.url.js';

const url = z.string().trim().min(1, 'A repository URL is required').max(500);
const ref = z.string().trim().refine(isSafeRef, 'Invalid branch or tag name').optional();

export const ingestSchema = z.object({
  body: z.object({
    url,
    ref,
    force: z.boolean().optional(),
  }),
});

export const askSchema = z.object({
  body: z.object({
    url,
    ref,
    question: z.string().trim().min(3, 'Ask a longer question').max(1000),
    // Continues an existing thread; omitted starts a new one.
    conversationId: z.string().uuid('Invalid conversation id').optional(),
  }),
});
