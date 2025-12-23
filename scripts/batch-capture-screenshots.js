#!/usr/bin/env node
/**
 * Batch Screenshot Capture Script
 *
 * 批量处理现有产品的截图和 SEO 数据
 *
 * 用法:
 *   node scripts/batch-capture-screenshots.js --limit 10
 *   node scripts/batch-capture-screenshots.js --all
 */

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
const DATABASE_URL = getEnvValue("DATABASE_URL");

// Parse command line arguments
const args = process.argv.slice(2);
const limitIndex = args.indexOf("--limit");
const LIMIT =
  limitIndex !== -1 && args[limitIndex + 1]
    ? parseInt(args[limitIndex + 1])
    : 10;
const ALL = args.includes("--all");

console.log("🚀 Batch Screenshot Capture\n");
console.log("═".repeat(80));
console.log("📋 Configuration:");
console.log(
  `   Cloudflare Account: ${CLOUDFLARE_ACCOUNT_ID ? "✅ Configured" : "❌ Missing"}`,
);
console.log(
  `   API Token: ${CLOUDFLARE_API_TOKEN ? "✅ Configured" : "❌ Missing"}`,
);
console.log(`   Database: ${DATABASE_URL ? "✅ Configured" : "❌ Missing"}`);
console.log(
  `   Processing: ${ALL ? "ALL pending products" : `Up to ${LIMIT} products`}`,
);
console.log("═".repeat(80));
console.log("");

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !DATABASE_URL) {
  console.error("❌ Missing required configuration in .env.local");
  console.error(
    "   Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and DATABASE_URL",
  );
  process.exit(1);
}

console.log("💡 This script will:");
console.log("   1. Query products with screenshot_status = 'pending'");
console.log("   2. Capture screenshots using Cloudflare API");
console.log("   3. Extract SEO metadata from pages");
console.log("   4. Save screenshots to public/screenshots/");
console.log("   5. Generate thumbnails using sharp");
console.log("   6. Update database with URLs and SEO data");
console.log("");
console.log("⚠️  Note: Each screenshot takes ~7-10 seconds");
console.log(
  `   Estimated time: ${LIMIT * 10} seconds (~${Math.ceil((LIMIT * 10) / 60)} minutes)`,
);
console.log("");
console.log("📝 To run this script:");
console.log("   1. First ensure database migration is complete: pnpm db:push");
console.log(
  "   2. Then run: node scripts/batch-capture-screenshots.js --limit 10",
);
console.log("");
console.log("   Or use TypeScript version:");
console.log("   pnpm tsx scripts/batch-capture-screenshots.ts --limit 10");
console.log("");
console.log("═".repeat(80));
