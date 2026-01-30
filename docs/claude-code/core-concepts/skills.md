---
sidebar_position: 1
title: Skills（技能包）
description: Skills 是 Claude Code 的预封装工作流，用完即走，不占用上下文窗口
---

# Skills（技能包）

## 什么是 Skills

Skills 是 Claude Code 中预先封装好的工作流模块。每个 Skill 包含一组特定领域的提示词、工具调用逻辑和最佳实践，**用完即走，不会持续占用上下文窗口**。

:::info 核心特性
Skills 的设计理念是"按需加载"：只在需要时注入到对话中，任务完成后自动卸载，不产生长期的上下文负担。
:::

Skills 与普通提示词的区别在于：

| 特性 | 普通提示词 | Skills |
|------|-----------|--------|
| 上下文占用 | 持续占用 | 用完释放 |
| 可复用性 | 低 | 高 |
| 标准化程度 | 无 | 有版本管理 |
| 分发方式 | 手动复制 | npm/本地安装 |
| 维护成本 | 高 | 低 |

---

## 官方 Skills 库

官方 Skills 托管在 GitHub：**https://github.com/anthropics/skills**

### 常用官方 Skills

| Skill 名称 | 用途 | 适用场景 |
|-----------|------|---------|
| `frontend-design` | 前端 UI 设计与实现 | React/Vue 组件开发 |
| `doc-coauthoring` | 文档协作撰写 | 技术文档、API 文档 |
| `canvas-design` | 画布交互设计 | 图形编辑器、白板应用 |
| `pdf` | PDF 生成与处理 | 报告生成、文档导出 |
| `algorithmic-art` | 算法艺术生成 | 可视化、创意编程 |

---

## 安装官方 Skills

使用 `npx skills-installer` 安装官方 Skills：

```bash
# 安装前端设计 Skill
npx skills-installer install @anthropics/claude-code/frontend-design --client claude-code

# 安装文档协作 Skill
npx skills-installer install @anthropics/claude-code/doc-coauthoring --client claude-code

# 安装画布设计 Skill
npx skills-installer install @anthropics/claude-code/canvas-design --client claude-code

# 安装 PDF 处理 Skill
npx skills-installer install @anthropics/claude-code/pdf --client claude-code

# 安装算法艺术 Skill
npx skills-installer install @anthropics/claude-code/algorithmic-art --client claude-code
```

安装完成后，Skills 会保存到 `~/.claude/skills/` 目录。

### 查看已安装的 Skills

在 Claude Code 中运行：

```
/skills
```

这会列出所有已安装的 Skills 及其描述。

---

## 自定义 Skill 创建

你可以创建自己的 Skill 来封装团队特有的工作流。

### 目录结构

```
my-skill/
├── skill.json        # Skill 元数据配置
├── skill.md          # Skill 核心提示词和说明
├── api/              # API 接口定义（可选）
│   └── endpoints.md
└── tools/            # 自定义工具定义（可选）
    └── custom-tool.js
```

### skill.json 示例

```json
{
  "name": "my-custom-skill",
  "description": "团队代码审查与优化工作流",
  "version": "1.0.0",
  "author": "Your Name <you@example.com>",
  "categories": [
    "code-review",
    "optimization",
    "best-practices"
  ],
  "license": "MIT",
  "skill": {
    "file": "skill.md",
    "description": "执行标准化的代码审查流程，包括性能分析、安全检查和代码风格验证"
  }
}
```

### skill.md 示例

```markdown
# 代码审查专家

## 职责
你是一位经验丰富的代码审查专家，负责对提交的代码进行全面审查。

## 审查流程

### 第一步：代码质量
- 检查命名规范是否符合团队标准
- 验证函数/方法的单一职责原则
- 确认没有重复代码（DRY 原则）

### 第二步：安全审查
- 检查 SQL 注入风险
- 验证输入数据的合法性
- 确认敏感信息没有硬编码

### 第三步：性能分析
- 识别潜在的 N+1 查询问题
- 检查不必要的循环嵌套
- 评估内存使用是否合理

## 输出格式
以 Markdown 格式输出审查报告，包含：
- 总体评分（1-10）
- 问题列表（按严重程度排序）
- 改进建议
- 优点总结
```

---

## 安装自定义 Skill

### 方法一：直接复制

```bash
# 将自定义 Skill 复制到 Claude Code 的 Skills 目录
cp -r my-skill ~/.claude/skills/
```

### 方法二：通过安装器

```bash
# 从本地路径安装
npx skills-installer install ./my-skill --client claude-code

# 从 GitHub 仓库安装（需要仓库包含 skill.json）
npx skills-installer install github:your-org/your-skill --client claude-code
```

:::tip 最佳实践
将团队共用的 Skills 托管在私有 Git 仓库中，通过 `npx skills-installer` 统一安装，确保团队成员使用一致的工作流版本。
:::

---

## 使用 Skills

安装后，在 Claude Code 对话中直接调用：

```
/skills my-custom-skill
```

或者在对话中自然地描述需求，Claude Code 会自动匹配合适的 Skill：

```
请帮我用代码审查 Skill 审查这个文件...
```

:::warning 注意事项
Skills 在使用期间会占用上下文空间，但任务完成后会自动释放。如果对话中同时使用多个 Skills，可能会增加上下文压力，建议按需逐一使用。
:::

---

## Skills 生命周期

```
调用 Skill → 注入提示词到上下文 → 执行工作流 → 任务完成 → 上下文释放
```

Skills 的无状态设计使其非常适合以下场景：
- **一次性分析任务**：代码审查、文档生成
- **批量处理**：多文件格式化、批量翻译
- **专业领域工作**：需要特定领域知识的任务
