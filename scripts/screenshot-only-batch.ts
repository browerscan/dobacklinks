#!/usr/bin/env npx tsx
/**
 * 只捕获截图 - 跳过 SEO 元数据
 *
 * 策略：
 * - 批次大小：5个/批
 * - 批内延迟：5秒/请求
 * - 批次间延迟：60秒
 * - 只调用截图 API（避免 SEO 提取的 timeout/403 问题）
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BrowserRenderingClient } from "@/lib/cloudflare/browser-rendering";
import { getScreenshotStorage } from "@/lib/services/screenshot-storage.edge";

// Configuration
const BATCH_SIZE = 5;
const BATCH_DELAY_SECONDS = 60;
const REQUEST_DELAY_SECONDS = 5;
const MAX_RETRY = 2;
const PROCESS_LIMIT = 283; // 处理上限

interface ProcessResult {
  domain: string;
  success: boolean;
  error?: string;
}

async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function processSingleProduct(
  product: { id: string; url: string; name: string },
  retryCount = 0,
): Promise<ProcessResult> {
  const domain = product.url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];

  try {
    console.log(`  📸 ${product.name} (${product.url})`);

    const browserClient = new BrowserRenderingClient();
    const storage = getScreenshotStorage();

    // 只捕获截图（不提取 SEO）
    const screenshot = await browserClient.captureScreenshot(product.url);
    const { fullUrl, thumbnailUrl } = await storage.saveScreenshot(screenshot, domain);

    await db
      .update(products)
      .set({
        screenshotStatus: "captured",
        screenshotCapturedAt: new Date(),
        screenshotFullUrl: fullUrl,
        screenshotThumbnailUrl: thumbnailUrl,
        screenshotNextCaptureAt: null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    console.log(`     ✅ ${domain}`);
    return { domain, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // 如果是 429 错误且还有重试次数
    if (errorMessage.includes("429") && retryCount < MAX_RETRY) {
      const waitTime = (retryCount + 1) * 60;
      console.log(`     ⚠️  Rate limit, retry after ${waitTime}s...`);
      await sleep(waitTime);
      return processSingleProduct(product, retryCount + 1);
    }

    // 标记为失败
    await db
      .update(products)
      .set({
        screenshotStatus: "failed",
        screenshotError: errorMessage,
        screenshotNextCaptureAt: null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    console.error(`     ❌ ${domain}: ${errorMessage.substring(0, 50)}`);
    return { domain, success: false, error: errorMessage };
  }
}

async function main() {
  console.log("📸 批量截图处理（仅截图，跳过 SEO）\n");
  console.log(`${"=".repeat(80)}`);
  console.log(`⚙️  配置:`);
  console.log(`   批次大小: ${BATCH_SIZE} 个/批`);
  console.log(`   批次延迟: ${BATCH_DELAY_SECONDS} 秒`);
  console.log(`   请求延迟: ${REQUEST_DELAY_SECONDS} 秒`);
  console.log(`   处理上限: ${PROCESS_LIMIT} 个`);
  console.log(`${"=".repeat(80)}\n`);

  // 获取待处理产品（优先高流量网站）
  const pendingProducts = await db.query.products.findMany({
    where: eq(products.screenshotStatus, "pending"),
    columns: {
      id: true,
      url: true,
      name: true,
    },
    orderBy: (products, { desc }) => [desc(products.monthlyVisits)],
    limit: PROCESS_LIMIT,
  });

  console.log(`📊 找到 ${pendingProducts.length} 个待处理网站`);

  if (pendingProducts.length === 0) {
    console.log("✅ 没有待处理的网站！");
    return;
  }

  const totalBatches = Math.ceil(pendingProducts.length / BATCH_SIZE);
  const estimatedMinutes = Math.ceil(
    (totalBatches * BATCH_DELAY_SECONDS + pendingProducts.length * REQUEST_DELAY_SECONDS) / 60,
  );

  console.log(
    `⏱️  预计耗时: ~${estimatedMinutes} 分钟 (${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m)`,
  );
  console.log(`   批次数: ${totalBatches}`);
  console.log(
    `   完成时间: ${new Date(Date.now() + estimatedMinutes * 60 * 1000).toLocaleTimeString()}\n`,
  );

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  const failedDomains: string[] = [];
  const startTime = Date.now();

  for (let i = 0; i < pendingProducts.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = pendingProducts.slice(i, i + BATCH_SIZE);

    console.log(`\n📦 批次 ${batchNumber}/${totalBatches} (${batch.length} 个网站)`);

    // 顺序处理每个产品
    for (let j = 0; j < batch.length; j++) {
      const product = batch[j];
      const result = await processSingleProduct(product);

      totalProcessed++;
      if (result.success) {
        totalSuccess++;
      } else {
        totalFailed++;
        failedDomains.push(result.domain);
      }

      // 进度
      const progress = ((totalProcessed / pendingProducts.length) * 100).toFixed(1);
      const successRate = ((totalSuccess / totalProcessed) * 100).toFixed(1);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const avgTimePerProduct = elapsed / totalProcessed;
      const remaining = Math.ceil(
        ((pendingProducts.length - totalProcessed) * avgTimePerProduct) / 60,
      );

      console.log(
        `     📊 ${totalProcessed}/${pendingProducts.length} (${progress}%) | ` +
          `成功: ${totalSuccess} (${successRate}%) | 失败: ${totalFailed} | 剩余: ~${remaining}m`,
      );

      // 请求间延迟
      if (j < batch.length - 1) {
        await sleep(REQUEST_DELAY_SECONDS);
      }
    }

    // 批次间延迟
    if (i + BATCH_SIZE < pendingProducts.length) {
      console.log(`   ⏱️  等待 ${BATCH_DELAY_SECONDS} 秒...`);

      for (let countdown = BATCH_DELAY_SECONDS; countdown > 0; countdown -= 10) {
        process.stdout.write(`\r   剩余: ${countdown}s (${batchNumber}/${totalBatches} 批次完成)`);
        await sleep(Math.min(10, countdown));
      }
      console.log("\r   继续...                                        ");
    }
  }

  // 最终报告
  const totalTime = Math.floor((Date.now() - startTime) / 1000);
  console.log(`\n${"=".repeat(80)}`);
  console.log("📊 最终报告");
  console.log(`${"=".repeat(80)}`);
  console.log(`✅ 总处理: ${totalProcessed} 个网站`);
  console.log(`   成功: ${totalSuccess} (${((totalSuccess / totalProcessed) * 100).toFixed(1)}%)`);
  console.log(`   失败: ${totalFailed} (${((totalFailed / totalProcessed) * 100).toFixed(1)}%)`);
  console.log(`   耗时: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);

  if (failedDomains.length > 0) {
    console.log(`\n❌ 失败的域名 (${failedDomains.length}):`);
    failedDomains.slice(0, 10).forEach((domain) => {
      console.log(`   - ${domain}`);
    });
    if (failedDomains.length > 10) {
      console.log(`   ... 还有 ${failedDomains.length - 10} 个`);
    }
  }

  // 更新状态
  const stats = await db.query.products.findFirst({
    columns: {},
    extras: {
      total: sql<number>`count(*)::int`.as("total"),
      pending: sql<number>`count(*) filter (where screenshot_status = 'pending')::int`.as(
        "pending",
      ),
      captured: sql<number>`count(*) filter (where screenshot_status = 'captured')::int`.as(
        "captured",
      ),
      failed: sql<number>`count(*) filter (where screenshot_status = 'failed')::int`.as("failed"),
    },
  });

  if (stats) {
    const capturedPct = ((stats.captured / stats.total) * 100).toFixed(1);
    console.log(`\n📊 最新状态:`);
    console.log(`   总计: ${stats.total}`);
    console.log(`   待处理: ${stats.pending}`);
    console.log(`   已捕获: ${stats.captured} (${capturedPct}%)`);
    console.log(`   失败: ${stats.failed}`);
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("✅ 处理完成！");
  console.log(`${"=".repeat(80)}`);
}

// 优雅退出
process.on("SIGINT", () => {
  console.log("\n\n⚠️  中断，已保存");
  process.exit(0);
});

main().catch((error) => {
  console.error("\n❌ 失败:", error);
  process.exit(1);
});

// 需要导入 sql
import { sql } from "drizzle-orm";
