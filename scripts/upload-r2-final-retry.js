#!/usr/bin/env node
/**
 * 最终重试 - 上传所有文件，但使用更长的超时和重试机制
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

console.log("📤 最终重试上传 (更长超时 + 重试机制)");
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
const failedFiles = [];
const startTime = Date.now();

// 带重试的上传函数
async function uploadFileWithRetry(fileName, maxRetries = 3) {
  const key = R2_PREFIX + fileName;
  const filePath = path.join(SCREENSHOTS_DIR, fileName);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadFile(fileName, key, filePath);
      if (result === "success") {
        uploaded++;
        return true;
      } else if (result === "exists") {
        skipped++;
        return true;
      }
      // 如果失败但还有重试次数，继续尝试
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt)); // 指数退避
      }
    } catch (e) {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  // 所有重试都失败
  failed++;
  failedFiles.push(fileName);
  return false;
}

function uploadFile(fileName, key, filePath) {
  return new Promise((resolve, reject) => {
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
          resolve("success");
        } else if (res.statusCode === 409) {
          resolve("exists");
        } else {
          resolve("failed");
        }
      });
    });

    req.on("error", () => {
      resolve("failed");
    });

    req.setTimeout(30000, () => {
      // 30秒超时
      req.destroy();
      resolve("failed");
    });

    req.write(fileContent);
    req.end();
  });
}

async function finalRetry() {
  const CONCURRENT = 3; // 更低的并发
  const DELAY_MS = 200; // 更长的延迟

  for (let i = 0; i < localFiles.length; i += CONCURRENT) {
    const batch = [];
    const end = Math.min(i + CONCURRENT, localFiles.length);

    for (let j = i; j < end; j++) {
      batch.push(uploadFileWithRetry(localFiles[j]));
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

  if (failedFiles.length > 0) {
    console.log(`\n❌ 失败文件列表:`);
    failedFiles.forEach((f) => console.log(`   - ${f}`));
  }
  console.log("=".repeat(60));
}

finalRetry().catch(console.error);
