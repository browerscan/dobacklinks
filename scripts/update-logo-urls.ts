// Load environment variables BEFORE any other imports
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

// Now dynamically import the rest
async function main() {
  const { db } = await import("../lib/db");
  const { products } = await import("../lib/db/schema");
  const { sql } = await import("drizzle-orm");

  console.log("🔄 Starting logo URL migration...\n");

  try {
    // Update all products that use Clearbit logo URLs
    const result = await db.execute(sql`
      UPDATE products
      SET logo_url = REPLACE(
        logo_url,
        'https://logo.clearbit.com/',
        'https://www.google.com/s2/favicons?domain='
      ) || '&sz=128'
      WHERE logo_url LIKE 'https://logo.clearbit.com/%'
    `);

    console.log(`✅ Successfully updated logo URLs`);
    console.log(`   Rows affected: ${result.length || 0}\n`);

    // Show sample of updated URLs
    const samples = await db.query.products.findMany({
      columns: {
        name: true,
        logoUrl: true,
      },
      limit: 5,
      where: (products, { like }) => like(products.logoUrl, "%google.com%"),
    });

    console.log("📋 Sample updated URLs:");
    samples.forEach((product, i) => {
      console.log(`   ${i + 1}. ${product.name}`);
      console.log(`      ${product.logoUrl}`);
    });

    console.log("\n✨ Migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run the migration
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
