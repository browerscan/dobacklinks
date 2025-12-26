/**
 * Test Cloudflare Browser Rendering API
 *
 * 测试截图捕获和 SEO 元数据提取功能
 *
 * 运行：pnpm tsx scripts/test-browser-rendering.ts
 */

// 加载环境变量（在导入其他模块之前）
import { config } from "dotenv";
import path from "path";
config({ path: path.join(process.cwd(), ".env.local") });

import { getBrowserRenderingClient } from "../lib/cloudflare/browser-rendering";
import { getScreenshotStorage } from "../lib/services/screenshot-storage";

// 测试 URL
const TEST_URLS = ["https://example.com", "https://techcrunch.com"];

async function main() {
  console.log("🚀 Starting Cloudflare Browser Rendering API Test\n");

  try {
    // 1. 初始化客户端
    console.log("📦 Initializing clients...");
    const browserClient = getBrowserRenderingClient();
    const storage = getScreenshotStorage();
    console.log("✅ Clients initialized\n");

    // 2. 测试每个 URL
    for (const url of TEST_URLS) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`🌐 Testing: ${url}`);
      console.log("=".repeat(80));

      try {
        // 测试 1: 截图 API
        console.log("\n📸 Test 1: Screenshot API");
        console.log("-----------------------------------");
        const screenshotStart = Date.now();
        const screenshot = await browserClient.captureScreenshot(url);
        const screenshotTime = Date.now() - screenshotStart;
        console.log(`✅ Screenshot captured: ${screenshot.length} bytes`);
        console.log(`⏱️  Time taken: ${screenshotTime}ms`);

        // 测试 2: SEO 提取 API
        console.log("\n🔍 Test 2: SEO Metadata API");
        console.log("-----------------------------------");
        const seoStart = Date.now();
        const seoMetadata = await browserClient.extractSeoMetadata(url);
        const seoTime = Date.now() - seoStart;
        console.log("✅ SEO metadata extracted:");
        console.log(JSON.stringify(seoMetadata, null, 2));
        console.log(`⏱️  Time taken: ${seoTime}ms`);

        // 测试 3: 存储到本地
        console.log("\n💾 Test 3: Save to Local Storage");
        console.log("-----------------------------------");
        const domain = storage.extractDomain(url);
        const { fullUrl, thumbnailUrl } = await storage.saveScreenshot(screenshot, domain);
        console.log(`✅ Screenshot saved:`);
        console.log(`   Full: ${fullUrl}`);
        console.log(`   Thumbnail: ${thumbnailUrl}`);

        // 测试 4: 组合 API（并行）
        console.log("\n⚡ Test 4: Combined API (Parallel)");
        console.log("-----------------------------------");
        const combinedStart = Date.now();
        const result = await browserClient.captureFullData(url);
        const combinedTime = Date.now() - combinedStart;
        console.log(`✅ Full data captured:`);
        console.log(`   Screenshot: ${result.screenshot.length} bytes`);
        console.log(`   SEO Title: ${result.seoMetadata.title}`);
        console.log(`⏱️  Time taken: ${combinedTime}ms`);
        console.log(
          `🎯 Performance gain: ${screenshotTime + seoTime - combinedTime}ms (parallel execution)`,
        );
      } catch (error) {
        console.error(`❌ Test failed for ${url}:`, error);
        if (error instanceof Error) {
          console.error(`   Error: ${error.message}`);
        }
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ All tests completed!");
    console.log("=".repeat(80));
    console.log("\n📝 Next steps:");
    console.log("1. Check public/screenshots/ directory for saved images");
    console.log("2. Verify WebP format and file sizes");
    console.log("3. Review SEO metadata extraction accuracy");
    console.log("4. Proceed with database schema extension");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

main();
