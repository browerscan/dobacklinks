#!/bin/bash

# 批量截图循环脚本
# 连续运行直到处理 500 个产品

cd /Volumes/SSD/dev/links/dobacklinks/dobacklinks

TARGET=500
BATCH_SIZE=100
PROCESSED=0
TOTAL_CAPTURED=0
TOTAL_FAILED=0

echo "🚀 开始批量截图任务"
echo "目标: $TARGET 个产品"
echo "批次大小: $BATCH_SIZE"
echo "================================================"

# 循环运行直到达到目标
while [ $PROCESSED -lt $TARGET ]; do
  echo ""
  echo "📊 当前进度: $PROCESSED/$TARGET"
  echo "✅ 已成功: $TOTAL_CAPTURED"
  echo "❌ 已失败: $TOTAL_FAILED"
  echo "------------------------------------------------"

  # 运行批次
  OUTPUT=$(npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit $BATCH_SIZE 2>&1)

  # 提取成功和失败数量
  CAPTURED=$(echo "$OUTPUT" | grep "Captured:" | tail -1 | grep -oE '[0-9]+' | head -1)
  FAILED=$(echo "$OUTPUT" | grep "Failed:" | tail -1 | grep -oE '[0-9]+' | head -1)

  # 更新计数
  if [ -n "$CAPTURED" ]; then
    TOTAL_CAPTURED=$((TOTAL_CAPTURED + CAPTURED))
    PROCESSED=$((PROCESSED + CAPTURED))
  fi

  if [ -n "$FAILED" ]; then
    TOTAL_FAILED=$((TOTAL_FAILED + FAILED))
    PROCESSED=$((PROCESSED + FAILED))
  fi

  # 显示输出
  echo "$OUTPUT"

  # 如果这次没有处理任何产品，可能是没有待处理的了
  if [ -z "$CAPTURED" ] && [ -z "$FAILED" ]; then
    echo "⚠️  没有更多待处理的产品"
    break
  fi

  # 短暂延迟避免过载
  echo "⏸️  等待 5 秒..."
  sleep 5
done

echo ""
echo "================================================"
echo "🎉 批量截图任务完成"
echo "总处理数: $PROCESSED"
echo "✅ 成功: $TOTAL_CAPTURED"
echo "❌ 失败: $TOTAL_FAILED"
echo "================================================"
