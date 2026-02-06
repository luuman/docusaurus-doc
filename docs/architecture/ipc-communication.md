# IPC 通信机制详解

## 概述

IPC (Inter-Process Communication) 是 Electron 应用中主进程与渲染进程通信的核心机制。本项目封装了完整的 IPC 通信层。

## 通信架构图

```
┌────────────────────────────────────────────────────────────────────┐
│                        渲染进程 (Renderer)                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     ipcSend.js 封装层                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ ipcSend()   │  │ ipcInvoke() │  │ sendSdk()           │  │   │
│  │  │ (单向发送)   │  │ (异步调用)   │  │ (SDK通信)           │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                    ipcRenderer API                                  │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                          IPC 通道
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                              │                                      │
│                    ipcMain API                                      │
│                              │                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  IPCMainChannel.js 监听层                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │ ipcMain.on  │  │ipcMain.handle│ │ WebContents.send    │  │   │
│  │  │ (监听消息)   │  │ (处理调用)    │ │ (推送消息)           │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                         主进程 (Main)                               │
└────────────────────────────────────────────────────────────────────┘
```

## 渲染进程 IPC 封装

### `src/utils/ipc/ipcSend.js`

#### 1. 单向发送 - `ipcSend()`

```javascript
/**
 * 向主进程发送消息（无返回值）
 * @param {string} type - 消息类型/频道名
 * @param {...any} args - 消息参数
 */
export function ipcSend(type, ...args) {
  ipcRenderer.send(type, ...args);
}

// 使用示例
ipcSend('minimize-window');
ipcSend('set-badge-count', 5);
ipcSend('open-external-url', 'https://example.com');
```

#### 2. 定向发送 - `ipcSendTo()`

```javascript
/**
 * 向指定窗口发送消息
 * @param {number} to - 目标窗口的 webContentsId
 * @param {string} type - 消息类型
 * @param {...any} args - 消息参数
 */
export function ipcSendTo(to, type, ...args) {
  ipcRenderer.sendTo(to, type, ...args);
}

// 使用示例
const targetWindowId = await ipcInvoke('get-window-id', 'screenshot');
ipcSendTo(targetWindowId, 'capture-area', { x: 0, y: 0, width: 100, height: 100 });
```

#### 3. 异步调用 - `ipcInvoke()`

```javascript
/**
 * 异步调用主进程方法（返回 Promise）
 * @param {string} type - 方法名/频道名
 * @param {...any} args - 方法参数
 * @returns {Promise<any>} - 返回值
 */
export function ipcInvoke(type, ...args) {
  return ipcRenderer.invoke(type, ...args);
}

// 使用示例
const userData = await ipcInvoke('getStore', 'userData');
const filePath = await ipcInvoke('dialog:save', { filters: [{ name: 'Images', extensions: ['png'] }] });
```

#### 4. 异步调用带回调 - `ipcInvokeThen()`

```javascript
/**
 * 异步调用主进程方法（回调方式）
 * @param {string} type - 方法名
 * @param {any} args - 参数
 * @param {Function} callback - 回调函数
 */
export function ipcInvokeThen(type, args, callback) {
  ipcRenderer.invoke(type, args).then(callback);
}

// 使用示例
ipcInvokeThen('getStore', 'lang', (lang) => {
  console.log('当前语言:', lang);
});
```

#### 5. SDK 进程通信 - `sendSdk()`

```javascript
/**
 * 与 SDK 进程通信（带请求追踪）
 * @param {string} type - 消息类型
 * @param {...any} args - 参数
 * @returns {Promise<any>} - SDK 响应
 */
export function sendSdk(type, ...args) {
  const uuid = generateUUID();

  return new Promise((resolve, reject) => {
    // 设置超时
    const timeout = setTimeout(() => {
      reject(new Error('SDK request timeout'));
    }, 30000);

    // 监听响应
    ipcRenderer.once(`sdk-response-${uuid}`, (event, response) => {
      clearTimeout(timeout);
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.data);
      }
    });

    // 发送请求
    const sdkContentId = getSdkContentId();
    ipcRenderer.sendTo(sdkContentId, type, { uuid, args });
  });
}

// 使用示例
const meetingInfo = await sendSdk('create-meeting', { topic: '项目讨论' });
```

#### 6. 无返回 SDK 通信 - `sendToSdk()`

```javascript
/**
 * 向 SDK 发送消息（无返回值）
 * @param {string} type - 消息类型
 * @param {...any} args - 参数
 */
export function sendToSdk(type, ...args) {
  const sdkContentId = getSdkContentId();
  if (sdkContentId) {
    ipcRenderer.sendTo(sdkContentId, type, ...args);
  }
}

// 使用示例
sendToSdk('mute-audio', true);
sendToSdk('share-screen', { displayId: '0' });
```

## 主进程 IPC 监听

### `src/main/IPCMainChannel.js`

#### 数据管理频道

```javascript
const { ipcMain } = require('electron');

// 删除用户数据
ipcMain.handle('REMOVE_USER_DATA', async (event, userId) => {
  // 清除数据库中用户数据
  await database.removeUserData(userId);
  // 清除缓存
  await cache.clear(userId);
  // 返回结果
  return { success: true };
});

// 获取/设置 Store
ipcMain.handle('getStore', async (event, key) => {
  return store.get(key);
});

ipcMain.handle('setStore', async (event, key, value) => {
  store.set(key, value);
  // 广播给所有窗口
  broadcastStoreChange(key, value);
  return { success: true };
});

ipcMain.handle('updateStore', async (event, updates) => {
  Object.entries(updates).forEach(([key, value]) => {
    store.set(key, value);
  });
  broadcastStoreChange(updates);
  return { success: true };
});

// 同步获取 (谨慎使用，会阻塞渲染进程)
ipcMain.on('getStore-Sync', (event, key) => {
  event.returnValue = store.get(key);
});
```

#### 系统功能频道

```javascript
// 崩溃日志
ipcMain.handle('get-pre-crash-log', async () => {
  const logPath = path.join(app.getPath('userData'), 'crash.log');
  if (fs.existsSync(logPath)) {
    return fs.readFileSync(logPath, 'utf-8');
  }
  return null;
});

ipcMain.handle('set-pre-crash-log', async (event, log) => {
  const logPath = path.join(app.getPath('userData'), 'crash.log');
  fs.writeFileSync(logPath, log);
});

// 剪贴板操作
ipcMain.handle('clipboad-multiple-get', async () => {
  const clipboard = require('electron').clipboard;
  // 获取剪贴板中的文件列表
  const files = clipboard.readBuffer('FileNameW');
  return parseFileList(files);
});

ipcMain.handle('set-clipboad-multiple', async (event, files) => {
  const clipboard = require('electron').clipboard;
  clipboard.writeBuffer('FileNameW', createFileBuffer(files));
});

// 路径管理
ipcMain.handle('get-document-download-path', async () => {
  return app.getPath('downloads');
});

ipcMain.handle('set-record-path', async (event, recordPath) => {
  store.set('recordPath', recordPath);
  return { success: true };
});
```

#### 窗口控制频道

```javascript
// 窗口最小化
ipcMain.on('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

// 窗口最大化/还原
ipcMain.on('maximize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

// 关闭窗口
ipcMain.on('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

// 获取窗口状态
ipcMain.handle('get-window-state', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return {
    isMaximized: win.isMaximized(),
    isMinimized: win.isMinimized(),
    isFullScreen: win.isFullScreen()
  };
});
```

## 存储同步机制

### 主进程广播变更

```javascript
// src/main/store.js

function broadcastStoreChange(keyOrUpdates, value) {
  const updates = typeof keyOrUpdates === 'object'
    ? keyOrUpdates
    : { [keyOrUpdates]: value };

  // 获取所有窗口
  const windows = BrowserWindow.getAllWindows();

  // 向所有窗口广播
  windows.forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('changeStorage', updates);
    }
  });
}
```

### 渲染进程监听

```javascript
// src/utils/ipc/storageSync.js

import { ipcRenderer } from 'electron';
import store from '@/store';

// 初始化存储同步
export function initStorageSync() {
  // 监听主进程存储变化
  ipcRenderer.on('changeStorage', (event, updates) => {
    Object.entries(updates).forEach(([key, value]) => {
      // 更新 Vuex store
      store.commit('storage/SYNC_FROM_MAIN', { key, value });
    });
  });
}

// 初始化时从主进程同步数据
export async function syncFromMain() {
  const storage = ipcRenderer.sendSync('getStore-Sync', 'storage');
  Object.entries(storage).forEach(([key, value]) => {
    store.commit('storage/SYNC_FROM_MAIN', { key, value });
  });
}
```

## SDK 进程通信

### SDK 进程 ID 管理

```javascript
// src/utils/ipc/sdkChannel.js

let sdkContentId = null;

// 获取 SDK 进程 ID
export function getSdkContentId() {
  return sdkContentId;
}

// 设置 SDK 进程 ID
export function setSdkContentId(id) {
  sdkContentId = id;
}

// 监听 SDK 进程就绪
ipcRenderer.on('sdk-process-ok', (event, contentId) => {
  setSdkContentId(contentId);
  console.log('SDK process ready:', contentId);
});

// 监听 SDK 日志工具就绪
ipcRenderer.on('sdk-log-util-ok', () => {
  console.log('SDK log util ready');
});
```

### SDK 通信流程

```
渲染进程                        SDK 进程                       主进程
    │                              │                             │
    │  sendSdk('create-meeting')   │                             │
    │ ──────────────────────────►  │                             │
    │  (sendTo with uuid)          │                             │
    │                              │   创建会议请求                │
    │                              │ ─────────────────────────►   │
    │                              │                             │
    │                              │   返回会议信息                │
    │                              │ ◄─────────────────────────   │
    │                              │                             │
    │  sdk-response-&#123;uuid&#125;         │                             │
    │ ◄──────────────────────────  │                             │
    │  (resolve promise)           │                             │
    │                              │                             │
```

## IPC 频道清单

### 数据管理

| 频道名 | 类型 | 说明 |
|--------|------|------|
| getStore | handle | 获取存储数据 |
| setStore | handle | 设置存储数据 |
| updateStore | handle | 批量更新存储 |
| getStore-Sync | on | 同步获取存储 |
| changeStorage | send | 存储变更通知 |
| REMOVE_USER_DATA | handle | 删除用户数据 |

### 系统功能

| 频道名 | 类型 | 说明 |
|--------|------|------|
| get-pre-crash-log | handle | 获取崩溃日志 |
| set-pre-crash-log | handle | 设置崩溃标志 |
| clipboad-multiple-get | handle | 获取剪贴板文件 |
| set-clipboad-multiple | handle | 设置剪贴板文件 |
| get-document-download-path | handle | 获取下载路径 |
| set-record-path | handle | 设置录制路径 |

### 窗口控制

| 频道名 | 类型 | 说明 |
|--------|------|------|
| minimize-window | on | 最小化窗口 |
| maximize-window | on | 最大化窗口 |
| close-window | on | 关闭窗口 |
| get-window-state | handle | 获取窗口状态 |

### SDK 通信

| 频道名 | 类型 | 说明 |
|--------|------|------|
| sdk-process-ok | on | SDK 进程就绪 |
| sdk-log-util-ok | on | SDK 日志就绪 |
| hwm-process-ok | on | HWM 进程就绪 |
| sdk-response-&#123;uuid&#125; | on | SDK 响应 |

## 最佳实践

### 1. 使用 invoke 而非 send/on

```javascript
// 推荐：使用 invoke（有返回值，更清晰的错误处理）
const result = await ipcInvoke('getData', id);

// 不推荐：使用 send/on（需要手动管理回调）
ipcSend('getData', id);
ipcRenderer.once('getData-reply', callback);
```

### 2. 验证频道名称

```javascript
// preload.js 中限制可用频道
const validChannels = ['getStore', 'setStore', 'minimize'];

contextBridge.exposeInMainWorld('electron', {
  ipcInvoke: (channel, ...args) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid channel: ${channel}`);
  }
});
```

### 3. 统一错误处理

```javascript
// 封装带错误处理的调用
export async function safeInvoke(channel, ...args) {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    console.error(`IPC Error [${channel}]:`, error);
    // 上报错误
    reportError(error, { channel, args });
    throw error;
  }
}
```

### 4. 避免阻塞调用

```javascript
// 避免：同步调用会阻塞渲染进程
const data = ipcRenderer.sendSync('getStore', 'key');

// 推荐：使用异步调用
const data = await ipcRenderer.invoke('getStore', 'key');
```

## 下一步阅读

- [数据流架构](./data-flow.md) - 数据流动与状态管理
- [数据存储模块](../modules/data-storage.md) - 详细的存储方案
