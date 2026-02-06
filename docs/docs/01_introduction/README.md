# 概述

Matrx 是一款专为会议和协作设计的综合性 Electron-Vue 应用程序。这款基于 Windows 的应用程序将现代网络技术与桌面应用功能相结合，为需要安全通信、实时协作和会议管理工具的用户提供功能丰富的体验。

Matrx 利用 Electron 的强大功能创建了一个跨平台桌面应用程序，并采用 Vue.js 作为前端框架。该应用程序专门设计用于处理复杂的会议工作流程，包括视频会议、屏幕共享、实时消息传递和协作白板。凭借其模块化架构和强大的构建系统，Matrx 可以针对不同的部署场景进行定制，包括公共和私有环境。

该应用程序采用多进程 Electron 架构，将主进程（处理系统级操作）和渲染器进程（管理 UI）的关注点分离。这种设计确保了更好的性能、安全性和可维护性，同时为用户提供原生桌面体验。

## 技术栈[](#技术栈)

Matrx 使用现代技术栈构建，结合了 Web 和桌面开发的最佳技术：

| 层级     | 技术                       | 用途                                 |
| -------- | -------------------------- | ------------------------------------ |
| 框架     | Electron (v20.3.8)         | 跨平台桌面应用程序框架               |
| 前端     | Vue.js (v2.6.10)           | 用于构建 UI 的渐进式 JavaScript 框架 |
| UI 库    | Element UI (v2.15.6)       | 桌面应用程序的 Vue.js 组件库         |
| 状态管理 | Vuex                       | Vue.js 应用程序的集中式状态管理      |
| 数据库   | SQLCipher                  | 用于安全数据存储的加密 SQLite 数据库 |
| 构建系统 | Vue CLI & Electron Builder | 应用程序打包和封装                   |
| 通信     | Socket.io                  | 基于事件的实时双向通信               |
| 安全     | Crypto-js & AES-JS         | 加密和安全工具                       |

来源：[package.json](https://zread.ai/luuman/package.json), [vue.config.js](https://zread.ai/luuman/vue.config.js)

## 应用程序架构[](#应用程序架构)

Matrx 应用程序采用结构良好的架构，分离关注点并实现可维护的代码：

Syntax error in textmermaid version 11.6.0

该架构由三个主要组件组成：

1.  **主进程**：应用程序的骨干，运行在 `background.js` 中，处理窗口创建、系统集成以及与渲染器进程的通信。它管理应用程序生命周期、原生操作系统交互和安全功能。
2.  **渲染器进程**：Matrx 中的每个窗口都运行自己的渲染器进程，主窗口通过 `main.js` 初始化。这些进程处理 Vue.js 应用程序、用户交互和业务逻辑。
3.  **进程间通信 (IPC)**：促进主进程和渲染器进程之间的通信，实现跨进程边界的安全数据交换和函数调用。

来源：[src/background.js](https://zread.ai/luuman/src/background.js), [src/main.js](https://zread.ai/luuman/src/main.js)

## 核心功能[](#核心功能)

Matrx 包含一套专为专业协作设计的全面功能：

### 会议管理[](#会议管理)

- 通过安全身份验证创建、加入和管理会议
- 支持多种会议类型，包括预定会议、即时会议和定期会议
- 会议录制和回放功能
- 与日历系统集成以安排会议

### 实时通信[](#实时通信)

- 支持文本、表情符号和文件共享的即时消息传递
- 高质量音视频流会议
- 屏幕共享和远程控制功能
- 实时协作白板

### 安全与隐私[](#安全与隐私)

- 所有通信的端到端加密
- 支持 SSO 集成的安全身份验证
- 使用 SQLCipher 的加密本地数据库
- 数据保护和隐私控制

### 用户体验[](#用户体验)

- 支持国际化 (i18n) 的多语言支持
- 可定制的主题和品牌选项
- 适应不同屏幕尺寸的响应式设计
- 具有数据同步功能的离线能力

Matrx 支持多种部署配置，包括公共、私有和定制构建，使其适用于具有不同安全和品牌要求的各种企业环境。

来源：[src/renderer](https://zread.ai/luuman/src/renderer), [src/lang](https://zread.ai/luuman/src/lang)

## 开发工作流程[](#开发工作流程)

Matrx 的开发工作流程旨在确保代码质量、一致性和高效的协作：

### 环境设置[](#环境设置)

1.  安装先决条件：Node.js (v16.15.0) 和 Python (v3.10.11)
2.  克隆包含子模块的仓库
3.  使用 `npm install --force` 安装依赖项
4.  使用 `npm run dev` 运行开发服务器

### 代码质量[](#代码质量)

- ESLint 用于 JavaScript 代码检查
- Prettier 用于代码格式化
- Husky 用于强制执行提交标准的 Git 钩子
- Commitlint 用于一致的提交消息

### 构建过程[](#构建过程)

构建系统支持多种输出格式：

- **EXE**：标准 Windows 可执行文件
- **MSI**：Windows 安装程序包
- **APPX**：Windows Store 包

每种构建类型都有自己的配置文件（`exeConfig.js`、`msiConfig.js`、`appxConfig.js`），用于定义打包选项、图标和分发设置。

来源：[README.md](https://zread.ai/luuman/README.md), [build.js](https://zread.ai/luuman/build.js)

## 项目结构[](#项目结构)

项目被组织成逻辑目录，分离关注点并使导航直观：

```python
matrx-windows/
├── src/                    # 源代码
│   ├── main/              # 主进程模块
│   ├── renderer/          # 渲染器进程模块
│   ├── components/        # 可重用的 Vue 组件
│   ├── views/             # 页面级 Vue 组件
│   ├── store/             # Vuex 存储模块
│   ├── utils/             # 实用函数
│   └── api/               # API 接口
├── public/                # 静态资源和 HTML 模板
├── scripts/               # 构建和实用脚本
├── nsis_build/            # NSIS 安装程序脚本
├── patches/               # 依赖补丁
└── resources/             # 构建资源
```

这种结构确保代码按功能而非文件类型组织，使查找和维护相关功能更加容易。

来源：[README.md](https://zread.ai/luuman/README.md)

## 入门指南[](#入门指南)

开始 Matrx 开发：

1.  **克隆仓库**及所有子模块：

    BASH

    ```bash
    git clone git@xxx/windows.git --recurse-submodules
    ```

2.  **安装依赖项**：

    BASH

    ```bash
    npm install --force
    ```

3.  **运行开发服务器**：

    BASH

    ```bash
    npm run dev
    ```

4.  **构建应用程序**：

    BASH

    ```bash
    npm run package
    ```
