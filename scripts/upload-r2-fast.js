#!/usr/bin/env node
/**
 * 快速批量上传到 R2 - 不检查文件是否存在，直接上传
 * 如果文件已存在，R2会自动覆盖
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
const SCREENSHOTS_DIR = "public/screenshots/thumbnails";
const R2_PREFIX = "screenshots/thumbnails/";

console.log("📤 快速批量上传到 R2");
console.log("=".repeat(60));
console.log(`Account: ${ACCOUNT_ID?.substring(0, 15)}...`);
console.log(`Bucket: ${BUCKET_NAME}`);
console.log("=".repeat(60));

const files = fs
  .readdirSync(SCREENSHOTS_DIR, { recursive: true })
  .filter((f) => f.endsWith(".webp"))
  .map((f) => path.join(SCREENSHOTS_DIR, f));

console.log(`📁 总共 ${files.length} 个文件\n`);

let uploaded = 0;
let failed = 0;
const startTime = Date.now();

// 使用 Promise 批量上传
function uploadFile(filePath, index) {
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
        } else {
          failed++;
        }
        resolve();
      });
    });

    req.on("error", () => {
      failed++;
      resolve();
    });

    req.write(fileContent);
    req.end();
  });
}

// 并发上传
const CONCURRENT = 20;
async function batchUpload() {
  for (let i = 0; i < files.length; i += CONCURRENT) {
    const batch = files.slice(i, i + CONCURRENT).map((f, idx) => uploadFile(f, i + idx));
    await Promise.all(batch);

    const progress = Math.min(i + CONCURRENT, files.length);
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = Math.round(progress / elapsed);
    const eta = Math.round((files.length - progress) / rate);

    process.stdout.write(
      `\r[${progress}/${files.length}] ✅${uploaded} ❌${failed} | ${rate}/s | ETA: ${eta}s   `,
    );
  }

  console.log("\n");
  console.log("=".repeat(60));
  console.log("✅ 上传完成!");
  console.log(`   总计: ${files.length}`);
  console.log(`   成功: ${uploaded}`);
  console.log(`   失败: ${failed}`);
  console.log(`   耗时: ${Math.round((Date.now() - startTime) / 1000)}秒`);
  console.log("=".repeat(60));
}

batchUpload().catch(console.error);
