#!/usr/bin/env node
/**
 * Test Cloudflare Browser Rendering REST API
 *
 * 简单测试脚本，直接测试 Cloudflare API
 *
 * 运行：node scripts/test-cloudflare-api.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// 从 .env.local 读取配置
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
};

const CLOUDFLARE_ACCOUNT_ID = getEnvValue("CLOUDFLARE_ACCOUNT_ID");
const CLOUDFLARE_API_TOKEN = getEnvValue("CLOUDFLARE_API_TOKEN");

// 测试 URL
const TEST_URL = "https://example.com";

console.log("🚀 Cloudflare Browser Rendering API Test\n");
console.log("═".repeat(80));
console.log("📋 Configuration:");
console.log(
  `   Account ID: ${CLOUDFLARE_ACCOUNT_ID ? "✅ " + CLOUDFLARE_ACCOUNT_ID.substring(0, 10) + "..." : "❌ Missing"}`,
);
console.log(
  `   API Token: ${CLOUDFLARE_API_TOKEN ? "✅ Found" : "❌ Missing"}`,
);
console.log(`   Test URL: ${TEST_URL}`);
console.log("═".repeat(80));
console.log("");

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error("❌ Missing Cloudflare credentials in .env.local");
  process.exit(1);
}

/**
 * Test screenshot API
 */
async function testScreenshot() {
  console.log("📸 Test 1: Screenshot API");
  console.log("─".repeat(80));

  const endpoint = `/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/browser-rendering/screenshot`;

  const postData = JSON.stringify({
    url: TEST_URL,
    viewport: { width: 1280, height: 720 },
    gotoOptions: {
      waitUntil: "networkidle2",
      timeout: 30000,
    },
  });

  const options = {
    hostname: "api.cloudflare.com",
    port: 443,
    path: endpoint,
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const req = https.request(options, (res) => {
      const chunks = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        const duration = Date.now() - startTime;
        const buffer = Buffer.concat(chunks);

        if (res.statusCode === 200) {
          console.log(`✅ Screenshot captured successfully!`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);
          console.log(`   Duration: ${duration}ms`);

          // Save to file
          const outputDir = path.join(
            __dirname,
            "..",
            "public",
            "screenshots",
            "full",
          );
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const filename = `test-${Date.now()}.png`;
          const filepath = path.join(outputDir, filename);
          fs.writeFileSync(filepath, buffer);

          console.log(`   Saved: public/screenshots/full/${filename}`);
          resolve({ success: true, buffer, duration });
        } else {
          console.log(`❌ API Error: ${res.statusCode}`);
          console.log(`   Response: ${buffer.toString()}`);
          reject(new Error(`API returned ${res.statusCode}`));
        }
      });
    });

    req.on("error", (error) => {
      console.error(`❌ Request failed: ${error.message}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test SEO extraction (simple HTML fetch)
 */
async function testSeoExtraction() {
  console.log("\n🔍 Test 2: SEO Metadata Extraction");
  console.log("─".repeat(80));

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    https
      .get(
        TEST_URL,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        },
        (res) => {
          let html = "";

          res.on("data", (chunk) => {
            html += chunk;
          });

          res.on("end", () => {
            const duration = Date.now() - startTime;

            // Simple HTML parsing
            const getMeta = (name) => {
              const patterns = [
                new RegExp(
                  `<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`,
                  "i",
                ),
                new RegExp(
                  `<meta\\s+content=["']([^"']+)["']\\s+name=["']${name}["']`,
                  "i",
                ),
              ];
              for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match) return match[1];
              }
              return null;
            };

            const getProperty = (property) => {
              const patterns = [
                new RegExp(
                  `<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`,
                  "i",
                ),
                new RegExp(
                  `<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["']`,
                  "i",
                ),
              ];
              for (const pattern of patterns) {
                const match = html.match(pattern);
                if (match) return match[1];
              }
              return null;
            };

            const getTitle = () => {
              const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
              return match ? match[1].trim() : null;
            };

            const seoMetadata = {
              title: getTitle(),
              metaDescription: getMeta("description"),
              ogTitle: getProperty("og:title"),
              ogDescription: getProperty("og:description"),
              ogImage: getProperty("og:image"),
            };

            console.log("✅ SEO metadata extracted successfully!");
            console.log(`   Duration: ${duration}ms`);
            console.log("   Data:");
            console.log(
              JSON.stringify(seoMetadata, null, 2)
                .split("\n")
                .map((line) => "   " + line)
                .join("\n"),
            );

            resolve({ success: true, metadata: seoMetadata, duration });
          });
        },
      )
      .on("error", (error) => {
        console.error(`❌ Extraction failed: ${error.message}`);
        reject(error);
      });
  });
}

/**
 * Main test function
 */
async function main() {
  try {
    // Test 1: Screenshot
    const screenshotResult = await testScreenshot();

    // Test 2: SEO
    const seoResult = await testSeoExtraction();

    // Summary
    console.log("\n" + "═".repeat(80));
    console.log("📊 Test Summary");
    console.log("═".repeat(80));
    console.log("✅ All tests passed!");
    console.log("");
    console.log("Performance:");
    console.log(`   Screenshot: ${screenshotResult.duration}ms`);
    console.log(`   SEO Extraction: ${seoResult.duration}ms`);
    console.log(
      `   Total: ${screenshotResult.duration + seoResult.duration}ms`,
    );
    console.log("");
    console.log("✅ Cloudflare Browser Rendering API is working!");
    console.log("");
    console.log("📋 Next steps:");
    console.log("1. Extend database schema with screenshot fields");
    console.log("2. Create screenshot enrichment service");
    console.log("3. Integrate into product workflow");
    console.log("4. Add frontend display components");
    console.log("═".repeat(80));
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

main();
