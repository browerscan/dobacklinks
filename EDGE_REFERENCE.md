# Cloudflare Edge 快速参考

## 🔧 常用命令

### Hyperdrive

```bash
# 创建
wrangler hyperdrive create dobacklinks-db \
  --connection-string="YOUR_DATABASE_CONNECTION_STRING"

# 列出
wrangler hyperdrive list

# 删除
wrangler hyperdrive delete <id>
```

### R2存储

```bash
# 创建bucket
wrangler r2 bucket create dobacklinks-screenshots

# 列出
wrangler r2 bucket list

# 上传文件
wrangler r2 object put dobacklinks-screenshots/test.jpg --file=./test.jpg
```

### 构建和部署

```bash
# 完整流程
pnpm build && npx @cloudflare/next-on-pages && wrangler pages dev .worker-next

# 快捷命令
pnpm cloudflare:build   # 构建
pnpm cloudflare:dev     # 本地测试
pnpm cloudflare:preview # 远程测试
pnpm cloudflare:deploy  # 部署
```

### 调试

```bash
# 实时日志
wrangler tail

# 查看部署
wrangler pages deployment list

# 查看项目
wrangler pages project list
```

---

## 📝 文件导入映射表

| 原文件                              | Edge版本                                 | 何时使用                |
| ----------------------------------- | ---------------------------------------- | ----------------------- |
| `@/lib/db`                          | `@/lib/db/index.edge`                    | API路由需要Edge runtime |
| `@/lib/smartImageConverter`         | `@/lib/smartImageConverter.edge`         | OG图片生成,需要Edge     |
| `@/lib/services/screenshot-storage` | `@/lib/services/screenshot-storage.edge` | 截图功能,需要R2         |
| `@/lib/getBlogs`                    | `@/lib/getBlogs.edge`                    | 博客页面,需要Edge       |

---

## 🎯 Edge Runtime标记

在需要Edge的API路由添加:

```typescript
export const runtime = "edge";
```

示例:

```typescript
// app/api/example/route.ts
import { getDatabase } from "@/lib/db/index.edge";

export const runtime = "edge";

export async function GET(request: Request, context: any) {
  const db = getDatabase(context.cloudflare?.env?.HYPERDRIVE);
  // ...
}
```

---

## 🔐 环境变量

### 必需

```env
DATABASE_URL=your_database_connection_string  # 数据库连接
```

### Cloudflare Pages Dashboard设置

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- 其他Next.js环境变量

### 可选 (如使用)

```env
R2_PUBLIC_URL=https://pub-xxx.r2.dev  # R2公共URL
```

---

## 🧪 测试清单

```bash
# 1. 本地构建
✓ pnpm build

# 2. Cloudflare适配器
✓ npx @cloudflare/next-on-pages

# 3. 本地Workers测试
✓ wrangler pages dev .worker-next

# 4. 远程Workers测试
✓ wrangler pages dev .worker-next --remote

# 5. 功能测试
✓ 首页加载
✓ 产品列表/详情
✓ 数据库查询
✓ 图片显示
✓ 博客列表/详情
```

---

## 🆘 问题速查

| 错误                         | 原因          | 解决                     |
| ---------------------------- | ------------- | ------------------------ |
| `postgres is not a function` | TCP连接不可用 | 配置Hyperdrive           |
| `sharp is not defined`       | 原生模块      | 使用`.edge`版本          |
| `fs is not defined`          | 无文件系统    | 使用`.edge`版本          |
| `R2 bucket not configured`   | 缺少R2配置    | 配置R2或禁用功能         |
| `DATABASE_URL is not set`    | 环境变量缺失  | 检查Cloudflare Dashboard |

---

## 📚 文档索引

- **快速开始**: `QUICK_START_EDGE.md`
- **下一步**: `docs/NEXT_STEPS.md`
- **完整指南**: `docs/EDGE_MIGRATION_GUIDE.md`
- **技术报告**: `docs/CLOUDFLARE_EDGE_OPTIMIZATION.md`
- **审计结果**: `docs/optimize_plan.json`

---

## 🔗 官方文档

- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
- [R2](https://developers.cloudflare.com/r2/)
- [Image Resizing](https://developers.cloudflare.com/images/)
- [next-on-pages](https://github.com/cloudflare/next-on-pages)
