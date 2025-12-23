import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function addMissingColumns() {
  console.log("Adding missing columns to products table...");

  try {
    // Add all new columns
    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS ahrefs_organic_traffic INTEGER;
    `);
    console.log("✓ Added ahrefs_organic_traffic");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS referral_domains INTEGER;
    `);
    console.log("✓ Added referral_domains");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS semrush_as INTEGER;
    `);
    console.log("✓ Added semrush_as");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS semrush_total_traffic INTEGER;
    `);
    console.log("✓ Added semrush_total_traffic");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS similarweb_traffic_scraper INTEGER;
    `);
    console.log("✓ Added similarweb_traffic_scraper");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS language TEXT;
    `);
    console.log("✓ Added language");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS completion_rate TEXT;
    `);
    console.log("✓ Added completion_rate");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS avg_lifetime_of_links TEXT;
    `);
    console.log("✓ Added avg_lifetime_of_links");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_date TEXT;
    `);
    console.log("✓ Added approved_date");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS content_placement_price NUMERIC(10,2);
    `);
    console.log("✓ Added content_placement_price");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS writing_placement_price NUMERIC(10,2);
    `);
    console.log("✓ Added writing_placement_price");

    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS special_topic_price NUMERIC(10,2);
    `);
    console.log("✓ Added special_topic_price");

    console.log("\n✅ All columns added successfully!");
  } catch (error) {
    console.error("Error adding columns:", error);
    process.exit(1);
  }

  process.exit(0);
}

addMissingColumns();
