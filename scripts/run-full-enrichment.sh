#!/bin/bash

# Full SimilarWeb Enrichment Script
# Processes all pending products in batches of 100

set -e

# Configuration
API_URL="http://localhost:3000/api/cron/enrich-sites"
CRON_SECRET="${CRON_SECRET:-your_cron_secret_here}"
BATCH_SIZE=100
MAX_BATCHES=${MAX_BATCHES:-100}  # Safety limit to prevent infinite loops

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Full SimilarWeb Enrichment${NC}"
echo "=================================================="
echo "API URL: $API_URL"
echo "Batch size: $BATCH_SIZE products per request"
echo "Max batches: $MAX_BATCHES"
echo ""

# Track overall stats
total_enriched=0
total_failed=0
total_batches=0
start_time=$(date +%s)

# Check if dev server is running
if ! curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200\|301\|302"; then
    echo -e "${RED}❌ Error: Development server not running at localhost:3000${NC}"
    echo "Please start the server with: pnpm dev"
    exit 1
fi

# Run enrichment batches
for ((batch=1; batch<=MAX_BATCHES; batch++)); do
    echo -e "\n${YELLOW}📦 Batch $batch/$MAX_BATCHES${NC}"
    echo "---"

    # Call enrichment API
    response=$(curl -s -X GET "$API_URL" \
        -H "Authorization: Bearer $CRON_SECRET" \
        -H "Content-Type: application/json")

    # Parse response
    enriched=$(echo "$response" | grep -o '"enriched":[0-9]*' | cut -d':' -f2 || echo "0")
    failed=$(echo "$response" | grep -o '"failed":[0-9]*' | cut -d':' -f2 || echo "0")
    total=$(echo "$response" | grep -o '"total":[0-9]*' | cut -d':' -f2 || echo "0")
    duration=$(echo "$response" | grep -o '"duration":[0-9]*' | cut -d':' -f2 || echo "0")

    # Update totals
    total_enriched=$((total_enriched + enriched))
    total_failed=$((total_failed + failed))
    total_batches=$batch

    # Display batch results
    echo "✓ Enriched: $enriched"
    echo "✗ Failed: $failed"
    echo "⏱ Duration: ${duration}ms"

    # Check if we're done (no more pending products)
    if [ "$total" -eq 0 ]; then
        echo -e "\n${GREEN}✅ All products processed!${NC}"
        break
    fi

    # Brief pause between batches to avoid overwhelming the API
    sleep 2
done

# Calculate total time
end_time=$(date +%s)
elapsed=$((end_time - start_time))
elapsed_min=$((elapsed / 60))
elapsed_sec=$((elapsed % 60))

# Final summary
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Enrichment Complete!${NC}"
echo ""
echo "Total Batches: $total_batches"
echo "Total Enriched: $total_enriched"
echo "Total Failed: $total_failed"
echo "Total Time: ${elapsed_min}m ${elapsed_sec}s"
echo ""
echo "Run this query to check final status:"
echo "  SELECT enrichment_status, COUNT(*) as count"
echo "  FROM products"
echo "  GROUP BY enrichment_status;"
echo ""
