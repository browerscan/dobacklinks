#!/bin/bash

# Run 100 batches of 5 screenshots each
cd /Volumes/SSD/dev/links/dobacklinks/dobacklinks

echo "Starting 100 batch screenshot captures..."
echo "Each batch processes up to 5 pending screenshots"
echo "=================================================="
echo ""

TOTAL_CAPTURED=0
TOTAL_FAILED=0

for i in $(seq 1 100); do
  echo "=== Batch $i / 100 ==="

  # Run batch capture
  OUTPUT=$(npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 5 2>&1)

  # Display output
  echo "$OUTPUT"

  # Extract stats
  CAPTURED=$(echo "$OUTPUT" | grep "Captured:" | tail -1 | grep -oE '[0-9]+' | head -1)
  FAILED=$(echo "$OUTPUT" | grep "Failed:" | tail -1 | grep -oE '[0-9]+' | head -1)

  if [ -n "$CAPTURED" ]; then
    TOTAL_CAPTURED=$((TOTAL_CAPTURED + CAPTURED))
  fi

  if [ -n "$FAILED" ]; then
    TOTAL_FAILED=$((TOTAL_FAILED + FAILED))
  fi

  # Check if there's more work to do
  PENDING=$(echo "$OUTPUT" | grep "Pending:" | grep -oE '[0-9]+' | head -1)

  if [ "$PENDING" == "0" ] || [ -z "$PENDING" ]; then
    echo ""
    echo "No more pending screenshots to process!"
    break
  fi

  # Show progress
  echo ""
  echo "Progress: Batch $i | Captured so far: $TOTAL_CAPTURED | Failed: $TOTAL_FAILED"
  echo "=================================================="
  echo ""

  # Wait before next batch
  sleep 5
done

echo ""
echo "======== FINAL RESULTS ========"
echo "Total Batches Run: $(seq 1 100 | tail -1)"
echo "Total Captured: $TOTAL_CAPTURED"
echo "Total Failed: $TOTAL_FAILED"
echo "=================================="
