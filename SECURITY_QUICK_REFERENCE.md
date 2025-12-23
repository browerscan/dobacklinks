# 安全加固快速参考

## 测试 HMAC 认证

```bash
# 1. 生成签名
tsx scripts/test-hmac.ts

# 2. 使用生成的命令测试
curl -X GET http://localhost:3000/api/cron/enrich-sites \
  -H "Authorization: HMAC <signature>" \
  -H "X-Timestamp: <timestamp>"
```

## 运行测试

```bash
pnpm test              # 运行所有测试
pnpm test:watch        # 监听模式
pnpm test:ui           # 测试 UI
pnpm test:coverage     # 覆盖率报告
```

## 必需环境变量

```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<最少32字符>
CRON_SECRET=<最少32字符>
```

## Sentry 配置（可选）

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx  # 仅生产环境
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## 安全 Headers

自动应用于所有路由：

- HSTS (1年)
- X-Frame-Options: DENY
- CSP (严格策略)
- X-Content-Type-Options: nosniff

## 新增文件

**安全**:

- `lib/utils/obfuscate-email.ts` - 邮件混淆
- `lib/utils/ObfuscatedEmailLink.tsx` - 混淆组件
- `lib/security/hmac-auth.ts` - HMAC 认证
- `lib/env.ts` - 环境变量验证

**监控**:

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`

**测试**:

- `vitest.config.ts`
- `vitest.setup.ts`
- `lib/import/__tests__/quality-scorer.test.ts`
- `lib/security/__tests__/hmac-auth.test.ts`

## 已知问题

⚠️ Login 页面需要 Suspense 边界（预先存在的问题）

- 不影响安全功能
- 需修复后才能构建
