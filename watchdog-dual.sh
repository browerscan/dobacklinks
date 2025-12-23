#!/bin/bash
# 双Worker守护进程 - 自动监控并重启2个Worker
# 用法: nohup bash watchdog-dual.sh > watchdog.log 2>&1 &

WORKER1_PID=16590
WORKER2_PID=16986
CHECK_INTERVAL=60  # 每60秒检查一次

echo "=========================================="
echo "🐕 双Worker守护进程启动"
echo "=========================================="
date '+启动时间: %Y-%m-%d %H:%M:%S'
echo "监控Worker 1: PID $WORKER1_PID"
echo "监控Worker 2: PID $WORKER2_PID"
echo "检查间隔: ${CHECK_INTERVAL}秒"
echo "=========================================="
echo ""

restart_count_w1=0
restart_count_w2=0

while true; do
  current_time=$(date '+[%H:%M:%S]')

  # 检查Worker 1
  if ps -p $WORKER1_PID > /dev/null 2>&1; then
    echo "$current_time ✅ Worker 1运行中"
  else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$current_time ⚠️  Worker 1已停止，正在重启..."

    nohup bash -c '
while true; do
  echo "[Worker-1] Batch started at $(date)" >> worker1.log
  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 10 >> worker1.log 2>&1
  echo "[Worker-1] Sleeping 15 seconds..." >> worker1.log
  sleep 15
done
' > /dev/null 2>&1 &

    WORKER1_PID=$!
    restart_count_w1=$((restart_count_w1 + 1))
    echo "✅ Worker 1已重启 (新PID: $WORKER1_PID, 重启次数: $restart_count_w1)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    sleep 10
  fi

  # 检查Worker 2
  if ps -p $WORKER2_PID > /dev/null 2>&1; then
    echo "$current_time ✅ Worker 2运行中"
  else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$current_time ⚠️  Worker 2已停止，正在重启..."

    # Worker 2延迟20秒启动避免冲突
    sleep 20

    nohup bash -c '
while true; do
  echo "[Worker-2] Batch started at $(date)" >> worker2.log
  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 10 >> worker2.log 2>&1
  echo "[Worker-2] Sleeping 15 seconds..." >> worker2.log
  sleep 15
done
' > /dev/null 2>&1 &

    WORKER2_PID=$!
    restart_count_w2=$((restart_count_w2 + 1))
    echo "✅ Worker 2已重启 (新PID: $WORKER2_PID, 重启次数: $restart_count_w2)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    sleep 10
  fi

  sleep $CHECK_INTERVAL
done
