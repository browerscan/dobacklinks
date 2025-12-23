/**
 * Puppeteer Screenshot Test (Standalone)
 *
 * 直接测试 Puppeteer 截图和 SEO 提取，不依赖完整的项目配置
 *
 * 运行：node scripts/test-puppeteer-simple.js
 */

const puppeteer = require("puppeteer");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

// 测试 URL
const TEST_URLS = ["https://example.com", "https://techcrunch.com"];

// 配置
const CONFIG = {
  viewport: { width: 1920, height: 1080 },
  thumbnailSize: { width: 400, height: 300 },
  screenshotFormat: "webp",
  quality: 80,
};

/**
 * 捕获截图
 */
async function captureScreenshot(page) {
  const screenshot = await page.screenshot({
    type: CONFIG.screenshotFormat,
    quality: CONFIG.quality,
    fullPage: false,
  });
  return Buffer.from(screenshot);
}

/**
 * 提取 SEO 元数据
 */
async function extractSeoMetadata(page) {
  return await page.evaluate(() => {
    const getMeta = (selector) => {
      const element = document.querySelector(selector);
      return element?.getAttribute("content") || null;
    };

    const getLink = (selector) => {
      const element = document.querySelector(selector);
      return element?.getAttribute("href") || null;
    };

    return {
      title: document.title || null,
      metaDescription: getMeta('meta[name="description"]'),
      ogTitle: getMeta('meta[property="og:title"]'),
      ogDescription: getMeta('meta[property="og:description"]'),
      ogImage: getMeta('meta[property="og:image"]'),
      twitterCard: getMeta('meta[name="twitter:card"]'),
      twitterTitle: getMeta('meta[name="twitter:title"]'),
      twitterDescription: getMeta('meta[name="twitter:description"]'),
      twitterImage: getMeta('meta[name="twitter:image"]'),
      faviconUrl: getLink('link[rel*="icon"]'),
      canonicalUrl: getLink('link[rel="canonical"]'),
      h1: document.querySelector("h1")?.textContent?.trim() || null,
    };
  });
}

/**
 * 生成缩略图
 */
async function generateThumbnail(buffer) {
  return await sharp(buffer)
    .resize(CONFIG.thumbnailSize.width, CONFIG.thumbnailSize.height, {
      fit: "cover",
      position: "top",
    })
    .webp({ quality: CONFIG.quality - 10 })
    .toBuffer();
}

/**
 * 保存截图
 */
async function saveScreenshot(buffer, thumbnailBuffer, domain) {
  const publicDir = path.join(process.cwd(), "public");
  const fullDir = path.join(publicDir, "screenshots", "full");
  const thumbDir = path.join(publicDir, "screenshots", "thumbnails");

  // 确保目录存在
  await fs.mkdir(fullDir, { recursive: true });
  await fs.mkdir(thumbDir, { recursive: true });

  // 生成文件名
  const sanitizedDomain = domain
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase()
    .substring(0, 50);
  const timestamp = Date.now();
  const fileName = `${sanitizedDomain}-${timestamp}.webp`;
  const thumbFileName = `${sanitizedDomain}-${timestamp}-thumb.webp`;

  // 保存文件
  await fs.writeFile(path.join(fullDir, fileName), buffer);
  await fs.writeFile(path.join(thumbDir, thumbFileName), thumbnailBuffer);

  return {
    fullUrl: `/screenshots/full/${fileName}`,
    thumbnailUrl: `/screenshots/thumbnails/${thumbFileName}`,
  };
}

/**
 * 主测试函数
 */
async function main() {
  console.log("🚀 Puppeteer Screenshot & SEO Test\n");
  console.log("=".repeat(80));

  let browser;

  try {
    // 启动浏览器
    console.log("📦 Launching browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });
    console.log("✅ Browser launched\n");

    // 测试每个 URL
    for (const url of TEST_URLS) {
      console.log("\n" + "=".repeat(80));
      console.log(`🌐 Testing: ${url}`);
      console.log("=".repeat(80));

      let page;
      try {
        // 创建页面
        page = await browser.newPage();
        await page.setViewport(CONFIG.viewport);

        // 导航到页面
        console.log("\n📍 Navigating to page...");
        const navStart = Date.now();
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        const navTime = Date.now() - navStart;
        console.log(`✅ Navigation complete (${navTime}ms)`);

        // 测试 1: SEO 元数据提取
        console.log("\n🔍 Test 1: SEO Metadata Extraction");
        console.log("-".repeat(40));
        const seoStart = Date.now();
        const seoMetadata = await extractSeoMetadata(page);
        const seoTime = Date.now() - seoStart;
        console.log("✅ SEO metadata extracted:");
        console.log(JSON.stringify(seoMetadata, null, 2));
        console.log(`⏱️  Time: ${seoTime}ms`);

        // 测试 2: 截图捕获
        console.log("\n📸 Test 2: Screenshot Capture");
        console.log("-".repeat(40));
        const screenshotStart = Date.now();
        const screenshot = await captureScreenshot(page);
        const screenshotTime = Date.now() - screenshotStart;
        console.log(
          `✅ Screenshot captured: ${screenshot.length} bytes (${(screenshot.length / 1024).toFixed(2)} KB)`,
        );
        console.log(`⏱️  Time: ${screenshotTime}ms`);

        // 测试 3: 缩略图生成
        console.log("\n🖼️  Test 3: Thumbnail Generation");
        console.log("-".repeat(40));
        const thumbStart = Date.now();
        const thumbnail = await generateThumbnail(screenshot);
        const thumbTime = Date.now() - thumbStart;
        console.log(
          `✅ Thumbnail generated: ${thumbnail.length} bytes (${(thumbnail.length / 1024).toFixed(2)} KB)`,
        );
        console.log(
          `📊 Compression ratio: ${((1 - thumbnail.length / screenshot.length) * 100).toFixed(1)}%`,
        );
        console.log(`⏱️  Time: ${thumbTime}ms`);

        // 测试 4: 保存到本地
        console.log("\n💾 Test 4: Save to Local Storage");
        console.log("-".repeat(40));
        const saveStart = Date.now();
        const { fullUrl, thumbnailUrl } = await saveScreenshot(
          screenshot,
          thumbnail,
          url,
        );
        const saveTime = Date.now() - saveStart;
        console.log("✅ Screenshots saved:");
        console.log(`   Full: ${fullUrl}`);
        console.log(`   Thumbnail: ${thumbnailUrl}`);
        console.log(`⏱️  Time: ${saveTime}ms`);

        // 总计时间
        const totalTime =
          navTime + seoTime + screenshotTime + thumbTime + saveTime;
        console.log("\n📊 Performance Summary:");
        console.log("-".repeat(40));
        console.log(`   Navigation:  ${navTime}ms`);
        console.log(`   SEO Extract: ${seoTime}ms`);
        console.log(`   Screenshot:  ${screenshotTime}ms`);
        console.log(`   Thumbnail:   ${thumbTime}ms`);
        console.log(`   Save:        ${saveTime}ms`);
        console.log(`   ─────────────────────────`);
        console.log(`   Total:       ${totalTime}ms`);
      } catch (error) {
        console.error(`\n❌ Test failed for ${url}:`);
        console.error(`   Error: ${error.message}`);
      } finally {
        if (page) {
          await page.close();
        }
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ All tests completed!");
    console.log("=".repeat(80));
    console.log("\n📝 Results:");
    console.log("1. Check public/screenshots/full/ for full screenshots");
    console.log("2. Check public/screenshots/thumbnails/ for thumbnails");
    console.log("3. Verify WebP format and file sizes");
    console.log("4. Review SEO metadata accuracy");
    console.log("\n💡 Next steps:");
    console.log("1. Database schema extension");
    console.log("2. Integration with product workflow");
    console.log("3. Frontend display components");
  } catch (error) {
    console.error("\n❌ Test suite failed:");
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log("\n🛑 Browser closed");
    }
  }
}

main();
