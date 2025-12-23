#!/bin/bash
# 🚀 MAX模式 - 15个并发Worker极限加速
# 预计速度：250-300张/小时

echo "🚀 启动MAX模式 - 15个并发Worker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 清理所有旧进程
echo "🧹 清理旧进程..."
pkill -f "batch-capture-screenshots" 2>/dev/null
pkill -f "worker[0-9]*.log" 2>/dev/null
pkill -f "watchdog" 2>/dev/null
sleep 2

# 2. 清理旧日志（保留备份）
for i in {1..15}; do
  if [ -f worker$i.log ]; then
    mv worker$i.log worker$i.log.bak 2>/dev/null
  fi
done

echo "✅ 旧进程已清理"
echo ""

# 3. 启动15个Worker（每个处理25张，间隔2秒）
echo "🚀 启动15个Worker..."

for i in {1..15}; do
  nohup bash -c "
while true; do
  echo \"[Worker-$i] Batch started at \$(date)\" >> worker$i.log
  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 25 >> worker$i.log 2>&1
  echo \"[Worker-$i] Sleeping 2 seconds...\" >> worker$i.log
  sleep 2
done
" > /dev/null 2>&1 &

  WORKER_PID=$!
  echo "   ✅ Worker $i 已启动 (PID: $WORKER_PID)"
  sleep 0.3  # 错开启动时间
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MAX模式已启动！"
echo ""
echo "📊 预计性能："
echo "   • 15个Worker并发 (vs Ultra 10个)"
echo "   • 每批25张 (vs Ultra 20张)"
echo "   • 间隔2秒 (vs Ultra 3秒)"
echo "   • 预计速度：250-300张/小时 (vs Ultra 138张/小时)"
echo "   • 预计完成：~13-15小时"
echo ""
echo "⚠️  注意："
echo "   • MAX模式会占用较多CPU资源"
echo "   • 如果系统变慢可降回Ultra模式"
echo ""
echo "📝 查看实时日志："
echo "   tail -f worker*.log"
echo ""
echo "📊 查看状态："
echo "   ./status-max.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
