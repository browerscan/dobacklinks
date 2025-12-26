/**
 * Test Database Performance Monitoring
 *
 * Run with: node scripts/test-db-performance.mjs
 */

import { config } from "dotenv";
config({ path: ".env.local" });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

console.log("Environment loaded, DATABASE_URL:", process.env.DATABASE_URL.substring(0, 30) + "...");

// Dynamic imports to ensure env is loaded first
const { db } = await import("@/lib/db/index.js");
const { products } = await import("@/lib/db/schema.js");
const { sql } = await import("drizzle-orm");
const { getPerformanceMetrics, getSlowQueryStats } = await import("@/lib/db/performance.js");
const { logger } = await import("@/lib/logger.js");

async function testPerformanceMonitoring() {
  logger.info("Starting database performance monitoring test...");

  try {
    // Test 1: Simple query (should be fast)
    logger.info("Test 1: Simple query");
    const fastQueryStart = Date.now();
    const fastResult = await db.select().from(products).limit(1);
    const fastQueryDuration = Date.now() - fastQueryStart;
    logger.info("Fast query completed", {
      durationMs: fastQueryDuration,
      results: fastResult.length,
    });

    // Test 2: Query with ordering (slower)
    logger.info("Test 2: Query with ordering");
    const orderQueryStart = Date.now();
    const orderResult = await db
      .select()
      .from(products)
      .orderBy(sql`RANDOM()`)
      .limit(10);
    const orderQueryDuration = Date.now() - orderQueryStart;
    logger.info("Ordered query completed", {
      durationMs: orderQueryDuration,
      results: orderResult.length,
    });

    // Test 3: Count query (fast)
    logger.info("Test 3: Count query");
    const countQueryStart = Date.now();
    const countResult = await db.select({ count: sql`count(*)::int` }).from(products);
    const countQueryDuration = Date.now() - countQueryStart;
    logger.info("Count query completed", {
      durationMs: countQueryDuration,
      totalProducts: countResult[0]?.count,
    });

    // Wait a bit for async logging to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test 4: Get performance metrics
    logger.info("Test 4: Fetching performance metrics");
    const metrics = getPerformanceMetrics();
    logger.info("Performance metrics", {
      totalQueries: metrics.totalQueries,
      slowQueries: metrics.slowQueries,
      avgDurationMs: Math.round(metrics.avgDurationMs * 100) / 100,
      maxDurationMs: Math.round(metrics.maxDurationMs * 100) / 100,
    });

    // Test 5: Get slow query stats
    logger.info("Test 5: Fetching slow query statistics");
    const slowStats = getSlowQueryStats();
    logger.info("Slow query statistics", {
      totalSlowQueries: slowStats.total,
      patterns: Object.keys(slowStats.byPattern).length,
    });

    // Test 6: Simulate slow query (using pg_sleep if available)
    logger.info("Test 6: Testing slow query detection");
    try {
      await db.execute(sql`SELECT pg_sleep(0.1)`); // 100ms sleep
      logger.info("Slow query simulation completed");
    } catch (error) {
      logger.warn("pg_sleep not available (expected on some databases)", { error });
    }

    // Wait for async logging
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Final metrics
    const finalMetrics = getPerformanceMetrics();
    logger.info("Final performance metrics", {
      totalQueries: finalMetrics.totalQueries,
      slowQueries: finalMetrics.slowQueries,
      avgDurationMs: Math.round(finalMetrics.avgDurationMs * 100) / 100,
      maxDurationMs: Math.round(finalMetrics.maxDurationMs * 100) / 100,
      slowQueryPercentage:
        finalMetrics.totalQueries > 0
          ? Math.round((finalMetrics.slowQueries / finalMetrics.totalQueries) * 10000) / 100
          : 0,
    });

    // Display top query patterns
    if (Object.keys(finalMetrics.queriesByPattern).length > 0) {
      logger.info("Query patterns", {
        patterns: Object.entries(finalMetrics.queriesByPattern)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([pattern, count]) => ({ pattern: pattern.substring(0, 80), count })),
      });
    }

    logger.info("Performance monitoring test completed successfully");

    // Display curl command for API testing
    console.log("\n" + "=".repeat(60));
    console.log("API Testing Commands:");
    console.log("=".repeat(60));
    console.log("\n1. Get performance summary:");
    console.log("curl http://localhost:3000/api/debug/performance\n");
    console.log("2. Get performance with statistics:");
    console.log('curl "http://localhost:3000/api/debug/performance?includeStats=true"\n');
    console.log("3. Get performance with slow queries:");
    console.log(
      'curl "http://localhost:3000/api/debug/performance?includeSlowQueries=true&includeStats=true"\n',
    );
    console.log("4. Reset metrics:");
    console.log(
      'curl -X POST http://localhost:3000/api/debug/performance -H "Content-Type: application/json" -d \'{"action":"reset"}\'\n',
    );
  } catch (error) {
    logger.error(
      "Performance monitoring test failed",
      { error },
      error instanceof Error ? error : new Error(String(error)),
    );
    process.exit(1);
  }
}

// Run the test
testPerformanceMonitoring()
  .then(() => {
    logger.info("Test completed");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Test failed with error", { error });
    process.exit(1);
  });
