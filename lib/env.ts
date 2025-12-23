/**
 * Environment variable validation using Zod
 * Validates all required environment variables at server startup
 */

import { z } from "zod";

/**
 * Environment variable schema
 * Add all required environment variables here
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1, "DATABASE_URL is required"),

  // Authentication
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url().optional(),

  // OAuth Providers (optional)
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // SimilarWeb API
  SIMILARWEB_API_URL: z.string().url().optional(),
  SIMILARWEB_API_KEY: z.string().optional(),

  // Cron/Scheduled Tasks
  CRON_SECRET: z
    .string()
    .min(32, "CRON_SECRET must be at least 32 characters for security"),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  // Cloudflare R2 Storage (optional)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional().or(z.literal("")),

  // Cloudflare Browser Rendering (for screenshots & SEO)
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_BROWSER_RENDERING_URL: z
    .string()
    .url()
    .optional()
    .default("https://api.cloudflare.com/client/v4"),

  // Screenshot Settings (optional with defaults)
  SCREENSHOT_VIEWPORT_WIDTH: z.coerce.number().optional().default(1920),
  SCREENSHOT_VIEWPORT_HEIGHT: z.coerce.number().optional().default(1080),
  SCREENSHOT_THUMBNAIL_WIDTH: z.coerce.number().optional().default(400),
  SCREENSHOT_THUMBNAIL_HEIGHT: z.coerce.number().optional().default(300),
  SCREENSHOT_FORMAT: z.enum(["webp", "png", "jpeg"]).optional().default("webp"),
  SCREENSHOT_QUALITY: z.coerce.number().min(1).max(100).optional().default(80),

  // Upstash Redis (optional for rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Sentry (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Next.js
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

/**
 * Validated environment variables
 * Use this instead of process.env for type safety
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * @throws {ZodError} if validation fails
 */
function parseEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment variable validation failed:");
      console.error(
        error.errors
          .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
          .join("\n"),
      );
      throw new Error(
        "Invalid environment variables. Please check your .env.local file.",
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Automatically validated on server startup
 */
export const env = parseEnv();

/**
 * Check if environment variables are valid
 * @returns True if all required variables are valid
 */
export function isEnvValid(): boolean {
  try {
    parseEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a safe subset of environment variables for client-side use
 * Only includes NEXT_PUBLIC_* variables
 */
export function getPublicEnv() {
  return {
    APP_URL: env.NEXT_PUBLIC_APP_URL,
    GOOGLE_CLIENT_ID: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    GITHUB_CLIENT_ID: env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
    SENTRY_DSN: env.NEXT_PUBLIC_SENTRY_DSN,
  };
}
