import { z } from 'zod';
import { isValidRepoName, isSafeRef } from '../github/github.url.js';
import { paginationQuery } from '../../utils/pagination.js';

const repoName = z.string().trim().refine(isValidRepoName, 'Invalid repository owner or name');

export const saveRepoSchema = z.object({
  body: z.object({
    owner: repoName,
    name: repoName,
    ref: z.string().trim().refine(isSafeRef, 'Invalid branch or tag name').nullish(),
    // Denormalized display fields, so the dashboard renders without a GitHub call.
    description: z.string().trim().max(500).nullish(),
    stars: z.number().int().min(0).nullish(),
    language: z.string().trim().max(80).nullish(),
  }),
});

export const listSavedReposSchema = z.object({
  query: z.object(paginationQuery),
});

export const savedRepoIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid saved repository id') }),
});
