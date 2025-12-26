"use server";

import { ActionResult, actionResponse } from "@/lib/action-response";
import { isAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import {
  getEnrichmentService,
  EnrichmentStats,
  EnrichmentResult,
} from "@/lib/services/enrichment-service";
import { checkRateLimit, getClientIPFromHeaders, RedisFallbackMode } from "@/lib/upstash";
import { withErrorHandling, withAdminAction, type ActionHandler } from "@/lib/action-wrapper";
import { ValidationError, RateLimitError, ExternalApiError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { and, count, desc, eq, ilike, or, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ============================================================================
// Constants
// ============================================================================

const ENRICHMENT_PAGE_SIZE = 20;

// Rate limits for enrichment actions (prevent API abuse)
const ENRICHMENT_BULK_RATE_LIMIT = {
  prefix: "enrichment-bulk",
  maxRequests: 10,
  window: "1 h" as const,
};

const ENRICHMENT_SINGLE_RATE_LIMIT = {
  prefix: "enrichment-single",
  maxRequests: 50,
  window: "1 h" as const,
};

// ============================================================================
// Types
// ============================================================================

export interface EnrichmentProduct {
  id: string;
  name: string;
  url: string;
  logoUrl: string | null;
  enrichmentStatus: "pending" | "enriched" | "failed" | null;
  monthlyVisits: number | null;
  enrichedAt: Date | null;
}

export interface GetProductsWithEnrichmentStatusParams {
  status?: "pending" | "enriched" | "failed";
  pageIndex?: number;
  pageSize?: number;
  search?: string;
}

// ============================================================================
// Internal Handlers
// ============================================================================

/**
 * Internal handler: Get enrichment statistics
 */
const getEnrichmentStatsHandler: ActionHandler<EnrichmentStats> = async () => {
  const service = getEnrichmentService();
  const stats = await service.getEnrichmentStats();
  return stats;
};

/**
 * Internal handler: Enrich all pending products
 */
const enrichAllPendingHandler: ActionHandler<EnrichmentResult> = async () => {
  const clientIP = await getClientIPFromHeaders();
  const isAllowed = await checkRateLimit(
    clientIP,
    ENRICHMENT_BULK_RATE_LIMIT,
    RedisFallbackMode.MEMORY_FALLBACK,
  );
  if (!isAllowed) {
    throw new RateLimitError(3600); // 1 hour retry
  }

  logger.info("[enrichment] Starting bulk enrichment for all pending products");

  const service = getEnrichmentService();
  const result = await service.enrichProducts("pending", undefined, 100);

  // Revalidate relevant pages
  revalidatePath("/dashboard/enrichment");
  revalidatePath("/dashboard/sites");

  if (!result.success) {
    throw new ExternalApiError("SimilarWeb", result.error ?? "Enrichment service returned failure");
  }

  return result;
};

/**
 * Internal handler: Reset failed products to pending
 */
const resetFailedToPendingHandler: ActionHandler<{ count: number }> = async () => {
  const service = getEnrichmentService();
  const count = await service.resetFailedProducts(undefined);

  // Revalidate relevant pages
  revalidatePath("/dashboard/enrichment");
  revalidatePath("/dashboard/sites");

  logger.info(`[enrichment] Reset ${count} products to pending status`);

  return { count };
};

// ============================================================================
// Public Server Actions (with unified error handling)
// ============================================================================

/**
 * Get enrichment statistics for dashboard
 */
export async function getEnrichmentStatsAction(): Promise<ActionResult<EnrichmentStats>> {
  return withAdminAction("getEnrichmentStats", getEnrichmentStatsHandler);
}

/**
 * Trigger enrichment for all pending products
 * Note: Processes up to 100 products at a time to avoid timeout
 */
export async function enrichAllPendingAction(): Promise<ActionResult<EnrichmentResult>> {
  return withAdminAction("enrichAllPending", enrichAllPendingHandler);
}

/**
 * Trigger enrichment for specific products
 */
export async function enrichProductsAction(
  productIds: string[],
): Promise<ActionResult<EnrichmentResult>> {
  if (!productIds || productIds.length === 0) {
    throw new ValidationError("Product IDs are required");
  }

  return withAdminAction("enrichProducts", async () => {
    logger.info(`[enrichment] Starting enrichment for ${productIds.length} products`);

    const service = getEnrichmentService();
    const result = await service.enrichProducts(productIds);

    // Revalidate relevant pages
    revalidatePath("/dashboard/enrichment");
    revalidatePath("/dashboard/sites");

    if (!result.success) {
      throw new ExternalApiError(
        "SimilarWeb",
        result.error ?? "Enrichment service returned failure",
      );
    }

    return result;
  });
}

/**
 * Enrich a single product
 */
export async function enrichSingleProductAction(
  productId: string,
): Promise<ActionResult<EnrichmentResult>> {
  if (!productId) {
    throw new ValidationError("Product ID is required");
  }

  return withAdminAction("enrichSingleProduct", async () => {
    const clientIP = await getClientIPFromHeaders();
    const isAllowed = await checkRateLimit(
      clientIP,
      ENRICHMENT_SINGLE_RATE_LIMIT,
      RedisFallbackMode.MEMORY_FALLBACK,
    );
    if (!isAllowed) {
      throw new RateLimitError(3600);
    }

    logger.info(`[enrichment] Enriching single product ${productId}`);

    const service = getEnrichmentService();
    const result = await service.enrichSingleProduct(productId);

    // Revalidate relevant pages
    revalidatePath("/dashboard/enrichment");
    revalidatePath("/dashboard/sites");
    revalidatePath(`/sites/${productId}`);

    if (!result.success) {
      throw new ExternalApiError(
        "SimilarWeb",
        result.error ?? "Enrichment service returned failure",
      );
    }

    return result;
  });
}

/**
 * Reset failed products to pending status
 */
export async function resetFailedToPendingAction(
  productIds?: string[],
): Promise<ActionResult<{ count: number }>> {
  if (productIds && productIds.length > 0) {
    return withAdminAction("resetFailedToPending", async () => {
      const service = getEnrichmentService();
      const count = await service.resetFailedProducts(productIds);

      // Revalidate relevant pages
      revalidatePath("/dashboard/enrichment");
      revalidatePath("/dashboard/sites");

      logger.info(`[enrichment] Reset ${count} products to pending status`);

      return { count };
    });
  }

  return withAdminAction("resetFailedToPending", resetFailedToPendingHandler);
}

/**
 * Get paginated list of products with enrichment status
 */
export async function getProductsWithEnrichmentStatusAction(
  params: GetProductsWithEnrichmentStatusParams,
): Promise<ActionResult<{ products: EnrichmentProduct[]; total: number }>> {
  return withAdminAction("getProductsWithEnrichmentStatus", async () => {
    const pageIndex = params.pageIndex || 0;
    const pageSize = params.pageSize || ENRICHMENT_PAGE_SIZE;
    const start = pageIndex * pageSize;

    // Build where conditions
    const conditions = [];

    // Filter by enrichment status
    if (params.status) {
      conditions.push(eq(products.enrichmentStatus, params.status));
    }

    // Search by name or URL
    if (params.search) {
      conditions.push(
        or(ilike(products.name, `%${params.search}%`), ilike(products.url, `%${params.search}%`)),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db.select({ count: count() }).from(products).where(whereClause);

    const total = totalResult?.count || 0;

    // Get paginated products
    const productsData = await db
      .select({
        id: products.id,
        name: products.name,
        url: products.url,
        logoUrl: products.logoUrl,
        enrichmentStatus: products.enrichmentStatus,
        monthlyVisits: products.monthlyVisits,
        enrichedAt: products.enrichedAt,
      })
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.enrichedAt), desc(products.createdAt))
      .limit(pageSize)
      .offset(start);

    return {
      products: productsData,
      total,
    };
  });
}
