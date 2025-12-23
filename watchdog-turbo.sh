#!/bin/bash
# 🐕 Turbo模式守护进程 - 监控6个Worker
# 每60秒检查一次，自动重启崩溃的Worker

LOG_FILE="watchdog-turbo.log"

echo "[$(date)] 🐕 Turbo守护进程启动" >> $LOG_FILE

while true; do
  # 检查每个Worker
  for i in {1..6}; do
    WORKER_PID=$(ps aux | grep "while true; do" | grep "worker$i.log" | grep -v grep | awk '{print $2}' | head -1)

    if [ -z "$WORKER_PID" ]; then
      echo "[$(date)] ⚠️  Worker $i 未运行，正在重启..." >> $LOG_FILE

      # 重启Worker
      nohup bash -c "
while true; do
  echo \"[Worker-$i] Batch started at \$(date)\" >> worker$i.log
  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 20 >> worker$i.log 2>&1
  echo \"[Worker-$i] Sleeping 5 seconds...\" >> worker$i.log
  sleep 5
done
" > /dev/null 2>&1 &

      NEW_PID=$!
      echo "[$(date)] ✅ Worker $i 已重启 (PID: $NEW_PID)" >> $LOG_FILE
    fi
  done

  # 每60秒检查一次
  sleep 60
done
