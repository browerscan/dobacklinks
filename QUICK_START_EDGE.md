# Cloudflare Edge 快速开始

**⏱️ 预计时间**: 30分钟

---

## 🚀 最快部署路径

### 步骤1: 配置Hyperdrive (保留现有数据库)

```bash
# 创建Hyperdrive配置
wrangler hyperdrive create dobacklinks-db \
  --connection-string="postgresql://postgres:postgres@93.127.133.204:54322/postgres"

# 输出示例:
# 🚀 Created new Hyperdrive config
# ID: abc123def456ghi789jkl
#
# 复制这个ID!
```

### 步骤2: 更新配置

```bash
# 编辑 wrangler.toml
# 找到这几行并取消注释:

# [[hyperdrive]]
# binding = "HYPERDRIVE"
# id = "your-hyperdrive-id-here"

# 改为:

[[hyperdrive]]
binding = "HYPERDRIVE"
id = "abc123def456ghi789jkl"  # 你的实际ID
```

### 步骤3: 测试本地构建

```bash
# 清理旧构建
rm -rf .next .worker-next

# Next.js构建
pnpm build

# Cloudflare适配器构建
npx @cloudflare/next-on-pages

# 检查输出
ls -lh .worker-next/
```

### 步骤4: 本地测试

```bash
# 本地Workers模拟环境
wrangler pages dev .worker-next

# 在浏览器打开:
# http://localhost:8788

# 测试:
# - 首页是否正常
# - 产品列表是否加载
# - 数据库查询是否工作
```

### 步骤5: 远程测试 (真实Workers环境)

```bash
# 在真实Cloudflare Workers环境测试
wrangler pages dev .worker-next --remote

# 再次测试所有功能
```

### 步骤6: 部署

```bash
# 方法1: 手动部署
pnpm cloudflare:deploy

# 方法2: Git推送 (自动部署)
git add .
git commit -m "feat: Cloudflare Edge Runtime with Hyperdrive"
git push origin main
```

---

## ✅ 验证清单

部署后检查:

```bash
# 1. 检查部署状态
wrangler pages deployment list

# 2. 查看实时日志
wrangler tail

# 3. 访问生产URL
# https://dobacklinks.com

# 4. 测试关键功能
# - [ ] 首页加载
# - [ ] 产品列表
# - [ ] 产品详情
# - [ ] 博客列表
# - [ ] 搜索功能
# - [ ] 数据库查询
```

---

## 🆘 遇到问题?

### Hyperdrive创建失败

```bash
# 检查Cloudflare登录
wrangler whoami

# 重新登录
wrangler login

# 检查数据库连接
psql "postgresql://postgres:postgres@93.127.133.204:54322/postgres" -c "SELECT 1"
```

### 构建失败

```bash
# 查看完整错误
pnpm build 2>&1 | tee build.log

# 常见问题:
# - TypeScript错误: 检查.edge.ts文件类型
# - 依赖缺失: pnpm install
# - 环境变量: 检查.env.local
```

### 本地测试失败

```bash
# 检查wrangler版本
wrangler --version

# 更新wrangler
pnpm add -D wrangler@latest

# 清理并重试
rm -rf .next .worker-next node_modules/.cache
pnpm build && npx @cloudflare/next-on-pages
```

### 部署失败

```bash
# 检查Cloudflare API Token
echo $CLOUDFLARE_API_TOKEN

# 检查Account ID
echo $CLOUDFLARE_ACCOUNT_ID

# 手动设置
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
```

---

## 📚 详细文档

- **下一步**: [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)
- **迁移指南**: [docs/EDGE_MIGRATION_GUIDE.md](docs/EDGE_MIGRATION_GUIDE.md)
- **优化报告**: [docs/CLOUDFLARE_EDGE_OPTIMIZATION.md](docs/CLOUDFLARE_EDGE_OPTIMIZATION.md)

---

## 💡 可选优化 (部署成功后)

### 如果需要截图功能

```bash
# 创建R2 Bucket
wrangler r2 bucket create dobacklinks-screenshots

# 更新 wrangler.toml
[[r2_buckets]]
binding = "R2_SCREENSHOTS"
bucket_name = "dobacklinks-screenshots"

# 启用公共访问并设置环境变量
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### 如果需要完全Edge化

查看 [EDGE_MIGRATION_GUIDE.md](docs/EDGE_MIGRATION_GUIDE.md) 了解如何:

- 更新代码导入`.edge`版本
- 添加`runtime = "edge"`到路由
- 配置R2存储
- 完全移除Node.js依赖

---

**现在开始吧！** 🚀

```bash
# 一键命令 (Hyperdrive配置后)
rm -rf .next .worker-next && \
pnpm build && \
npx @cloudflare/next-on-pages && \
wrangler pages dev .worker-next --remote
```
