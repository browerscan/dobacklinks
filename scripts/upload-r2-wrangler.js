#!/usr/bin/env node
/**
 * Upload images to Cloudflare R2 using wrangler CLI
 *
 * This script uses wrangler CLI to upload files to R2.
 * Wrangler will use your existing Cloudflare authentication.
 *
 * Prerequisites:
 *   1. Install wrangler: npm install -g wrangler
 *   2. Authenticate: wrangler login (opens browser)
 *   3. Set R2_BUCKET_NAME in .env.local
 *
 * Usage:
 *   node scripts/upload-r2-wrangler.js
 *   node scripts/upload-r2-wrangler.js --dir public/screenshots/thumbnails
 *   node scripts/upload-r2-wrangler.js --file public/screenshots/test.png
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, "utf-8")
  : "";

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
};

const CLOUDFLARE_ACCOUNT_ID = getEnvValue("CLOUDFLARE_ACCOUNT_ID");
const R2_BUCKET_NAME = getEnvValue("R2_BUCKET_NAME") || "dobacklinks";

// Default settings
const DEFAULT_SCREENSHOTS_DIR =
  "/Volumes/SSD/dev/links/dobacklinks/dobacklinks-screenshots/thumbnails";

// Parse command line args
const args = process.argv.slice(2);
let targetDir = DEFAULT_SCREENSHOTS_DIR;
let singleFile = null;
let dryRun = false;
let skipExisting = true;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dir" && args[i + 1]) {
    targetDir = args[i + 1];
    i++;
  } else if (args[i] === "--file" && args[i + 1]) {
    singleFile = args[i + 1];
    i++;
  } else if (args[i] === "--dry-run" || args[i] === "-n") {
    dryRun = true;
  } else if (args[i] === "--force") {
    skipExisting = false;
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
Usage: node scripts/upload-r2-wrangler.js [options]

Options:
  --dir <path>     Directory to upload (default: public/screenshots/thumbnails)
  --file <path>    Upload a single file
  --dry-run, -n    Show what would be uploaded without uploading
  --force          Upload all files, even if they might exist already
  --help, -h       Show this help

Prerequisites:
  1. Install wrangler: npm install -g wrangler
  2. Authenticate: wrangler login
  3. Set R2_BUCKET_NAME in .env.local

Examples:
  node scripts/upload-r2-wrangler.js
  node scripts/upload-r2-wrangler.js --dir public/screenshots/full
  node scripts/upload-r2-wrangler.js --file public/images/logo.png --dry-run
    `);
    process.exit(0);
  }
}

console.log("📤 R2 Upload Tool (wrangler CLI)\n");
console.log("═".repeat(80));
console.log("Configuration:");
console.log(
  `   Account ID: ${CLOUDFLARE_ACCOUNT_ID ? "✅ " + CLOUDFLARE_ACCOUNT_ID.substring(0, 10) + "..." : "❌ Missing"}`,
);
console.log(`   Bucket: ${R2_BUCKET_NAME}`);
console.log(`   Target: ${singleFile || targetDir}`);
console.log(
  `   Mode: ${dryRun ? "DRY RUN (no uploads)" : skipExisting ? "Skip existing" : "Force upload"}`,
);
console.log("═".repeat(80));
console.log("");

if (!CLOUDFLARE_ACCOUNT_ID) {
  console.error("❌ CLOUDFLARE_ACCOUNT_ID not set in .env.local");
  process.exit(1);
}

// Check if wrangler is installed
try {
  execSync("wrangler --version", { stdio: "pipe" });
} catch (e) {
  console.error("❌ wrangler CLI not found!");
  console.error("   Install it: npm install -g wrangler");
  console.error("   Then authenticate: wrangler login");
  process.exit(1);
}

/**
 * Upload a single file using wrangler
 */
function uploadFile(filePath, r2Key) {
  const fullKey = `${R2_BUCKET_NAME}/${r2Key}`;

  if (dryRun) {
    return { success: true, key: r2Key, dryRun: true };
  }

  try {
    execSync(
      `wrangler r2 object put "${fullKey}" --file="${filePath}" --remote`,
      { stdio: "pipe" },
    );
    return { success: true, key: r2Key };
  } catch (e) {
    return { success: false, key: r2Key, error: e.message };
  }
}

/**
 * Check if a file exists in R2
 */
function checkFileExists(r2Key) {
  const fullKey = `${R2_BUCKET_NAME}/${r2Key}`;

  try {
    execSync(`wrangler r2 object get "${fullKey}" --file=/dev/null --remote`, {
      stdio: "pipe",
    });
    return true;
  } catch (e) {
    return false;
  }
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
          if (
            [
              ".png",
              ".jpg",
              ".jpeg",
              ".gif",
              ".webp",
              ".svg",
              ".avif",
            ].includes(ext)
          ) {
            const relPath = path.relative(baseDir, fullPath);
            // Use forward slashes for R2 keys
            const r2Key = relPath.split(path.sep).join("/");
            files.push({ path: fullPath, key: r2Key });
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

  // Upload files
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const failed = [];

  for (let i = 0; i < files.length; i++) {
    const { path: filePath, key } = files[i];
    const filename = path.basename(filePath);
    const r2Key = `screenshots/thumbnails/${key}`;

    // Check if file already exists
    if (skipExisting && !dryRun) {
      const exists = checkFileExists(r2Key);
      if (exists) {
        skippedCount++;
        process.stdout.write(
          `\r⏭️  ${i + 1}/${files.length} | Skipped: ${skippedCount} | Uploaded: ${successCount}      `,
        );
        continue;
      }
    }

    const result = uploadFile(filePath, r2Key);

    if (result.success) {
      if (!dryRun) successCount++;
      const status = dryRun ? "[DRY RUN] " : "";
      process.stdout.write(
        `\r${status}✅ ${i + 1}/${files.length} | Uploaded: ${successCount} | Skipped: ${skippedCount}      `,
      );
    } else {
      failedCount++;
      failed.push({ filename, error: result.error });
    }

    // Small delay to avoid rate limiting
    if (i < files.length - 1 && !dryRun) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  console.log("\n");
  console.log("═".repeat(80));
  console.log("📊 Upload Summary");
  console.log("═".repeat(80));
  console.log(`   Total files: ${files.length}`);
  if (dryRun) {
    console.log(`   [DRY RUN] Would upload: ${files.length}`);
  } else {
    console.log(`   ✅ Uploaded: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
  }
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  if (failed.length > 0) {
    console.log("\n❌ Failed uploads:");
    failed.slice(0, 10).forEach((f) => {
      console.log(`   - ${f.filename}`);
    });
    if (failed.length > 10) {
      console.log(`   ... and ${failed.length - 10} more`);
    }
  }

  console.log("\n✅ Done!");
  if (successCount > 0) {
    console.log(
      `\nAccess your files at: https://pub-${R2_BUCKET_NAME}.r2.dev/`,
    );
  }
  console.log("═".repeat(80));
}

main().catch(console.error);
