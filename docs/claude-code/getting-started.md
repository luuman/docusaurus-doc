---
title: 快速开始
sidebar_position: 2
description: Claude Code 的安装、环境配置、模型选择与项目初始化完整指南，5 分钟完成上手配置。
---

# 快速开始

选择你的学习速度：
- **⚡ 5 分钟快速启动** — 最小化安装，立即体验
- **📖 完整配置指南** — 详细步骤，全面理解

---

## ⚡ 5 分钟快速启动

### 前置准备

| 依赖 | 说明 |
|------|------|
| **Node.js v18+** | 运行时环境 |
| **Git v2.0+** | 版本控制 |
| **API Key** | 见下方获取 |

**快速获取 API Key：**
- **Anthropic 官方**：[console.anthropic.com](https://console.anthropic.com/)
- **国内用户推荐**：[DeepSeek API](https://platform.deepseek.com/) 或 [GLM API](https://open.bigmodel.cn/)

### 一键安装

```bash
npm install -g @anthropic-ai/claude-code
```

验证安装：
```bash
claude --version
```

### 快速配置（选择一个）

**方案 A：使用 Anthropic 官方模型**
```bash
export ANTHROPIC_BASE_URL=https://api.anthropic.com
export ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxxxxx
export ANTHROPIC_MODEL=claude-sonnet-4-6
```

**方案 B：使用国内模型（推荐，无需科学上网）**
```bash
# DeepSeek（最便宜）
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_AUTH_TOKEN=sk-xxxxxxxx
export ANTHROPIC_MODEL=deepseek-chat
```

### 启动使用

```bash
claude
```

**你会看到：** 交互式命令行，等待输入

### 第一个命令

输入以下任何一个，体验 Claude Code 的能力：

```bash
# 分析项目结构
describe my project

# 生成代码
create a hello world function in typescript

# 执行任务
read README.md and summarize it
```

**恭喜！** 你已经掌握基础用法。更多高级用法见下方"核心功能"。

---

## 📖 完整配置指南

### 前置准备

---

## 安装

使用 npm 全局安装 Claude Code：

```bash
npm install -g @anthropic-ai/claude-code
```

安装完成后，验证版本号确认安装成功：

```bash
claude --version
```

---

## 模型配置

Claude Code 通过环境变量指定 API 端点与模型。以下是各平台的配置方式。

### Windows

在命令提示符（CMD）中使用 `setx` 永久设置环境变量：

```batch
setx ANTHROPIC_BASE_URL "模型API地址"
setx ANTHROPIC_AUTH_TOKEN "你的API密钥"
setx ANTHROPIC_MODEL "模型名称"
```

:::warning 注意
`setx` 设置的环境变量在**当前终端窗口中不会立即生效**，需要重新打开终端后才能读取到新值。
:::

### macOS / Linux

在终端中临时设置（仅当前会话有效）：

```bash
export ANTHROPIC_BASE_URL=模型API地址
export ANTHROPIC_AUTH_TOKEN=你的API密钥
export ANTHROPIC_MODEL=模型名称
```

若需永久生效，将以上变量追加到 Shell 配置文件：

```bash
echo 'export ANTHROPIC_BASE_URL=模型API地址' >> ~/.bashrc
echo 'export ANTHROPIC_AUTH_TOKEN=你的API密钥' >> ~/.bashrc
echo 'export ANTHROPIC_MODEL=模型名称' >> ~/.bashrc

# 使配置立即生效
source ~/.bashrc
```

:::info zsh 用户
如果你使用 zsh（macOS 默认），请将 `~/.bashrc` 替换为 `~/.zshrc`。
:::

---

## 常用国内模型配置

以下是经过验证的国内主流模型接入信息，无需科学上网即可使用：

| 模型 | API 地址 | 模型名称 | 获取途径 |
|------|---------|---------|---------|
| **智谱 GLM-4.7** | `https://open.bigmodel.cn/api/anthropic` | `glm-4.7` | [open.bigmodel.cn](https://open.bigmodel.cn/) |
| **Kimi K2** | `https://api.moonshot.cn/anthropic` | `kimi-k2-turbo-preview` | [platform.moonshot.cn](https://platform.moonshot.cn/console) |
| **通义千问** | `https://dashscope.aliyuncs.com/apps/anthropic` | `qwen-coder-plus` | [bailian.console.aliyun.com](https://bailian.console.aliyun.com/) |
| **DeepSeek** | `https://api.deepseek.com/anthropic` | `deepseek-chat` | [platform.deepseek.com](https://platform.deepseek.com/) |

:::tip 示例：配置 DeepSeek（macOS/Linux）
```bash
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_AUTH_TOKEN=sk-xxxxxxxxxxxxxxxx
export ANTHROPIC_MODEL=deepseek-chat
```
:::

---

## 启动方式

### 交互模式（推荐）

直接启动进入交互式会话：

```bash
claude
```

### 危险模式

跳过所有权限确认提示，适用于自动化脚本或完全受控的环境：

```bash
claude --dangerously-skip-permissions
```

:::warning 谨慎使用
危险模式下 Claude Code 将**不再请求任何确认**，包括删除文件、覆盖数据等破坏性操作。仅在你完全信任执行内容时使用。
:::

### Headless 模式（管道输入）

将内容通过管道传入，适用于 CI/CD 流程或脚本集成：

```bash
git diff | claude -p "解释这些更改"
```

也可以组合使用：

```bash
cat error.log | claude -p "分析这个错误并给出修复建议"
```

---

## 项目初始化

在项目根目录启动 Claude Code 后，运行以下命令自动生成项目配置文件：

```bash
/init
```

该命令会分析当前项目结构，自动生成 `CLAUDE.md` 文件。`CLAUDE.md` 是 Claude Code 的**项目记忆文件**，用于在每次会话开始时向代理注入项目背景知识，包括：

- 项目架构概述
- 代码规范与命名约定
- 常用命令与工作流
- 特殊注意事项

:::info 建议实践
将 `CLAUDE.md` 纳入版本控制（不要 `.gitignore`），这样团队成员都能享受一致的 AI 辅助体验。
:::

---

## 模型选择策略

不同任务对模型能力的需求不同，合理选择模型可以显著降低成本、提升效率。

### Anthropic 官方模型

按能力与成本排序（从低到高）：

```
Haiku 4.5  →  Sonnet 4.6  →  Opus 4.6 + Thinking
（快速/低成本）  （性价比首选）   （最高质量/复杂推理）
```

- **Haiku 4.5**：适合简单查询、格式转换、快速补全
- **Sonnet 4.6**：日常开发的最佳平衡点，推荐作为默认模型
- **Opus 4.6 + Thinking**：复杂架构设计、深度代码审查、需要多步推理的任务

### 国内模型推荐

| 任务类型 | 推荐模型 | 理由 |
|---------|---------|------|
| 简单查询 / 脚本生成 | DeepSeek-Coder | 极低成本，代码能力强 |
| 中文项目 / 中文文档 | GLM-4.7 | 中文理解与生成能力最强 |
| 大型代码库重构 | Kimi K2 | 超长上下文（2M+ token），适合全局分析 |
| Python / JavaScript 开发 | Qwen-Coder-Plus | 在主流编程语言上性能优秀 |

### 动态切换模型

**方法一：会话内切换**

在 Claude Code 交互界面中使用斜杠命令：

```bash
/model
```

系统将展示可用模型列表，选择后立即生效。

**方法二：命令别名（推荐）**

在 Shell 配置文件（`~/.bashrc` 或 `~/.zshrc`）中定义别名，按任务快速切换：

```bash
alias cc-glm='ANTHROPIC_MODEL=GLM-4.7 claude'
alias cc-kimi='ANTHROPIC_MODEL=kimi-k2-turbo-preview claude'
alias cc-deepseek='ANTHROPIC_MODEL=deepseek-chat claude'
alias cc-qwen='ANTHROPIC_MODEL=qwen-coder-plus claude'
```

使用时直接调用别名即可：

```bash
cc-kimi        # 使用 Kimi K2 启动，适合处理大型代码库
cc-deepseek    # 使用 DeepSeek 启动，适合日常低成本任务
```

---

---

## 🎯 第一个实战任务：体验核心能力

现在让我们通过一个实际任务来理解 Claude Code 的强大之处。

### 任务：自动化代码审查

**场景：** 你有一个 JavaScript 文件，需要 Claude Code 检查代码质量、找出问题、给出改进建议。

**步骤 1：准备测试文件**

创建一个简单的 JavaScript 文件 `test.js`：

```javascript
// test.js - 这是一个有问题的代码示例

function calculate(a,b,c){
var result=a+b*c
return result
}

const data = {name:'john',age:30,email:'test@email'}

for(var i=0;i<10;i++){
    console.log(i)
}

export default calculate
```

**步骤 2：启动 Claude Code**

```bash
claude
```

**步骤 3：执行代码审查**

在 Claude Code 的交互界面输入：

```bash
review the code in test.js and suggest improvements for readability, performance, and best practices
```

**你会看到：**
- ✅ Claude Code 自动读取 test.js
- ✅ 识别代码问题（命名、格式、最佳实践）
- ✅ 提供具体改进建议
- ✅ 甚至可以帮你自动修复

**步骤 4：执行自动修复**

继续输入：

```bash
fix the issues in test.js following JavaScript best practices
```

**Claude Code 会：**
- 自动修改文件
- 应用格式化、最佳实践
- 生成改进后的代码

**学到的知识：**
- Claude Code 可以**读取和修改文件**
- 它理解**代码最佳实践**
- 它可以**自动执行重复性工作**

---

### 更多实战示例

现在你可以尝试这些任务，进一步体验能力：

**1. 生成测试代码**
```bash
generate unit tests for calculate function in test.js using jest
```

**2. 分析性能**
```bash
analyze the performance implications of the code in test.js
```

**3. 文档自动生成**
```bash
create a detailed README.md explaining the functions in test.js
```

**4. 批量处理**
```bash
find all .js files in this project and apply linting fixes
```

---

## 📚 下一步学习

完成以上实战任务后，建议按以下顺序继续探索：

### 如果你想提高日常效率

1. **[Skills 斜杠命令](./core-concepts/skills.md)** — 将常用任务变成一键命令
2. **[Hooks 生命周期](./core-concepts/hooks.md)** — 自动化代码提交前的检查
3. **[真实场景案例](../use-cases/)** — 查看你的工作领域的最佳实践

### 如果你想深度定制

1. **MCP Servers 集成** — 接入数据库、API 等外部资源
2. **Subagents 多代理** — 处理大型项目的并行任务
3. **CLAUDE.md 配置** — 为项目或团队配置 Claude Code

### 快速查找

- 🔍 **快速参考** — 斜杠命令速查表
- ❓ **常见问题** — 故障排除指南
- 📖 **完整概念指南** — 深度学习所有功能
