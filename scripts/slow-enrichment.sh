#!/bin/bash

# Slow SimilarWeb Enrichment Script
# Processes products slowly to avoid rate limits
# Usage: CRON_SECRET=xxx ./scripts/slow-enrichment.sh

set -e

API_URL="http://localhost:3000/api/cron/enrich-sites"
CRON_SECRET="${CRON_SECRET:-your_cron_secret_here}"
DELAY_SECONDS="${DELAY_SECONDS:-60}"  # Wait between batches (default: 60s)
MAX_BATCHES="${MAX_BATCHES:-1000}"    # Safety limit

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🐢 Starting Slow SimilarWeb Enrichment${NC}"
echo "=================================================="
echo "API URL: $API_URL"
echo "Delay between batches: ${DELAY_SECONDS}s"
echo "Max batches: $MAX_BATCHES"
echo ""

total_enriched=0
total_failed=0
batch_count=0

# Check server
if ! curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200\|301\|302"; then
    echo -e "${RED}❌ Dev server not running at localhost:3000${NC}"
    exit 1
fi

for ((batch=1; batch<=MAX_BATCHES; batch++)); do
    echo -e "\n${YELLOW}📦 Batch $batch ($(date '+%H:%M:%S'))${NC}"

    response=$(curl -s -X GET "$API_URL" \
        -H "Authorization: Bearer $CRON_SECRET" \
        -H "Content-Type: application/json" \
        --max-time 300)

    enriched=$(echo "$response" | grep -o '"enriched":[0-9]*' | cut -d':' -f2 || echo "0")
    failed=$(echo "$response" | grep -o '"failed":[0-9]*' | cut -d':' -f2 || echo "0")
    total=$(echo "$response" | grep -o '"total":[0-9]*' | cut -d':' -f2 || echo "0")

    total_enriched=$((total_enriched + enriched))
    total_failed=$((total_failed + failed))
    batch_count=$batch

    echo "✓ Enriched: $enriched | ✗ Failed: $failed | Total so far: $total_enriched enriched, $total_failed failed"

    # Done if no more pending
    if [ "$total" -eq 0 ]; then
        echo -e "\n${GREEN}✅ All products processed!${NC}"
        break
    fi

    # Wait before next batch
    echo "⏳ Waiting ${DELAY_SECONDS}s before next batch..."
    sleep $DELAY_SECONDS
done

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Enrichment Summary${NC}"
echo "Batches run: $batch_count"
echo "Total enriched: $total_enriched"
echo "Total failed: $total_failed"
