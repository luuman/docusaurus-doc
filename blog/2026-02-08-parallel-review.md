---
slug: parallel-review
title: 案例 3：代码质量并行审查
date: 2026-02-08
authors: [claude-team]
tags: [claude-code, tutorial, parallel, automation]
description: 用 3 个并行子代理同时从代码质量、安全、性能三个维度审查 PR，覆盖率大幅提升
---

# 案例 3：代码质量并行审查

**场景：** 团队 PR 审查流程慢，单人审查容易遗漏安全漏洞和性能问题。希望用 Claude Code 的子代理机制，让三个专业 Agent 并行从不同维度审查代码，输出综合报告。

<!-- truncate -->

---

## 配置三个专业审查代理

在项目根目录创建 `.claude/agents.json`：

```json
{
  "agents": [
    {
      "name": "quality-reviewer",
      "displayName": "代码质量审查",
      "description": "审查代码可读性、设计模式、DRY 原则、命名规范",
      "model": "claude-sonnet-4-6",
      "systemPrompt": "你是一位专注于代码质量的高级工程师。审查时重点关注：\n\n1. **可读性**：命名是否清晰？逻辑是否易懂？注释是否必要？\n2. **DRY 原则**：是否有重复代码？是否可以提取公共函数？\n3. **单一职责**：函数/类是否只做一件事？是否过于庞大？\n4. **设计模式**：是否有更好的设计方式？\n5. **错误处理**：边界情况是否处理完整？\n\n输出格式：\n## 代码质量报告\n### 问题列表（按严重程度）\n[Critical/Major/Minor] 文件名:行号 - 问题描述 - 建议修改方式\n\n### 总体评价\n[1-10分] 和总结",
      "tools": ["Read", "Glob", "Grep"],
      "temperature": 0.3
    },
    {
      "name": "security-reviewer",
      "displayName": "安全漏洞审查",
      "description": "扫描 SQL 注入、XSS、CSRF、权限绕过、敏感信息泄露等安全问题",
      "model": "claude-sonnet-4-6",
      "systemPrompt": "你是一位专注于安全的高级工程师，熟悉 OWASP Top 10。审查时重点检查：\n\n1. **注入攻击**：SQL 注入、命令注入、LDAP 注入\n2. **XSS**：反射型、存储型、DOM 型\n3. **认证与授权**：权限检查是否完整？Token 是否安全？\n4. **敏感信息**：是否有硬编码的密码/API Key？日志是否泄露敏感信息？\n5. **依赖安全**：新增依赖是否有已知漏洞？\n6. **加密**：是否使用了不安全的加密算法？\n\n输出格式：\n## 安全审查报告\n### 漏洞列表\n[Critical/High/Medium/Low] OWASP-类别 - 文件名:行号 - 漏洞描述 - 修复建议\n\n### 总体安全评估",
      "tools": ["Read", "Glob", "Grep", "Bash"],
      "temperature": 0.1
    },
    {
      "name": "performance-reviewer",
      "displayName": "性能问题审查",
      "description": "分析 N+1 查询、不必要重渲染、内存泄露、算法复杂度等性能问题",
      "model": "claude-sonnet-4-6",
      "systemPrompt": "你是一位专注于性能优化的高级工程师。审查时重点关注：\n\n1. **数据库查询**：是否有 N+1 查询？索引是否合理？是否有不必要的全表扫描？\n2. **前端性能**：不必要的重渲染？大列表是否虚拟化？图片是否优化？\n3. **内存管理**：是否有内存泄露风险？大对象是否及时释放？\n4. **算法复杂度**：是否有 O(n²) 或以上复杂度的操作可以优化？\n5. **网络请求**：是否有重复请求？是否可以批量或缓存？\n6. **同步阻塞**：是否有不必要的同步操作阻塞主线程？\n\n输出格式：\n## 性能审查报告\n### 问题列表\n[High/Medium/Low Impact] 文件名:行号 - 问题描述 - 优化方案 - 预期收益\n\n### 总体性能评估",
      "tools": ["Read", "Glob", "Grep", "Bash"],
      "temperature": 0.2
    }
  ]
}
```

---

## 执行并行审查

### 方式一：在 Claude Code 交互界面中指令触发

```
请用三个子代理并行审查 src/auth/ 目录下最近修改的代码：

1. quality-reviewer：审查代码质量和设计
2. security-reviewer：扫描安全漏洞
3. performance-reviewer：分析性能问题

审查目标：
- 涉及文件：src/auth/AuthService.ts, src/auth/middleware.ts, src/auth/routes.ts
- 背景：这是一次认证模块重构，新增了 JWT 刷新机制和权限分组

三个代理完成后，将结果汇总为一份综合审查报告，按严重程度排序所有问题。
```

---

## 输出示例

综合报告示例结构：

```markdown
# 代码审查综合报告

审查时间：2025-02-18 14:30:22
审查目录：src/auth/

---

## 代码质量报告

### 问题列表
[Major] AuthService.ts:45 - `refreshToken` 方法超过 80 行，建议拆分
[Minor] middleware.ts:12 - 变量名 `t` 语义不清，建议改为 `token`

### 总体评价
7/10 - 整体结构清晰，但部分函数职责过重

---

## 安全审查报告

### 漏洞列表
[High] A2-失效认证 - AuthService.ts:89 - JWT 验证时未检查 `iss` 字段，可能被跨系统伪造
[Medium] A3-敏感数据泄露 - routes.ts:34 - 错误日志中输出了完整的 token 字符串

### 总体安全评估
中等风险，存在一个需要立即修复的认证漏洞

---

## 必须修复（Critical/High）

- [安全-High] AuthService.ts:89 - JWT 验证缺少 iss 字段检查

## 建议修复（Medium）

- [安全-Medium] routes.ts:34 - 日志中暴露完整 token
- [质量-Major] AuthService.ts:45 - refreshToken 函数过长需拆分
```

---

## 效率对比

| 指标 | 单人人工审查 | Claude Code 并行审查 |
|------|-------------|---------------------|
| 审查时间 | 4-8 小时 | 5-15 分钟 |
| 覆盖维度 | 取决于个人经验 | 质量+安全+性能全覆盖 |
| 遗漏率 | 20-40%（疲劳等因素） | &lt;5% |
| 可重复性 | 不同人结果不同 | 规则一致，结果可复现 |

---

## 关键技巧

| 技巧 | 说明 |
|------|------|
| 专业化分工 | 每个 Agent 只专注一个维度，避免泛泛而谈 |
| 低温度配置 | 审查类任务 temperature 0.1-0.3，保证一致性 |
| 明确输出格式 | 在 systemPrompt 中规定报告格式，方便自动解析 |
| 背景上下文 | 告诉 Agent 这次 PR 的目的，提高审查针对性 |

:::tip 适合集成到 CI/CD
将此脚本添加到 GitHub Actions，每次 PR 自动触发三路并行审查，将报告作为 PR 评论发布。参考 [Headless 模式](/claude-doc/docs/claude-code/advanced-features/headless-mode) 中的 GitHub Actions 示例。
:::
