import { z } from 'zod';
import { THEMES } from '@readmesh/shared';

export const updateProfileSchema = z.object({
  body: z
    .object({
      displayName: z.string().trim().min(1).max(80).nullable().optional(),
      bio: z.string().trim().max(500).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' }),
});

export const updatePreferencesSchema = z.object({
  body: z
    .object({
      theme: z.enum(THEMES).optional(),
      locale: z.string().trim().min(2).max(10).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' }),
});
