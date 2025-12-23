# SimilarWeb Enrichment 测试验证指南

## 🧪 测试准备

### 1. 确保环境变量配置正确

检查 `.env.local` 是否包含：

```bash
SIMILARWEB_API_URL=https://similarweb.publisherlens.com/api/v1
SIMILARWEB_API_KEY=pk_publisherlens_cc6e570986a936b32044b2f1b61ded8bd640f7a28b7b6a094758d8686124cd6d
CRON_SECRET=d2393e37ec89fd03197d44c4dad645f8655472733c14302ed781950c8fa51009
DATABASE_URL=postgresql://postgres:postgres@93.127.133.204:54322/postgres
```

### 2. 安装依赖（如果尚未安装）

```bash
pnpm install
```

---

## 🚀 测试方法

### 方法 1：使用测试脚本（推荐）

**运行测试脚本**：

```bash
pnpm tsx scripts/test-enrichment.ts
```

**期望输出**：

```
🧪 Testing SimilarWeb Enrichment Service

📊 Test 1: Getting enrichment statistics...
✅ Statistics retrieved:
   Total products: 8645
   Pending: 8645 (100%)
   Enriched: 0 (0%)
   Failed: 0 (0%)
   Last enriched: Never

📋 Test 2: Fetching pending products...
✅ Found 5 pending products (showing first 5):
   1. TechCrunch (https://techcrunch.com)
   2. Example Site (https://example.com)
   ...

🔍 Test 3: Enriching a single product...
   Testing with: TechCrunch (https://techcrunch.com)
✅ Enrichment completed:
   Enriched: 1
   Failed: 0
   Duration: 3245ms
   Status: enriched
   Monthly visits: 45,234,567
   Global rank: 123

🔄 Test 4: Testing batch enrichment (5 products)...
   Progress: 0/5 - Enriched: 0, Failed: 0
   Progress: 5/5 - Enriched: 4, Failed: 1
✅ Batch enrichment completed:
   Total processed: 5
   Enriched: 4
   Failed: 1
   Duration: 12350ms
   Failed domains: lowtraffic.example.com

📊 Final statistics after tests:
   Total products: 8645
   Pending: 8640 (99.9%)
   Enriched: 4 (0.05%)
   Failed: 1 (0.01%)

🎉 All tests completed!
```

---

### 方法 2：使用 API 端点测试

**1. 启动开发服务器**：

```bash
pnpm dev
```

**2. 手动触发 enrichment**：

```bash
curl -X GET "http://localhost:3000/api/cron/enrich-sites" \
  -H "Authorization: Bearer d2393e37ec89fd03197d44c4dad645f8655472733c14302ed781950c8fa51009" \
  -s | jq '.'
```

**期望响应**：

```json
{
  "success": true,
  "enriched": 85,
  "failed": 15,
  "total": 100,
  "duration": 45230,
  "notice": "This endpoint is for manual triggers only. Use /dashboard/enrichment for UI-based management."
}
```

**3. 检查数据库变化**：

```bash
# 查看 enrichment 状态分布
PGPASSWORD=postgres psql -h 93.127.133.204 -p 54322 -U postgres -d postgres -c \
  "SELECT enrichment_status, COUNT(*) FROM products GROUP BY enrichment_status;"
```

**期望输出**：

```
 enrichment_status | count
-------------------+-------
 pending           |  8545
 enriched          |    85
 failed            |    15
```

---

### 方法 3：通过 Server Actions 测试（代码测试）

创建一个临时测试文件 `test-actions.ts`：

```typescript
import {
  getEnrichmentStatsAction,
  enrichAllPendingAction,
} from "./actions/enrichment";

async function testActions() {
  // 测试获取统计
  const statsResult = await getEnrichmentStatsAction();
  console.log("Stats:", statsResult);

  // 测试触发 enrichment
  const enrichResult = await enrichAllPendingAction();
  console.log("Enrich result:", enrichResult);
}

testActions();
```

运行：

```bash
pnpm tsx test-actions.ts
```

---

## ✅ 验证清单

### 后端功能验证

- [ ] **统计数据获取正常**
  - `getEnrichmentStats()` 返回正确的 total/pending/enriched/failed 数量
  - 百分比计算正确

- [ ] **单个产品 enrichment 工作**
  - `enrichSingleProduct()` 成功获取 SimilarWeb 数据
  - 数据库正确更新 `enrichmentStatus = 'enriched'`
  - `monthlyVisits`, `globalRank` 等字段被填充

- [ ] **批量 enrichment 工作**
  - `enrichProducts()` 处理多个产品
  - 失败的域名被标记为 `enrichmentStatus = 'failed'`
  - 失败域名加入 SimilarWeb 队列

- [ ] **Server Actions 权限检查**
  - 非管理员调用返回 `unauthorized` 错误
  - 管理员可以成功调用

- [ ] **API 端点工作**
  - `/api/cron/enrich-sites` 需要正确的 CRON_SECRET
  - 返回 enrichment 结果和统计

### 前端功能验证

- [ ] **SimilarWebMetrics 组件隐藏逻辑**
  - Pending 产品不显示流量卡片
  - Failed 产品不显示流量卡片
  - Enriched 产品显示完整流量数据

验证步骤：

1. 访问一个 pending 产品详情页（例如：`/sites/example-site`）
2. 确认页面不显示 "Traffic Metrics" 卡片
3. 使用 API 或脚本 enrich 该产品
4. 刷新页面，确认现在显示流量数据

---

## 🐛 常见问题排查

### 问题 1：数据库连接失败

**错误信息**：

```
connection to server at "93.127.133.204", port 54322 failed:
FATAL: remaining connection slots are reserved for roles with the SUPERUSER attribute
```

**解决方案**：

- VPS Supabase 连接槽已满
- 等待几分钟后重试
- 或者关闭其他数据库连接

### 问题 2：SimilarWeb API 返回错误

**错误信息**：

```
SimilarWeb API error: 500 Internal Server Error
```

**可能原因**：

1. API Key 无效或过期
2. 域名不存在于 SimilarWeb 数据库
3. API 速率限制

**排查步骤**：

```bash
# 测试 API 直接访问
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://similarweb.publisherlens.com/api/v1/domain/google.com"
```

### 问题 3：所有产品都标记为 failed

**可能原因**：

- SimilarWeb API 服务不可用
- API Key 配置错误
- 网络连接问题

**验证步骤**：

1. 检查 `.env.local` 中的 `SIMILARWEB_API_KEY`
2. 测试 API 健康检查：
   ```bash
   curl https://similarweb.publisherlens.com/api/v1/health
   ```

### 问题 4：Enrichment 超时

**错误信息**：

```
Request timeout - API service took too long to respond
```

**解决方案**：

- 减少批量处理数量（当前限制 100 个/次）
- SimilarWeb API 可能响应慢，属于正常现象
- 分多次执行 enrichment

---

## 📊 性能基准

基于 8,645 个产品：

| 操作                | 预期耗时   | 说明                       |
| ------------------- | ---------- | -------------------------- |
| 获取统计            | <1秒       | 使用索引优化后             |
| 单个产品 enrichment | 3-8秒      | 取决于 SimilarWeb API 响应 |
| 批量 50 个产品      | 12-20秒    | 一个 batch                 |
| 批量 100 个产品     | 25-45秒    | 两个 batch                 |
| 全部 8,645 个产品   | ~35-60分钟 | 需要多次手动触发           |

---

## 🚀 下一步建议

完成测试后，根据结果：

### 测试通过 ✅

1. **部署到生产环境**

   ```bash
   git add .
   git commit -m "feat: optimize SimilarWeb enrichment - manual trigger only"
   git push
   ```

2. **应用数据库迁移**

   ```bash
   pnpm db:push
   ```

3. **首次批量 enrichment**
   - 使用 API 端点手动触发
   - 每次处理 100 个产品
   - 重复直到所有 pending 产品处理完成

4. **（可选）创建管理界面**
   - 实现 `/dashboard/enrichment` 页面
   - 提供可视化统计和一键触发功能

### 测试失败 ❌

1. **检查错误日志**
   - 查看控制台输出
   - 检查数据库连接状态

2. **验证环境配置**
   - 确认所有环境变量正确
   - 测试 SimilarWeb API 可访问性

3. **联系支持**
   - 提供完整错误日志
   - 说明测试步骤和结果

---

## 📞 需要帮助？

如果测试过程中遇到问题，提供以下信息：

1. 完整的错误日志
2. 运行的测试命令
3. 环境变量配置（去除敏感信息）
4. 数据库连接状态

---

**文档版本**: 1.0
**最后更新**: 2024-12-15
