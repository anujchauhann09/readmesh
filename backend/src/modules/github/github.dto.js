import { z } from 'zod';

export const repoUrlSchema = z.object({
  body: z.object({
    url: z.string().trim().min(1, 'A repository URL is required').max(500),
    ref: z.string().trim().min(1).max(255).optional(),
  }),
});

export const contentSchema = z.object({
  query: z.object({
    owner: z.string().trim().min(1),
    repo: z.string().trim().min(1),
    ref: z.string().trim().min(1),
    path: z.string().trim().min(1).max(1024),
  }),
});
