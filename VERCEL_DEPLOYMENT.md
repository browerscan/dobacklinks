# Vercel 部署指南（推荐）

## ✅ 为什么选择 Vercel

- **完美支持 Next.js 16**：所有新特性开箱即用（Turbopack、PPR、proxy.ts）
- **零配置部署**：连接 GitHub 自动部署
- **免费额度充足**：100GB 带宽/月，无限部署
- **自动 HTTPS + CDN**：全球加速
- **一键回滚**：每次部署都有独立 URL

---

## 🚀 快速部署（5 分钟）

### 方法 1：通过 Vercel Dashboard（推荐）

1. **登录 Vercel**
   - 访问 https://vercel.com
   - 使用 GitHub 登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**：自动识别为 Next.js
   - **Build Command**：`pnpm build`（自动检测）
   - **Output Directory**：`.next`（自动检测）
   - **Install Command**：`pnpm install`（自动检测）

4. **配置环境变量**

点击 "Environment Variables"，添加以下变量：

#### 必需变量

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@93.127.133.204:54322/postgres

# Authentication
BETTER_AUTH_SECRET=your-secret-here-run-openssl-rand-base64-32
BETTER_AUTH_URL=https://dobacklinks.com  # 部署后更新为实际域名

# OAuth Providers
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Turnstile (Captcha)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# Site
NEXT_PUBLIC_SITE_URL=https://dobacklinks.com  # 部署后更新
NEXT_PUBLIC_SITE_NAME=DoBacklinks
NODE_ENV=production
```

#### 可选变量

```bash
# Email (Resend)
RESEND_API_KEY=your-resend-api-key
ADMIN_EMAIL=outreach@dobacklinks.com

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_PUBLIC_URL=https://your-r2-domain.com
R2_BUCKET_NAME=your-bucket-name

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# SimilarWeb API
SIMILARWEB_API_URL=http://93.127.133.204:3000/api/v1
SIMILARWEB_API_KEY=your-api-key

# Cron Jobs
CRON_SECRET=your-cron-secret-run-openssl-rand-hex-32

# Monitoring (Sentry)
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Build Options
NEXT_PUBLIC_OPTIMIZED_IMAGES=true
```

5. **部署**
   - 点击 "Deploy"
   - 等待 2-3 分钟构建完成
   - 🎉 完成！获得 `https://your-project.vercel.app` URL

6. **配置自定义域名**（可选）
   - 进入项目 Settings → Domains
   - 添加 `dobacklinks.com`
   - 按照提示配置 DNS
   - 自动获得 SSL 证书

---

### 方法 2：通过 Vercel CLI

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 进入项目目录
cd /Volumes/SSD/dev/links/dobacklinks/dobacklinks

# 4. 初始化项目（首次）
vercel

# 按提示操作：
# ? Set up and deploy "~/path/to/project"? [Y/n] y
# ? Which scope do you want to deploy to? Your Account
# ? Link to existing project? [y/N] n
# ? What's your project's name? dobacklinks
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n

# 5. 配置环境变量
vercel env add DATABASE_URL production
# 输入值后按回车，重复为每个环境变量

# 6. 部署到生产环境
vercel --prod

# 7. 获取部署 URL
vercel inspect
```

---

## 🔧 环境变量管理

### 通过 Dashboard

1. 进入项目
2. Settings → Environment Variables
3. 添加/编辑变量
4. 重新部署以应用更改

### 通过 CLI

```bash
# 添加生产环境变量
vercel env add VARIABLE_NAME production

# 添加预览环境变量
vercel env add VARIABLE_NAME preview

# 添加开发环境变量
vercel env add VARIABLE_NAME development

# 列出所有变量
vercel env ls

# 移除变量
vercel env rm VARIABLE_NAME production
```

### 环境变量优先级

```
.env.local (本地开发)
  ↓
Vercel Environment Variables (部署)
```

**注意**：Vercel 部署时不会读取 `.env.local`，必须在 Dashboard 或 CLI 中配置

---

## 🔄 自动部署流程

### 默认行为

- **main/master 分支** → 生产环境
- **其他分支** → 预览环境
- **Pull Request** → 自动创建预览 URL

### 自定义部署

```json
// vercel.json（项目根目录）
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["hkg1", "sfo1"], // 香港 + 旧金山
  "env": {
    "NEXT_PUBLIC_SITE_URL": "https://dobacklinks.com"
  }
}
```

---

## 📊 数据库连接

### VPS Supabase（当前配置）

```bash
DATABASE_URL=postgresql://postgres:postgres@93.127.133.204:54322/postgres
```

**注意事项**：

- ✅ VPS IP 公网可访问
- ✅ Vercel Serverless 函数支持外部数据库
- ⚠️ 确保 VPS 防火墙开放 54322 端口
- ⚠️ 考虑使用连接池（如 Supabase Pooler）

### 连接池配置（推荐）

```typescript
// lib/db/config.ts 已自动配置
// Vercel 环境使用：
{
  max: 1,                    // 每个 Serverless 函数 1 个连接
  prepare: false,            // 禁用预处理语句
  idle_timeout: 0,           // 立即关闭空闲连接
  max_lifetime: 0,           // 无最大生命周期
  connect_timeout: 10        // 10 秒连接超时
}
```

---

## 🎯 部署后检查清单

### 1. 验证部署

- [ ] 访问生产 URL
- [ ] 测试首页加载
- [ ] 测试登录功能（Google/GitHub OAuth）
- [ ] 测试数据库连接（查看站点列表）
- [ ] 检查 R2 图片加载
- [ ] 测试搜索功能

### 2. 配置 OAuth 回调

**Google OAuth**：

1. 访问 Google Cloud Console
2. 进入 API & Services → Credentials
3. 编辑 OAuth 2.0 客户端
4. 添加授权重定向 URI：
   ```
   https://dobacklinks.com/api/auth/callback/google
   https://your-project.vercel.app/api/auth/callback/google
   ```

**GitHub OAuth**：

1. 访问 GitHub Settings → Developer settings → OAuth Apps
2. 编辑应用
3. 更新 Authorization callback URL：
   ```
   https://dobacklinks.com/api/auth/callback/github
   ```

### 3. 配置 Cron Jobs

Vercel Cron 配置（`vercel.json`）：

```json
{
  "crons": [
    {
      "path": "/api/cron/enrich-sites",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

**或使用外部 Cron**：

```bash
# 添加到 cron.yml（GitHub Actions）
- cron: '0 0 * * 0'  # 每周日午夜
  run: |
    curl -X GET https://dobacklinks.com/api/cron/enrich-sites \
      -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### 4. 配置自定义域名

1. Vercel Dashboard → Domains
2. 添加 `dobacklinks.com`
3. 配置 DNS（A 记录或 CNAME）：
   ```
   Type: CNAME
   Name: @  (或 www)
   Value: cname.vercel-dns.com
   ```
4. 等待 SSL 证书自动签发（1-5 分钟）

### 5. 更新环境变量

部署后更新以下变量（使用实际域名）：

- `BETTER_AUTH_URL=https://dobacklinks.com`
- `NEXT_PUBLIC_SITE_URL=https://dobacklinks.com`

重新部署以应用更改。

---

## 📈 监控与调试

### Vercel Analytics

自动启用，无需配置：

- 实时访问量
- Web Vitals（CLS、LCP、FID）
- 地理分布

### Vercel Logs

```bash
# 实时日志
vercel logs --follow

# 特定部署的日志
vercel logs [deployment-url]
```

### Sentry 错误监控

项目已集成 Sentry（`@sentry/nextjs`）：

1. 配置 `SENTRY_*` 环境变量
2. 自动捕获错误和性能数据
3. Vercel 自动上传 Source Maps

---

## 💰 费用估算

### Vercel Free Plan

- ✅ 无限项目
- ✅ 100GB 带宽/月
- ✅ 无限部署
- ✅ 100GB-hours 函数执行时间/月
- ✅ 1000 次构建/月
- ⚠️ 6000 分钟函数执行时间/月

### 升级触发条件

- 超过 100GB 带宽：$20/月（Pro plan）
- 需要团队协作：$20/用户/月
- 需要企业级 SLA：联系销售

**你的项目预估**：

- 月访问量 1-10 万：免费版充足
- 数据库在 VPS：无额外费用
- R2 存储：Cloudflare 收费（但便宜）

---

## 🔗 有用链接

- **Vercel Dashboard**：https://vercel.com/dashboard
- **部署文档**：https://vercel.com/docs/deployments/overview
- **环境变量**：https://vercel.com/docs/projects/environment-variables
- **自定义域名**：https://vercel.com/docs/projects/domains
- **CLI 文档**：https://vercel.com/docs/cli

---

## 🆘 常见问题

### Q: 数据库连接超时

**A**: 检查 VPS 防火墙规则，确保 54322 端口开放：

```bash
# 在 VPS 上
sudo ufw allow 54322/tcp
sudo ufw status
```

### Q: OAuth 回调失败

**A**: 确保在 OAuth 提供商控制台添加了正确的回调 URL：

```
https://dobacklinks.com/api/auth/callback/google
https://dobacklinks.com/api/auth/callback/github
```

### Q: 环境变量未生效

**A**:

1. 检查是否在 Production 环境设置
2. 重新部署项目：`vercel --prod`
3. 检查变量名拼写（区分大小写）

### Q: 构建失败

**A**:

1. 查看构建日志：Vercel Dashboard → Deployments → 点击失败的部署
2. 本地测试：`pnpm build`
3. 检查 `package.json` 中的脚本是否正确

### Q: 图片不显示

**A**:

1. 检查 `R2_*` 环境变量
2. 验证 R2 桶公网访问权限
3. 检查 `next.config.mjs` 中的 `images.remotePatterns`

---

## 🎉 完成！

部署成功后，你的网站将在：

- **生产 URL**：https://dobacklinks.com
- **Vercel URL**：https://your-project.vercel.app

**下一步**：

1. ✅ 测试所有功能
2. ✅ 配置域名
3. ✅ 设置监控告警
4. ✅ 导入生产数据
5. ✅ 通知用户上线 🚀
