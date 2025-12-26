/**
 * Screenshot Enrichment Service
 *
 * 批量获取网站截图和 SEO 元数据
 * 参考: lib/services/enrichment-service.ts (SimilarWeb 富化)
 */

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, count, and, inArray, sql } from "drizzle-orm";
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
  private readonly BATCH_SIZE = parsePositiveInt(process.env.SCREENSHOT_BATCH_SIZE, 8); // 平衡：每批 8 个（避免 API 限流）
  private readonly MAX_PROCESSING_TIME = parsePositiveInt(
    process.env.SCREENSHOT_MAX_PROCESSING_TIME_MS,
    55000,
  ); // 默认 55 秒（兼容 Serverless 超时）
  private readonly DELAY_BETWEEN_REQUESTS = parsePositiveInt(
    process.env.SCREENSHOT_DELAY_BETWEEN_BATCHES_MS,
    800,
  ); // 默认 800ms（避免限流）
  private readonly STAGGER_DELAY = parsePositiveInt(process.env.SCREENSHOT_STAGGER_DELAY_MS, 100); // 默认 100ms（错开请求）
  private readonly CLAIM_TTL_MS = parsePositiveInt(
    process.env.SCREENSHOT_CLAIM_TTL_MS,
    10 * 60 * 1000,
  ); // 默认 10 分钟（避免多 Worker 重复处理）

  /**
   * 多 Worker 下，原子领取 pending 任务并加锁，避免重复处理。
   *
   * 锁实现：复用 `screenshot_next_capture_at` 作为 lease（预留字段）。
   * - 领取时设置为 now + TTL
   * - 处理完成后置空（释放）
   * - Worker 崩溃时 TTL 到期自动回到可领取状态
   */
  private async claimPendingProducts(limit: number) {
    type ClaimedProduct = { id: string; url: string; name: string };
    if (limit <= 0) return [] as ClaimedProduct[];

    const claimed = await db.execute<ClaimedProduct>(sql`
      WITH candidates AS (
        SELECT id, url, name
        FROM products
        WHERE screenshot_status = 'pending'
          AND (screenshot_next_capture_at IS NULL OR screenshot_next_capture_at <= NOW())
        ORDER BY created_at DESC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE products p
      SET screenshot_next_capture_at = NOW() + ${this.CLAIM_TTL_MS} * INTERVAL '1 millisecond',
          updated_at = NOW()
      FROM candidates c
      WHERE p.id = c.id
      RETURNING p.id, p.url, p.name;
    `);

    return [...claimed] as ClaimedProduct[];
  }

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
        capturedPercentage: total > 0 ? Math.round((captured / total) * 100) : 0,
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
    let processed = 0;

    try {
      // 1) 预估 total（用于进度显示）。多 Worker 下这个数字只是近似值。
      const maxToProcess =
        productIds === "pending" ? (limit ?? 50) : productIds === "all" ? limit : limit;

      let estimatedTotal = 0;
      try {
        const stats = await this.getEnrichmentStats();
        if (productIds === "pending") {
          estimatedTotal = Math.min(maxToProcess ?? 50, stats.pending);
        } else if (productIds === "all") {
          estimatedTotal =
            maxToProcess !== undefined ? Math.min(maxToProcess, stats.pending) : stats.pending;
        } else {
          estimatedTotal = productIds.length;
        }
      } catch {
        // ignore stats errors; continue processing
      }

      const totalBatches = estimatedTotal > 0 ? Math.ceil(estimatedTotal / this.BATCH_SIZE) : 0;

      console.log(
        `🚀 Starting screenshot enrichment: ~${estimatedTotal || "?"} products, ~${totalBatches || "?"} batches`,
      );

      // 2. 获取服务实例
      const browserClient = getBrowserRenderingClient();
      const storage = getScreenshotStorage();

      // 3) 处理策略：
      // - productIds 为数组：直接按给定 ID 处理（不做领取）
      // - productIds 为 pending/all：循环原子领取 pending，支持多 Worker 并行不重叠
      const processBatch = async (
        batch: Array<{ id: string; url: string; name: string }>,
        currentBatch: number,
      ) => {
        console.log(`\n📦 Batch ${currentBatch}/${totalBatches || "?"} (${batch.length} products)`);

        if (onProgress) {
          onProgress({
            total: estimatedTotal || batch.length,
            processed,
            captured,
            failed,
            currentBatch,
            totalBatches: totalBatches || 0,
            startedAt: new Date(startTime),
          });
        }

        const processingPromises = batch.map(async (product, index) => {
          try {
            if (index > 0) {
              await new Promise((resolve) => setTimeout(resolve, this.STAGGER_DELAY * index));
            }

            console.log(`  📸 Processing: ${product.name} (${product.url})`);

            const domain = storage.extractDomain(product.url);
            const { screenshot, seoMetadata } = await browserClient.captureFullData(product.url);

            const { fullUrl, thumbnailUrl } = await storage.saveScreenshot(screenshot, domain);

            await db
              .update(products)
              .set({
                screenshotStatus: "captured",
                screenshotCapturedAt: new Date(),
                screenshotFullUrl: fullUrl,
                screenshotThumbnailUrl: thumbnailUrl,
                screenshotNextCaptureAt: null,
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
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            const domain = storage.extractDomain(product.url);

            await db
              .update(products)
              .set({
                screenshotStatus: "failed",
                screenshotError: errorMessage,
                screenshotNextCaptureAt: null,
                updatedAt: new Date(),
              })
              .where(eq(products.id, product.id));

            console.error(`  ❌ Failed: ${product.name} - ${errorMessage}`);
            return { success: false, domain, error: errorMessage };
          }
        });

        const results = await Promise.allSettled(processingPromises);
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

        console.log(`  📊 Batch complete: ${captured} captured, ${failed} failed`);
      };

      if (productIds !== "all" && productIds !== "pending") {
        const productsToEnrich = await db.query.products.findMany({
          where: inArray(products.id, productIds),
          columns: {
            id: true,
            url: true,
            name: true,
          },
        });

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
        for (let i = 0; i < productsToEnrich.length; i += this.BATCH_SIZE) {
          const elapsed = Date.now() - startTime;
          if (elapsed > this.MAX_PROCESSING_TIME) {
            console.warn(
              `⏰ Approaching timeout, stopping early (processed: ${processed}/${total})`,
            );
            break;
          }

          const batch = productsToEnrich.slice(i, i + this.BATCH_SIZE);
          const currentBatch = Math.floor(i / this.BATCH_SIZE) + 1;
          processed += batch.length;
          estimatedTotal = total;
          await processBatch(batch, currentBatch);

          if (i + this.BATCH_SIZE < productsToEnrich.length) {
            await new Promise((resolve) => setTimeout(resolve, this.DELAY_BETWEEN_REQUESTS));
          }
        }
      } else {
        let currentBatch = 0;
        while (true) {
          const elapsed = Date.now() - startTime;
          if (elapsed > this.MAX_PROCESSING_TIME) {
            console.warn(
              `⏰ Approaching timeout, stopping early (processed: ${processed}/${estimatedTotal || "?"})`,
            );
            break;
          }

          const remaining = productIds === "pending" ? (limit ?? 50) - processed : limit;
          if (remaining !== undefined && remaining <= 0) break;

          const batchLimit =
            remaining !== undefined ? Math.min(this.BATCH_SIZE, remaining) : this.BATCH_SIZE;

          const batch = await this.claimPendingProducts(batchLimit);
          if (batch.length === 0) break;

          currentBatch += 1;
          processed += batch.length;
          await processBatch(batch, currentBatch);

          await new Promise((resolve) => setTimeout(resolve, this.DELAY_BETWEEN_REQUESTS));
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `\n✅ Enrichment complete: ${captured}/${processed} captured, ${failed} failed, ${duration}ms`,
      );

      return {
        success: true,
        stats: { total: processed, captured, failed, duration },
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
      const { screenshot, seoMetadata } = await browserClient.captureFullData(product.url);

      // 保存到本地
      const { fullUrl, thumbnailUrl } = await storage.saveScreenshot(screenshot, domain);

      // 更新数据库
      await db
        .update(products)
        .set({
          screenshotStatus: "captured",
          screenshotCapturedAt: new Date(),
          screenshotFullUrl: fullUrl,
          screenshotThumbnailUrl: thumbnailUrl,
          screenshotNextCaptureAt: null,
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
          screenshotError: error instanceof Error ? error.message : "Unknown error",
          screenshotNextCaptureAt: null,
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
            screenshotNextCaptureAt: null,
            updatedAt: new Date(),
          })
          .where(and(inArray(products.id, productIds), eq(products.screenshotStatus, "failed")))
          .returning({ id: products.id });
      } else {
        result = await db
          .update(products)
          .set({
            screenshotStatus: "pending",
            screenshotError: null,
            screenshotNextCaptureAt: null,
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

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
