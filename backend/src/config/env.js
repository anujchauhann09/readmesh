import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(1).optional(),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),

  GITHUB_PAT: z.string().optional(),

  GEMINI_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().default('readmesh'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const env = parsed.data;

export const config = Object.freeze({
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  isDev: env.NODE_ENV === 'development',
  server: {
    port: env.PORT,
    corsOrigin: env.CORS_ORIGIN,
  },
  db: {
    url: env.DATABASE_URL,
  },
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.ACCESS_TOKEN_TTL,
    refreshTtl: env.REFRESH_TOKEN_TTL,
  },
  oauth: {
    github: { clientId: env.GITHUB_OAUTH_CLIENT_ID, clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET },
    google: { clientId: env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET },
  },
  github: {
    pat: env.GITHUB_PAT,
  },
  ai: {
    geminiApiKey: env.GEMINI_API_KEY,
    pinecone: { apiKey: env.PINECONE_API_KEY, index: env.PINECONE_INDEX },
  },
});
