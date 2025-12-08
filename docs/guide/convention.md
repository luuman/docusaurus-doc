# 项目规范

## **（命名规范 + 目录结构）**

---

# 1. 命名规范（Naming Conventions）

为保证跨平台一致性（Windows/macOS/Linux）、避免 CI 构建问题、提升可维护性，项目采用以下命名规范。

---

## 1.1 文件夹命名（强制）

### ✅ 必须使用 **kebab-case（小写 + 中划线）**

示例：

```
src/
src/main/
src/renderer/
src/preload/
src/components/
src/utils/
electron-builder/
dist-electron/
```

#### **为什么不用驼峰？**

- Linux 路径大小写敏感，容易引发 “module not found”
- Git 无法区分大小写变更导致合并冲突
- 构建工具对大小写敏感（Vite / Rollup）
- Electron，与路径相关的 NodeAPI 全是大小写敏感

---

## 1.2 文件命名

### JS/TS/Vue 文件：**kebab-case**

```
user-service.ts
app-menu.ts
main-window.vue
```

### Types / Interfaces：**PascalCase**

```
UserProfile.ts
IMsgPayload.ts
```

---

## 1.3 Class / 枚举命名

### 使用 **PascalCase**

```
class RequestManager {}
enum LoginState {}
```

---

## 1.4 变量命名

### 使用 **camelCase（驼峰）**

```
const userInfo = {}
let isConnected = false
```

---

## 1.5 常量

### 使用 **UPPER_SNAKE_CASE**

```
const API_TIMEOUT = 15000
```

---

## 1.6 Git 分支命名

```
feature/xxx
bugfix/xxx
hotfix/xxx
release/v1.0.0
```

---

## 1.7 环境变量命名

全部大写、下划线连接：

```
VITE_APP_ENV=development
VITE_API_BASE=https://api.xxx.com
```

---

# 2. 目录结构规范（Directory Structure）

适用于单窗口 / 多窗口 Electron + Vite 项目。

---

# 2.1 顶层目录结构

```
project-root/
├── src/
│   ├── main/                # Electron 主进程
│   ├── preload/             # 预加载脚本
│   ├── renderer/            # 渲染进程（页面）
│   ├── components/          # 前端通用组件
│   ├── assets/              # 静态资源
│   ├── utils/               # 工具函数
│   ├── services/            # 网络请求 / 业务逻辑
│   ├── store/               # Pinia / 状态管理
│   ├── types/               # 类型定义
│   └── styles/              # 样式（CSS / SCSS）
│
├── build/                   # 构建脚本（自定义脚本）
├── configs/                 # Vite / Electron / 环境配置
├── dist/                    # Web 构建产物
├── dist-electron/           # Electron 打包产物
├── release/                 # electron-builder 打包输出目录
│
├── public/                  # 公共静态资源
├── scripts/                 # Node 脚本工具（如 rimraf、同步版本）
│
├── package.json
└── electron-builder.yml     # 打包配置
```

---

# 2.2 主进程目录结构

```
src/main/
├── index.ts               # 主入口
├── windows/
│   ├── main-window.ts
│   ├── settings-window.ts
│   └── about-window.ts
├── ipc/
│   ├── app-ipc.ts
│   ├── file-ipc.ts
│   └── system-ipc.ts
├── menu/
│   ├── app-menu.ts
│   └── tray-menu.ts
├── security/
│   ├── certificate.ts      # SSL pinning / 证书校验
│   ├── sandbox.ts
│   └── permission.ts
└── utils/
    ├── logger.ts
    └── path-helper.ts
```

---

# 2.3 渲染进程目录结构

```
src/renderer/
├── app/                    # 多页面入口，支持多窗口
│   ├── main/
│   ├── settings/
│   └── login/
├── components/
├── hooks/
├── store/
├── services/
├── pages/
├── router/
└── styles/
```

---

# 2.4 Preload 目录结构

```
src/preload/
├── index.ts
├── api/
│   ├── file-api.ts
│   ├── system-api.ts
│   └── app-api.ts
└── types/
    └── preload.d.ts
```

---

# 3. 脚本规范（Scripts）

```
"scripts": {
  "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
  "dev:vite": "vite --config configs/vite.config.ts",
  "dev:electron": "wait-on http://localhost:5173 && electron .",
  "clean": "rimraf dist dist-electron release",
  "build": "npm run clean && vite build",
  "build:electron": "electron-builder",
  "build:all": "npm run build && npm run build:electron"
}
```

---

# 4. 统一代码风格（建议）

- ESLint：airbnb + @typescript-eslint
- Prettier：2 空格缩进，单引号，分号
- Husky：commit 规范检查
- Commitlint：遵循 Conventional Commits

---

# 5. 加分项（可选但强烈推荐）

- 提供 `docs/project-structure.md`
- 提供 `docs/naming-rules.md`
- 在仓库根目录放 `CONTRIBUTING.md`

---

# 🎁 如果你愿意，我可以继续帮你：

### ✔ **把上述文档生成成 Markdown 文件**

### ✔ **根据你的项目结构自动生成实际目录结构图（tree）**

### ✔ **把你的 package.json scripts 整理成最佳实践版本**

需要导出成 Markdown 文件（可直接放进 docs）吗？
