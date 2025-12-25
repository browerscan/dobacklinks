-- Fix app_images by removing HTML page URLs and keeping only actual image URLs
-- This script will:
-- 1. Find products with HTML URLs in app_images
-- 2. Filter out any URLs ending in .html or containing /20XX/ (blog post paths)
-- 3. Keep only valid image URLs (.jpg, .jpeg, .png, .gif, .webp, .svg, etc.)

-- First, let's see what we're dealing with
SELECT
  COUNT(*) as total_affected,
  COUNT(DISTINCT id) as unique_products
FROM products,
  unnest(COALESCE(app_images, ARRAY[]::text[])) as img
WHERE img LIKE '%.html%' OR img ~ '/\d{4}/\d{2}/';

-- Update products: remove HTML URLs and blog post paths
UPDATE products
SET app_images = (
  SELECT ARRAY_AGG(img)
  FROM unnest(COALESCE(app_images, ARRAY[]::text[])) as img
  WHERE
    -- Keep only if it's an image file extension or screenshot path
    (img ~ '\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$' OR img LIKE '/screenshots/%')
    -- Exclude HTML files and blog post paths
    AND img NOT LIKE '%.html%'
    AND img !~ '/\d{4}/\d{2}/'
)
WHERE EXISTS (
  SELECT 1
  FROM unnest(COALESCE(app_images, ARRAY[]::text[])) as img
  WHERE img LIKE '%.html%' OR img ~ '/\d{4}/\d{2}/'
);

-- Show summary of changes
SELECT
  COUNT(*) FILTER (WHERE app_images IS NULL OR array_length(app_images, 1) IS NULL) as cleared,
  COUNT(*) FILTER (WHERE app_images IS NOT NULL AND array_length(app_images, 1) > 0) as has_valid_images,
  COUNT(*) as total_updated
FROM products
WHERE id IN (
  SELECT DISTINCT p.id
  FROM products p,
    unnest(COALESCE(p.app_images, ARRAY[]::text[])) as img
  WHERE img LIKE '%.html%' OR img ~ '/\d{4}/\d{2}/'
);
