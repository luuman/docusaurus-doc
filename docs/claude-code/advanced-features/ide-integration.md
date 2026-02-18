---
sidebar_position: 5
title: IDE 集成
description: 在 VSCode、JetBrains、Cursor 等主流 IDE 中使用 Claude Code，实现无缝开发体验
---

# IDE 集成

Claude Code 本质上是一个终端工具，可以与任意支持终端的 IDE 无缝配合。本文介绍主流 IDE 的集成方案。

---

## VSCode 集成

### 方式一：内置终端（推荐）

VSCode 自带强大的集成终端，是使用 Claude Code 最简单的方式：

1. 打开 VSCode，快捷键 `` Ctrl+` `` 打开终端
2. 在终端中启动 Claude Code：

```bash
claude
```

**优化配置：** 在 VSCode 设置中调整终端字体和颜色，让 Claude Code 的输出更清晰：

```json
// .vscode/settings.json
{
  "terminal.integrated.fontSize": 14,
  "terminal.integrated.fontFamily": "JetBrains Mono, Cascadia Code, monospace",
  "terminal.integrated.scrollback": 10000,
  "terminal.integrated.defaultProfile.linux": "zsh",
  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}
```

**拆分终端布局：** 在 VSCode 中同时开多个终端，实现并行开发：

```
┌─────────────────────┬────────────────────┐
│                     │  终端 1: Claude    │
│   编辑器区域         │  (主要任务)        │
│                     ├────────────────────┤
│                     │  终端 2: Claude    │
│                     │  (并行任务)        │
└─────────────────────┴────────────────────┘
```

使用 `Ctrl+Shift+5`（Windows/Linux）或 `Cmd+\`（macOS）分割终端。

---

### 方式二：VSCode 扩展（Claude Code Extension）

Anthropic 官方为 VSCode 提供了 Claude Code 扩展，提供更深度的编辑器集成：

**安装：**

在 VSCode 扩展市场搜索 `Claude Code`，或通过命令行安装：

```bash
code --install-extension anthropic.claude-code
```

**扩展功能：**

| 功能 | 说明 |
|------|------|
| 内联代码建议 | 在编辑器中直接显示 Claude 的改进建议 |
| 右键菜单 | 选中代码后右键可以直接发送给 Claude |
| 问题面板集成 | 自动将编辑器错误发送给 Claude 分析 |
| 文件引用自动补全 | 输入 `@` 时自动补全项目文件名 |
| 状态栏显示 | 底部状态栏显示 Claude Code 运行状态 |

**配置扩展：**

```json
// VSCode settings.json
{
  "claude-code.model": "claude-sonnet-4-6",
  "claude-code.autoComplete": true,
  "claude-code.inlineHints": true,
  "claude-code.terminalIntegration": true
}
```

---

### 方式三：任务配置（Task Runner）

将常用的 Claude Code 工作流配置为 VSCode 任务，一键触发：

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Claude: 审查当前文件",
      "type": "shell",
      "command": "claude",
      "args": ["-p", "审查 ${file} 的代码质量，指出潜在问题", "--dangerously-skip-permissions"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Claude: 生成测试",
      "type": "shell",
      "command": "claude",
      "args": ["-p", "为 ${file} 生成完整的单元测试", "--dangerously-skip-permissions"],
      "group": "test"
    },
    {
      "label": "Claude: 解释选中代码",
      "type": "shell",
      "command": "claude",
      "args": ["-p", "解释 ${selectedText} 这段代码的作用"],
      "group": "none"
    },
    {
      "label": "Claude: 生成 Git 提交信息",
      "type": "shell",
      "command": "bash",
      "args": ["-c", "git diff --staged | claude -p '为这次变更生成规范的 Conventional Commits 提交信息'"],
      "group": "none"
    }
  ]
}
```

通过 `Ctrl+Shift+P` → `Tasks: Run Task` 选择执行。

---

### 键盘快捷键绑定

将 Claude Code 任务绑定到快捷键：

```json
// .vscode/keybindings.json
[
  {
    "key": "ctrl+shift+a",
    "command": "workbench.action.tasks.runTask",
    "args": "Claude: 审查当前文件"
  },
  {
    "key": "ctrl+shift+t",
    "command": "workbench.action.tasks.runTask",
    "args": "Claude: 生成测试"
  }
]
```

---

## JetBrains IDE 集成

适用于 IntelliJ IDEA、PyCharm、WebStorm、GoLand 等所有 JetBrains IDE。

### 内置终端集成

1. 快捷键 `Alt+F12`（Windows/Linux）或 `Option+F12`（macOS）打开终端
2. 启动 Claude Code：

```bash
claude
```

### 外部工具配置

将 Claude Code 命令配置为 JetBrains 的外部工具：

**Settings → Tools → External Tools → 添加新工具：**

| 字段 | 值 |
|------|----|
| Name | Claude: 审查代码 |
| Program | claude |
| Arguments | -p "审查 $FilePath$ 的代码质量" |
| Working directory | $ProjectFileDir$ |

配置后在 `Tools → External Tools` 菜单中可以调用，也可以绑定快捷键。

### 文件监视器（File Watchers）

自动在文件保存时触发 Claude Code 分析：

**Settings → Tools → File Watchers → 添加：**

```
Name: Claude Auto-Review
File type: TypeScript
Scope: Current File
Program: claude
Arguments: -p "检查 $FilePath$ 是否有明显的 Bug 或问题" --dangerously-skip-permissions
Output paths to refresh: (留空)
```

:::warning 性能提示
File Watchers 会在每次文件保存时触发，如果项目较大，建议只对关键文件类型启用，并使用轻量模型（如 claude-haiku-4-5）以避免延迟。
:::

---

## Cursor 集成

Cursor 内置了 AI 功能，但 Claude Code 可以作为更强大的补充：

### 双 AI 工作流

```
Cursor AI（内置）              Claude Code（终端）
──────────────                 ──────────────────
快速代码补全         ←→        复杂多文件重构
内联编辑建议         ←→        架构分析与规划
单文件问题解答        ←→        跨文件依赖追踪
                               CI/CD 自动化
```

### 在 Cursor 中使用 Claude Code

1. 使用 Cursor 内置 AI 完成日常编辑
2. 遇到需要多文件协作或系统级操作时，打开 Cursor 终端（`` Ctrl+` ``）切换到 Claude Code

```bash
# 在 Cursor 终端中启动
claude
```

---

## Vim / Neovim 集成

### 使用 Tmux 分屏

推荐使用 Tmux 将 Vim 和 Claude Code 分屏显示：

```bash
# 在 tmux 中创建分屏布局
# 左侧：Vim 编辑器
# 右侧：Claude Code 终端

tmux new-session -d -s dev
tmux split-window -h -t dev
tmux send-keys -t dev:0.0 'vim' Enter
tmux send-keys -t dev:0.1 'claude' Enter
tmux attach -t dev
```

**快速发送代码给 Claude：** 在 `.vimrc` 中添加：

```vim
" 将当前文件发送给 Claude 审查
nnoremap <leader>ca :!claude -p "审查这个文件" < % --dangerously-skip-permissions<CR>

" 将选中内容发送给 Claude 解释
vnoremap <leader>ce :w !claude -p "解释这段代码"<CR>
```

### Neovim 插件

对于 Neovim 用户，可以使用社区插件 `claude-nvim` 直接在编辑器内调用 Claude Code：

```lua
-- lazy.nvim 配置
{
  "claudecode/claude-nvim",
  config = function()
    require("claude").setup({
      model = "claude-sonnet-4-6",
      auto_open_terminal = true
    })
  end
}
```

---

## Git 工作流集成

### Git Hooks 中调用 Claude Code

在 Git 生命周期中集成 Claude Code 审查：

```bash
# .git/hooks/pre-commit
#!/bin/bash
# 提交前自动审查代码质量

DIFF=$(git diff --cached)
if [ -z "$DIFF" ]; then
  exit 0
fi

echo "🔍 Claude Code 正在审查代码..."
REVIEW=$(echo "$DIFF" | claude -p "
快速审查这次提交的代码变更，如果发现严重问题（安全漏洞、明显 Bug）输出 [BLOCK] 开头的警告；
否则输出 [OK]
" --dangerously-skip-permissions 2>/dev/null)

if echo "$REVIEW" | grep -q "\[BLOCK\]"; then
  echo "❌ 代码审查发现严重问题，提交被阻止："
  echo "$REVIEW"
  exit 1
fi

echo "✅ 代码审查通过"
exit 0
```

```bash
chmod +x .git/hooks/pre-commit
```

### commit-msg 钩子：自动生成提交信息

```bash
# .git/hooks/prepare-commit-msg
#!/bin/bash
# 如果是空的提交信息，自动生成

COMMIT_MSG_FILE="$1"
COMMIT_SOURCE="$2"

# 只在手动提交时触发（不影响 merge、amend 等）
if [ "$COMMIT_SOURCE" != "" ]; then
  exit 0
fi

DIFF=$(git diff --cached)
if [ -z "$DIFF" ]; then
  exit 0
fi

SUGGESTED_MSG=$(echo "$DIFF" | claude -p "
根据这次代码变更生成一条简洁的 Conventional Commits 格式提交信息。
只输出提交信息本身，不要其他内容。格式：type(scope): message
" --dangerously-skip-permissions 2>/dev/null)

if [ -n "$SUGGESTED_MSG" ]; then
  echo "# 建议的提交信息：" > "$COMMIT_MSG_FILE"
  echo "# $SUGGESTED_MSG" >> "$COMMIT_MSG_FILE"
  echo "# (删除 # 使用建议信息，或直接编辑)" >> "$COMMIT_MSG_FILE"
fi
```

---

## 通用技巧

### 文件拖拽引用

在大多数终端模拟器中，将文件从 IDE 的文件树拖拽到终端，会自动输入文件路径：

```
# 拖拽 src/auth.ts 到终端后：
claude "审查 /Users/me/project/src/auth.ts 这个文件"
```

### 剪贴板集成

将编辑器中选中的代码通过剪贴板传给 Claude：

```bash
# macOS
pbpaste | claude -p "解释这段代码"

# Linux（需要 xclip）
xclip -selection clipboard -o | claude -p "解释这段代码"

# Windows（PowerShell）
Get-Clipboard | claude -p "解释这段代码"
```

在 Shell 配置文件中添加别名简化操作：

```bash
# ~/.zshrc 或 ~/.bashrc
alias cc-explain='pbpaste | claude -p "详细解释这段代码的作用"'
alias cc-review='pbpaste | claude -p "审查这段代码，找出潜在问题"'
alias cc-fix='pbpaste | claude -p "修复这段代码中的问题并说明修改原因"'
```

### 多终端窗口管理

对于需要同时管理多个 Claude Code 实例的场景，推荐使用：

- **Tmux**：终端复用神器，支持会话持久化和分屏
- **Zellij**：现代化终端工作区，对鼠标操作更友好
- **iTerm2（macOS）**：支持 Hotkey Window，一键调出 Claude Code

```bash
# 使用 tmux 创建标准开发布局
tmux new-session -s dev \; \
  split-window -h \; \
  split-window -v \; \
  select-pane -t 0 \; \
  send-keys 'claude' Enter \; \
  select-pane -t 1 \; \
  send-keys 'claude' Enter
```
