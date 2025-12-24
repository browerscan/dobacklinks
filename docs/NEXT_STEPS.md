# 下一步行动计划

**更新时间**: 2024-12-23
**当前状态**: ✅ Edge兼容代码已创建 | ⚠️ 需要手动迁移现有代码

---

## 🎯 概览

已完成：

- ✅ 配置层优化（next.config.mjs, package.json, wrangler.toml）
- ✅ 创建所有Edge兼容文件（.edge.ts版本）
- ✅ 完整文档（优化报告 + 迁移指南）

待完成：

- ⚠️ 配置Cloudflare Hyperdrive或迁移到Neon
- ⚠️ 更新现有代码导入Edge兼容版本
- ⚠️ 配置R2存储（如使用截图功能）
- ⚠️ 测试和部署

---

## 📋 立即行动清单

### 步骤1: 选择数据库策略 (2选1)

#### 选项A: Cloudflare Hyperdrive (推荐 - 保留VPS Supabase)

```bash
# 1. 创建Hyperdrive配置
wrangler hyperdrive create dobacklinks-db \
  --connection-string="postgresql://postgres:postgres@93.127.133.204:54322/postgres"

# 2. 复制输出的ID

# 3. 更新wrangler.toml (取消注释并填入ID)
# [[hyperdrive]]
# binding = "HYPERDRIVE"
# id = "your-hyperdrive-id-here"
```

**优点**: 保留现有数据库，无需迁移
**缺点**: 需要Cloudflare配置

#### 选项B: 迁移到Neon

```bash
# 1. 在 https://neon.tech 创建项目

# 2. 导出现有数据
pg_dump postgresql://postgres:postgres@93.127.133.204:54322/postgres > backup.sql

# 3. 导入到Neon
psql <neon-connection-string> < backup.sql

# 4. 更新 .env.local
DATABASE_URL=<neon-http-connection-string>
```

**优点**: 原生HTTP连接，配置简单
**缺点**: 需要数据迁移，成本增加

---

### 步骤2: 更新代码导入

根据你的应用使用情况，更新以下文件：

#### 数据库访问

**查找使用数据库的文件:**

```bash
grep -r "from.*@/lib/db" --include="*.ts" --include="*.tsx" app/ actions/ lib/ | grep -v node_modules
```

**更新导入:**

```typescript
// 从:
import { db } from "@/lib/db";

// 改为:
import { getDatabase } from "@/lib/db/index.edge";

// 在API路由中:
export const runtime = "edge"; // 添加这行

export async function GET(request: Request, context: any) {
  const db = getDatabase(context.cloudflare?.env?.HYPERDRIVE);
  // 使用 db...
}
```

#### 图片转换

**查找使用smartImageConverter的文件:**

```bash
grep -r "smartImageConverter" --include="*.ts" --include="*.tsx" app/ lib/ | grep -v node_modules
```

**更新导入:**

```typescript
// 从:
import { smartImageConverter } from "@/lib/smartImageConverter";

// 改为:
import { smartImageConverter } from "@/lib/smartImageConverter.edge";
```

#### 截图存储 (如果使用)

**步骤:**

1. 创建R2 Bucket:

```bash
wrangler r2 bucket create dobacklinks-screenshots
```

2. 更新wrangler.toml:

```toml
[[r2_buckets]]
binding = "R2_SCREENSHOTS"
bucket_name = "dobacklinks-screenshots"
```

3. 设置公共URL并更新 .env.local:

```env
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

4. 更新代码:

```typescript
import { getScreenshotStorage } from "@/lib/services/screenshot-storage.edge";

export const runtime = "edge";

export async function POST(request: Request, context: any) {
  const storage = getScreenshotStorage(context.cloudflare?.env?.R2_SCREENSHOTS);
  // 使用 storage...
}
```

#### 博客文章

**查找使用getBlogs的文件:**

```bash
grep -r "from.*@/lib/getBlogs" --include="*.ts" --include="*.tsx" app/ | grep -v node_modules
```

**更新导入:**

```typescript
// 从:
import { getPosts, getPostBySlug } from "@/lib/getBlogs";

// 改为:
import { getPosts, getPostBySlug } from "@/lib/getBlogs.edge";
```

---

### 步骤3: 测试

```bash
# 1. 清理
rm -rf .next .worker-next

# 2. 构建
pnpm build

# 3. Cloudflare适配器
npx @cloudflare/next-on-pages

# 4. 本地测试
wrangler pages dev .worker-next

# 5. 远程测试（真实Workers环境）
wrangler pages dev .worker-next --remote

# 6. 测试关键功能
# - 访问首页
# - 测试数据库查询（产品列表、详情）
# - 测试博客列表/详情
# - 测试图片加载
# - 测试截图功能（如有）
```

---

### 步骤4: 部署

```bash
# 方法1: 手动部署
pnpm cloudflare:deploy

# 方法2: GitHub Actions (自动)
git add .
git commit -m "feat: Cloudflare Edge Runtime compatibility"
git push origin main
# 自动触发 .github/workflows/deploy-cloudflare.yml
```

---

## 🔍 验证检查清单

部署前确认：

### 配置检查

- [ ] Hyperdrive已创建并配置 (或已迁移到Neon)
- [ ] wrangler.toml包含正确的bindings
- [ ] 环境变量已在Cloudflare Dashboard配置
  - DATABASE_URL (如使用Neon)
  - R2_PUBLIC_URL (如使用R2)
  - 所有其他必需的环境变量

### 代码检查

- [ ] 所有数据库访问已更新为Edge版本
- [ ] 所有sharp使用已更新为Edge版本
- [ ] 所有fs访问已更新为Edge版本
- [ ] API路由添加 `export const runtime = "edge"` (如需要)

### 测试检查

- [ ] 本地构建成功: `pnpm build`
- [ ] Cloudflare适配器成功: `npx @cloudflare/next-on-pages`
- [ ] 本地Workers测试通过: `wrangler pages dev .worker-next`
- [ ] 远程Workers测试通过: `wrangler pages dev .worker-next --remote`
- [ ] 所有关键路由正常工作
- [ ] 数据库查询正常
- [ ] 图片正常显示

---

## 📚 参考文档

### 本项目文档

- [Cloudflare Edge优化报告](./CLOUDFLARE_EDGE_OPTIMIZATION.md)
- [Edge迁移指南](./EDGE_MIGRATION_GUIDE.md)
- [Codex完整审计](./optimize_plan.json)

### Cloudflare文档

- [Hyperdrive文档](https://developers.cloudflare.com/hyperdrive/)
- [R2存储文档](https://developers.cloudflare.com/r2/)
- [Image Resizing文档](https://developers.cloudflare.com/images/image-resizing/)
- [Workers Runtime APIs](https://developers.cloudflare.com/workers/runtime-apis/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)

### 外部文档

- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [Drizzle ORM文档](https://orm.drizzle.team/)

---

## 🆘 获取帮助

### 遇到问题？

1. **查看日志**

```bash
# 实时查看Workers日志
wrangler tail

# 查看构建日志
pnpm build 2>&1 | tee build.log
```

2. **常见问题**
   - 查看 [EDGE_MIGRATION_GUIDE.md](./EDGE_MIGRATION_GUIDE.md) 的故障排查部分
   - 检查 Cloudflare Dashboard 的环境变量配置
   - 确认所有bindings正确配置

3. **社区支持**
   - [Cloudflare Community](https://community.cloudflare.com/)
   - [Next.js Discussions](https://github.com/vercel/next.js/discussions)
   - [next-on-pages Issues](https://github.com/cloudflare/next-on-pages/issues)

---

## 🎉 完成后

部署成功后，你的应用将：

- ✅ 在全球Cloudflare边缘节点运行
- ✅ 享受极低延迟和高性能
- ✅ 自动扩展，无需担心服务器容量
- ✅ 使用Cloudflare Image Resizing优化图片
- ✅ 通过Hyperdrive加速数据库连接

记得更新项目README，记录Edge Runtime的使用！

---

**祝部署顺利！** 🚀
