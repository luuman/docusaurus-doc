---
title: Claude Code 完全指南
sidebar_position: 1
description: Anthropic 开发的系统级 AI Agent，集成全功能访问、超大上下文、多代理协作等核心能力的完整使用指南。
---

# Claude Code 完全指南

Claude Code 是由 Anthropic 开发的**系统级 AI Agent**，它不只是一个代码补全工具，而是一个能够深度介入你开发流程的智能协作者。

**核心价值：** 将重复性开发工作自动化，让你专注于高价值的架构和创意工作，显著提升团队开发效率。

---

## ⚡ 3 分钟了解核心价值

### 你能做什么

- 🤖 **全自动任务执行** — 直接读写文件、执行命令、调用工具，像一个真正的开发者一样工作
- 🧠 **超大上下文理解** — 200K token 容量，能理解整个项目的上下文，不会丢失信息
- 🔗 **无缝工具集成** — 接入数据库、API、Git、CI/CD，扩展无限
- 👥 **多代理协作** — 并行派发任务给多个子代理，处理大型复杂工程
- 📝 **纯自然语言驱动** — 直接描述需求，系统自动规划步骤并执行

### 典型效益对比

| 场景 | 传统方式 | 使用 Claude Code | 效率提升 |
|------|---------|-----------------|--------|
| 生成 50 个测试用例 | 2-3 小时手写 | 10 分钟 | **10-15x** |
| 大型代码库重构 | 数天多人并行 | 数小时 | **5-10x** |
| API 文档自动化 | 1-2 天手写维护 | 实时自动生成 | **自动化** |
| 代码审查（大 PR） | 1-2 小时手动审 | 15 分钟并行审 | **4-8x** |

---

## 🎯 选择你的学习路线

根据你的角色和目标，选择合适的学习路线，快速获得实际价值。

### 👶 我是新手 — 5 分钟快速体验

如果你想快速了解 Claude Code 能做什么：

1. **[快速开始](./getting-started.md)** — 5 分钟安装配置
2. **[第一个命令](./getting-started.md#启动方式)** — 试试交互模式
3. **[真实场景案例](./use-cases/frontend-acceleration.md)** — 看具体例子
4. 然后选择相关的核心概念深入学习

**时间投入：** 约 30 分钟理解基础

---

### 💻 我是开发者 — 2 小时掌握核心能力

如果你想将 Claude Code 集成到日常工作流中：

**第一步：快速启动（20 分钟）**
- [快速开始](./getting-started.md) — 安装、配置、启动

**第二步：核心概念（80 分钟）**
- [Skills 斜杠命令](./core-concepts/skills.md) — 自动化常用任务
- [Hooks 生命周期](./core-concepts/hooks.md) — 自定义工作流
- [MCP Servers](./core-concepts/mcp-servers.md) — 接入外部工具

**第三步：实战应用（20 分钟）**
- 选择你的工作场景（前端？后端？DevOps？）
- 查看对应的[真实场景案例](./use-cases/)
- 开始实践

**时间投入：** 约 2 小时

---

### 🏗️ 我是架构师 — 团队级别的深度定制

如果你想为团队构建统一的开发工作流：

**第一步：理解架构（30 分钟）**
- [Core Concepts](./core-concepts/) — 5 个扩展机制详解
- [Subagents 多代理协作](./core-concepts/subagents.md) — 大型任务并行处理

**第二步：团队最佳实践（60 分钟）**
- [CLAUDE.md 项目配置](./core-concepts/claude-md.md) — 团队知识共享
- [最佳实践 - 工作流](./best-practices/workflow.md)
- [最佳实践 - 安全与权限](./best-practices/security.md)

**第三步：构建定制方案（90 分钟）**
- [Skills 编写指南](./advanced-features/slash-commands.md) — 自定义命令
- [Plugins 开发](./core-concepts/plugins.md) — 团队插件库
- [MCP Servers](./core-concepts/mcp-servers.md) — 企业工具集成

**时间投入：** 约 3 小时

---

## 📚 按场景快速查找

找不到你需要的？按工作场景快速定位：

- **🎨 前端开发** — [加速 React/Vue 项目](./use-cases/) | [UI 组件自动化](./use-cases/)
- **⚙️ 后端服务** — [API 开发自动化](./use-cases/) | [数据库迁移](./use-cases/)
- **🔧 DevOps/运维** — [CI/CD 集成](./use-cases/) | [基础设施即代码](./use-cases/)
- **📖 文档/内容** — [自动化文档生成](./use-cases/) | [内容批量处理](./use-cases/)
- **👥 团队协作** — [代码审查自动化](./use-cases/) | [知识共享](./best-practices/workflow.md)

---

## 🔧 核心特性一览

### 全功能系统访问

Claude Code 拥有对本地系统的完整访问权限，可以直接操作文件系统、执行 Shell 命令、调用 CLI 工具，无需中间层转发。

### 200K Token 超大上下文

单次会话支持高达 200,000 token 的上下文窗口，足以容纳整个中型项目的核心代码、完整的架构文档与需求规格、跨文件的复杂依赖关系分析。

### 高度可扩展性

通过 5 种扩展机制适配任意技术栈和工作流：

| 机制 | 作用 | 用途 |
|------|------|------|
| **Skills** | 自定义斜杠命令 | 封装常用工作流，提供快捷操作 |
| **Hooks** | 生命周期钩子 | 在代理执行前后注入自定义逻辑 |
| **Plugins** | 可复用模块 | 团队共享功能库 |
| **MCP Servers** | 外部资源集成 | 接入数据库、API、文档库等 |
| **Subagents** | 多代理架构 | 并行任务分发，处理大型工程 |

### 多代理协作

支持 Orchestrator-Subagent 架构，将复杂任务并行派发给多个子代理执行，最后汇总结果。特别适合大型代码库分析、多模块重构、跨服务测试生成。

---

## ✅ 能力清单

### 擅长的任务

- [x] 读取、编写、重构任意格式的文件
- [x] 执行 Shell 命令并分析输出结果
- [x] 跨多个文件追踪复杂依赖关系
- [x] 理解并生成中文注释与文档
- [x] 自动化重复性开发任务（生成测试、格式化、迁移脚本）
- [x] 结合 MCP 访问数据库、API、浏览器等外部资源
- [x] 通过 Subagents 并行处理大型任务
- [x] 在会话中持续追踪上下文，无需反复说明背景

### 需要注意的边界

- [ ] 不会主动推送到远程仓库（除非你明确要求）
- [ ] 危险操作（删除文件、覆盖数据）会默认请求确认
- [ ] 网络访问能力取决于 MCP Server 的配置
- [ ] 对话上下文不跨会话持久化（依赖 CLAUDE.md 传递项目知识）

---

## 📖 完整文档结构

### 入门篇

- **[快速开始](./getting-started.md)** — 安装、配置、启动（5 分钟）

### 核心概念篇

- **[Skills](./core-concepts/skills.md)** — 自定义斜杠命令，自动化工作流
- **[Hooks](./core-concepts/hooks.md)** — 生命周期事件注入
- **[MCP Servers](./core-concepts/mcp-servers.md)** — 外部工具集成
- **[Plugins](./core-concepts/plugins.md)** — 可复用功能模块
- **[Subagents](./core-concepts/subagents.md)** — 多代理协作架构
- **[CLAUDE.md](./core-concepts/claude-md.md)** — 项目配置文件

### 进阶篇

- **[高级特性](./advanced-features/)** — IDE 集成、斜杠命令、Plan Mode 等
- **[最佳实践](./best-practices/)** — 工作流、安全、性能优化
- **[真实场景案例](./use-cases/)** — 前端、后端、DevOps 实战指南

### 快速参考

- **[快速参考](./quick-reference.md)** — 斜杠命令速查、常见问题、故障排除

---

## 🚀 立即开始

- 👶 **新手？** [5 分钟快速开始](./getting-started.md)
- 💻 **开发者？** [2 小时核心概念学习](./core-concepts/)
- 🏗️ **架构师？** [团队深度定制指南](./core-concepts/)
- 📋 **快速查找？** [按场景查询](#按场景快速查找)

---

:::info 模型选择
Claude Code 支持接入多种模型，包括 Anthropic 官方模型和国内主流大模型（GLM、Kimi、DeepSeek、通义千问）。国内用户无需科学上网即可完整使用所有功能，具体配置见 [快速开始 - 模型配置](./getting-started.md#模型配置) 章节。
:::
