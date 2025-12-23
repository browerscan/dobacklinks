#!/bin/bash

# Batch Screenshot Capture Script Runner
# Runs 100 batches of 5 screenshots each with 5-second intervals

echo "Starting batch screenshot capture process..."
echo "Target: 100 batches of 5 screenshots with 5-second intervals"
echo "=========================================="
echo ""

# Counter for batches
batch_count=0
capture_count=0
fail_count=0

for i in {1..100}; do
  batch_count=$((batch_count + 1))
  echo ""
  echo "=== Batch $i ($(date '+%Y-%m-%d %H:%M:%S')) ==="
  echo "Running screenshot capture with limit 5..."

  # Run the batch script
  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 5 2>&1 | tee -a batch-capture.log

  # Extract results from the last run
  last_captured=$(grep "Captured:" batch-capture.log | tail -1 | grep -o "Captured: [0-9]*" | cut -d' ' -f2)
  last_failed=$(grep "Failed:" batch-capture.log | tail -1 | grep -o "Failed: [0-9]*" | cut -d' ' -f2)

  if [ ! -z "$last_captured" ]; then
    capture_count=$((capture_count + last_captured))
  fi

  if [ ! -z "$last_failed" ]; then
    fail_count=$((fail_count + last_failed))
  fi

  echo ""
  echo "Batch $i complete. Total captured so far: $capture_count | Failed: $fail_count"

  # Sleep 5 seconds before next batch (except on last iteration)
  if [ $i -lt 100 ]; then
    echo "Waiting 5 seconds before next batch..."
    sleep 5
  fi
done

echo ""
echo "=========================================="
echo "FINAL RESULTS"
echo "=========================================="
echo "Total batches completed: $batch_count"
echo "Total screenshots captured: $capture_count"
echo "Total screenshots failed: $fail_count"
echo "Log file: batch-capture.log"
echo ""
echo "Batch processing complete!"
