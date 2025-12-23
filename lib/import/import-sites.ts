import fs from "fs";
import { db } from "@/lib/db";
import { products, categories, productCategories, user } from "@/lib/db/schema";
import { scoreAllSites } from "./quality-scorer";
import type { ScrapedSite } from "./types";
import slugify from "slugify";
import { eq } from "drizzle-orm";

interface ImportOptions {
  sourcePath: string;
  batchSize?: number;
  dryRun?: boolean;
  liveThreshold?: number; // Minimum score for 'live' status
  topLiveCount?: number; // Number of top sites to mark as 'live'
}

export async function importSites(options: ImportOptions) {
  const {
    sourcePath,
    batchSize = 50,
    dryRun = false,
    liveThreshold = 70,
    topLiveCount = 500,
  } = options;

  console.log("📖 Reading data from:", sourcePath);

  // 1. Load JSON data
  const rawData = fs.readFileSync(sourcePath, "utf-8");
  const sites: ScrapedSite[] = JSON.parse(rawData);

  console.log(`✓ Loaded ${sites.length} sites`);

  // 2. Filter successful scrapes only
  const successfulSites = sites.filter((s) => s.success && s.data);
  console.log(`✓ ${successfulSites.length} successful scrapes`);

  // 3. Score and sort all sites
  console.log("📊 Calculating quality scores...");
  const scoredSites = scoreAllSites(successfulSites);

  // 4. Determine status for each site
  const sitesToImport = scoredSites.map((scoredSite, index) => {
    const isTopSite = index < topLiveCount;
    const meetsThreshold = scoredSite.quality.score >= liveThreshold;
    const status = isTopSite && meetsThreshold ? "live" : "pending_review";

    return {
      ...scoredSite,
      status: status as "live" | "pending_review",
      rank: index + 1,
    };
  });

  // 5. Stats
  const liveCount = sitesToImport.filter((s) => s.status === "live").length;
  const pendingCount = sitesToImport.filter(
    (s) => s.status === "pending_review",
  ).length;

  console.log(`\n📈 Import Summary:`);
  console.log(`   Total sites: ${sitesToImport.length}`);
  console.log(`   Live: ${liveCount}`);
  console.log(`   Pending: ${pendingCount}`);
  console.log(
    `   Average score: ${(
      sitesToImport.reduce((sum, s) => sum + s.quality.score, 0) /
      sitesToImport.length
    ).toFixed(1)}`,
  );

  if (dryRun) {
    console.log("\n🏃 Dry run mode - no data will be inserted");
    console.log("\nTop 10 sites:");
    sitesToImport.slice(0, 10).forEach((s, i) => {
      console.log(
        `${i + 1}. ${s.site.domain} (score: ${s.quality.score}, status: ${
          s.status
        })`,
      );
    });
    return { success: true, imported: 0, liveCount: 0, pendingCount: 0 };
  }

  // 6. Get default category ID
  const defaultCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, "guest-posts"),
  });

  if (!defaultCategory) {
    console.warn(
      '\n⚠️  Default category "guest-posts" not found. Creating it...',
    );
    const [newCategory] = await db
      .insert(categories)
      .values({
        name: "Guest Posts",
        slug: "guest-posts",
        isActive: true,
        displayOrder: 0,
      })
      .returning();
    console.log("✓ Created default category");
  }

  const categoryToUse =
    defaultCategory ||
    (await db.query.categories.findFirst({
      where: eq(categories.slug, "guest-posts"),
    }));

  if (!categoryToUse) {
    throw new Error("Failed to create or find default category");
  }

  // 7. Import in batches
  console.log(`\n🚀 Starting import (${batchSize} per batch)...`);
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < sitesToImport.length; i += batchSize) {
    const batch = sitesToImport.slice(i, i + batchSize);

    const productData = batch.map(({ site, quality, status }) => {
      const priceRange = formatPriceRange(site.data);

      return {
        userId: null as any, // System-created, will need a system user
        name: cleanDomainName(site.domain),
        slug: slugify(site.domain, { lower: true, strict: true }),
        url: `https://${site.domain}`,
        tagline: generateTagline(site),
        description: generateDescription(site),
        logoUrl: `https://www.google.com/s2/favicons?domain=${site.domain}&sz=128`,

        // Guest post fields
        niche: inferNiche(site.domain, site.data.description),
        da: parseInt(site.data.mozDA || "0"),
        dr: parseInt(site.data.ahrefsDR || "0"),
        traffic: null, // Will be enriched later
        linkType: site.data.linkAttributionType
          ?.toLowerCase()
          .includes("dofollow")
          ? "dofollow"
          : "nofollow",
        priceRange,
        turnaroundTime: site.data.tat || null,
        contactEmail: null,
        spamScore: parseInt(site.data.spamScore?.replace("%", "") || "0"),
        googleNews: site.data.googleNews?.toLowerCase() === "yes",
        maxLinks: parseInt(site.data.maxLinks || "1"),
        requiredContentSize: parseInt(site.data.requiredContentSize || "0"),
        sampleUrls: site.data.sampleUrls || [],

        // Additional scraper fields
        ahrefsOrganicTraffic: parseNumber(site.data.ahrefsOrganicTraffic),
        referralDomains: parseNumber(site.data.referralDomains),
        semrushAS: parseInt(site.data.semrushAS || "0") || null,
        semrushTotalTraffic: parseNumber(site.data.semrushTotalTraffic),
        similarwebTrafficScraper: parseNumber(site.data.similarwebTraffic),
        language: site.data.language || null,
        completionRate: site.data.completionRate || null,
        avgLifetimeOfLinks: site.data.avgLifetimeOfLinks || null,
        approvedDate: site.data.approvedDate || null,
        contentPlacementPrice: site.data.contentPlacementPrice
          ? String(parseFloat(site.data.contentPlacementPrice))
          : null,
        writingPlacementPrice: site.data.writingPlacementPrice
          ? String(parseFloat(site.data.writingPlacementPrice))
          : null,
        specialTopicPrice: site.data.specialTopicPrice
          ? String(parseFloat(site.data.specialTopicPrice))
          : null,

        // Status
        status,
        isFeatured: false,
        isVerified: false,

        // Enrichment
        enrichmentStatus: "pending" as const,
        enrichedAt: null,
        monthlyVisits: null,
        globalRank: null,
        countryRank: null,
        bounceRate: null,
        pagesPerVisit: null,
        avgVisitDuration: null,
        trafficSources: null,
        similarwebData: null,

        // Metadata
        appImages: [],
        linkRel: null,
        submittedAt: new Date(),
        lastRenewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    try {
      // Need to get a system user first
      const systemUser = await db.query.user.findFirst({
        where: eq(user.email, "system@dobacklinks.com"),
      });

      if (!systemUser) {
        throw new Error(
          "System user not found. Please create system@dobacklinks.com user first.",
        );
      }

      // Check for existing products in this batch
      const slugsInBatch = batch.map(({ site }) =>
        slugify(site.domain, { lower: true, strict: true }),
      );

      const existingProducts = await db.query.products.findMany({
        where: (products, { inArray }) => inArray(products.slug, slugsInBatch),
        columns: { slug: true },
      });

      const existingSlugs = new Set(existingProducts.map((p) => p.slug));

      // Filter out existing products
      const newProductData = productData.filter(
        (p) => !existingSlugs.has(p.slug),
      );

      if (newProductData.length === 0) {
        console.log(
          `   ⏭️  Skipped batch ${Math.floor(i / batchSize) + 1} (all ${batch.length} sites already exist)`,
        );
        continue;
      }

      // Set userId for all products
      const productsWithUserId = newProductData.map((p) => ({
        ...p,
        userId: systemUser.id,
      }));

      // Insert products
      const insertedProducts = await db
        .insert(products)
        .values(productsWithUserId)
        .returning();

      // Link to default category
      const categoryLinks = insertedProducts.map((p) => ({
        productId: p.id,
        categoryId: categoryToUse.id,
      }));
      await db.insert(productCategories).values(categoryLinks);

      imported += insertedProducts.length;
      const skipped = batch.length - insertedProducts.length;
      console.log(
        `   ✓ Imported batch ${Math.floor(i / batchSize) + 1} (${insertedProducts.length} new, ${skipped} duplicates, total: ${imported}/${sitesToImport.length})`,
      );
    } catch (error) {
      console.error(
        `   ✗ Failed batch ${Math.floor(i / batchSize) + 1}:`,
        error,
      );
      failed += batch.length;
    }
  }

  console.log(
    `\n✅ Import complete! ${imported} sites imported, ${failed} failed.`,
  );

  return {
    success: true,
    imported,
    failed,
    liveCount,
    pendingCount,
  };
}

// Helper functions
function parseNumber(value: string | undefined | null): number | null {
  if (!value) return null;
  // Remove commas and parse as integer
  const cleaned = value.replace(/,/g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

function cleanDomainName(domain: string): string {
  return domain
    .replace(/\.(com|net|org|io|co|uk|de|fr|es|it|nl|jp|cn|in|au|ca)$/i, "")
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function generateTagline(site: ScrapedSite): string {
  const parts: string[] = [];

  if (site.data.googleNews === "Yes") {
    parts.push("Google News approved");
  }

  const spamScore = parseInt(site.data.spamScore?.replace("%", "") || "100");
  if (spamScore <= 5) {
    parts.push("High authority");
  }

  if (site.data.sampleUrls?.length > 0) {
    parts.push("Verified publisher");
  }

  const dr = parseInt(site.data.ahrefsDR || "0");
  if (dr >= 70) {
    parts.push(`DR ${dr}`);
  }

  return parts.length > 0 ? parts.join(" • ") : "Guest post opportunity";
}

function generateDescription(site: ScrapedSite): string {
  if (site.data.description) {
    return site.data.description;
  }

  const parts: string[] = [`Submit your guest post on ${site.domain}.`];

  if (site.data.maxLinks) {
    const maxLinks = parseInt(site.data.maxLinks);
    parts.push(
      `Allows up to ${maxLinks} dofollow link${maxLinks > 1 ? "s" : ""}.`,
    );
  }

  if (site.data.googleNews === "Yes") {
    parts.push(
      "This site is approved for Google News, providing additional exposure for your content.",
    );
  }

  const spamScore = parseInt(site.data.spamScore?.replace("%", "") || "100");
  if (spamScore <= 10) {
    parts.push("Clean backlink profile with low spam score.");
  }

  return parts.join(" ");
}

function inferNiche(domain: string, description: string = ""): string {
  const text = (domain + " " + description).toLowerCase();

  const niches: Record<string, string[]> = {
    Technology: [
      "tech",
      "software",
      "digital",
      "app",
      "ai",
      "dev",
      "code",
      "cyber",
      "data",
    ],
    Finance: [
      "finance",
      "money",
      "invest",
      "crypto",
      "trading",
      "bank",
      "fintech",
      "payment",
    ],
    Health: [
      "health",
      "medical",
      "wellness",
      "fitness",
      "care",
      "medicine",
      "doctor",
    ],
    Marketing: [
      "marketing",
      "seo",
      "social",
      "business",
      "startup",
      "brand",
      "advertising",
    ],
    News: ["news", "daily", "times", "post", "press", "media", "journal"],
    Lifestyle: ["life", "style", "fashion", "travel", "food", "home", "living"],
    "Real Estate": ["real estate", "property", "home", "housing", "realty"],
  };

  for (const [niche, keywords] of Object.entries(niches)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return niche;
    }
  }

  return "General";
}

function formatPriceRange(data: ScrapedSite["data"]): string | null {
  const prices = [
    data.contentPlacementPrice,
    data.writingPlacementPrice,
    data.specialTopicPrice,
  ]
    .map((p) => parseFloat(p || "0"))
    .filter((p) => p > 0);

  if (prices.length === 0) return "Contact for pricing";

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return `$${min}`;
  return `$${min} - $${max}`;
}
