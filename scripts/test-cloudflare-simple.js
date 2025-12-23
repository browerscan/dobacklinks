/**
 * Simple Test for Cloudflare Browser Rendering API
 *
 * 直接测试 Cloudflare API，不依赖完整的 env 验证
 *
 * 运行：node scripts/test-cloudflare-simple.js
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

console.log("🚀 Cloudflare Browser Rendering API Test\n");
console.log("📋 Configuration:");
console.log(
  `   Account ID: ${CLOUDFLARE_ACCOUNT_ID ? "✅ Found" : "❌ Missing"}`,
);
console.log(
  `   API Token: ${CLOUDFLARE_API_TOKEN ? "✅ Found" : "❌ Missing"}\n`,
);

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error("❌ Missing Cloudflare credentials in .env.local");
  process.exit(1);
}

// 测试 URL
const TEST_URL = "https://example.com";

/**
 * 测试 Cloudflare Workers Browser Rendering
 * 注意：这是一个 Workers Binding，需要部署 Worker 才能使用
 *
 * 我们先尝试直接调用 Puppeteer API
 */
async function testBrowserRendering() {
  console.log("🌐 Testing URL:", TEST_URL);
  console.log("─".repeat(80));

  // Cloudflare Browser Rendering 使用 Puppeteer
  // 但需要通过 Worker 调用，不能直接通过 REST API

  console.log("\n⚠️  Important Note:");
  console.log("Cloudflare Browser Rendering 需要部署 Worker 才能使用。");
  console.log("它不是直接的 REST API，而是通过 Workers 的 Puppeteer binding。");
  console.log(
    "\n📖 文档: https://developers.cloudflare.com/browser-rendering/",
  );
  console.log("\n💡 替代方案:");
  console.log("1. 部署一个 Cloudflare Worker 来处理截图请求");
  console.log("2. 使用其他截图服务（如 Puppeteer on VPS）");
  console.log("3. 使用第三方 API（如 ScreenshotAPI.net, ApiFlash 等）");

  // 测试 Cloudflare API 连接
  console.log("\n🔌 Testing Cloudflare API Connection...");

  const options = {
    hostname: "api.cloudflare.com",
    path: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log("✅ Cloudflare API 连接成功!");
          console.log(`   Status: ${res.statusCode}`);
          const parsed = JSON.parse(data);
          console.log(`   Workers found: ${parsed.result?.length || 0}`);
        } else {
          console.log(`❌ API 错误: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
        }
        resolve();
      });
    });

    req.on("error", (error) => {
      console.error("❌ 请求失败:", error.message);
      reject(error);
    });

    req.end();
  });
}

testBrowserRendering()
  .then(() => {
    console.log("\n" + "=".repeat(80));
    console.log("📝 下一步:");
    console.log("1. 选择截图方案:");
    console.log("   a) 部署 Cloudflare Worker (需要 wrangler)");
    console.log("   b) 在 VPS 上运行 Puppeteer");
    console.log("   c) 使用第三方截图 API");
    console.log("\n2. 推荐方案 (最简单): 使用 Puppeteer on VPS");
    console.log("   - 你的 VPS: 93.127.133.204");
    console.log("   - 已有数据库在 VPS 上");
    console.log("   - 可以创建一个简单的截图服务");
    console.log("=".repeat(80));
  })
  .catch(console.error);
