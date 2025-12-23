import { db } from "./lib/db/index.js";
import { products } from "./lib/db/schema.js";
import { sql } from "drizzle-orm";

async function checkStatus() {
  const stats = await db
    .select({
      status: products.screenshotStatus,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(products)
    .groupBy(products.screenshotStatus);

  console.log("\n📊 Screenshot Status:");
  console.log("==================");
  stats.forEach((s) => {
    console.log(`  ${s.status || "null"}: ${s.count}`);
  });

  const total = stats.reduce((sum, s) => sum + Number(s.count), 0);
  console.log(`  TOTAL: ${total}`);
  console.log("==================\n");

  process.exit(0);
}

checkStatus();
