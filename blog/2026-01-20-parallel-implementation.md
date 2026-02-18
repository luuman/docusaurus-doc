---
slug: parallel-implementation
title: 并行 Claude Code 实战落地指南
date: 2026-01-20
authors: [claude-team]
tags: [claude-code, tutorial, parallel]
description: 从单实例到多实例并行，一步步搭建高效的 Claude Code 开发工作流
---

# 并行 Claude Code 实战落地指南

> 基于胡渊鸣的实践经验，本文将其方法论拆解为可直接落地的 6 个阶段。每个阶段独立可用，按需逐步升级。

<!-- truncate -->

## 前置条件

- Claude Code 已安装 (`npm install -g @anthropic-ai/claude-code`)
- 项目已用 Git 管理
- 建议在独立的云服务器或容器中操作（如 EC2、本地 Docker）

---

## 阶段 1：无打断模式（效率 ×2）

最低门槛的改进。

```bash
claude --dangerously-skip-permissions
```

:::danger 重要前提
开启跳权限模式前，必须确保项目有 Git 版本控制。建议加一个定时备份：

```bash
# crontab -e 添加，每小时自动备份
0 * * * * cd /your/project && git add -A && git stash push -m "auto-backup-$(date +\%H\%M)"
```
:::

效果：单个 prompt 下 Claude Code 能连续工作 5+ 分钟，不会被权限弹窗中断。

---

## 阶段 2：CLAUDE.md + PROGRESS.md（质量 ×2）

在项目根目录创建两个文件，这是所有后续步骤的基础。

### CLAUDE.md — 项目规范（不频繁改动）

完整模板示例：

```markdown
# 项目名称

## 技术栈
- 前端: React + TypeScript
- 后端: Node.js + Express
- 数据库: PostgreSQL

## 项目结构
src/
├── components/    # UI 组件
├── services/      # 业务逻辑
├── utils/         # 工具函数
└── types/         # 类型定义

## 常用命令
npm run dev        # 启动开发服务器
npm test           # 运行测试
npm run build      # 构建生产版本

## 编码规范
- 文件名用 kebab-case
- 组件名用 PascalCase
- 提交信息遵循 Conventional Commits

## 禁止事项
- 不要删除 config/production.json
- 不要直接修改 database schema，先备份
- 不要在代码中硬编码密钥

## 工作模式
每次任务完成后，将踩坑经验总结到 PROGRESS.md 中。同样的错误不要再犯。
```

:::tip 写好 CLAUDE.md 的关键
"不要做什么" 比 "要做什么" 更重要。Claude Code 的自由度很高，明确边界比指导方向更有效。
:::

### PROGRESS.md — 经验教训（AI 的外部记忆）

```markdown
# 经验记录

## 2026-02-18
- 问题：修改登录模块时忘记更新路由配置，导致页面 404
- 教训：修改任何模块后必须检查相关路由是否同步更新
- 解决：在测试中加入路由完整性检查

## 2026-02-17
- 问题：数据库迁移脚本缺少回滚逻辑
- 教训：每个 migration 必须包含 up 和 down
```

在 CLAUDE.md 中加入引用：

```markdown
每次启动时阅读 PROGRESS.md，避免重复犯错。
```

### 自动生成 CLAUDE.md

如果不想手写，可以让 Claude Code 自动分析生成：

```bash
claude -p "分析当前项目结构、package.json、README，生成一份 CLAUDE.md，包含技术栈、项目结构、常用命令、编码规范、禁止事项" --dangerously-skip-permissions
```

---

## 阶段 3：Git Worktree 并行化（效率 ×5）

这是核心的并行化技术。

### Git Worktree 原理

```
主仓库 (.git)
    ├── main 工作区 (原始目录)
    ├── worktree-1 (feat/auth 分支) → Claude Code 实例 1
    ├── worktree-2 (feat/ui 分支)   → Claude Code 实例 2
    └── worktree-3 (feat/api 分支)  → Claude Code 实例 3

共享: Git 历史、远程配置、hooks
独立: 工作目录、分支、暂存区
```

### 操作步骤

```bash
# 1. 创建并行工作区
cd /your/project
git worktree add ../project-wt1 -b feat/task-1
git worktree add ../project-wt2 -b feat/task-2
git worktree add ../project-wt3 -b feat/task-3

# 2. 每个工作区启动独立的 Claude Code
# 方式一：多个终端标签页
cd ../project-wt1 && claude --dangerously-skip-permissions

# 方式二：tmux 多窗格
tmux new-session -d -s cc1 "cd ../project-wt1 && claude --dangerously-skip-permissions"
tmux new-session -d -s cc2 "cd ../project-wt2 && claude --dangerously-skip-permissions"
tmux new-session -d -s cc3 "cd ../project-wt3 && claude --dangerously-skip-permissions"

# 3. 任务完成后合并
cd /your/project
git merge feat/task-1
git merge feat/task-2
git merge feat/task-3

# 4. 清理工作区
git worktree remove ../project-wt1
git worktree remove ../project-wt2
git worktree remove ../project-wt3
```

:::warning 并行注意事项
- 任务之间必须尽量独立，避免同时修改同一文件导致合并冲突
- 每个 worktree 自动继承主仓库的 CLAUDE.md
- 建议并行数量 3~5 个，超过后管理成本上升
- 如需安装依赖，每个 worktree 都需要独立执行 `npm install`
:::

### 合并冲突处理

```bash
# 如果合并出现冲突
git merge feat/task-2
# CONFLICT detected

# 方式一：让 Claude Code 解决
claude -p "解决当前的 git merge 冲突，保留两边功能" --dangerously-skip-permissions

# 方式二：手动解决后继续
git add .
git merge --continue
```

### 实际效果

| 并行数 | 预期 commit 频率 | 适用场景 |
|--------|-----------------|---------|
| 1 个 | 每 5-10 分钟 1 个 | 单一功能开发 |
| 3 个 | 每 2-3 分钟 1 个 | 中型项目，多模块并行 |
| 5 个 | 每分钟 1 个 | 大型项目，高度并行 |

---

## 阶段 4：Ralph Loop — 连续任务执行（效率 ×8）

### 任务文件 TODO.md

```markdown
- [ ] 实现用户登录页面，包含表单验证
- [ ] 添加 API 鉴权中间件（JWT）
- [ ] 编写 auth 模块单元测试，覆盖率 >80%
- [ ] 实现用户资料编辑页面
- [ ] 添加文件上传功能
```

### CLAUDE.md 中的工作模式定义

```markdown
## Ralph Loop 工作模式
1. 读取 TODO.md，找到第一个未完成的任务（`- [ ]`）
2. 执行该任务
3. 运行测试确认通过
4. 将其标记为 `- [x]`，附上完成时间
5. 将经验记录到 PROGRESS.md
6. 如果还有未完成任务，继续下一个
7. 所有任务完成后，输出总结报告
```

### 自动循环脚本

```bash
#!/bin/bash
# run-loop.sh — Ralph Loop 自动调度器
PROJECT_DIR="/your/project"

while true; do
    # 检查是否还有未完成任务
    if ! grep -q '\- \[ \]' "$PROJECT_DIR/TODO.md"; then
        echo "✅ 所有任务已完成"
        break
    fi

    echo "🔄 启动新一轮 Claude Code..."
    claude -p "按照 CLAUDE.md 中的 Ralph Loop 工作模式执行下一个任务。完成后更新 TODO.md 和 PROGRESS.md。" \
        --dangerously-skip-permissions \
        --cwd "$PROJECT_DIR"

    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo "⚠️ Claude Code 异常退出（退出码: $EXIT_CODE），等待 10 秒后重试..."
        sleep 10
    else
        sleep 2
    fi
done
```

```bash
chmod +x run-loop.sh
./run-loop.sh
```

:::tip Ralph Loop + Worktree 组合
在每个 worktree 中放不同的 TODO.md，同时运行多个 Ralph Loop，就实现了"多线程持续开发"。
:::

---

## 阶段 5：程序化调度 `-p` + `stream-json`（效率 ×10+）

### 核心命令

```bash
# 基础用法：执行一个任务并退出
claude -p "实现用户注册功能" --dangerously-skip-permissions

# 进阶：JSON 流式输出，方便程序解析
claude -p "实现用户注册功能" \
    --dangerously-skip-permissions \
    --output-format stream-json \
    --verbose
```

这部分包含详细的 Python 调度器示例代码，可查看原文件获取完整实现。

---

## 阶段 6：Plan 模式批量预审（成功率 95%+）

### 先出计划后执行

```bash
# Step 1: 生成计划
claude -p "请为以下需求生成执行计划，列出步骤和涉及的文件，不要开始编码：
实现 OAuth2.0 第三方登录，支持 Google 和 GitHub" \
    --dangerously-skip-permissions > plan.md

# Step 2: 人工审阅 plan.md（关键！）
cat plan.md

# Step 3: 确认后执行
claude -p "按照 plan.md 中的计划执行" \
    --dangerously-skip-permissions
```

---

## 效率升级路径总结

| 阶段 | 关键技术 | 效率倍数 | 适用场景 |
|------|---------|---------|---------|
| 1 | `--dangerously-skip-permissions` | ×2 | 任何项目 |
| 2 | CLAUDE.md + PROGRESS.md | ×2（质量） | 任何项目 |
| 3 | Git Worktree | ×5 | 多模块并行 |
| 4 | Ralph Loop | ×8 | 任务明确的项目 |
| 5 | Python 调度 + stream-json | ×10+ | 批量自动化 |
| 6 | Plan 模式预审 | 成功率 95%+ | 复杂任务 |

---

## 应用到新项目的标准流程

1. `git init` 或 clone 已有项目
2. 创建 CLAUDE.md（手写或 `claude -p` 自动生成）
3. 创建 PROGRESS.md（空文件即可）
4. 编写 TODO.md 列出所有任务
5. 评估任务独立性，决定并行数量
6. 用 Git Worktree 创建工作区
7. 启动 Claude Code 实例
8. 监控执行，合并结果

:::info 核心原则
- 每一步都有 git 保底，随时可回滚
- CLAUDE.md 写清楚"不要做什么"
- 不看代码，看测试结果 — 在 CLAUDE.md 里要求每个任务结束必须跑测试
- 任务拆得越细，并行效果越好，每个任务控制在 15-30 分钟能完成的粒度
:::
