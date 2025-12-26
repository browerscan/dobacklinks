"use server";

/**
 * Screenshot Server Actions
 *
 * 管理员操作：捕获截图、批量处理、获取统计信息
 */

import { ActionResult, actionResponse } from "@/lib/action-response";
import { isAdmin } from "@/lib/auth/server";
import { getScreenshotEnrichmentService } from "@/lib/services/screenshot-enrichment-service";
import { z } from "zod";

// ============================================================================
// Get Screenshot Stats
// ============================================================================

export async function getScreenshotStatsAction(): Promise<
  ActionResult<{
    total: number;
    pending: number;
    captured: number;
    failed: number;
    pendingPercentage: number;
    capturedPercentage: number;
    failedPercentage: number;
    lastCapturedAt: Date | null;
  }>
> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin privileges required");
  }

  try {
    const service = getScreenshotEnrichmentService();
    const stats = await service.getEnrichmentStats();
    return actionResponse.success(stats);
  } catch (error) {
    console.error("Get screenshot stats failed:", error);
    return actionResponse.error("Failed to get screenshot statistics");
  }
}

// ============================================================================
// Capture Single Product Screenshot
// ============================================================================

export async function captureScreenshotAction({ productId }: { productId: string }): Promise<
  ActionResult<{
    screenshotUrl: string | null;
    seoTitle: string | null;
  }>
> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin privileges required");
  }

  if (!productId || !z.string().uuid().safeParse(productId).success) {
    return actionResponse.badRequest("Invalid Product ID provided");
  }

  try {
    const service = getScreenshotEnrichmentService();
    const result = await service.enrichSingleProduct(productId);

    if (!result.success) {
      return actionResponse.error(result.error || "Screenshot capture failed");
    }

    return actionResponse.success({
      screenshotUrl: null, // Will be set in database
      seoTitle: null,
    });
  } catch (error) {
    console.error("Capture screenshot action failed:", error);
    return actionResponse.error("Failed to capture screenshot");
  }
}

// ============================================================================
// Batch Capture Screenshots
// ============================================================================

export async function batchCaptureScreenshotsAction({
  productIds,
  limit,
}: {
  productIds?: string[];
  limit?: number;
}): Promise<
  ActionResult<{
    total: number;
    captured: number;
    failed: number;
    duration: number;
    failedDomains?: string[];
  }>
> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin privileges required");
  }

  try {
    const service = getScreenshotEnrichmentService();
    const result = await service.enrichProducts(productIds || "pending", undefined, limit);

    if (!result.success) {
      return actionResponse.error(result.error || "Batch capture failed");
    }

    return actionResponse.success(result.stats);
  } catch (error) {
    console.error("Batch capture action failed:", error);
    return actionResponse.error("Failed to batch capture screenshots");
  }
}

// ============================================================================
// Reset Failed Screenshots
// ============================================================================

export async function resetFailedScreenshotsAction({
  productIds,
}: {
  productIds?: string[];
} = {}): Promise<ActionResult<{ resetCount: number }>> {
  if (!(await isAdmin())) {
    return actionResponse.unauthorized("Admin privileges required");
  }

  try {
    const service = getScreenshotEnrichmentService();
    const resetCount = await service.resetFailedProducts(productIds);

    return actionResponse.success({ resetCount });
  } catch (error) {
    console.error("Reset failed screenshots action failed:", error);
    return actionResponse.error("Failed to reset failed screenshots");
  }
}
