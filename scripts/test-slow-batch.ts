#!/usr/bin/env npx tsx
/**
 * 测试慢速处理 - 只处理 2 个网站
 */

// Load environment variables FIRST
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BrowserRenderingClient } from "@/lib/cloudflare/browser-rendering";
import { getScreenshotStorage } from "@/lib/services/screenshot-storage.edge";

const REQUEST_DELAY_SECONDS = 5; // 5秒延迟

async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function main() {
  console.log("🧪 测试慢速处理 - 2 个网站，5秒延迟\n");

  // 获取待处理产品
  const pendingProducts = await db.query.products.findMany({
    where: eq(products.screenshotStatus, "pending"),
    columns: {
      id: true,
      url: true,
      name: true,
    },
    orderBy: (products, { desc }) => [desc(products.monthlyVisits)],
    limit: 2,
  });

  console.log(`📊 找到 ${pendingProducts.length} 个网站:\n`);
  pendingProducts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} (${p.url})`);
  });
  console.log("");

  const browserClient = new BrowserRenderingClient();
  const storage = getScreenshotStorage();

  let success = 0;
  let failed = 0;

  for (let i = 0; i < pendingProducts.length; i++) {
    const product = pendingProducts[i];
    const domain = product.url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];

    try {
      console.log(`[${i + 1}/${pendingProducts.length}] 📸 Processing: ${product.name}`);
      console.log(`   URL: ${product.url}`);

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

      console.log(`   ✅ Success! Screenshot: ${fullUrl}`);
      success++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await db
        .update(products)
        .set({
          screenshotStatus: "failed",
          screenshotError: errorMessage,
          screenshotNextCaptureAt: null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));

      console.error(`   ❌ Failed: ${errorMessage}`);
      failed++;
    }

    // 延迟
    if (i < pendingProducts.length - 1) {
      console.log(`   ⏱️  等待 ${REQUEST_DELAY_SECONDS} 秒...\n`);
      await sleep(REQUEST_DELAY_SECONDS);
    }
  }

  console.log(`\n✅ 测试完成:`);
  console.log(`   成功: ${success}`);
  console.log(`   失败: ${failed}`);
}

main().catch(console.error);
