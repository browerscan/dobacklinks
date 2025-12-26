import { siteConfig } from "@/config/site";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MetadataRoute } from "next";

const siteUrl = siteConfig.url;

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never"
  | undefined;

// Revalidate the sitemap daily
export const revalidate = 86400;

/**
 * Product sitemap - contains all live product pages
 * Separated from main sitemap to handle large number of products (9700+)
 * Accessible at /sitemap-products.xml
 *
 * Revalidates daily to pick up new/updated products
 */
export default async function productSitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all live products with their slugs and update timestamps
  // Using a streaming approach for memory efficiency with large datasets
  const batchSize = 1000;
  let offset = 0;
  const allProducts: Array<{ slug: string; updatedAt: Date | null; createdAt: Date }> = [];

  while (true) {
    const batch = await db
      .select({
        slug: products.slug,
        updatedAt: products.updatedAt,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(eq(products.status, "live"))
      .limit(batchSize)
      .offset(offset);

    if (batch.length === 0) break;

    allProducts.push(...batch);
    offset += batchSize;

    // Break if we got fewer results than the batch size (end of data)
    if (batch.length < batchSize) break;
  }

  // Map products to sitemap entries
  const productEntries: MetadataRoute.Sitemap = allProducts.map((product) => ({
    url: `${siteUrl}/sites/${product.slug}`,
    lastModified: product.updatedAt || product.createdAt,
    changeFrequency: "weekly" as ChangeFrequency,
    priority: 0.7,
  }));

  return productEntries;
}
