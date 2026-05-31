import { z } from 'zod';
import { SUMMARY_LANGUAGE_CODES } from '@readmesh/shared';

const content = z.string().trim().min(1, 'Content is required').max(200_000);

export const tldrSchema = z.object({
  body: z.object({
    content,
    repoName: z.string().trim().max(200).optional(),
  }),
});

export const commandsSchema = z.object({
  body: z.object({ content }),
});

export const beginnerSchema = z.object({
  body: z.object({ content }),
});

export const translateSchema = z.object({
  body: z.object({
    content,
    language: z.enum(SUMMARY_LANGUAGE_CODES),
  }),
});
