# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 Docusaurus 3.9 的文档站点，目标是**以主题化方式**高保真还原 [docs.brainboard.co](https://docs.brainboard.co/) 的 GitBook 风格。文档源内容位于 `docs.brainboard.co/`（已抓取的 HTML 快照），经转换后放入 `docs/` 供 Docusaurus 渲染。

技术栈：React 19 + TypeScript + Docusaurus 3 (classic preset) + Mermaid + 本地搜索

## 开发命令

```bash
npm start          # 开发服务器 (默认中文 locale)
npm run build      # 生产构建
npm run serve      # 预览生产构建
npm run typecheck  # TypeScript 类型检查
npm run clear      # 清除 Docusaurus 缓存（构建异常时使用）

# GitBook → Docusaurus 语法转换（一次性，处理 docs/ 下所有 .md）
node scripts/convert-gitbook.js
```

## 架构要点

### 主题定制层（Swizzle）

通过 `src/theme/` 覆盖 Docusaurus 默认组件，实现 Brainboard 风格：

- **`Navbar/`** — 自定义顶栏：左侧 logo + 中央搜索 + 右侧导航，无默认 nav items
- **`SearchBar/`** — 包裹原始搜索组件，添加搜索图标 + `⌘K` 快捷键提示
- **`DocSidebar/Desktop/`** — 在侧栏底部追加亮/暗主题切换按钮

### 样式系统（两层 CSS）

1. **`src/css/custom.css`** — 全局主题变量 + 侧栏图标系统 + 组件覆盖
   - 亮/暗双主题色彩体系（主色 `#714EFF` / `#9D80FF`）
   - 侧栏图标使用 CSS mask + SVG data URI 技术（类似 GitBook 的 `gb-icon`）
   - 侧栏分区标题通过 `.sidebar-section-header` 类实现大写不可点击样式
   - 每个侧栏项通过 `className: "sidebar-item-icon icon-{name}"` 绑定图标
2. **`src/css/brainboard-prose.css`** — 文档内容排版样式，覆盖 `.markdown` 下的 h1-h6、代码块、表格、blockquote、admonition 等

### 内容管道

- **源数据**：`docs.brainboard.co/` — 抓取的 Brainboard 文档 HTML 快照
- **转换脚本**：`scripts/convert-gitbook.js` — 将 GitBook 特有语法（`{% hint %}`, `{% embed %}`, `{% tabs %}` 等）转为 Docusaurus 兼容格式
- **rehype 插件**：`src/plugins/rehype-fix-style.js` — 将 HTML 内联 `style="..."` 字符串转换为 React 兼容的 style 对象（解决 GitBook 源文档的 SSR 兼容问题）
- **Markdown 格式**：配置为 `detect` 模式，`.md` 文件使用 CommonMark（非 MDX），以兼容 GitBook 源文档中的原始 HTML

### 侧栏结构

`sidebars.ts` 完整映射了 Brainboard 文档的目录结构，分为以下大节：Getting Started → Cloud Design → Data → Automation → Settings → Security → Help & FAQ → Changelog。每个条目通过 `className` 指定图标。

### 国际化

配置了 `zh`（默认）和 `en` 两个 locale，部署目标为 GitHub Pages (`luuman.github.io/docusaurus-doc/`)。

## 关键约定

- 文档文件使用 `.md` 扩展名（CommonMark），不要使用 `.mdx`（避免 GitBook 源 HTML 的 JSX 兼容问题）
- 添加新侧栏图标时，在 `custom.css` 中添加对应的 `.icon-{name}::before` CSS mask 规则
- 暗色主题为默认主题（`colorMode.defaultMode: 'dark'`）
- `onBrokenLinks` 和 `onBrokenMarkdownLinks` 设为 `warn`（迁移期间容忍断链）
