import { createDatabase } from "./config";

/**
 * Check if we're in build mode and should skip database connection
 */
const isBuildTime =
  process.env.SKIP_DB_VALIDATION === "true" ||
  process.env.CF_PAGES === "1" ||
  process.env.VERCEL_ENV === "preview";

const connectionString = process.env.DATABASE_URL;

// During build time, allow missing DATABASE_URL
if (!connectionString && !isBuildTime) {
  throw new Error("DATABASE_URL is not set");
}

// Only create database connection if we have a valid connection string
// During build, we'll use a placeholder connection that won't actually be used
export const db = createDatabase({
  connectionString: connectionString || "postgresql://localhost:5432/placeholder",
});

export const isDatabaseEnabled = !!connectionString && !isBuildTime;
