/**
 * SimilarWeb Enrichment Service
 *
 * Handles batch enrichment of products with SimilarWeb traffic data.
 * Provides progress tracking, error handling, and statistics.
 */

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { createLogger } from "@/lib/logger";
import { eq, or, and, isNull, count, inArray } from "drizzle-orm";
import { getSimilarWebClient } from "@/lib/similarweb/client";

const log = createLogger({ module: "EnrichmentService" });

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface EnrichmentProgress {
  total: number;
  processed: number;
  enriched: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  startedAt: Date;
  estimatedCompletion?: Date;
}

export interface EnrichmentStats {
  total: number;
  pending: number;
  enriched: number;
  failed: number;
  pendingPercentage: number;
  enrichedPercentage: number;
  failedPercentage: number;
  lastEnrichedAt: Date | null;
}

export interface EnrichmentResult {
  success: boolean;
  stats: {
    total: number;
    enriched: number;
    failed: number;
    duration: number; // milliseconds
  };
  failedDomains?: string[];
  error?: string;
}

// ============================================================================
// EnrichmentService Class
// ============================================================================

export class EnrichmentService {
  private readonly BATCH_SIZE = 50; // SimilarWeb API limit
  private readonly MAX_PROCESSING_TIME = 55000; // 55 seconds (leave 5s buffer for Vercel 60s timeout)

  /**
   * Get enrichment statistics
   * Optimized: Single GROUP BY query instead of 4 separate COUNT queries
   */
  async getEnrichmentStats(): Promise<EnrichmentStats> {
    try {
      // Single query with GROUP BY for all status counts
      const statusCounts = await db
        .select({
          status: products.enrichmentStatus,
          count: count(),
        })
        .from(products)
        .groupBy(products.enrichmentStatus);

      // Calculate totals from grouped results
      let total = 0;
      let pending = 0;
      let enriched = 0;
      let failed = 0;

      for (const row of statusCounts) {
        const c = Number(row.count);
        total += c;
        if (row.status === "pending") pending = c;
        else if (row.status === "enriched") enriched = c;
        else if (row.status === "failed") failed = c;
      }

      // Get last enriched timestamp (separate query as it's different data)
      const lastEnrichedProduct = await db.query.products.findFirst({
        where: eq(products.enrichmentStatus, "enriched"),
        orderBy: (products, { desc }) => [desc(products.enrichedAt)],
        columns: {
          enrichedAt: true,
        },
      });

      return {
        total,
        pending,
        enriched,
        failed,
        pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0,
        enrichedPercentage: total > 0 ? Math.round((enriched / total) * 100) : 0,
        failedPercentage: total > 0 ? Math.round((failed / total) * 100) : 0,
        lastEnrichedAt: lastEnrichedProduct?.enrichedAt || null,
      };
    } catch (error) {
      log.error("Error getting stats", {}, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Enrich products in batches
   *
   * @param productIds - Array of product IDs or 'all' for all pending products
   * @param onProgress - Optional callback for progress updates
   * @param limit - Optional limit for processing (default: 100 to avoid timeout)
   */
  async enrichProducts(
    productIds: string[] | "all" | "pending",
    onProgress?: (progress: EnrichmentProgress) => void,
    limit?: number,
  ): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const failedDomains: string[] = [];
    let enriched = 0;
    let failed = 0;

    try {
      // Fetch products to enrich
      let productsToEnrich;

      if (productIds === "all" || productIds === "pending") {
        // Fetch all pending products (limit to avoid timeout)
        productsToEnrich = await db.query.products.findMany({
          where: eq(products.enrichmentStatus, "pending"),
          limit: limit || 100,
          orderBy: (products, { asc }) => [asc(products.createdAt)],
        });
      } else {
        // Fetch specific products by IDs
        productsToEnrich = await db.query.products.findMany({
          where: (products, { inArray }) => inArray(products.id, productIds),
        });
      }

      if (productsToEnrich.length === 0) {
        return {
          success: true,
          stats: {
            total: 0,
            enriched: 0,
            failed: 0,
            duration: Date.now() - startTime,
          },
        };
      }

      const total = productsToEnrich.length;
      const totalBatches = Math.ceil(total / this.BATCH_SIZE);

      log.info("Starting enrichment", { total, totalBatches });

      // Extract domains from products
      const productDomainMap = new Map(
        productsToEnrich.map((p) => {
          const domain = this.extractDomain(p.url);
          return [domain, p.id];
        }),
      );

      const domains = Array.from(productDomainMap.keys());

      // Get SimilarWeb client
      const similarWebClient = getSimilarWebClient();

      // Process in batches
      for (let i = 0; i < domains.length; i += this.BATCH_SIZE) {
        // Check if we're approaching timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > this.MAX_PROCESSING_TIME) {
          log.warn("Approaching timeout, stopping early", {
            processedCount: i,
            elapsedMs: elapsed,
          });
          break;
        }

        const batch = domains.slice(i, i + this.BATCH_SIZE);
        const currentBatch = Math.floor(i / this.BATCH_SIZE) + 1;

        log.info("Processing batch", {
          currentBatch,
          totalBatches,
          batchSize: batch.length,
        });

        // Report progress
        if (onProgress) {
          const progress: EnrichmentProgress = {
            total,
            processed: i,
            enriched,
            failed,
            currentBatch,
            totalBatches,
            startedAt: new Date(startTime),
          };
          onProgress(progress);
        }

        try {
          // Fetch batch from SimilarWeb
          const results = await similarWebClient.batchGetDomains(batch);

          // Update products with results
          for (const result of results) {
            const productId = productDomainMap.get(result.domain);
            if (!productId) continue;

            // Accept data if we have monthly_visits OR global_rank (many smaller sites only have rank)
            if (
              result.data &&
              (result.data.monthly_visits !== null || result.data.global_rank !== null)
            ) {
              // Successfully enriched
              try {
                await db
                  .update(products)
                  .set({
                    enrichmentStatus: "enriched",
                    enrichedAt: new Date(),
                    monthlyVisits: result.data.monthly_visits,
                    globalRank: result.data.global_rank,
                    countryRank: result.data.country_rank,
                    bounceRate: result.data.bounce_rate?.toString() || null,
                    pagesPerVisit: result.data.pages_per_visit?.toString() || null,
                    avgVisitDuration: result.data.avg_visit_duration,
                    trafficSources: result.data.traffic_sources,
                    similarwebData: result.data.raw_data,
                    updatedAt: new Date(),
                  })
                  .where(eq(products.id, productId));

                enriched++;
              } catch (updateError) {
                log.error(
                  "Failed to update product",
                  { productId },
                  updateError instanceof Error ? updateError : undefined,
                );
                failed++;
              }
            } else {
              // No data available, mark as failed
              try {
                await db
                  .update(products)
                  .set({
                    enrichmentStatus: "failed",
                    updatedAt: new Date(),
                  })
                  .where(eq(products.id, productId));

                failed++;
                if (result.domain) failedDomains.push(result.domain);
              } catch (updateError) {
                log.error(
                  "Failed to mark product as failed",
                  { productId },
                  updateError instanceof Error ? updateError : undefined,
                );
              }
            }
          }

          log.info("Batch complete", { currentBatch, enriched, failed });
        } catch (batchError) {
          log.error(
            "Batch failed",
            { currentBatch },
            batchError instanceof Error ? batchError : undefined,
          );

          // Mark all products in this batch as failed
          for (const domain of batch) {
            const productId = productDomainMap.get(domain);
            if (productId) {
              try {
                await db
                  .update(products)
                  .set({
                    enrichmentStatus: "failed",
                    updatedAt: new Date(),
                  })
                  .where(eq(products.id, productId));

                failed++;
                failedDomains.push(domain);
              } catch (updateError) {
                log.error(
                  "Failed to mark product as failed in batch",
                  { productId },
                  updateError instanceof Error ? updateError : undefined,
                );
              }
            }
          }
        }
      }

      // Queue failed domains for future collection
      if (failedDomains.length > 0) {
        try {
          await similarWebClient.queueCollection(failedDomains, "normal");
          log.info("Queued failed domains for future collection", {
            count: failedDomains.length,
          });
        } catch (queueError) {
          log.error(
            "Failed to queue domains",
            {},
            queueError instanceof Error ? queueError : undefined,
          );
        }
      }

      const duration = Date.now() - startTime;
      log.info("Enrichment complete", {
        enriched,
        failed,
        durationMs: duration,
      });

      return {
        success: true,
        stats: {
          total,
          enriched,
          failed,
          duration,
        },
        failedDomains: failedDomains.length > 0 ? failedDomains : undefined,
      };
    } catch (error) {
      log.error(
        "Enrichment failed",
        { enriched, failed },
        error instanceof Error ? error : undefined,
      );
      return {
        success: false,
        stats: {
          total: 0,
          enriched,
          failed,
          duration: Date.now() - startTime,
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Enrich a single product
   */
  async enrichSingleProduct(productId: string): Promise<EnrichmentResult> {
    const startTime = Date.now();

    try {
      // Fetch product
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!product) {
        return {
          success: false,
          stats: {
            total: 0,
            enriched: 0,
            failed: 0,
            duration: Date.now() - startTime,
          },
          error: "Product not found",
        };
      }

      // Extract domain
      const domain = this.extractDomain(product.url);

      // Get SimilarWeb data
      const similarWebClient = getSimilarWebClient();
      const data = await similarWebClient.getDomainData(domain);

      // Accept data if we have monthly_visits OR global_rank (many smaller sites only have rank)
      if (data && (data.monthly_visits !== null || data.global_rank !== null)) {
        // Update product with enrichment data
        await db
          .update(products)
          .set({
            enrichmentStatus: "enriched",
            enrichedAt: new Date(),
            monthlyVisits: data.monthly_visits,
            globalRank: data.global_rank,
            countryRank: data.country_rank,
            bounceRate: data.bounce_rate?.toString() || null,
            pagesPerVisit: data.pages_per_visit?.toString() || null,
            avgVisitDuration: data.avg_visit_duration,
            trafficSources: data.traffic_sources,
            similarwebData: data.raw_data,
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId));

        return {
          success: true,
          stats: {
            total: 1,
            enriched: 1,
            failed: 0,
            duration: Date.now() - startTime,
          },
        };
      } else {
        // Mark as failed
        await db
          .update(products)
          .set({
            enrichmentStatus: "failed",
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId));

        // Queue for future collection
        await similarWebClient.queueCollection([domain], "normal");

        return {
          success: true,
          stats: {
            total: 1,
            enriched: 0,
            failed: 1,
            duration: Date.now() - startTime,
          },
          failedDomains: [domain],
        };
      }
    } catch (error) {
      log.error(
        "Error enriching product",
        { productId },
        error instanceof Error ? error : undefined,
      );
      return {
        success: false,
        stats: {
          total: 1,
          enriched: 0,
          failed: 0,
          duration: Date.now() - startTime,
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Reset failed products to pending status
   */
  async resetFailedProducts(productIds?: string[]): Promise<number> {
    try {
      let result;

      if (productIds && productIds.length > 0) {
        // Reset specific products
        result = await db
          .update(products)
          .set({
            enrichmentStatus: "pending",
            enrichedAt: null,
            monthlyVisits: null,
            globalRank: null,
            countryRank: null,
            bounceRate: null,
            pagesPerVisit: null,
            avgVisitDuration: null,
            trafficSources: null,
            similarwebData: null,
            updatedAt: new Date(),
          })
          .where(inArray(products.id, productIds))
          .returning({ id: products.id });
      } else {
        // Reset all failed products
        result = await db
          .update(products)
          .set({
            enrichmentStatus: "pending",
            enrichedAt: null,
            monthlyVisits: null,
            globalRank: null,
            countryRank: null,
            bounceRate: null,
            pagesPerVisit: null,
            avgVisitDuration: null,
            trafficSources: null,
            similarwebData: null,
            updatedAt: new Date(),
          })
          .where(eq(products.enrichmentStatus, "failed"))
          .returning({ id: products.id });
      }

      const count = result.length;
      log.info("Reset failed products to pending", { count });
      return count;
    } catch (error) {
      log.error("Error resetting failed products", {}, error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      // Fallback for malformed URLs
      return url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let enrichmentService: EnrichmentService | null = null;

export function getEnrichmentService(): EnrichmentService {
  if (!enrichmentService) {
    enrichmentService = new EnrichmentService();
  }
  return enrichmentService;
}
