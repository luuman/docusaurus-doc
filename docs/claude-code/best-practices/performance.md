---
sidebar_position: 2
title: 性能优化
description: Claude Code 性能优化策略，涵盖并行处理、上下文管理、Token 优化和效率提升技巧
---

# 性能优化

充分利用 Claude Code 的性能特性，可以将开发效率提升数倍。本文介绍从个人到团队级别的性能优化策略。

---

## 并行处理（Parallelism）

Claude Code 的最大特点是支持真正的并行工作流，让你像指挥多个工程师团队一样工作。

### 终端"多线程"：同时运行多个 Claude 实例

在多个终端标签页中同时运行 Claude，实现真正的并行开发：

```bash
# 终端 1：负责前端功能
claude "实现用户登录页面的 UI 组件"

# 终端 2：负责后端 API
claude "实现用户认证的 REST API 端点"

# 终端 3：负责测试
claude "为用户认证模块编写集成测试"

# 终端 4：负责文档
claude "更新 API 文档，添加认证相关章节"

# 终端 5：负责 DevOps
claude "配置 GitHub Actions 自动化测试流水线"
```

**配置系统通知，及时知晓任务完成：**

```bash
# 在 .claude/settings.json 中启用通知
{
  "notifications": {
    "enabled": true,
    "onTaskComplete": true,
    "sound": "Glass",
    "playSound": true
  }
}
```

:::tip 5 个实例的黄金法则
实践表明，同时管理 5 个 Claude 实例是最佳平衡点：注意力可以有效分配，任务切换成本可控，且能充分利用等待 I/O 的时间。超过 8 个实例后，管理成本会超过收益。
:::

---

### 本地与云端"混合双打"

结合本地终端实例和网页端会话，实现更大规模的并行：

```
本地终端 (5 个实例)          网页端 (5-10 个会话)
├── 实例 1: 核心功能           ├── 会话 1: 需要视觉反馈的 UI
├── 实例 2: 数据库迁移         ├── 会话 2: 复杂的架构设计讨论
├── 实例 3: 单元测试           ├── 会话 3: 代码审查
├── 实例 4: 文档更新           ├── 会话 4: 性能分析
└── 实例 5: CI/CD 配置        └── 会话 5-10: 其他任务
```

**使用 `&` 命令将任务转移到网页端：**

```bash
# 在本地终端中触发转移
# 当需要更多上下文或视觉能力时，输入：
&

# Claude 会自动生成一个链接，在浏览器中继续当前对话
# 网页端支持：图片上传、更大的上下文窗口、Artifacts 功能
```

**使用 teleport 将网页端任务拉回本地：**

```bash
# 获取网页会话的 teleport 链接
# 在网页端点击"Export to CLI"或使用 --teleport 参数

claude --teleport <session-id>

# 拉回后，所有上下文保留，可以继续在本地终端执行 Bash 命令
```

---

### 跨设备同步：无缝切换工作场所

利用 Claude Code 的会话持久化特性，在不同设备间无缝切换：

```
办公室（上午）→ 手机（通勤）→ 家里（晚上）

办公室：
  claude --session work-session-20250217
  # 深度开发，运行测试

通勤手机：
  # 打开 Claude 网页端
  # 继续之前的会话，review 代码，规划下一步

家里：
  claude --resume work-session-20250217
  # 无缝继续，所有上下文完整保留
```

:::info 会话持久化的价值
一个精心维护的长期会话，比每次重新开始的短对话效率高 3-5 倍，因为 Claude 已经深度理解你的项目上下文。
:::

---

## 上下文管理

有效管理上下文是避免性能退化的关键。随着对话增长，Claude 需要处理更多 Token，响应变慢且质量下降。

### 上下文管理命令速查

| 命令 | 作用 | 适用场景 |
|------|------|----------|
| `/compact` | 压缩历史，保留关键摘要 | 对话过长但需继续 |
| `/clear` | 清除所有上下文 | 切换到全新任务 |
| `/context` | 查看当前上下文使用量 | 监控 Token 消耗 |
| `/export` | 导出对话记录 | 备份重要对话 |

### 最佳上下文管理策略

```bash
# 1. 定期监控上下文使用量
/context
# 输出示例：
# Context: 45,230 / 200,000 tokens (22.6%)
# ⚠️ 建议：超过 50% 时使用 /compact

# 2. 在任务边界使用 /compact
# 完成一个功能模块后：
/compact
# Claude 会保留关键决策和代码变更摘要，清理冗余的对话历史

# 3. 切换到全新任务时使用 /clear
/clear
# 然后用精确的 @引用 重建必要的上下文

# 4. 定期导出重要对话
/export --format markdown --output ./docs/session-2025-02-17.md
```

---

## Token 优化

合理的 Token 使用策略既能降低成本，又能提升响应质量。

### Token 优化对比表

| 优化技巧 | 说明 | 节省效果 | 实施难度 |
|----------|------|----------|----------|
| `@` 精确引用 | 只加载需要的文件，避免加载整个项目 | 30-50% | 低 |
| `/compact` 定期清理 | 保留摘要清理历史，减少冗余 Token | 40-60% | 低 |
| 避免重复加载 | 检查 `/context` 确认文件是否已加载 | 20-30% | 低 |
| Subagents 并行处理 | 并行减少串行上下文积累 | 50-70% | 中 |
| 精简提示词 | 去除冗余描述，使用结构化格式 | 15-25% | 中 |
| 选择合适模型 | 简单任务用轻量模型 | 60-80% | 低 |

### 实际 Token 使用对比

```bash
# 低效方式（浪费 Token）
"请帮我优化这个项目的性能"
# 问题：Claude 不知道引用哪些文件，可能加载大量不相关内容

# 高效方式（精准引用）
"请优化 @src/services/DataProcessor.ts 中 processLargeDataset 方法的性能，
 参考 @src/utils/cache.ts 中已有的缓存实现"
# 优势：精确指定文件，Claude 直接处理相关内容
```

---

## 效率提升技巧

### 键盘快捷键速查

| 快捷键 | 功能 | 使用场景 |
|--------|------|----------|
| `Ctrl+R` | 反向搜索历史命令 | 快速找到之前用过的复杂提示词 |
| `Ctrl+S` | 暂存当前提示词草稿 | 写到一半需要先执行其他命令 |
| `Tab` | 智能补全文件路径和命令 | 快速引用文件 |
| `Enter` | 智能换行（多行输入） | 编写结构化的长提示词 |
| `Shift+Enter` | 提交当前输入 | 多行提示词完成后提交 |
| `Ctrl+C` | 中断当前响应 | Claude 方向偏差时立即叫停 |
| `Shift+Tab` × 2 | 切换到 Plan 模式 | 进入规划阶段 |

### 会话管理命令

```bash
# 继续上次会话（自动选择最近的）
claude --continue

# 恢复指定会话
claude --resume <session-id>

# 列出所有历史会话
claude --list-sessions

# 重命名会话（方便后续查找）
/rename "feat-user-auth-2025-02-17"

# 在新标签页中恢复会话
/resume <session-id>

# 将当前会话传送到浏览器
--teleport
```

### 状态栏与监控

```bash
# 自定义状态栏显示（在 settings.json 中配置）
{
  "statusline": {
    "show": true,
    "items": ["model", "context", "cost", "session"]
  }
}

# 查看可视化上下文分布
/context
# 显示各类内容（代码、对话、系统提示）占用的 Token 分布

# 查看本次会话统计
/stats
# 显示：总 Token 用量、输入/输出比例、平均响应时间

# 查看 Token 消耗和费用
/usage
# 显示：今日消耗、本月消耗、按模型分类的费用
```

---

## 文件引用技巧

精确的文件引用是高效使用 Claude Code 的核心技能。

### 引用语法速查

```bash
# 引用单个文件
@src/auth.ts

# 引用整个目录（包含所有文件）
@src/components/

# 同时引用多个文件
@src/auth.ts @src/user.ts @src/types/index.ts

# 引用 MCP 服务器资源
@mcp:github                  # GitHub 仓库
@mcp:github:issues           # GitHub Issues 列表
@mcp:github:pr/123           # 特定 PR

# 模糊匹配（Claude 自动查找最相关的文件）
@auth                        # 匹配所有包含 "auth" 的文件
@UserService                 # 匹配 UserService 相关文件
```

### 高级引用技巧

```bash
# 引用文件的特定行范围
@src/auth.ts:45-120

# 引用并指定上下文
"请重构 @src/auth.ts 中的 authenticate 方法，
 参考 @src/utils/encryption.ts 的加密工具，
 确保与 @src/types/user.ts 中的类型定义保持一致"

# 批量引用同类文件
@src/services/          # 引用所有 service 文件
@tests/unit/auth/       # 引用特定测试目录

# 引用配置文件
@.env.example           # 引用环境变量示例
@package.json           # 引用包配置
@tsconfig.json          # 引用 TypeScript 配置
```

:::warning 避免过度引用
不要一次性引用整个 `@src/` 目录，这会消耗大量 Token 并降低 Claude 的聚焦度。精确引用 2-5 个最相关的文件，效果远好于引用整个项目。
:::

---

## 即时 Bash 执行

使用 `!` 前缀，直接在 Claude 对话中执行 Bash 命令，无需切换终端：

```bash
# 查看 Git 状态
!git status

# 运行测试
!npm test

# 运行特定测试文件
!npm test -- --testPathPattern=auth --verbose

# 查看进程
!ps aux | grep node

# 构建项目
!npm run build

# 查看日志
!tail -f logs/app.log

# 检查端口占用
!lsof -i :3000

# 数据库查询（需要配置好连接）
!npm run db:query "SELECT COUNT(*) FROM users"
```

**Bash 执行的高级用法：**

```bash
# 组合命令：构建并部署
!npm run build && npm run deploy

# 后台执行（不阻塞 Claude 继续工作）
!npm start &

# 查看 Claude 执行的命令历史
!history | grep "npm test"
```

:::tip Bash 执行的妙用
在 Claude 生成代码后，立即用 `!npm test` 运行测试，Claude 可以看到测试输出，自动修复失败的测试。这是实现自动化验证闭环最简单的方式。
:::

---

## 性能优化总结

### 效率提升路线图

```
初级用户 (1x 效率)
  └── 使用基础对话完成任务

中级用户 (3x 效率)
  ├── 掌握 @引用 精确上下文
  ├── 使用 /compact 管理上下文
  └── 熟练使用键盘快捷键

高级用户 (5-8x 效率)
  ├── 多实例并行工作流
  ├── 本地+云端混合策略
  ├── Subagents 自动化流水线
  └── 跨设备无缝切换

专家用户 (10x+ 效率)
  ├── 全自动化 CI/CD 集成
  ├── 自定义 Agent 网络
  ├── MCP 深度集成
  └── 组织级工作流标准化
```

| 优化维度 | 初级技巧 | 进阶技巧 | 专家技巧 |
|----------|----------|----------|----------|
| 并行度 | 1 个实例 | 3-5 个实例 | 10+ 混合实例 |
| 上下文管理 | 手动 /clear | 定期 /compact | 自动化管理策略 |
| Token 效率 | 无优化 | @精确引用 | Subagents 并行 |
| 设备利用 | 单设备 | 双设备 | 跨设备 + 云端 |
