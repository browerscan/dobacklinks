#!/usr/bin/env tsx

/**
 * Test script for HMAC authentication
 * Run: tsx scripts/test-hmac.ts
 */

import { generateHMACSignature } from "../lib/security/hmac-auth";

const CRON_SECRET = process.env.CRON_SECRET || "test-secret-key";
const timestamp = Date.now();
const path = "/api/cron/enrich-sites";

const signature = generateHMACSignature(
  {
    method: "GET",
    path,
    timestamp,
  },
  CRON_SECRET,
);

console.log("\n=== HMAC Authentication Test ===");
console.log(`Timestamp: ${timestamp}`);
console.log(`Path: ${path}`);
console.log(`Signature: ${signature}`);
console.log("\nCurl command to test:");
console.log(`
curl -X GET http://localhost:3000${path} \\
  -H "Authorization: HMAC ${signature}" \\
  -H "X-Timestamp: ${timestamp}"
`);
console.log("\nNote: This signature will expire in 5 minutes.\n");
