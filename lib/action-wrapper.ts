/**
 * Server Action Wrapper
 *
 * Provides unified error handling, logging, and response formatting for Server Actions.
 * Integrates with the error handler system for consistent error reporting.
 */

import { headers } from "next/headers";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { type ActionResult, actionResponse } from "./action-response";
import {
  reportError,
  reportMessage,
  classifyError,
  getErrorCode,
  getErrorStatusCode,
  getSafeErrorMessage,
  generateRequestId,
  type RequestContext,
} from "./error-handler";
import { logger, startTimer } from "./logger";
import { getSession } from "./auth/server";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ActionWrapperOptions {
  /**
   * Operation name for logging/tracking
   */
  operation: string;

  /**
   * Whether authentication is required
   */
  requireAuth?: boolean;

  /**
   * Whether admin role is required
   */
  requireAdmin?: boolean;

  /**
   * Rate limit configuration (optional, delegated to action implementation)
   */
  rateLimit?: {
    prefix: string;
    maxRequests: number;
    window: `${number} ${"s" | "m" | "h" | "d"}`;
  };

  /**
   * Whether to log the action (default: true)
   */
  log?: boolean;

  /**
   * Custom error message for users (fallback)
   */
  errorMessage?: string;

  /**
   * Whether to report errors to Sentry (default: true)
   */
  reportErrors?: boolean;

  /**
   * Additional context to include in logs/error reports
   */
  context?: Record<string, unknown>;
}

export interface ActionHandler<T> {
  (context: { userId?: string; userRole?: string; requestId: string }): Promise<T>;
}

export interface ValidatedActionHandler<TInput, TResult> {
  (
    input: TInput,
    context: {
      userId?: string;
      userRole?: string;
      requestId: string;
    },
  ): Promise<TResult>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract client IP from headers (for rate limiting context)
 */
async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    return (
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

/**
 * Extract user agent from headers
 */
async function getUserAgent(): Promise<string> {
  try {
    const headersList = await headers();
    return headersList.get("user-agent") || "unknown";
  } catch {
    return "unknown";
  }
}

// ============================================================================
// Main Wrapper Function
// ============================================================================

/**
 * Wrap a Server Action with unified error handling.
 *
 * @example
 * ```ts
 * export const myAction = withErrorHandling({
 *   operation: "createProduct",
 *   requireAuth: true,
 *   log: true,
 * }, async ({ userId, requestId }) => {
 *   // Your action logic here
 *   return { success: true, data: result };
 * });
 * ```
 */
export async function withErrorHandling<T>(
  options: ActionWrapperOptions,
  handler: ActionHandler<T>,
): Promise<ActionResult<T>> {
  const requestId = generateRequestId();
  const timer = startTimer();
  const shouldLog = options.log !== false;
  const shouldReportErrors = options.reportErrors !== false;

  // Build context for logging
  const baseContext: RequestContext = {
    requestId,
    operation: options.operation,
    ...options.context,
  };

  // Check auth requirements
  if (options.requireAuth || options.requireAdmin) {
    try {
      const session = await getSession();
      if (!session?.user) {
        if (shouldLog) {
          logger.warn(`[${options.operation}] Unauthorized access attempt`, {
            ...baseContext,
            clientIp: await getClientIp(),
          });
        }
        return actionResponse.unauthorized("Authentication required");
      }

      // Check admin requirement
      if (options.requireAdmin && session.user.role !== "admin") {
        if (shouldLog) {
          logger.warn(`[${options.operation}] Forbidden access attempt (non-admin user)`, {
            ...baseContext,
            userId: session.user.id,
            userRole: session.user.role,
            clientIp: await getClientIp(),
          });
        }
        return actionResponse.forbidden("Admin access required");
      }

      // Add user context
      baseContext.userId = session.user.id ?? undefined;
      baseContext.userRole = session.user.role ?? undefined;
    } catch (error) {
      if (shouldLog) {
        logger.error(`[${options.operation}] Auth check failed`, baseContext, error as Error);
      }
      return actionResponse.unauthorized("Authentication check failed");
    }
  }

  // Set Sentry user context
  if (baseContext.userId) {
    Sentry.setUser({
      id: baseContext.userId,
      role: baseContext.userRole,
    });
  }

  // Log action start
  if (shouldLog) {
    logger.info(`[${options.operation}] Started`, {
      ...baseContext,
      clientIp: await getClientIp(),
      userAgent: await getUserAgent(),
    });
  }

  try {
    // Execute handler
    const result = await handler({
      userId: baseContext.userId,
      userRole: baseContext.userRole,
      requestId,
    });

    // Log success
    if (shouldLog) {
      logger.info(`[${options.operation}] Completed successfully`, {
        ...baseContext,
        durationMs: timer.elapsed(),
      });
    }

    // Normalize ActionResult return type
    if (typeof result === "object" && result !== null && "success" in result) {
      return result as ActionResult<T>;
    }

    return actionResponse.success(result as T);
  } catch (error) {
    const durationMs = timer.elapsed();
    const appError = classifyError(error);

    // Build error context
    const errorContext = {
      ...baseContext,
      durationMs,
      clientIp: await getClientIp(),
      userAgent: await getUserAgent(),
    };

    // Report error
    if (shouldReportErrors && appError.shouldReportToSentry) {
      reportError(
        error,
        errorContext,
        baseContext.userId
          ? {
              id: baseContext.userId,
              role: baseContext.userRole,
            }
          : undefined,
      );
    } else if (shouldLog) {
      logger.error(
        `[${options.operation}] Failed`,
        {
          ...errorContext,
          errorCode: appError.code,
          statusCode: appError.statusCode,
        },
        error instanceof Error ? error : undefined,
      );
    }

    // Return appropriate ActionResult
    const statusCode = getErrorStatusCode(appError);

    switch (statusCode) {
      case 400:
        return actionResponse.badRequest(getSafeErrorMessage(appError), getErrorCode(appError));
      case 401:
        return actionResponse.unauthorized(getSafeErrorMessage(appError), getErrorCode(appError));
      case 403:
        return actionResponse.forbidden(getSafeErrorMessage(appError), getErrorCode(appError));
      case 404:
        return actionResponse.notFound(getSafeErrorMessage(appError), getErrorCode(appError));
      case 409:
        return actionResponse.conflict(getSafeErrorMessage(appError), getErrorCode(appError));
      default:
        return actionResponse.error(
          options.errorMessage || getSafeErrorMessage(appError),
          getErrorCode(appError),
        );
    }
  } finally {
    // Clear Sentry user context
    Sentry.setUser(null);
  }
}

// ============================================================================
// Validated Action Wrapper
// ============================================================================>

/**
 * Wrap a Server Action with Zod validation and unified error handling.
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * });
 *
 * export const createAction = withValidatedAction(
 *   schema,
 *   {
 *     operation: "createUser",
 *     requireAuth: true,
 *   },
 *   async (input, { userId, requestId }) => {
 *     // input is typed and validated
 *     return { success: true, data: result };
 *   }
 * );
 * ```
 */
export function withValidatedAction<TInput extends z.ZodType, TResult>(
  schema: TInput,
  options: ActionWrapperOptions,
  handler: ValidatedActionHandler<z.infer<TInput>, TResult>,
): (input: unknown) => Promise<ActionResult<TResult>> {
  return async (input: unknown) => {
    const requestId = generateRequestId();
    const timer = startTimer();
    const shouldLog = options.log !== false;

    // Validate input
    const validationResult = schema.safeParse(input);
    if (!validationResult.success) {
      if (shouldLog) {
        logger.warn(`[${options.operation}] Validation failed`, {
          requestId,
          operation: options.operation,
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      // Report validation failures as messages (not exceptions)
      reportMessage(`Validation failed for ${options.operation}`, "warning", {
        operation: options.operation,
        requestId,
        errors: validationResult.error.flatten().fieldErrors,
      });

      return actionResponse.badRequest("Invalid input data", "VALIDATION_ERROR");
    }

    // Proceed with normal error handling wrapper
    return withErrorHandling<TResult>(
      {
        ...options,
        context: {
          ...options.context,
          validatedInput: true,
        },
      },
      async (context) => handler(validationResult.data, context),
    );
  };
}

// ============================================================================
// Utility Wrappers for Common Patterns
// ============================================================================

/**
 * Wrap an admin-only action
 */
export async function withAdminAction<T>(
  operation: string,
  handler: ActionHandler<T>,
): Promise<ActionResult<T>> {
  return withErrorHandling(
    {
      operation,
      requireAuth: true,
      requireAdmin: true,
    },
    handler,
  );
}

/**
 * Wrap an authenticated user action
 */
export async function withAuthAction<T>(
  operation: string,
  handler: ActionHandler<T>,
): Promise<ActionResult<T>> {
  return withErrorHandling(
    {
      operation,
      requireAuth: true,
    },
    handler,
  );
}

/**
 * Wrap a public action (no auth required)
 */
export async function withPublicAction<T>(
  operation: string,
  handler: ActionHandler<T>,
): Promise<ActionResult<T>> {
  return withErrorHandling(
    {
      operation,
      requireAuth: false,
    },
    handler,
  );
}

// ============================================================================
// Error Recovery Utilities
// ============================================================================

/**
 * Wrap an action with retry logic for transient errors
 */
export async function withRetry<T>(
  options: ActionWrapperOptions & {
    maxRetries?: number;
    retryDelay?: number; // milliseconds
    retryableErrors?: string[]; // Error codes that are retryable
  },
  handler: ActionHandler<T>,
): Promise<ActionResult<T>> {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelay = options.retryDelay ?? 1000;
  const retryableCodes = options.retryableErrors ?? [
    "DATABASE_CONNECTION_FAILED",
    "DATABASE_TIMEOUT",
    "EXTERNAL_API_TIMEOUT",
    "EXTERNAL_API_UNAVAILABLE",
  ];

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await withErrorHandling(
      {
        ...options,
        context: {
          ...options.context,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
        },
      },
      handler,
    );

    // If successful or error is not retryable, return immediately
    if (result.success) {
      return result;
    }

    const errorCode = result.customCode;
    if (!errorCode || !retryableCodes.includes(errorCode)) {
      return result;
    }

    lastError = result.error;

    // Wait before retry (except on last attempt)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  // All retries exhausted
  return actionResponse.error(
    `Operation failed after ${maxRetries + 1} attempts`,
    "RETRY_EXHAUSTED",
  );
}

// ============================================================================
// Batch Processing Support
// ============================================================================>

/**
 * Process a batch of items with individual error handling.
 * Returns results with individual success/failure status.
 */
export interface BatchResult<T> {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    success: boolean;
    data?: T;
    error?: string;
    index: number;
  }>;
}

export async function processBatch<TItem, TResult>(
  items: TItem[],
  operation: string,
  processor: (item: TItem, index: number) => Promise<TResult>,
  options?: {
    log?: boolean;
    continueOnError?: boolean;
    concurrency?: number;
  },
): Promise<ActionResult<BatchResult<TResult>>> {
  const shouldLog = options?.log !== false;
  const continueOnError = options?.continueOnError ?? true;
  const concurrency = options?.concurrency ?? 10;
  const requestId = generateRequestId();

  if (shouldLog) {
    logger.info(`[${operation}] Batch processing started`, {
      requestId,
      operation,
      totalItems: items.length,
      concurrency,
    });
  }

  const timer = startTimer();
  const results: BatchResult<TResult>["results"] = [];
  let successful = 0;
  let failed = 0;

  // Process in batches with concurrency limit
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map(async (item, batchIndex) => {
      const index = i + batchIndex;
      try {
        const data = await processor(item, index);
        return { success: true, data, index };
      } catch (error) {
        const message = getSafeErrorMessage(error);
        if (!continueOnError) {
          throw error;
        }
        return { success: false, error: message, index };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Update counters
    for (const result of batchResults) {
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }
  }

  const finalResult: BatchResult<TResult> = {
    total: items.length,
    successful,
    failed,
    results,
  };

  if (shouldLog) {
    logger.info(`[${operation}] Batch processing completed`, {
      requestId,
      operation,
      total: items.length,
      successful,
      failed,
      durationMs: timer.elapsed(),
    });
  }

  return actionResponse.success(finalResult);
}
