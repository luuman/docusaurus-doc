---
sidebar_position: 6
title: CLAUDE.md（项目记忆文件）
description: CLAUDE.md 是 Claude Code 的项目记忆文件，记录项目结构、构建命令、代码规范等关键信息，让 AI 在每次对话中都能快速获取项目上下文
---

# CLAUDE.md（项目记忆文件）

## 什么是 CLAUDE.md

CLAUDE.md 是 Claude Code 的**项目记忆文件**。每次启动 Claude Code 会话时，它会自动读取项目根目录下的 `CLAUDE.md`，将其内容作为系统上下文注入——相当于给 AI 一份"项目说明书"。

:::info 核心价值
没有 CLAUDE.md，每次对话都需要重新向 AI 解释项目背景；有了 CLAUDE.md，AI 在第一条消息之前就已经了解你的项目结构、技术栈、代码规范和团队约定。
:::

CLAUDE.md 通常记录以下内容：

- **项目结构**：目录组织方式和各目录职责
- **构建命令**：如何运行、测试、构建项目
- **代码规范**：命名约定、格式要求、架构模式
- **架构决策**：重要的技术选型及其原因
- **团队约定**：Git 提交规范、代码审查要求

---

## 生成 CLAUDE.md

### 自动生成

在项目根目录运行：

```bash
# 方式一：在 Claude Code 中运行斜杠命令
/init

# 方式二：通过命令行，并提供项目描述
claude /init "这是一个 Node.js + React 全栈项目，使用 PostgreSQL 数据库，部署在 AWS 上"

# 方式三：带更多上下文
claude /init "这是一个微服务架构的电商平台，后端使用 Go 语言，前端使用 Next.js，通过 Kubernetes 编排"
```

Claude Code 会自动扫描项目文件（`package.json`、`Makefile`、`README.md` 等），生成初始的 `CLAUDE.md`。

### 手动创建

也可以直接在项目根目录创建 `CLAUDE.md` 文件，按需填写内容。

---

## 完整 CLAUDE.md 示例

以下是一个适用于全栈 Web 项目的完整 `CLAUDE.md` 示例：

```markdown
# 项目概述

这是一个电商平台的管理后台系统，提供商品管理、订单处理、用户管理和数据分析功能。

- **项目名称**：E-Commerce Admin
- **版本**：v2.3.0
- **负责团队**：Platform Team
- **项目状态**：活跃开发中

## 技术栈

### 前端
- **框架**：React 18 + TypeScript 5
- **状态管理**：Zustand（全局状态）+ React Query（服务端状态）
- **UI 组件库**：Ant Design 5
- **样式**：Tailwind CSS（布局） + CSS Modules（组件样式）
- **构建工具**：Vite 5
- **测试**：Vitest + React Testing Library

### 后端
- **运行时**：Node.js 20 LTS
- **框架**：Fastify 4（REST API）
- **ORM**：Prisma 5
- **数据库**：PostgreSQL 15（主库）+ Redis 7（缓存）
- **认证**：JWT + Refresh Token 机制
- **测试**：Jest + Supertest

### 基础设施
- **容器**：Docker + Docker Compose（开发环境）
- **CI/CD**：GitHub Actions
- **部署**：AWS ECS Fargate
- **监控**：Datadog

## 项目结构

```
project-root/
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # 可复用 UI 组件
│   │   │   ├── common/     # 通用组件（Button, Input 等）
│   │   │   └── business/   # 业务组件
│   │   ├── pages/          # 页面组件（对应路由）
│   │   ├── hooks/          # 自定义 React Hooks
│   │   ├── stores/         # Zustand 状态 Store
│   │   ├── services/       # API 请求封装
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript 类型定义
│   └── tests/              # 测试文件
├── backend/                # Node.js 后端
│   ├── src/
│   │   ├── routes/         # Fastify 路由定义
│   │   ├── controllers/    # 业务逻辑控制器
│   │   ├── services/       # 服务层（核心业务逻辑）
│   │   ├── middlewares/    # 中间件
│   │   ├── models/         # Prisma 模型（自动生成）
│   │   └── utils/          # 工具函数
│   ├── prisma/
│   │   ├── schema.prisma   # 数据库 Schema 定义
│   │   └── migrations/     # 数据库迁移文件
│   └── tests/              # 测试文件
├── shared/                 # 前后端共享代码
│   └── types/              # 共享 TypeScript 类型
├── docker-compose.yml      # 本地开发环境
└── .github/workflows/      # CI/CD 配置
```

## 常用命令

### 开发环境

```bash
# 启动完整开发环境（数据库 + 后端 + 前端）
docker-compose up -d

# 仅启动数据库和 Redis
docker-compose up -d postgres redis

# 启动后端开发服务器（热重载）
cd backend && npm run dev

# 启动前端开发服务器
cd frontend && npm run dev
```

### 测试

```bash
# 运行所有测试
npm run test

# 前端测试（带覆盖率报告）
cd frontend && npm run test:coverage

# 后端测试
cd backend && npm run test

# 后端集成测试（需要数据库）
cd backend && npm run test:integration

# 端到端测试
npm run test:e2e
```

### 数据库操作

```bash
# 应用所有待执行的迁移
cd backend && npx prisma migrate dev

# 生成 Prisma Client（修改 schema 后必须执行）
cd backend && npx prisma generate

# 打开数据库可视化管理界面
cd backend && npx prisma studio

# 重置开发数据库并重新填充种子数据
cd backend && npx prisma migrate reset
```

### 构建与部署

```bash
# 构建前端生产版本
cd frontend && npm run build

# 构建后端
cd backend && npm run build

# 本地预览生产构建
npm run preview

# 推送到 staging 环境（通过 CI/CD 触发）
git push origin staging
```

## 代码规范

### TypeScript 规范

- 所有函数必须有明确的返回类型标注
- 禁止使用 `any` 类型，使用 `unknown` 替代
- 接口命名以 `I` 开头（如 `IUser`），类型别名不加前缀
- 枚举使用 `enum`，不使用字符串字面量联合类型（除非值动态）

### React 组件规范

- 使用函数式组件 + Hooks，不使用 Class 组件
- 组件文件名使用 PascalCase（如 `UserProfile.tsx`）
- Props 接口命名为 `[ComponentName]Props`
- 复杂组件拆分：每个文件不超过 200 行
- 不在 JSX 中写内联样式（除非动态计算）

### API 设计规范

- REST API 遵循 RESTful 风格
- 路由使用小写 + 连字符（如 `/api/user-profiles`）
- 响应统一格式：`{ data, message, code, timestamp }`
- 错误码使用 HTTP 标准状态码
- 所有 API 端点必须有 OpenAPI 注释

### 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| React 组件 | PascalCase | `UserProfile.tsx` |
| Hook | camelCase，use 开头 | `useUserData.ts` |
| 工具函数 | camelCase | `formatDate.ts` |
| 常量文件 | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| 测试文件 | 同被测文件 + `.test` | `UserProfile.test.tsx` |

## Git 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 提交类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(orders): add bulk export functionality` |
| `fix` | Bug 修复 | `fix(auth): resolve token refresh race condition` |
| `refactor` | 重构（不影响功能） | `refactor(api): simplify error handling middleware` |
| `test` | 测试相关 | `test(users): add edge cases for validation` |
| `docs` | 文档更新 | `docs(api): update authentication endpoints` |
| `chore` | 构建/工具链 | `chore: upgrade prisma to v5.8` |
| `perf` | 性能优化 | `perf(dashboard): implement virtual scrolling` |

### Scope 可选值

`auth`, `orders`, `products`, `users`, `dashboard`, `api`, `db`, `infra`

## 代码审查清单

提交 PR 前自检：

- [ ] 所有测试通过（`npm run test`）
- [ ] 代码无 Lint 错误（`npm run lint`）
- [ ] TypeScript 无类型错误（`npm run type-check`）
- [ ] 新功能有对应的测试覆盖
- [ ] API 变更已更新 OpenAPI 文档
- [ ] 数据库变更已创建迁移文件
- [ ] 敏感信息未被提交（密码、Token、密钥）
- [ ] PR 描述清楚说明了变更内容和原因

## 架构决策记录（ADR）

### ADR-001：选择 Fastify 而非 Express

**日期**：2023-11-15
**状态**：已采纳

**背景**：需要选择 Node.js HTTP 框架。

**决策**：使用 Fastify 4。

**原因**：
- 性能比 Express 高 2-3 倍（基准测试数据）
- 内置 TypeScript 支持（Express 需要额外配置）
- 内置 Schema 验证（基于 JSON Schema）
- 插件生态成熟

**影响**：需要团队学习 Fastify 特有的插件系统，但长期维护成本更低。

---

### ADR-002：状态管理选择 Zustand

**日期**：2024-01-08
**状态**：已采纳

**背景**：需要管理前端全局状态，评估了 Redux Toolkit、Jotai、Zustand。

**决策**：使用 Zustand 管理全局 UI 状态，React Query 管理服务端状态。

**原因**：
- Zustand API 简洁，学习成本低
- 无需 Provider 包裹，减少组件树复杂度
- React Query 专为服务端状态设计，缓存策略更完善

## 环境变量

### 后端环境变量（`backend/.env`）

```
# 数据库
DATABASE_URL=postgresql://admin:password@localhost:5432/ecommerce_dev
REDIS_URL=redis://localhost:6379

# 认证
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# AWS（生产环境）
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=ecommerce-assets

# 第三方服务
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=noreply@yourcompany.com
SMTP_PASS=your-smtp-password
```

### 前端环境变量（`frontend/.env`）

```
# API 地址
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001

# 功能开关
VITE_ENABLE_ANALYTICS=false
VITE_SENTRY_DSN=https://...
```

## 常见问题

### Q：Prisma Client 报错"找不到模块"

```bash
# 重新生成 Prisma Client
cd backend && npx prisma generate
```

### Q：前端开发服务器无法代理 API 请求

检查 `frontend/vite.config.ts` 中的 proxy 配置，确保 `target` 指向正确的后端地址。

### Q：数据库迁移失败

```bash
# 查看迁移状态
npx prisma migrate status

# 如果开发环境数据不重要，重置数据库
npx prisma migrate reset
```

### Q：Docker 容器端口冲突

检查本地是否已运行 PostgreSQL 或 Redis 服务：

```bash
# 查看端口占用
lsof -i :5432
lsof -i :6379
```
```

---

## AI 进化机制

CLAUDE.md 不是静态文档——Claude Code 会随着项目演进自动更新它。

### 自动更新触发场景

当你在 PR 审查中给 Claude Code 的输出提供反馈时，Claude Code 会自动更新 CLAUDE.md：

```
用户：上次你生成的 API 路由用了 Express 风格，
     我们项目用的是 Fastify，路由写法不一样，
     以后记得用 Fastify 的 schema 验证语法。

Claude Code：好的，我已经将这个约定记录到 CLAUDE.md 中，
            后续生成代码时会自动遵循 Fastify 的写法。
```

:::tip AI 进化最佳实践
每当 Claude Code 犯了某类错误，不要只是纠正这一次——让它把正确做法写进 CLAUDE.md。这样这个"经验"就会持久化，下次自动应用。
:::

---

## 团队协作

### CLAUDE.md 的版本管理

`CLAUDE.md` 应该像代码一样进行版本控制：

```bash
# 提交 CLAUDE.md 更新
git add CLAUDE.md
git commit -m "docs(claude-md): add Fastify routing convention"
```

### 多级 CLAUDE.md

Claude Code 支持多级 CLAUDE.md 文件，内容会合并：

```
~/.claude/CLAUDE.md          # 全局个人配置（所有项目适用）
~/project/CLAUDE.md          # 项目级配置（团队共享）
~/project/backend/CLAUDE.md  # 子目录配置（特定模块规范）
```

### 团队维护建议

:::tip 团队协作规范

1. **定期审查**：每个 Sprint 结束时审查 CLAUDE.md 是否需要更新
2. **变更说明**：修改 CLAUDE.md 时在 Git 提交信息中说明原因
3. **新成员引导**：CLAUDE.md 可作为新成员了解项目的第一份文档
4. **去除过时内容**：定期清理已废弃的规范和已解决的问题
5. **结构清晰**：使用 Markdown 标题和表格，保持可读性
:::

:::warning 注意敏感信息
CLAUDE.md 会被提交到 Git 仓库，**绝对不要在其中写入真实的密码、API Key、数据库连接字符串等敏感信息**。使用环境变量名（如 `$DATABASE_URL`）而非实际值。
:::
