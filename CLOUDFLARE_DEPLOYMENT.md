# Cloudflare Workers 部署指南

## ⚠️ 重要提示

**当前状态**：OpenNext Cloudflare 1.14.6 **不支持** Next.js 16.x

官方警告：

```
WARN Next.js 16 is not fully supported yet! Some features may not work as expected.
```

**错误信息**：

```
Error: Invalid alias name: "next/dist/compiled/node-fetch"
Error: Invalid alias name: "next/dist/compiled/ws"
Error: Invalid alias name: "next/dist/compiled/@ampproject/toolbox-optimizer"
Error: Invalid alias name: "next/dist/compiled/edge-runtime"
```

---

## 🎯 推荐部署方案

### 选项 A：使用 Vercel（推荐）✅

**优点**：

- ✅ 完美支持 Next.js 16
- ✅ 零配置，5 分钟部署
- ✅ 保留所有功能
- ✅ 免费版充足（100GB 带宽/月）

**步骤**：

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 配置环境变量（在 Vercel Dashboard）
# - DATABASE_URL
# - BETTER_AUTH_SECRET
# - GOOGLE_CLIENT_ID/SECRET
# - GITHUB_CLIENT_ID/SECRET
# - RESEND_API_KEY
# - R2_* 变量
# - UPSTASH_REDIS_* 变量
```

---

### 选项 B：等待 OpenNext 支持 Next.js 16

**时间线**：预计 1-2 个月

**准备工作**：已完成 ✅

- `wrangler.toml`
- `open-next.config.ts`
- `.dev.vars.example`
- `package.json` 脚本

**届时操作**：

```bash
# 1. 更新 OpenNext
pnpm update @opennextjs/cloudflare@latest

# 2. 构建并部署
pnpm cloudflare:build
pnpm cloudflare:deploy
```

---

### 选项 C：降级到 Next.js 15

**如果坚持使用 Cloudflare**：

```bash
# 1. 降级 Next.js
pnpm update next@15.5.9

# 2. 移除 proxy.ts（Next.js 16 特性）
rm proxy.ts

# 3. 创建 middleware.ts（Next.js 15 兼容）
cat > middleware.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';

const referralParams = ['utm_source', 'ref', 'via', 'aff', 'referral', 'referral_code'];

export function middleware(request: NextRequest): NextResponse {
  let referralValue: string | null = null;

  for (const param of referralParams) {
    const value = request.nextUrl.searchParams.get(param);
    if (value) {
      referralValue = value;
      break;
    }
  }

  const response = NextResponse.next();
  if (referralValue) {
    response.cookies.set('referral_source', referralValue);
  }
  return response;
}

export const config = {
  runtime: 'edge',
  matcher: [
    '/((?!_next|_vercel|auth|.*\\.|favicon.ico).*)'
  ]
};
EOF

# 4. 恢复 services OG image edge runtime
# 编辑 app/(basic-layout)/services/opengraph-image.tsx
# 取消注释第 4 行: export const runtime = 'edge';

# 5. 构建并部署
pnpm cloudflare:build
pnpm cloudflare:deploy
```

**代价**：

- ❌ 失去 Turbopack 默认支持
- ❌ 失去 Partial Pre-Rendering (PPR)
- ❌ 失去 proxy.ts 新特性
- ❌ 需要维护两套配置（middleware vs proxy）

---

## 📝 已完成的 Cloudflare 配置

### 1. wrangler.toml

```toml
name = "dobacklinks"
compatibility_date = "2024-12-18"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".worker-next"

[observability]
enabled = true
```

### 2. open-next.config.ts

```typescript
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
```

### 3. package.json 脚本

```json
{
  "scripts": {
    "cloudflare:build": "npx @opennextjs/cloudflare build",
    "cloudflare:dev": "pnpm cloudflare:build && wrangler dev",
    "cloudflare:preview": "pnpm cloudflare:build && wrangler dev --remote",
    "cloudflare:deploy": "pnpm cloudflare:build && wrangler deploy"
  }
}
```

### 4. 环境变量

复制 `.dev.vars.example` 到 `.dev.vars`，填入真实值：

```bash
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars 填入敏感信息
```

**生产环境**（Cloudflare Dashboard）：

```bash
# 使用 wrangler secret put 设置
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_SECRET
# ... 其他敏感变量
```

---

## 🔧 调试与故障排查

### 本地开发

```bash
# 1. 确保有 .dev.vars 文件
cp .dev.vars.example .dev.vars

# 2. 构建
pnpm cloudflare:build

# 3. 本地预览
pnpm cloudflare:dev
```

### 常见错误

#### 1. "proxy.ts always runs on Node.js runtime"

**原因**：Next.js 16 的 proxy.ts 不支持 edge runtime
**解决**：删除 proxy.ts 或降级到 Next.js 15 使用 middleware.ts

#### 2. "edge runtime function to be defined in a separate function"

**原因**：OG Image 路由使用了 edge runtime
**解决**：移除 `export const runtime = 'edge';`

#### 3. "Invalid alias name"

**原因**：OpenNext 不支持 Next.js 16
**解决**：等待更新或降级到 Next.js 15

---

## 📊 测试结果总结

### ✅ 成功的修复

1. **Login 页面 Suspense 错误**
   - 问题：`useSearchParams()` 未包裹在 Suspense 中
   - 解决：创建 `LoginContent` 子组件，外层用 Suspense 包裹

2. **代理功能兼容性**
   - 问题：`proxy.ts` 强制使用 Node.js runtime
   - 解决：删除 `proxy.ts`（可通过其他方式实现 UTM 追踪）

3. **OG Image Edge Runtime**
   - 问题：`services/opengraph-image.tsx` 使用 edge runtime
   - 解决：注释掉 `export const runtime = 'edge';`

### ❌ 未解决的问题

**核心打包错误**：OpenNext 无法处理 Next.js 16 的内部模块

```
Error: Build failed with 4 errors:
- Invalid alias name: "next/dist/compiled/node-fetch"
- Invalid alias name: "next/dist/compiled/ws"
- Invalid alias name: "next/dist/compiled/@ampproject/toolbox-optimizer"
- Invalid alias name: "next/dist/compiled/edge-runtime"
```

**根本原因**：OpenNext Cloudflare 1.14.6 与 Next.js 16.0.10 不兼容

---

## 🚀 部署到 Cloudflare（当支持 Next.js 16 后）

### 前置要求

1. Cloudflare 账号
2. 域名（可选）
3. Wrangler CLI 已登录

### 部署步骤

```bash
# 1. 登录 Cloudflare
wrangler login

# 2. 设置环境变量（生产）
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put UPSTASH_REDIS_REST_TOKEN
wrangler secret put SIMILARWEB_API_KEY
wrangler secret put CRON_SECRET
wrangler secret put SENTRY_AUTH_TOKEN
wrangler secret put TURNSTILE_SECRET_KEY

# 3. 构建
pnpm cloudflare:build

# 4. 部署
wrangler deploy

# 5. 绑定自定义域名（可选）
wrangler domains add dobacklinks.com
```

### 环境变量配置

**公开变量**（可在 `wrangler.toml` 的 `[vars]` 中配置）：

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `NEXT_PUBLIC_OPTIMIZED_IMAGES`

**私密变量**（使用 `wrangler secret put`）：

- 所有带 `SECRET`、`KEY`、`TOKEN`、`PASSWORD` 的变量

---

## 📚 参考文档

- [OpenNext Cloudflare 官方文档](https://opennext.js.org/cloudflare)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Next.js 16 发布说明](https://nextjs.org/blog/next-16)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

---

## 📞 获取帮助

**OpenNext GitHub Issues**：https://github.com/opennextjs/opennextjs-cloudflare/issues
**Cloudflare Discord**：https://discord.gg/cloudflaredev

---

## 🔄 更新日志

**2025-12-18**：

- ✅ 安装 Cloudflare Workers 依赖
- ✅ 升级 Next.js 到 16.0.10
- ✅ 创建 wrangler.toml 配置
- ✅ 创建 open-next.config.ts
- ✅ 修复 Login 页面 Suspense 问题
- ✅ 删除 proxy.ts（Next.js 16 特性）
- ✅ 移除 OG Image edge runtime
- ❌ **发现核心不兼容问题：OpenNext 1.14.6 不支持 Next.js 16**

**结论**：推荐使用 Vercel 部署，或等待 OpenNext 支持 Next.js 16
