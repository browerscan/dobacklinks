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
import { checkRateLimit, getClientIPFromHeaders } from "@/lib/upstash";
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
// Server Actions
// ============================================================================

/**
 * Get enrichment statistics for dashboard
 */
export async function getEnrichmentStatsAction(): Promise<
  ActionResult<EnrichmentStats>
> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin access required");
  }

  try {
    const service = getEnrichmentService();
    const stats = await service.getEnrichmentStats();
    return actionResponse.success(stats);
  } catch (error) {
    console.error("[getEnrichmentStatsAction] Error:", error);
    return actionResponse.error("Failed to get enrichment statistics");
  }
}

/**
 * Trigger enrichment for all pending products
 * Note: Processes up to 100 products at a time to avoid timeout
 */
export async function enrichAllPendingAction(): Promise<
  ActionResult<EnrichmentResult>
> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin access required");
  }

  // Rate limiting to prevent SimilarWeb API abuse
  const clientIP = await getClientIPFromHeaders();
  const isAllowed = await checkRateLimit(clientIP, ENRICHMENT_BULK_RATE_LIMIT);
  if (!isAllowed) {
    return actionResponse.badRequest(
      "Rate limit exceeded. Max 10 bulk enrichments per hour.",
    );
  }

  try {
    console.log(
      "[enrichAllPendingAction] Starting enrichment for all pending products",
    );

    const service = getEnrichmentService();
    const result = await service.enrichProducts("pending", undefined, 100);

    // Revalidate relevant pages
    revalidatePath("/dashboard/enrichment");
    revalidatePath("/dashboard/sites");

    if (result.success) {
      return actionResponse.success(result);
    } else {
      return actionResponse.error(result.error || "Enrichment failed");
    }
  } catch (error) {
    console.error("[enrichAllPendingAction] Error:", error);
    return actionResponse.error("Failed to enrich pending products");
  }
}

/**
 * Trigger enrichment for specific products
 */
export async function enrichProductsAction(
  productIds: string[],
): Promise<ActionResult<EnrichmentResult>> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin access required");
  }

  if (!productIds || productIds.length === 0) {
    return actionResponse.badRequest("Product IDs are required");
  }

  try {
    console.log(
      `[enrichProductsAction] Starting enrichment for ${productIds.length} products`,
    );

    const service = getEnrichmentService();
    const result = await service.enrichProducts(productIds);

    // Revalidate relevant pages
    revalidatePath("/dashboard/enrichment");
    revalidatePath("/dashboard/sites");

    if (result.success) {
      return actionResponse.success(result);
    } else {
      return actionResponse.error(result.error || "Enrichment failed");
    }
  } catch (error) {
    console.error("[enrichProductsAction] Error:", error);
    return actionResponse.error("Failed to enrich products");
  }
}

/**
 * Enrich a single product
 */
export async function enrichSingleProductAction(
  productId: string,
): Promise<ActionResult<EnrichmentResult>> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin access required");
  }

  if (!productId) {
    return actionResponse.badRequest("Product ID is required");
  }

  // Rate limiting to prevent SimilarWeb API abuse
  const clientIP = await getClientIPFromHeaders();
  const isAllowed = await checkRateLimit(
    clientIP,
    ENRICHMENT_SINGLE_RATE_LIMIT,
  );
  if (!isAllowed) {
    return actionResponse.badRequest(
      "Rate limit exceeded. Max 50 single enrichments per hour.",
    );
  }

  try {
    console.log(`[enrichSingleProductAction] Enriching product ${productId}`);

    const service = getEnrichmentService();
    const result = await service.enrichSingleProduct(productId);

    // Revalidate relevant pages
    revalidatePath("/dashboard/enrichment");
    revalidatePath("/dashboard/sites");
    revalidatePath(`/sites/${productId}`);

    if (result.success) {
      return actionResponse.success(result);
    } else {
      return actionResponse.error(result.error || "Enrichment failed");
    }
  } catch (error) {
    console.error("[enrichSingleProductAction] Error:", error);
    return actionResponse.error("Failed to enrich product");
  }
}

/**
 * Reset failed products to pending status
 */
export async function resetFailedToPendingAction(
  productIds?: string[],
): Promise<ActionResult<{ count: number }>> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin access required");
  }

  try {
    const service = getEnrichmentService();
    const count = await service.resetFailedProducts(productIds);

    // Revalidate relevant pages
    revalidatePath("/dashboard/enrichment");
    revalidatePath("/dashboard/sites");

    console.log(
      `[resetFailedToPendingAction] Reset ${count} products to pending`,
    );
    return actionResponse.success({ count });
  } catch (error) {
    console.error("[resetFailedToPendingAction] Error:", error);
    return actionResponse.error("Failed to reset failed products");
  }
}

/**
 * Get paginated list of products with enrichment status
 */
export async function getProductsWithEnrichmentStatusAction(
  params: GetProductsWithEnrichmentStatusParams,
): Promise<
  ActionResult<{
    products: EnrichmentProduct[];
    total: number;
  }>
> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin access required");
  }

  const pageIndex = params.pageIndex || 0;
  const pageSize = params.pageSize || ENRICHMENT_PAGE_SIZE;
  const start = pageIndex * pageSize;

  try {
    // Build where conditions
    const conditions = [];

    // Filter by enrichment status
    if (params.status) {
      conditions.push(eq(products.enrichmentStatus, params.status));
    }

    // Search by name or URL
    if (params.search) {
      conditions.push(
        or(
          ilike(products.name, `%${params.search}%`),
          ilike(products.url, `%${params.search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(products)
      .where(whereClause);

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

    return actionResponse.success({
      products: productsData,
      total,
    });
  } catch (error) {
    console.error("[getProductsWithEnrichmentStatusAction] Error:", error);
    return actionResponse.error(
      "Failed to get products with enrichment status",
    );
  }
}
