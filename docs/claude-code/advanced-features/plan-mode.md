---
sidebar_position: 1
title: Plan 模式（规划模式）
description: 掌握 Claude Code 的 Plan 模式，先思考后行动，大幅减少复杂任务的返工成本
---

# Plan 模式（规划模式）

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::tip 核心理念
Plan 模式体现了 **"Think before you act"** 的工程哲学。在开始执行任何代码变更之前，Claude 会先深入理解问题、制定详细计划并获得你的确认。这对于复杂任务尤为关键——一次好的规划胜过十次盲目的尝试。
:::

## 进入 Plan 模式

有两种方式可以进入 Plan 模式：

| 方式 | 操作 | 适用场景 |
|------|------|----------|
| 键盘快捷键 | 连按两次 `Shift + Tab` | 交互式会话中快速切换 |
| 斜杠命令 | 输入 `/plan` | 明确指定规划模式 |
| 前缀提示词 | 在请求前加 `"请先制定计划..."` | 临时性规划需求 |

进入 Plan 模式后，Claude 的回复界面会显示 **[PLAN MODE]** 标识，且不会执行任何实际的文件修改操作，直到你明确批准计划。

---

## 工作流程：4 个阶段

Plan 模式将复杂任务分解为清晰的 4 个阶段，每个阶段都有明确的产出物。

```
┌─────────────────────────────────────────────────────────────┐
│   阶段 1      阶段 2      阶段 3      阶段 4               │
│   探索  ──→  规划  ──→  确认  ──→  执行                   │
│   (只读)    (设计)    (反馈)    (实施)                     │
└─────────────────────────────────────────────────────────────┘
```

### 阶段 1：探索阶段（Exploration）

Claude 进入只读模式，全面分析代码库：

- **读取相关文件** — 理解现有代码结构
- **分析依赖关系** — 梳理模块间的调用链路
- **识别约束条件** — 发现潜在的技术限制
- **搜索相似实现** — 参考已有模式和惯例

:::info 探索阶段特点
此阶段 Claude **不会修改任何文件**。所有操作均为只读：`Read`、`Glob`、`Grep`、`Bash`（查询类）。
:::

```
[探索阶段输出示例]
✓ 已读取 src/auth/ 目录（12 个文件）
✓ 分析依赖：express, passport, jsonwebtoken, bcrypt
✓ 发现现有用户模型：src/models/User.ts
✓ 识别路由结构：src/routes/*.ts
✓ 检查测试覆盖：tests/auth.test.ts（当前覆盖率 45%）
```

### 阶段 2：规划阶段（Planning）

基于探索结果，Claude 设计完整的实现方案：

- **拆解任务步骤** — 将目标分解为原子操作
- **评估影响范围** — 列出所有需要修改的文件
- **识别潜在风险** — 提前标记可能出现的问题
- **估算工作量** — 给出大致的操作数量

### 阶段 3：确认阶段（Confirmation）

Claude 将规划结果以结构化格式展示，等待你的反馈：

```markdown
## 实现计划：用户认证功能

### 将要修改的文件
1. src/models/User.ts - 添加密码哈希字段
2. src/routes/auth.ts  - 新建认证路由（登录/注册/登出）
3. src/middleware/auth.ts - JWT 验证中间件
4. src/config/passport.ts - Passport 策略配置
5. tests/auth.test.ts - 补充测试用例

### 将要创建的文件
- src/utils/jwt.ts - JWT 工具函数
- src/types/auth.ts - 类型定义

### 潜在风险
⚠️ User.ts 修改需要同步更新数据库迁移脚本
⚠️ 现有的 API 路由可能需要添加认证守卫

是否按此计划执行？(y/n 或提出修改意见)
```

你可以：
- 输入 `y` 或 `yes` — 批准计划，进入执行阶段
- 提出修改意见 — Claude 将调整计划后再次确认
- 输入 `n` — 取消，重新讨论需求

### 阶段 4：执行阶段（Execution）

计划获批后，Claude 按序执行每个步骤：

- **严格按计划实施** — 不会执行计划外的操作
- **实时反馈进度** — 每完成一步都会汇报
- **处理意外情况** — 遇到问题暂停并请示

---

## 完整使用示例：实现用户认证功能

以下是一个真实场景的完整演示，展示 Plan 模式在复杂功能开发中的应用。

### 第 1 步：启动 Plan 模式

```bash
# 在 Claude Code 交互界面中
# 输入需求后，按两次 Shift+Tab 进入 Plan 模式
```

**用户输入：**
```
为我们的 Express 应用实现完整的用户认证功能，
包括注册、登录、JWT token 管理和路由保护
```

### 第 2 步：Claude 探索代码库

```
[Plan Mode - 探索阶段]

正在分析代码库结构...
├── 读取 package.json → 发现依赖: express@4.18, mongoose@7.x
├── 扫描 src/ 目录 → 12 个源文件
├── 读取 src/models/User.ts → 当前仅有 name, email 字段
├── 读取 src/routes/index.ts → 4 个现有路由
├── 读取 src/app.ts → 中间件配置
└── 检查 .env.example → 已有 MONGODB_URI, PORT 变量

探索完成。未发现现有认证实现。
```

### 第 3 步：Claude 展示规划方案

```markdown
[Plan Mode - 规划方案]

## 用户认证系统实现计划

### 新增依赖
- bcryptjs     → 密码哈希
- jsonwebtoken → JWT 生成与验证
- express-validator → 输入验证

### 文件变更清单（共 8 处）

**修改现有文件：**
1. `src/models/User.ts`
   - 添加 `password` 字段（哈希存储）
   - 添加 `createdAt`, `updatedAt` 时间戳
   - 添加 `comparePassword()` 实例方法

2. `src/app.ts`
   - 挂载 /api/auth 路由

3. `.env.example`
   - 添加 JWT_SECRET, JWT_EXPIRES_IN 变量

**新建文件：**
4. `src/routes/auth.ts`       → POST /register, POST /login, POST /logout
5. `src/middleware/auth.ts`   → JWT 验证中间件
6. `src/utils/jwt.ts`         → token 生成/验证工具
7. `src/types/auth.ts`        → TypeScript 类型定义
8. `tests/auth.test.ts`       → 认证功能单元测试

### 风险提示
⚠️ 需要确保 JWT_SECRET 在生产环境中使用足够复杂的密钥
⚠️ 建议在 User 模型变更后运行数据库迁移

**预计操作：** 约 150 行新增代码，修改 3 个现有文件

---
批准此计划？直接输入 y 开始执行，或说明需要调整的内容。
```

### 第 4 步：用户调整计划

```
用户：计划看起来不错，但请把 logout 功能改为 token 黑名单机制，
     而不是单纯的客户端清除。
```

Claude 调整后重新确认：

```markdown
[已更新计划]

调整内容：
- 新增 `src/models/TokenBlacklist.ts` → 存储已失效的 token
- `POST /logout` 将把当前 token 加入黑名单
- `auth.ts` 中间件将检查 token 黑名单

其余计划保持不变。确认执行？
```

### 第 5 步：执行阶段

```
[Plan Mode - 执行阶段]

✓ [1/9] 安装依赖: npm install bcryptjs jsonwebtoken express-validator
✓ [2/9] 更新 src/models/User.ts
✓ [3/9] 创建 src/models/TokenBlacklist.ts
✓ [4/9] 创建 src/utils/jwt.ts
✓ [5/9] 创建 src/types/auth.ts
✓ [6/9] 创建 src/routes/auth.ts
✓ [7/9] 创建 src/middleware/auth.ts
✓ [8/9] 更新 src/app.ts
✓ [9/9] 创建 tests/auth.test.ts

所有步骤执行完成。
运行 npm test 验证实现是否正确。
```

---

## 为什么 Plan 模式至关重要

### 减少返工的数据支撑

在没有规划的情况下，Claude 直接执行复杂任务时的典型问题：

| 场景 | 无规划 | 有规划 |
|------|--------|--------|
| 理解偏差 | 实现一半发现方向错误 | 确认阶段提前纠偏 |
| 文件遗漏 | 忘记更新相关配置文件 | 规划阶段列出全部影响 |
| 技术债务 | 为赶进度引入不良实践 | 设计阶段评估最优方案 |
| 沟通成本 | 反复修改浪费 token | 一次规划对齐预期 |

### 适合使用 Plan 模式的场景

:::tip 强烈推荐使用 Plan 模式
- 新功能开发（超过 3 个文件的变更）
- 重构现有代码（架构层面的调整）
- 数据库 Schema 变更
- API 接口设计
- 引入新的第三方依赖
- 安全相关的功能实现
:::

:::note 可以跳过 Plan 模式
- 简单的 Bug 修复（单文件、定位明确）
- 格式化或注释更新
- 配置文件的微小调整
- 已有明确方案的重复性任务
:::

### Plan 模式的本质价值

```
没有 Plan 模式的开发流程：
需求 → 立即执行 → 发现问题 → 回滚 → 重新执行 → ...（循环）

使用 Plan 模式的开发流程：
需求 → 探索 → 规划 → 确认对齐 → 一次执行到位
```

Plan 模式不仅节省了 token 消耗，更重要的是通过**强制的预思考环节**，让 Claude 和你在执行前就达成对目标的一致理解，从根本上避免了方向性错误。
