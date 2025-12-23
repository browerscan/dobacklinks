# 安全功能快速开始指南

## 1. HMAC API认证

### 生成签名（客户端）

```typescript
import { generateHMACSignature } from "@/lib/security/hmac-auth";

const params = {
  method: "GET",
  path: "/api/cron/enrich-sites",
  timestamp: Date.now(),
};

const signature = generateHMACSignature(params, process.env.CRON_SECRET!);

// 发送请求
fetch("/api/cron/enrich-sites", {
  headers: {
    Authorization: `HMAC ${signature}`,
    "X-Timestamp": String(params.timestamp),
  },
});
```

### 验证签名（服务端）

```typescript
import {
  verifyHMACSignature,
  extractHMACSignature,
} from "@/lib/security/hmac-auth";

const signature = extractHMACSignature(request.headers.get("authorization"));
const timestamp = Number(request.headers.get("x-timestamp"));

const result = verifyHMACSignature(
  signature,
  {
    method: request.method,
    path: new URL(request.url).pathname,
    timestamp,
  },
  process.env.CRON_SECRET!,
);

if (!result.valid) {
  return Response.json({ error: result.error }, { status: 401 });
}
```

### 使用curl测试

```bash
# 生成签名的示例脚本
TIMESTAMP=$(date +%s000)
SECRET="your-cron-secret"
SIGNATURE=$(echo -n "GET\n/api/cron/enrich-sites\n${TIMESTAMP}\n" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

curl -X GET http://localhost:3000/api/cron/enrich-sites \
  -H "Authorization: HMAC ${SIGNATURE}" \
  -H "X-Timestamp: ${TIMESTAMP}"
```

---

## 2. 邮件地址混淆

### 在组件中使用

```tsx
import { ObfuscatedEmailLink } from '@/lib/utils/ObfuscatedEmailLink';

// 简单使用
<ObfuscatedEmailLink email="contact@example.com" />

// 自定义样式
<ObfuscatedEmailLink
  email="contact@example.com"
  className="text-blue-600 hover:underline"
/>
```

### 原始函数

```typescript
import { obfuscateEmail } from "@/lib/utils/obfuscate-email";

const obfuscated = obfuscateEmail("test@example.com");
// 输出: &#116;&#101;&#115;&#116;&#64;&#101;&#120;&#97;...
```

---

## 3. 环境变量验证

### 添加新的环境变量

在 `/lib/env.ts` 中添加：

```typescript
const envSchema = z.object({
  // 现有变量...

  // 新增变量
  MY_NEW_API_KEY: z.string().min(1, "MY_NEW_API_KEY is required"),
  MY_OPTIONAL_CONFIG: z.string().optional(),
});
```

### 使用验证后的环境变量

```typescript
import { env } from "@/lib/env";

// 类型安全的访问
const apiKey = env.MY_NEW_API_KEY; // 自动补全 + 类型检查
```

---

## 4. 运行测试

### 基本测试命令

```bash
# 运行所有测试
pnpm test

# 监听模式（开发时）
pnpm test:watch

# UI界面
pnpm test:ui

# 生成覆盖率报告
pnpm test:coverage
```

### 添加新测试

在 `__tests__` 目录下创建 `.test.ts` 文件：

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "../my-module";

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });
});
```

---

## 5. 安全Headers验证

### 浏览器DevTools验证

1. 打开浏览器DevTools (F12)
2. 进入 Network 标签
3. 刷新页面
4. 点击任意请求
5. 查看 Response Headers

应该看到：

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'; ...
```

### 在线验证工具

- https://securityheaders.com/
- https://observatory.mozilla.org/

---

## 6. Sentry错误监控

### 手动发送错误

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // 可能出错的代码
} catch (error) {
  Sentry.captureException(error);
}
```

### 添加上下文信息

```typescript
Sentry.setUser({ id: userId, email: userEmail });
Sentry.setContext("page", { route: "/products", referrer });
```

### 性能追踪

```typescript
const transaction = Sentry.startTransaction({
  name: "Import Sites",
  op: "task",
});

try {
  await importSites();
} finally {
  transaction.finish();
}
```

---

## 常见问题

### Q: HMAC签名一直验证失败？

A: 检查：

1. CRON_SECRET在客户端和服务端一致
2. timestamp是毫秒级（`Date.now()`）
3. 时间戳在5分钟窗口内
4. method和path完全匹配（区分大小写）

### Q: 测试失败如何调试？

A: 使用UI模式查看详细错误：

```bash
pnpm test:ui
```

### Q: 环境变量验证失败如何处理？

A: 检查错误信息，确保 `.env.local` 中所有必需变量已配置：

```bash
DATABASE_URL=...
BETTER_AUTH_SECRET=...
CRON_SECRET=...
```

### Q: 如何在生产环境禁用Sentry？

A: 不设置 `NEXT_PUBLIC_SENTRY_DSN` 环境变量即可。

---

## 快速检查清单

部署前确认：

- [ ] 所有测试通过 (`pnpm test`)
- [ ] TypeScript编译无错误 (`pnpm tsc --noEmit`)
- [ ] `.env.local` 不在git仓库中
- [ ] 生产环境配置了所有必需的环境变量
- [ ] CRON_SECRET使用强随机值（≥32字符）
- [ ] Sentry DSN已配置（生产环境）
- [ ] 安全headers已验证（securityheaders.com）

---

_最后更新: 2024-12-18_
