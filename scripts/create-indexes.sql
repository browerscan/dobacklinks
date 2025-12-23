-- Create performance indexes for products table
-- Run this script to add indexes for SimilarWeb enrichment optimization

-- Index for enrichment status queries
CREATE INDEX IF NOT EXISTS idx_products_enrichment_status
ON products(enrichment_status);

-- Index for niche filtering
CREATE INDEX IF NOT EXISTS idx_products_niche
ON products(niche);

-- Index for DR sorting
CREATE INDEX IF NOT EXISTS idx_products_dr
ON products(dr);

-- Index for monthly visits sorting
CREATE INDEX IF NOT EXISTS idx_products_monthly_visits
ON products(monthly_visits);

-- Composite index for status + enrichment status
CREATE INDEX IF NOT EXISTS idx_products_status_enrichment
ON products(status, enrichment_status);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_products_status
ON products(status);

-- Verify indexes were created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'products'
AND indexname LIKE 'idx_products_%'
ORDER BY indexname;
