import { config } from "dotenv";
config({ path: ".env.local" });

import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";

async function checkStatus() {
  const service = getScreenshotEnrichmentService();
  const stats = await service.getEnrichmentStats();

  console.log("📊 截图状态统计:");
  console.log(`   总计: ${stats.total}`);
  console.log(`   待处理: ${stats.pending} (${stats.pendingPercentage}%)`);
  console.log(`   已捕获: ${stats.captured} (${stats.capturedPercentage}%)`);
  console.log(`   失败: ${stats.failed} (${stats.failedPercentage}%)`);
  console.log("");
  console.log(
    `✅ 进度: ${stats.captured}/${stats.total} (${stats.capturedPercentage}%)`,
  );
}

checkStatus().catch(console.error);
