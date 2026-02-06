# 核心概念与知识点讲解

本文档讲解 Matrx 项目中的核心概念和技术知识点，帮助开发者深入理解项目。

---

## 目录

- [Electron 核心概念](#electron-核心概念)
- [IPC 通信机制](#ipc-通信机制)
- [多空间架构](#多空间架构)
- [消息系统](#消息系统)
- [数据存储](#数据存储)
- [会议 SDK 集成](#会议-sdk-集成)
- [安全机制](#安全机制)
- [性能优化](#性能优化)

---

## Electron 核心概念

### 进程模型

Electron 基于 Chromium，采用多进程架构：

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron 应用                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────────────────────────────────────────────┐    │
│   │                主进程 (Main Process)                │    │
│   │                                                     │    │
│   │  • 应用生命周期管理 (app.on('ready'), app.quit())  │    │
│   │  • 窗口创建和管理 (BrowserWindow)                  │    │
│   │  • 系统 API 调用 (dialog, clipboard, shell)        │    │
│   │  • 原生模块 (SQLCipher, ffi-napi)                  │    │
│   │  • IPC 通信处理 (ipcMain)                          │    │
│   └───────────────────────────────────────────────────┘    │
│                           │                                  │
│                      IPC Channel                            │
│                           │                                  │
│   ┌───────────────────────────────────────────────────┐    │
│   │              渲染进程 (Renderer Process)            │    │
│   │                                                     │    │
│   │  • Vue.js 应用                                      │    │
│   │  • DOM 渲染和用户交互                               │    │
│   │  • 前端业务逻辑                                     │    │
│   │  • IPC 通信发送 (ipcRenderer)                       │    │
│   └───────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 为什么要分进程？

| 主进程 | 渲染进程 |
|--------|----------|
| 访问 Node.js 完整 API | 受限的 API（安全考虑） |
| 可以操作系统资源 | 主要处理 UI |
| 一个应用只有一个主进程 | 可以有多个渲染进程（多窗口） |
| 崩溃会影响整个应用 | 单个窗口崩溃不影响其他窗口 |

### 预加载脚本 (preload.js)

预加载脚本是连接主进程和渲染进程的桥梁：

```javascript
// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, callback) => {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  }
});
```

这样渲染进程就可以通过 `window.electron.ipcRenderer` 安全地与主进程通信。

---

## IPC 通信机制

### 通信方式对比

```javascript
// 1. 单向通信 (render → main)
// 适用：不需要返回值的操作，如日志、通知
ipcRenderer.send('log-event', { action: 'click' });

// 主进程监听
ipcMain.on('log-event', (event, data) => {
  console.log('收到日志:', data);
});
```

```javascript
// 2. 双向通信 (render → main → render)
// 适用：需要返回值的操作
const result = await ipcRenderer.invoke('get-user-info');

// 主进程处理
ipcMain.handle('get-user-info', async () => {
  return await fetchUserInfo();
});
```

```javascript
// 3. 主进程主动推送 (main → render)
// 适用：系统事件通知
// 主进程
mainWindow.webContents.send('new-message', messageData);

// 渲染进程监听
ipcRenderer.on('new-message', (event, data) => {
  handleNewMessage(data);
});
```

### 项目中的 IPC 封装

```javascript
// src/utils/ipc/ipcSend.js

// 简化的双向通信
export function ipcInvoke(type, ...args) {
  return ipcRenderer.invoke(type, ...args);
}

// 简化的单向通信
export function ipcSend(type, ...args) {
  ipcRenderer.send(type, ...args);
}

// 向 SDK 进程通信
export function sendSdk(type, ...args) {
  return new Promise(resolve => {
    const sendId = uuidv4();
    ipcRenderer.once(type + sendId, (e, data) => {
      resolve(data);
    });
    ipcRenderer.sendTo(getSdkContentId(), type, ...args, sendId);
  });
}
```

---

## 多空间架构

### 什么是空间 (Space)？

空间是租户/组织的概念，类似于"工作区"。一个用户可以属于多个空间（公司）。

```
用户 张三
├── 空间 A: 公司甲 (spaceId: space-001)
│   ├── 联系人列表 A
│   ├── 群组列表 A
│   └── 消息数据 A
│
└── 空间 B: 公司乙 (spaceId: space-002)
    ├── 联系人列表 B
    ├── 群组列表 B
    └── 消息数据 B
```

### 空间数据隔离

每个空间的数据完全隔离存储：

```
数据库目录结构:
C:\Users\{用户}\AppData\Roaming\{app}\
├── {userId}\
│   ├── {spaceId-1}\
│   │   └── logic.db    # 空间1的数据库
│   └── {spaceId-2}\
│       └── logic.db    # 空间2的数据库
└── forward.db          # 全局数据库
```

### 空间相关的 Key 编码

```javascript
// src/dataController/hid.js

// 将 HID 和 SpaceId 编码为唯一键
export function enCodeSpaceHid(hid, spaceId) {
  return `${spaceId}_${hid}`;
  // 例如: "space-001_user-123"
}

// 用于 Vuex Store 的 key
const peerKey = enCodeSpaceHid(userHid, currentSpaceId);
store.state.peerCollection[peerKey]; // 获取联系人数据
```

### 空间切换流程

```
1. 用户点击切换空间
         │
         ▼
2. 保存当前空间状态
         │
         ▼
3. 断开当前 Socket 连接
         │
         ▼
4. 切换数据库连接
         │
         ▼
5. 加载新空间数据
         │
         ▼
6. 重新建立 Socket 连接
         │
         ▼
7. 刷新 UI
```

---

## 消息系统

### 消息生命周期

```
发送消息流程:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. 用户输入消息                                            │
│         │                                                   │
│         ▼                                                   │
│  2. 生成本地消息 (uuid, ctime)                              │
│         │                                                   │
│         ▼                                                   │
│  3. 保存到本地数据库 (status: sending)                      │
│         │                                                   │
│         ▼                                                   │
│  4. 发送到服务器 (via Socket/HTTP)                          │
│         │                                                   │
│         ├──成功──→ 5a. 服务器返回 stime                     │
│         │              │                                    │
│         │              ▼                                    │
│         │          6a. 更新本地消息 (status: sent)          │
│         │                                                   │
│         └──失败──→ 5b. 标记发送失败 (status: failed)        │
│                        │                                    │
│                        ▼                                    │
│                    6b. 显示重发按钮                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 消息时间戳

| 字段 | 说明 | 来源 |
|------|------|------|
| `ctime` | 客户端时间 | 消息创建时的本地时间 |
| `stime` | 服务器时间 | 服务器返回的确认时间 |
| `mtime` | 修改时间 | 消息被编辑的时间 |

### 消息状态

```javascript
// 消息状态枚举
const MessageStatus = {
  SENDING: 0,    // 发送中
  SENT: 1,       // 已发送
  DELIVERED: 2,  // 已送达
  READ: 3,       // 已读
  FAILED: -1     // 发送失败
};
```

### 消息去重

使用 `uuid` 进行消息去重：

```javascript
// 接收消息时检查是否已存在
const exists = await selectObj(
  'SELECT * FROM message WHERE uuid = ?',
  [message.uuid],
  spaceId
);

if (!exists) {
  // 保存新消息
  await insertMessage(message);
}
```

---

## 数据存储

### 存储层级

```
数据存储架构:
┌─────────────────────────────────────────────────────────────┐
│                        运行时存储                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Vuex Store (内存)                       │   │
│  │  • 当前会话数据                                        │   │
│  │  • UI 状态                                            │   │
│  │  • 缓存数据                                           │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                        持久化存储                            │
│  ┌─────────────────────┐   ┌─────────────────────────┐    │
│  │  electron-store     │   │     SQLCipher          │    │
│  │  • 用户配置         │   │  • 消息数据             │    │
│  │  • Token           │   │  • 联系人数据           │    │
│  │  • 设置项          │   │  • 会话数据             │    │
│  └─────────────────────┘   └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### SQLCipher 加密数据库

项目使用 SQLCipher 对数据库进行加密：

```javascript
// 数据库加密配置
const Database = require('@journeyapps/sqlcipher');

const db = new Database(dbPath);
db.pragma(`key = '${encryptionKey}'`);
db.pragma('cipher_compatibility = 4');
```

### 数据迁移

数据库版本迁移脚本位于 `src/sql/init/`：

```
src/sql/init/
├── v1.js   # 初始版本
├── v2.js   # 添加新字段
├── v3.js   # 添加索引
├── ...
└── v29.js  # 当前最新版本
```

每次版本更新时会自动执行迁移脚本：

```javascript
// 迁移逻辑示例
if (currentVersion < targetVersion) {
  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    await runMigration(v);
  }
}
```

---

## 会议 SDK 集成

### SDK 架构

会议 SDK 作为独立进程运行：

```
┌─────────────────────────────────────────────────────────────┐
│                      Matrx 应用                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │    主进程        │     │      SDK 进程               │   │
│  │                 │ ◄──► │  (独立 BrowserWindow)       │   │
│  │  meetingSDK.js  │     │                             │   │
│  │  (89K行代码)    │     │  • 音视频处理               │   │
│  └─────────────────┘     │  • 编解码                   │   │
│          ▲               │  • 网络传输                 │   │
│          │               └─────────────────────────────┘   │
│       IPC                                                   │
│          │                                                  │
│  ┌─────────────────┐                                       │
│  │    渲染进程      │                                       │
│  │  会议 UI 组件    │                                       │
│  └─────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### SDK 调用流程

```javascript
// 1. 初始化 SDK
await sendSdk('cst-initialize', {
  appId: config.appId,
  token: userToken
});

// 2. 加入会议
await sendSdk('cst-join-meeting', {
  meetingId: 'meeting-123',
  password: '123456',
  userName: '张三',
  muteAudio: false,
  muteVideo: true
});

// 3. 控制媒体
await sendSdk('cst-mute-audio', true);  // 静音
await sendSdk('cst-mute-video', false); // 开启视频

// 4. 离开会议
await sendSdk('cst-leave-meeting');
```

---

## 安全机制

### 数据安全

```
安全层级:
┌─────────────────────────────────────────────────────────────┐
│                        传输层加密                            │
│              HTTPS / WSS (TLS 1.2+)                         │
├─────────────────────────────────────────────────────────────┤
│                        消息层加密                            │
│              E2EE 端到端加密 (可选)                          │
├─────────────────────────────────────────────────────────────┤
│                        存储层加密                            │
│              SQLCipher 数据库加密                            │
│              electron-store 加密 (生产环境)                  │
├─────────────────────────────────────────────────────────────┤
│                        日志加密                              │
│              AES-CTR 日志加密 (生产环境)                     │
└─────────────────────────────────────────────────────────────┘
```

### 上下文隔离

渲染进程默认禁用 Node.js 访问：

```javascript
// 窗口创建配置
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,      // 启用上下文隔离
    enableRemoteModule: false,   // 禁用 remote 模块
    nodeIntegration: false,      // 禁用 Node 集成
    preload: preloadPath         // 使用预加载脚本
  }
});
```

### SSL Pinning

验证服务器证书，防止中间人攻击：

```javascript
// src/utils/useCertificateVerifyProc.js
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // 验证证书
  if (isValidCertificate(certificate)) {
    callback(true);
  } else {
    callback(false);
  }
});
```

---

## 性能优化

### 虚拟列表

对于长列表使用虚拟滚动：

```vue
<template>
  <virtual-list
    :data-key="'uuid'"
    :data-sources="messages"
    :data-component="MessageItem"
    :keeps="30"
  />
</template>

<script>
import VirtualList from 'vue-virtual-scroll-list';

export default {
  components: { VirtualList }
}
</script>
```

### 防抖与节流

```javascript
import { debounce } from '@/utils/debounce';

// 搜索防抖
const debouncedSearch = debounce((keyword) => {
  searchApi(keyword);
}, 300);

// 窗口 resize 节流
window.addEventListener('resize', throttle(handleResize, 100));
```

### 消息批处理

```javascript
// src/socket/BatchProcessor.js
class BatchProcessor {
  constructor(handler, interval = 100) {
    this.queue = [];
    this.handler = handler;
    this.timer = null;
    this.interval = interval;
  }

  add(item) {
    this.queue.push(item);
    this.scheduleProcess();
  }

  scheduleProcess() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.process();
      this.timer = null;
    }, this.interval);
  }

  process() {
    const items = this.queue.splice(0, this.queue.length);
    if (items.length > 0) {
      this.handler(items);
    }
  }
}
```

### 代码分割

```javascript
// vue.config.js - 动态导入
pages: {
  index: 'src/main.js',
  screenshot: 'src/renderer/screenshot/main.js',
  // 每个页面独立打包，按需加载
}

// 组件懒加载
const HeavyComponent = () => import('@/components/HeavyComponent.vue');
```

---

## 总结

理解这些核心概念后，你将能够：

1. **理解代码结构**: 知道代码为什么这样组织
2. **定位问题**: 快速找到问题所在的模块
3. **高效开发**: 遵循项目约定进行开发
4. **优化性能**: 了解优化手段和最佳实践

---

## 相关文档

- [项目整体架构](../architecture/overview.md)
- [IPC 通信机制](../architecture/ipc-communication.md)
- [多空间架构](../architecture/multi-space-architecture.md)
- [消息系统架构](../im/message-architecture.md)
- [安全架构](../architecture/security-architecture.md)

---

**最后更新**: 2026-02-05
