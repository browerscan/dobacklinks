#!/bin/bash

echo "持续监控直到达到 500 个产品..."
echo ""

while true; do
  sleep 180

  RESULT=$(npx dotenv -e .env.local -- pnpm tsx scripts/check-screenshot-status.ts 2>&1)
  echo "$RESULT"
  echo ""

  CAPTURED=$(echo "$RESULT" | grep "已捕获:" | grep -o "[0-9]\+" | head -1)

  if [ ! -z "$CAPTURED" ] && [ "$CAPTURED" -ge 500 ]; then
    echo ""
    echo "========================================="
    echo "🎉🎉🎉 目标达成！"
    echo "已完成 $CAPTURED 个产品截图！"
    echo "========================================="
    break
  fi

  echo "--- 继续等待 (目标: 500, 当前: $CAPTURED) ---"
  echo ""
done
