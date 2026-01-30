---
sidebar_position: 1
title: 工作流最佳实践
description: Claude Code 工作流最佳实践，涵盖探索-规划-编码-提交、TDD、代码审查与验证闭环
---

# 工作流最佳实践

高效使用 Claude Code 的核心在于建立规范的工作流。本文介绍几种经过验证的工作流模式，帮助你最大化 Claude Code 的生产力。

---

## 探索-规划-编码-提交工作流

这是 Claude Code 最推荐的标准工作流，适用于大多数功能开发和 Bug 修复场景。

### 前置准备

在开始工作之前，确保以下工具已安装和配置：

| 工具 | 安装命令 | 用途 |
|------|----------|------|
| GitHub MCP | `claude mcp add github` | 代码仓库访问与操作 |
| Commit Skill | `/install-skill commit` | 标准化提交流程 |
| Chrome DevTools MCP | `claude mcp add chrome-devtools` | 浏览器调试与自动化 |

:::info 为什么需要这些工具？
GitHub MCP 让 Claude 直接访问仓库、PR 和 Issue；Commit Skill 确保提交信息规范一致；Chrome DevTools MCP 则实现 UI 变更的自动化验证，构成完整的开发闭环。
:::

---

### 第 1 步：探索（Explore）

深入理解项目架构是高质量输出的基础。

```bash
# 使用 @src/ 引用分析项目结构
@src/ 分析这个项目的整体架构，重点关注：
1. 目录结构和模块划分
2. 核心数据流和状态管理
3. 主要依赖和技术栈
4. 现有的代码规范和模式
```

**探索阶段的关键操作：**

- 使用 `@src/` 引用整个源码目录进行宏观分析
- 使用 `@src/components/Auth.tsx` 引用特定文件进行微观分析
- 询问 Claude 关于项目中已有的类似实现，避免重复造轮子
- 理解测试覆盖情况和现有的测试模式

:::tip 高效探索技巧
先让 Claude 生成项目架构概述，再根据概述针对性地深入某个模块。这样比直接描述需求更能让 Claude 理解项目上下文。
:::

---

### 第 2 步：规划（Plan）

在编码之前，先进入 Plan 模式明确需求和实现路径。

**进入 Plan 模式：**

```
按 Shift+Tab 两次 → 切换到 Plan 模式（提示符变为 📋）
```

在 Plan 模式下，Claude 只会输出计划，不会执行任何代码修改。

```
# Plan 模式示例提示词
基于刚才的探索，请制定实现用户认证功能的详细计划：
1. 需要修改哪些文件？
2. 每个步骤的具体内容是什么？
3. 可能遇到的风险点有哪些？
4. 如何验证实现是否正确？
```

**一个好的计划应该包含：**

- 需要创建/修改的文件列表
- 每个文件的变更摘要
- 实现步骤的先后顺序
- 验证方案

:::warning 不要跳过规划步骤
直接让 Claude 开始编码，往往会导致中途方向偏差，需要大量返工。5 分钟的规划可以节省 50 分钟的修复时间。
:::

---

### 第 3 步：编码（Code）

按照计划逐步实施，保持对过程的掌控。

```bash
# 实施计划
按照上面的计划，开始第 1 步：创建用户认证模块的基础结构
```

**编码阶段的关键原则：**

- **按步骤推进**：每次让 Claude 完成一个小步骤，而非一次性完成所有工作
- **遇到问题立即暂停**：如果某步骤出现意外，先分析原因再继续
- **运行测试验证**：每完成一个功能单元，立即运行相关测试

```bash
# 验证当前进度
!npm test -- --testPathPattern=auth
!git diff --stat  # 查看变更范围
```

:::danger 警惕范围蔓延
如果 Claude 开始修改计划之外的文件，立即叫停并询问原因。这可能意味着分析不够深入，或者 Claude 在"过度优化"。
:::

---

### 第 4 步：提交（Commit）

使用 Commit Skill 生成规范的提交信息。

```bash
# 调用 commit skill
/commit

# Commit Skill 会自动：
# 1. 分析变更内容（git diff）
# 2. 生成符合 Conventional Commits 规范的提交信息
# 3. 确认后执行 git commit
```

**提交信息规范示例：**

```
feat(auth): 实现 JWT 用户认证模块

- 添加 JWTService 处理令牌生成与验证
- 实现 AuthMiddleware 保护私有路由
- 添加 refreshToken 自动刷新机制
- 单元测试覆盖率达到 90%

Closes #123
```

---

## 测试驱动开发（TDD）工作流

TDD 工作流帮助你先定义期望行为，再实现功能，确保代码质量从一开始就有保障。

### 安装 Test-Writer Skill

```bash
/install-skill test-writer
```

### TDD 五步循环

```
┌─────────────────────────────────────────────────────────┐
│                    TDD 循环流程                          │
│                                                         │
│  1. 写测试 → 2. 运行(预期失败) → 3. 最小实现            │
│      ↑                                    ↓             │
│  5. 重复  ←────────── 4. 重构 ←───────────              │
└─────────────────────────────────────────────────────────┘
```

**第 1 步：先写测试**

```typescript
// 使用 test-writer skill 生成测试
/test-writer 为 UserService.createUser 方法编写完整的单元测试

// 生成的测试示例
describe('UserService.createUser', () => {
  it('should create user with valid data', async () => {
    const userData = { email: 'test@example.com', password: 'secure123' };
    const user = await userService.createUser(userData);

    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.password).not.toBe(userData.password); // 密码应被哈希
  });

  it('should throw error for duplicate email', async () => {
    await expect(userService.createUser({ email: 'existing@example.com' }))
      .rejects.toThrow('Email already exists');
  });
});
```

**第 2 步：运行测试（预期失败）**

```bash
!npm test -- --testPathPattern=UserService
# 预期输出: FAIL - createUser is not a function
```

:::info 红灯是好事
测试失败证明你的测试是有效的，它在验证一个尚未实现的功能。
:::

**第 3 步：实现最小可行代码**

```
现在实现 UserService.createUser 方法，让上面的测试通过，但不要过度实现。
```

**第 4 步：重构**

```
测试已通过。现在请重构 createUser 的实现，提升代码质量：
1. 提取密码哈希为独立方法
2. 添加输入验证
3. 优化错误处理
重构后确保测试仍然通过。
```

**第 5 步：重复循环**

针对下一个功能点，回到第 1 步。

---

## 代码审查工作流

通过多个专门的子代理并行进行代码审查，覆盖不同维度的质量检查。

### 创建子代理配置

在 `.claude/agents.json` 中配置审查代理：

```json
{
  "agents": [
    {
      "name": "code-reviewer",
      "description": "代码质量和最佳实践审查",
      "prompt": "你是一位专注于代码质量的高级工程师。审查代码时关注：代码可读性、DRY 原则、SOLID 原则、命名规范、注释质量、潜在的 Bug。用中文输出结构化的审查报告，包含问题列表和改进建议。",
      "model": "claude-opus-4-6",
      "tools": ["read_file", "search_files"]
    },
    {
      "name": "security-reviewer",
      "description": "安全漏洞审查",
      "prompt": "你是一位专注于安全的工程师。审查代码时关注：SQL 注入、XSS、CSRF、身份验证绕过、敏感信息泄露、不安全的依赖、权限控制问题。输出 OWASP 风险等级（Critical/High/Medium/Low）和修复建议。",
      "model": "claude-opus-4-6",
      "tools": ["read_file", "search_files", "bash"]
    },
    {
      "name": "performance-reviewer",
      "description": "性能问题审查",
      "prompt": "你是一位专注于性能优化的工程师。审查代码时关注：N+1 查询、不必要的重渲染、内存泄漏、大量同步操作、缓存机会、算法复杂度。输出性能影响评估和具体优化方案。",
      "model": "claude-sonnet-4-5-20250929",
      "tools": ["read_file", "search_files", "bash"]
    }
  ]
}
```

### 四步审查流程

**第 1 步：并行审查**

```bash
# 同时启动三个审查代理
claude --agent code-reviewer "@src/auth/ 审查这个模块的代码质量" &
claude --agent security-reviewer "@src/auth/ 审查这个模块的安全问题" &
claude --agent performance-reviewer "@src/auth/ 审查这个模块的性能问题" &
wait
```

**第 2 步：综合报告**

```
汇总刚才三个代理的审查结果，生成一份综合审查报告：
1. 按严重程度排序所有问题
2. 标注问题类型（质量/安全/性能）
3. 估算修复时间
4. 给出修复优先级建议
```

**第 3 步：逐个修复**

```bash
# 按优先级逐个修复
修复第 1 个问题：[粘贴具体问题描述]
修复后运行测试验证：!npm test
```

**第 4 步：重新审查**

```
所有问题已修复，请重新审查 @src/auth/ 确认问题已解决，并检查修复过程中是否引入新问题。
```

---

## 验证闭环（Feedback Loop）

建立自动化验证机制，确保每次变更都经过充分验证。

### 简单任务：Bash 命令验证

```bash
# 单元测试
!npm test

# 类型检查
!npx tsc --noEmit

# 代码风格检查
!npx eslint src/ --ext .ts,.tsx

# 构建验证
!npm run build
```

### 复杂 UI：浏览器自动化验证

结合 Chrome DevTools MCP，实现 UI 变更的自动化验证：

```
# 使用 Chrome DevTools MCP 验证 UI
使用 Chrome DevTools 打开 http://localhost:3000，
验证用户登录流程：
1. 填写邮箱和密码
2. 点击登录按钮
3. 确认跳转到 Dashboard
4. 截图保存验证结果
```

### 端到端验证流程

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   实现功能    │ →  │  运行单元测试 │ →  │  运行集成测试 │
└──────────────┘    └──────────────┘    └──────────────┘
                                               ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   提交代码    │ ←  │  代码审查通过 │ ←  │  E2E测试通过  │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 验证方式效果对比

| 验证方式 | 代码质量 | 所需时间 | 返工率 | 适用场景 |
|----------|----------|----------|--------|----------|
| 无验证 | 低 | 短（假象） | 60-80% | 不推荐 |
| 人工验证 | 中 | 长 | 30-50% | 简单修改 |
| Claude 自动验证 | 高 | 中 | 5-15% | 大多数任务 |
| Claude + 自动化测试 | 极高 | 中 | 1-5% | 核心功能 |

:::tip 验证闭环的价值
带验证闭环的工作流，虽然单次任务时间略长，但由于大幅减少返工，整体效率提升 3-5 倍。
:::

---

## 项目组织

良好的项目结构让 Claude 更好地理解项目上下文，提升输出质量。

### 推荐目录结构

```
project/
├── .claude/
│   ├── settings.json      # Claude 权限和行为配置
│   ├── agents.json        # 子代理配置
│   ├── mcp.json           # MCP 服务器配置
│   └── rules/             # 自定义规则文件
│       ├── coding-style.md
│       ├── git-conventions.md
│       └── testing-requirements.md
├── src/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── types/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
├── CLAUDE.md              # 项目级 Claude 指令（最重要）
└── README.md
```

### CLAUDE.md 最佳实践

`CLAUDE.md` 是项目中最重要的配置文件，它在每次对话时自动加载：

```markdown
# 项目名称

## 项目概述
这是一个 [简短描述]，使用 [技术栈]。

## 开发规范
- 使用 TypeScript 严格模式
- 所有公共函数必须有 JSDoc 注释
- 测试覆盖率不低于 80%

## 目录约定
- `src/services/` - 业务逻辑层
- `src/api/` - API 路由处理器
- `src/utils/` - 纯函数工具

## 常用命令
- `npm test` - 运行所有测试
- `npm run build` - 构建生产版本
- `npm run lint` - 代码风格检查

## 注意事项
- 不要修改 `src/generated/` 目录下的文件（自动生成）
- 数据库迁移必须经过人工审查
```

:::warning CLAUDE.md 的重要性
如果没有 CLAUDE.md，Claude 每次都需要重新理解项目，会浪费大量 Token 并降低输出质量。建议将 CLAUDE.md 纳入版本控制，作为项目文档的一部分。
:::

---

## 工作流选择指南

| 任务类型 | 推荐工作流 | 估计效率提升 |
|----------|------------|--------------|
| 新功能开发 | 探索-规划-编码-提交 | 3x |
| Bug 修复 | 探索-编码-验证-提交 | 2x |
| 核心模块开发 | TDD 工作流 | 4x（长期） |
| 代码质量改善 | 代码审查工作流 | 2-3x |
| 重构 | TDD + 代码审查 | 5x（长期） |
