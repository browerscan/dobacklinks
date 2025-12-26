#!/usr/bin/env tsx

/**
 * Test script for /api/blogs endpoint
 *
 * Usage:
 *   pnpm tsx scripts/test-blog-api.ts
 *
 * Environment:
 *   CRON_SECRET - Required: HMAC secret key
 *   API_URL - Optional: API endpoint URL (default: http://localhost:3000)
 */

import crypto from "crypto";

// Configuration
const API_URL = process.env.API_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("❌ Error: CRON_SECRET environment variable is required");
  console.error(
    "💡 Set it in .env.local or run: CRON_SECRET=your_secret pnpm tsx scripts/test-blog-api.ts",
  );
  process.exit(1);
}

/**
 * Generate HMAC signature for API request
 */
function generateHMACSignature(
  method: string,
  path: string,
  timestamp: number,
  body: string,
  secret: string,
): string {
  const canonicalString = [method.toUpperCase(), path, timestamp.toString(), body].join("|");

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(canonicalString);
  return hmac.digest("hex");
}

/**
 * Create a blog post via API
 */
async function createBlogPost(postData: any) {
  const path = "/api/blogs";
  const url = `${API_URL}${path}`;
  const timestamp = Date.now();
  const body = JSON.stringify(postData);

  // Generate HMAC signature
  const signature = generateHMACSignature("POST", path, timestamp, body, CRON_SECRET!);

  console.log("🔐 Request details:");
  console.log(`   URL: ${url}`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Signature: ${signature.substring(0, 16)}...`);
  console.log("");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC ${signature}`,
        "X-Timestamp": timestamp.toString(),
      },
      body: body,
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Success!");
      console.log("   Response:", JSON.stringify(result, null, 2));
      return result;
    } else {
      console.error(`❌ Error: HTTP ${response.status}`);
      console.error("   Response:", JSON.stringify(result, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
    process.exit(1);
  }
}

/**
 * Main test
 */
async function main() {
  console.log("🚀 Testing /api/blogs endpoint\n");

  // Test data
  const testPost = {
    title: "Test Blog Post from API",
    slug: `test-api-post-${Date.now()}`,
    content: `# Test Blog Post

This is a test blog post created via the API endpoint.

## Features

- HMAC authentication
- Automatic system user creation
- Tag association support
- Path revalidation

**Created at:** ${new Date().toISOString()}
`,
    description: "A test blog post created via API for testing purposes",
    status: "published",
    visibility: "public",
    isPinned: false,
    featuredImageUrl: "",
    tags: [], // Add tag IDs here if needed
  };

  console.log("📝 Creating blog post:");
  console.log(`   Title: ${testPost.title}`);
  console.log(`   Slug: ${testPost.slug}`);
  console.log(`   Status: ${testPost.status}`);
  console.log("");

  const result = await createBlogPost(testPost);

  if (result.success && result.data) {
    console.log("");
    console.log("🎉 Blog post created successfully!");
    console.log(`   Post ID: ${result.data.postId}`);
    console.log(`   Slug: ${result.data.slug}`);
    console.log(`   View at: ${API_URL}/blogs/${result.data.slug}`);
  }
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
