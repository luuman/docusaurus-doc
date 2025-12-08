【04】Tauri 入门篇 - 集成 WebAssembly

```
lencx
lencx
{折腾 ⇌ 迷茫 ⇌ 思考]ing，在路上...
​关注他
9 人赞同了该文章
仓库：lencx/OhMyBox
阅读原文（首发于 GitHub）
关注《浮之静》公众号，私信作者，进 Tauri 技术交流群
安装依赖
vite-plugin-rsw - 基于 vite 实现的 webAssembly 插件，支持热更新，友好的报错提示

yarn add -D vite-plugin-rsw
rsw-rs - 一个 CLI 工具，用于增强 wasm-pack 的功能，如支持 watch 模式，多 crate 同时 build，watch，自动执行 npm link 等

cargo install rsw
使用说明
1. 编辑 vite.config.js
import { defineConfig } from 'vite'
import { ViteRsw } from 'vite-plugin-rsw'; // ✅ 新增

export default defineConfig({
  plugins: [
    ViteRsw(), // ✅ 新增
  ],
})
2. 编辑 package.json
{
  "scripts": {
    "dev": "vite",
    "build": "rsw build && tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "rsw": "rsw"
  }
}
3. 运行 rsw
1). 初始化 rsw 配置
生成 rsw.toml，了解更多 rsw.toml 配置信息

yarn rsw init





2). 新建 wasm 项目
内置三种模式，可以通过编辑 rsw.toml > [new] > using 来切换

yarn rsw new @mywasm/foo





在 rsw.toml > [[crates]] 中新增 @mywasm/foo

#! link 类型: `npm` | `yarn` | `pnpm`, 默认是 `npm`
cli = "npm"

[new]
#! 使用: `wasm-pack` | `rsw` | `user`, 默认 `wasm-pack`
#! 1. wasm-pack: `rsw new <name> --template <template> --mode <normal|noinstall|force>`
#! 2. rsw: `rsw new <name>`, 内置模板
#! 3. user: `rsw new <name>`，如果 `dir`未配置, 则使用 `wasm-pack new <name>`初始化 wasm 项目
using = "rsw"
#! 当 `using = "user"` 时，`dir` 才会生效
#! 如果 `using = "wasm-pack"` 或 `using = "rsw"`，则忽略
#! 复制此目录下的所有文件到初始化的 wasm 项目中
dir = "my-template"

[[crates]]
#! npm 包，@mywasm 为 npm 组织，foo 是该组织下的包名
name = "@mywasm/foo"
#! 是否执行 link， link 类型通过 `cli` 配置
link = true

[[crates]]
#! npm 包，@mywasm 为 npm 组织，bar 是该组织下的包名
name = "@mywasm/bar"
#! 是否执行 link， link 类型通过 `cli` 配置
link = true
开发模式
监听 rust 文件变更，自动执行构建，并通知到浏览器（热更新）
执行以下命令，不要退出：
yarn rsw watch
2. 新开一个命令行窗口，执行 a 或 b：

# a. 在浏览器环境
yarn dev

# b. 在 tauri 环境
yarn tauri dev

使用
在项目中使用 wasm
// App.jsx
import { useEffect } from 'react'
import init, { greet } from '@mywasm/foo'

function App() {
  useEffect(() => {
    // ✅ 初始化，加载 wasm 文件
    init();
  }, [])

  return (
    <div className="App">
        {/* ✅ 调用 greet 方法，必须保证 init 方法执行完成之后，才可以调用，否则会报错 */}
        <button onClick={() => greet()}>click me</button>
    </div>
  )
}

export default App
构建
编译生产环境下的 wasm 文件（代码优化）
构建 wasm
yarn rsw build
2. 构建项目

yarn build

项目结构
rsw 对项目结构并无特别要求，但是为了保持统一及维护性，推荐以下结构。

@mywasm: wasm 包的组织名称（推荐使用，但非必需），rust 编译为 wasm，会以 npm 包的形式提供给前端使用。使用组织的好处就是方便管理，防止包名冲突
.rsw - rsw 运行时生成的临时文件夹
rsw.toml - rsw 配置文件
.watchignore - rsw watch 监听文件变更时需要忽略的文件，忽略规则与 .gitignore 类似
[tauri-app] # 项目名称
│ # 新增结构
├─ [@mywasm] # ✅ 组织名称（npm org）
│    ├─ [foo] # ✅ @mywasm/foo - wasm 包名
│    └─ [bar] # ✅ @mywasm/bar - wasm 包名
├─ [.rsw] # ✅ rsw 临时文件夹
├─ rsw.toml # ✅ rsw 配置文件
├─ .watchignore # ✅ rsw watch 忽略文件
│┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
│ # 原结构
├─ [node_modules] # 前端依赖
├─ [src] # 前端程序源
├─ [src-tauri] # Tauri 程序源
│    ├─ [icons] # 应用程序图标
│    ├─ [src] # Tauri App 程序源，例如系统菜单，托盘，插件配置等
│    ├─ [target] # 构建的产物会被放入此文件夹中，target 目录的结构取决于是否使用 --target 标志为特定的平台构建
│    ├─ build.rs # Tauri 构建应用
│    ├─ Cargo.lock # 包含了依赖的精确描述信息，类似于 yarn.lock 或 package-lock.json
│    ├─ Cargo.toml # Tauri (Rust) 项目清单
│    └─ tauri.conf.json # 自定义 Tauri 应用程序的配置文件，例如应用程序窗口尺寸，应用名称，权限等
├─ index.html # 项目主界面
├─ package.json # 前端项目清单
├─ tsconfig.json # typescript 配置文件
├─ vite.config.ts # vite 配置文件
├─ yarn.lock # 前端依赖的精确描述信息
└─ ... # 其他
```
