#!/usr/bin/env tsx

/**
 * Publish blog posts to dobacklinks.com via API
 *
 * Usage:
 *   pnpm tsx scripts/publish-blog-posts.ts
 *
 * Environment:
 *   CRON_SECRET - Required: HMAC secret key
 *   API_URL - Optional: API endpoint URL (default: http://localhost:3000)
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

// Configuration
const API_URL = process.env.API_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("❌ Error: CRON_SECRET environment variable is required");
  console.error(
    "💡 Set it in .env.local or run: CRON_SECRET=your_secret pnpm tsx scripts/publish-blog-posts.ts",
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
  const canonicalString = [
    method.toUpperCase(),
    path,
    timestamp.toString(),
    body,
  ].join("|");

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(canonicalString);
  return hmac.digest("hex");
}

/**
 * Create a blog post via API
 */
async function createBlogPost(postData: any) {
  const apiPath = "/api/blogs";
  const url = `${API_URL}${apiPath}`;
  const timestamp = Date.now();
  const body = JSON.stringify(postData);

  // Generate HMAC signature
  const signature = generateHMACSignature(
    "POST",
    apiPath,
    timestamp,
    body,
    CRON_SECRET!,
  );

  console.log(`   🔐 Authenticating with HMAC...`);

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
      console.log(`   ✅ Published successfully!`);
      console.log(`   📝 Post ID: ${result.data.postId}`);
      console.log(`   🔗 URL: ${API_URL}/blogs/${result.data.slug}`);
      return result;
    } else {
      console.error(`   ❌ Error: HTTP ${response.status}`);
      console.error(`   Response:`, JSON.stringify(result, null, 2));
      throw new Error(
        `Failed to publish: ${result.error || response.statusText}`,
      );
    }
  } catch (error) {
    console.error(`   ❌ Request failed:`, error);
    throw error;
  }
}

/**
 * Extract title from markdown file
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : "Untitled Post";
}

/**
 * Extract description from markdown (first paragraph after title)
 */
function extractDescription(content: string): string {
  const lines = content.split("\n");
  let foundTitle = false;

  for (const line of lines) {
    if (line.startsWith("#")) {
      foundTitle = true;
      continue;
    }

    if (foundTitle && line.trim() && !line.startsWith("#")) {
      return line.trim().substring(0, 160);
    }
  }

  return "High-quality guest posting insights and strategies.";
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

/**
 * Blog posts to publish
 */
const blogPosts = [
  {
    file: "blog-draft-dr70-guide.md",
    status: "published" as const,
    isPinned: false,
  },
  {
    file: "case-study-google-news-guest-posts.md",
    status: "published" as const,
    isPinned: false,
  },
  {
    file: "content/blog/reverse-engineering-quality-score.md",
    status: "published" as const,
    isPinned: false,
  },
];

/**
 * Main function
 */
async function main() {
  console.log("🚀 Publishing Blog Posts to dobacklinks.com\n");
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`📁 Working directory: ${process.cwd()}\n`);

  const results = [];
  let published = 0;
  let failed = 0;

  for (const post of blogPosts) {
    const filePath = path.join(process.cwd(), post.file);

    console.log(`\n📄 Processing: ${post.file}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`   ⏭️  Skipping (file not found)`);
      continue;
    }

    try {
      // Read markdown content
      const content = fs.readFileSync(filePath, "utf-8");
      const title = extractTitle(content);
      const description = extractDescription(content);
      const slug = generateSlug(title);

      console.log(`   📝 Title: ${title}`);
      console.log(`   🔗 Slug: ${slug}`);

      // Prepare post data
      const postData = {
        title,
        slug,
        content,
        description,
        status: post.status,
        visibility: "public" as const,
        isPinned: post.isPinned,
        featuredImageUrl: "",
        tags: [], // Can be enhanced later with tag association
      };

      // Publish
      const result = await createBlogPost(postData);
      results.push({ file: post.file, success: true, result });
      published++;
    } catch (error) {
      console.error(`   �� Failed to publish ${post.file}:`, error);
      results.push({ file: post.file, success: false, error });
      failed++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Publishing Summary");
  console.log("=".repeat(60));
  console.log(`✅ Published: ${published}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${blogPosts.length - published - failed}`);

  if (published > 0) {
    console.log("\n🎉 Blog posts are now live!");
    console.log(`\n📱 View all posts at: ${API_URL}/blogs`);
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
