#!/usr/bin/env npx tsx
/**
 * 测试批量处理 - 只处理 5 个网站
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";

async function main() {
  console.log("🧪 测试批量处理 - 5 个网站\n");

  const service = getScreenshotEnrichmentService();

  // 当前状态
  const statsBefore = await service.getEnrichmentStats();
  console.log("📊 处理前状态:");
  console.log(`   待处理: ${statsBefore.pending}`);
  console.log(`   已捕获: ${statsBefore.captured}`);
  console.log(`   失败: ${statsBefore.failed}\n`);

  console.log("🚀 开始处理 5 个网站...\n");
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
    5,
  );

  const duration = Date.now() - startTime;

  console.log(`\n\n✅ 处理完成:`);
  console.log(`   处理: ${result.stats.total}`);
  console.log(`   成功: ${result.stats.captured}`);
  console.log(`   失败: ${result.stats.failed}`);
  console.log(`   成功率: ${((result.stats.captured / result.stats.total) * 100).toFixed(1)}%`);
  console.log(`   耗时: ${(duration / 1000).toFixed(1)}s`);

  if (result.failedDomains && result.failedDomains.length > 0) {
    console.log(`\n❌ 失败的域名:`);
    result.failedDomains.forEach((domain) => {
      console.log(`   - ${domain}`);
    });
  }

  // 更新后状态
  const statsAfter = await service.getEnrichmentStats();
  console.log(`\n📊 处理后状态:`);
  console.log(`   待处理: ${statsAfter.pending}`);
  console.log(`   已捕获: ${statsAfter.captured}`);
  console.log(`   失败: ${statsAfter.failed}`);
}

main().catch(console.error);
