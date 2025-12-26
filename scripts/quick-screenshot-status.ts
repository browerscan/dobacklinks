#!/usr/bin/env npx tsx
/**
 * Quick Screenshot Status Check
 *
 * 快速查看截图处理状态
 *
 * Usage:
 *   pnpm tsx scripts/quick-screenshot-status.ts
 */

// Load environment variables
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";

async function main() {
  console.log("📊 Screenshot Status Check");
  console.log("═".repeat(80));

  try {
    const service = getScreenshotEnrichmentService();
    const stats = await service.getEnrichmentStats();

    console.log("\nStatus Distribution:");
    console.log("─".repeat(80));
    console.log(`Total Products:    ${stats.total}`);
    console.log("");
    console.log(
      `Pending:           ${stats.pending.toString().padStart(6)} (${stats.pendingPercentage}%)`,
    );
    console.log(
      `Captured:          ${stats.captured.toString().padStart(6)} (${stats.capturedPercentage}%)`,
    );
    console.log(
      `Failed:            ${stats.failed.toString().padStart(6)} (${stats.failedPercentage}%)`,
    );
    console.log("");

    // Progress bar
    const processed = stats.captured + stats.failed;
    const percentage = stats.total > 0 ? (processed / stats.total) * 100 : 0;
    const barWidth = 50;
    const filled = Math.round((barWidth * percentage) / 100);
    const empty = barWidth - filled;

    console.log("Overall Progress:");
    console.log(`[${"█".repeat(filled)}${" ".repeat(empty)}] ${percentage.toFixed(1)}%`);
    console.log(`${processed} / ${stats.total} processed`);
    console.log("");

    // Quality metrics
    if (processed > 0) {
      const successRate = (stats.captured / processed) * 100;
      const statusIcon = successRate >= 70 ? "✅" : successRate >= 50 ? "⚠️" : "❌";

      console.log("Quality Metrics:");
      console.log(`${statusIcon} Success Rate: ${successRate.toFixed(1)}%`);
      console.log("");
    }

    // Recent activity
    if (stats.lastCapturedAt) {
      const timeSinceLastCapture = Date.now() - stats.lastCapturedAt.getTime();
      const minutesAgo = Math.floor(timeSinceLastCapture / 60000);
      const hoursAgo = Math.floor(minutesAgo / 60);
      const daysAgo = Math.floor(hoursAgo / 24);

      let timeString;
      if (daysAgo > 0) {
        timeString = `${daysAgo} day(s) ago`;
      } else if (hoursAgo > 0) {
        timeString = `${hoursAgo} hour(s) ago`;
      } else if (minutesAgo > 0) {
        timeString = `${minutesAgo} minute(s) ago`;
      } else {
        timeString = "Just now";
      }

      console.log("Recent Activity:");
      console.log(`Last Capture: ${timeString}`);
      console.log(`              ${stats.lastCapturedAt.toLocaleString()}`);
      console.log("");
    }

    // Recommendations
    console.log("─".repeat(80));
    console.log("Recommendations:");

    if (stats.pending === 0) {
      console.log("✅ All products processed!");
    } else if (stats.pending > 0) {
      const estimatedBatches = Math.ceil(stats.pending / 30);
      const estimatedHours = Math.ceil((estimatedBatches * 14) / 60); // 14 min per batch avg

      console.log(`⚠️  ${stats.pending} products pending`);
      console.log(
        `   Estimated: ~${estimatedBatches} batches, ~${estimatedHours} hours with 12-min delays`,
      );
      console.log("");
      console.log("   To start batch processing:");
      console.log("   pnpm tsx scripts/safe-batch-screenshots.ts --batch-size 30 --delay 12");
    }

    if (stats.failed > 50) {
      console.log(`\n⚠️  ${stats.failed} failed products`);
      console.log("   Review and retry failed products if needed");
    }

    console.log("═".repeat(80));
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
