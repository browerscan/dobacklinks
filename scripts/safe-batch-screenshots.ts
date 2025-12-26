#!/usr/bin/env npx tsx
/**
 * Safe Batch Screenshot Capture Script
 *
 * 安全批量处理待处理的网站截图
 * - 分批处理（避免 Rate Limit）
 * - 批次间间隔等待
 * - 失败率监控
 * - 自动停止机制
 * - 详细进度报告
 *
 * Usage:
 *   pnpm tsx scripts/safe-batch-screenshots.ts --batch-size 30 --delay 12 --max-failure-rate 0.3
 *   pnpm tsx scripts/safe-batch-screenshots.ts --dry-run
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

// ============================================================================
// Configuration
// ============================================================================

interface Config {
  batchSize: number; // 每批处理数量
  delayMinutes: number; // 批次间延迟（分钟）
  maxFailureRate: number; // 最大失败率（0.0-1.0）
  dryRun: boolean; // 仅预览，不执行
}

function parseArgs(): Config {
  const args = process.argv.slice(2);

  const getArg = (flag: string, defaultValue: string): string => {
    const index = args.indexOf(flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
  };

  return {
    batchSize: parseInt(getArg("--batch-size", "30")),
    delayMinutes: parseInt(getArg("--delay", "12")),
    maxFailureRate: parseFloat(getArg("--max-failure-rate", "0.3")),
    dryRun: args.includes("--dry-run"),
  };
}

// ============================================================================
// Statistics & Reporting
// ============================================================================

interface BatchResult {
  batchNumber: number;
  processed: number;
  captured: number;
  failed: number;
  duration: number;
  failureRate: number;
  timestamp: Date;
}

interface SessionReport {
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  totalBatches: number;
  totalProcessed: number;
  totalCaptured: number;
  totalFailed: number;
  overallFailureRate: number;
  stoppedEarly: boolean;
  stopReason?: string;
  batches: BatchResult[];
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function printBatchResult(result: BatchResult, config: Config) {
  const statusIcon = result.failureRate <= config.maxFailureRate ? "✅" : "⚠️";

  console.log("\n" + "─".repeat(80));
  console.log(`${statusIcon} Batch ${result.batchNumber} Complete`);
  console.log("─".repeat(80));
  console.log(`   Processed:    ${result.processed}`);
  console.log(
    `   Captured:     ${result.captured} (${Math.round((result.captured / result.processed) * 100)}%)`,
  );
  console.log(`   Failed:       ${result.failed} (${Math.round(result.failureRate * 100)}%)`);
  console.log(`   Duration:     ${formatDuration(result.duration)}`);
  console.log(`   Completed at: ${result.timestamp.toLocaleTimeString()}`);

  if (result.failureRate > config.maxFailureRate) {
    console.log(
      `\n⚠️  WARNING: Failure rate ${Math.round(result.failureRate * 100)}% exceeds threshold ${Math.round(config.maxFailureRate * 100)}%`,
    );
  }
}

function printFinalReport(report: SessionReport) {
  console.log("\n\n");
  console.log("═".repeat(80));
  console.log("📊 FINAL REPORT");
  console.log("═".repeat(80));
  console.log(`\nSession Duration: ${formatDuration(report.totalDuration)}`);
  console.log(`Start Time:       ${report.startTime.toLocaleString()}`);
  console.log(`End Time:         ${report.endTime.toLocaleString()}`);
  console.log("");
  console.log(`Total Batches:    ${report.totalBatches}`);
  console.log(`Total Processed:  ${report.totalProcessed}`);
  console.log(
    `Total Captured:   ${report.totalCaptured} (${Math.round((report.totalCaptured / report.totalProcessed) * 100)}%)`,
  );
  console.log(
    `Total Failed:     ${report.totalFailed} (${Math.round(report.overallFailureRate * 100)}%)`,
  );

  if (report.stoppedEarly) {
    console.log(`\n⚠️  Stopped Early: ${report.stopReason}`);
  } else {
    console.log("\n✅ All batches completed successfully");
  }

  console.log("\n" + "─".repeat(80));
  console.log("Batch Details:");
  console.log("─".repeat(80));

  for (const batch of report.batches) {
    const statusIcon = batch.failureRate <= 0.3 ? "✅" : "⚠️";
    console.log(
      `${statusIcon} Batch ${batch.batchNumber}: ` +
        `${batch.captured}/${batch.processed} captured, ` +
        `${batch.failed} failed (${Math.round(batch.failureRate * 100)}%), ` +
        `${formatDuration(batch.duration)}`,
    );
  }

  console.log("═".repeat(80));
}

// ============================================================================
// Main Logic
// ============================================================================

async function main() {
  const config = parseArgs();
  const service = getScreenshotEnrichmentService();

  console.log("🚀 Safe Batch Screenshot Capture");
  console.log("═".repeat(80));
  console.log(`Configuration:`);
  console.log(`  Batch Size:        ${config.batchSize} products`);
  console.log(`  Delay:             ${config.delayMinutes} minutes`);
  console.log(`  Max Failure Rate:  ${Math.round(config.maxFailureRate * 100)}%`);
  console.log(`  Mode:              ${config.dryRun ? "DRY RUN (preview only)" : "LIVE"}`);
  console.log("═".repeat(80));
  console.log("");

  // Get initial stats
  console.log("📊 Checking Current Status...");
  const initialStats = await service.getEnrichmentStats();

  console.log(`  Total Products:    ${initialStats.total}`);
  console.log(`  Pending:           ${initialStats.pending} (${initialStats.pendingPercentage}%)`);
  console.log(
    `  Captured:          ${initialStats.captured} (${initialStats.capturedPercentage}%)`,
  );
  console.log(`  Failed:            ${initialStats.failed} (${initialStats.failedPercentage}%)`);
  console.log("");

  if (initialStats.pending === 0) {
    console.log("✅ No pending products to process!");
    return;
  }

  // Calculate batches
  const totalBatches = Math.ceil(initialStats.pending / config.batchSize);
  const estimatedDuration = totalBatches * (2 + config.delayMinutes); // ~2 min per batch + delay

  console.log(`📋 Processing Plan:`);
  console.log(`  Products to Process: ${initialStats.pending}`);
  console.log(`  Number of Batches:   ${totalBatches}`);
  console.log(
    `  Estimated Duration:  ~${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60}m`,
  );
  console.log("");

  if (config.dryRun) {
    console.log("✅ Dry run complete. Use without --dry-run to execute.");
    return;
  }

  // Confirm execution
  console.log("⚠️  This will process all pending products in batches.");
  console.log("   Press Ctrl+C within 5 seconds to cancel...");
  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log("");

  // Start processing
  const sessionReport: SessionReport = {
    startTime: new Date(),
    endTime: new Date(),
    totalDuration: 0,
    totalBatches: 0,
    totalProcessed: 0,
    totalCaptured: 0,
    totalFailed: 0,
    overallFailureRate: 0,
    stoppedEarly: false,
    batches: [],
  };

  const sessionStartTime = Date.now();

  for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
    console.log("\n" + "═".repeat(80));
    console.log(`📦 Starting Batch ${batchNum}/${totalBatches}`);
    console.log("═".repeat(80));

    const batchStartTime = Date.now();

    try {
      // Process batch
      const result = await service.enrichProducts(
        "pending",
        (progress) => {
          const percent = Math.round((progress.processed / progress.total) * 100);
          console.log(
            `   Progress: ${progress.processed}/${progress.total} (${percent}%) | ` +
              `Captured: ${progress.captured} | Failed: ${progress.failed}`,
          );
        },
        config.batchSize,
      );

      const batchDuration = Date.now() - batchStartTime;
      const failureRate = result.stats.total > 0 ? result.stats.failed / result.stats.total : 0;

      const batchResult: BatchResult = {
        batchNumber: batchNum,
        processed: result.stats.total,
        captured: result.stats.captured,
        failed: result.stats.failed,
        duration: batchDuration,
        failureRate,
        timestamp: new Date(),
      };

      sessionReport.batches.push(batchResult);
      sessionReport.totalBatches = batchNum;
      sessionReport.totalProcessed += result.stats.total;
      sessionReport.totalCaptured += result.stats.captured;
      sessionReport.totalFailed += result.stats.failed;
      sessionReport.overallFailureRate =
        sessionReport.totalProcessed > 0
          ? sessionReport.totalFailed / sessionReport.totalProcessed
          : 0;

      printBatchResult(batchResult, config);

      // Check if we should stop
      if (failureRate > config.maxFailureRate) {
        sessionReport.stoppedEarly = true;
        sessionReport.stopReason = `Failure rate ${Math.round(failureRate * 100)}% exceeds threshold ${Math.round(config.maxFailureRate * 100)}%`;
        console.log(`\n❌ Stopping: ${sessionReport.stopReason}`);
        break;
      }

      // Check if there are more to process
      const currentStats = await service.getEnrichmentStats();
      if (currentStats.pending === 0) {
        console.log("\n✅ All pending products processed!");
        break;
      }

      // Wait before next batch (if not the last batch)
      if (batchNum < totalBatches && currentStats.pending > 0) {
        const delayMs = config.delayMinutes * 60 * 1000;
        console.log(`\n⏳ Waiting ${config.delayMinutes} minutes before next batch...`);
        console.log(
          `   Next batch starts at: ${new Date(Date.now() + delayMs).toLocaleTimeString()}`,
        );

        // Show countdown every minute
        for (let i = config.delayMinutes; i > 0; i--) {
          if (i === config.delayMinutes) {
            await new Promise((resolve) => setTimeout(resolve, 60000)); // First minute
          } else {
            console.log(`   ${i} minute(s) remaining...`);
            await new Promise((resolve) => setTimeout(resolve, 60000));
          }
        }

        console.log("   Resuming...");
      }
    } catch (error) {
      console.error("\n❌ Batch processing error:", error);
      sessionReport.stoppedEarly = true;
      sessionReport.stopReason = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
      break;
    }
  }

  // Finalize report
  sessionReport.endTime = new Date();
  sessionReport.totalDuration = Date.now() - sessionStartTime;

  // Get final stats
  const finalStats = await service.getEnrichmentStats();

  console.log("\n\n📊 Final Status:");
  console.log(`  Pending:  ${finalStats.pending}`);
  console.log(
    `  Captured: ${finalStats.captured} (+${finalStats.captured - initialStats.captured})`,
  );
  console.log(`  Failed:   ${finalStats.failed} (+${finalStats.failed - initialStats.failed})`);

  printFinalReport(sessionReport);

  // Save report to file
  const reportPath = `/Volumes/SSD/dev/links/dobacklinks/dobacklinks/screenshot-batch-report-${Date.now()}.json`;
  const fs = await import("fs/promises");
  await fs.writeFile(reportPath, JSON.stringify(sessionReport, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
