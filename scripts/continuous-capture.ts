#!/usr/bin/env npx tsx
/**
 * Continuous Screenshot Capture Script
 *
 * 持续运行截图任务直到达到目标数量
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";

const TARGET = 500;
const BATCH_SIZE = 50;

async function main() {
  console.log("🚀 持续截图捕获任务");
  console.log(`目标: ${TARGET} 个产品`);
  console.log(`批次大小: ${BATCH_SIZE}`);
  console.log("=".repeat(80));

  const service = getScreenshotEnrichmentService();
  let totalProcessed = 0;
  let totalCaptured = 0;
  let totalFailed = 0;
  let batchNumber = 1;

  while (totalProcessed < TARGET) {
    console.log(
      `\n📦 批次 ${batchNumber} - 已处理: ${totalProcessed}/${TARGET}`,
    );
    console.log("-".repeat(80));

    try {
      const stats = await service.getEnrichmentStats();

      if (stats.pending === 0) {
        console.log("✅ 没有更多待处理的产品");
        break;
      }

      const remaining = TARGET - totalProcessed;
      const currentLimit = Math.min(BATCH_SIZE, remaining);

      console.log(`处理 ${currentLimit} 个产品...`);

      const result = await service.enrichProducts(
        "pending",
        (progress) => {
          console.log(
            `   进度: ${progress.processed}/${progress.total} | ` +
              `成功: ${progress.captured} | 失败: ${progress.failed}`,
          );
        },
        currentLimit,
      );

      totalCaptured += result.stats.captured;
      totalFailed += result.stats.failed;
      totalProcessed += result.stats.captured + result.stats.failed;

      console.log(
        `\n批次完成: +${result.stats.captured} 成功, +${result.stats.failed} 失败`,
      );

      if (result.failedDomains && result.failedDomains.length > 0) {
        console.log(`失败域名: ${result.failedDomains.join(", ")}`);
      }

      batchNumber++;

      // 短暂延迟避免过载
      if (totalProcessed < TARGET) {
        console.log("⏸️  等待 3 秒...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error("❌ 批次失败:", error);
      console.log("继续下一批次...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      batchNumber++;
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("🎉 任务完成");
  console.log(`总处理: ${totalProcessed}`);
  console.log(`✅ 成功: ${totalCaptured}`);
  console.log(`❌ 失败: ${totalFailed}`);

  const finalStats = await service.getEnrichmentStats();
  console.log(`\n最终状态:`);
  console.log(`   待处理: ${finalStats.pending}`);
  console.log(`   已捕获: ${finalStats.captured}`);
  console.log(`   失败: ${finalStats.failed}`);
  console.log("=".repeat(80));
}

main().catch((error) => {
  console.error("致命错误:", error);
  process.exit(1);
});
