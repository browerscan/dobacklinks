#!/bin/bash
# Quick progress monitoring script

while true; do
  clear
  echo "=== 截图捕获进度监控（优化版）==="
  echo "检查时间: $(date '+%H:%M:%S')"
  echo ""

  \
  npx dotenv -e .env.local -- npx tsx scripts/check-status-quick.ts

  echo ""
  echo "最近日志:"
  tail -10 /tmp/screenshot-capture-optimized.log | grep -E "(Progress|Batch|captured|failed)"

  echo ""
  echo "下次更新: 60秒后 (Ctrl+C 停止)"
  sleep 60
done
