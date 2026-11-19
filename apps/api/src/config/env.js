import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

dotenv.config({
  path: [
    fileURLToPath(new URL('../../.env', import.meta.url)),
    fileURLToPath(new URL('../../../../.env', import.meta.url))
  ]
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().startsWith('/').default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .default('postgres://postgres:postgres@localhost:5432/pathforge_dev'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
    .default('dev_super_secret_jwt_access_key_min_32_chars_pathforge'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  GITHUB_CLIENT_ID: z.string().default('dev_github_client_id'),
  GITHUB_CLIENT_SECRET: z.string().default('dev_github_client_secret'),
  GITHUB_CALLBACK_URL: z
    .string()
    .default('http://localhost:4000/api/v1/github/callback'),
  GITHUB_TOKEN_ENCRYPTION_KEY: z.coerce
    .string()
    .min(32)
    .default('0123456789abcdef0123456789abcdef'),
  UPLOAD_DIR: z.string().default('uploads'),
  SMTP_HOST: z.string().trim().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().max(65535).default(587),
  SMTP_SECURE: z
    .union([
      z.boolean(),
      z.enum(['true', 'false']).transform((value) => value === 'true')
    ])
    .default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('PathForge <noreply@pathforge.com>')
});

export function validateEnv(sourceEnv = process.env) {
  const result = envSchema.safeParse(sourceEnv);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formattedErrors}`);
  }

  return result.data;
}

export const env = validateEnv(process.env);
