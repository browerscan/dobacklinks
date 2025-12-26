#!/usr/bin/env node
/**
 * Upload images to Cloudflare R2 using Cloudflare API
 *
 * This script uploads local images to R2 storage using the Cloudflare API.
 * No R2 Access Keys required - uses your existing CLOUDFLARE_API_TOKEN.
 *
 * Usage:
 *   node scripts/upload-to-r2.js
 *   node scripts/upload-to-r2.js --dir public/screenshots/thumbnails
 *   node scripts/upload-to-r2.js --file public/screenshots/test.png
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
};

const CLOUDFLARE_ACCOUNT_ID = getEnvValue("CLOUDFLARE_ACCOUNT_ID");
const CLOUDFLARE_API_TOKEN = getEnvValue("CLOUDFLARE_API_TOKEN");
const R2_BUCKET_NAME = getEnvValue("R2_BUCKET_NAME") || "dobacklinks";

// Default settings
const DEFAULT_SCREENSHOTS_DIR = "public/screenshots/thumbnails";
const R2_PREFIX = "screenshots/thumbnails/";

// Parse command line args
const args = process.argv.slice(2);
let targetDir = DEFAULT_SCREENSHOTS_DIR;
let singleFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dir" && args[i + 1]) {
    targetDir = args[i + 1];
    i++;
  } else if (args[i] === "--file" && args[i + 1]) {
    singleFile = args[i + 1];
    i++;
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
Usage: node scripts/upload-to-r2.js [options]

Options:
  --dir <path>     Directory to upload (default: public/screenshots/thumbnails)
  --file <path>    Upload a single file
  --help, -h       Show this help

Examples:
  node scripts/upload-to-r2.js
  node scripts/upload-to-r2.js --dir public/screenshots/full
  node scripts/upload-to-r2.js --file public/images/logo.png
    `);
    process.exit(0);
  }
}

console.log("📤 Cloudflare R2 Upload Tool\n");
console.log("═".repeat(80));
console.log("Configuration:");
console.log(
  `   Account ID: ${CLOUDFLARE_ACCOUNT_ID ? "✅ " + CLOUDFLARE_ACCOUNT_ID.substring(0, 10) + "..." : "❌ Missing"}`,
);
console.log(`   API Token: ${CLOUDFLARE_API_TOKEN ? "✅ Found" : "❌ Missing"}`);
console.log(`   Bucket: ${R2_BUCKET_NAME}`);
console.log(`   Target: ${singleFile || targetDir}`);
console.log("═".repeat(80));
console.log("");

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error("❌ Missing credentials in .env.local");
  console.error("   Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN");
  process.exit(1);
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".avif": "image/avif",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Upload a single file to R2 using Cloudflare API
 */
function uploadFile(filePath, r2Key) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);

    const endpoint = `/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${r2Key}`;
    const url = new URL(endpoint, "https://api.cloudflare.com");

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": mimeType,
        "Content-Length": Buffer.byteLength(fileContent),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));

      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, key: r2Key, size: fileContent.length });
        } else {
          resolve({
            success: false,
            key: r2Key,
            error: `HTTP ${res.statusCode}: ${body}`,
          });
        }
      });
    });

    req.on("error", (error) => {
      resolve({ success: false, key: r2Key, error: error.message });
    });

    req.write(fileContent);
    req.end();
  });
}

/**
 * Check if a file exists in R2
 */
function checkFileExists(r2Key) {
  return new Promise((resolve) => {
    const endpoint = `/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${r2Key}`;
    const url = new URL(endpoint, "https://api.cloudflare.com");

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: "HEAD",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on("error", () => resolve(false));
    req.end();
  });
}

/**
 * Main upload function
 */
async function main() {
  const startTime = Date.now();

  // Collect files to upload
  let files = [];

  if (singleFile) {
    if (!fs.existsSync(singleFile)) {
      console.error(`❌ File not found: ${singleFile}`);
      process.exit(1);
    }
    files.push({ path: singleFile, key: path.basename(singleFile) });
  } else {
    const dirPath = path.resolve(targetDir);
    if (!fs.existsSync(dirPath)) {
      console.error(`❌ Directory not found: ${targetDir}`);
      process.exit(1);
    }

    // Collect all image files
    const walkDir = (dir, baseDir = dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath, baseDir);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"].includes(ext)) {
            const relPath = path.relative(baseDir, fullPath);
            files.push({ path: fullPath, key: R2_PREFIX + relPath });
          }
        }
      }
    };

    walkDir(dirPath);
  }

  if (files.length === 0) {
    console.log("❌ No image files found to upload");
    process.exit(0);
  }

  console.log(`📊 Found ${files.length} file(s) to upload`);
  console.log("");

  // Upload files sequentially (R2 API has rate limits)
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const failed = [];

  for (let i = 0; i < files.length; i++) {
    const { path: filePath, key } = files[i];
    const filename = path.basename(filePath);

    // Check if file already exists
    const exists = await checkFileExists(key);
    if (exists && !singleFile) {
      skippedCount++;
      process.stdout.write(
        `\r⏭️  ${i + 1}/${files.length} | Skipped: ${skippedCount} | Uploaded: ${successCount}`,
      );
      continue;
    }

    const result = await uploadFile(filePath, key);

    if (result.success) {
      successCount++;
      const sizeKB = (result.size / 1024).toFixed(1);
      process.stdout.write(
        `\r✅ ${i + 1}/${files.length} | Uploaded: ${successCount} | Skipped: ${skippedCount} | Size: ${sizeKB} KB      `,
      );
    } else {
      failedCount++;
      failed.push({ filename, error: result.error });
    }

    // Small delay to avoid rate limiting
    if (i < files.length - 1) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  console.log("\n");
  console.log("═".repeat(80));
  console.log("📊 Upload Summary");
  console.log("═".repeat(80));
  console.log(`   Total files: ${files.length}`);
  console.log(`   ✅ Uploaded: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  if (failed.length > 0) {
    console.log("\n❌ Failed uploads:");
    failed.slice(0, 10).forEach((f) => {
      console.log(`   - ${f.filename}: ${f.error}`);
    });
    if (failed.length > 10) {
      console.log(`   ... and ${failed.length - 10} more`);
    }
  }

  console.log("\n✅ Done!");
  console.log(`\nPublic URL format: https://${R2_BUCKET_NAME}.r2.dev/<key>`);
  console.log("═".repeat(80));
}

main().catch(console.error);
