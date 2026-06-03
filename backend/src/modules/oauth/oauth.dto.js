import { z } from 'zod';
import { OAUTH_PROVIDERS } from '@readmesh/shared';

const provider = z.enum(OAUTH_PROVIDERS);

export const startSchema = z.object({
  params: z.object({ provider }),
});

export const callbackSchema = z.object({
  params: z.object({ provider }),
  body: z.object({
    code: z.string().min(1, 'Missing authorization code'),
    state: z.string().min(1, 'Missing state'),
  }),
});
