#!/usr/bin/env node
/**
 * 简单重试上传 - 直接上传，409 错误跳过
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
};

const ACCOUNT_ID = getEnvValue("CLOUDFLARE_ACCOUNT_ID");
const API_TOKEN = getEnvValue("CLOUDFLARE_API_TOKEN");
const BUCKET_NAME = "dobacklinks";
const SCREENSHOTS_DIR =
  "/Volumes/SSD/dev/links/dobacklinks/dobacklinks-screenshots/thumbnails";
const R2_PREFIX = "screenshots/thumbnails/";

console.log("📤 R2 重试上传 (自动跳过已存在文件)");
console.log("=".repeat(60));

// 获取所有本地文件
const localFiles = [];
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.endsWith(".webp")) {
      localFiles.push(entry.name);
    }
  }
}
walkDir(SCREENSHOTS_DIR);

console.log(`📁 本地文件: ${localFiles.length} 个\n`);

let uploaded = 0;
let skipped = 0;
let failed = 0;
const startTime = Date.now();

function uploadFile(fileName) {
  return new Promise((resolve) => {
    const key = R2_PREFIX + fileName;
    const filePath = path.join(SCREENSHOTS_DIR, fileName);
    const fileContent = fs.readFileSync(filePath);

    const options = {
      hostname: "api.cloudflare.com",
      port: 443,
      path: `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${key}`,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "image/webp",
        "Content-Length": fileContent.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          uploaded++;
          resolve(true);
        } else if (res.statusCode === 409) {
          skipped++;
          resolve(true);
        } else {
          failed++;
          resolve(false);
        }
      });
    });

    req.on("error", () => {
      failed++;
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      failed++;
      resolve(false);
    });

    req.write(fileContent);
    req.end();
  });
}

async function retryUpload() {
  const CONCURRENT = 5;
  const DELAY_MS = 100;

  for (let i = 0; i < localFiles.length; i += CONCURRENT) {
    const batch = [];
    const end = Math.min(i + CONCURRENT, localFiles.length);

    for (let j = i; j < end; j++) {
      batch.push(uploadFile(localFiles[j]));
    }

    await Promise.all(batch);

    if (i + CONCURRENT < localFiles.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    const totalProcessed = uploaded + skipped + failed;
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = Math.round(totalProcessed / elapsed);
    const eta = Math.round((localFiles.length - totalProcessed) / rate);

    process.stdout.write(
      `\r[${totalProcessed}/${localFiles.length}] ✅${uploaded} ⏭️${skipped} ❌${failed} | ${rate}/s | ETA: ${Math.floor(eta / 60)}m ${eta % 60}s   `,
    );
  }

  console.log("\n");
  console.log("=".repeat(60));
  console.log("✅ 上传完成!");
  console.log(`   本地文件: ${localFiles.length}`);
  console.log(`   新上传: ${uploaded}`);
  console.log(`   已存在跳过: ${skipped}`);
  console.log(`   失败: ${failed}`);
  console.log(`   总耗时: ${Math.round((Date.now() - startTime) / 1000)}秒`);
  console.log("=".repeat(60));
}

retryUpload().catch(console.error);
