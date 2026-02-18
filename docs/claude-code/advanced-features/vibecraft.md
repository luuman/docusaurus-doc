---
sidebar_position: 6
title: VibeCraft — Claude Code 3D 可视化
description: 用 VibeCraft 在浏览器中实时查看 Claude Code 的工作状态，支持 3D 工坊可视化、多实例管理和语音输入
---

# VibeCraft — Claude Code 3D 可视化

:::tip 一句话介绍
VibeCraft 将 Claude Code 的每一次工具调用转化为 3D 工坊里的动画场景——你能实时看到 Claude 在"读书架"查资料、在"工作台"修代码、在"终端站"执行命令。
:::

VibeCraft 是一个运行在本地的 Claude Code 可视化监控工具。它通过 Claude Code 的 Hooks 机制捕获所有工具调用事件，在浏览器端以六边形网格 3D 工坊的形式实时渲染。无任何数据上传，完全本地运行。

**核心能力：**

| 能力 | 说明 |
|------|------|
| 3D 工坊可视化 | 每种工具对应独立工作站，角色实时移动动画 |
| 空间音效 | 方向性音效反馈 Claude 当前位置与操作 |
| 多实例管理 | 同时管理多个 Claude Code 会话（Multi-clauding） |
| 语音输入 | 对着麦克风说需求，实时转文字发送 |
| Draw Mode | 在 3D 网格上绘制颜色、标注、3D 层叠 |
| 活动流 | 分屏显示 Claude 的完整响应内容 |

---

## 系统要求

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| **Node.js** | 18+ | 运行 VibeCraft 服务器 |
| **jq** | 任意版本 | JSON 事件处理 |
| **tmux** | 任意版本 | 可选，多实例管理和浏览器发送提示词需要 |

---

## 安装

### 第一步：安装系统依赖

**macOS：**

```bash
brew install jq tmux
```

**Ubuntu / Debian：**

```bash
sudo apt install jq tmux
```

**Arch Linux：**

```bash
sudo pacman -S jq tmux
```

---

### 第二步：配置 Claude Code Hooks

```bash
npx vibecraft setup
```

这条命令会自动：
- 验证 `jq`、`tmux` 等依赖是否就绪
- 在 `~/.claude/settings.json` 中写入 8 个 Hook 配置
- 初始化事件数据文件（`~/.vibecraft/`）

:::info 重启生效
`setup` 完成后，必须重启所有正在运行的 Claude Code 实例，Hooks 才会生效。
:::

---

### 第三步：启动 VibeCraft 服务器

新开一个终端窗口，执行：

```bash
npx vibecraft
```

服务器默认监听 `http://localhost:4003`。如需自定义端口：

```bash
npx vibecraft --port 5000
```

---

### 第四步：打开浏览器

在浏览器中访问：

```
http://localhost:4003
```

此时在另一个终端正常启动 Claude Code，3D 工坊中的角色会开始随 Claude 的工具调用而移动。

---

## 快速诊断

安装后如果界面无响应，运行诊断命令：

```bash
npx vibecraft doctor
```

---

## 3D 工坊：工作站说明

VibeCraft 将 Claude Code 的每种工具映射到 3D 工坊中的专属工作站。Claude 使用某个工具时，角色会走到对应的工作站并播放动画。

| 工作站 | 对应工具 | 说明 |
|--------|---------|------|
| **Bookshelf（书架）** | `Read` | 读取文件内容 |
| **Desk（书桌）** | `Write` | 创建或覆写文件 |
| **Workbench（工作台）** | `Edit` | 编辑修改文件 |
| **Terminal（终端站）** | `Bash` | 执行 Shell 命令 |
| **Scanner（扫描台）** | `Grep`, `Glob` | 搜索文件内容或路径 |
| **Antenna（天线台）** | `WebFetch`, `WebSearch` | 网络请求 |
| **Portal（传送门）** | `Task` | 派发子代理任务 |
| **Taskboard（任务板）** | `TodoWrite` | 更新待办事项 |

角色头顶会显示当前操作的文件路径或命令，方便实时追踪。

---

## 多实例管理（Multi-clauding）

VibeCraft 支持在一个界面中同时管理多个 Claude Code 会话，每个会话运行在独立的 tmux session 中。

### 新建会话

按 `Alt+N` 或点击 Sessions 面板的 **+ New** 按钮，填写：

| 字段 | 说明 | 示例 |
|------|------|------|
| **Name** | 会话名称 | `Frontend`、`Tests` |
| **Directory** | 工作目录 | `/home/user/project` |
| **Flags** | 启动参数 | `--dangerously-skip-permissions` |

### 切换与发送

- 按 `1`–`6` 切换到对应会话
- 按 `0` 或 `` ` `` 查看所有会话总览
- 每个会话独立显示工作状态：`idle`（空闲）、`working`（工作中）、`offline`（离线）

### 使用 Git Worktree 并行开发

配合 Git Worktree 使用多实例效果最佳——每个功能分支在独立目录运行独立的 Claude 实例：

```bash
# 创建独立工作目录
git worktree add ../feat-auth feature/auth
git worktree add ../feat-ui  feature/ui

# 在 VibeCraft 中分别新建两个会话，目录指向上面的工作树
```

---

## 语音输入

VibeCraft 支持通过麦克风直接输入提示词，实时转文字后发送给 Claude。

### 配置 Deepgram API Key

在项目根目录（`~/.vibecraft/` 或 VibeCraft 工作目录）创建 `.env` 文件：

```bash
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

> 前往 [deepgram.com](https://deepgram.com) 注册免费账户获取 API Key。

### 使用方式

- 按 `Alt+R` 开启/关闭语音输入
- 界面显示实时转录文字
- 说完一句话后，内容自动填入提示框

---

## Draw Mode 绘制模式

Draw Mode 允许你在 3D 六边形网格上自由绘制，用于标注工作区域、记录架构图或视觉化思路。

### 进入与退出

按 `D` 键切换进入/退出 Draw Mode，或按 `Esc` 退出。

### 绘制操作

| 操作 | 快捷键 |
|------|--------|
| 选择颜色 1–6 | 按对应数字键 |
| 选择橡皮擦 | `0` |
| 减小笔刷大小 | `Q` |
| 增大笔刷大小 | `E` |
| 切换 3D 层叠模式 | `R` |
| 清除所有绘制 | `X` |

绘制的内容会持久化保存，重启 VibeCraft 后仍然保留。

---

## 键盘快捷键

### 通用快捷键

| 快捷键 | 功能 |
|--------|------|
| `Tab` / `Esc` | 在 3D 工坊与活动流之间切换焦点 |
| `1`–`6` | 切换到第 1–6 个会话 |
| `0` / `` ` `` | 查看所有会话总览 |
| `Alt+N` | 新建会话 |
| `Alt+R` | 开启/关闭语音输入 |
| `F` | 切换跟随模式（摄像机跟随角色移动） |
| `P` | 切换工作站面板（显示工具调用历史） |
| `D` | 进入/退出 Draw Mode |
| `Ctrl+C` | 复制选中文字，或中断正在工作的会话 |

### Draw Mode 快捷键

| 快捷键 | 功能 |
|--------|------|
| `1`–`6` | 选择颜色 |
| `0` | 选择橡皮擦 |
| `Q` | 减小笔刷 |
| `E` | 增大笔刷 |
| `R` | 切换 3D 层叠模式 |
| `X` | 清除所有绘制 |
| `D` / `Esc` | 退出 Draw Mode |

---

## CLI 命令参考

| 命令 | 说明 |
|------|------|
| `npx vibecraft` | 启动 VibeCraft 服务器 |
| `npx vibecraft setup` | 安装 Hooks，配置 `~/.claude/settings.json` |
| `npx vibecraft --port <端口>` | 在自定义端口启动 |
| `npx vibecraft --help` | 显示帮助信息 |
| `npx vibecraft --version` | 显示当前版本 |
| `npx vibecraft doctor` | 诊断常见问题 |
| `npx vibecraft uninstall` | 移除 Hooks（保留事件数据） |

**完全卸载：**

```bash
npx vibecraft uninstall
rm -rf ~/.vibecraft
```

---

## 常见问题排查

| 问题 | 解决方案 |
|------|---------|
| `jq: command not found` | 按照安装步骤安装 `jq` |
| Hook 脚本权限拒绝 | `chmod +x $(npx vibecraft --hook-path)` |
| 界面显示 "Agent Not Connected" | 确认 VibeCraft 服务器正在运行，并重启 Claude Code |
| 事件不出现 / 角色不动 | 依次检查：服务器是否运行 → Hooks 是否配置 → 重启 Claude Code |
| 语音输入无响应 | 检查 `.env` 中的 `DEEPGRAM_API_KEY` 是否正确 |
| 端口冲突 | 使用 `npx vibecraft --port <其他端口>` |

:::tip 完整诊断
遇到问题时先运行 `npx vibecraft doctor`，它会自动检测常见配置错误并给出修复建议。
:::
