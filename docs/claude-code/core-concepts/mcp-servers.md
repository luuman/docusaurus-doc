---
sidebar_position: 4
title: MCP Servers（模型上下文协议）
description: MCP（Model Context Protocol）是 AI 的扩展接口标准，让 Claude Code 能够连接外部工具、数据库、API 等资源
---

# MCP Servers（模型上下文协议）

## 什么是 MCP

MCP（Model Context Protocol，模型上下文协议）是 Anthropic 主导制定的开放标准，旨在为 AI 模型与外部工具、服务之间提供统一的通信接口。

可以将 MCP 理解为 AI 的 **USB 接口标准**：任何遵循 MCP 协议的服务都可以无缝接入 Claude Code，无需编写特定的集成代码。

:::info MCP 的意义
在 MCP 出现之前，每个 AI 工具都需要为每个外部服务编写专属集成。MCP 统一了这一接口，使得一个服务可以被任何兼容 MCP 的 AI 客户端使用。
:::

---

## 常用 MCP 服务器

以下是社区中最受欢迎的 MCP 服务器：

| MCP 服务器 | GitHub Stars | 功能 | 典型用途 |
|-----------|-------------|------|---------|
| `chrome-devtools-mcp` | 18.5k+ | 浏览器自动化与调试 | UI 测试、网页截图、DOM 操作 |
| `github-mcp` | 10k+ | GitHub API 完整访问 | PR 管理、Issue 操作、代码搜索 |
| `postgres-mcp` | 5k+ | PostgreSQL 数据库操作 | 数据查询、Schema 管理、迁移 |
| `filesystem-mcp` | 3k+ | 文件系统操作 | 文件读写、目录管理、搜索 |
| `web-search-mcp` | 2k+ | 网页搜索与内容提取 | 信息检索、竞品分析、文档查阅 |

---

## 安装 MCP 服务器

### 方式一：命令行安装

```bash
# 添加 Chrome DevTools MCP
claude mcp add chrome-devtools npx @modelcontextprotocol/server-chrome-devtools

# 添加 GitHub MCP（需要环境变量）
claude mcp add github npx @modelcontextprotocol/server-github \
  --env GITHUB_TOKEN=$GITHUB_TOKEN

# 添加 PostgreSQL MCP
claude mcp add postgres npx @modelcontextprotocol/server-postgres \
  --env DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"

# 添加文件系统 MCP（限制访问特定目录）
claude mcp add filesystem npx @modelcontextprotocol/server-filesystem \
  --args "/home/user/projects" "/home/user/documents"

# 添加网页搜索 MCP
claude mcp add web-search npx @modelcontextprotocol/server-web-search \
  --env SEARCH_API_KEY=$SEARCH_API_KEY
```

### 方式二：配置文件

编辑 `~/.claude/mcp.json`（全局配置）或项目根目录下的 `.claude/mcp.json`（项目配置）：

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-chrome-devtools"
      ],
      "env": {
        "CHROME_PATH": "/usr/bin/google-chrome",
        "HEADLESS": "false"
      },
      "description": "Chrome 浏览器自动化与 DevTools 访问"
    },
    "github": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "GitHub API 集成，支持 PR、Issue、代码搜索"
    },
    "postgres": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-postgres",
        "${DATABASE_URL}"
      ],
      "env": {
        "DATABASE_URL": "postgresql://myuser:mypassword@localhost:5432/mydb",
        "MAX_CONNECTIONS": "5",
        "STATEMENT_TIMEOUT": "30000"
      },
      "description": "PostgreSQL 数据库直连访问"
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/home/user/projects",
        "/home/user/documents"
      ],
      "description": "受限文件系统访问（仅限指定目录）"
    },
    "web-search": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-web-search"
      ],
      "env": {
        "SEARCH_API_KEY": "${SEARCH_API_KEY}",
        "MAX_RESULTS": "10"
      },
      "description": "网页搜索与内容提取"
    }
  }
}
```

:::tip 环境变量注入
在 `mcp.json` 中使用 `${VAR_NAME}` 语法引用系统环境变量，避免在配置文件中硬编码敏感信息（如数据库密码、API Token）。
:::

---

## 验证 MCP 连接

### 在 Claude Code 内验证

```
/mcp
```

这会显示所有已配置 MCP 服务器的状态（连接中/已连接/连接失败）。

### 通过命令行验证

```bash
# 列出所有已配置的 MCP 服务器
claude mcp list

# 测试特定 MCP 服务器连接
claude mcp test chrome-devtools
claude mcp test github
claude mcp test postgres

# 查看 MCP 服务器详细信息（包含可用工具列表）
claude mcp info chrome-devtools

# 移除 MCP 服务器配置
claude mcp remove postgres
```

---

## Chrome DevTools MCP 详解

`chrome-devtools-mcp` 是功能最丰富的 MCP 服务器之一，内置 **26 个工具**，覆盖完整的浏览器自动化场景。

### 安装

```bash
# 需要先安装 Chrome/Chromium
claude mcp add chrome-devtools npx @modelcontextprotocol/server-chrome-devtools
```

### 核心工具列表

| 工具名称 | 功能 | 参数示例 |
|---------|------|---------|
| `chrome_navigate` | 导航到指定 URL | `{ "url": "https://example.com" }` |
| `chrome_screenshot` | 截取页面截图 | `{ "fullPage": true, "format": "png" }` |
| `chrome_click` | 点击页面元素 | `{ "selector": "#submit-btn" }` |
| `chrome_fill` | 填写表单字段 | `{ "selector": "#email", "value": "test@example.com" }` |
| `chrome_select` | 选择下拉选项 | `{ "selector": "#country", "value": "CN" }` |
| `chrome_evaluate` | 执行 JavaScript | `{ "script": "document.title" }` |
| `chrome_get_text` | 获取元素文本 | `{ "selector": ".article-content" }` |
| `chrome_wait_for` | 等待元素出现 | `{ "selector": ".loading", "state": "hidden" }` |
| `chrome_scroll` | 滚动页面 | `{ "x": 0, "y": 500 }` |
| `chrome_hover` | 悬停在元素上 | `{ "selector": ".dropdown-trigger" }` |
| `chrome_get_html` | 获取元素 HTML | `{ "selector": "body" }` |
| `chrome_network_logs` | 获取网络请求日志 | `{ "filter": "api" }` |
| `chrome_console_logs` | 获取控制台日志 | `{ "level": "error" }` |
| `chrome_get_cookies` | 获取 Cookie | `{ "domain": "example.com" }` |
| `chrome_set_cookie` | 设置 Cookie | `{ "name": "session", "value": "abc123" }` |
| `chrome_local_storage` | 读取本地存储 | `{ "key": "user_prefs" }` |

### 使用场景示例

**场景一：自动化 UI 测试**

```
帮我测试登录功能：
1. 打开 http://localhost:3000/login
2. 填写用户名 "admin" 和密码 "password123"
3. 点击登录按钮
4. 验证是否跳转到 /dashboard
5. 截图保存测试结果
```

**场景二：抓取页面数据**

```
使用 chrome-devtools MCP 访问 https://example.com/products，
获取所有产品的名称、价格和库存状态，以 JSON 格式输出。
```

**场景三：调试前端问题**

```
打开我的应用 http://localhost:3000，
查看控制台是否有错误，检查网络请求是否有失败的 API 调用，
并截图记录当前页面状态。
```

**场景四：端到端测试自动化**

```
运行完整的注册流程测试：
1. 导航到注册页面
2. 填写所有必填字段
3. 上传头像图片
4. 提交表单
5. 验证成功邮件提示
6. 截图记录每个步骤
```

---

## MCP 安全最佳实践

:::warning 安全注意事项

1. **最小权限原则**：`filesystem-mcp` 只授权访问必要的目录，避免授权根目录
2. **Token 管理**：GitHub Token、API Key 等敏感信息通过环境变量传入，不要硬编码在配置文件中
3. **数据库访问**：生产数据库使用只读账号，避免误操作数据
4. **审查第三方 MCP**：安装社区 MCP 服务器前，审查其源代码和权限要求
5. **项目级隔离**：不同项目使用不同的 `.claude/mcp.json`，避免配置混用
:::

---

## 故障排查

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| MCP 服务器无法连接 | npx 未安装或网络问题 | 检查 Node.js 版本，确认 npm 可正常访问 |
| GitHub MCP 权限不足 | Token 权限配置错误 | 在 GitHub 设置中检查 Token 的 scope |
| PostgreSQL 连接失败 | 连接字符串格式错误 | 验证 `DATABASE_URL` 格式和数据库服务状态 |
| Chrome MCP 无法启动 | Chrome 路径错误 | 通过 `which google-chrome` 确认正确路径 |
| 工具调用超时 | 服务器响应慢 | 增加 MCP 服务器配置中的 `timeout` 值 |
