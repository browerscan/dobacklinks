#!/usr/bin/env node
/**
 * Bulk upload new screenshots to R2 (parallel)
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BUCKET = "dobacklinks";
const PARALLEL = 5; // Upload 5 files at a time
const CUTOFF_HOURS = 24;

async function getNewScreenshots() {
  const cutoffTime = Date.now() - CUTOFF_HOURS * 60 * 60 * 1000;
  const screenshots = [];

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (file.endsWith(".webp") && stat.mtimeMs > cutoffTime) {
        screenshots.push(fullPath);
      }
    }
  }

  walkDir("public/screenshots");
  return screenshots;
}

async function uploadFile(filePath) {
  const key = filePath.replace("public/", "");
  try {
    execSync(
      `npx wrangler r2 object put ${BUCKET}/${key} --file=${filePath} --content-type=image/webp --remote`,
      { stdio: "pipe" },
    );
    return { success: true, key };
  } catch (error) {
    return { success: false, key, error: error.message };
  }
}

async function uploadBatch(files) {
  const promises = files.map((file) => uploadFile(file));
  return Promise.all(promises);
}

async function main() {
  console.log("📤 Bulk Screenshot Upload to R2\n");

  console.log(`🔍 Finding screenshots modified in last ${CUTOFF_HOURS}h...`);
  const files = await getNewScreenshots();
  console.log(`   Found ${files.length} files\n`);

  if (files.length === 0) {
    console.log("✅ No new files to upload!");
    return;
  }

  let uploaded = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i += PARALLEL) {
    const batch = files.slice(i, i + PARALLEL);
    process.stdout.write(`\r📤 Uploading... ${uploaded + failed}/${files.length}`);

    const results = await uploadBatch(batch);
    for (const result of results) {
      if (result.success) {
        uploaded++;
      } else {
        failed++;
        console.error(`\n❌ Failed: ${result.key}`);
      }
    }
  }

  console.log(`\n\n✅ Upload complete!`);
  console.log(`   Uploaded: ${uploaded}`);
  console.log(`   Failed: ${failed}`);
}

main().catch(console.error);
