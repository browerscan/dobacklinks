#!/bin/bash
# 双Worker状态查看脚本
# 用法: ./status-dual.sh

clear
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 双Worker截图处理系统状态"
date '+%Y-%m-%d %H:%M:%S'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 截图文件统计
CURRENT=$(ls public/screenshots/full/*.webp 2>/dev/null | wc -l | tr -d ' ')
SIZE=$(du -sh public/screenshots/full 2>/dev/null | awk '{print $1}')
echo "📁 截图文件: $CURRENT 张 ($SIZE)"
echo ""

# 数据库状态（从worker1日志）
echo "📊 数据库状态:"
if [ -f worker1.log ]; then
  grep -E "Pending:|Captured:|Failed:" worker1.log | tail -3 | sed 's/^/   /'
else
  echo "   无法读取数据库状态"
fi
echo ""

# Worker进程状态
echo "👷 Worker进程:"

WORKER1_PID=$(ps aux | grep "while true; do" | grep worker1.log | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$WORKER1_PID" ]; then
  WORKER1_TIME=$(ps -p $WORKER1_PID -o etime= | tr -d ' ')
  echo "   ✅ Worker 1 (PID: $WORKER1_PID, 运行: $WORKER1_TIME)"
else
  echo "   ❌ Worker 1 未运行"
fi

WORKER2_PID=$(ps aux | grep "while true; do" | grep worker2.log | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$WORKER2_PID" ]; then
  WORKER2_TIME=$(ps -p $WORKER2_PID -o etime= | tr -d ' ')
  echo "   ✅ Worker 2 (PID: $WORKER2_PID, 运行: $WORKER2_TIME)"
else
  echo "   ❌ Worker 2 未运行"
fi

echo ""

# 其他进程
echo "🔧 辅助进程:"

MONITOR_PID=$(ps aux | grep "auto-monitor.sh" | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$MONITOR_PID" ]; then
  echo "   ✅ 自动监控 (PID: $MONITOR_PID)"
else
  echo "   ⚠️  自动监控未运行"
fi

WATCHDOG_PID=$(ps aux | grep "watchdog-dual.sh" | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$WATCHDOG_PID" ]; then
  echo "   ✅ 双Worker守护进程 (PID: $WATCHDOG_PID)"
else
  echo "   ⚠️  守护进程未运行"
fi

echo ""

# Worker活动对比
echo "📝 Worker活动（最近各3条）:"
echo ""
echo "Worker 1:"
if [ -f worker1.log ]; then
  grep "Captured:\|Failed:" worker1.log | tail -3 | sed 's/^/   /'
else
  echo "   无日志"
fi

echo ""
echo "Worker 2:"
if [ -f worker2.log ]; then
  grep "Captured:\|Failed:" worker2.log | tail -3 | sed 's/^/   /'
else
  echo "   无日志或刚启动"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 提示"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "查看实时日志:"
echo "  tail -f worker1.log          # Worker 1处理日志"
echo "  tail -f worker2.log          # Worker 2处理日志"
echo "  tail -f auto-monitor-long.log # 监控日志"
echo "  tail -f watchdog.log         # 守护进程日志"
echo ""
echo "重新检查状态:"
echo "  ./status-dual.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
