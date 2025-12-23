#!/usr/bin/env tsx

/**
 * Update existing blog posts in database
 *
 * This script directly updates the database to fix content issues
 * like duplicate H1 tags
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../lib/db";
import { posts } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

interface PostUpdate {
  slug: string;
  file: string;
}

/**
 * Extract title from markdown file
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : "Untitled Post";
}

/**
 * Posts to update
 */
const postsToUpdate: PostUpdate[] = [
  {
    slug: "complete-guide-how-to-find-dr70-guest-post-sites-using-our-directory-2025",
    file: "blog-draft-dr70-guide.md",
  },
  {
    slug: "real-case-study-how-500-budget-got-10-google-news-guest-post-links",
    file: "case-study-google-news-guest-posts.md",
  },
  {
    slug: "reverse-engineering-our-quality-score-how-we-rate-9-700-guest-post-sites",
    file: "content/blog/reverse-engineering-quality-score.md",
  },
];

async function main() {
  console.log("🔄 Updating blog posts to fix duplicate H1 tags\n");

  let updated = 0;
  let failed = 0;

  for (const post of postsToUpdate) {
    console.log(`\n📄 Processing: ${post.slug}`);

    const filePath = path.join(process.cwd(), post.file);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`   ⏭️  Skipping (file not found: ${filePath})`);
      failed++;
      continue;
    }

    try {
      // Read updated content
      const content = fs.readFileSync(filePath, "utf-8");
      console.log(`   📖 Read ${content.length} characters from file`);

      // Update database
      const result = await db
        .update(posts)
        .set({
          content: content,
          updatedAt: new Date(),
        })
        .where(eq(posts.slug, post.slug))
        .returning({ id: posts.id });

      if (result.length > 0) {
        console.log(`   ✅ Updated successfully (ID: ${result[0].id})`);
        updated++;
      } else {
        console.log(`   ⚠️  Post not found in database`);
        failed++;
      }
    } catch (error) {
      console.error(`   ❌ Failed to update:`, error);
      failed++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Update Summary");
  console.log("=".repeat(60));
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);

  if (updated > 0) {
    console.log("\n🎉 Blog posts updated successfully!");
    console.log("💡 Refresh your browser to see the changes");
  }

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
