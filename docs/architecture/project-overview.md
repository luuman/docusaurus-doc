# Matrx Windows 项目整体架构

## 1. 技术栈概览

```
+------------------------------------------------------------------+
|                         Matrx Desktop                            |
+------------------------------------------------------------------+
|  UI Layer      | Vue 2.6.10 + Element UI 2.15.6 + Vuex 3.0.1    |
+----------------+-------------------------------------------------+
|  Runtime       | Electron 20.3.8 (Chromium 104)                  |
+----------------+-------------------------------------------------+
|  Database      | SQLCipher 5.3.1 (@journeyapps/sqlcipher)        |
+----------------+-------------------------------------------------+
|  Security      | E2EE (Signal Protocol) + SSL Pinning            |
+----------------+-------------------------------------------------+
|  Native SDK    | FFI-NAPI (会议SDK/加密SDK)                       |
+----------------+-------------------------------------------------+
|  Build Tools   | Vue CLI 3.12 + Electron Builder 23.6.0          |
+------------------------------------------------------------------+
```

### 核心依赖
| 类别 | 依赖库 | 版本 | 用途 |
|------|--------|------|------|
| 框架 | Vue | 2.6.10 | 响应式UI框架 |
| 状态管理 | Vuex | 3.0.1 | 全局状态管理 |
| 路由 | Vue Router | 3.0.3 | 单页应用路由 |
| UI组件 | Element UI | 2.15.6 | UI组件库 |
| 桌面运行时 | Electron | 20.3.8 | 桌面应用容器 |
| 数据库 | SQLCipher | 5.3.1 | 加密SQLite数据库 |
| 原生调用 | ffi-napi | 2.4.7 | Node.js原生模块调用 |
| HTTP | Axios | 1.8.3 | HTTP客户端 |
| 实时通信 | Socket.io-client | 2.3.0 | WebSocket通信 |
| 加密 | CryptoJS | 4.0.0 | 加密算法库 |

## 2. 代码规模统计

```
项目总规模:
+------------------+--------+
| 文件类型          | 数量   |
+------------------+--------+
| JavaScript (.js) | 734+   |
| Vue SFC (.vue)   | 402+   |
| SCSS/CSS         | 50+    |
| JSON配置         | 20+    |
+------------------+--------+

核心目录分布:
src/
├── main/           # 主进程模块 (36个目录)
├── renderer/       # 独立渲染进程 (28个应用)
├── components/     # Vue组件 (35个目录)
├── store/modules/  # Vuex模块 (30个模块)
├── utils/          # 工具函数 (29个目录)
├── api/            # API封装 (20+文件)
└── sql/            # 数据库Schema
```

## 3. 进程模型

```
+------------------------------------------------------------------+
|                        Electron Application                       |
+------------------------------------------------------------------+
|                                                                   |
|   +------------------+     IPC      +-------------------------+   |
|   |   Main Process   |<------------>|    Renderer Process     |   |
|   |   (background.js)|              |    (主窗口 - Vue App)    |   |
|   +------------------+              +-------------------------+   |
|          |                                     |                  |
|          |                                     |                  |
|   +------v----------+               +----------v--------------+   |
|   | Native Modules  |               | Independent Renderers   |   |
|   | - Meeting SDK   |               | - Screenshot Window     |   |
|   | - E2EE SDK      |               | - Picture Viewer        |   |
|   | - Win32 API     |               | - File Viewer           |   |
|   +-----------------+               | - Meeting Info          |   |
|                                     | - 等28个独立窗口...      |   |
|   +------------------+              +-------------------------+   |
|   | SDK Child Process|                                           |
|   | (start/main.js)  |<-- FFI-NAPI --> Native DLL               |
|   +------------------+                                           |
+------------------------------------------------------------------+
```

### 进程职责分工

| 进程 | 入口文件 | 主要职责 |
|------|----------|----------|
| Main Process | `src/background.js` | 应用生命周期、窗口管理、系统托盘、原生对话框、IPC通信中心 |
| Main Renderer | `src/main.js` | 主业务逻辑、Vue应用、消息处理、会话管理 |
| SDK Process | `src/renderer/start/main.js` | E2EE加密、会议SDK桥接、数据库密码生成 |
| Sub Renderers | `src/renderer/*/main.js` | 截图、图片查看、文件预览等独立功能窗口 |

## 4. 模块依赖关系

```
                              +------------------+
                              |   background.js  |
                              |   (Main Process) |
                              +--------+---------+
                                       |
        +------------------------------+------------------------------+
        |                              |                              |
        v                              v                              v
+-------+-------+            +---------+--------+           +---------+--------+
| Window Manager |           | IPC Channel      |           | Native Modules   |
| - mainWindow   |           | - IPCMainChannel |           | - meetingSDK     |
| - dialogWin    |           | - forwardDB      |           | - winUser32      |
| - pictureViewer|           | - store          |           | - screenshot     |
+----------------+           +------------------+           +------------------+
        |                              |                              |
        |                              |                              |
        v                              v                              v
+------------------------------------------------------------------+
|                       Main Renderer (Vue App)                     |
+------------------------------------------------------------------+
        |                              |                              |
        v                              v                              v
+-------+-------+            +---------+--------+           +---------+--------+
| Vue Components |           | Vuex Store       |           | Utils            |
| - Chat/*       |           | - userInfo       |           | - SpaceManager   |
| - Panel/*      |           | - spaceCollection|           | - SqliteUtil     |
| - Meeting/*    |           | - sessionCollection          | - e2eUtil        |
| - Settings/*   |           | - messageCollection          | - FileUploader   |
+----------------+           +------------------+           +------------------+
                                       |
                                       v
                            +---------+--------+
                            | Data Layer       |
                            | - SQLCipher DB   |
                            | - API Services   |
                            | - Socket.io      |
                            +------------------+
```

## 5. 核心数据流向

### 5.1 消息收发流程

```
发送消息:
+--------+    +----------+    +----------+    +---------+    +--------+
| Vue UI | -> | sendMsg  | -> | E2EE加密  | -> | Socket  | -> | Server |
+--------+    | Utils    |    | (SDK)    |    | Client  |    +--------+
              +----------+    +----------+    +---------+

接收消息:
+--------+    +-----------+    +----------+    +-----------+    +--------+
| Server | -> | handlePush| -> | E2EE解密  | -> | SQLite    | -> | Vue UI |
+--------+    | (Socket)  |    | (SDK)    |    | 持久化     |    +--------+
              +-----------+    +----------+    +-----------+
```

### 5.2 IPC通信流程

```
Renderer -> Main:
+-------------+  ipcRenderer.send()  +-------------+
| Renderer    | ------------------> | Main Process |
+-------------+                      +-------------+

Main -> Renderer:
+-------------+  webContents.send()  +-------------+
| Main Process| ------------------> | Renderer     |
+-------------+                      +-------------+

双向同步:
+-------------+  ipcRenderer.sendSync()  +-------------+
| Renderer    | <-------------------->  | Main Process |
+-------------+  e.returnValue          +-------------+
```

## 6. 目录结构详解

```
matrx-windows/
├── src/
│   ├── background.js          # 主进程入口
│   ├── main.js                # 主渲染进程入口
│   ├── preload.js             # 预加载脚本
│   ├── router.js              # Vue路由配置
│   ├── App.vue                # Vue根组件
│   │
│   ├── main/                  # 主进程模块
│   │   ├── mainWindow/        # 主窗口管理
│   │   ├── meetingSDK.js      # 会议SDK封装
│   │   ├── IPCMainChannel.js  # IPC通道
│   │   ├── certs/             # SSL证书验证
│   │   ├── forwardDB/         # 数据库转发
│   │   └── ...                # 其他主进程模块
│   │
│   ├── renderer/              # 独立渲染进程
│   │   ├── start/             # SDK进程
│   │   │   ├── main.js        # SDK进程入口
│   │   │   └── bridge/        # SDK桥接
│   │   │       ├── bridge.js
│   │   │       ├── bridge_e2ee.js
│   │   │       └── bridge_db.js
│   │   ├── screenshot/        # 截图功能
│   │   ├── pictureViewer/     # 图片查看器
│   │   ├── fileViewer/        # 文件查看器
│   │   └── ...                # 其他独立窗口
│   │
│   ├── components/            # Vue组件
│   │   ├── Chat/              # 聊天相关组件
│   │   ├── Panel/             # 面板组件
│   │   ├── Meeting/           # 会议组件
│   │   ├── Settings/          # 设置组件
│   │   └── ...
│   │
│   ├── store/                 # Vuex状态管理
│   │   ├── index.js           # Store入口
│   │   └── modules/           # 状态模块
│   │       ├── userInfo.js
│   │       ├── spaceCollection.js
│   │       ├── sessionCollection.js
│   │       └── ...
│   │
│   ├── api/                   # API封装
│   │   ├── axiosInstance.js   # Axios实例
│   │   ├── messageApi.js      # 消息API
│   │   ├── loginApi.js        # 登录API
│   │   └── ...
│   │
│   ├── utils/                 # 工具函数
│   │   ├── SpaceManager.js    # 空间管理
│   │   ├── SqliteUtil.js      # 数据库工具
│   │   ├── e2eUtil.js         # E2EE工具
│   │   └── ...
│   │
│   ├── sql/                   # 数据库Schema
│   │   ├── init/              # 初始化脚本
│   │   └── ...
│   │
│   ├── logs/                  # 日志模块
│   │   ├── index.js           # 日志入口
│   │   └── cryptolog.js       # 加密日志
│   │
│   ├── lang/                  # 国际化
│   │   └── locales/
│   │       ├── en/
│   │       └── ar/
│   │
│   └── config/                # 配置文件
│       └── config.js
│
├── build_base/                # 构建资源
├── nsis_build/                # NSIS安装包脚本
├── devtools/                  # 开发者工具
├── public/                    # 静态资源
│
├── package.json               # 项目配置
├── vue.config.js              # Vue CLI配置
├── babel.config.js            # Babel配置
└── .eslintrc.js               # ESLint配置
```

## 7. 核心配置文件

### package.json 关键配置
```json
{
  "name": "Matrx",
  "version": "1.26.0",
  "main": "background.js",
  "protocol": "matrxmeeting",
  "productName": "Matrx"
}
```

### 入口文件说明
| 文件 | 用途 |
|------|------|
| `background.js` | Electron主进程入口 |
| `src/main.js` | 主渲染进程Vue应用入口 |
| `src/renderer/start/main.js` | SDK进程入口 |
| `vue.config.js` | Vue CLI + Electron Builder配置 |

## 8. 技术特点总结

1. **多进程架构**: 主进程 + 主渲染进程 + SDK进程 + 多个独立渲染进程
2. **端到端加密**: Signal Protocol实现的E2EE加密通信
3. **本地加密存储**: SQLCipher加密数据库 + 加密日志
4. **SSL Pinning**: 证书指纹验证防止中间人攻击
5. **多空间支持**: 多租户数据隔离架构
6. **原生模块集成**: FFI-NAPI调用原生SDK (会议/加密)
7. **响应式UI**: Vue 2 + Vuex + Element UI
8. **实时通信**: Socket.io WebSocket连接
