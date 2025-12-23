# Edge Runtime迁移指南

本指南说明如何将代码迁移到Cloudflare Workers Edge Runtime。

---

## 📚 迁移概述

### 已创建的Edge兼容文件

| 原文件 | Edge兼容版本 | 状态 | 说明 |
|-------|------------|------|------|
| `lib/db/config.ts` | `lib/db/config.edge.ts` | ✅ 完成 | 支持Hyperdrive/Neon HTTP |
| `lib/db/index.ts` | `lib/db/index.edge.ts` | ✅ 完成 | 动态数据库初始化 |
| `lib/smartImageConverter.ts` | `lib/smartImageConverter.edge.ts` | ✅ 完成 | 移除sharp依赖 |
| `lib/services/screenshot-storage.ts` | `lib/services/screenshot-storage.edge.ts` | ✅ 完成 | R2存储 + Cloudflare Image Resizing |
| `lib/getBlogs.ts` | `lib/getBlogs.edge.ts` | ✅ 完成 | 移除fs,仅数据库读取 |

---

## 🔄 迁移步骤

### Phase 1: 数据库迁移 (2个选项)

#### 选项A: Cloudflare Hyperdrive (推荐 - 保留VPS Supabase)

**优点:**
- 保留现有VPS Supabase数据库
- 无需数据迁移
- Workers通过Hyperdrive代理TCP连接

**步骤:**

1. **创建Hyperdrive配置**
```bash
# 使用实际的数据库连接字符串
wrangler hyperdrive create dobacklinks-db \
  --connection-string="postgresql://postgres:postgres@93.127.133.204:54322/postgres"
```

2. **获取Hyperdrive ID**
```bash
# 命令输出会显示ID,例如: abc123def456...
# 复制这个ID
```

3. **更新wrangler.toml**
```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "your-hyperdrive-id-here"  # 替换为上面的ID
```

4. **更新代码导入**
```typescript
// 修改所有使用数据库的文件
// 从:
import { db } from "@/lib/db";

// 改为:
import { getDatabase } from "@/lib/db/index.edge";

// 在Edge runtime中使用:
export const runtime = "edge";

export async function GET(request: Request, context: any) {
  const db = getDatabase(context.cloudflare?.env?.HYPERDRIVE);
  // 使用db...
}
```

#### 选项B: 迁移到Neon (需要数据迁移)

**优点:**
- 原生HTTP连接,无需Hyperdrive
- 更简单的配置

**步骤:**

1. **创建Neon数据库**
   - 访问 https://neon.tech
   - 创建新项目
   - 获取HTTP连接字符串

2. **迁移数据**
```bash
# 导出现有数据
pg_dump postgresql://postgres:postgres@93.127.133.204:54322/postgres > backup.sql

# 导入到Neon
psql <neon-connection-string> < backup.sql
```

3. **更新环境变量**
```bash
# .env.local
DATABASE_URL=<neon-http-connection-string>
```

4. **更新代码导入**
```typescript
// 使用Edge配置
import { db } from "@/lib/db/index.edge";
// db 会自动检测Neon并使用HTTP驱动
```

---

### Phase 2: Sharp迁移

#### 图片转换 (smartImageConverter)

**原代码:**
```typescript
import { smartImageConverter } from "@/lib/smartImageConverter";
```

**迁移到:**
```typescript
import { smartImageConverter } from "@/lib/smartImageConverter.edge";
```

**说明:**
- Edge版本使用Cloudflare Image Resizing
- 或直接返回webp (next/og支持webp)
- Node.js环境仍使用sharp作为fallback

#### 截图存储 (screenshot-storage)

**方案A: 使用Cloudflare R2 (推荐)**

1. **创建R2 Bucket**
```bash
wrangler r2 bucket create dobacklinks-screenshots
```

2. **更新wrangler.toml**
```toml
[[r2_buckets]]
binding = "R2_SCREENSHOTS"
bucket_name = "dobacklinks-screenshots"
```

3. **设置R2公共URL**
```bash
# Cloudflare Dashboard > R2 > Bucket Settings > Public Access
# 启用公共访问并获取public URL
```

4. **更新环境变量**
```env
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

5. **更新代码**
```typescript
// 从:
import { getScreenshotStorage } from "@/lib/services/screenshot-storage";

// 改为:
import { getScreenshotStorage } from "@/lib/services/screenshot-storage.edge";

// Edge runtime:
export const runtime = "edge";

export async function POST(request: Request, context: any) {
  const storage = getScreenshotStorage(context.cloudflare?.env?.R2_SCREENSHOTS);
  const result = await storage.saveScreenshot(buffer, domain);
  // result.thumbnailUrl 自动使用 Cloudflare Image Resizing
}
```

**方案B: 构建时生成 (简单但不适合动态截图)**
- 在本地生成所有截图
- 作为静态资源部署
- 不适合用户触发的截图功能

---

### Phase 3: 博客文章迁移

**原代码:**
```typescript
import { getPosts, getPostBySlug } from "@/lib/getBlogs";
```

**迁移到:**
```typescript
import { getPosts, getPostBySlug } from "@/lib/getBlogs.edge";
```

**说明:**
- Edge版本完全依赖数据库
- 不再读取 `blogs/` 目录的markdown文件
- 确保所有博客已导入数据库

**博客数据迁移 (如有本地markdown文件):**
```bash
# 创建导入脚本 (如果需要)
# scripts/migrate-blogs-to-db.ts

# 运行导入
pnpm tsx scripts/migrate-blogs-to-db.ts
```

---

## 🧪 测试迁移

### 本地测试

```bash
# 1. 清理构建
rm -rf .next .worker-next

# 2. Next.js构建
pnpm build

# 3. Cloudflare适配器构建
npx @cloudflare/next-on-pages

# 4. 本地Workers测试
wrangler pages dev .worker-next

# 5. 测试关键功能
# - 数据库查询
# - 图片加载
# - 博客列表/详情
# - 截图功能(如果有)
```

### 远程测试

```bash
# 在真实Cloudflare环境测试
wrangler pages dev .worker-next --remote
```

---

## 📋 迁移检查清单

### 配置层

- [ ] ✅ `next.config.mjs` - 已移除Sentry和不兼容配置
- [ ] ✅ `package.json` - 已添加engines和Cloudflare脚本
- [ ] ✅ `wrangler.toml` - 已创建并配置
- [ ] ⚠️ Hyperdrive配置 (如使用选项A)
- [ ] ⚠️ R2 Bucket配置 (如使用截图功能)
- [ ] ⚠️ 环境变量 (DATABASE_URL, R2_PUBLIC_URL等)

### 代码层

- [ ] ⚠️ 所有使用`lib/db`的文件改为`lib/db/index.edge`
- [ ] ⚠️ 所有使用`smartImageConverter`的文件改为Edge版本
- [ ] ⚠️ 所有使用`screenshot-storage`的文件改为Edge版本
- [ ] ⚠️ 所有使用`getBlogs`的文件改为Edge版本
- [ ] ⚠️ 添加`export const runtime = "edge"`到需要的路由

### 数据层

- [ ] ⚠️ 博客markdown文件导入数据库 (如有)
- [ ] ⚠️ 数据库迁移到Neon (如选择选项B)
- [ ] ⚠️ 静态资源迁移到R2 (如需要)

---

## 🎯 快速开始 (推荐路径)

### 最小迁移 (保留现有设置)

1. **配置Hyperdrive**
```bash
wrangler hyperdrive create dobacklinks-db \
  --connection-string="postgresql://postgres:postgres@93.127.133.204:54322/postgres"
```

2. **更新wrangler.toml**
```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "your-id-here"
```

3. **保持原代码不变** (Hyperdrive让postgres-js正常工作)

4. **测试部署**
```bash
pnpm cloudflare:build
wrangler pages dev .worker-next --remote
```

### 完全Edge化 (推荐长期)

1. **迁移到Neon** (如愿意切换数据库)
2. **配置R2** (如使用截图功能)
3. **更新所有导入到`.edge`版本**
4. **添加`runtime = "edge"`到API路由**
5. **全面测试**

---

## 🆘 故障排查

### 常见问题

#### 1. "postgres is not a function"
- **原因**: Edge runtime无法使用postgres-js TCP连接
- **解决**: 配置Hyperdrive或迁移到Neon HTTP

#### 2. "sharp is not defined"
- **原因**: Edge runtime不支持原生模块
- **解决**: 使用`.edge`版本的文件

#### 3. "fs is not defined"
- **原因**: Workers没有文件系统
- **解决**: 使用`.edge`版本,从数据库/R2读取

#### 4. "R2 bucket not configured"
- **原因**: 未配置R2 binding
- **解决**: 在wrangler.toml添加R2配置或禁用截图功能

---

## 📚 相关文档

- [Cloudflare Hyperdrive文档](https://developers.cloudflare.com/hyperdrive/)
- [Cloudflare R2文档](https://developers.cloudflare.com/r2/)
- [Cloudflare Image Resizing文档](https://developers.cloudflare.com/images/image-resizing/)
- [Neon Serverless Driver文档](https://neon.tech/docs/serverless/serverless-driver)
- [@cloudflare/next-on-pages文档](https://github.com/cloudflare/next-on-pages)

---

**生成时间**: 2024-12-23
**相关文件**: `docs/CLOUDFLARE_EDGE_OPTIMIZATION.md`, `docs/optimize_plan.json`
