-- ========================================
-- Index Performance Test for dobacklinks
-- ========================================
-- This script tests the performance of newly created indexes
-- Date: 2025-12-26
-- ========================================

-- Enable query timing
\timing on

-- ========================================
-- TEST 1: Primary Search Query (Live + Enriched)
-- Covers: idx_products_live_search (PARTIAL)
-- Query: WHERE status = 'live' ORDER BY dr DESC, monthlyVisits DESC
-- ========================================
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name, dr, monthly_visits
FROM products
WHERE status = 'live'
ORDER BY dr DESC, monthly_visits DESC
LIMIT 20;

-- ========================================
-- TEST 2: Category/Niche Filtering
-- Covers: idx_products_live_niche_dr (PARTIAL)
-- Query: WHERE status = 'live' AND niche LIKE '%Technology%' ORDER BY dr DESC
-- ========================================
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name, niche, dr
FROM products
WHERE status = 'live' AND niche ILIKE '%technology%'
ORDER BY dr DESC
LIMIT 20;

-- ========================================
-- TEST 3: Featured Products
-- Covers: idx_products_featured_live (PARTIAL)
-- Query: WHERE isFeatured = true AND status = 'live' ORDER BY submittedAt DESC
-- ========================================
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name, is_featured, submitted_at
FROM products
WHERE is_featured = true AND status = 'live'
ORDER BY submitted_at DESC
LIMIT 20;

-- ========================================
-- TEST 4: User Products Dashboard
-- Covers: idx_products_user_created (FULL)
-- Query: WHERE userId = ? ORDER BY createdAt DESC
-- Note: Using first user_id from database
-- ========================================
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM products LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing user products query for user_id: %', v_user_id;
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT id, name, created_at
    FROM products
    WHERE user_id = v_user_id
    ORDER BY created_at DESC, last_renewed_at DESC
    LIMIT 20;
  ELSE
    RAISE NOTICE 'No user_id found for testing';
  END IF;
END $$;

-- ========================================
-- TEST 5: Admin Pending Review
-- Covers: idx_products_admin_pending (PARTIAL)
-- Query: WHERE status = 'pending_review' ORDER BY createdAt DESC
-- ========================================
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name, status, created_at
FROM products
WHERE status = 'pending_review'
ORDER BY created_at DESC
LIMIT 20;

-- ========================================
-- TEST 6: Enrichment Dashboard
-- Covers: idx_products_enriched_at (FULL)
-- Query: ORDER BY enrichedAt DESC, createdAt DESC
-- ========================================
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name, enrichment_status, enriched_at
FROM products
WHERE enrichment_status = 'enriched'
ORDER BY enriched_at DESC, created_at DESC
LIMIT 20;

-- ========================================
-- TEST 7: Screenshot Scheduling
-- Covers: idx_products_screenshot_schedule (FULL)
-- Query: WHERE screenshotStatus = 'pending' ORDER BY screenshotNextCaptureAt ASC
-- ========================================
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name, screenshot_status, screenshot_next_capture_at
FROM products
WHERE screenshot_status = 'pending' OR screenshot_next_capture_at <= NOW()
ORDER BY screenshot_next_capture_at ASC
LIMIT 20;

-- ========================================
-- INDEX USAGE STATISTICS
-- ========================================
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND relname = 'products'
ORDER BY idx_scan DESC;

-- ========================================
-- MISSING INDEXES DETECTION
-- Queries for indexes that may not be used
-- ========================================
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS index_scans,
  CASE
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 10 THEN 'LOW USAGE'
    ELSE 'IN USE'
  END AS usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND relname = 'products'
ORDER BY idx_scan ASC;

-- ========================================
-- PERFORMANCE SUMMARY
-- ========================================
-- Look for:
-- 1. "Index Scan" in EXPLAIN output (good - index is being used)
-- 2. "Seq Scan" in EXPLAIN output (bad - table scan, index not used)
-- 3. Execution time (lower is better)
-- 4. Buffers shared hit (higher is better, means disk I/O avoided)
-- 5. index_scans > 0 in usage stats (index is being used)
-- ========================================
