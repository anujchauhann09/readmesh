import { z } from 'zod';
import { isValidRepoName, isSafeRepoPath, isSafeRef } from './github.url.js';

/**
 * These values are interpolated into api.github.com / raw.githubusercontent.com
 * URLs, so they are validated against GitHub's own grammar rather than by length
 * alone — a `..` segment here would otherwise be normalized by the URL parser
 * into a request for a different repository.
 */
const repoName = z.string().trim().refine(isValidRepoName, 'Invalid repository owner or name');
const gitRef = z.string().trim().refine(isSafeRef, 'Invalid branch or tag name');
const repoPath = z.string().trim().refine(isSafeRepoPath, 'Invalid file path');

export const repoUrlSchema = z.object({
  body: z.object({
    url: z.string().trim().min(1, 'A repository URL is required').max(500),
    ref: gitRef.optional(),
  }),
});

export const contentSchema = z.object({
  query: z.object({
    owner: repoName,
    repo: repoName,
    ref: gitRef,
    path: repoPath,
  }),
});
