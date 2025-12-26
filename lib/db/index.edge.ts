/**
 * Edge-compatible database initialization
 *
 * Usage:
 * - In Cloudflare Workers: Pass Hyperdrive binding via context
 * - In Node.js: Uses DATABASE_URL directly
 *
 * Example (Cloudflare Workers middleware):
 * ```typescript
 * export const runtime = "edge";
 *
 * // In your API route or middleware:
 * import { createDatabaseEdge } from "@/lib/db/index.edge";
 * const db = createDatabaseEdge({
 *   connectionString: process.env.DATABASE_URL!,
 *   hyperdrive: context.cloudflare?.env?.HYPERDRIVE
 * });
 * ```
 */

import { createDatabaseEdge } from "./config.edge";

// Get connection string with validation
function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // In edge runtime without DATABASE_URL, throw a descriptive error
    // @ts-ignore - EdgeRuntime is a global in edge runtime
    if (typeof EdgeRuntime !== "undefined") {
      throw new Error(
        "DATABASE_URL is not set in Edge runtime. " +
          "Please configure it in your Cloudflare Pages environment variables.",
      );
    }

    // In development, provide helpful message
    console.warn(
      "⚠️ DATABASE_URL is not set. Database features will be disabled. " +
        "Set DATABASE_URL in .env.local for local development.",
    );

    // Return empty string to allow app to start (for pages without DB)
    return "";
  }

  return connectionString;
}

// Create default database connection (for Node.js runtime)
const connectionString = getConnectionString();

export const db = connectionString ? createDatabaseEdge({ connectionString }) : null;

export const isDatabaseEnabled = !!connectionString;

// Export factory function for Cloudflare Workers with Hyperdrive
export { createDatabaseEdge };

// Helper to get DB instance with Hyperdrive support
export function getDatabase(hyperdrive?: any) {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  return createDatabaseEdge({
    connectionString,
    hyperdrive,
  });
}
