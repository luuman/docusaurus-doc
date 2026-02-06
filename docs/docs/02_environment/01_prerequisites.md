# 快速开始

本指南将帮助您在几分钟内在开发机器上安装并运行 Matrx Windows 应用程序。Matrx 是一个基于 Electron-Vue 的桌面应用程序，提供全面的通信和协作平台。

## [](#)

在开始之前，请确保已安装以下软件：

- **Node.js**（推荐 v16.15.0）
- **Python**（推荐 v3.10.11）
- **Git**

您还需要安装一些全局 Node.js 包：

BASH

```bash
npm install -g node-gyp
npm install -g node-pre-gyp
```

## 安装[](#安装)

### 1\. 克隆仓库[](#1-克隆仓库)

首先，克隆仓库及其所有子模块：

BASH

```bash
git clone git@xxx/windows.git --recurse-submodules
```

如果您已经克隆了仓库但没有子模块，请运行以下命令：

BASH

```bash
cd windows
git submodule init
git submodule update --init --recursive
cd public/sdk/cst_lib
git checkout master
```

### 2\. 安装依赖项[](#2-安装依赖项)

安装所有必需的 npm 包：

BASH

```bash
npm install --force
```

如果在安装后遇到 node-gyp 构建错误，请运行以下命令进行修复：

BASH

```bash
npm run changeV8
npm install --force
```

## 运行应用程序[](#运行应用程序)

### 开发模式[](#开发模式)

要以热重载功能启动开发模式：

BASH

```bash
npm run dev
```

此命令将：

1.  启动 Electron 应用程序
2.  启动开发服务器
3.  启用热重载以加快开发速度

### 生产构建[](#生产构建)

要构建生产版本的应用程序：

BASH

```bash
npm run package
```

这将在 `dist_electron` 目录中创建打包好的应用程序。

## 项目结构概述[](#项目结构概述)

Matrx 应用程序遵循标准的 Electron-Vue 结构，并进行了一些自定义调整：

```python
src/
├── main.js              # 渲染进程入口点
├── background.js        # 主进程入口点
├── App.vue              # 根 Vue 组件
├── preload.js           # 安全上下文的预加载脚本
├── api/                 # API 模块
├── assets/              # 静态资源
├── components/          # Vue 组件
├── config/              # 配置文件
├── lang/                # 国际化文件
├── renderer/            # 渲染进程窗口
├── router.js            # Vue 路由配置
├── scss/                # SCSS 样式表
├── store/               # Vuex 存储
├── styles/              # 全局样式
├── utils/               # 工具函数
└── views/               # Vue 视图
```

## 主要功能[](#主要功能)

Matrx 应用程序包含多项重要功能：

- **多窗口架构**：应用程序支持多个窗口，用于会议、文件查看器和设置等不同功能。
- **数据库集成**：使用 SQLCipher 进行加密本地存储。
- **实时通信**：实现 WebSocket 通信，用于即时消息传递和协作。
- **国际化**：全面支持多语言的 i18n 功能。
- **安全性**：实施预加载脚本和上下文隔离以增强安全性。

## 故障排除[](#故障排除)

### 常见问题[](#常见问题)

1.  **Node-gyp 构建错误**：如果在安装过程中遇到 node-gyp 构建错误，请确保已安装 Python 和所需的构建工具，然后运行 `npm run changeV8`，接着运行 `npm install --force`。
2.  **子模块问题**：如果子模块出现问题，请运行 `git submodule update --init --recursive` 以确保所有子模块都已正确初始化。
3.  **端口冲突**：如果开发服务器因端口冲突而无法启动，可以通过设置 `VUE_APP_PORT` 环境变量来更改端口。

### 调试[](#调试)

要调试应用程序：

1.  安装 VS Code Chrome 调试器插件
2.  在代码中设置断点
3.  运行 `npm run debug` 以调试模式启动应用程序

要调试特定模块，请检查 `src/utils/` 目录中的相关文件。
