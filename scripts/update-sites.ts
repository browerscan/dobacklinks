// Load environment variables BEFORE any other imports
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

const DEFAULT_SOURCE =
  "/Volumes/SSD/dev/links/dobacklinks/scraper/active-sites-incremental.json";

async function main() {
  const { updateSites } = await import("../lib/import/update-sites");

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sourceIndex = args.indexOf("--source");
  const sourcePath =
    sourceIndex !== -1 ? args[sourceIndex + 1] : DEFAULT_SOURCE;

  console.log("🔄 Site Update Script");
  console.log("=====================\n");
  console.log(`Source: ${sourcePath}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  if (!dryRun) {
    console.log("⚠️  This will update existing products and add new ones.");
    console.log("   Run with --dry-run first to preview changes.\n");
  }

  try {
    const stats = await updateSites({
      sourcePath,
      batchSize: 50,
      dryRun,
      liveThreshold: 70,
      topLiveCount: 500,
    });

    console.log("\n✅ Update complete!");
    if (dryRun) {
      console.log("\nTo execute the update, run without --dry-run flag.");
    }
  } catch (error) {
    console.error("❌ Update failed:", error);
    process.exit(1);
  }
}

main();
