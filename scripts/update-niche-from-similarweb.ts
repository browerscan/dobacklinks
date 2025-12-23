/**
 * Update product niche based on SimilarWeb category data
 * Maps SimilarWeb categories to our niche system
 */

import { db } from "../lib/db";
import { products } from "../lib/db/schema";
import { sql, eq, isNotNull, and } from "drizzle-orm";

// Map SimilarWeb main categories to our niche values
const CATEGORY_TO_NICHE: Record<string, string | null> = {
  // Technology
  computers_electronics_and_technology: "Technology",
  games: "Technology",

  // News & Media
  news_and_media: "News",

  // Finance
  finance: "Finance",

  // Health
  health: "Health",

  // Lifestyle
  lifestyle: "Lifestyle",
  food_and_drink: "Lifestyle",
  home_and_garden: "Lifestyle",
  travel_and_tourism: "Lifestyle",
  hobbies_and_leisure: "Lifestyle",
  pets_and_animals: "Lifestyle",

  // Business
  business_and_consumer_services: "Business",
  jobs_and_career: "Business",
  "e-commerce_and_shopping": "Business",

  // Marketing (from subcategories)
  // Will be handled separately

  // Real Estate
  heavy_industry_and_engineering: "Real Estate", // includes architecture

  // Arts & Entertainment -> General or Lifestyle
  arts_and_entertainment: "Lifestyle",
  sports: "Lifestyle",

  // Education & Reference
  science_and_education: "Technology",
  reference_materials: "General",

  // Community & Law
  community_and_society: "General",
  law_and_government: "General",
  vehicles: "General",

  // Adult - skip
  adult: null,
};

// Subcategory overrides (more specific mappings)
const SUBCATEGORY_TO_NICHE: Record<string, string> = {
  online_marketing: "Marketing",
  seo: "Marketing",
  programming_and_developer_software: "Technology",
  investing: "Finance",
  architecture: "Real Estate",
};

async function updateNicheFromSimilarWeb() {
  console.log("🔄 Starting niche update from SimilarWeb categories...\n");

  // Get all products with SimilarWeb category data
  const productsWithCategory = await db
    .select({
      id: products.id,
      name: products.name,
      currentNiche: products.niche,
      similarwebData: products.similarwebData,
    })
    .from(products)
    .where(
      and(
        eq(products.enrichmentStatus, "enriched"),
        isNotNull(products.similarwebData),
      ),
    );

  console.log(`📊 Found ${productsWithCategory.length} enriched products\n`);

  let updated = 0;
  let skipped = 0;
  let noCategory = 0;
  const updates: { id: string; name: string; from: string; to: string }[] = [];

  for (const product of productsWithCategory) {
    const swData = product.similarwebData as { category?: string } | null;
    const category = swData?.category;

    if (!category || category === "null") {
      noCategory++;
      continue;
    }

    // Parse category
    const parts = category.split("/");
    const mainCategory = parts[0];
    const subCategory = parts.length > 1 ? parts[parts.length - 1] : null;

    // Check subcategory first for more specific match
    let newNiche: string | null = null;
    if (subCategory && SUBCATEGORY_TO_NICHE[subCategory]) {
      newNiche = SUBCATEGORY_TO_NICHE[subCategory];
    } else if (CATEGORY_TO_NICHE[mainCategory] !== undefined) {
      newNiche = CATEGORY_TO_NICHE[mainCategory];
    }

    // Skip if no mapping or already correct
    if (!newNiche) {
      skipped++;
      continue;
    }

    if (product.currentNiche === newNiche) {
      skipped++;
      continue;
    }

    // Only update if current niche is "General" (inferred) or different
    if (
      product.currentNiche !== "General" &&
      product.currentNiche !== newNiche
    ) {
      // Keep manually set niches, but track for review
      console.log(
        `⚠️  ${product.name}: ${product.currentNiche} → ${newNiche} (keeping original)`,
      );
      skipped++;
      continue;
    }

    updates.push({
      id: product.id,
      name: product.name,
      from: product.currentNiche || "General",
      to: newNiche,
    });
  }

  console.log(`\n📝 Will update ${updates.length} products:\n`);

  // Group by niche change for summary
  const summary: Record<string, number> = {};
  for (const u of updates) {
    const key = `${u.from} → ${u.to}`;
    summary[key] = (summary[key] || 0) + 1;
  }

  for (const [change, count] of Object.entries(summary).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${change}: ${count}`);
  }

  // Check for dry run
  const isDryRun = process.argv.includes("--dry-run");

  if (isDryRun) {
    console.log("\n🔍 DRY RUN - No changes made\n");
    console.log("Run without --dry-run to apply changes");
    return;
  }

  // Apply updates in batches
  console.log("\n🚀 Applying updates...\n");

  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    for (const update of batch) {
      await db
        .update(products)
        .set({ niche: update.to })
        .where(eq(products.id, update.id));
      updated++;
    }

    console.log(
      `  ✓ Updated ${Math.min(i + batchSize, updates.length)}/${updates.length}`,
    );
  }

  console.log(`
✅ Update complete!
   - Updated: ${updated}
   - Skipped: ${skipped}
   - No category: ${noCategory}
`);
}

updateNicheFromSimilarWeb()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
