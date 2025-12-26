#!/usr/bin/env npx tsx
/**
 * Test Optimized Screenshot Capture
 *
 * 测试优化后的截图捕获性能
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";

async function main() {
  console.log("🧪 Testing Optimized Screenshot Capture\n");
  console.log("═".repeat(80));
  console.log("📋 Testing with 10 pending products");
  console.log("═".repeat(80));
  console.log("");

  const service = getScreenshotEnrichmentService();

  // Get stats before
  const statsBefore = await service.getEnrichmentStats();
  console.log("📊 Before:");
  console.log(`   Pending: ${statsBefore.pending}`);
  console.log(`   Captured: ${statsBefore.captured}`);
  console.log(`   Failed: ${statsBefore.failed}`);
  console.log("");

  // Test with 10 products
  const startTime = Date.now();
  const result = await service.enrichProducts(
    "pending",
    (progress) => {
      const percent = Math.round((progress.processed / progress.total) * 100);
      console.log(
        `   Progress: ${progress.processed}/${progress.total} (${percent}%) | ` +
          `Captured: ${progress.captured} | Failed: ${progress.failed}`,
      );
    },
    10, // Only test 10
  );
  const duration = (Date.now() - startTime) / 1000;

  console.log("\n" + "═".repeat(80));
  console.log("📊 Test Results");
  console.log("═".repeat(80));
  console.log(`✅ Processed: ${result.stats.total}`);
  console.log(`   Captured: ${result.stats.captured}`);
  console.log(`   Failed: ${result.stats.failed}`);
  console.log(`   Duration: ${duration.toFixed(1)}s`);
  console.log(`   Speed: ${((result.stats.captured / duration) * 60).toFixed(1)} captures/minute`);

  if (result.failedDomains && result.failedDomains.length > 0) {
    console.log("\n❌ Failed domains:");
    result.failedDomains.forEach((domain) => {
      console.log(`   - ${domain}`);
    });
  }

  console.log("\n💡 Performance Comparison:");
  console.log(`   Old speed: ~0.9 captures/minute`);
  console.log(
    `   New speed: ${((result.stats.captured / duration) * 60).toFixed(1)} captures/minute`,
  );
  console.log(
    `   Improvement: ${((((result.stats.captured / duration) * 60) / 0.9 - 1) * 100).toFixed(0)}% faster`,
  );
  console.log("═".repeat(80));
}

main();
