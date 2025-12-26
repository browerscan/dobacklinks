/**
 * API Route Wrapper
 *
 * Provides unified error handling, logging, and response formatting for API Routes.
 * Integrates with the error handler system for consistent error reporting.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import {
  reportError,
  reportMessage,
  classifyError,
  getErrorCode,
  getErrorStatusCode,
  getSafeErrorMessage,
  generateRequestId,
  createRequestContext,
  ConflictError,
  DatabaseError,
} from "./error-handler";
import { logger, startTimer } from "./logger";
import { getSession } from "./auth/server";

// Re-export error types for convenience
export { ConflictError, DatabaseError };

// ============================================================================
// Type Definitions
// ============================================================================

export interface ApiWrapperOptions {
  /**
   * Whether authentication is required
   */
  requireAuth?: boolean;

  /**
   * Whether admin role is required
   */
  requireAdmin?: boolean;

  /**
   * Rate limit configuration (optional)
   */
  rateLimit?: {
    prefix: string;
    maxRequests: number;
    window: `${number} ${"s" | "m" | "h" | "d"}`;
  };

  /**
   * Whether to log the request (default: true)
   */
  log?: boolean;

  /**
   * Whether to report errors to Sentry (default: true)
   */
  reportErrors?: boolean;

  /**
   * Custom error message for users (fallback)
   */
  errorMessage?: string;

  /**
   * Additional context to include in logs/error reports
   */
  context?: Record<string, unknown>;

  /**
   * CORS configuration (optional)
   */
  cors?: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  };

  /**
   * Maximum request body size (default: 1MB)
   */
  maxBodySize?: number;
}

export interface ApiHandler<T> {
  (
    request: NextRequest,
    context: {
      userId?: string;
      userRole?: string;
      requestId: string;
      body?: T;
    },
  ): Promise<NextResponse>;
}

export interface ValidatedApiHandler<TInput, TResult> {
  (
    input: TInput,
    request: NextRequest,
    context: {
      userId?: string;
      userRole?: string;
      requestId: string;
    },
  ): Promise<
    | {
        success: true;
        data: TResult;
      }
    | {
        success: false;
        error: string;
        code?: string;
      }
  >;
}

// ============================================================================
// Error Response Helpers
// ============================================================================>

/**
 * Create a standardized error response
 */
export function apiErrorResponse(
  error: unknown,
  options?: {
    statusCode?: number;
    message?: string;
    includeDetails?: boolean;
  },
): NextResponse {
  const appError = classifyError(error);
  const statusCode = options?.statusCode ?? getErrorStatusCode(appError);
  const message = options?.message ?? getSafeErrorMessage(appError);
  const includeDetails = options?.includeDetails ?? process.env.NODE_ENV === "development";

  const response = {
    success: false,
    error: message,
    code: getErrorCode(appError),
    ...(includeDetails && {
      internalMessage: appError.internalMessage,
      context: appError.context,
      stack: appError.stack,
    }),
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Create a standardized success response
 */
export function apiSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  meta?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status: statusCode },
  );
}

// ============================================================================
// Request Validation Helpers
// ============================================================================

/**
 * Validate JSON body with size limit
 */
export async function validateJsonBody<T>(
  request: NextRequest,
  schema?: z.ZodType<T>,
  maxSize: number = 1024 * 1024, // 1MB default
): Promise<
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      details?: z.typeToFlattenedError<T>;
    }
> {
  try {
    // Check content length header first
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return {
        success: false,
        error: `Request body too large. Maximum size is ${maxSize} bytes.`,
      };
    }

    const text = await request.text();

    // Verify actual size
    if (text.length > maxSize) {
      return {
        success: false,
        error: `Request body too large. Maximum size is ${maxSize} bytes.`,
      };
    }

    const json = JSON.parse(text) as T;

    // Validate with schema if provided
    if (schema) {
      const result = schema.safeParse(json);
      if (!result.success) {
        return {
          success: false,
          error: "Invalid request data",
          details: result.error.flatten(),
        };
      }
      return { success: true, data: result.data };
    }

    return { success: true, data: json };
  } catch (error) {
    return {
      success: false,
      error: "Invalid JSON in request body",
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T extends Record<string, unknown>>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T>,
):
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      details: z.typeToFlattenedError<T>;
    } {
  const params = Object.fromEntries(searchParams.entries());

  // Convert array params
  for (const [key, value] of searchParams.entries()) {
    if (params[key] !== value) {
      // Multiple values for same key
      (params as Record<string, unknown>)[key] = searchParams.getAll(key);
    }
  }

  const result = schema.safeParse(params);
  if (!result.success) {
    return {
      success: false,
      error: "Invalid query parameters",
      details: result.error.flatten(),
    };
  }

  return { success: true, data: result.data };
}

// ============================================================================
// CORS Headers
// ============================================================================

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(
  response: NextResponse,
  options?: ApiWrapperOptions["cors"],
): NextResponse {
  if (!options) return response;

  const corsConfig = {
    origin: options.origin ?? "*",
    methods: options.methods ?? ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    headers: options.headers ?? ["Content-Type", "Authorization"],
    credentials: options.credentials ?? false,
  };

  // Handle multiple origins
  const requestOrigin = response.headers.get("origin");
  const allowedOrigin: string = Array.isArray(corsConfig.origin)
    ? corsConfig.origin.includes(requestOrigin ?? "")
      ? (requestOrigin ?? "*")
      : corsConfig.origin[0]
    : corsConfig.origin === "*"
      ? "*"
      : (corsConfig.origin ?? "*");

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Methods", corsConfig.methods.join(", "));
  response.headers.set("Access-Control-Allow-Headers", corsConfig.headers.join(", "));
  response.headers.set("Access-Control-Allow-Credentials", String(corsConfig.credentials));

  return response;
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsPreflight(
  request: NextRequest,
  options?: ApiWrapperOptions["cors"],
): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(response, options);
}

// ============================================================================
// Main Wrapper Function
// ============================================================================

/**
 * Wrap an API route handler with unified error handling.
 *
 * @example
 * ```ts
 * export const GET = withApiHandler({
 *   requireAuth: true,
 *   log: true,
 * }, async (request, { userId, requestId }) => {
 *   // Your handler logic here
 *   return apiSuccessResponse({ data: result });
 * });
 * ```
 */
export function withApiHandler<T = undefined>(
  options: ApiWrapperOptions,
  handler: ApiHandler<T>,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const requestId = generateRequestId();
    const timer = startTimer();
    const shouldLog = options?.log !== false;
    const shouldReportErrors = options?.reportErrors !== false;

    // Handle CORS preflight
    if (request.method === "OPTIONS" && options?.cors) {
      return handleCorsPreflight(request, options.cors);
    }

    // Build context
    let requestContext = createRequestContext(request);

    // Check auth requirements
    if (options?.requireAuth || options?.requireAdmin) {
      try {
        const session = await getSession();
        if (!session?.user) {
          if (shouldLog) {
            logger.warn(`[API] Unauthorized access attempt`, {
              ...requestContext,
            });
          }
          return applyCorsHeaders(
            apiErrorResponse(new Error("Authentication required"), { statusCode: 401 }),
            options?.cors,
          );
        }

        // Check admin requirement
        if (options?.requireAdmin && session.user.role !== "admin") {
          if (shouldLog) {
            logger.warn(`[API] Forbidden access attempt (non-admin user)`, {
              ...requestContext,
              userId: session.user.id,
              userRole: session.user.role,
            });
          }
          return applyCorsHeaders(
            apiErrorResponse(new Error("Admin access required"), { statusCode: 403 }),
            options?.cors,
          );
        }

        // Add user context
        requestContext.userId = session.user.id ?? undefined;
        requestContext.userRole = session.user.role ?? undefined;
      } catch (error) {
        if (shouldLog) {
          logger.error(`[API] Auth check failed`, requestContext, error as Error);
        }
        return applyCorsHeaders(apiErrorResponse(error, { statusCode: 401 }), options?.cors);
      }
    }

    // Set Sentry user context
    if (requestContext.userId) {
      Sentry.setUser({
        id: requestContext.userId,
        role: requestContext.userRole,
      });
    }

    // Log request start
    if (shouldLog) {
      logger.info(`[API] ${request.method} ${requestContext.path} started`, {
        ...requestContext,
        ...options?.context,
      });
    }

    try {
      // Execute handler
      let response = await handler(request, {
        userId: requestContext.userId,
        userRole: requestContext.userRole,
        requestId,
      });

      // Apply CORS headers
      if (options?.cors) {
        response = applyCorsHeaders(response, options.cors);
      }

      // Add request ID header
      response.headers.set("x-request-id", requestId);

      // Log success
      if (shouldLog) {
        logger.info(`[API] ${request.method} ${requestContext.path} completed`, {
          ...requestContext,
          ...options?.context,
          status: response.status,
          durationMs: timer.elapsed(),
        });
      }

      return response;
    } catch (error) {
      const durationMs = timer.elapsed();
      const appError = classifyError(error);
      const statusCode = getErrorStatusCode(appError);

      // Build error context
      const errorContext = {
        ...requestContext,
        ...options?.context,
        durationMs,
        statusCode,
        errorCode: getErrorCode(appError),
      };

      // Report error
      if (shouldReportErrors && appError.shouldReportToSentry) {
        reportError(
          error,
          errorContext,
          requestContext.userId
            ? {
                id: requestContext.userId,
                role: requestContext.userRole,
              }
            : undefined,
        );
      } else if (shouldLog) {
        logger.error(
          `[API] ${request.method} ${requestContext.path} failed`,
          errorContext,
          error instanceof Error ? error : undefined,
        );
      }

      const errorResponse = apiErrorResponse(error, {
        statusCode,
        message: options?.errorMessage,
      });

      // Apply CORS headers
      return applyCorsHeaders(errorResponse, options?.cors);
    } finally {
      // Clear Sentry user context
      Sentry.setUser(null);
    }
  };
}

// ============================================================================
// Validated API Handler Wrapper
// ============================================================================

/**
 * Wrap an API route with Zod validation and unified error handling.
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * });
 *
 * export const POST = withValidatedApiHandler(
 *   schema,
 *   { requireAuth: true },
 *   async (input, request, { userId }) => {
 *     // input is typed and validated
 *     return { success: true, data: result };
 *   }
 * );
 * ```
 */
export function withValidatedApiHandler<TInput extends z.ZodType, TResult>(
  schema: TInput,
  options: ApiWrapperOptions,
  handler: ValidatedApiHandler<z.infer<TInput>, TResult>,
): (request: NextRequest) => Promise<NextResponse> {
  return withApiHandler(options, async (request, context) => {
    // Validate request body
    const validationResult = await validateJsonBody(request, schema, options?.maxBodySize);

    if (!validationResult.success) {
      reportMessage(`Validation failed for ${request.method} ${request.url}`, "warning", {
        requestId: context.requestId,
        errors: "details" in validationResult ? validationResult.details : undefined,
      });

      return apiErrorResponse(new Error(validationResult.error), {
        statusCode: 400,
        includeDetails: true,
      });
    }

    // Execute validated handler
    const result = await handler(validationResult.data, request, context);

    if (result.success) {
      return apiSuccessResponse(result.data);
    } else {
      return apiErrorResponse(new Error(result.error), { statusCode: 400 });
    }
  });
}

// ============================================================================
// Utility Wrappers for Common Patterns
// ============================================================================

/**
 * Wrap a GET handler (public, no auth)
 */
export function withGetHandler<T = undefined>(
  options: Omit<ApiWrapperOptions, "requireAuth" | "requireAdmin">,
  handler: ApiHandler<T>,
): (request: NextRequest) => Promise<NextResponse> {
  return withApiHandler({ ...options, requireAuth: false }, handler);
}

/**
 * Wrap a POST handler (authenticated by default)
 */
export function withPostHandler<T = undefined>(
  options: Omit<ApiWrapperOptions, "requireAuth">,
  handler: ApiHandler<T>,
): (request: NextRequest) => Promise<NextResponse> {
  return withApiHandler({ ...options, requireAuth: true }, handler);
}

/**
 * Wrap an admin-only handler
 */
export function withAdminApiHandler<T = undefined>(
  operation: string,
  handler: ApiHandler<T>,
): (request: NextRequest) => Promise<NextResponse> {
  return withApiHandler(
    {
      requireAuth: true,
      requireAdmin: true,
      log: true,
      context: { operation },
    },
    handler,
  );
}

// ============================================================================
// Common Error Response Helpers
// ============================================================================

/**
 * Return 400 Bad Request response
 */
export function badRequest(message: string = "Bad Request", code?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status: 400 },
  );
}

/**
 * Return 401 Unauthorized response
 */
export function unauthorized(message: string = "Unauthorized", code?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status: 401 },
  );
}

/**
 * Return 403 Forbidden response
 */
export function forbidden(message: string = "Forbidden", code?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status: 403 },
  );
}

/**
 * Return 404 Not Found response
 */
export function notFound(message: string = "Not Found", code?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status: 404 },
  );
}

/**
 * Return 429 Too Many Requests response
 */
export function rateLimited(retryAfter?: number, message?: string): NextResponse {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (retryAfter) {
    headers["Retry-After"] = String(retryAfter);
  }

  return NextResponse.json(
    {
      success: false,
      error: message ?? "Rate limit exceeded. Please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
    },
    { status: 429, headers },
  );
}

/**
 * Return 500 Internal Server Error response
 */
export function serverError(message: string = "Internal Server Error"): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}

/**
 * Return 503 Service Unavailable response
 */
export function serviceUnavailable(message: string = "Service Unavailable"): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "SERVICE_UNAVAILABLE",
    },
    { status: 503 },
  );
}
