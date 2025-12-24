# Blog API - Quick Start Guide

快速开始使用 `/api/blogs` API 创建博客文章。

## 1️⃣ 准备环境变量

确保你的 `.env.local` 中有 `CRON_SECRET`：

```bash
# .env.local
CRON_SECRET=your_secret_key_here
```

如果没有，生成一个：

```bash
openssl rand -hex 32
```

## 2️⃣ 测试 API（本地）

### 方法 1：使用 TypeScript 测试脚本

```bash
pnpm tsx scripts/test-blog-api.ts
```

### 方法 2：使用 Python 测试脚本

```bash
python scripts/test-blog-api.py
```

### 方法 3：使用 cURL

```bash
# 生成时间戳
TIMESTAMP=$(date +%s%3N)

# 准备请求体
BODY='{"title":"Test Post","slug":"test-'$TIMESTAMP'","content":"# Hello","status":"published","visibility":"public","tags":[]}'

# 生成签名
SIGNATURE=$(echo -n "POST|/api/blogs|${TIMESTAMP}|${BODY}" | openssl dgst -sha256 -hmac "$CRON_SECRET" | cut -d' ' -f2)

# 发送请求
curl -X POST http://localhost:3000/api/blogs \
  -H "Content-Type: application/json" \
  -H "Authorization: HMAC ${SIGNATURE}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -d "$BODY"
```

## 3️⃣ 集成到你的应用

### Node.js/TypeScript 示例

```typescript
import crypto from "crypto";

const CRON_SECRET = process.env.CRON_SECRET!;
const API_URL = "https://dobacklinks.com";

function generateHMACSignature(
  method: string,
  path: string,
  timestamp: number,
  body: string,
): string {
  const canonicalString = `${method.toUpperCase()}|${path}|${timestamp}|${body}`;
  const hmac = crypto.createHmac("sha256", CRON_SECRET);
  hmac.update(canonicalString);
  return hmac.digest("hex");
}

async function createPost(postData: any) {
  const path = "/api/blogs";
  const timestamp = Date.now();
  const body = JSON.stringify(postData);
  const signature = generateHMACSignature("POST", path, timestamp, body);

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `HMAC ${signature}`,
      "X-Timestamp": timestamp.toString(),
    },
    body: body,
  });

  return response.json();
}

// 使用
const result = await createPost({
  title: "我的博客文章",
  slug: "my-blog-post",
  content: "# 标题\n\n内容...",
  status: "published",
  visibility: "public",
  tags: [],
});

console.log("文章已创建:", result.data.postId);
```

### Python 示例

```python
import os
import hmac
import hashlib
import time
import json
import requests

CRON_SECRET = os.getenv("CRON_SECRET")
API_URL = "https://dobacklinks.com"

def generate_hmac_signature(method: str, path: str, timestamp: int, body: str) -> str:
    canonical_string = f"{method.upper()}|{path}|{timestamp}|{body}"
    signature = hmac.new(
        CRON_SECRET.encode('utf-8'),
        canonical_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

def create_post(post_data: dict) -> dict:
    path = "/api/blogs"
    timestamp = int(time.time() * 1000)
    body = json.dumps(post_data)
    signature = generate_hmac_signature("POST", path, timestamp, body)

    response = requests.post(
        f"{API_URL}{path}",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"HMAC {signature}",
            "X-Timestamp": str(timestamp),
        },
        data=body,
    )

    return response.json()

# 使用
result = create_post({
    "title": "我的博客文章",
    "slug": "my-blog-post",
    "content": "# 标题\n\n内容...",
    "status": "published",
    "visibility": "public",
    "tags": [],
})

print(f"文章已创建: {result['data']['postId']}")
```

## 4️⃣ 常见用例

### 发布草稿

```json
{
  "title": "草稿文章",
  "slug": "draft-post",
  "content": "内容...",
  "status": "draft",
  "visibility": "public",
  "tags": []
}
```

### 发布仅登录用户可见的文章

```json
{
  "title": "会员文章",
  "slug": "member-only-post",
  "content": "内容...",
  "status": "published",
  "visibility": "logged_in",
  "tags": []
}
```

### 置顶文章

```json
{
  "title": "重要公告",
  "slug": "important-announcement",
  "content": "内容...",
  "status": "published",
  "visibility": "public",
  "isPinned": true,
  "tags": []
}
```

### 带标签的文章

```json
{
  "title": "技术文章",
  "slug": "tech-article",
  "content": "内容...",
  "status": "published",
  "visibility": "public",
  "tags": [
    { "id": "tag-uuid-1", "name": "technology" },
    { "id": "tag-uuid-2", "name": "programming" }
  ]
}
```

> ⚠️ **注意**: 标签必须先在后台创建，然后才能使用其 ID。

## 5️⃣ 错误处理

```typescript
const result = await createPost(postData);

if (result.success) {
  console.log("✅ 成功:", result.data.postId);
} else {
  console.error("❌ 失败:", result.error);

  // 处理特定错误
  if (result.error.includes("already exists")) {
    console.log("💡 提示: 使用不同的 slug");
  }
}
```

## 6️⃣ 生产环境部署

1. 确保在生产环境设置 `CRON_SECRET`
2. 使用 HTTPS 连接
3. 定期轮换密钥
4. 监控认证失败日志
5. 考虑添加速率限制

## 📚 完整文档

详细 API 文档请查看 [docs/API.md](./docs/API.md)

## 🔒 安全提示

- ✅ **务必使用 HTTPS** (生产环境)
- ✅ **不要提交 CRON_SECRET** 到 git
- ✅ **定期轮换密钥**
- ✅ **监控异常请求**
- ✅ **实现速率限制** (推荐)

## 🆘 常见问题

### Q: 401 Authentication failed

**A:** 检查：

1. `CRON_SECRET` 是否正确
2. 时间戳是否在 5 分钟内
3. 签名生成是否正确

### Q: 409 Slug already exists

**A:** 使用不同的 slug，或者更新现有文章（需要实现 PUT/PATCH 端点）

### Q: 400 Invalid input data

**A:** 检查请求体是否符合 schema 要求：

- `title` 至少 3 个字符
- `slug` 至少 3 个字符
- `status` 必须是 `draft`、`published` 或 `archived`
- `visibility` 必须是 `public` 或 `logged_in`

## 📞 支持

遇到问题？联系：outreach@dobacklinks.com
