# Code Quality (代码质量方案)

目标：让“可读性、可维护性、可回归验证”变成默认路径，并且在 PR/合并前自动卡口。

## 质量卡口（Quality Gates）

1. **Lint**：静态规则检查（Next.js + React 生态）
2. **Typecheck**：TypeScript 类型检查（业务代码 + 测试代码）
3. **Tests**：Vitest 单测/组件测试（可在无环境变量条件下运行）
4. **Format（可选但推荐）**：Prettier 统一格式，减少无意义 diff

## 本地命令（pnpm）

- `pnpm lint`：运行 ESLint
- `pnpm lint:fix`：自动修复可修复规则
- `pnpm typecheck`：检查业务代码类型
- `pnpm typecheck:test`：检查测试代码类型
- `pnpm test`：运行 Vitest
- `pnpm check`：一键跑完 lint + typecheck + tests
- `pnpm format` / `pnpm format:check`：Prettier 格式化/校验

## 约定（Conventions）

### 1) Next.js 路由跳转

- 站内跳转使用 `next/link` 的 `Link`（避免 `<a href="/xxx">` 造成 ESLint 报错与预取缺失）
- 纯锚点（`#hash`）或站外链接再使用 `<a>`

### 2) 环境变量

- 业务代码中尽量不要散落 `process.env.*`
- 统一从 `lib/env.ts` 读取/校验（zod），保持“启动即失败”或“构建期安全默认值”的可预期行为

### 3) 模块边界

- `app/`：页面与 UI 编排（尽量薄）
- `lib/`：可复用业务逻辑/客户端/服务封装（可测试）
- `scripts/`：一次性脚本（不应被运行时依赖）

### 4) 可测试性

- 优先把纯逻辑提炼到 `lib/`，让测试不依赖 Next runtime
- 对外部依赖（网络/DB/存储）封装成小接口，测试中可替换为 fake

## CI

GitHub Actions 增加了 `CI` 工作流，PR 和 `main` 分支 push 会自动运行：

- lint
- typecheck（app + tests）
- vitest tests
