-- ========================================
-- Performance Indexes for dobacklinks
-- ========================================
-- This script adds composite indexes to optimize common query patterns
-- Date: 2025-12-26
-- ========================================

-- Set statement timeout to 5 minutes per index
SET statement_timeout = '300s';

-- ========================================
-- 1. PRIMARY SEARCH INDEX
-- Covers: WHERE status = 'live' AND enrichmentStatus = 'enriched'
--         ORDER BY dr DESC, monthlyVisits DESC
-- Used by: /api/search (most frequent query)
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_live_search
  ON products (status, enrichment_status, dr DESC, monthly_visits DESC)
  WHERE status = 'live';

-- ========================================
-- 2. LIVE + DR SORT INDEX
-- Covers: WHERE status = 'live' ORDER BY dr DESC
-- Used by: Category pages, homepage listings
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_live_dr
  ON products (status, dr DESC)
  WHERE status = 'live';

-- ========================================
-- 3. FEATURED PRODUCTS INDEX
-- Covers: WHERE isFeatured = true AND status = 'live'
--         ORDER BY submittedAt DESC
-- Used by: Homepage featured section, category pages
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_featured_live
  ON products (is_featured, status, submitted_at DESC)
  WHERE is_featured = true AND status = 'live';

-- ========================================
-- 4. USER PRODUCTS DASHBOARD INDEX
-- Covers: WHERE userId = ? ORDER BY createdAt DESC, lastRenewedAt DESC
-- Used by: User profile "My Products" listing
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_user_created
  ON products (user_id, created_at DESC, last_renewed_at DESC);

-- ========================================
-- 5. ADMIN PENDING REVIEW INDEX
-- Covers: WHERE status = 'pending_review' ORDER BY createdAt DESC
-- Used by: Admin dashboard sites management
-- NOTE: pending_payment status removed from enum, only pending_review exists
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_admin_pending
  ON products (status, created_at DESC)
  WHERE status = 'pending_review';

-- ========================================
-- 6. NICHE + DR COMPOSITE INDEX
-- Covers: WHERE status = 'live' AND niche = ? ORDER BY dr DESC
-- Used by: Category filtering, niche-based searches
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_live_niche_dr
  ON products (status, niche, dr DESC)
  WHERE status = 'live';

-- ========================================
-- 7. ENRICHMENT TIME-BASED INDEX
-- Covers: ORDER BY enrichedAt DESC, createdAt DESC
-- Used by: Enrichment dashboard
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enriched_at
  ON products (enriched_at DESC, created_at DESC);

-- ========================================
-- 8. SCREENSHOT SCHEDULING INDEX
-- Covers: WHERE screenshotStatus = 'pending' OR screenshotNextCaptureAt <= NOW()
--         ORDER BY screenshotNextCaptureAt ASC
-- Used by: Screenshot cron jobs
-- ========================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_screenshot_schedule
  ON products (screenshot_status, screenshot_next_capture_at);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Show all indexes on products table
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
ORDER BY indexname;

-- Show index sizes (after creation)
SELECT
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname = 'products'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ========================================
-- PERFORMANCE NOTES
-- ========================================
-- 1. All indexes created with CONCURRENTLY to avoid table locks
-- 2. Partial indexes (WHERE clause) reduce storage for live/pending data
-- 3. DESC ordering specified for performance on DESC sorts
-- 4. Consider running ANALYZE products after index creation
-- ========================================

ANALYZE products;
