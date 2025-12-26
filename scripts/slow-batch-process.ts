#!/usr/bin/env npx tsx
/**
 * 慢速批量处理 - 避免 Rate Limit
 *
 * 策略：
 * - 批次大小：3个/批（极小）
 * - 批内延迟：3秒/请求
 * - 批次间延迟：90秒（1.5分钟）
 * - 总预计时间：约 5-6 小时（283个网站）
 *
 * 使用场景：
 * - 夜间运行
 * - 后台长期运行
 * - 需要 99%+ 成功率
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BrowserRenderingClient } from "@/lib/cloudflare/browser-rendering";
import { getScreenshotStorage } from "@/lib/services/screenshot-storage.edge";

// Ultra-conservative configuration
const BATCH_SIZE = 3; // 每批 3 个
const BATCH_DELAY_SECONDS = 90; // 批次间延迟 90 秒
const REQUEST_DELAY_SECONDS = 3; // 请求间延迟 3 秒
const MAX_RETRY = 2; // 最多重试 2 次

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
    console.log(`  📸 Processing: ${product.name} (${product.url})`);

    const browserClient = new BrowserRenderingClient();
    const storage = getScreenshotStorage();

    const { screenshot, seoMetadata } = await browserClient.captureFullData(product.url);
    const { fullUrl, thumbnailUrl } = await storage.saveScreenshot(screenshot, domain);

    await db
      .update(products)
      .set({
        screenshotStatus: "captured",
        screenshotCapturedAt: new Date(),
        screenshotFullUrl: fullUrl,
        screenshotThumbnailUrl: thumbnailUrl,
        screenshotNextCaptureAt: null,
        seoTitle: seoMetadata.title,
        seoMetaDescription: seoMetadata.metaDescription,
        seoOgTitle: seoMetadata.ogTitle,
        seoOgDescription: seoMetadata.ogDescription,
        seoOgImage: seoMetadata.ogImage,
        seoTwitterCard: seoMetadata.twitterCard,
        seoTwitterTitle: seoMetadata.twitterTitle,
        seoTwitterDescription: seoMetadata.twitterDescription,
        seoTwitterImage: seoMetadata.twitterImage,
        seoFaviconUrl: seoMetadata.faviconUrl,
        seoCanonicalUrl: seoMetadata.canonicalUrl,
        seoH1: seoMetadata.h1,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    console.log(`  ✅ Success: ${domain}`);
    return { domain, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // 如果是 429 错误且还有重试次数，则重试
    if (errorMessage.includes("429") && retryCount < MAX_RETRY) {
      const waitTime = (retryCount + 1) * 60; // 指数退避：60s, 120s
      console.log(
        `  ⚠️  Rate limit hit, retry ${retryCount + 1}/${MAX_RETRY} after ${waitTime}s...`,
      );
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

    console.error(`  ❌ Failed: ${product.name} - ${errorMessage}`);
    return { domain, success: false, error: errorMessage };
  }
}

async function main() {
  console.log("🐌 慢速批量处理 - 避免 Rate Limit\n");
  console.log(`${"=".repeat(80)}`);
  console.log(`⚙️  配置:`);
  console.log(`   批次大小: ${BATCH_SIZE} 个/批`);
  console.log(`   批次延迟: ${BATCH_DELAY_SECONDS} 秒`);
  console.log(`   请求延迟: ${REQUEST_DELAY_SECONDS} 秒`);
  console.log(`   最大重试: ${MAX_RETRY} 次`);
  console.log(`${"=".repeat(80)}\n`);

  // 获取待处理的产品
  const pendingProducts = await db.query.products.findMany({
    where: eq(products.screenshotStatus, "pending"),
    columns: {
      id: true,
      url: true,
      name: true,
    },
    orderBy: (products, { desc }) => [desc(products.monthlyVisits)], // 按流量排序
    limit: 300, // 最多处理 300 个
  });

  console.log(`📊 找到 ${pendingProducts.length} 个待处理网站\n`);

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

  for (let i = 0; i < pendingProducts.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = pendingProducts.slice(i, i + BATCH_SIZE);

    console.log(`\n${"=".repeat(80)}`);
    console.log(`📦 批次 ${batchNumber}/${totalBatches} (${batch.length} 个网站)`);
    console.log(`${"=".repeat(80)}\n`);

    // 处理批次中的每个产品（顺序处理，避免并发）
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

      // 当前进度
      const progress = ((totalProcessed / pendingProducts.length) * 100).toFixed(1);
      const successRate = ((totalSuccess / totalProcessed) * 100).toFixed(1);

      console.log(
        `  📊 进度: ${totalProcessed}/${pendingProducts.length} (${progress}%) | ` +
          `成功: ${totalSuccess} (${successRate}%) | 失败: ${totalFailed}`,
      );

      // 如果不是批次中的最后一个，延迟
      if (j < batch.length - 1) {
        console.log(`  ⏱️  等待 ${REQUEST_DELAY_SECONDS} 秒...`);
        await sleep(REQUEST_DELAY_SECONDS);
      }
    }

    // 批次间延迟
    if (i + BATCH_SIZE < pendingProducts.length) {
      console.log(`\n⏱️  批次完成！等待 ${BATCH_DELAY_SECONDS} 秒后继续下一批次...`);
      console.log(`   (按 Ctrl+C 可安全停止，已处理数据已保存)`);

      // 倒计时显示
      for (let countdown = BATCH_DELAY_SECONDS; countdown > 0; countdown -= 10) {
        process.stdout.write(
          `\r   剩余时间: ${countdown} 秒... (${batchNumber}/${totalBatches} 批次已完成)`,
        );
        await sleep(Math.min(10, countdown));
      }
      console.log("\r   继续处理下一批次...                                          ");
    }
  }

  // 最终报告
  console.log(`\n${"=".repeat(80)}`);
  console.log("📊 最终报告");
  console.log(`${"=".repeat(80)}`);
  console.log(`✅ 总处理: ${totalProcessed} 个网站`);
  console.log(`   成功: ${totalSuccess} (${((totalSuccess / totalProcessed) * 100).toFixed(1)}%)`);
  console.log(`   失败: ${totalFailed} (${((totalFailed / totalProcessed) * 100).toFixed(1)}%)`);

  if (failedDomains.length > 0) {
    console.log(`\n❌ 失败的域名 (${failedDomains.length}):`);
    failedDomains.slice(0, 20).forEach((domain) => {
      console.log(`   - ${domain}`);
    });
    if (failedDomains.length > 20) {
      console.log(`   ... 还有 ${failedDomains.length - 20} 个`);
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("✅ 处理完成！");
  console.log(`${"=".repeat(80)}`);
}

// 优雅退出
process.on("SIGINT", () => {
  console.log("\n\n⚠️  收到中断信号，安全退出...");
  console.log("   已处理的截图已保存到数据库");
  process.exit(0);
});

main().catch((error) => {
  console.error("\n❌ 批量处理失败:", error);
  process.exit(1);
});
