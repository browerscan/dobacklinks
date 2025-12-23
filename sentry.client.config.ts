import * as Sentry from "@sentry/nextjs";

/**
 * Sentry client-side configuration
 * Tracks browser errors, performance, and user interactions
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rate for production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Ignore common errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "chrome-extension://",
    "moz-extension://",
    // Network errors
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    // CORS errors
    "CORS",
  ],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.Authorization;
      delete event.request.headers.Cookie;
    }

    // Filter out non-error events in development
    if (process.env.NODE_ENV === "development" && !hint.originalException) {
      return null;
    }

    return event;
  },

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
