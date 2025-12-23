import { config } from "dotenv";
config({ path: ".env.local" });
import { getScreenshotEnrichmentService } from "../lib/services/screenshot-enrichment-service";

async function main() {
  const service = getScreenshotEnrichmentService();
  const stats = await service.getEnrichmentStats();
  console.log("📊 当前状态:");
  console.log("总数:", stats.total);
  console.log("已捕获:", stats.captured, "(" + stats.capturedPercentage + "%)");
  console.log("失败:", stats.failed, "(" + stats.failedPercentage + "%)");
  console.log("待处理:", stats.pending, "(" + stats.pendingPercentage + "%)");
}

main();
