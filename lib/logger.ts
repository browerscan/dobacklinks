type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const SERVICE_NAME = "dobacklinks";

function formatLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error,
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: SERVICE_NAME,
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return entry;
}

function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  const entry = formatLogEntry(level, message, context, error);
  const output = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.debug(output);
      }
      break;
    default:
      console.log(output);
  }
}

/**
 * Structured logger for production-ready JSON logging.
 *
 * @example
 * logger.info("User logged in", { userId: "123", provider: "google" });
 * logger.error("Failed to process payment", { orderId: "456" }, error);
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext, error?: Error) =>
    log("error", message, context, error),
};

/**
 * Create a child logger with default context.
 * Useful for creating module-specific loggers.
 *
 * @example
 * const authLogger = createLogger({ module: "auth" });
 * authLogger.info("User logged in", { userId: "123" });
 * // Output: { ..., context: { module: "auth", userId: "123" } }
 */
export function createLogger(defaultContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) =>
      log("debug", message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) =>
      log("info", message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      log("warn", message, { ...defaultContext, ...context }),
    error: (message: string, context?: LogContext, error?: Error) =>
      log("error", message, { ...defaultContext, ...context }, error),
  };
}

/**
 * Performance timing helper for structured logs.
 *
 * @example
 * const timer = startTimer();
 * await expensiveOperation();
 * logger.info("Operation completed", { durationMs: timer.elapsed() });
 */
export function startTimer() {
  const start = Date.now();
  return {
    elapsed: () => Date.now() - start,
  };
}
