#!/bin/bash
# 📊 Turbo模式实时监控 - 每10秒自动刷新

INITIAL_COUNT=6851
START_TIME="2025-12-22 09:06:34"

while true; do
  clear
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Turbo模式实时监控"
  date '+%Y-%m-%d %H:%M:%S'
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # 当前统计
  CURRENT=$(ls public/screenshots/full/*.webp 2>/dev/null | wc -l | tr -d ' ')
  SIZE=$(du -sh public/screenshots/full 2>/dev/null | awk '{print $1}')
  NEW_COUNT=$((CURRENT - INITIAL_COUNT))

  # 计算运行时间（秒）
  NOW=$(date +%s)
  START=$(date -j -f "%Y-%m-%d %H:%M:%S" "$START_TIME" +%s 2>/dev/null || echo $NOW)
  ELAPSED=$((NOW - START))
  ELAPSED_MIN=$((ELAPSED / 60))

  # 计算速度
  if [ $ELAPSED -gt 0 ]; then
    SPEED_PER_MIN=$(echo "scale=1; $NEW_COUNT * 60 / $ELAPSED" | bc 2>/dev/null || echo "0")
    SPEED_PER_HOUR=$(echo "scale=0; $SPEED_PER_MIN * 60" | bc 2>/dev/null || echo "0")
  else
    SPEED_PER_MIN=0
    SPEED_PER_HOUR=0
  fi

  echo "📁 文件统计:"
  echo "   总文件数: $CURRENT 张 ($SIZE)"
  echo "   新增截图: $NEW_COUNT 张"
  echo ""

  echo "⏱️  运行时间:"
  echo "   已运行: ${ELAPSED_MIN} 分钟 (${ELAPSED} 秒)"
  echo ""

  echo "⚡ 处理速度:"
  echo "   当前速度: $SPEED_PER_MIN 张/分钟"
  echo "   预计速度: $SPEED_PER_HOUR 张/小时"
  echo ""

  # Worker状态
  echo "👷 Worker状态:"
  ACTIVE_WORKERS=0
  for i in {1..6}; do
    WORKER_PID=$(ps aux | grep "while true; do" | grep "worker$i.log" | grep -v grep | awk '{print $2}' | head -1)
    if [ ! -z "$WORKER_PID" ]; then
      ACTIVE_WORKERS=$((ACTIVE_WORKERS + 1))
      echo "   ✅ Worker $i (PID: $WORKER_PID)"
    else
      echo "   ❌ Worker $i"
    fi
  done
  echo "   总计: $ACTIVE_WORKERS/6 个活跃"
  echo ""

  # 预计完成时间
  if [ "$SPEED_PER_HOUR" != "0" ]; then
    REMAINING=4627
    ETA_HOURS=$(echo "scale=1; $REMAINING / $SPEED_PER_HOUR" | bc 2>/dev/null || echo "N/A")
    echo "🎯 预计完成:"
    echo "   剩余任务: $REMAINING 张"
    echo "   预计耗时: $ETA_HOURS 小时"
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "💡 按 Ctrl+C 退出监控"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # 10秒刷新
  sleep 10
done
