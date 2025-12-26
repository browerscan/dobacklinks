#!/usr/bin/env node
/**
 * 智能 R2 上传 - 先检查已存在文件，避免重复上传
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

console.log("📤 智能 R2 批量上传 (检查已存在文件)");
console.log("=".repeat(60));

// 获取所有本地文件
const localFiles = new Set();
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.endsWith(".webp")) {
      localFiles.add(entry.name);
    }
  }
}
walkDir(SCREENSHOTS_DIR);

console.log(`📁 本地文件: ${localFiles.size} 个\n`);

// 第一步：获取 R2 中已存在的文件列表
console.log("🔍 检查 R2 中已存在的文件...");

function listR2Objects(continuationToken = null, allKeys = []) {
  return new Promise((resolve, reject) => {
    let url = `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects?prefix=${R2_PREFIX}`;
    if (continuationToken) {
      url += `&cursor=${encodeURIComponent(continuationToken)}`;
    }

    const options = {
      hostname: "api.cloudflare.com",
      port: 443,
      path: url,
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(body);
            // Debug: 输出第一个结果看看结构
            if (data.result && data.result.length > 0 && !process.env.DEBUGGED) {
              console.log(`📋 R2 API 返回示例:`, JSON.stringify(data.result[0]).substring(0, 200));
              process.env.DEBUGGED = "1";
            }
            const keys = (data.result || [])
              .map((obj) => {
                // 提取文件名（去掉路径前缀）
                const key = obj.Key || obj.key || obj.name;
                if (!key) return null;
                if (key.startsWith(R2_PREFIX)) {
                  return key.substring(R2_PREFIX.length);
                }
                return key;
              })
              .filter(Boolean);

            allKeys.push(...keys);

            // 检查是否有更多结果
            if (data.result_info && data.result_info.cursor) {
              listR2Objects(data.result_info.cursor, allKeys).then(resolve).catch(reject);
            } else {
              resolve(allKeys);
            }
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`API Error: ${res.statusCode}`));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
    req.end();
  });
}

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

async function smartUpload() {
  try {
    // 获取 R2 中已有的文件
    const existingFiles = new Set(await listR2Objects());
    console.log(`✅ R2 中已存在: ${existingFiles.size} 个文件\n`);

    // 找出需要上传的文件
    const filesToUpload = [...localFiles].filter((f) => !existingFiles.has(f));
    console.log(`📤 需要上传: ${filesToUpload.length} 个新文件`);
    console.log(`⏭️  将跳过: ${localFiles.size - filesToUpload.length} 个已存在文件\n`);

    if (filesToUpload.length === 0) {
      console.log("✅ 所有文件已存在，无需上传！");
      return;
    }

    // 低并发上传
    const CONCURRENT = 10;
    const DELAY_MS = 50;

    for (let i = 0; i < filesToUpload.length; i += CONCURRENT) {
      const batch = [];
      const end = Math.min(i + CONCURRENT, filesToUpload.length);

      for (let j = i; j < end; j++) {
        batch.push(uploadFile(filesToUpload[j]));
      }

      await Promise.all(batch);

      if (i + CONCURRENT < filesToUpload.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }

      const totalProcessed = uploaded + skipped + failed;
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = Math.round(totalProcessed / elapsed);
      const eta = Math.round((filesToUpload.length - totalProcessed) / rate);

      process.stdout.write(
        `\r[${totalProcessed}/${filesToUpload.length}] ✅${uploaded} ⏭️${skipped} ❌${failed} | ${rate}/s | ETA: ${Math.floor(eta / 60)}m ${eta % 60}s   `,
      );
    }

    console.log("\n");
    console.log("=".repeat(60));
    console.log("✅ 上传完成!");
    console.log(`   本次处理: ${filesToUpload.length}`);
    console.log(`   成功上传: ${uploaded}`);
    console.log(`   跳过已存在: ${skipped}`);
    console.log(`   失败: ${failed}`);
    console.log(`   总耗时: ${Math.round((Date.now() - startTime) / 1000)}秒`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ 错误:", error.message);
    process.exit(1);
  }
}

smartUpload().catch(console.error);
