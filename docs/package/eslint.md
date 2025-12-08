下面我给你一套 **适用于 Electron + Vite + Vue3 + TypeScript 项目** 的 **最新 ESLint 完整配置（2025 最优解）**，直接可用、零踩坑。

这套配置包含：

- Vue3 + TS 最佳实践
- Vite 支持
- Electron 支持
- Prettier 自动格式化
- 兼容 Husky + lint-staged

你只需要 **复制这些命令和文件** 就能用。

---

# ✅ 1. 安装 ESLint + Prettier 必备依赖

### 使用 pnpm（推荐）

```bash
pnpm add -D eslint @eslint/js \
    typescript \
    @typescript-eslint/parser @typescript-eslint/eslint-plugin \
    eslint-plugin-vue \
    eslint-plugin-prettier eslint-config-prettier \
    prettier \
    eslint-plugin-import \
    eslint-plugin-node \
    eslint-plugin-promise
```

如果你的项目是 Electron，还建议：

```bash
pnpm add -D eslint-plugin-n
```

---

# ✅ 2. 创建 ESLint 配置文件（2025 最新 flat config）

### 新建：**eslint.config.js**

> Flat Config 是 ESLint 9+ 官方推荐格式（取代 `.eslintrc`）

复制下面完整内容：

```js
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import vue from "eslint-plugin-vue";
import prettier from "eslint-plugin-prettier";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{js,ts,vue}"],
    ignores: ["dist", "node_modules"],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint,
      vue,
      prettier,
    },
    extends: [
      "plugin:vue/vue3-recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended",
    ],
    rules: {
      // 你的项目应该常用的规则
      "prettier/prettier": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn"],
      "vue/multi-word-component-names": "off",
      "vue/no-mutating-props": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
```

---

# ✅ 3. 创建 Prettier 配置

### 新建：**prettier.config.cjs**

```js
module.exports = {
  semi: false,
  singleQuote: true,
  arrowParens: "avoid",
  trailingComma: "none",
  printWidth: 100,
  tabWidth: 2,
};
```

---

# ✅ 4.（可选）创建 `.prettierignore`

```
dist
node_modules
*.log
```

---

# ✅ 5. 在 package.json 添加脚本

```json
{
  "scripts": {
    "lint": "eslint --max-warnings=0 .",
    "format": "prettier --write ."
  }
}
```

---

# ✅ 6. 配置 lint-staged（如果你用 Husky）

在 `package.json` 添加：

```json
{
  "lint-staged": {
    "*.{js,ts,vue}": "pnpm exec eslint --fix",
    "*.{json,md,yml,yaml}": "pnpm exec prettier --write"
  }
}
```

---

# 🚀 7. 使用 Husky 的 pre-commit

`.husky/pre-commit`：

```sh
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm exec lint-staged
```

---

# ✨ 至此，你的项目已经有了：

- ESLint（TS + Vue3 最佳）
- Prettier（自动格式化）
- lint-staged（只 lint 改动的文件）
- Husky（提交前强制 lint）

这是 **2025 年最稳、兼容性最强** 的前端工程质量方案。

---

# 📌 如果你愿意，我还可以帮你：

✔ 自动生成 **Electron 主进程专用 ESLint 配置（带 node/electron rules）**
✔ 自动生成 **Renderer 与 Main 目录分离校验规则**
✔ 如果你贴出你的项目结构，我可以为你生成一套 **完全定制化 lint 方案**

需要继续优化吗？
