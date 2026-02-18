---
sidebar_position: 3
title: 自定义斜杠命令
description: 创建团队专属的斜杠命令，将复杂工作流封装为一键执行的自动化指令
---

# 自定义斜杠命令

:::tip 核心价值
自定义斜杠命令是将团队最佳实践**固化为可复用指令**的机制。一次编写，随时调用——无论是提交代码、生成日报还是生产部署，都可以封装成命令，降低认知负担，确保流程一致性。
:::

## 创建自定义命令

### 方式一：使用 `/commands` 命令创建

在 Claude Code 交互界面输入 `/commands`，将打开命令管理界面，可以通过 GUI 创建和编辑命令。

### 方式二：手动创建 Markdown 文件

自定义命令存储为 `.claude/commands/` 目录下的 Markdown 文件：

```
项目根目录/
└── .claude/
    └── commands/
        ├── commit-push-pr.md      # 自动提交并创建 PR
        ├── daily-standup.md       # 生成每日站会日报
        └── deploy-production.md   # 完整部署工作流
```

命令文件的基本结构：

```markdown
---
description: 命令的简短描述（在命令列表中显示）
---

命令的详细指令内容...

可以使用 $ARGUMENTS 占位符接收用户传入的参数。
```

调用方式：`/commit-push-pr` 或 `/commit-push-pr feat: 新增用户认证`

---

## 示例 1：自动提交并创建 PR

```markdown title=".claude/commands/commit-push-pr.md"
---
description: 检查代码状态、运行测试，然后自动提交并创建 Pull Request
---

请按以下步骤完成提交和 PR 创建流程：

## 第一步：检查 Git 状态

运行 `git status` 和 `git diff --staged`，了解当前变更情况：
- 列出所有已修改的文件
- 统计新增/删除行数
- 检查是否有未暂存的变更

如果没有已暂存的变更，提示用户先执行 `git add`。

## 第二步：运行测试

执行 `npm test`（或根据项目实际测试命令调整）：
- 如果测试失败，**停止流程**，列出失败的测试用例，等待用户修复
- 如果测试通过，继续下一步

## 第三步：生成提交信息

根据 diff 内容，生成符合 Conventional Commits 规范的提交信息：
- 格式：`type(scope): description`
- type 可选：feat, fix, docs, style, refactor, test, chore
- 向用户展示建议的提交信息，等待确认或修改

用户提供的提交信息（如有）：$ARGUMENTS

## 第四步：执行提交

```bash
git commit -m "用户确认的提交信息"
git push origin HEAD
```

## 第五步：创建 Pull Request

使用 `gh pr create` 创建 PR：
- 标题：使用提交信息的第一行
- Body：生成包含变更摘要、测试情况、截图提示的 PR 描述模板
- 标签：根据 type 自动添加（feat→enhancement, fix→bug）

最后输出 PR 链接。
```

**使用示例：**
```
/commit-push-pr feat: 添加用户认证功能
```

---

## 示例 2：生成每日站会日报

```markdown title=".claude/commands/daily-standup.md"
---
description: 分析 Git 历史和当前任务，生成格式化的每日站会报告
---

请生成今天的站会日报，格式如下：

## 数据收集

1. 运行 `git log --since="yesterday" --until="now" --oneline --author="$(git config user.name)"` 获取昨日提交记录

2. 读取项目根目录的 `TODO.md` 或 `.tasks` 文件（如果存在）获取当前任务列表

3. 运行 `git status` 查看当前工作区状态

4. 查看 `git stash list` 了解搁置的工作

## 报告生成

根据收集到的信息，生成以下格式的站会报告：

---

**📅 每日站会报告 - [今日日期]**

**昨天完成：**
[根据 git log 总结，每条以 - 开头，用人话描述，而非复制提交信息]

**今天计划：**
[根据 TODO 和当前 git status 推断，列出 3-5 条计划]

**阻塞问题：**
[查看 git stash 和未完成的 TODO，判断是否有阻塞，没有则写"无"]

**本周进展：**
[可选：统计本周提交数和主要成果]

---

以 Markdown 格式输出，方便复制到 Slack 或飞书。

用户补充信息（如有）：$ARGUMENTS
```

**使用示例：**
```
/daily-standup 今天下午有 Code Review 会议需要提前准备
```

---

## 示例 3：完整生产部署工作流

```markdown title=".claude/commands/deploy-production.md"
---
description: 执行完整的生产环境部署流程，包含检查、构建、验证和回滚准备
---

请执行完整的生产部署工作流。这是高风险操作，每个步骤完成后请等待我的确认再继续。

部署目标版本/说明：$ARGUMENTS

## 阶段 1：前置检查（Pre-flight Checks）

**1.1 代码状态检查**
- `git status` — 确认工作区干净
- `git log origin/main..HEAD --oneline` — 确认已与远端同步
- 检查是否在正确的分支（main 或 release/*）

**1.2 环境变量检查**
- 确认 `.env.production` 存在且包含必要变量
- 检查 `ANTHROPIC_API_KEY`, `DATABASE_URL`, `JWT_SECRET` 等关键变量
- **不要输出这些变量的值**，只确认它们是否存在

**1.3 依赖安全扫描**
- `npm audit --audit-level=high` — 检查高危漏洞
- 如发现高危漏洞，**停止部署**并列出详情

完成后展示检查结果，等待确认继续。

---

## 阶段 2：构建

**2.1 安装依赖**
```bash
npm ci --production=false
```

**2.2 运行完整测试套件**
```bash
npm run test:ci
npm run test:e2e
```
测试必须全部通过，否则终止部署。

**2.3 生产构建**
```bash
npm run build:production
```
记录构建产物大小，与上次部署对比（如差异超过 20% 需人工确认）。

完成后展示构建摘要，等待确认继续。

---

## 阶段 3：Staging 环境部署与验证

**3.1 部署到 Staging**
```bash
npm run deploy:staging
```

**3.2 冒烟测试**
```bash
npm run test:smoke -- --env=staging
```

**3.3 性能基准检查**
- 记录关键接口响应时间
- 确认响应时间在可接受范围内（< 500ms）

展示 Staging 验证报告，等待确认生产部署。

---

## 阶段 4：生产环境部署

**4.1 创建部署快照**（用于回滚）
```bash
git tag -a "pre-deploy-$(date +%Y%m%d%H%M%S)" -m "Pre-deployment snapshot"
git push origin --tags
```

**4.2 执行生产部署**
```bash
npm run deploy:production
```

**4.3 部署后验证**
- 检查服务健康端点：`curl https://api.yourapp.com/health`
- 验证关键业务接口正常响应
- 检查错误监控（Sentry/Datadog）无异常告警

---

## 阶段 5：回滚准备

记录以下回滚信息供紧急使用：

```bash
# 如需回滚，执行：
git checkout <pre-deploy-tag>
npm run deploy:production

# 或使用平台回滚命令：
# heroku releases:rollback / vercel rollback
```

---

## 阶段 6：部署后检查（30 分钟内）

- [ ] 监控面板无异常
- [ ] 用户报告无增加
- [ ] 核心业务指标正常
- [ ] 通知团队部署完成

请在 Slack #deployments 频道发送部署通知。
```

---

## 常用斜杠命令速查表

以下是 Claude Code 内置的斜杠命令，按使用频率排序：

| 命令 | 功能描述 | 使用频率 |
|------|----------|----------|
| `/clear` | 清除当前对话历史，释放上下文 | ★★★★★ |
| `/compact` | 压缩对话历史，保留关键信息节省 token | ★★★★★ |
| `/context` | 查看当前上下文使用情况（token 用量） | ★★★★★ |
| `/model` | 切换 AI 模型（opus/sonnet/haiku） | ★★★★ |
| `/cost` | 查看本次会话的 API 费用 | ★★★★ |
| `/export` | 导出当前对话为 Markdown 文件 | ★★★★ |
| `/add-dir` | 将额外目录添加到上下文 | ★★★★ |
| `/doctor` | 诊断 Claude Code 环境配置问题 | ★★★★ |
| `/status` | 查看当前会话状态和配置 | ★★★ |
| `/mcp` | 管理 MCP 服务器连接 | ★★★ |
| `/skills` | 查看和管理已加载的技能 | ★★★ |
| `/hooks` | 配置生命周期 Hooks | ★★ |
| `/agents` | 查看子 Agent 状态 | ★★ |
| `/vim` | 切换 Vim 键盘模式 | ★★ |
| `/theme` | 切换界面主题（亮色/暗色） | ★ |

### 高频命令详解

**`/compact`** — 智能压缩上下文

```
# 当 /context 显示使用量超过 80% 时，运行：
/compact

# Claude 会：
# 1. 总结历史对话的关键信息
# 2. 保留最近的几轮对话原文
# 3. 释放中间过程的详细内容
# 4. 通常可节省 40-60% 的 token 使用
```

**`/model`** — 按需切换模型

```
/model claude-opus-4-6      # 最强能力，适合复杂架构设计
/model claude-sonnet-4-6    # 性能平衡，日常开发首选
/model claude-haiku-4-5     # 最快最省，适合简单问答
```

**`/export`** — 导出会话记录

```
/export                     # 导出为 Markdown（默认）
/export json                # 导出为 JSON 格式
/export --path ./meeting-notes.md   # 指定输出路径
```

---

## Extended Thinking（深度思考模式）

### ultrathink 关键词

在提示词中加入 `ultrathink` 关键词，触发 Claude 的扩展思考模式：

```
请使用 ultrathink 分析这个系统架构的瓶颈，并给出优化方案
```

深度思考模式下，Claude 会：
- 花费更长时间进行内部推理（思维链不可见）
- 从多个角度分析问题
- 自我质疑和验证推理过程
- 给出更严谨、更全面的结论

**适用场景对比：**

| 场景 | 普通模式 | ultrathink 模式 |
|------|----------|-----------------|
| 简单代码解释 | 适合 | 不必要（浪费 token） |
| 复杂算法设计 | 可能遗漏边界情况 | 推荐 |
| 系统架构评审 | 浅层分析 | 推荐 |
| 安全漏洞分析 | 可能遗漏 | 强烈推荐 |
| Bug 根因分析 | 适合 | 遇到困难时使用 |

**示例：**

```
请使用 ultrathink 深度分析以下竞态条件问题，
考虑所有可能的执行顺序和时序场景：

[粘贴代码]
```

---

## Vim 模式

### 启用 Vim 键盘绑定

```
/vim
```

启用后，Claude Code 的输入框支持 Vim 风格的编辑操作：

| 模式 | 说明 |
|------|------|
| `Normal` | 默认模式，用于导航和命令 |
| `Insert` | 输入文字（按 `i`/`a`/`o` 进入） |
| `Visual` | 选择文本（按 `v` 进入） |

### 常用快捷键

**Normal 模式导航：**

| 快捷键 | 功能 |
|--------|------|
| `h` / `l` | 左 / 右移动光标 |
| `j` / `k` | 下一行 / 上一行（多行输入时） |
| `w` / `b` | 跳到下一个 / 上一个单词 |
| `0` / `$` | 跳到行首 / 行尾 |
| `gg` / `G` | 跳到文本开头 / 结尾 |

**编辑操作：**

| 快捷键 | 功能 |
|--------|------|
| `dd` | 删除当前行 |
| `yy` | 复制当前行 |
| `p` | 粘贴 |
| `u` | 撤销 |
| `Ctrl+r` | 重做 |
| `ciw` | 修改当前单词（Change Inner Word） |
| `daw` | 删除当前单词（含空格） |

**进入 Insert 模式：**

| 快捷键 | 进入位置 |
|--------|----------|
| `i` | 光标前 |
| `a` | 光标后 |
| `I` | 行首 |
| `A` | 行尾 |
| `o` | 下方新行 |
| `O` | 上方新行 |

**退出模式：**
- `Esc` — 返回 Normal 模式
- `Ctrl+c` — 强制返回 Normal 模式

:::tip 关闭 Vim 模式
再次输入 `/vim` 可以切换回普通输入模式。Vim 模式的偏好设置会被持久化保存。
:::
