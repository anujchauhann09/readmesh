import { z } from 'zod';

const url = z.string().trim().min(1, 'A repository URL is required').max(500);
const ref = z.string().trim().min(1).max(255).optional();

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
  }),
});
