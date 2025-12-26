import { Duration, Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.log("Redis is disabled: Required environment variables are not set");
}

interface RateLimitConfig {
  prefix: string;
  maxRequests: number;
  window: string; // eg: '10 s', '1 h', '1 d'
}

/**
 * Fallback behavior when Redis is unavailable
 *
 * SECURITY: The default fallback mode is MEMORY_FALLBACK to ensure
 * basic rate limiting protection even when Redis is unavailable.
 * Using ALLOW_ALL would completely disable rate limiting on Redis failure,
 * creating a critical security vulnerability.
 */
export enum RedisFallbackMode {
  /** Allow all requests (INSECURE - only for specific opt-in scenarios) */
  ALLOW_ALL = "allow_all",
  /** Block all requests (most secure - may impact availability) */
  BLOCK_ALL = "block_all",
  /** Use in-memory rate limiting as fallback (balanced approach - DEFAULT) */
  MEMORY_FALLBACK = "memory_fallback",
}

// In-memory fallback store (per-process, not distributed)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Get or create a rate limiter
 * @param config Rate limit configuration
 * @returns Ratelimit instance or null (if Redis is disabled)
 */
export function getRateLimiter(config: RateLimitConfig): Ratelimit | null {
  if (!redis) {
    return null;
  }

  const key = `${config.prefix}:${config.maxRequests}:${config.window}`;

  if (!limiters.has(key)) {
    const [amount, duration] = config.window.split(" ");
    let windowMs: number;

    switch (duration) {
      case "s":
        windowMs = parseInt(amount) * 1000;
        break;
      case "m":
        windowMs = parseInt(amount) * 60 * 1000;
        break;
      case "h":
        windowMs = parseInt(amount) * 60 * 60 * 1000;
        break;
      case "d":
        windowMs = parseInt(amount) * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Invalid duration: ${duration}. Use s, m, h, or d.`);
    }

    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.maxRequests, config.window as Duration),
      prefix: config.prefix,
    });

    limiters.set(key, limiter);
  }

  return limiters.get(key) || null;
}

/**
 * In-memory rate limiter fallback
 * WARNING: This is per-process only and not distributed across multiple server instances
 * Use only as a fallback when Redis is unavailable
 */
function checkMemoryRateLimit(identifier: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const [amount, duration] = config.window.split(" ");

  let windowMs: number;
  switch (duration) {
    case "s":
      windowMs = parseInt(amount) * 1000;
      break;
    case "m":
      windowMs = parseInt(amount) * 60 * 1000;
      break;
    case "h":
      windowMs = parseInt(amount) * 60 * 60 * 1000;
      break;
    case "d":
      windowMs = parseInt(amount) * 24 * 60 * 60 * 1000;
      break;
    default:
      throw new Error(`Invalid duration: ${duration}. Use s, m, h, or d.`);
  }

  const key = `${config.prefix}:${identifier}`;
  const record = memoryStore.get(key);

  // Clean up expired records
  if (record && now > record.resetTime) {
    memoryStore.delete(key);
  }

  const current = memoryStore.get(key);
  if (!current) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= config.maxRequests) {
    return false;
  }

  current.count += 1;
  return true;
}

/**
 * Check if the rate limit is exceeded
 * @param identifier Identifier (e.g. IP address)
 * @param config Rate limit configuration
 * @param fallbackMode Behavior when Redis is unavailable (default: MEMORY_FALLBACK)
 * @returns Whether the request is allowed
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  fallbackMode: RedisFallbackMode = RedisFallbackMode.MEMORY_FALLBACK,
): Promise<boolean> {
  const limiter = getRateLimiter(config);

  // Redis is available - use it
  if (limiter) {
    const { success } = await limiter.limit(identifier);
    return success;
  }

  // Redis is unavailable - use fallback strategy
  switch (fallbackMode) {
    case RedisFallbackMode.BLOCK_ALL:
      console.warn(`[RateLimit] Redis unavailable - blocking request to ${config.prefix}`);
      return false;

    case RedisFallbackMode.MEMORY_FALLBACK:
      console.warn(`[RateLimit] Redis unavailable - using in-memory fallback for ${config.prefix}`);
      return checkMemoryRateLimit(identifier, config);

    case RedisFallbackMode.ALLOW_ALL:
    default:
      // Legacy behavior - allow all requests when Redis is down
      return true;
  }
}

/**
 * Get client IP from Next.js headers (for server actions)
 */
export async function getClientIPFromHeaders(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIP = headersList.get("x-real-ip");
  const cfIP = headersList.get("cf-connecting-ip");

  if (cfIP) return cfIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

/**
 * Get client IP from Request object (for API routes)
 */
export function getClientIPFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfIP = request.headers.get("cf-connecting-ip");

  if (cfIP) return cfIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

export { redis };
