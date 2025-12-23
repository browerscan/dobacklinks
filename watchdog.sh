#!/bin/bash
# Worker守护进程 - 自动监控并重启Worker
# 用法: nohup bash watchdog.sh > watchdog.log 2>&1 &

WORKER_PID=18353
CHECK_INTERVAL=60  # 每60秒检查一次

echo "=========================================="
echo "🐕 Worker守护进程启动"
echo "=========================================="
date '+启动时间: %Y-%m-%d %H:%M:%S'
echo "监控Worker: PID $WORKER_PID"
echo "检查间隔: ${CHECK_INTERVAL}秒"
echo "=========================================="
echo ""

restart_count=0

while true; do
  # 检查Worker是否运行
  if ps -p $WORKER_PID > /dev/null 2>&1; then
    # Worker正常运行
    date '+[%H:%M:%S] ✅ Worker运行中'
  else
    # Worker已停止，需要重启
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    date '+[%H:%M:%S] ⚠️  Worker已停止，正在重启...'
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 重启Worker
    nohup bash -c '
while true; do
  echo "[Worker-1] Batch started at $(date)" >> worker1.log
  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 10 >> worker1.log 2>&1
  echo "[Worker-1] Sleeping 15 seconds..." >> worker1.log
  sleep 15
done
' > /dev/null 2>&1 &

    NEW_PID=$!
    restart_count=$((restart_count + 1))

    echo "✅ Worker已重启"
    echo "   新PID: $NEW_PID"
    echo "   重启次数: $restart_count"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # 更新监控的PID
    WORKER_PID=$NEW_PID

    # 等待10秒让Worker启动
    sleep 10
  fi

  # 等待下次检查
  sleep $CHECK_INTERVAL
done
