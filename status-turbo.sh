#!/bin/bash
# Turbo模式状态监控

clear
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Turbo Worker系统状态"
date '+%Y-%m-%d %H:%M:%S'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 截图文件统计
CURRENT=$(ls public/screenshots/full/*.webp 2>/dev/null | wc -l | tr -d ' ')
SIZE=$(du -sh public/screenshots/full 2>/dev/null | awk '{print $1}')
echo "📁 截图文件: $CURRENT 张 ($SIZE)"
echo ""

# 数据库状态
echo "📊 数据库状态:"
if [ -f worker1.log ]; then
  grep -E "Pending:|Captured:|Failed:" worker1.log | tail -3 | sed 's/^/   /'
else
  echo "   无法读取数据库状态"
fi
echo ""

# Worker进程状态（1-6）
echo "👷 Worker进程 (6个):"
for i in {1..6}; do
  WORKER_PID=$(ps aux | grep "while true; do" | grep "worker$i.log" | grep -v grep | awk '{print $2}' | head -1)
  if [ ! -z "$WORKER_PID" ]; then
    WORKER_TIME=$(ps -p $WORKER_PID -o etime= | tr -d ' ')
    echo "   ✅ Worker $i (PID: $WORKER_PID, 运行: $WORKER_TIME)"
  else
    echo "   ❌ Worker $i 未运行"
  fi
done

echo ""

# 最近活动
echo "📝 最近活动（各Worker最后1条）:"
echo ""
for i in {1..6}; do
  if [ -f worker$i.log ]; then
    echo "Worker $i:"
    grep "Captured:\|Failed:" worker$i.log | tail -1 | sed 's/^/   /'
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 提示"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "实时日志: tail -f worker1.log"
echo "停止所有Worker: pkill -f batch-capture"
echo "重新启动: ./start-turbo-workers.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
