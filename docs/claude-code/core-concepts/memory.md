---
sidebar_position: 7
title: Memory（自动记忆）
description: Claude Code 的跨会话记忆机制——让 AI 在每次新对话中都能记住你的习惯、项目约定和历史经验
---

# Memory（自动记忆）

## 什么是 Memory

Claude Code 的 Memory 系统允许 AI 在会话之间**持久化关键信息**。不同于 `CLAUDE.md` 由开发者手动维护，Memory 是 Claude Code **主动积累**的学习记录——当你纠正它的行为、给出反馈或明确要求"记住"某件事时，Claude Code 会将这些经验写入记忆文件，供下次会话自动读取。

:::info 和 CLAUDE.md 的区别
| 特性 | CLAUDE.md | Memory |
|------|-----------|--------|
| 由谁维护 | 开发者手动编写 | Claude Code 自动写入 |
| 内容类型 | 项目规范、架构说明 | 个人习惯、纠正记录、偏好 |
| 作用域 | 项目级（纳入 Git） | 用户级（本地私有） |
| 格式 | 任意 Markdown | 简洁的条目式记录 |
:::

---

## 记忆文件位置

Claude Code 将记忆文件存储在：

```
~/.claude/projects/<project-path-hash>/memory/
├── MEMORY.md        # 主记忆文件（自动加载到每次对话）
├── patterns.md      # 代码模式与架构约定
├── debugging.md     # 调试经验与已知问题
└── preferences.md   # 个人偏好设置
```

**主记忆文件 `MEMORY.md` 的内容会自动注入到每次会话的系统提示中**，无需你做任何操作。其他话题文件作为扩展存储，MEMORY.md 可以链接到它们。

:::warning MEMORY.md 长度限制
MEMORY.md 超过 200 行时，超出部分会被截断。保持简洁，将详细内容放在子话题文件中，从 MEMORY.md 链接过去。
:::

---

## 让 Claude 记住信息

### 方式一：明确指令

在对话中直接告诉 Claude Code 要记住什么：

```
记住：这个项目使用 pnpm 而不是 npm，以后所有安装命令都用 pnpm
```

```
记住：不要自动提交 Git，每次都等我确认
```

```
记住：数据库模型文件在 src/db/models/ 而不是 src/models/
```

Claude Code 会将这些信息写入 `MEMORY.md`，下次会话自动生效。

### 方式二：纠正后让它记录

当 Claude Code 犯了某类错误时，纠正完后告诉它记录下来：

```
用户：你刚才把测试文件放到了 test/ 目录，我们项目的测试统一放在 __tests__/ 里。
      以后记住这个规则。

Claude：好的，已记录到 MEMORY.md：
        "测试文件统一放置在 __tests__/ 目录，而非 test/"
```

### 方式三：结束会话时整理

在完成一个复杂任务后，让 Claude 总结并保存关键发现：

```
我们刚才解决了这个数据库连接问题，把关键原因和解决方法记录到记忆里，
以后遇到类似问题可以直接参考。
```

---

## 查看和管理记忆

### 查看当前记忆内容

```bash
# 直接读取记忆文件
cat ~/.claude/projects/<hash>/memory/MEMORY.md

# 或者在 Claude Code 中询问
"你的记忆里有哪些关于这个项目的内容？"
```

### 删除错误的记忆

```
请从记忆中删除关于"使用 npm"的条目，我们已经换成 pnpm 了
```

Claude Code 会找到并移除对应的记忆条目。

### 手动编辑记忆文件

记忆文件是普通的 Markdown 文件，可以直接用文本编辑器修改：

```bash
# 用 vim 编辑主记忆文件
vim ~/.claude/projects/<hash>/memory/MEMORY.md
```

---

## 记忆文件的最佳实践

### 高质量 MEMORY.md 示例

```markdown
# 项目记忆

## 技术栈约定
- 包管理器：pnpm（不用 npm 或 yarn）
- 测试框架：vitest（不是 jest）
- 样式方案：CSS Modules + Tailwind（不用 styled-components）

## 目录约定
- 测试文件：__tests__/ 而非 test/
- 工具函数：lib/ 而非 utils/
- 类型定义：types/ 目录，不在组件文件内定义

## 工作流偏好
- 不自动提交 Git，每次变更等我确认
- 每次修改重要文件前先说明计划
- 代码审查发现问题时列成清单而不是逐一输出

## 项目特殊情况
- src/generated/ 目录下的文件是自动生成的，不要手动修改
- 数据库迁移需要人工审查，不要自动执行 migrate
- API 端点文档在 docs/api.md，修改 API 时同步更新

## 已知问题与解决方案
→ 详见 debugging.md
```

### 组织记忆的原则

:::tip 记忆管理建议
1. **记稳定的约定**：经常变化的信息不适合放记忆里
2. **用简洁条目**：一行一条，方便快速读取
3. **分类存储**：主文件保持简短，详情放子文件
4. **定期清理**：项目架构大调整后，清理过时的记忆条目
5. **不存敏感信息**：API Key、密码等绝对不要写入记忆文件
:::

---

## Memory vs CLAUDE.md 的协同使用

两者定位不同，应该配合使用：

```
CLAUDE.md（团队共享）              MEMORY.md（个人私有）
───────────────────                ─────────────────────
项目架构说明           ←→          个人操作偏好
代码规范（团队约定）    ←→          已学到的教训
构建命令               ←→          纠正记录
API 文档               ←→          项目特殊情况发现
```

**实际场景示例：**

- 你发现某个模块有一个隐藏的初始化依赖关系 → 写入 MEMORY.md（个人发现）
- 团队决定统一使用某个代码规范 → 写入 CLAUDE.md（团队共享）
- 你偏好让 Claude 每次修改前先输出计划 → 写入 MEMORY.md（个人偏好）
- 项目切换到新的测试框架 → 更新 CLAUDE.md（项目变更）

---

## 跨项目全局记忆

除了项目级记忆，Claude Code 还支持全局用户级记忆：

```
~/.claude/CLAUDE.md    # 全局 CLAUDE.md，对所有项目生效
```

你的个人偏好（如"总是用中文回复"、"不在代码里加注释"）可以写在全局 CLAUDE.md 中，而不是每个项目都重复设置。

```markdown
<!-- ~/.claude/CLAUDE.md 示例 -->

## 我的全局偏好
- 始终用中文回复
- 不主动生成文档文件，除非我明确要求
- 每次危险操作（删文件、改配置）前先确认
- 代码示例使用实际的变量名，不用 foo/bar
```

:::info 记忆加载优先级
全局 CLAUDE.md → 项目 CLAUDE.md → 子目录 CLAUDE.md → 项目 MEMORY.md

越靠后的配置优先级越高，项目特定设置会覆盖全局设置。
:::
