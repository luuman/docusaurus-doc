---
sidebar_position: 3
title: Plugins（插件）
description: Plugins 是 Claude Code 的扩展集合，将多个 Skills、命令、MCP 服务器、子代理和 Hooks 打包在一起统一分发
---

# Plugins（插件）

## 什么是 Plugins

如果说 Skills 是单个工具，那么 Plugins 就是一整套工具箱。一个 Plugin 可以同时包含：

- **多个 Skills**（预封装工作流）
- **多个斜杠命令**（自定义 `/command`）
- **多个 MCP 服务器配置**（外部工具集成）
- **多个 SubAgent 定义**（子代理配置）
- **若干 Hooks**（事件驱动自动化）

:::info 典型规模
一个完整的 Plugin 可能包含：5 个 Skills、10 个斜杠命令、3 个 MCP 服务器配置、2 个 SubAgent 定义，以及若干 Hooks——所有这些通过一条命令统一安装和管理。
:::

---

## 安装 Plugins

### 从官方/公共来源安装

```bash
# 安装指定名称的插件
claude plugin install <plugin-name>

# 示例
claude plugin install fullstack-dev
claude plugin install data-science-toolkit
claude plugin install security-auditor
```

### 从本地目录安装

```bash
# 安装本地开发的插件
claude plugin install ./my-plugin

# 安装时指定别名
claude plugin install ./my-plugin --alias my-tools
```

### 从 GitHub 仓库安装

```bash
# 从公开 GitHub 仓库安装
claude plugin install github:your-org/your-plugin

# 从私有仓库安装（需要配置 GitHub Token）
claude plugin install github:your-org/private-plugin --token $GITHUB_TOKEN

# 安装特定版本/分支
claude plugin install github:your-org/your-plugin#v2.0.0
claude plugin install github:your-org/your-plugin#main
```

### 查看已安装的 Plugins

在 Claude Code 中运行：

```
/plugin
```

或通过命令行：

```bash
# 列出所有已安装的插件
claude plugin list

# 查看插件详情
claude plugin info <plugin-name>

# 卸载插件
claude plugin uninstall <plugin-name>
```

---

## Plugin 目录结构

一个完整的 Plugin 遵循以下目录结构：

```
my-plugin/
├── plugin.json           # 插件元数据（必须）
├── skills/               # Skills 定义目录
│   ├── skill-a/
│   │   ├── skill.json
│   │   └── skill.md
│   └── skill-b/
│       ├── skill.json
│       └── skill.md
├── commands/             # 自定义斜杠命令
│   ├── deploy.md         # /deploy 命令
│   ├── review.md         # /review 命令
│   └── release.md        # /release 命令
├── mcp/                  # MCP 服务器配置
│   ├── servers.json      # MCP 服务器列表
│   └── configs/          # 各服务器详细配置
│       ├── github.json
│       └── database.json
├── agents/               # SubAgent 定义
│   ├── code-reviewer.md
│   └── test-writer.md
└── hooks/                # Hook 脚本
    ├── pre-commit.sh
    └── post-deploy.sh
```

---

## plugin.json 完整示例

```json
{
  "name": "fullstack-dev-toolkit",
  "displayName": "全栈开发工具包",
  "description": "为全栈开发团队提供完整的开发、测试、部署工作流",
  "version": "2.1.0",
  "author": {
    "name": "Your Team",
    "email": "dev@yourcompany.com",
    "url": "https://yourcompany.com"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/fullstack-dev-toolkit"
  },
  "keywords": [
    "fullstack",
    "react",
    "node",
    "deployment",
    "testing"
  ],
  "engines": {
    "claude-code": ">=1.0.0"
  },
  "skills": [
    {
      "name": "component-generator",
      "path": "./skills/component-generator",
      "description": "React 组件生成与优化"
    },
    {
      "name": "api-designer",
      "path": "./skills/api-designer",
      "description": "RESTful API 设计与文档生成"
    },
    {
      "name": "db-optimizer",
      "path": "./skills/db-optimizer",
      "description": "数据库查询优化分析"
    },
    {
      "name": "test-strategist",
      "path": "./skills/test-strategist",
      "description": "测试策略规划与测试用例生成"
    },
    {
      "name": "perf-profiler",
      "path": "./skills/perf-profiler",
      "description": "性能分析与瓶颈识别"
    }
  ],
  "commands": [
    {
      "name": "deploy",
      "path": "./commands/deploy.md",
      "description": "部署应用到指定环境"
    },
    {
      "name": "review",
      "path": "./commands/review.md",
      "description": "执行标准化代码审查"
    },
    {
      "name": "release",
      "path": "./commands/release.md",
      "description": "创建新版本发布"
    },
    {
      "name": "migrate",
      "path": "./commands/migrate.md",
      "description": "运行数据库迁移"
    },
    {
      "name": "test-coverage",
      "path": "./commands/test-coverage.md",
      "description": "分析并提升测试覆盖率"
    }
  ],
  "mcpServers": [
    {
      "name": "github",
      "config": "./mcp/configs/github.json",
      "description": "GitHub API 集成"
    },
    {
      "name": "postgres",
      "config": "./mcp/configs/database.json",
      "description": "PostgreSQL 数据库直连"
    },
    {
      "name": "monitoring",
      "config": "./mcp/configs/monitoring.json",
      "description": "应用性能监控数据访问"
    }
  ],
  "agents": [
    {
      "name": "code-reviewer",
      "path": "./agents/code-reviewer.md",
      "description": "专职代码审查子代理"
    },
    {
      "name": "test-writer",
      "path": "./agents/test-writer.md",
      "description": "自动化测试编写子代理"
    }
  ],
  "hooks": [
    {
      "event": "after-tool-use",
      "script": "./hooks/post-deploy.sh",
      "description": "部署后自动通知和验证"
    },
    {
      "event": "tool-use",
      "script": "./hooks/pre-commit.sh",
      "description": "提交前安全检查"
    }
  ],
  "configuration": {
    "schema": "./config-schema.json",
    "defaults": {
      "autoFormat": true,
      "notifyOnDeploy": true,
      "runTestsOnSave": false
    }
  }
}
```

---

## 创建自定义 Plugin

### 初始化 Plugin 模板

```bash
# 使用官方脚手架创建插件
npx create-claude-plugin my-plugin

# 进入插件目录
cd my-plugin

# 查看生成的结构
ls -la
```

### 添加斜杠命令

在 `commands/` 目录下创建 Markdown 文件，文件名即为命令名：

```markdown
<!-- commands/deploy.md -->
# /deploy 命令

## 描述
将当前项目部署到指定环境。

## 参数
- `environment`: 目标环境（dev/staging/prod）
- `--dry-run`: 模拟部署，不实际执行

## 使用示例
```
/deploy staging
/deploy prod --dry-run
```

## 执行流程
1. 检查当前分支是否为允许部署的分支
2. 运行完整测试套件
3. 构建生产版本
4. 推送到目标环境
5. 执行健康检查
6. 发送部署通知
```

:::tip 斜杠命令设计原则
每个命令文件应清晰描述：命令用途、接受的参数、执行步骤、预期输出。这些内容会被 Claude Code 用来理解如何执行该命令。
:::

---

## Plugin 与 Skills 的对比

| 特性 | Skills | Plugins |
|------|--------|---------|
| 粒度 | 单一工作流 | 完整功能套件 |
| 安装复杂度 | 简单 | 略复杂 |
| 适用场景 | 特定任务 | 完整项目工作流 |
| 包含内容 | 提示词+工具 | Skills+命令+MCP+Agent+Hooks |
| 团队协作 | 单人使用居多 | 团队统一使用 |
| 维护成本 | 低 | 中等 |

---

## 最佳实践

:::tip Plugin 开发建议

1. **保持单一职责**：每个 Plugin 专注于一类场景（前端开发、数据科学、安全审计等）
2. **版本语义化**：遵循 Semantic Versioning（主版本.次版本.补丁）
3. **提供配置项**：将可变参数暴露为配置项，而非硬编码
4. **编写测试**：为 Hooks 和命令脚本编写单元测试
5. **文档完整**：每个 Skill、命令、Agent 都应有清晰的描述
:::

:::warning 注意事项
安装来自不可信来源的 Plugin 前，务必审查其 `hooks/` 目录中的脚本内容。Hook 脚本会以当前用户权限执行，存在安全风险。
:::
