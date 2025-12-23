#!/bin/bash
# 循环运行截图脚本直到达到目标数量

TARGET=500
BATCH_SIZE=10
PROCESSED=0

echo "🎯 目标: 处理 $TARGET 个产品"
echo "📦 每批: $BATCH_SIZE 个产品"
echo "开始时间: $(date)"
echo ""

while [ $PROCESSED -lt $TARGET ]; do
  REMAINING=$((TARGET - PROCESSED))
  CURRENT_BATCH=$BATCH_SIZE
  
  if [ $REMAINING -lt $BATCH_SIZE ]; then
    CURRENT_BATCH=$REMAINING
  fi
  
  echo "=========================================="
  echo "🔄 循环 #$((PROCESSED / BATCH_SIZE + 1))"
  echo "已处理: $PROCESSED / $TARGET"
  echo "本批: $CURRENT_BATCH 个产品"
  echo "=========================================="
  echo ""
  
  # 运行脚本
  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit $CURRENT_BATCH
  
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ 脚本执行失败，退出码: $EXIT_CODE"
    exit 1
  fi
  
  # 增加计数器
  PROCESSED=$((PROCESSED + CURRENT_BATCH))
  
  # 等待 5 秒避免 API 限流
  if [ $PROCESSED -lt $TARGET ]; then
    echo ""
    echo "⏳ 等待 5 秒..."
    sleep 5
  fi
done

echo ""
echo "=========================================="
echo "✅ 完成！"
echo "总处理数: $PROCESSED"
echo "结束时间: $(date)"
echo "=========================================="
