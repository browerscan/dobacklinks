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
 * Check if we're in build mode and should skip strict validation
 * This covers Vercel (production/preview), Cloudflare Pages, and manual builds
 */
const isBuildTime =
  process.env.SKIP_DB_VALIDATION === "true" ||
  process.env.CF_PAGES === "1" ||
  process.env.VERCEL === "1" ||
  !!process.env.VERCEL_ENV;

/**
 * Generate a random build-time placeholder
 * Uses Node crypto.randomBytes (or WebCrypto getRandomValues) for better security than Math.random()
 */
function generateBuildTimePlaceholder(prefix: string, length: number): string {
  try {
    const nodeCrypto = require("crypto") as typeof import("crypto");
    if (typeof nodeCrypto.randomBytes === "function") {
      return `${prefix}-${nodeCrypto.randomBytes(length).toString("hex")}`;
    }
  } catch {
    // ignore and fall back
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return `${prefix}-${bytesToHex(bytes)}`;
  }

  // Fallback for environments where crypto is not available
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Parse and validate environment variables
 * @throws {ZodError} if validation fails (only in runtime, not during build)
 */
function parseEnv(): Env {
  // During build time, provide safe defaults for required fields
  if (isBuildTime) {
    const buildTimeEnv: Env = {
      // Required fields - use cryptographically random build-time placeholders
      DATABASE_URL:
        process.env.DATABASE_URL ||
        generateBuildTimePlaceholder("build-db-placeholder", 16),
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ||
        generateBuildTimePlaceholder("build-auth-secret", 32),
      CRON_SECRET:
        process.env.CRON_SECRET ||
        generateBuildTimePlaceholder("build-cron-secret", 32),

      // Optional fields - pass through if present
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      SIMILARWEB_API_URL: process.env.SIMILARWEB_API_URL,
      SIMILARWEB_API_KEY: process.env.SIMILARWEB_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
      R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
      CLOUDFLARE_BROWSER_RENDERING_URL:
        process.env.CLOUDFLARE_BROWSER_RENDERING_URL ||
        "https://api.cloudflare.com/client/v4",
      // Convert string to number for numeric fields
      SCREENSHOT_VIEWPORT_WIDTH: parseInt(
        process.env.SCREENSHOT_VIEWPORT_WIDTH || "1920",
        10,
      ),
      SCREENSHOT_VIEWPORT_HEIGHT: parseInt(
        process.env.SCREENSHOT_VIEWPORT_HEIGHT || "1080",
        10,
      ),
      SCREENSHOT_THUMBNAIL_WIDTH: parseInt(
        process.env.SCREENSHOT_THUMBNAIL_WIDTH || "400",
        10,
      ),
      SCREENSHOT_THUMBNAIL_HEIGHT: parseInt(
        process.env.SCREENSHOT_THUMBNAIL_HEIGHT || "300",
        10,
      ),
      SCREENSHOT_FORMAT:
        (process.env.SCREENSHOT_FORMAT as "webp" | "png" | "jpeg") || "webp",
      SCREENSHOT_QUALITY: parseInt(process.env.SCREENSHOT_QUALITY || "80", 10),
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
      SENTRY_ORG: process.env.SENTRY_ORG,
      SENTRY_PROJECT: process.env.SENTRY_PROJECT,
      NODE_ENV:
        (process.env.NODE_ENV as "development" | "production" | "test") ||
        "development",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

    console.log(
      "⚠️  Build mode detected - using placeholder environment variables",
    );
    return buildTimeEnv;
  }

  // Runtime: strict validation
  try {
    const parsedEnv = envSchema.parse(process.env);

    // Security check: Ensure we're not using build-time placeholders in production
    if (parsedEnv.NODE_ENV === "production") {
      const DANGER_PATTERNS = [
        "build-db-placeholder",
        "build-auth-secret",
        "build-cron-secret",
        "placeholder-min-32-chars",
        "cron-secret-placeholder",
      ];

      for (const pattern of DANGER_PATTERNS) {
        if (
          parsedEnv.DATABASE_URL?.includes(pattern) ||
          parsedEnv.BETTER_AUTH_SECRET?.includes(pattern) ||
          parsedEnv.CRON_SECRET?.includes(pattern)
        ) {
          throw new Error(
            `CRITICAL: Build-time placeholder detected in production environment variables. ` +
              `Pattern: ${pattern}. This is a security risk and must be fixed immediately.`,
          );
        }
      }
    }

    return parsedEnv;
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
 * Automatically validated on server startup (or uses build-time placeholders during build)
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
