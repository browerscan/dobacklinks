#!/usr/bin/env node
/**
 * 稳定的 R2 批量上传 - 低并发，带重试
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
const SCREENSHOTS_DIR = "/Volumes/SSD/dev/links/dobacklinks/dobacklinks-screenshots/thumbnails";
const R2_PREFIX = "screenshots/thumbnails/";

console.log("📤 稳定批量上传到 R2 (低并发模式)");
console.log("=".repeat(60));

// 获取所有文件
const files = [];
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith(".webp")) {
      files.push(fullPath);
    }
  }
}
walkDir(SCREENSHOTS_DIR);

console.log(`📁 总共 ${files.length} 个文件\n`);

let uploaded = 0;
let skipped = 0;
let failed = 0;
const startTime = Date.now();

function uploadFile(filePath) {
  return new Promise((resolve) => {
    const relPath = path.relative(SCREENSHOTS_DIR, filePath);
    const key = R2_PREFIX + relPath.replace(/\\/g, "/");
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
          // 文件已存在
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

// 低并发上传 (每批5个)
const CONCURRENT = 5;
const DELAY_MS = 100;

async function batchUpload() {
  for (let i = 0; i < files.length; i += CONCURRENT) {
    const batch = [];
    const end = Math.min(i + CONCURRENT, files.length);

    for (let j = i; j < end; j++) {
      batch.push(uploadFile(files[j]));
    }

    await Promise.all(batch);

    // 添加延迟避免限流
    if (i + CONCURRENT < files.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    const progress = end;
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = Math.round(progress / elapsed);
    const eta = Math.round((files.length - progress) / rate);

    process.stdout.write(
      `\r[${progress}/${files.length}] ✅${uploaded} ⏭️${skipped} ❌${failed} | ${rate}/s | ETA: ${Math.floor(eta / 60)}m ${eta % 60}s   `,
    );
  }

  console.log("\n");
  console.log("=".repeat(60));
  console.log("✅ 上传完成!");
  console.log(`   总计: ${files.length}`);
  console.log(`   成功: ${uploaded}`);
  console.log(`   跳过: ${skipped}`);
  console.log(`   失败: ${failed}`);
  console.log(`   耗时: ${Math.round((Date.now() - startTime) / 1000)}秒`);
  console.log("=".repeat(60));
}

batchUpload().catch(console.error);
