/**
 * Test script for SimilarWeb enrichment service
 *
 * Usage:
 *   pnpm tsx scripts/test-enrichment.ts
 */

// Load environment variables
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { getEnrichmentService } from "../lib/services/enrichment-service";
import { db } from "../lib/db";
import { products } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function testEnrichmentService() {
  console.log("🧪 Testing SimilarWeb Enrichment Service\n");

  const service = getEnrichmentService();

  try {
    // Test 1: Get statistics
    console.log("📊 Test 1: Getting enrichment statistics...");
    const stats = await service.getEnrichmentStats();
    console.log("✅ Statistics retrieved:");
    console.log(`   Total products: ${stats.total}`);
    console.log(`   Pending: ${stats.pending} (${stats.pendingPercentage}%)`);
    console.log(`   Enriched: ${stats.enriched} (${stats.enrichedPercentage}%)`);
    console.log(`   Failed: ${stats.failed} (${stats.failedPercentage}%)`);
    console.log(`   Last enriched: ${stats.lastEnrichedAt || "Never"}\n`);

    if (stats.pending === 0) {
      console.log("⚠️  No pending products to test enrichment.\n");
      console.log("💡 To test enrichment, reset some products:");
      console.log("   1. Find enriched/failed products in database");
      console.log('   2. Set enrichmentStatus = "pending"');
      console.log("   3. Run this script again\n");
      return;
    }

    // Test 2: Get a few pending products
    console.log("📋 Test 2: Fetching pending products...");
    const pendingProducts = await db.query.products.findMany({
      where: eq(products.enrichmentStatus, "pending"),
      limit: 5,
    });

    console.log(`✅ Found ${pendingProducts.length} pending products (showing first 5):`);
    pendingProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.url})`);
    });
    console.log();

    // Test 3: Enrich a single product
    if (pendingProducts.length > 0) {
      console.log("🔍 Test 3: Enriching a single product...");
      const testProduct = pendingProducts[0];
      console.log(`   Testing with: ${testProduct.name} (${testProduct.url})`);

      const startTime = Date.now();
      const result = await service.enrichSingleProduct(testProduct.id);
      const duration = Date.now() - startTime;

      if (result.success) {
        console.log("✅ Enrichment completed:");
        console.log(`   Enriched: ${result.stats.enriched}`);
        console.log(`   Failed: ${result.stats.failed}`);
        console.log(`   Duration: ${duration}ms`);

        // Verify the product was updated
        const updated = await db.query.products.findFirst({
          where: eq(products.id, testProduct.id),
        });

        if (updated) {
          console.log(`   Status: ${updated.enrichmentStatus}`);
          if (updated.enrichmentStatus === "enriched") {
            console.log(`   Monthly visits: ${updated.monthlyVisits?.toLocaleString() || "N/A"}`);
            console.log(`   Global rank: ${updated.globalRank?.toLocaleString() || "N/A"}`);
          }
        }
      } else {
        console.log(`❌ Enrichment failed: ${result.error}`);
      }
      console.log();
    }

    // Test 4: Batch enrichment (small batch)
    console.log("🔄 Test 4: Testing batch enrichment (5 products)...");
    console.log("   Note: This will process up to 5 pending products");

    const batchResult = await service.enrichProducts(
      "pending",
      (progress) => {
        console.log(
          `   Progress: ${progress.processed}/${progress.total} - Enriched: ${progress.enriched}, Failed: ${progress.failed}`,
        );
      },
      5, // Limit to 5 for testing
    );

    if (batchResult.success) {
      console.log("✅ Batch enrichment completed:");
      console.log(`   Total processed: ${batchResult.stats.total}`);
      console.log(`   Enriched: ${batchResult.stats.enriched}`);
      console.log(`   Failed: ${batchResult.stats.failed}`);
      console.log(`   Duration: ${batchResult.stats.duration}ms`);
      if (batchResult.failedDomains && batchResult.failedDomains.length > 0) {
        console.log(`   Failed domains: ${batchResult.failedDomains.join(", ")}`);
      }
    } else {
      console.log(`❌ Batch enrichment failed: ${batchResult.error}`);
    }
    console.log();

    // Final statistics
    console.log("📊 Final statistics after tests:");
    const finalStats = await service.getEnrichmentStats();
    console.log(`   Total products: ${finalStats.total}`);
    console.log(`   Pending: ${finalStats.pending} (${finalStats.pendingPercentage}%)`);
    console.log(`   Enriched: ${finalStats.enriched} (${finalStats.enrichedPercentage}%)`);
    console.log(`   Failed: ${finalStats.failed} (${finalStats.failedPercentage}%)`);
    console.log();

    console.log("🎉 All tests completed!\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testEnrichmentService()
  .then(() => {
    console.log("✅ Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });
