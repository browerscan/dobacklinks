/**
 * Screenshot Enrichment Service
 *
 * 批量获取网站截图和 SEO 元数据
 * 参考: lib/services/enrichment-service.ts (SimilarWeb 富化)
 */

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, count, and, inArray } from "drizzle-orm";
import { getBrowserRenderingClient } from "@/lib/cloudflare/browser-rendering";
import { getScreenshotStorage } from "@/lib/services/screenshot-storage";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface EnrichmentProgress {
  total: number;
  processed: number;
  captured: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  startedAt: Date;
}

export interface EnrichmentStats {
  total: number;
  pending: number;
  captured: number;
  failed: number;
  pendingPercentage: number;
  capturedPercentage: number;
  failedPercentage: number;
  lastCapturedAt: Date | null;
}

export interface EnrichmentResult {
  success: boolean;
  stats: {
    total: number;
    captured: number;
    failed: number;
    duration: number;
  };
  failedDomains?: string[];
  error?: string;
}

// ============================================================================
// Screenshot Enrichment Service
// ============================================================================

export class ScreenshotEnrichmentService {
  private readonly BATCH_SIZE = 8; // 平衡：每批 8 个（从 5 增加，避免 API 限流）
  private readonly MAX_PROCESSING_TIME = 55000; // 55秒超时保护
  private readonly DELAY_BETWEEN_REQUESTS = 800; // 平衡延迟：800ms（避免限流）
  private readonly STAGGER_DELAY = 100; // 批内请求间隔 100ms（错开请求）

  /**
   * 获取统计信息
   */
  async getEnrichmentStats(): Promise<EnrichmentStats> {
    try {
      // 单查询获取所有状态计数
      const statusCounts = await db
        .select({
          status: products.screenshotStatus,
          count: count(),
        })
        .from(products)
        .groupBy(products.screenshotStatus);

      let total = 0;
      let pending = 0;
      let captured = 0;
      let failed = 0;

      for (const row of statusCounts) {
        const c = Number(row.count);
        total += c;
        if (row.status === "pending") pending = c;
        else if (row.status === "captured") captured = c;
        else if (row.status === "failed") failed = c;
      }

      // 获取最后捕获时间
      const lastCapturedProduct = await db.query.products.findFirst({
        where: eq(products.screenshotStatus, "captured"),
        orderBy: (products, { desc }) => [desc(products.screenshotCapturedAt)],
        columns: {
          screenshotCapturedAt: true,
        },
      });

      return {
        total,
        pending,
        captured,
        failed,
        pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0,
        capturedPercentage:
          total > 0 ? Math.round((captured / total) * 100) : 0,
        failedPercentage: total > 0 ? Math.round((failed / total) * 100) : 0,
        lastCapturedAt: lastCapturedProduct?.screenshotCapturedAt || null,
      };
    } catch (error) {
      console.error("Error getting screenshot stats:", error);
      throw error;
    }
  }

  /**
   * 批量富化产品
   */
  async enrichProducts(
    productIds: string[] | "all" | "pending",
    onProgress?: (progress: EnrichmentProgress) => void,
    limit?: number,
  ): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const failedDomains: string[] = [];
    let captured = 0;
    let failed = 0;

    try {
      // 1. 获取待处理产品
      let productsToEnrich;

      if (productIds === "all" || productIds === "pending") {
        productsToEnrich = await db.query.products.findMany({
          where: eq(products.screenshotStatus, "pending"),
          limit: limit || 50,
          orderBy: (products, { desc }) => [desc(products.createdAt)],
          columns: {
            id: true,
            url: true,
            name: true,
          },
        });
      } else {
        productsToEnrich = await db.query.products.findMany({
          where: inArray(products.id, productIds),
          columns: {
            id: true,
            url: true,
            name: true,
          },
        });
      }

      if (productsToEnrich.length === 0) {
        return {
          success: true,
          stats: {
            total: 0,
            captured: 0,
            failed: 0,
            duration: Date.now() - startTime,
          },
        };
      }

      const total = productsToEnrich.length;
      const totalBatches = Math.ceil(total / this.BATCH_SIZE);

      console.log(
        `🚀 Starting screenshot enrichment: ${total} products, ${totalBatches} batches`,
      );

      // 2. 获取服务实例
      const browserClient = getBrowserRenderingClient();
      const storage = getScreenshotStorage();

      // 3. 批量处理
      for (let i = 0; i < productsToEnrich.length; i += this.BATCH_SIZE) {
        // 超时保护
        const elapsed = Date.now() - startTime;
        if (elapsed > this.MAX_PROCESSING_TIME) {
          console.warn(
            `⏰ Approaching timeout, stopping early (processed: ${i}/${total})`,
          );
          break;
        }

        const batch = productsToEnrich.slice(i, i + this.BATCH_SIZE);
        const currentBatch = Math.floor(i / this.BATCH_SIZE) + 1;

        console.log(
          `\n📦 Batch ${currentBatch}/${totalBatches} (${batch.length} products)`,
        );

        // 报告进度
        if (onProgress) {
          onProgress({
            total,
            processed: i,
            captured,
            failed,
            currentBatch,
            totalBatches,
            startedAt: new Date(startTime),
          });
        }

        // 并发处理批次中的产品（使用 Promise.allSettled + 错开请求）
        const processingPromises = batch.map(async (product, index) => {
          try {
            // 错开请求避免同时发送（防止 API 限流）
            if (index > 0) {
              await new Promise((resolve) =>
                setTimeout(resolve, this.STAGGER_DELAY * index),
              );
            }

            console.log(`  📸 Processing: ${product.name} (${product.url})`);

            // 4. 捕获截图和 SEO 数据
            const domain = storage.extractDomain(product.url);
            const { screenshot, seoMetadata } =
              await browserClient.captureFullData(product.url);

            // 5. 保存到本地
            const { fullUrl, thumbnailUrl } = await storage.saveScreenshot(
              screenshot,
              domain,
            );

            // 6. 更新数据库
            await db
              .update(products)
              .set({
                screenshotStatus: "captured",
                screenshotCapturedAt: new Date(),
                screenshotFullUrl: fullUrl,
                screenshotThumbnailUrl: thumbnailUrl,
                seoTitle: seoMetadata.title,
                seoMetaDescription: seoMetadata.metaDescription,
                seoOgTitle: seoMetadata.ogTitle,
                seoOgDescription: seoMetadata.ogDescription,
                seoOgImage: seoMetadata.ogImage,
                seoTwitterCard: seoMetadata.twitterCard,
                seoTwitterTitle: seoMetadata.twitterTitle,
                seoTwitterDescription: seoMetadata.twitterDescription,
                seoTwitterImage: seoMetadata.twitterImage,
                seoFaviconUrl: seoMetadata.faviconUrl,
                seoCanonicalUrl: seoMetadata.canonicalUrl,
                seoH1: seoMetadata.h1,
                updatedAt: new Date(),
              })
              .where(eq(products.id, product.id));

            console.log(`  ✅ Captured: ${domain}`);
            return { success: true, domain };
          } catch (error) {
            // 标记失败
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            const domain = storage.extractDomain(product.url);

            await db
              .update(products)
              .set({
                screenshotStatus: "failed",
                screenshotError: errorMessage,
                updatedAt: new Date(),
              })
              .where(eq(products.id, product.id));

            console.error(`  ❌ Failed: ${product.name} - ${errorMessage}`);
            return { success: false, domain, error: errorMessage };
          }
        });

        // 等待所有并发请求完成
        const results = await Promise.allSettled(processingPromises);

        // 统计结果
        for (const result of results) {
          if (result.status === "fulfilled") {
            if (result.value.success) {
              captured++;
            } else {
              failed++;
              failedDomains.push(result.value.domain);
            }
          }
        }

        // 批次间延迟
        if (i + this.BATCH_SIZE < productsToEnrich.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.DELAY_BETWEEN_REQUESTS),
          );
        }

        console.log(
          `  📊 Batch complete: ${captured} captured, ${failed} failed`,
        );
      }

      const duration = Date.now() - startTime;
      console.log(
        `\n✅ Enrichment complete: ${captured}/${total} captured, ${failed} failed, ${duration}ms`,
      );

      return {
        success: true,
        stats: { total, captured, failed, duration },
        failedDomains: failedDomains.length > 0 ? failedDomains : undefined,
      };
    } catch (error) {
      console.error("Enrichment failed:", error);
      return {
        success: false,
        stats: {
          total: 0,
          captured,
          failed,
          duration: Date.now() - startTime,
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 单个产品富化
   */
  async enrichSingleProduct(productId: string): Promise<EnrichmentResult> {
    const startTime = Date.now();

    try {
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
        columns: {
          id: true,
          url: true,
          name: true,
        },
      });

      if (!product) {
        return {
          success: false,
          stats: {
            total: 0,
            captured: 0,
            failed: 0,
            duration: Date.now() - startTime,
          },
          error: "Product not found",
        };
      }

      const browserClient = getBrowserRenderingClient();
      const storage = getScreenshotStorage();
      const domain = storage.extractDomain(product.url);

      console.log(`📸 Enriching single product: ${product.name}`);

      // 捕获数据
      const { screenshot, seoMetadata } = await browserClient.captureFullData(
        product.url,
      );

      // 保存到本地
      const { fullUrl, thumbnailUrl } = await storage.saveScreenshot(
        screenshot,
        domain,
      );

      // 更新数据库
      await db
        .update(products)
        .set({
          screenshotStatus: "captured",
          screenshotCapturedAt: new Date(),
          screenshotFullUrl: fullUrl,
          screenshotThumbnailUrl: thumbnailUrl,
          seoTitle: seoMetadata.title,
          seoMetaDescription: seoMetadata.metaDescription,
          seoOgTitle: seoMetadata.ogTitle,
          seoOgDescription: seoMetadata.ogDescription,
          seoOgImage: seoMetadata.ogImage,
          seoTwitterCard: seoMetadata.twitterCard,
          seoTwitterTitle: seoMetadata.twitterTitle,
          seoTwitterDescription: seoMetadata.twitterDescription,
          seoTwitterImage: seoMetadata.twitterImage,
          seoFaviconUrl: seoMetadata.faviconUrl,
          seoCanonicalUrl: seoMetadata.canonicalUrl,
          seoH1: seoMetadata.h1,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      console.log(`✅ Product enriched successfully`);

      return {
        success: true,
        stats: {
          total: 1,
          captured: 1,
          failed: 0,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      console.error("Single product enrichment failed:", error);

      // 标记失败
      await db
        .update(products)
        .set({
          screenshotStatus: "failed",
          screenshotError:
            error instanceof Error ? error.message : "Unknown error",
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      return {
        success: false,
        stats: {
          total: 1,
          captured: 0,
          failed: 1,
          duration: Date.now() - startTime,
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 重置失败产品
   */
  async resetFailedProducts(productIds?: string[]): Promise<number> {
    try {
      let result;

      if (productIds && productIds.length > 0) {
        result = await db
          .update(products)
          .set({
            screenshotStatus: "pending",
            screenshotError: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              inArray(products.id, productIds),
              eq(products.screenshotStatus, "failed"),
            ),
          )
          .returning({ id: products.id });
      } else {
        result = await db
          .update(products)
          .set({
            screenshotStatus: "pending",
            screenshotError: null,
            updatedAt: new Date(),
          })
          .where(eq(products.screenshotStatus, "failed"))
          .returning({ id: products.id });
      }

      const resetCount = result.length;
      console.log(`✅ Reset ${resetCount} failed products to pending`);
      return resetCount;
    } catch (error) {
      console.error("Error resetting failed products:", error);
      throw error;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let screenshotEnrichmentService: ScreenshotEnrichmentService | null = null;

export function getScreenshotEnrichmentService(): ScreenshotEnrichmentService {
  if (!screenshotEnrichmentService) {
    screenshotEnrichmentService = new ScreenshotEnrichmentService();
  }
  return screenshotEnrichmentService;
}
