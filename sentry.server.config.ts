import * as Sentry from "@sentry/nextjs";

/**
 * Sentry server-side configuration
 * Tracks server errors, API errors, and performance
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust sample rate for production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Ignore errors from these paths
  ignoreErrors: [
    // Database errors that we handle
    "ECONNREFUSED",
    "ENOTFOUND",
  ],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from request
    if (event.request) {
      // Remove authorization headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove sensitive query parameters
      if (event.request.query_string) {
        const queryParams = new URLSearchParams(event.request.query_string);
        queryParams.delete("token");
        queryParams.delete("apikey");
        queryParams.delete("api_key");
        event.request.query_string = queryParams.toString();
      }
    }

    // Remove environment variables from context
    if (event.contexts?.runtime?.env) {
      delete event.contexts.runtime.env;
    }

    return event;
  },

  // Tag all events with server/client
  initialScope: {
    tags: { runtime: "server" },
  },
});
