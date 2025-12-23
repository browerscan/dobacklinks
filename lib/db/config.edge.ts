/**
 * Edge-compatible database configuration for Cloudflare Workers
 *
 * Strategy:
 * - Local dev: Direct TCP connection via postgres-js
 * - Cloudflare Workers: Hyperdrive binding (TCP proxy)
 * - Fallback: Neon HTTP driver (if Hyperdrive not available)
 */

import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import * as schema from "./schema";

interface DBConfig {
  connectionString: string;
  hyperdrive?: any; // Cloudflare Hyperdrive binding
  maxConnections?: number;
  debug?: boolean;
}

// Detect runtime environment
function detectRuntime() {
  // @ts-ignore - Cloudflare Workers global
  if (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers") {
    return "cloudflare-workers";
  }
  if (process.env.VERCEL_ENV) return "vercel";
  if (process.env.NETLIFY) return "netlify";
  return "nodejs";
}

// Create Edge-compatible database connection
export function createDatabaseEdge(config: DBConfig) {
  const runtime = detectRuntime();

  // Cloudflare Workers with Hyperdrive
  if (runtime === "cloudflare-workers" && config.hyperdrive) {
    console.log("🚀 Using Cloudflare Hyperdrive");

    // Import postgres-js dynamically
    const postgres = require("postgres");
    const client = postgres(config.hyperdrive.connectionString, {
      max: 1,
      prepare: false,
      idle_timeout: 0,
      connect_timeout: 10,
    });

    return drizzlePg(client, { schema });
  }

  // Cloudflare Workers without Hyperdrive - use Neon HTTP
  if (runtime === "cloudflare-workers") {
    console.warn("⚠️ Hyperdrive not configured, using Neon HTTP (requires Neon database)");

    // Check if using Neon
    if (!config.connectionString.includes("neon")) {
      throw new Error(
        "Cloudflare Workers requires either Hyperdrive binding or Neon database. " +
        "Please configure Hyperdrive in wrangler.toml or migrate to Neon."
      );
    }

    // Use Neon HTTP driver
    const { neon } = require("@neondatabase/serverless");
    const sql = neon(config.connectionString);
    return drizzleHttp(sql, { schema });
  }

  // Node.js environments - use standard postgres-js
  console.log("🚀 Using postgres-js (TCP connection)");
  const postgres = require("postgres");

  const platformConfig = runtime === "nodejs" ? {
    max: config.maxConnections || 30,
    prepare: true,
    idle_timeout: 600,
    connect_timeout: 30,
  } : {
    max: 1,
    prepare: false,
    idle_timeout: 0,
    connect_timeout: 10,
  };

  const client = postgres(config.connectionString, {
    ...platformConfig,
    ssl: config.connectionString.includes("supabase") ||
         config.connectionString.includes("neon") ? "require" : false,
    debug: config.debug ?? process.env.NODE_ENV === "development",
  });

  return drizzlePg(client, { schema });
}

// Export for backward compatibility
export { createDatabaseEdge as createDatabase };
