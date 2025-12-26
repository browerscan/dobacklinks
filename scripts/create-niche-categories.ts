// Load environment variables BEFORE any other imports
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

// Category configuration with icons and display order
const NICHE_CONFIG: Record<string, { icon: string; displayOrder: number }> = {
  Technology: { icon: "Cpu", displayOrder: 10 },
  Finance: { icon: "DollarSign", displayOrder: 9 },
  Marketing: { icon: "Megaphone", displayOrder: 8 },
  Business: { icon: "Briefcase", displayOrder: 7 },
  Health: { icon: "Heart", displayOrder: 6 },
  News: { icon: "Newspaper", displayOrder: 5 },
  Lifestyle: { icon: "Sparkles", displayOrder: 4 },
  "Real Estate": { icon: "Home", displayOrder: 3 },
  General: { icon: "Globe", displayOrder: 1 },
};

async function main() {
  // Dynamic imports after env is loaded
  const { db } = await import("@/lib/db");
  const { products, categories, productCategories } = await import("@/lib/db/schema");
  const { eq, sql, and, inArray } = await import("drizzle-orm");
  const slugify = (await import("slugify")).default;

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("🏷️  Niche Categories Script");
  console.log("===========================\n");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  // 1. Get distinct niches from products
  console.log("📊 Analyzing product niches...\n");

  const nicheStats = await db
    .select({
      niche: products.niche,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .where(eq(products.status, "live"))
    .groupBy(products.niche)
    .orderBy(sql`count(*) desc`);

  console.log("Current niche distribution:");
  nicheStats.forEach(({ niche, count }) => {
    console.log(`   ${niche || "NULL"}: ${count} products`);
  });

  // 2. Get existing categories
  const existingCategories = await db.query.categories.findMany();
  const existingBySlug = new Map(existingCategories.map((c) => [c.slug, c]));

  console.log(`\nExisting categories: ${existingCategories.map((c) => c.name).join(", ")}`);

  // 3. Create missing niche categories
  const nichesToCreate = nicheStats
    .filter(({ niche, count }) => {
      if (!niche || count < 5) return false; // Skip null and very small niches
      const slug = slugify(niche, { lower: true, strict: true });
      return !existingBySlug.has(slug);
    })
    .map(({ niche }) => niche!);

  console.log(
    `\nCategories to create: ${nichesToCreate.length > 0 ? nichesToCreate.join(", ") : "None"}`,
  );

  if (!dryRun && nichesToCreate.length > 0) {
    const categoriesToInsert = nichesToCreate.map((niche) => ({
      name: niche,
      slug: slugify(niche, { lower: true, strict: true }),
      icon: NICHE_CONFIG[niche]?.icon || "Folder",
      displayOrder: NICHE_CONFIG[niche]?.displayOrder || 0,
      isActive: true,
    }));

    const inserted = await db.insert(categories).values(categoriesToInsert).returning();
    console.log(`✓ Created ${inserted.length} new categories`);

    // Refresh category map
    inserted.forEach((c) => existingBySlug.set(c.slug, c));
  }

  // 4. Link products to their niche categories
  console.log("\n🔗 Linking products to niche categories...\n");

  // Get all categories again (including new ones)
  const allCategories = await db.query.categories.findMany();
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c]));

  // Get products that need linking
  for (const { niche, count } of nicheStats) {
    if (!niche) continue;

    const slug = slugify(niche, { lower: true, strict: true });
    const category = categoryBySlug.get(slug);

    if (!category) {
      console.log(`   ⏭️  Skipping ${niche} (no category)`);
      continue;
    }

    // Get products in this niche that aren't linked to this category
    const productsInNiche = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.niche, niche), eq(products.status, "live")));

    const productIds = productsInNiche.map((p) => p.id);

    if (productIds.length === 0) {
      console.log(`   ⏭️  Skipping ${niche} (no products)`);
      continue;
    }

    // Check existing links
    const existingLinks = await db
      .select({ productId: productCategories.productId })
      .from(productCategories)
      .where(
        and(
          eq(productCategories.categoryId, category.id),
          inArray(productCategories.productId, productIds),
        ),
      );

    const existingProductIds = new Set(existingLinks.map((l) => l.productId));
    const toLink = productIds.filter((id) => !existingProductIds.has(id));

    if (dryRun) {
      console.log(`   ${niche}: Would link ${toLink.length} products to ${category.name}`);
    } else if (toLink.length > 0) {
      const links = toLink.map((productId) => ({
        productId,
        categoryId: category.id,
      }));

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < links.length; i += batchSize) {
        const batch = links.slice(i, i + batchSize);
        await db.insert(productCategories).values(batch).onConflictDoNothing();
      }

      console.log(`   ✓ ${niche}: Linked ${toLink.length} products`);
    } else {
      console.log(`   ✓ ${niche}: All ${productIds.length} products already linked`);
    }
  }

  // 5. Summary
  console.log("\n📊 Final Category Summary:");
  const finalCategories = await db
    .select({
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
      productCount: sql<number>`(
        SELECT count(*)::int FROM product_categories pc
        JOIN products p ON pc.product_id = p.id
        WHERE pc.category_id = ${categories.id}
        AND p.status = 'live'
      )`,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(sql`4 desc`);

  finalCategories.forEach(({ name, icon, productCount }) => {
    console.log(`   ${icon || "📁"} ${name}: ${productCount} products`);
  });

  console.log("\n✅ Done!");
  if (dryRun) {
    console.log("\nTo execute, run without --dry-run flag.");
  }
}

main().catch(console.error);
