## husky

### 安装 Husky

```bash
pnpm dlx husky-init && pnpm install
```

执行后效果：

- 自动创建 `.husky/` 目录
- 自动创建 `.husky/pre-commit` hook
- 自动在 `package.json` 中加入：

```json
"scripts": {
  "prepare": "husky"
}
```

---

### 2. 启用 Git hooks

如果你项目是从别处 clone 下来的，需要执行：

```bash
git config core.hooksPath .husky
```

> 通常 `husky-init` 已经做了，不需要重复。

---

### 3. 配置 Pre-commit Hook（常用：ESLint + Prettier + Lint-staged）

### 安装 lint-staged

```bash
pnpm add -D lint-staged
```

### 在 `package.json` 添加：

```json
{
  "lint-staged": {
    "*.{js,ts,vue,json,md}": ["eslint --fix", "prettier --write"]
  }
}
```

---

### 修改 `.husky/pre-commit`：

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged
```

给予执行权限（如果需要）：

```bash
chmod +x .husky/pre-commit
```

---

### 4. 添加 commit-msg Hook（配合 commitlint）

如果你想规范 commit：

```bash
pnpm add -D @commitlint/{config-conventional,cli}
```

创建新 hook：

```bash
pnpm dlx husky add .husky/commit-msg "pnpm commitlint --edit \$1"
```

创建 commitlint 配置：

`commitlint.config.js`：

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
```

---

### 5. 完整推荐目录结构

```
project/
  ├─ .husky/
  │   ├─ pre-commit
  │   ├─ commit-msg
  │   └─ _/
  ├─ src/
  ├─ package.json
  ├─ pnpm-lock.yaml
  └─ ...
```
