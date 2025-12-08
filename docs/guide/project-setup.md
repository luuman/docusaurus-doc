# 创建项目

我们可以使用下面命令，利用 create-tauri-app 创建一个新的项目

| 环境       | 命令                                                               |
| ---------- | ------------------------------------------------------------------ |
| Bash       | `sh <(curl https://create.tauri.app/sh)`                           |
| PowerShell | `irm https://create.tauri.app/ps \| iex`                           |
| npm        | `npm create tauri-app@latest`                                      |
| Yarn       | `yarn create tauri-app`                                            |
| pnpm       | `pnpm create tauri-app`                                            |
| Deno       | `deno run -A npm:create-tauri-app`                                 |
| Bun        | `bun create tauri-app`                                             |
| Cargo      | `cargo install create-tauri-app --locked` `cargo create-tauri-app` |

## 创建

```bash
# 快速创建项目
$ yarn create tauri-app
```

```bash
yarn create v1.22.22
[1/4] 🔍  Resolving packages...
[2/4] 🚚  Fetching packages...
[3/4] 🔗  Linking dependencies...
[4/4] 🔨  Building fresh packages...

success Installed "create-tauri-app@4.5.7" with binaries:
      - create-tauri-app
[####] 4/4? Project name (tauri-app) › tauri-app # 项目名称
✔ Project name · tauri-app
? Identifier (com.tauri-app.app) › com.tauri-app.app # 标识符
✔ Identifier · com.tauri-app.app
? Choose which language to use for your frontend › # 前端语言
❯ TypeScript / JavaScript  (pnpm, yarn, npm, deno, bun)
  Rust
  .NET
✔ Choose which language to use for your frontend · TypeScript / JavaScript - (pnpm, yarn, npm, deno, bun)
? Choose your package manager › # 包管理器
❯ yarn
  pnpm
  npm
  deno
  bun
✔ Choose your package manager · yarn
? Choose your UI template › # UI模板
❯ Vanilla
  Vue
  Svelte
  React
  Solid
  Angular
  Preact
✔ Choose your UI template · Vue - (https://vuejs.org/)
? Choose your UI flavor › # UI 风格
❯ TypeScript
  JavaScript
✔ Choose your UI flavor · TypeScript
Template created! To get started run: # 模板创建完成后，会输出提示
  cd tauri-app
  yarn
  yarn tauri android init
  yarn tauri ios init

For Desktop development, run: # 启动桌面应用开发环境
  yarn tauri dev

For Android development, run: # 初始化并运行 Android 开发环境
  yarn tauri android dev

For iOS development, run: # 初始化并运行 iOS 开发环境
  yarn tauri ios dev

✨  Done in 235.49s. # 耗时提示
```

> 项目结构

```bash
[tauri-app]                      # 项目名称
├─ [node_modules]                # 前端依赖
├─ [dist]                        # 打包后的项目文件
├─ [src]                         # 前端源代码
├─ [src-tauri]                   # Tauri 源代码
│    ├─ [icons]                  # 应用程序图标
│    ├─ [src]                    # Tauri App 源代码，例如系统菜单，托盘，插件配置等
│    ├─ [target]                 # 构建的产物会被放入此文件夹中，target 目录的结构取决于是否使用 --target 标志为特定的平台构建
│    ├─ build.rs                 # Tauri 构建应用
│    ├─ Cargo.lock               # 包含了依赖的精确描述信息，类似于 yarn.lock 或 package-lock.json
│    ├─ Cargo.toml               # Tauri (Rust) 项目清单
│    └─ tauri.conf.json          # 自定义 Tauri 应用程序的配置文件，例如应用程序窗口尺寸，应用名称，权限等
├─ index.html                    # 项目主界面
├─ package.json                  # 前端项目清单
├─ tsconfig.json                 # typescript 配置文件
├─ vite.config.ts                # vite 配置文件
├─ yarn.lock                     # 前端依赖的精确描述信息
└─ ...                           # 其他
```
