#!/bin/bash
# 快速状态查看脚本
# 用法: ./status.sh

clear
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 截图处理系统状态"
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

# 进程状态
echo "🔧 运行进程:"
WORKER_PID=$(ps aux | grep "while true; do" | grep worker1.log | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$WORKER_PID" ]; then
  echo "   ✅ Worker 1 (PID: $WORKER_PID)"
else
  echo "   ❌ Worker 1 未运行"
fi

MONITOR_PID=$(ps aux | grep "auto-monitor.sh" | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$MONITOR_PID" ]; then
  echo "   ✅ 自动监控 (PID: $MONITOR_PID)"
else
  echo "   ⚠️  自动监控未运行"
fi

WATCHDOG_PID=$(ps aux | grep "watchdog.sh" | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$WATCHDOG_PID" ]; then
  echo "   ✅ 守护进程 (PID: $WATCHDOG_PID)"
else
  echo "   ⚠️  守护进程未运行"
fi

echo ""

# 最近活动
echo "📝 最近活动:"
if [ -f worker1.log ]; then
  echo "Worker日志（最后3条）:"
  grep "Captured:\|Failed:" worker1.log | tail -3 | sed 's/^/   /'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 提示"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "查看实时日志:"
echo "  tail -f worker1.log          # Worker处理日志"
echo "  tail -f auto-monitor-long.log # 监控日志"
echo "  tail -f watchdog.log         # 守护进程日志"
echo ""
echo "重新检查状态:"
echo "  ./status.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
