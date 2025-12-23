import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function checkImport() {
  const result = await db.execute(sql`
    SELECT
      COUNT(*) as total_count,
      COUNT(CASE WHEN ahrefs_organic_traffic IS NOT NULL THEN 1 END) as with_ahrefs,
      COUNT(CASE WHEN semrush_total_traffic IS NOT NULL THEN 1 END) as with_semrush,
      COUNT(CASE WHEN language IS NOT NULL THEN 1 END) as with_language
    FROM products
  `);

  console.log("📊 Import Status:");
  console.log("  Total products:", result[0].total_count);
  console.log("  With Ahrefs data:", result[0].with_ahrefs);
  console.log("  With SEMrush data:", result[0].with_semrush);
  console.log("  With language:", result[0].with_language);

  process.exit(0);
}

checkImport();
