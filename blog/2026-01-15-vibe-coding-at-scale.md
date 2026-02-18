---
slug: vibe-coding-at-scale
title: 大规模 Vibe Coding 实战：10 个 Claude Code 并行开发
date: 2026-01-15
authors: [claude-team]
tags: [claude-code, tutorial, parallel, productivity]
description: Meshy AI 创始人胡渊鸣如何用 10 个 Claude Code 实例并行开发，并将成功率从 20% 提升至 95%
---

# 大规模 Vibe Coding 实战：10 个 Claude Code 并行开发

> 本文整理自 Meshy AI 创始人胡渊鸣（Ethan Hu）的公开分享，记录了他从单机 Cursor Agent 到 10 个 Claude Code 实例并行运行的完整进化路径。这是目前最系统、最具工程深度的 Agentic Coding 实践案例之一。

<!-- truncate -->

---

## 背景

### 关于胡渊鸣

胡渊鸣（Ethan Hu）的经历堪称技术创业者的理想模板：

- 清华大学**姚班**（计算机科学实验班）毕业
- **MIT** 计算机图形学博士
- **太极图形语言**（Taichi）创造者——一门面向图形与并行计算的高性能编程语言
- **Meshy AI** 创始人兼 CEO——全球排名第一的 3D AI 生成平台，ARR 已达 **3000 万美元**

凭借深厚的技术背景，胡渊鸣对 AI 编程工具有着比普通开发者更敏锐的判断力。他选择用自己的亲身实践，系统性地探索 Claude Code 的吞吐量极限。

### 目标：给 CEO 造一套量身定制的软件

作为公司 CEO，胡渊鸣的日常工作高度碎片化。他决定用 Vibe Coding 为自己开发一套"CEO 支持软件"，核心需求包括：

| 需求 | 描述 |
|------|------|
| 随时随地语音输入 | 走路、开会间隙均可 |
| 双端支持 | iPhone + Mac 无缝切换 |
| AI 辅助编辑 | 润色文档、补全内容 |
| 中英双语 | 内外部沟通均需覆盖 |
| 格式强迫症 | 精确控制排版与样式 |
| 文档校对 | 自动发现逻辑错误与歧义 |
| 思维导图 | 可视化思路整理 |

这套软件没有现成产品可以替代——它需要完全匹配个人工作流。**定制化软件的开发成本，正在被 AI 编程工具趋近于零。**

---

## 提高 Agentic Coding 吞吐量的 10 个阶段

### Step 1：从 Cursor Agent 到 Claude Code

故事从一台 RTX 4090 的 Ubuntu 工作站开始。

胡渊鸣原本使用 **Cursor Agent**，并取得了令人印象深刻的成果——在工作站上用 3 小时完成了一个 GPU DSL（领域专用语言）的重新设计，而传统方式需要整整 3 周。

但问题随之而来：工作站只能在公司使用，灵感却随时随地都会出现。他需要远程操控（RustDesk），操作体验极差。

切换到 **Claude Code** 后，通过 SSH 在 iPhone 上直接访问服务器，可以 vibe coding 的时间窗口从每天 **8 小时**扩展到 **24 小时**。

:::tip 关键洞察
工具的可及性决定了创造力的边界。能随时随地写代码，等于把每一个灵感闪现的瞬间都变成了生产力。
:::

---

### Step 2：找个 Container

在本地工作站上操作仍然有局限。胡渊鸣将工作环境迁移到 **AWS EC2**，并启用了 Claude Code 的跳权模式：

```bash
claude --dangerously-skip-permissions
```

这个改变带来了质的飞跃：Claude Code 在单个 prompt 下可以持续工作 **5 分钟甚至更长**，无需频繁的人工确认，大幅提高了利用率。

:::warning 温馨提示
在任何自动化场景下开启 `--dangerously-skip-permissions` 前，请务必先写好自动备份数据库的功能。AI 犯错不可避免，数据丢失才是真正的灾难。
:::

**云端容器的优势：**
- 资源弹性伸缩，可同时跑多个实例
- 网络稳定，无需担心本地断线
- 计费按需，成本可控
- 天然隔离，降低权限风险

---

### Step 3：Ralph Loop，让 Claude Code 不停干活

有了容器之后，下一个瓶颈出现了：每次任务完成后，Claude Code 就停下来等待新指令。

胡渊鸣引入了 **Ralph Loop**——一种让 Claude Code 持续自驱工作的模式：

```
1. 从任务列表中取出下一个任务
2. 执行任务
3. 将结果记录到任务列表
4. 回到步骤 1，直到列表为空
```

更妙的是，**他用 Claude Code 开发了 Claude Code 的启动器**——让 AI 管理 AI 的工作流。`CLAUDE.md` 文件定义了"干活"的具体内容和规则，Claude Code 启动后自动读取并开始循环执行。

这是一个典型的 **meta-programming** 思路：用 AI 编程工具来优化 AI 编程工具自身的使用效率。

---

### Step 4：用 Git Worktree 实现并行化

Ralph Loop 解决了单个实例的连续性问题，但还不够。胡渊鸣开始思考：**能否同时跑多个 Claude Code？**

答案是 **Git Worktree**。

```bash
# 为每个并行任务创建独立的工作树
git worktree add ../feature-auth feature/auth
git worktree add ../feature-ui feature/ui
git worktree add ../feature-api feature/api

# 在每个工作树中启动独立的 Claude Code 实例
cd ../feature-auth && claude --dangerously-skip-permissions &
cd ../feature-ui   && claude --dangerously-skip-permissions &
cd ../feature-api  && claude --dangerously-skip-permissions &
```

Git Worktree 的核心优势是：多个工作区共享同一个 Git 仓库历史，但拥有各自独立的工作目录和分支，互不干扰。

**实际效果：5 个 Claude Code 实例并行运行，达到了每分钟 1 个 commit 的速度。**

GitHub 成为整个并行开发的调度中心：任务分支、进度追踪、代码合并全部通过 Git 管理。

---

### Step 5：用好 CLAUDE.md 和 PROGRESS.md

随着并行实例增多，如何保持 AI 行为一致性成为新挑战。胡渊鸣总结了两类关键文件的最佳实践：

**CLAUDE.md（项目规范）：**
- 定义编码规范、架构约定、禁止行为
- 不宜频繁修改——频繁变动会让 Claude Code 产生混乱的行为
- 写清楚"什么情况下不该做什么"，比"应该做什么"更重要

**PROGRESS.md（经验积累）：**
- 记录每次踩坑的教训
- 关键原则：**"同样的错误下次不要再犯"**
- 在 CLAUDE.md 中引用 PROGRESS.md，让 AI 在每次启动时复习历史教训

```markdown
<!-- CLAUDE.md 中的典型写法 -->
## 重要约束
- 修改数据库 schema 前必须先备份，参见 PROGRESS.md#数据库事故-2024-03
- 不要直接修改 config/production.json，所有生产配置通过环境变量注入
```

:::info 关于 AI 的"记忆"
Claude Code 本身没有跨会话记忆。CLAUDE.md 和 PROGRESS.md 是当前最实用的"外部记忆"机制，将组织知识持久化到文件中，让每个新会话都能继承历史经验。
:::

---

### Step 6：干掉 SSH，开发界面变手机网页

SSH 下的 Claude Code 有一个令人抓狂的问题：**在 iPhone Safari 中刷新 terminal 时，延迟巨大、体验极差。**

胡渊鸣的解决方案：**自己写一个 Claude Code Web Manager**。

核心架构：

```
iPhone Safari
    ↓ HTTP 请求
Web Manager（Python Flask）
    ↓ subprocess
Claude Code（-p 非交互模式）
    ↓ JSON 输出
Web Manager 解析展示
```

关键命令：

```bash
# 非交互模式，适合被程序调度
claude -p "执行任务描述" \
  --dangerously-skip-permissions \
  --output-format stream-json \
  --verbose
```

最终，这个 Web Manager 被包装成 iPhone 的 PWA（Progressive Web App），添加到桌面后与原生 App 无异。**走在马路上打开手机，就能查看和调度所有 Claude Code 实例的状态。**

---

### Step 7：有效编写管理 Claude Code 的程序

Web Manager 只是开始。随着管理复杂度上升，胡渊鸣开始系统性地优化管理程序的设计。

**关键洞察：Claude Code 的成功率取决于闭环是否完整。**

一个完整的闭环包括：

```
写代码 → 运行代码 → 检查输出 → 发现问题 → 调试修复 → 重新运行
```

如果任何一个环节断开，Claude Code 就会陷入"以为成功"的假象。

**实现方式：**

```bash
# 使用 stream-json 格式捕获完整执行过程
claude -p "完成任务 X，运行测试，确认全部通过后才算完成" \
  --dangerously-skip-permissions \
  --output-format stream-json \
  --verbose 2>&1 | python manager.py parse-and-monitor
```

Manager 程序通过解析 JSON 日志：
- 检测测试是否真正运行并通过
- 发现运行时错误并自动重试
- 超时保护，防止无限循环
- 统计成功率，持续优化提示词

**效果：任务成功率从 20% 提升到 95%。**

这个数字揭示了一个重要事实：**Agentic Coding 的成功率很大程度上取决于管理层的设计，而不仅仅是 AI 本身的能力。**

---

### Step 8：自然语言编程

有了 Web Manager，下一步是让输入更自然。

胡渊鸣在输入框中集成了**语音识别 API**，实现了真正的"语音 vibe coding"：

- 打开手机，对着麦克风说需求
- 语音转文字，自动发送给 Claude Code
- Claude Code 开始执行，结果实时推送到手机

**走在马路上都可以 vibe coding。** 这不是比喻，是字面意义上的随时随地编程。

---

### Step 9：添加 Plan Mode

在大量并行任务场景中，"先执行后发现方向错了"的成本极高。胡渊鸣封装了 Claude Code 的 **Plan 模式**：

```
用户提交需求
    ↓
Claude Code 生成执行计划（不执行）
    ↓
统一展示所有待处理实例的计划
    ↓
用户批量 review，修改或确认
    ↓
批量 kick off 执行
```

这个模式的价值在于：**用极低的成本（看一眼计划）过滤掉方向性错误，避免浪费几十分钟的执行时间。**

当同时有 10 个 Claude Code 在工作时，每个实例节省一次错误方向的执行，累计节省的时间相当可观。

---

### Step 10：坚持不看代码

这是最反直觉，也最重要的一步。

胡渊鸣制定了一条铁律：**坚决不看 Claude Code 生成的具体代码。**

这不是懒惰，而是一种刻意的管理哲学：

> "Context, not control."（提供上下文，而不是微观管理。）

**他真正关注的事情：**

| 关注点 | 具体行动 |
|--------|----------|
| 更好地提问 | 把需求描述得更精确、约束条件更清晰 |
| 第一性原理 | 质疑任务本身是否必要，而不是优化执行方式 |
| 给 AI 铺路 | 提前准备好 API 文档、架构说明、测试数据 |
| 科学版本控制 | 用 Git 记录一切，随时可以回滚 |
| 提高杠杆 | 思考如何让一个 Claude Code 的工作抵得上十个 |

**杜绝 micromanagement 的本质是：相信系统，而不是相信单次执行的细节。**

---

## 关键启示

### 启示一：标准化软件的终结

当一个 CEO 可以在手机上用语音随时指挥 10 个 AI 实例并行开发软件，**软件开发的成本正在趋近于零**。

这意味着：
- 任何人都可以拥有完全匹配自己工作流的定制化工具
- 标准化 SaaS 软件的竞争优势将持续减弱
- 未来的软件可能不再是"产品"，而是"实时生成的工具"

### 启示二：管理 AI 比管人更能提高领导力

在传统管理中，给一个下属安排任务后，你需要等待数天才能得到反馈。而管理 Claude Code：

- **反馈周期：5 分钟**
- **并发数量：理论上无限**
- **成长速度：每天迭代数十次，是人类的 100 倍**

这意味着 AI 时代的领导力核心技能发生了根本性转变：**从"如何做"转向"做什么"，从执行优化转向方向判断**。

### 启示三：重新审视"学习"的意义

如果 AI 可以完成大量的执行性工作，人类的学习目标也需要重新定义：

不是学习如何编写更好的代码，而是学习**如何提出更好的问题**。不是积累技术细节，而是建立**跨领域的第一性原理思维**。

---

## 核心技术栈总结

| 技术/工具 | 用途 | 对应阶段 |
|-----------|------|---------|
| `claude --dangerously-skip-permissions` | 无人值守自动执行 | Step 2 |
| AWS EC2 | 云端弹性计算容器 | Step 2 |
| Ralph Loop | 持续任务调度机制 | Step 3 |
| CLAUDE.md | 项目规范与约束定义 | Step 3、5 |
| PROGRESS.md | 经验教训持久化 | Step 5 |
| Git Worktree | 多实例并行隔离 | Step 4 |
| `claude -p --output-format stream-json` | 程序化调用与监控 | Step 6、7 |
| Python subprocess | Claude Code 进程管理 | Step 6 |
| Web Manager + PWA | 手机端管理界面 | Step 6 |
| 语音识别 API | 自然语言输入 | Step 8 |
| Plan Mode 封装 | 批量任务预审 | Step 9 |

---

## 可复用的行动清单

如果你想复刻胡渊鸣的部分实践，可以按以下顺序逐步推进：

- [ ] **起点**：在本地用 `claude --dangerously-skip-permissions` 跑一个完整任务，感受无打断的体验
- [ ] **容器化**：将工作环境迁移到云端 EC2，确保 24 小时可访问
- [ ] **任务列表**：建立 PROGRESS.md，记录第一个踩坑经验
- [ ] **并行化**：用 Git Worktree 同时开两个 Claude Code 处理不同功能分支
- [ ] **监控闭环**：用 `stream-json` 输出接入简单的监控脚本，检测任务真实成功率
- [ ] **Plan 先行**：对所有超过 30 分钟的任务，强制先用 Plan 模式审查方向
- [ ] **不看代码**：连续一周只看测试结果和功能演示，训练自己放弃 micromanagement
