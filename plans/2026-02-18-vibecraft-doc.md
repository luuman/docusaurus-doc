# VibeCraft 文档 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `docs/claude-code/advanced-features/vibecraft.md` 创建一页完整的 VibeCraft 安装与使用手册

**Architecture:** 单页文档，涵盖简介、系统要求、安装、快速上手、功能使用手册（3D 工坊、多实例、语音输入、Draw Mode）、快捷键参考、CLI 命令、常见问题排查。风格与现有 advanced-features 文档一致（中文、Docusaurus admonitions、表格、代码块）。

**Tech Stack:** Docusaurus MDX, Markdown

---

### Task 1: 创建 vibecraft.md 文档

**Files:**
- Create: `docs/claude-code/advanced-features/vibecraft.md`

**Step 1: 编写文档**

frontmatter:
```yaml
---
sidebar_position: 6
title: VibeCraft — Claude Code 3D 可视化
description: 用 VibeCraft 在浏览器中实时查看 Claude Code 的工作状态，支持 3D 工坊可视化、多实例管理和语音输入
---
```

文档章节：
1. 简介（工具是什么、能做什么）
2. 系统要求（Node.js 18+、jq、tmux）
3. 安装（4 步：安装依赖 → setup → 启动服务器 → 打开浏览器）
4. 3D 工坊：各工作站说明（Bookshelf/Read, Desk/Write, Workbench/Edit, Terminal/Bash, Scanner/Grep+Glob, Antenna/WebFetch+WebSearch, Portal/Task, Taskboard/TodoWrite）
5. 多实例管理（Multi-clauding）
6. 语音输入（Deepgram API 配置）
7. Draw Mode 绘制模式
8. 键盘快捷键完整表
9. CLI 命令参考
10. 常见问题排查

**Step 2: 验证文档**

检查 Docusaurus 能否正常渲染（本地 `pnpm run start` 或直接检查 mdx 语法）

**Step 3: Commit**

```bash
git add docs/claude-code/advanced-features/vibecraft.md
git commit -m "docs: add VibeCraft installation and user manual"
```
