# 运行环境

# 快速开始

欢迎使用 Matrx Windows 应用程序！本指南将帮助您在开发机器上快速启动并运行该应用程序。Matrx 是一个使用 Electron 和 Vue.js 构建的综合会议与协作平台，旨在为虚拟会议、文件共享和团队协作提供无缝体验。

## [](#)

在设置开发环境之前，请确保已安装以下前置要求：

- **Node.js**（推荐 v16.15.0）
- **Python**（推荐 v3.10.11）

您还需要安装一些全局包：

BASH

```bash
npm install -g node-gyp
npm install -g node-pre-gyp
```

这些包是构建应用程序依赖的原生模块所必需的，特别是用于数据库加密和其他系统级集成。`来源：[README.md#L7-L11](README.md#L7-L11)`

## 设置项目[](#设置项目)

### 1\. 克隆仓库[](#1-克隆仓库)

首先，克隆包含所有子模块的仓库：

BASH

```bash
git clone git@xxx/windows.git --recurse-submodules
```

如果您已经克隆了仓库但没有子模块，请运行：

BASH

```bash
cd windows
git submodule init
git submodule update --init --recursive
git submodule update --remote
cd public/sdk/cst_lib
git checkout master
```

子模块包含主应用程序依赖的关键 SDK 组件和库，用于会议功能和其他特性。`来源：[README.md#L14-L22](README.md#L14-L22)`

### 2\. 安装依赖项[](#2-安装依赖项)

使用以下命令安装项目依赖项：

BASH

```bash
npm install --force
```

如果在安装后遇到 node-gyp 构建错误，请运行以下命令以修复 V8 兼容性问题：

BASH

```bash
npm run changeV8
npm install --force
```

这将调整 V8 引擎配置以匹配您的开发环境。

安装过程包括对某些包应用补丁和设置 Electron 构建依赖项。`来源：[README.md#L24-L32](README.md#L24-L32), [package.json#L108](package.json#L108)`

## 运行应用程序[](#运行应用程序)

### 开发模式[](#开发模式)

要以热重载模式启动应用程序：

BASH

```bash
npm run dev
```

此命令将：

- 启用开发工具启动 Electron 应用程序
- 启动带有热模块替换的 Vue 开发服务器
- 启用调试功能和详细日志记录

应用程序窗口将打开，您将看到主界面。您对 Vue 组件所做的任何更改都将自动在应用程序窗口中重新加载。`来源：[package.json#L18](package.json#L18)`

### 调试应用程序[](#调试应用程序)

要进行有效调试，请按照以下步骤操作：

1.  在 VS Code 中安装"Debugger for Chrome"扩展
2.  在 VS Code 调试面板中单击"Electron: All"调试配置
3.  在代码中设置断点
4.  启动调试器

关键调试点包括：

- `src/utils/message/batchSendMsg.js` 中的消息处理
- `src/utils/openLog/openLog.js` 中的日志目录访问

应用程序使用多进程架构，包括主进程（background.js）和渲染进程（main.js），因此您可以分别调试这两个进程。`来源：[README.md#L80-L84](README.md#L80-L84)`

## 构建应用程序[](#构建应用程序)

要创建应用程序的生产版本：

BASH

```bash
npm run package
```

这将：

- 构建生产环境的 Vue 应用程序
- 使用 Electron 打包
- 创建 Windows 安装程序（EXE 格式）
- 将构建产物输出到 `dist_electron` 目录

构建过程可能需要几分钟时间，因为它包括捆绑所有依赖项、优化资源和创建最终安装程序。`来源：[package.json#L35](package.json#L35), [README.md#L36-L38](README.md#L36-L38)`

## 项目结构概述[](#项目结构概述)

Matrx 应用程序遵循良好的组织结构：

```python
src/
├── main.js              # 渲染进程入口点
├── background.js        # 主进程入口点
├── App.vue              # 根 Vue 组件
├── api/                 # 后端通信的 API 层
├── assets/              # 静态资源（图像、图标）
├── components/          # 可重用的 Vue 组件
├── renderer/            # 子窗口渲染器
├── store/               # Vuex 状态管理
├── utils/               # 实用工具函数
└── views/               # 页面级 Vue 组件
```

应用程序使用 Electron 的多进程架构，其中 `background.js` 在主进程中运行并管理应用程序生命周期，而 `main.js` 在渲染进程中运行并处理 UI。`来源：[README.md#L48-L78](README.md#L48-L78)`

## 常见问题与解决方案[](#常见问题与解决方案)

### 安装问题[](#安装问题)

如果在安装过程中遇到问题：

1.  确保您拥有正确的 Node.js 和 Python 版本
2.  清除 node_modules 文件夹和 package-lock.json，然后再次运行 `npm install --force`
3.  如果 node-gyp 失败，在重新安装之前运行 `npm run changeV8`

### 构建失败[](#构建失败)

对于构建相关问题：

1.  检查所有子模块是否已正确初始化
2.  确保您有足够的磁盘空间（构建需要几个 GB）
3.  验证系统上是否安装了所有必需的构建工具

### 运行问题[](#运行问题)

如果应用程序无法启动：

1.  检查控制台中的错误消息
2.  确保所有依赖项都已正确安装
3.  尝试删除 `dist_electron` 文件夹并重新构建

## 后续步骤[](#后续步骤)

现在您已经运行了 Matrx 应用程序，您可以：

1.  探索代码库以了解会议功能
2.  通过修改 `src/views/` 中的 Vue 组件来自定义 UI
3.  通过扩展 `src/api/` 中的 API 层来添加新功能
4.  通过检查 `nsis_build/` 中的脚本来了解构建系统

有关应用程序特定方面的更详细信息，请参阅本 wiki 中的其他文档部分。
