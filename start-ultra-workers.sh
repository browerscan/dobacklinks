#!/bin/bash
# 🚀 Ultra模式 - 10个并发Worker加速处理
# 预计速度：180-200张/小时（比Turbo快70%）

echo "🚀 启动Ultra模式 - 10个并发Worker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 清理所有旧进程
echo "🧹 清理旧进程..."
pkill -f "batch-capture-screenshots" 2>/dev/null
pkill -f "worker[0-9].log" 2>/dev/null
pkill -f "watchdog" 2>/dev/null
sleep 2

# 2. 清理旧日志（保留备份）
for i in {1..10}; do
  if [ -f worker$i.log ]; then
    mv worker$i.log worker$i.log.bak 2>/dev/null
  fi
done

echo "✅ 旧进程已清理"
echo ""

# 3. 启动10个Worker（每个处理20张，间隔3秒）
echo "🚀 启动10个Worker..."

for i in {1..10}; do
  nohup bash -c "
while true; do
  echo \"[Worker-$i] Batch started at \$(date)\" >> worker$i.log
  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 20 >> worker$i.log 2>&1
  echo \"[Worker-$i] Sleeping 3 seconds...\" >> worker$i.log
  sleep 3
done
" > /dev/null 2>&1 &

  WORKER_PID=$!
  echo "   ✅ Worker $i 已启动 (PID: $WORKER_PID)"
  sleep 0.5  # 错开启动时间
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ultra模式已启动！"
echo ""
echo "📊 预计性能："
echo "   • 10个Worker并发 (vs Turbo 6个)"
echo "   • 每批20张"
echo "   • 间隔3秒 (vs Turbo 5秒)"
echo "   • 预计速度：180-200张/小时 (vs Turbo 100张/小时)"
echo "   • 预计完成：~25小时 (vs Turbo 42小时)"
echo ""
echo "📝 查看实时日志："
echo "   tail -f worker*.log"
echo ""
echo "📊 查看状态："
echo "   ./status-ultra.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
