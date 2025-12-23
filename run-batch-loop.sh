#!/bin/bash

START_TIME=$(date +%s)
BATCH=0
TIMEOUT=600  # 10 minutes

while true; do
  ELAPSED=$(($(date +%s) - START_TIME))
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo ""
    echo "=========================================="
    echo "Timeout reached (10 minutes)"
    echo "Final batch number: $BATCH"
    echo "=========================================="
    break
  fi

  BATCH=$((BATCH + 1))
  echo ""
  echo "=== Batch $BATCH ($(date +'%H:%M:%S')) ==="

  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 5 2>&1 | tail -12

  sleep 5
done
