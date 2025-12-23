#!/bin/bash
# 截图进度监控脚本
# 用法: ./monitor-screenshots.sh

echo "=========================================="
echo "📊 截图进度监控"
echo "=========================================="
echo ""

# 检查进程是否在运行
PROCESS=$(ps aux | grep "run-batch-capture.sh" | grep -v grep)
if [ -z "$PROCESS" ]; then
  echo "⚠️  批量截图进程未运行"
  echo ""
  echo "启动命令："
  echo "  cd /Volumes/SSD/dev/links/dobacklinks/dobacklinks"
  echo "  nohup bash run-batch-capture.sh > batch-capture-\$(date +%Y%m%d-%H%M%S).log 2>&1 &"
else
  echo "✅ 批量截图进程正在运行"
  echo "$PROCESS" | awk '{print "   PID: " $2 " | 运行时间: " $(NF-2) " " $(NF-1) " " $NF}'
fi

echo ""
echo "=========================================="
echo "📂 截图文件统计"
echo "=========================================="

FULL_COUNT=$(ls /Volumes/SSD/dev/links/dobacklinks/dobacklinks/public/screenshots/full/*.webp 2>/dev/null | wc -l)
THUMB_COUNT=$(ls /Volumes/SSD/dev/links/dobacklinks/dobacklinks/public/screenshots/thumbnails/*.webp 2>/dev/null | wc -l)
FULL_SIZE=$(du -sh /Volumes/SSD/dev/links/dobacklinks/dobacklinks/public/screenshots/full 2>/dev/null | awk '{print $1}')
THUMB_SIZE=$(du -sh /Volumes/SSD/dev/links/dobacklinks/dobacklinks/public/screenshots/thumbnails 2>/dev/null | awk '{print $1}')

echo "全尺寸截图: $FULL_COUNT 张 ($FULL_SIZE)"
echo "缩略图: $THUMB_COUNT 张 ($THUMB_SIZE)"
echo ""

echo "=========================================="
echo "📋 数据库状态"
echo "=========================================="

# 需要环境变量
if [ -f .env.local ]; then
  npx dotenv -e .env.local -- pnpm tsx -e "
    import { db } from './lib/db/index.ts';
    import { products } from './lib/db/schema.ts';
    import { sql, count, eq } from 'drizzle-orm';

    const stats = await db
      .select({
        status: products.screenshotStatus,
        count: count()
      })
      .from(products)
      .groupBy(products.screenshotStatus);

    const total = stats.reduce((sum, s) => sum + s.count, 0);

    console.log('总计:', total, '个产品');
    stats.forEach(s => {
      const percentage = ((s.count / total) * 100).toFixed(1);
      console.log(\`  \${s.status || '未设置'}: \${s.count} (\${percentage}%)\`);
    });

    process.exit(0);
  " 2>/dev/null
fi

echo ""
echo "=========================================="
echo "📄 最新日志 (最后10行)"
echo "=========================================="
tail -10 /Volumes/SSD/dev/links/dobacklinks/dobacklinks/batch-capture.log 2>/dev/null || echo "无法读取日志文件"

echo ""
echo "=========================================="
echo "💡 提示"
echo "=========================================="
echo "实时查看日志: tail -f batch-capture.log"
echo "查看完整统计: pnpm tsx scripts/batch-capture-screenshots.ts --limit 0"
echo "手动运行一批: pnpm tsx scripts/batch-capture-screenshots.ts --limit 10"
echo ""
