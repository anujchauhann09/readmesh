import { z } from 'zod';
import { ANALYTICS_EVENTS } from '@readmesh/shared';
import { isValidRepoName, isSafeRepoPath } from '../github/github.url.js';

export const recordEventSchema = z.object({
  body: z.object({
    type: z.enum(ANALYTICS_EVENTS),
    owner: z.string().trim().refine(isValidRepoName, 'Invalid owner').nullish(),
    name: z.string().trim().refine(isValidRepoName, 'Invalid repository name').nullish(),
    path: z.string().trim().refine(isSafeRepoPath, 'Invalid file path').nullish(),
  }),
});

export const summarySchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(365).default(30),
  }),
});
