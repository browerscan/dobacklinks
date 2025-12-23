import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function checkSample() {
  const result = await db
    .select({
      name: products.name,
      url: products.url,
      ahrefsOrganicTraffic: products.ahrefsOrganicTraffic,
      referralDomains: products.referralDomains,
      semrushAS: products.semrushAS,
      semrushTotalTraffic: products.semrushTotalTraffic,
      language: products.language,
      contentPlacementPrice: products.contentPlacementPrice,
      writingPlacementPrice: products.writingPlacementPrice,
    })
    .from(products)
    .where(sql`${products.ahrefsOrganicTraffic} IS NOT NULL`)
    .limit(3);

  console.log("\n📊 Sample Products with New Data:\n");
  result.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} (${p.url})`);
    console.log(
      `   Ahrefs Organic Traffic: ${p.ahrefsOrganicTraffic?.toLocaleString() || "N/A"}`,
    );
    console.log(
      `   Referral Domains: ${p.referralDomains?.toLocaleString() || "N/A"}`,
    );
    console.log(`   SEMrush AS: ${p.semrushAS || "N/A"}`);
    console.log(
      `   SEMrush Traffic: ${p.semrushTotalTraffic?.toLocaleString() || "N/A"}`,
    );
    console.log(`   Language: ${p.language || "N/A"}`);
    console.log(`   Content Price: $${p.contentPlacementPrice || "N/A"}`);
    console.log(`   Writing Price: $${p.writingPlacementPrice || "N/A"}`);
    console.log("");
  });

  process.exit(0);
}

checkSample();
