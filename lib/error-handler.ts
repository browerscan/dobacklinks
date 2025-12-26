/**
 * Unified Error Handling System
 *
 * Provides custom error classes, error classification, and centralized error handling
 * for Server Actions and API Routes with Sentry integration.
 */

import * as Sentry from "@sentry/nextjs";
import { logger } from "./logger";
import { getErrorMessage } from "./error-utils";
import type { ActionResult } from "./action-response";

// ============================================================================
// Error Code Registry
// ============================================================================

/**
 * Standard error codes for consistent error handling across the application.
 * Format: <SERVICE>_<ERROR_TYPE>_<SPECIFIC_REASON>
 */
export const ErrorCode = {
  // Authentication & Authorization (4xx)
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",
  AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
  AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",

  // Validation (4xx)
  VALIDATION_INVALID_INPUT: "VALIDATION_INVALID_INPUT",
  VALIDATION_MISSING_FIELD: "VALIDATION_MISSING_FIELD",
  VALIDATION_INVALID_FORMAT: "VALIDATION_INVALID_FORMAT",
  VALIDATION_DUPLICATE: "VALIDATION_DUPLICATE",

  // Resource Not Found (4xx)
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_DELETED: "RESOURCE_DELETED",
  RESOURCE_EXPIRED: "RESOURCE_EXPIRED",

  // Rate Limiting (4xx)
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  RATE_LIMIT_RETRY_AFTER: "RATE_LIMIT_RETRY_AFTER",

  // Database Errors (5xx)
  DATABASE_CONNECTION_FAILED: "DATABASE_CONNECTION_FAILED",
  DATABASE_QUERY_FAILED: "DATABASE_QUERY_FAILED",
  DATABASE_CONSTRAINT: "DATABASE_CONSTRAINT",
  DATABASE_TIMEOUT: "DATABASE_TIMEOUT",

  // External API Errors (5xx)
  EXTERNAL_API_TIMEOUT: "EXTERNAL_API_TIMEOUT",
  EXTERNAL_API_UNAVAILABLE: "EXTERNAL_API_UNAVAILABLE",
  EXTERNAL_API_INVALID_RESPONSE: "EXTERNAL_API_INVALID_RESPONSE",

  // File/Storage Errors (5xx)
  STORAGE_UPLOAD_FAILED: "STORAGE_UPLOAD_FAILED",
  STORAGE_FILE_NOT_FOUND: "STORAGE_FILE_NOT_FOUND",
  STORAGE_QUOTA_EXCEEDED: "STORAGE_QUOTA_EXCEEDED",

  // Email/Notification Errors (5xx)
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  NOTIFICATION_FAILED: "NOTIFICATION_FAILED",

  // Business Logic Errors (4xx/5xx)
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
  FEATURE_NOT_AVAILABLE: "FEATURE_NOT_AVAILABLE",

  // Generic Errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ============================================================================
// Error Severity Levels
// ============================================================================

export const ErrorSeverity = {
  LOW: "low", // Non-critical, user can continue
  MEDIUM: "medium", // Feature broken, but app usable
  HIGH: "high", // Major functionality impacted
  CRITICAL: "critical", // App-wide issue, needs immediate attention
} as const;

export type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Base application error class.
 * All custom errors should extend this class.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly severity: ErrorSeverity;
  readonly context?: Record<string, unknown>;
  readonly userMessage: string;
  readonly internalMessage: string;
  readonly shouldReportToSentry: boolean;

  constructor(config: {
    code: ErrorCode;
    statusCode: number;
    userMessage: string;
    internalMessage?: string;
    severity?: ErrorSeverity;
    context?: Record<string, unknown>;
    cause?: Error | unknown;
    shouldReportToSentry?: boolean;
  }) {
    super(config.internalMessage || config.userMessage, {
      cause: config.cause,
    });

    this.name = this.constructor.name;
    this.code = config.code;
    this.statusCode = config.statusCode;
    this.severity = config.severity ?? ErrorSeverity.MEDIUM;
    this.context = config.context;
    this.userMessage = config.userMessage;
    this.internalMessage = config.internalMessage || config.userMessage;
    this.shouldReportToSentry = config.shouldReportToSentry ?? this.statusCode >= 500;

    // Maintains proper stack trace for V8
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Convert error to ActionResult for Server Actions
   */
  toActionResult<T>(): ActionResult<T> {
    return {
      success: false,
      error: this.userMessage,
      customCode: this.code,
    };
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      error: this.userMessage,
      code: this.code,
      statusCode: this.statusCode,
      ...(process.env.NODE_ENV === "development" && {
        context: this.context,
        internalMessage: this.internalMessage,
      }),
    };
  }
}

/**
 * Validation error (400 Bad Request)
 * Use when user input is invalid or missing required fields
 */
export class ValidationError extends AppError {
  constructor(
    userMessage: string = "Invalid input provided",
    context?: Record<string, unknown>,
    cause?: Error,
  ) {
    super({
      code: ErrorCode.VALIDATION_INVALID_INPUT,
      statusCode: 400,
      userMessage,
      internalMessage: `Validation failed: ${userMessage}`,
      severity: ErrorSeverity.LOW,
      context,
      cause,
      shouldReportToSentry: false,
    });
  }
}

/**
 * Authentication error (401 Unauthorized)
 * Use when user is not authenticated or session is invalid
 */
export class UnauthorizedError extends AppError {
  constructor(
    userMessage: string = "Authentication required",
    context?: Record<string, unknown>,
    cause?: Error,
  ) {
    super({
      code: ErrorCode.AUTH_UNAUTHORIZED,
      statusCode: 401,
      userMessage,
      internalMessage: `Unauthorized access attempt: ${userMessage}`,
      severity: ErrorSeverity.LOW,
      context,
      cause,
      shouldReportToSentry: false,
    });
  }
}

/**
 * Authorization error (403 Forbidden)
 * Use when user is authenticated but lacks permission
 */
export class ForbiddenError extends AppError {
  constructor(
    userMessage: string = "You don't have permission to perform this action",
    context?: Record<string, unknown>,
    cause?: Error,
  ) {
    super({
      code: ErrorCode.AUTH_FORBIDDEN,
      statusCode: 403,
      userMessage,
      internalMessage: `Forbidden access attempt: ${userMessage}`,
      severity: ErrorSeverity.MEDIUM,
      context,
      cause,
      shouldReportToSentry: true,
    });
  }
}

/**
 * Not found error (404 Not Found)
 * Use when requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string = "Resource",
    identifier?: string,
    context?: Record<string, unknown>,
  ) {
    const userMessage = identifier
      ? `${resource} "${identifier}" not found`
      : `${resource} not found`;

    super({
      code: ErrorCode.RESOURCE_NOT_FOUND,
      statusCode: 404,
      userMessage,
      internalMessage: `Resource not found: ${resource}${identifier ? ` (${identifier})` : ""}`,
      severity: ErrorSeverity.LOW,
      context: { resource, identifier, ...context },
      shouldReportToSentry: false,
    });
  }
}

/**
 * Conflict error (409 Conflict)
 * Use when request conflicts with current state (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(
    userMessage: string = "This action conflicts with existing data",
    context?: Record<string, unknown>,
    cause?: Error,
  ) {
    super({
      code: ErrorCode.VALIDATION_DUPLICATE,
      statusCode: 409,
      userMessage,
      internalMessage: `Conflict: ${userMessage}`,
      severity: ErrorSeverity.LOW,
      context,
      cause,
      shouldReportToSentry: false,
    });
  }
}

/**
 * Rate limit error (429 Too Many Requests)
 * Use when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(
    retryAfter?: number, // seconds
    context?: Record<string, unknown>,
  ) {
    const userMessage = retryAfter
      ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
      : "Rate limit exceeded. Please try again later.";

    super({
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
      userMessage,
      internalMessage: `Rate limit exceeded${retryAfter ? ` (retry after ${retryAfter}s)` : ""}`,
      severity: ErrorSeverity.LOW,
      context: { retryAfter, ...context },
      shouldReportToSentry: false,
    });
  }
}

/**
 * Database error (500 Internal Server Error)
 * Use for database-related failures
 */
export class DatabaseError extends AppError {
  constructor(
    userMessage: string = "A database error occurred. Please try again.",
    operation?: string,
    cause?: Error,
    context?: Record<string, unknown>,
  ) {
    super({
      code: ErrorCode.DATABASE_QUERY_FAILED,
      statusCode: 500,
      userMessage,
      internalMessage: operation
        ? `Database operation failed: ${operation}`
        : "Database operation failed",
      severity: ErrorSeverity.HIGH,
      context: { operation, ...context },
      cause,
      shouldReportToSentry: true,
    });
  }
}

/**
 * External API error (502/503/504)
 * Use for failures in external service integrations
 */
export class ExternalApiError extends AppError {
  constructor(
    serviceName: string,
    userMessage?: string,
    cause?: Error,
    context?: Record<string, unknown>,
  ) {
    super({
      code: ErrorCode.EXTERNAL_API_UNAVAILABLE,
      statusCode: 503,
      userMessage: userMessage ?? `External service "${serviceName}" is temporarily unavailable`,
      internalMessage: `External API failure: ${serviceName}`,
      severity: ErrorSeverity.MEDIUM,
      context: { serviceName, ...context },
      cause,
      shouldReportToSentry: true,
    });
  }
}

/**
 * File/Storage error (500/503)
 * Use for upload/download failures
 */
export class StorageError extends AppError {
  constructor(
    userMessage: string = "File operation failed. Please try again.",
    operation?: "upload" | "download" | "delete",
    cause?: Error,
    context?: Record<string, unknown>,
  ) {
    super({
      code: ErrorCode.STORAGE_UPLOAD_FAILED,
      statusCode: 500,
      userMessage,
      internalMessage: `Storage operation failed: ${operation || "unknown"}`,
      severity: ErrorSeverity.MEDIUM,
      context: { operation, ...context },
      cause,
      shouldReportToSentry: true,
    });
  }
}

// ============================================================================
// Error Classification Utilities
// ============================================================================

/**
 * Check if an error is an instance of AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if an error is a specific error type
 */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return isAppError(error) && error.code === code;
}

/**
 * Classify an unknown error into an AppError
 */
export function classifyError(error: unknown): AppError {
  // Already an AppError - return as-is
  if (isAppError(error)) {
    return error;
  }

  const message = getErrorMessage(error);

  // Database-related errors
  if (
    message.includes("database") ||
    message.includes("connection") ||
    message.includes("ECONNREFUSED")
  ) {
    return new DatabaseError(
      "Database connection failed. Please try again.",
      "connection",
      error as Error,
    );
  }

  // Network/external API errors
  if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
    return new ExternalApiError(
      "External Service",
      "Request timed out. Please try again.",
      error as Error,
    );
  }

  if (message.includes("ENOTFOUND") || message.includes("fetch failed")) {
    return new ExternalApiError(
      "External Service",
      "Service unavailable. Please try again.",
      error as Error,
    );
  }

  // Permission/authorization errors
  if (message.toLowerCase().includes("permission") || message.toLowerCase().includes("forbidden")) {
    return new ForbiddenError(
      "You don't have permission to perform this action",
      undefined,
      error as Error,
    );
  }

  // Not found errors
  if (message.toLowerCase().includes("not found")) {
    return new NotFoundError("Resource");
  }

  // Duplicate/constraint errors
  if (
    message.includes("duplicate") ||
    message.includes("unique constraint") ||
    message.includes("23505")
  ) {
    return new ConflictError("This entry already exists", undefined, error as Error);
  }

  // Default: internal server error
  return new AppError({
    code: ErrorCode.INTERNAL_ERROR,
    statusCode: 500,
    userMessage: "An unexpected error occurred. Please try again.",
    internalMessage: `Unhandled error: ${message}`,
    severity: ErrorSeverity.HIGH,
    cause: error,
    shouldReportToSentry: true,
  });
}

/**
 * Extract error code from unknown error
 */
export function getErrorCode(error: unknown): ErrorCode {
  if (isAppError(error)) {
    return error.code;
  }
  return ErrorCode.UNKNOWN_ERROR;
}

/**
 * Extract status code from unknown error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

// ============================================================================
// Error Reporting & Logging
// ============================================================================

/**
 * Report error to Sentry with context
 */
export function reportError(
  error: Error | AppError | unknown,
  context?: Record<string, unknown>,
  user?: { id: string; email?: string; role?: string },
): void {
  const appError = error instanceof AppError ? error : classifyError(error);

  // Skip reporting for low-severity errors and client errors (4xx)
  if (isAppError(error) && !error.shouldReportToSentry) {
    // Still log locally for debugging
    logger.warn(`[${error.code}] ${error.userMessage}`, {
      ...context,
      severity: error.severity,
    });
    return;
  }

  // Log locally
  logger.error(
    `[${appError.code}] ${appError.internalMessage}`,
    {
      ...context,
      severity: appError.severity,
      statusCode: appError.statusCode,
    },
    error instanceof Error ? error : undefined,
  );

  // Report to Sentry
  Sentry.captureException(appError, {
    user: user ? { id: user.id, email: user.email, role: user.role } : undefined,
    extra: {
      errorCode: appError.code,
      statusCode: appError.statusCode,
      severity: appError.severity,
      ...context,
    },
    tags: {
      errorCode: appError.code,
      errorType: appError.constructor.name,
      severity: appError.severity,
    },
  });
}

/**
 * Report message to Sentry (for non-error events)
 */
export function reportMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, unknown>,
): void {
  const logLevel = level === "fatal" ? "error" : level;
  // @ts-expect-error - logger methods exist for all valid Sentry severity levels
  logger[logLevel](`[Sentry] ${message}`, context);

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

// ============================================================================
// Safe Error Parsing (no data leakage)
// ============================================================================>

/**
 * Sensitive patterns that should not appear in user-facing error messages
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /credentials/i,
  /private[_-]?key/i,
  /database/i,
  /connection/i,
  /host/i,
  /port/i,
  /@.*\.(com|io|net|org)/gi, // Email-like patterns
  /bearer\s+[a-z0-9\-._~+/]+=*/i, // Bearer tokens
  /sk-[a-z0-9]{32,}/i, // API keys
  /\b[a-f0-9]{32,}\b/gi, // Long hex strings (likely secrets)
];

/**
 * Sanitize error message for user display
 * Removes sensitive information that might be in error messages
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;

  // Replace sensitive patterns with generic text
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      if (match.includes("@") && match.includes(".")) {
        return "[REDACTED_EMAIL]";
      }
      if (match.includes("sk-") || match.includes("Bearer")) {
        return "[REDACTED_TOKEN]";
      }
      return "[REDACTED]";
    });
  }

  return sanitized;
}

/**
 * Get safe error message for user response
 */
export function getSafeErrorMessage(error: unknown): string {
  const appError = classifyError(error);
  return sanitizeErrorMessage(appError.userMessage);
}

// ============================================================================
// Request Context for Error Tracking
// ============================================================================

/**
 * Extract request context for error reporting
 */
export interface RequestContext {
  requestId?: string;
  userId?: string;
  userRole?: string;
  clientIp?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Create request context object
 */
export function createRequestContext(
  request: Request,
  session?: { user?: { id: string; email?: string; role?: string } },
): RequestContext {
  const url = new URL(request.url);
  const requestId = generateRequestId();

  return {
    requestId,
    path: url.pathname,
    method: request.method,
    query: url.search,
    userId: session?.user?.id,
    userRole: session?.user?.role,
    userAgent: request.headers.get("user-agent") || undefined,
    // Don't log client IP in production for privacy
    ...(process.env.NODE_ENV === "development" && {
      clientIp: request.headers.get("x-forwarded-for") || undefined,
    }),
  };
}
