#!/bin/bash
# 自动监控脚本 - 每2分钟检查一次进度
# 用法: ./auto-monitor.sh [检查次数，默认无限]

CHECKS=${1:-999999}
BASELINE=0
LAST_COUNT=0

echo "=========================================="
echo "🤖 自动监控启动"
echo "=========================================="
echo "检查间隔: 2分钟"
echo "检查次数: $CHECKS"
echo "Workers: PID 18353, 18452"
echo "=========================================="
echo ""

for i in $(seq 1 $CHECKS); do
  CURRENT=$(ls /Volumes/SSD/dev/links/dobacklinks/dobacklinks/public/screenshots/full/*.webp 2>/dev/null | wc -l | tr -d ' ')

  if [ $BASELINE -eq 0 ]; then
    BASELINE=$CURRENT
    LAST_COUNT=$CURRENT
  fi

  DELTA=$((CURRENT - LAST_COUNT))
  TOTAL_DELTA=$((CURRENT - BASELINE))

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 检查 #$i - $(date '+%Y-%m-%d %H:%M:%S')"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📁 当前: $CURRENT 张"
  echo "📈 本轮增量: +$DELTA 张"
  echo "📊 总增量: +$TOTAL_DELTA 张（从 $BASELINE）"

  # 计算速度（过去2分钟）
  if [ $DELTA -gt 0 ]; then
    RATE=$(awk "BEGIN {printf \"%.1f\", $DELTA / 2}")
    echo "⚡ 速度: $RATE 张/分钟"

    # 估算剩余时间
    PENDING=$(grep "Pending:" worker1.log 2>/dev/null | tail -1 | grep -o -E "[0-9]+" | head -1)
    if [ ! -z "$PENDING" ] && [ "$RATE" != "0" ]; then
      ETA=$(awk "BEGIN {printf \"%.1f\", $PENDING / $RATE / 60}")
      echo "⏱️  预计剩余: ~$ETA 小时"
    fi
  else
    echo "⚠️  速度: 0 张/分钟（可能暂时停滞）"
  fi

  # Worker状态
  echo ""
  echo "👷 Workers:"
  if ps -p 18353 > /dev/null 2>&1; then
    echo "  ✅ Worker 1 (18353) 运行中"
  else
    echo "  ❌ Worker 1 (18353) 已停止"
  fi

  if ps -p 18452 > /dev/null 2>&1; then
    echo "  ✅ Worker 2 (18452) 运行中"
  else
    echo "  ❌ Worker 2 (18452) 已停止"
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  LAST_COUNT=$CURRENT

  # 如果不是最后一次检查，等待2分钟
  if [ $i -lt $CHECKS ]; then
    echo "⏳ 等待2分钟..."
    sleep 120
  fi
done

echo ""
echo "=========================================="
echo "✅ 监控完成"
echo "=========================================="
echo "总增量: +$TOTAL_DELTA 张"
echo "最终数量: $CURRENT 张"
echo ""
