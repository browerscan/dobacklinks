#!/usr/bin/env npx tsx
/**
 * Batch Screenshot Capture Script (TypeScript)
 *
 * 批量处理现有产品的截图和 SEO 数据
 *
 * 用法:
 *   pnpm tsx scripts/batch-capture-screenshots.ts --limit 10
 *   pnpm tsx scripts/batch-capture-screenshots.ts --all
 */

// Load environment variables FIRST - before any other imports
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";

// Parse command line arguments
const args = process.argv.slice(2);
const limitIndex = args.indexOf("--limit");
const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1]) : 10;
const all = args.includes("--all");

async function main() {
  console.log("🚀 Batch Screenshot Capture\n");
  console.log("═".repeat(80));
  console.log(`📋 Processing: ${all ? "ALL pending products" : `Up to ${limit} products`}`);
  console.log("═".repeat(80));
  console.log("");

  try {
    const service = getScreenshotEnrichmentService();

    // Get stats before processing
    console.log("📊 Current Status:");
    const statsBefore = await service.getEnrichmentStats();
    console.log(`   Total: ${statsBefore.total}`);
    console.log(`   Pending: ${statsBefore.pending} (${statsBefore.pendingPercentage}%)`);
    console.log(`   Captured: ${statsBefore.captured} (${statsBefore.capturedPercentage}%)`);
    console.log(`   Failed: ${statsBefore.failed} (${statsBefore.failedPercentage}%)`);
    console.log("");

    if (statsBefore.pending === 0) {
      console.log("✅ No pending products to process!");
      return;
    }

    // Start enrichment
    console.log("🚀 Starting enrichment...\n");
    const startTime = Date.now();

    const result = await service.enrichProducts(
      all ? "all" : "pending",
      (progress) => {
        // Progress callback
        const percent = Math.round((progress.processed / progress.total) * 100);
        console.log(
          `   Progress: ${progress.processed}/${progress.total} (${percent}%) | ` +
            `Captured: ${progress.captured} | Failed: ${progress.failed}`,
        );
      },
      all ? undefined : limit,
    );

    const duration = Date.now() - startTime;

    console.log("\n" + "═".repeat(80));
    console.log("📊 Results");
    console.log("═".repeat(80));
    console.log(`✅ Success: ${result.success}`);
    console.log(`   Total processed: ${result.stats.total}`);
    console.log(`   Captured: ${result.stats.captured}`);
    console.log(`   Failed: ${result.stats.failed}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);

    if (result.failedDomains && result.failedDomains.length > 0) {
      console.log("\n❌ Failed domains:");
      result.failedDomains.forEach((domain) => {
        console.log(`   - ${domain}`);
      });
    }

    // Get stats after processing
    console.log("\n📊 Updated Status:");
    const statsAfter = await service.getEnrichmentStats();
    console.log(`   Pending: ${statsAfter.pending} (${statsAfter.pendingPercentage}%)`);
    console.log(`   Captured: ${statsAfter.captured} (${statsAfter.capturedPercentage}%)`);
    console.log(`   Failed: ${statsAfter.failed} (${statsAfter.failedPercentage}%)`);
    console.log("═".repeat(80));
  } catch (error) {
    console.error("\n❌ Batch processing failed:", error);
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
