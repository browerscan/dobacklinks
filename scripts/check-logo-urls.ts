// Load environment variables BEFORE any other imports
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { db } = await import("../lib/db");
  const { products } = await import("../lib/db/schema");
  const { sql, like } = await import("drizzle-orm");

  console.log("🔍 Checking logo URLs in database...\n");

  // Count Clearbit URLs
  const clearbitCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(like(products.logoUrl, "https://logo.clearbit.com/%"));

  console.log(`Clearbit URLs: ${clearbitCount[0]?.count || 0}`);

  // Count Google URLs
  const googleCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(like(products.logoUrl, "https://www.google.com/%"));

  console.log(`Google URLs: ${googleCount[0]?.count || 0}`);

  // Total count
  const totalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(products);

  console.log(`Total products: ${totalCount[0]?.count || 0}\n`);

  // Show sample of each type
  if (clearbitCount[0]?.count > 0) {
    console.log("Sample Clearbit URLs:");
    const clearbitSamples = await db.query.products.findMany({
      columns: { name: true, logoUrl: true },
      where: like(products.logoUrl, "https://logo.clearbit.com/%"),
      limit: 3,
    });
    clearbitSamples.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name}: ${p.logoUrl}`);
    });
    console.log();
  }

  if (googleCount[0]?.count > 0) {
    console.log("Sample Google URLs:");
    const googleSamples = await db.query.products.findMany({
      columns: { name: true, logoUrl: true },
      where: like(products.logoUrl, "https://www.google.com/%"),
      limit: 3,
    });
    googleSamples.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name}: ${p.logoUrl}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
