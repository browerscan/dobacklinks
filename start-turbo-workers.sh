#!/bin/bash
# 🚀 Turbo Worker - 6个并发Worker加速处理
# 预计速度：300-400张/小时（比原来提速3-4倍）

echo "🚀 启动Turbo模式 - 6个并发Worker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 清理所有旧进程
echo "🧹 清理旧进程..."
pkill -f "batch-capture-screenshots" 2>/dev/null
pkill -f "worker[0-9].log" 2>/dev/null
sleep 2

# 2. 清理旧日志（保留备份）
if [ -f worker1.log ]; then
  mv worker1.log worker1.log.bak 2>/dev/null
fi
if [ -f worker2.log ]; then
  mv worker2.log worker2.log.bak 2>/dev/null
fi
if [ -f worker3.log ]; then
  mv worker3.log worker3.log.bak 2>/dev/null
fi
if [ -f worker4.log ]; then
  mv worker4.log worker4.log.bak 2>/dev/null
fi
if [ -f worker5.log ]; then
  mv worker5.log worker5.log.bak 2>/dev/null
fi
if [ -f worker6.log ]; then
  mv worker6.log worker6.log.bak 2>/dev/null
fi

echo "✅ 旧进程已清理"
echo ""

# 3. 启动6个Worker（每个处理20张，间隔5秒）
echo "🚀 启动6个Worker..."

# Worker 1-6: 每个处理20张，间隔5秒
for i in {1..6}; do
  nohup bash -c "
while true; do
  echo \"[Worker-$i] Batch started at \$(date)\" >> worker$i.log
  npx dotenv -e .env.local -- pnpm tsx scripts/batch-capture-screenshots.ts --limit 20 >> worker$i.log 2>&1
  echo \"[Worker-$i] Sleeping 5 seconds...\" >> worker$i.log
  sleep 5
done
" > /dev/null 2>&1 &

  WORKER_PID=$!
  echo "   ✅ Worker $i 已启动 (PID: $WORKER_PID)"
  sleep 1  # 错开启动时间，避免数据库锁
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Turbo模式已启动！"
echo ""
echo "📊 预计性能："
echo "   • 6个Worker并发"
echo "   • 每批20张 (vs 原来10张)"
echo "   • 间隔5秒 (vs 原来15秒)"
echo "   • 预计速度：300-400张/小时 (vs 原来100张/小时)"
echo "   • 预计完成：~12-15小时 (vs 原来46小时)"
echo ""
echo "📝 查看实时日志："
echo "   tail -f worker1.log"
echo "   tail -f worker2.log"
echo "   tail -f worker3.log"
echo "   ..."
echo ""
echo "📊 查看状态："
echo "   ./status-turbo.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
