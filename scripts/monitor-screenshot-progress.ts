#!/usr/bin/env npx tsx
/**
 * Screenshot Progress Monitor
 *
 * 实时监控截图处理进度
 *
 * Usage:
 *   pnpm tsx scripts/monitor-screenshot-progress.ts
 *   pnpm tsx scripts/monitor-screenshot-progress.ts --interval 30
 */

// Load environment variables
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";

interface ProgressSnapshot {
  timestamp: Date;
  pending: number;
  captured: number;
  failed: number;
  total: number;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const intervalIndex = args.indexOf("--interval");
  const interval =
    intervalIndex !== -1 && args[intervalIndex + 1] ? parseInt(args[intervalIndex + 1]) : 60; // Default 60 seconds

  return { interval };
}

function printProgressBar(current: number, total: number, width: number = 40): string {
  const percentage = total > 0 ? current / total : 0;
  const filled = Math.round(width * percentage);
  const empty = width - filled;

  return `[${"█".repeat(filled)}${" ".repeat(empty)}] ${Math.round(percentage * 100)}%`;
}

function calculateVelocity(snapshots: ProgressSnapshot[]): {
  capturedPerMinute: number;
  failedPerMinute: number;
  eta: string;
} {
  if (snapshots.length < 2) {
    return {
      capturedPerMinute: 0,
      failedPerMinute: 0,
      eta: "Calculating...",
    };
  }

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];

  const timeDiffMinutes = (last.timestamp.getTime() - first.timestamp.getTime()) / 60000;

  if (timeDiffMinutes === 0) {
    return {
      capturedPerMinute: 0,
      failedPerMinute: 0,
      eta: "Calculating...",
    };
  }

  const capturedDiff = last.captured - first.captured;
  const failedDiff = last.failed - first.failed;

  const capturedPerMinute = capturedDiff / timeDiffMinutes;
  const failedPerMinute = failedDiff / timeDiffMinutes;

  // Calculate ETA
  const remaining = last.pending;
  const totalPerMinute = capturedPerMinute + failedPerMinute;

  if (totalPerMinute <= 0 || remaining === 0) {
    return {
      capturedPerMinute,
      failedPerMinute,
      eta: remaining === 0 ? "Complete!" : "Stalled",
    };
  }

  const minutesRemaining = remaining / totalPerMinute;
  const hours = Math.floor(minutesRemaining / 60);
  const minutes = Math.round(minutesRemaining % 60);

  let eta = "";
  if (hours > 0) {
    eta = `${hours}h ${minutes}m`;
  } else {
    eta = `${minutes}m`;
  }

  return {
    capturedPerMinute,
    failedPerMinute,
    eta,
  };
}

async function main() {
  const { interval } = parseArgs();
  const service = getScreenshotEnrichmentService();
  const snapshots: ProgressSnapshot[] = [];

  console.clear();
  console.log("📊 Screenshot Progress Monitor");
  console.log("═".repeat(80));
  console.log(`Update Interval: ${interval} seconds`);
  console.log("Press Ctrl+C to exit");
  console.log("═".repeat(80));
  console.log("");

  // Get initial stats
  const initialStats = await service.getEnrichmentStats();
  const initialSnapshot: ProgressSnapshot = {
    timestamp: new Date(),
    pending: initialStats.pending,
    captured: initialStats.captured,
    failed: initialStats.failed,
    total: initialStats.total,
  };
  snapshots.push(initialSnapshot);

  let iteration = 0;

  while (true) {
    iteration++;

    try {
      const stats = await service.getEnrichmentStats();
      const snapshot: ProgressSnapshot = {
        timestamp: new Date(),
        pending: stats.pending,
        captured: stats.captured,
        failed: stats.failed,
        total: stats.total,
      };

      snapshots.push(snapshot);

      // Keep only last 10 snapshots for velocity calculation
      if (snapshots.length > 10) {
        snapshots.shift();
      }

      const velocity = calculateVelocity(snapshots);

      // Clear screen and redraw
      console.clear();
      console.log("📊 Screenshot Progress Monitor");
      console.log("═".repeat(80));
      console.log(`Last Update: ${snapshot.timestamp.toLocaleString()}`);
      console.log(`Update #${iteration} | Next update in ${interval}s`);
      console.log("═".repeat(80));
      console.log("");

      // Overall Progress
      console.log("Overall Progress:");
      const processed = stats.captured + stats.failed;
      console.log(`  ${printProgressBar(processed, stats.total, 50)}`);
      console.log(`  ${processed} / ${stats.total} products processed`);
      console.log("");

      // Status Breakdown
      console.log("Status Breakdown:");
      console.log(
        `  Pending:  ${stats.pending.toString().padStart(6)} (${stats.pendingPercentage}%)`,
      );
      console.log(
        `  Captured: ${stats.captured.toString().padStart(6)} (${stats.capturedPercentage}%)`,
      );
      console.log(
        `  Failed:   ${stats.failed.toString().padStart(6)} (${stats.failedPercentage}%)`,
      );
      console.log("");

      // Velocity & ETA
      if (snapshots.length >= 2) {
        const changeFromLast = stats.captured - snapshots[snapshots.length - 2].captured;
        const failedFromLast = stats.failed - snapshots[snapshots.length - 2].failed;

        console.log("Performance:");
        console.log(`  Captured/min: ${velocity.capturedPerMinute.toFixed(1)}`);
        console.log(`  Failed/min:   ${velocity.failedPerMinute.toFixed(1)}`);
        console.log(`  Last cycle:   +${changeFromLast} captured, +${failedFromLast} failed`);
        console.log(`  ETA:          ${velocity.eta}`);
        console.log("");
      }

      // Recent Activity
      if (stats.lastCapturedAt) {
        const timeSinceLastCapture = Date.now() - stats.lastCapturedAt.getTime();
        const minutesAgo = Math.floor(timeSinceLastCapture / 60000);

        console.log("Recent Activity:");
        console.log(
          `  Last Capture: ${minutesAgo === 0 ? "Just now" : `${minutesAgo} minute(s) ago`}`,
        );
        console.log("");
      }

      // Change from initial
      const capturedChange = stats.captured - initialStats.captured;
      const failedChange = stats.failed - initialStats.failed;
      const pendingChange = stats.pending - initialStats.pending;

      if (iteration > 1) {
        console.log("Change Since Start:");
        console.log(`  Captured: ${capturedChange >= 0 ? "+" : ""}${capturedChange}`);
        console.log(`  Failed:   ${failedChange >= 0 ? "+" : ""}${failedChange}`);
        console.log(`  Pending:  ${pendingChange >= 0 ? "+" : ""}${pendingChange}`);
        console.log("");
      }

      // Success rate
      if (processed > 0) {
        const successRate = (stats.captured / processed) * 100;
        const statusIcon = successRate >= 70 ? "✅" : successRate >= 50 ? "⚠️" : "❌";

        console.log("Quality Metrics:");
        console.log(`  ${statusIcon} Success Rate: ${successRate.toFixed(1)}%`);
        console.log("");
      }

      console.log("─".repeat(80));
      console.log(`Monitoring... (Ctrl+C to exit)`);

      // Wait for next iteration
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    } catch (error) {
      console.error("\n❌ Error fetching stats:", error);
      console.log("Retrying in 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
