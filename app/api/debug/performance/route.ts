/**
 * Database Performance Debug API
 *
 * GET /api/debug/performance - Get performance metrics
 * POST /api/debug/performance/reset - Reset metrics
 *
 * Only available in development environment
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  getPerformanceMetrics,
  getSlowQueryStats,
  resetPerformanceMetrics,
} from "@/lib/db/performance";

/**
 * Environment check - only allow in development
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * GET /api/debug/performance
 *
 * Returns database performance metrics including:
 * - Total queries executed
 * - Slow query count
 * - Average/max duration
 * - Query patterns
 * - Recent slow queries
 */
export async function GET(request: NextRequest) {
  // Security: Only available in development
  if (!isDevelopment()) {
    return NextResponse.json(
      { error: "Performance debug endpoint is only available in development" },
      { status: 403 },
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const includeSlowQueries = searchParams.get("includeSlowQueries") === "true";
    const includeStats = searchParams.get("includeStats") === "true";

    const metrics = getPerformanceMetrics();
    const response: Record<string, unknown> = {
      summary: {
        totalQueries: metrics.totalQueries,
        slowQueries: metrics.slowQueryCount,
        avgDurationMs: Math.round(metrics.avgDurationMs * 100) / 100,
        maxDurationMs: Math.round(metrics.maxDurationMs * 100) / 100,
        slowQueryPercentage:
          metrics.totalQueries > 0
            ? Math.round((metrics.slowQueryCount / metrics.totalQueries) * 10000) / 100
            : 0,
      },
      timestamp: new Date().toISOString(),
    };

    if (includeStats) {
      const stats = getSlowQueryStats();
      response.stats = {
        totalSlowQueries: stats.total,
        topSlowPatterns: Object.entries(stats.byPattern)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 10)
          .map(([pattern, data]) => ({
            pattern,
            count: data.count,
            avgDurationMs: Math.round(data.avgDuration * 100) / 100,
            maxDurationMs: Math.round(data.maxDuration * 100) / 100,
          })),
      };
    }

    if (includeSlowQueries) {
      response.slowQueries = metrics.slowQueriesList.slice(-20).map((q) => ({
        sql: q.sql.substring(0, 500), // Truncate long queries
        durationMs: Math.round(q.durationMs * 100) / 100,
        timestamp: q.timestamp,
      }));
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      "Failed to fetch performance metrics",
      { error },
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: "Failed to fetch performance metrics" }, { status: 500 });
  }
}

/**
 * POST /api/debug/performance/reset
 *
 * Resets all performance metrics
 */
export async function POST(request: NextRequest) {
  // Security: Only available in development
  if (!isDevelopment()) {
    return NextResponse.json(
      { error: "Performance debug endpoint is only available in development" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const actionSchema = z.object({
      action: z.enum(["reset"]).default("reset"),
    });

    const { action } = actionSchema.parse(body);

    if (action === "reset") {
      resetPerformanceMetrics();
      logger.info("Performance metrics reset");
    }

    return NextResponse.json({
      success: true,
      message: "Performance metrics reset successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      "Failed to reset performance metrics",
      { error },
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: "Failed to reset performance metrics" }, { status: 500 });
  }
}
