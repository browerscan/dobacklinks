#!/usr/bin/env npx tsx
/**
 * 重置失败的截图状态并重新处理
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";

async function main() {
  console.log("🔄 重置失败的截图状态并重新处理\n");

  const service = getScreenshotEnrichmentService();

  // 获取当前统计
  const statsBefore = await service.getEnrichmentStats();
  console.log("📊 当前状态:");
  console.log(`   总数: ${statsBefore.total}`);
  console.log(`   已捕获: ${statsBefore.captured} (${statsBefore.capturedPercentage}%)`);
  console.log(`   失败: ${statsBefore.failed} (${statsBefore.failedPercentage}%)`);
  console.log(`   待处理: ${statsBefore.pending} (${statsBefore.pendingPercentage}%)`);
  console.log("");

  if (statsBefore.failed === 0) {
    console.log("✅ 没有失败的记录需要重试！");
    return;
  }

  // 重置失败状态
  console.log(`🔄 重置 ${statsBefore.failed} 个失败的截图状态为 pending...`);
  const resetCount = await service.resetFailedProducts();
  console.log(`✅ 已重置 ${resetCount} 个产品状态\n`);

  // 获取重置后的统计
  const statsAfter = await service.getEnrichmentStats();
  console.log("📊 重置后状态:");
  console.log(`   待处理: ${statsAfter.pending} (${statsAfter.pendingPercentage}%)`);
  console.log(`   失败: ${statsAfter.failed} (${statsAfter.failedPercentage}%)`);
  console.log("");
  console.log("✅ 状态重置完成！现在可以重新运行 worker 来处理这些产品。");
}

main().catch(console.error);
