---
sidebar_position: 7
title: 速查手册
description: Claude Code 常用命令、快捷键、配置文件位置一页速查
---

# 速查手册

本页汇集 Claude Code 最常用的命令、快捷键与配置路径，建议收藏备用。

---

## 安装与启动

```bash
# 安装
npm install -g @anthropic-ai/claude-code

# 基本启动
claude

# 跳过权限确认（在受信任的容器/CI 环境中使用）
claude --dangerously-skip-permissions

# Headless 模式（非交互式，直接执行提示词）
claude -p "prompt"

# 恢复上次对话
claude --continue

# 选择历史会话恢复
claude --resume

# 指定工作目录启动
claude --dir /path/to/project

# 输出为 JSON 流（适合脚本集成）
claude -p "prompt" --output-format stream-json --verbose
```

---

## 常用斜杠命令速查表

| 命令 | 说明 | 使用频率 |
|------|------|:--------:|
| `/clear` | 清除当前对话上下文 | ★★★★★ |
| `/compact` | 压缩对话历史以节省 token | ★★★★☆ |
| `/context` | 查看当前上下文使用量 | ★★★★☆ |
| `/model` | 切换使用的 Claude 模型 | ★★★☆☆ |
| `/cost` | 查看本次会话的 token 消耗与费用 | ★★★☆☆ |
| `/export` | 导出当前对话为 Markdown 文件 | ★★★☆☆ |
| `/add-dir` | 将目录添加到工作上下文 | ★★★★☆ |
| `/status` | 查看 Claude Code 运行状态 | ★★★☆☆ |
| `/mcp` | 管理 MCP 服务器连接 | ★★★★☆ |
| `/skills` | 查看可用技能列表 | ★★★☆☆ |
| `/hooks` | 配置生命周期钩子 | ★★☆☆☆ |
| `/agents` | 管理子 Agent 配置 | ★★★☆☆ |
| `/vim` | 切换 Vim 键盘模式 | ★★☆☆☆ |
| `/theme` | 切换界面主题（亮色/暗色） | ★★☆☆☆ |
| `/doctor` | 诊断环境配置问题 | ★★★★☆ |
| `/init` | 在当前项目初始化 CLAUDE.md | ★★★★★ |
| `/plan` | 进入 Plan 模式（先规划后执行） | ★★★★☆ |
| `/permissions` | 查看与管理工具权限 | ★★★☆☆ |
| `/commands` | 查看所有可用命令 | ★★★☆☆ |
| `/plugin` | 管理插件扩展 | ★★☆☆☆ |

---

## 快捷键速查

| 操作 | 快捷键 |
|------|--------|
| 进入 Plan 模式 | `Shift+Tab` 连按两次 |
| 回退上一步操作 | `ESC` 连按两次 |
| 反向搜索历史命令 | `Ctrl+R` |
| 暂存当前提示词（草稿） | `Ctrl+S` |
| 触发补全建议 | `Tab`（编辑模式）/ `Enter`（执行） |
| 中断当前任务 | `Ctrl+C` |
| 退出 Claude Code | `Ctrl+D` 或输入 `/exit` |
| 多行输入 | `Shift+Enter` 换行 |

---

## 文件引用速查

```
@file.ts              # 引用单个文件
@directory/           # 引用整个目录
@file1.ts @file2.ts   # 同时引用多个文件
@mcp:server-name      # 引用 MCP 资源
@fuzzy-name           # 模糊匹配文件名
```

:::tip 引用技巧
引用文件时，Claude Code 会自动将文件内容注入上下文。目录引用会递归包含所有文件，建议搭配 `.gitignore` 过滤无关文件。
:::

---

## 即时命令（Shell 透传）

在对话框中以 `!` 开头直接执行 Shell 命令，结果会注入到上下文：

```
!ls -la              # 列出文件
!git status          # 查看 Git 状态
!npm test            # 运行测试
!cat package.json    # 读取文件内容
```

---

## 环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `ANTHROPIC_BASE_URL` | 自定义 API 基础地址（代理/私有部署） | `https://api.example.com` |
| `ANTHROPIC_AUTH_TOKEN` | API 认证令牌（覆盖默认密钥） | `sk-ant-...` |
| `ANTHROPIC_MODEL` | 指定默认使用的模型 | `claude-opus-4-5` |
| `CLAUDE_DEBUG` | 开启调试模式输出 | `true` |
| `CLAUDE_LOG_LEVEL` | 设置日志级别 | `debug` / `info` / `warn` |

```bash
# 使用示例：通过代理启动
export ANTHROPIC_BASE_URL=https://my-proxy.com
claude
```

---

## 配置文件位置

| 文件/目录 | 用途 | 作用域 |
|-----------|------|--------|
| `~/.claude/settings.json` | 全局用户配置（模型、主题、权限等） | 全局 |
| `~/.claude/agents.json` | 全局 Agent 定义 | 全局 |
| `~/.claude/mcp.json` | MCP 服务器全局配置 | 全局 |
| `.claude/commands/` | 项目自定义斜杠命令 | 项目 |
| `.claude/agents/` | 项目级 Agent 定义 | 项目 |
| `CLAUDE.md` | 项目上下文说明文件（自动加载） | 项目 |
| `.claude/settings.json` | 项目级配置（覆盖全局） | 项目 |

:::info CLAUDE.md 自动加载机制
Claude Code 启动时会自动读取以下位置的 `CLAUDE.md`：工作目录、所有父级目录、`~/.claude/CLAUDE.md`（全局）。越近的文件优先级越高。
:::

---

## 粘贴操作速查

| 操作 | 方式 |
|------|------|
| 在 Claude Code 中粘贴文本 | 鼠标右键 → 粘贴 |
| 普通命令行终端粘贴 | `Ctrl+V` |
| 在 Claude Code 中粘贴图片（Windows） | `Alt+V` |
| 在 Claude Code 中粘贴图片（macOS） | `Ctrl+V` |
| 拖拽文件到终端 | 路径自动填入输入框 |

:::warning 粘贴图片注意
粘贴图片功能需要终端支持图片协议（如 iTerm2、Kitty、Windows Terminal）。部分终端环境下此功能可能不可用。
:::

---

## 常用工作流一览

```bash
# 1. 初始化新项目
cd my-project && claude
/init                          # 生成 CLAUDE.md

# 2. 并行多任务开发（Git Worktree）
git worktree add ../feature-a feature-a
git worktree add ../feature-b feature-b
cd ../feature-a && claude --dangerously-skip-permissions &
cd ../feature-b && claude --dangerously-skip-permissions &

# 3. CI/CD 非交互模式
claude -p "审查这次 PR 的代码质量，输出 Markdown 报告" \
  --dangerously-skip-permissions \
  --output-format stream-json

# 4. 恢复昨天的工作
claude --resume                # 列出历史会话，选择继续
```

---

## 🎯 按任务快速查找

### 代码生成

| 需求 | 命令 | 预期时间 |
|------|------|--------|
| 生成组件 | `Create a React component that...` | **2-5 分钟** |
| 编写测试 | `Generate unit tests for this function...` | **10-15 分钟** |
| 生成文档 | `Generate API documentation for...` | **10-20 分钟** |
| 生成 API | `Create REST API endpoints for...` | **15-30 分钟** |

### 代码审查

| 需求 | 命令 | 预期时间 |
|------|------|--------|
| 性能优化 | `Review and optimize this code for performance...` | **15-30 分钟** |
| 安全审计 | `Check this code for security vulnerabilities...` | **15-30 分钟** |
| 代码质量 | `Review code quality and suggest improvements...` | **10-20 分钟** |
| 最佳实践 | `Suggest improvements following best practices...` | **10-15 分钟** |

### 自动化和集成

| 需求 | 命令 | 预期时间 |
|------|------|--------|
| CI/CD 配置 | `Generate GitHub Actions workflow for...` | **1-2 小时** |
| Docker 配置 | `Create Dockerfile and docker-compose.yml...` | **30-45 分钟** |
| 数据库迁移 | `Create migration script from schema v1 to v2...` | **1-2 小时** |

---

## ❓ 常见问题（FAQ）

### 基础问题

**Q: 我刚安装 Claude Code，应该从哪里开始？**

A: 按照这个顺序：
1. [快速开始](./getting-started.md) — 5 分钟配置
2. [核心概念](./core-concepts/) — 2 小时学习
3. [真实场景案例](./use-cases/) — 根据你的工作选择案例
4. 开始在实际项目中使用

---

**Q: 有推荐的学习路线吗？**

A: 根据你的角色选择：
- **新手**：[快速开始](./getting-started.md) → [Skills](./core-concepts/skills.md) → [案例](./use-cases/)
- **开发者**：[快速开始](./getting-started.md) → [核心概念](./core-concepts/) → [最佳实践](./best-practices/)
- **架构师**：[所有概念](./core-concepts/) → [最佳实践](./best-practices/) → 自定义方案

---

### 配置问题

**Q: 如何切换模型？**

```bash
# 方法 1：交互式切换（推荐）
/model              # 显示可用模型列表

# 方法 2：环境变量
export ANTHROPIC_MODEL=claude-sonnet-4-6
claude

# 方法 3：创建别名快速切换
alias cc-fast='ANTHROPIC_MODEL=claude-haiku-4-5 claude'
alias cc-slow='ANTHROPIC_MODEL=claude-opus-4-6 claude'
```

---

**Q: 如何配置国内模型？**

```bash
# 以 DeepSeek 为例
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_AUTH_TOKEN=sk-xxxxxxxx
export ANTHROPIC_MODEL=deepseek-chat
claude
```

详见 [快速开始 - 国内模型配置](./getting-started.md#常用国内模型配置)

---

**Q: 如何为项目配置 Claude Code？**

```bash
# 进入项目目录
cd my-project

# 初始化项目配置
claude
/init              # 生成 CLAUDE.md

# 编辑 CLAUDE.md 添加项目信息
# 之后 Claude Code 会自动应用这些配置
```

---

### 性能和成本

**Q: 为什么 Claude Code 运行很慢？**

常见原因和解决方案：

| 原因 | 解决方案 |
|------|--------|
| 上下文太大 | `/clear` 清除历史，重新开始 |
| 模型选择不当 | 使用 Haiku（快速）替代 Opus（精确） |
| 网络延迟 | 检查网络，或切换到更快的 API 端点 |
| 扫描文件过多 | 在 `.gitignore` 中排除不必要的目录 |

---

**Q: 如何减少 API 成本？**

| 优化方向 | 方法 | 节省成本 |
|---------|------|--------|
| 选择便宜模型 | 用 DeepSeek/Haiku 替代 Opus | **50-70%** |
| 减少上下文 | 只读必要的文件 | **30-50%** |
| 批量处理 | 一次完成多个任务 | **20-30%** |
| 清理上下文 | 定期 `/clear` | **10-20%** |

---

**Q: 如何查看本次会话的成本？**

```bash
/cost              # 显示当前会话的 token 消耗和费用

# 或查看详细日志
tail -f ~/.claude/logs/usage.log
```

---

### 集成和自动化

**Q: 如何在 CI/CD 中使用 Claude Code？**

```bash
# GitHub Actions 示例
- name: Claude Code Review
  run: |
    npm install -g @anthropic-ai/claude-code
    claude -p "review all changes" \
      --dangerously-skip-permissions \
      --output-format stream-json
```

详见真实场景 - CI/CD 自动化

---

**Q: 如何设置 Hooks 自动化？**

```bash
# 交互式配置
/hooks

# 或编辑配置文件
~/.claude/settings.json
```

详见 [Hooks 文档](./core-concepts/hooks.md)

---

**Q: 如何创建和使用 Skills？**

```bash
# 查看已安装的 Skills
/skills

# 安装官方 Skill
npx skills-installer install @anthropics/claude-code/frontend-design

# 使用 Skill
/frontend-design

# 创建自己的 Skill
# 详见 [Skills 文档](./core-concepts/skills.md)
```

---

## 🐛 故障排除

### 常见错误

**错误：`command not found: claude`**

解决方案：
```bash
# 检查安装
npm list -g @anthropic-ai/claude-code

# 重新安装
npm install -g @anthropic-ai/claude-code

# 检查 PATH
echo $PATH | grep npm
```

---

**错误：`Error: Invalid API key`**

解决方案：
```bash
# 验证密钥设置
echo $ANTHROPIC_AUTH_TOKEN

# 重新设置密钥
export ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxxxxx

# 测试连接
claude --version
```

---

**错误：`Context window exceeded`**

解决方案：
```bash
/clear              # 清除历史

# 或减少文件范围
# 编辑 .gitignore 排除不必要文件
```

---

**错误：`Hook failed to execute`**

解决方案：
```bash
# 检查脚本权限
chmod +x ~/.claude/hooks/*.sh

# 查看 Hook 日志
tail -f ~/.claude/logs/hook-debug.log

# 临时禁用 Hooks 调试
export CLAUDE_DISABLE_HOOKS=1
claude
```

---

## 🚀 性能优化清单

快速检查，确保最优性能：

- [ ] 选择合适的模型（Haiku：快速，Sonnet：平衡，Opus：精确）
- [ ] 定期清理上下文（`/clear`）
- [ ] 配置 CLAUDE.md 缓存项目信息
- [ ] 排除不必要的文件（.gitignore）
- [ ] 设置 Hooks 自动化重复任务
- [ ] 监控 API 成本（`/cost`）
- [ ] 更新到最新版本（`npm update -g @anthropic-ai/claude-code`）

---

## 📞 获取帮助

- 📖 [完整文档](./index.md)
- 🆘 [故障排除指南](#故障排除)
- 💬 [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- 📧 社区反馈
