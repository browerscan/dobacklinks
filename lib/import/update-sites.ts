import fs from "fs";
import { db } from "@/lib/db";
import { products, categories, productCategories, user } from "@/lib/db/schema";
import { scoreAllSites } from "./quality-scorer";
import type { ScrapedSite } from "./types";
import slugify from "slugify";
import { eq, inArray } from "drizzle-orm";

interface UpdateOptions {
  sourcePath: string;
  batchSize?: number;
  dryRun?: boolean;
  liveThreshold?: number;
  topLiveCount?: number;
}

interface UpdateStats {
  total: number;
  updated: number;
  added: number;
  skipped: number;
  failed: number;
}

export async function updateSites(
  options: UpdateOptions,
): Promise<UpdateStats> {
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
  const sitesToProcess = scoredSites.map((scoredSite, index) => {
    const isTopSite = index < topLiveCount;
    const meetsThreshold = scoredSite.quality.score >= liveThreshold;
    const status = isTopSite && meetsThreshold ? "live" : "pending_review";

    return {
      ...scoredSite,
      status: status as "live" | "pending_review",
      rank: index + 1,
    };
  });

  const stats: UpdateStats = {
    total: sitesToProcess.length,
    updated: 0,
    added: 0,
    skipped: 0,
    failed: 0,
  };

  if (dryRun) {
    console.log("\n🏃 Dry run mode - analyzing what would happen...\n");
  }

  // 5. Get system user
  const systemUser = await db.query.user.findFirst({
    where: eq(user.email, "system@dobacklinks.com"),
  });

  if (!systemUser && !dryRun) {
    throw new Error(
      "System user not found. Please create system@dobacklinks.com user first.",
    );
  }

  // 6. Get default category
  let defaultCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, "guest-posts"),
  });

  if (!defaultCategory && !dryRun) {
    console.log('Creating default "guest-posts" category...');
    const [newCat] = await db
      .insert(categories)
      .values({
        name: "Guest Posts",
        slug: "guest-posts",
        icon: "FileText",
        isActive: true,
        displayOrder: 0,
      })
      .returning();
    defaultCategory = newCat;
  }

  // 7. Process in batches
  console.log(
    `\n🚀 Processing ${sitesToProcess.length} sites in batches of ${batchSize}...`,
  );

  for (let i = 0; i < sitesToProcess.length; i += batchSize) {
    const batch = sitesToProcess.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    // Get slugs for this batch
    const slugsInBatch = batch.map(({ site }) =>
      slugify(site.domain, { lower: true, strict: true }),
    );

    // Check which products exist
    const existingProducts = await db.query.products.findMany({
      where: inArray(products.slug, slugsInBatch),
      columns: { id: true, slug: true, niche: true },
    });

    const existingMap = new Map(existingProducts.map((p) => [p.slug, p]));

    const toUpdate: Array<{ id: string; data: any }> = [];
    const toInsert: Array<any> = [];
    const seenSlugsInBatch = new Set<string>();

    for (const { site, quality, status } of batch) {
      const slug = slugify(site.domain, { lower: true, strict: true });

      // Skip duplicates within the same batch
      if (seenSlugsInBatch.has(slug)) {
        continue;
      }
      seenSlugsInBatch.add(slug);

      const existing = existingMap.get(slug);

      const updateData = buildUpdateData(site);

      if (existing) {
        // Update existing product
        toUpdate.push({ id: existing.id, data: updateData });
      } else {
        // Insert new product
        const insertData = buildInsertData(
          site,
          quality,
          status,
          systemUser?.id || "",
        );
        toInsert.push(insertData);
      }
    }

    if (dryRun) {
      stats.updated += toUpdate.length;
      stats.added += toInsert.length;
      console.log(
        `   Batch ${batchNum}: Would update ${toUpdate.length}, add ${toInsert.length}`,
      );
      continue;
    }

    // Execute updates
    try {
      for (const { id, data } of toUpdate) {
        await db.update(products).set(data).where(eq(products.id, id));
      }
      stats.updated += toUpdate.length;

      // Execute inserts
      if (toInsert.length > 0) {
        const inserted = await db.insert(products).values(toInsert).returning();

        // Link to default category
        if (defaultCategory) {
          const categoryLinks = inserted.map((p) => ({
            productId: p.id,
            categoryId: defaultCategory!.id,
          }));
          await db
            .insert(productCategories)
            .values(categoryLinks)
            .onConflictDoNothing();
        }
        stats.added += inserted.length;
      }

      console.log(
        `   ✓ Batch ${batchNum}: Updated ${toUpdate.length}, added ${toInsert.length} (total: ${stats.updated + stats.added}/${sitesToProcess.length})`,
      );
    } catch (error) {
      console.error(`   ✗ Batch ${batchNum} failed:`, error);
      stats.failed += batch.length;
    }
  }

  console.log("\n📊 Final Stats:");
  console.log(`   Total processed: ${stats.total}`);
  console.log(`   Updated: ${stats.updated}`);
  console.log(`   Added: ${stats.added}`);
  console.log(`   Failed: ${stats.failed}`);

  return stats;
}

// Build data for updating existing products (only update pricing and metrics)
function buildUpdateData(site: ScrapedSite) {
  return {
    // Update pricing fields
    contentPlacementPrice: site.data.contentPlacementPrice
      ? String(parseFloat(site.data.contentPlacementPrice))
      : null,
    writingPlacementPrice: site.data.writingPlacementPrice
      ? String(parseFloat(site.data.writingPlacementPrice))
      : null,
    specialTopicPrice: site.data.specialTopicPrice
      ? String(parseFloat(site.data.specialTopicPrice))
      : null,
    priceRange: formatPriceRange(site.data),

    // Update metrics
    da: parseInt(site.data.mozDA || "0") || null,
    dr: parseInt(site.data.ahrefsDR || "0") || null,
    spamScore: parseInt(site.data.spamScore?.replace("%", "") || "0") || null,
    googleNews: site.data.googleNews?.toLowerCase() === "yes",
    maxLinks: parseInt(site.data.maxLinks || "1") || null,
    requiredContentSize: parseInt(site.data.requiredContentSize || "0") || null,

    // Update traffic data
    ahrefsOrganicTraffic: parseNumber(site.data.ahrefsOrganicTraffic),
    referralDomains: parseNumber(site.data.referralDomains),
    semrushAS: parseInt(site.data.semrushAS || "0") || null,
    semrushTotalTraffic: parseNumber(site.data.semrushTotalTraffic),
    similarwebTrafficScraper: parseNumber(site.data.similarwebTraffic),

    // Update other fields
    language: site.data.language || null,
    completionRate: site.data.completionRate || null,
    avgLifetimeOfLinks: site.data.avgLifetimeOfLinks || null,
    turnaroundTime: cleanTat(site.data.tat) || null,
    sampleUrls: site.data.sampleUrls || [],
    linkType: site.data.linkAttributionType?.toLowerCase().includes("dofollow")
      ? "dofollow"
      : "nofollow",

    updatedAt: new Date(),
  };
}

// Build data for inserting new products (full data)
function buildInsertData(
  site: ScrapedSite,
  quality: { score: number; tier: string; reasons: string[] },
  status: "live" | "pending_review",
  userId: string,
) {
  return {
    userId,
    name: cleanDomainName(site.domain),
    slug: slugify(site.domain, { lower: true, strict: true }),
    url: `https://${site.domain}`,
    tagline: generateTagline(site),
    description: generateDescription(site),
    logoUrl: `https://www.google.com/s2/favicons?domain=${site.domain}&sz=128`,

    // Guest post fields
    niche: inferNiche(site.domain, site.data.description),
    da: parseInt(site.data.mozDA || "0") || null,
    dr: parseInt(site.data.ahrefsDR || "0") || null,
    traffic: null,
    linkType: site.data.linkAttributionType?.toLowerCase().includes("dofollow")
      ? "dofollow"
      : "nofollow",
    priceRange: formatPriceRange(site.data),
    turnaroundTime: cleanTat(site.data.tat) || null,
    contactEmail: null,
    spamScore: parseInt(site.data.spamScore?.replace("%", "") || "0") || null,
    googleNews: site.data.googleNews?.toLowerCase() === "yes",
    maxLinks: parseInt(site.data.maxLinks || "1") || null,
    requiredContentSize: parseInt(site.data.requiredContentSize || "0") || null,
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

    // Metadata
    appImages: [],
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper functions
function parseNumber(value: string | undefined | null): number | null {
  if (!value) return null;
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

function cleanTat(tat: string | undefined): string | null {
  if (!tat) return null;
  // Extract just the time part, remove extra text
  const match = tat.match(/Up to \d+ days?/i);
  return match ? match[0] : null;
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
    parts.push("Google News approved site with additional exposure.");
  }

  const spamScore = parseInt(site.data.spamScore?.replace("%", "") || "100");
  if (spamScore <= 10) {
    parts.push("Clean backlink profile with low spam score.");
  }

  return parts.join(" ");
}

function inferNiche(domain: string, description: string = ""): string {
  const text = (domain + " " + (description || "")).toLowerCase();

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
    Marketing: ["marketing", "seo", "social", "brand", "advertising", "growth"],
    Business: [
      "business",
      "startup",
      "entrepreneur",
      "corporate",
      "enterprise",
    ],
    News: ["news", "daily", "times", "post", "press", "media", "journal"],
    Lifestyle: ["life", "style", "fashion", "travel", "food", "home", "living"],
    "Real Estate": ["real estate", "property", "housing", "realty"],
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
