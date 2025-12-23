// Load environment variables BEFORE any other imports
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

// Now dynamically import the rest
async function main() {
  const { importSites } = await import("../lib/import/import-sites");

  const sourcePath =
    process.env.SOURCE_PATH ||
    "/Volumes/SSD/dev/links/dobacklinks/scraper/active-sites-complete.json";

  const dryRun = process.argv.includes("--dry-run");
  const batchSize = parseInt(process.env.BATCH_SIZE || "50");

  console.log("🚀 Guest Post Sites Import\n");

  try {
    const result = await importSites({
      sourcePath,
      batchSize,
      dryRun,
      liveThreshold: 70,
      topLiveCount: 500,
    });

    console.log("\n✅ Import completed successfully!");
    console.log(`   Imported: ${result.imported}`);
    console.log(`   Failed: ${result.failed || 0}`);
    console.log(`   Live: ${result.liveCount}`);
    console.log(`   Pending: ${result.pendingCount}`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  }
}

main();
