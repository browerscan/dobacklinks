import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { listR2Objects } from "../lib/cloudflare/r2";

async function checkScreenshot() {
  console.log("Checking R2 for healthreviewboard screenshot...\n");

  const result = await listR2Objects({
    prefix: "screenshots/thumbnails/healthreviewboard",
    pageSize: 10,
  });

  if (result.error) {
    console.error("Error:", result.error);
    return;
  }

  console.log(`Found ${result.objects.length} objects:\n`);

  result.objects.forEach((obj) => {
    console.log(`- ${obj.key}`);
    console.log(`  URL: ${obj.url}`);
    console.log(`  Size: ${(obj.size || 0) / 1024} KB`);
    console.log(`  Modified: ${obj.lastModified}\n`);
  });

  if (result.objects.length === 0) {
    console.log("❌ No screenshots found for healthreviewboard");
    console.log("The screenshot needs to be captured and uploaded to R2.");
  }
}

checkScreenshot().catch(console.error);
