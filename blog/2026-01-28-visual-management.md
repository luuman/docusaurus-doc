---
slug: visual-management
title: 可视化任务管理系统搭建
date: 2026-01-28
authors: [claude-team]
tags: [claude-code, tutorial, automation, productivity]
description: 构建 Claude Code 的 Web 管理面板，实现任务看板、自动化调度与实时监控
---

# 可视化任务管理系统搭建

> 从命令行手动管理到 Web 看板自动化调度，构建你自己的 Claude Code Manager。支持任务创建、需求自动拆分、并行执行、实时日志监控和一键合并。

<!-- truncate -->

## 整体架构

```
┌─────────────────────────────────────────────────┐
│              浏览器 / 手机 PWA                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ 任务看板  │ │ 实时日志  │ │ 项目/Worktree管理 │  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
└───────────────────┬─────────────────────────────┘
                    │ WebSocket + REST API
┌───────────────────▼─────────────────────────────┐
│            Python 后端 (FastAPI)                   │
│  ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ 任务调度器 │ │ CC进程管理 │ │ Git Worktree管理│  │
│  └──────────┘ └───────────┘ └────────────────┘  │
│  ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ 日志解析器 │ │ 模板引擎  │ │  SQLite 存储   │  │
│  └──────────┘ └───────────┘ └────────────────┘  │
└───────────────────┬─────────────────────────────┘
                    │ subprocess
┌───────────────────▼─────────────────────────────┐
│          Claude Code 实例 ×N                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ worktree1│ │ worktree2│ │ worktree3│  ...      │
│  │ feat/auth│ │ feat/ui  │ │ feat/api │           │
│  └─────────┘ └─────────┘ └─────────┘            │
└─────────────────────────────────────────────────┘
```

系统分为三层：

- **前端层**：基于原生 HTML/CSS/JS 的单文件看板，通过 WebSocket 接收实时日志，通过 REST API 操作任务。支持 PWA，可添加到手机桌面。
- **后端层**：FastAPI 提供异步 API，aiosqlite 管理持久化数据，asyncio 并发调度多个 Claude Code 实例。
- **执行层**：每个任务在独立的 Git Worktree 中运行，Claude Code 以 `stream-json` 格式输出，后端解析后通过 WebSocket 广播。

## 项目结构

```
claude-code-manager/
├── app.py              # FastAPI 后端主入口
├── requirements.txt    # Python 依赖
├── tasks.db            # SQLite 数据库（自动创建）
├── manifest.json       # PWA 清单
├── sw.js               # Service Worker
├── templates/          # 项目模板
│   ├── CLAUDE.md.tpl   # CLAUDE.md 通用模板
│   └── PROGRESS.md.tpl # 进度追踪模板
└── frontend/
    └── index.html      # 看板 UI（单文件）
```

## 启动与使用

```bash
# 1. 创建项目目录
mkdir claude-code-manager && cd claude-code-manager
mkdir -p frontend templates

# 2. 安装依赖
pip install fastapi uvicorn websockets aiosqlite

# 3. 将 app.py 和 frontend/index.html 放入对应目录

# 4. 启动服务
uvicorn app:app --host 0.0.0.0 --port 8080

# 5. 浏览器访问
# http://localhost:8080
```

:::info 首次使用步骤
1. 打开 `http://localhost:8080`
2. 后端会自动在 API 中注册默认项目（演示模式下 `project_id = 'default'`）
3. 点击「新建任务」，填写标题和提示词
4. 或者点击「批量拆分」，粘贴需求文档，让 AI 自动拆分成多个任务
5. 点击「全部启动」，并行执行所有待执行任务
6. 实时查看右侧日志面板
7. 任务完成后点击「合并分支」将代码合并到主线
:::

## 自动化任务流程

以下是从需求输入到代码合并的完整端到端流程：

```
用户输入需求
    │
    ▼  POST /api/tasks/batch
Claude Code 自动拆分 → 5 个独立任务
    │
    ▼  用户看板上审阅生成的任务列表
    │  可以手动编辑/删除不需要的任务
    │
    ▼  点击「全部启动」 POST /api/tasks/run-all
5 个 Git Worktree 并行创建
5 个 Claude Code 实例并行启动
    │
    ▼  WebSocket 实时推送日志
看板显示每个任务的运行状态和实时输出
    │
    ▼  各任务独立完成
状态变为 success / failed
    │
    ▼  对每个 success 任务点击「合并分支」
自动执行 git merge --no-ff，删除 worktree
    │
    ▼
主分支包含所有新功能
```

### 并行执行效率对比

| 方式 | 5 个任务耗时 | CPU 利用率 |
|------|-------------|-----------|
| 串行手动执行 | ~150 分钟 | 20% |
| 此系统并行执行 | ~35 分钟 | 85%+ |

## 手机端 PWA 配置

将以下文件添加到 `claude-code-manager/` 目录，实现 PWA 支持：

```json title="manifest.json"
{
  "name": "Claude Code Manager",
  "short_name": "CC Manager",
  "description": "Claude Code 可视化任务管理系统",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d1117",
  "theme_color": "#161b22",
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

**添加到桌面步骤：**

1. 在 Chrome（Android）或 Safari（iOS）中打开 `http://your-server:8080`
2. Chrome：点击右上角菜单 → "添加到主屏幕"
3. Safari：点击分享按钮 → "添加到主屏幕"
4. 安装后图标出现在桌面，以独立 App 模式运行，无浏览器导航栏
5. 支持离线访问界面（API 调用需要网络连接）

:::tip 局域网访问
将 `your-server` 替换为运行服务器的局域网 IP（如 `192.168.1.100:8080`），手机连接同一 WiFi 即可访问。可使用 `ip addr` 查看服务器 IP。
:::

## 进阶增强方向

| 方向 | 做法 |
|------|------|
| 语音输入 | 输入框加 Web Speech API，对着手机说需求，自动填入 prompt |
| 定时任务 | 集成 APScheduler，每天凌晨自动跑测试套件或生成日报 |
| 多项目切换 | 左侧加项目 Tab 栏，支持同时管理多个 Git 仓库 |
| 成功率统计 | 记录每个 prompt 模板的成功/失败比，优化提示词模板库 |
| 自动合并 | 任务成功且测试通过（CI 绿灯）→ 自动创建 PR，无需手动操作 |
| Webhook 通知 | 任务完成/失败时通过 HTTP 推送到钉钉机器人、飞书、Slack |
| 认证保护 | 添加 HTTP Basic Auth 中间件或 JWT Token 认证 |
| 任务模板库 | 保存常用 prompt 模板，一键复用（如「写单元测试」「代码审查」） |
| 资源限制 | 设置最大并发任务数，避免同时启动过多 Claude Code 实例 |
| 任务依赖 | 支持 task A 完成后自动触发 task B，构建任务 DAG |

## 安全注意事项

:::danger 安全提醒
- 此系统应仅在**内网或 VPN** 下运行，不要暴露在公网
- `--dangerously-skip-permissions` 意味着 Claude Code 有完整的系统权限，可以读写任意文件
- 建议在 Docker 容器中运行，通过 volume mount 限制文件系统访问范围
- 定期检查 Git 提交历史（`git log --stat`），确保 AI 没有引入意外改动
- 任务的 prompt 内容可能被恶意用户构造为提示词注入，建议对输入做基础过滤
:::

### Docker 部署（推荐）

```dockerfile title="Dockerfile"
FROM python:3.12-slim

# 安装 Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# 只挂载指定的项目目录，而非整个宿主机文件系统
VOLUME ["/projects"]

EXPOSE 8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
```

```bash
# 构建和运行
docker build -t cc-manager .
docker run -d \
  -p 8080:8080 \
  -v /home/user/my-project:/projects/my-project \
  -e ANTHROPIC_API_KEY=your_key \
  cc-manager
```
