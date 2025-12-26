#!/usr/bin/env npx tsx
/**
 * 批量处理待处理截图 - 安全策略版本
 *
 * 特点：
 * - 小批次处理（每批 20-30 个）
 * - 批次间延迟（10-12 分钟）
 * - 自动失败率检测
 * - 可中断和恢复
 * - 优先处理高流量网站
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";

// Configuration
const BATCH_SIZE = 25; // 每批处理数量
const BATCH_DELAY_MS = 10 * 60 * 1000; // 批次间延迟：10 分钟
const MAX_FAILURE_RATE = 0.3; // 最大失败率：30%
const TOTAL_LIMIT = 283; // 总共要处理的数量

interface BatchResult {
  batchNumber: number;
  processed: number;
  captured: number;
  failed: number;
  successRate: number;
  failedDomains: string[];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processBatch(batchNumber: number, batchSize: number): Promise<BatchResult> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📦 批次 ${batchNumber} - 处理 ${batchSize} 个网站`);
  console.log(`${"=".repeat(80)}\n`);

  const service = getScreenshotEnrichmentService();
  const startTime = Date.now();

  const result = await service.enrichProducts(
    "pending",
    (progress) => {
      const percent = Math.round((progress.processed / progress.total) * 100);
      process.stdout.write(
        `\r   进度: ${progress.processed}/${progress.total} (${percent}%) | ` +
          `成功: ${progress.captured} | 失败: ${progress.failed}`,
      );
    },
    batchSize,
  );

  const duration = Date.now() - startTime;
  const successRate = result.stats.total > 0 ? result.stats.captured / result.stats.total : 0;

  console.log(`\n\n✅ 批次完成:`);
  console.log(`   处理: ${result.stats.total}`);
  console.log(`   成功: ${result.stats.captured}`);
  console.log(`   失败: ${result.stats.failed}`);
  console.log(`   成功率: ${(successRate * 100).toFixed(1)}%`);
  console.log(`   耗时: ${(duration / 1000).toFixed(1)}s`);

  return {
    batchNumber,
    processed: result.stats.total,
    captured: result.stats.captured,
    failed: result.stats.failed,
    successRate,
    failedDomains: result.failedDomains || [],
  };
}

async function main() {
  console.log("🚀 批量截图处理 - 安全策略\n");
  console.log(`${"=".repeat(80)}`);
  console.log(`📋 配置:`);
  console.log(`   批次大小: ${BATCH_SIZE} 个网站`);
  console.log(`   批次延迟: ${BATCH_DELAY_MS / 60000} 分钟`);
  console.log(`   最大失败率: ${(MAX_FAILURE_RATE * 100).toFixed(0)}%`);
  console.log(`   处理上限: ${TOTAL_LIMIT} 个网站`);
  console.log(`${"=".repeat(80)}\n`);

  const service = getScreenshotEnrichmentService();

  // 获取初始状态
  console.log("📊 当前状态:");
  const initialStats = await service.getEnrichmentStats();
  console.log(`   待处理: ${initialStats.pending} (${initialStats.pendingPercentage}%)`);
  console.log(`   已捕获: ${initialStats.captured} (${initialStats.capturedPercentage}%)`);
  console.log(`   失败: ${initialStats.failed} (${initialStats.failedPercentage}%)`);

  if (initialStats.pending === 0) {
    console.log("\n✅ 没有待处理的网站！");
    return;
  }

  const totalBatches = Math.ceil(Math.min(initialStats.pending, TOTAL_LIMIT) / BATCH_SIZE);
  console.log(`\n📦 计划处理 ${totalBatches} 个批次\n`);

  const batchResults: BatchResult[] = [];
  let totalProcessed = 0;
  let totalCaptured = 0;
  let totalFailed = 0;
  let shouldStop = false;

  for (let i = 1; i <= totalBatches && !shouldStop; i++) {
    // 处理当前批次
    const batchResult = await processBatch(i, BATCH_SIZE);
    batchResults.push(batchResult);

    totalProcessed += batchResult.processed;
    totalCaptured += batchResult.captured;
    totalFailed += batchResult.failed;

    // 检查失败率
    const overallSuccessRate = totalProcessed > 0 ? totalCaptured / totalProcessed : 0;
    const failureRate = 1 - overallSuccessRate;

    if (failureRate > MAX_FAILURE_RATE) {
      console.log(`\n⚠️  失败率过高 (${(failureRate * 100).toFixed(1)}%)，停止处理`);
      shouldStop = true;
      break;
    }

    // 如果不是最后一个批次，延迟
    if (i < totalBatches && !shouldStop) {
      const delayMinutes = BATCH_DELAY_MS / 60000;
      console.log(`\n⏱️  等待 ${delayMinutes} 分钟后处理下一批次...`);
      console.log(`   (按 Ctrl+C 可以安全停止，已处理的数据已保存)\n`);

      // 倒计时
      for (let countdown = delayMinutes; countdown > 0; countdown--) {
        process.stdout.write(`\r   剩余时间: ${countdown} 分钟...`);
        await sleep(60000); // 等待 1 分钟
      }
      console.log("\r   继续处理下一批次...                    \n");
    }
  }

  // 最终报告
  console.log(`\n${"=".repeat(80)}`);
  console.log("📊 最终报告");
  console.log(`${"=".repeat(80)}`);
  console.log(`✅ 总处理: ${totalProcessed} 个网站`);
  console.log(
    `   成功: ${totalCaptured} (${((totalCaptured / totalProcessed) * 100).toFixed(1)}%)`,
  );
  console.log(`   失败: ${totalFailed} (${((totalFailed / totalProcessed) * 100).toFixed(1)}%)`);
  console.log(`   批次数: ${batchResults.length}/${totalBatches}`);

  // 更新后的状态
  console.log(`\n📊 更新后状态:`);
  const finalStats = await service.getEnrichmentStats();
  console.log(`   待处理: ${finalStats.pending} (${finalStats.pendingPercentage}%)`);
  console.log(`   已捕获: ${finalStats.captured} (${finalStats.capturedPercentage}%)`);
  console.log(`   失败: ${finalStats.failed} (${finalStats.failedPercentage}%)`);
  console.log(`   覆盖率: ${finalStats.capturedPercentage}%`);

  // 失败域名汇总
  const allFailedDomains = batchResults.flatMap((r) => r.failedDomains).filter(Boolean);

  if (allFailedDomains.length > 0) {
    console.log(`\n❌ 失败的域名 (${allFailedDomains.length}):`);
    allFailedDomains.slice(0, 20).forEach((domain) => {
      console.log(`   - ${domain}`);
    });
    if (allFailedDomains.length > 20) {
      console.log(`   ... 还有 ${allFailedDomains.length - 20} 个`);
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("✅ 处理完成！");
  console.log(`${"=".repeat(80)}`);
}

// 优雅退出处理
process.on("SIGINT", () => {
  console.log("\n\n⚠️  收到中断信号，安全退出...");
  console.log("   已处理的截图已保存到数据库");
  process.exit(0);
});

main().catch((error) => {
  console.error("\n❌ 批量处理失败:", error);
  if (error instanceof Error) {
    console.error(`   错误: ${error.message}`);
    console.error(`   堆栈: ${error.stack}`);
  }
  process.exit(1);
});
