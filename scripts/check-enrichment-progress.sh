#!/bin/bash

# Check enrichment progress from database
# Run this while enrichment is in progress to see real-time stats

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 SimilarWeb Enrichment Progress${NC}"
echo "=================================================="
echo ""

# Get DATABASE_URL from .env.local
export $(grep "^DATABASE_URL=" .env.local | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not found in .env.local"
    exit 1
fi

# Query database for status distribution
echo -e "${YELLOW}Status Distribution:${NC}"
psql "$DATABASE_URL" -c "
SELECT
  enrichment_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM products
GROUP BY enrichment_status
ORDER BY count DESC;
" 2>/dev/null || echo "Database query failed"

echo ""
echo -e "${YELLOW}Recent Enrichments (last 5):${NC}"
psql "$DATABASE_URL" -c "
SELECT
  name,
  monthly_visits,
  enriched_at
FROM products
WHERE enrichment_status = 'enriched'
ORDER BY enriched_at DESC
LIMIT 5;
" 2>/dev/null || echo "Database query failed"

echo ""
echo -e "${GREEN}Last updated: $(date)${NC}"
