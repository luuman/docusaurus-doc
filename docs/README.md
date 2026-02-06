---
slug: /
---

# Matrx Windows 开发文档

> 本文档旨在帮助新人快速熟悉 Matrx Windows 项目的架构、模块和开发流程。

## 项目概览

**Matrx** 是一个基于 Electron 20 + Vue 2 的企业级桌面通讯协作应用，支持即时消息、音视频会议、文件传输等核心功能。

### 技术栈

| 层级 | 技术选型 |
|------|---------|
| 桌面框架 | Electron 20.3.8 |
| 前端框架 | Vue 2.6.10 |
| 状态管理 | Vuex 3.0.1 |
| 路由管理 | Vue Router 3.0.3 |
| UI 组件库 | Element UI 2.15.6 |
| 数据库 | SQLCipher 5.3.1 |
| 构建工具 | Vue CLI 3 + electron-builder 23.6.0 |

### 项目规模

- JavaScript 文件: 734 个
- Vue 组件: 402 个
- 功能窗口: 30+ 个
- 多页面应用入口: 26 个

---

## 文档目录

### 1. 架构设计 (`architecture/`)

- [项目整体架构](./architecture/overview.md) - 了解项目的整体设计理念
- [主进程架构](./architecture/main-process.md) - Electron 主进程详解
- [渲染进程架构](./architecture/renderer-process.md) - Vue 应用架构详解
- [IPC 通信机制](./architecture/ipc-communication.md) - 进程间通信详解
- [数据流架构](./architecture/data-flow.md) - 数据流动与状态管理
- [项目文件统计](./architecture/file-statistics.md) - 完整目录结构与文件统计
- [多空间架构](./architecture/multi-space-architecture.md) - 租户/空间隔离机制
- [安全架构](./architecture/security-architecture.md) - 加密与安全设计

### 2. 核心模块 (`modules/`)

- [窗口管理模块](./modules/window-management.md) - 多窗口创建与管理
- [数据存储模块](./modules/data-storage.md) - SQLCipher + electron-store

### 3. 开发指南 (`guides/`)

- [新人入门指南](./guides/getting-started.md) - 快速上手项目开发
- [核心概念讲解](./guides/concepts.md) - 核心技术知识点
- [环境搭建指南](./guides/setup.md) - 开发环境配置
- [新功能开发指南](./guides/new-feature.md) - 如何添加新功能
- [调试与排错指南](./guides/debugging.md) - 常见问题与解决方案
- [日志排查手册](./guides/log-troubleshooting-guide.md) - 日志分析与问题排查
- [构建发布指南](./guides/build-deploy.md) - 打包与发布流程

### 4. API 参考 (`api/`)

- [API 总览](./api/api-overview.md) - API 架构与文件索引
- [核心基础设施](./api/api-infrastructure.md) - HTTP/WebSocket 核心
- [认证与账户](./api/api-auth.md) - 登录认证接口
- [用户与联系人](./api/api-user-contact.md) - 用户管理接口
- [消息系统](./api/api-message.md) - 消息收发接口
- [会话管理](./api/api-session.md) - 会话操作接口
- [群组与频道](./api/api-group.md) - 群组管理接口
- [会议系统](./api/api-meeting.md) - 会议相关接口
- [文件管理](./api/api-file.md) - 文件操作接口
- [空间与企业](./api/api-space.md) - 多空间接口
- [安全与加密](./api/api-security.md) - 安全相关接口
- [其他功能](./api/api-other.md) - AI、翻译等接口
- [IPC API 参考](./api/ipc-api.md) - IPC 通信接口
- [Store API 参考](./api/store-api.md) - Vuex Store 接口
- [Database API 参考](./api/database-api.md) - 数据库操作接口
- [Utils API 参考](./api/utils-api.md) - 工具函数参考

### 5. 数据库 (`database/`)

- [数据库架构](./database/database-architecture.md) - SQLCipher 集成与配置
- [表结构详解](./database/table-schema.md) - 数据表设计
- [CRUD 操作](./database/crud-operations.md) - 数据库操作方法
- [全文搜索](./database/fts-search.md) - FTS 搜索功能
- [版本迁移](./database/migration.md) - 数据库迁移策略

### 6. IM 即时通讯 (`im/`)

- [消息系统架构](./im/message-architecture.md) - 消息系统整体设计
- [消息类型详解](./im/message-types.md) - 各种消息类型
- [消息收发流程](./im/message-send-receive.md) - 消息发送与接收
- [会话管理](./im/session-management.md) - 会话列表与状态
- [已读回执](./im/read-receipt.md) - 已读未读机制
- [离线消息](./im/offline-history-message.md) - 离线与历史消息
- [Socket 连接](./im/socket-connection.md) - WebSocket 长连接

### 7. 会议 SDK (`sdk/`)

- [SDK 概述](./sdk/sdk-overview.md) - 会议 SDK 架构
- [SDK 初始化](./sdk/sdk-initialization.md) - 初始化流程
- [会议操作](./sdk/meeting-operations.md) - 加入/离开会议
- [音视频控制](./sdk/audio-video-control.md) - 媒体控制
- [屏幕共享](./sdk/screen-share-recording.md) - 共享与录制
- [E2EE 会议](./sdk/e2ee-meeting.md) - 端到端加密会议

### 8. 日志系统 (`logging/`)

- [日志系统架构](./logging/logging-system.md) - 日志系统设计
- [日志分类参考](./logging/log-categories.md) - 各类日志说明
- [日志加密](./logging/log-encryption.md) - 日志加密机制

---

## 快速开始

### 1. 克隆项目

```bash
git clone --recurse-submodules git@github.com:luuman/matrx-windows.git
cd matrx-windows
```

### 2. 安装依赖

```bash
# 使用 Node.js v16
nvm use 16

# 安装依赖 (可能需要 --force)
npm install --force

# 如遇 node-gyp 错误
npm run changeV8
npm install --force
```

### 3. 启动开发服务

```bash
# 启动 Electron 开发模式
npm run dev

# 或仅启动 Vue 开发服务器
npm run serve
```

### 4. 构建生产版本

```bash
# 完整打包
npm run package

# 特定格式
npm run package-msi      # Windows Installer
npm run package-appx     # Microsoft Store
```

---

## 目录结构总览

```
matrx-windows/
├── src/                          # 源代码目录
│   ├── background.js             # 主进程入口
│   ├── main.js                   # 渲染进程入口
│   ├── preload.js                # 预加载脚本
│   ├── main/                     # 主进程模块
│   ├── renderer/                 # 多窗口渲染进程
│   ├── components/               # Vue 组件库
│   ├── views/                    # 页面视图
│   ├── api/                      # API 请求层
│   ├── store/                    # Vuex 状态管理
│   ├── utils/                    # 工具函数库
│   ├── sql/                      # SQLCipher 数据库
│   ├── sqlApi/                   # 数据库 API
│   ├── logs/                     # 日志系统
│   └── lang/                     # 国际化
├── public/                       # 静态资源
├── build/                        # 构建资源
├── scripts/                      # 脚本工具
├── vue.config.js                 # Vue CLI 配置
├── package.json                  # 项目配置
└── docs/                         # 开发文档 (本目录)
```

---

## 阅读建议

### 新人入门路线

> 推荐先阅读 [新人入门指南](./guides/getting-started.md) 和 [核心概念讲解](./guides/concepts.md)

1. **第一天**: 环境搭建 + 阅读 [项目整体架构](./architecture/overview.md)
2. **第二天**: 阅读 [主进程架构](./architecture/main-process.md) 和 [渲染进程架构](./architecture/renderer-process.md)
3. **第三天**: 阅读 [IPC 通信机制](./architecture/ipc-communication.md) 和 [核心概念讲解](./guides/concepts.md)
4. **第四天**: 阅读 [数据存储模块](./modules/data-storage.md) 和 [项目文件统计](./architecture/file-statistics.md)
5. **第五天**: 熟悉 [API 参考文档](./api/api-overview.md)，开始上手开发

### 开发任务参考

- **添加新页面**: 参考 [新功能开发指南](./guides/new-feature.md)
- **修复 Bug**: 参考 [调试与排错指南](./guides/debugging.md)
- **发布版本**: 参考 [构建发布指南](./guides/build-deploy.md)

---

## 维护说明

本文档由开发团队维护，如有疑问或建议，请联系项目负责人。

**最后更新**: 2026-02-05
