#!/bin/bash

TARGET=500
COUNTER=0

echo "目标：处理 ${TARGET} 个产品"

while [ $COUNTER -lt 50 ]; do
  COUNTER=$((COUNTER + 1))
  echo ""
  echo "========================================="
  echo "运行批次 ${COUNTER}/50"
  echo "========================================="

  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 500

  # 检查当前状态
  echo ""
  echo "检查当前进度..."
  npx dotenv -e .env.local -- pnpm tsx scripts/check-screenshot-status.ts

  # 短暂休息
  sleep 2
done

echo ""
echo "========================================="
echo "完成 50 个批次运行"
echo "========================================="
npx dotenv -e .env.local -- pnpm tsx scripts/check-screenshot-status.ts
