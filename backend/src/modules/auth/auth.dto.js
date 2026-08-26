import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('A valid email is required');
// bcrypt only considers the first 72 bytes, so anything longer is silently
// truncated rather than stronger — reject it instead of pretending.
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const registerSchema = z.object({
  body: z.object({
    email,
    password,
    displayName: z.string().trim().min(1).max(80).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().trim().min(1, 'A reset token is required').max(512),
    password,
  }),
});
