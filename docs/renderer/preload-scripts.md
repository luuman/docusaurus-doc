# 预加载脚本

## 概述

预加载脚本（preload scripts）是 Electron 安全架构中的关键组件，在渲染进程的页面加载之前执行。预加载脚本运行在特权环境中，可以同时访问 Node.js API 和 DOM API，负责在渲染进程和主进程之间建立安全的通信桥梁。

Matrx Windows 客户端包含 5 个预加载脚本：1 个主窗口预加载和 4 个独立窗口专用预加载。每个预加载脚本通过 `window` 对象暴露经过白名单过滤的 IPC 通信接口。

## 核心文件结构

```
src/
├── preload.js                                 # 主窗口预加载脚本
└── renderer/
    ├── screenshot/preload.js                  # 截屏窗口预加载
    ├── callfeedback/preload.js                # 通话反馈窗口预加载
    ├── aiModel/preload.js                     # AI 助手窗口预加载
    └── combineChat/preload.js                 # 合并聊天窗口预加载
```

## preload.js - 主窗口预加载

**文件**: `src/preload.js`

主窗口预加载脚本是整个应用的核心预加载模块，负责暴露 IPC 通信接口和初始化本地存储系统。

### 源码分析

```javascript
import { ipcRenderer } from 'electron';
import '@/plugins/localforage/initStorage.js';

// 暴露 ipcRenderer 包装到 window
window.ipcRenderer = {
    send: (channel, ...args) => {
        console.log('ipcRenderer send', channel, args);
        ipcRenderer.send(channel, ...args);
    },
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel, func) => {
        ipcRenderer.removeListener(channel, func);
    }
};

// 主窗口状态查询
window.mainwindow = {
    isVisible() {
        return ipcRenderer.sendSync('main-window', { type: 'isVisible' });
    },
    isMinimized() {
        return ipcRenderer.sendSync('main-window', { type: 'isMinimized' });
    }
};

// 截图快捷键管理（从主窗口控制）
window.screenshot = {
    globalShortcut: {
        isRegistered(data) {
            return ipcRenderer.sendSync('capture-screen', { type: 'isRegistered', data });
        },
        unregister(data) {
            return ipcRenderer.sendSync('capture-screen', { type: 'unregister', data });
        }
    }
};
```

### 暴露的 API

| 全局对象 | 方法 | 通信方式 | 功能 |
|----------|------|----------|------|
| `window.ipcRenderer` | `send(channel, ...args)` | 异步 | 向主进程发送消息 |
| `window.ipcRenderer` | `receive(channel, func)` | 监听 | 监听主进程消息（自动剥离 event） |
| `window.ipcRenderer` | `removeListener(channel, func)` | - | 移除监听器 |
| `window.mainwindow` | `isVisible()` | 同步 | 查询主窗口是否可见 |
| `window.mainwindow` | `isMinimized()` | 同步 | 查询主窗口是否最小化 |
| `window.screenshot.globalShortcut` | `isRegistered(data)` | 同步 | 检查截图快捷键是否已注册 |
| `window.screenshot.globalShortcut` | `unregister(data)` | 同步 | 注销截图快捷键 |

### 本地存储初始化

```javascript
import '@/plugins/localforage/initStorage.js';
```

预加载阶段初始化 `localforage` 存储系统，为渲染进程提供本地离线数据存储能力。

### 安全特性

主窗口预加载脚本采用**开放式**通道策略 -- `send` 方法不进行频道白名单校验，直接转发所有消息。这是因为主窗口是可信环境，所有 IPC 频道均由应用自身代码调用。

```javascript
send: (channel, ...args) => {
    // 注意：未启用白名单过滤
    // if (validChannels.includes(channel)) {
    ipcRenderer.send(channel, ...args);
    // }
}
```

`receive` 方法通过剥离 `event` 对象来防止渲染进程获取 `sender` 信息：

```javascript
receive: (channel, func) => {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on(channel, (event, ...args) => func(...args));
}
```

## screenshot/preload.js - 截屏窗口预加载

**文件**: `src/renderer/screenshot/preload.js`

截屏窗口预加载脚本提供了最丰富的 API 集合，涵盖窗口控制、屏幕捕获、文件操作、剪贴板访问以及 Win32 原生 API 调用。

### ipcRenderer 包装

```javascript
window.ipcRenderer = {
    send: (channel, data) => {
        let validChannels = ['capture-screen', 'Fire_Base_Fire_Name'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let validChannels = ['capture-screen'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, func);
        }
    },
    removeListener: (channel, func) => {
        ipcRenderer.removeListener(channel, func);
    }
};
```

白名单频道：
- `send`: `capture-screen`、`Fire_Base_Fire_Name`
- `receive`: `capture-screen`

### 截屏控制 API

```javascript
window.screenshot = {
    // Electron 窗口控制
    focus(),                              // 窗口获焦
    setOpacity(data),                     // 设置窗口透明度（invoke）
    getOpacity(data),                     // 获取窗口透明度（sendSync）
    setIgnoreMouseEvents(data),           // 设置鼠标事件穿透（invoke）
    getBounds(),                          // 获取窗口位置和大小（sendSync）
    setBounds(data),                      // 设置窗口位置和大小（invoke）
    getCursorScreenPoint(),               // 获取鼠标屏幕坐标（sendSync）
    getCurrentScreen(),                   // 获取当前屏幕信息（sendSync）
    getPrimaryDisplay(),                  // 获取主显示器信息（sendSync）
    screenshotDesktop(display),           // 执行桌面截图（invoke）

    // 文件操作
    dialog: {
        showSaveDialog(data),             // 显示保存文件对话框（invoke）
    },
    fs: {
        writeFile(...args),               // 写入文件（invoke）
    },

    // 剪贴板操作
    clipboardWriteImage(url),             // 将 DataURL 写入剪贴板

    // 自定义 API
    getDisplayBounds(),                   // 获取屏幕边界信息（sendSync）

    // Win32 原生 API
    user32: {
        getPreviewWindowRect({ taskTool, sources, screen }),
                                          // 获取窗口位置信息（sendSync）
        setShowCursor(data)               // 控制光标显示（sendSync）
    }
};
```

### 通信方式选择

截屏窗口 API 根据使用场景选择不同的 IPC 通信方式：

| 方式 | 适用场景 | 示例 |
|------|----------|------|
| `ipcRenderer.invoke` | 需要异步返回结果 | `focus()`、`setBounds()`、`screenshotDesktop()` |
| `ipcRenderer.sendSync` | 需要同步返回结果 | `getBounds()`、`getCursorScreenPoint()`、`getOpacity()` |
| `ipcRenderer.send` | 不需要返回结果 | 事件通知类操作 |

### 剪贴板直接访问

截屏窗口是唯一直接访问 Electron `clipboard` 和 `nativeImage` API 的预加载脚本：

```javascript
import { ipcRenderer, clipboard, nativeImage } from 'electron';

clipboardWriteImage(url) {
    return clipboard.writeImage(nativeImage.createFromDataURL(url));
}
```

这是因为截屏完成后需要将截图直接写入系统剪贴板，通过 IPC 中转会增加不必要的延迟。

## callfeedback/preload.js - 通话反馈窗口预加载

**文件**: `src/renderer/callfeedback/preload.js`

通话反馈窗口预加载脚本提供通话质量反馈相关的 API。

### ipcRenderer 包装

```javascript
window.ipcRenderer = {
    send: (channel, data) => {
        let validChannels = [constants.SET_CALL_FEEDBACK, 'chats-setting-open-link', 'SEND-CURRENT-WIN-MSG'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let validChannels = [constants.SET_CALL_FEEDBACK];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, func);
        }
    },
    removeListener: (channel, func) => {
        ipcRenderer.removeListener(channel, func);
    }
};
```

白名单频道：
- `send`: `SET_CALL_FEEDBACK`、`chats-setting-open-link`、`SEND-CURRENT-WIN-MSG`
- `receive`: `SET_CALL_FEEDBACK`

### 通话反馈专用 API

```javascript
window.callfeedback = {
    getStoreSyncDeviceId() {
        return ipcRenderer.sendSync('getStore-Sync', 'storage.deviceId');
    },
    getFeedbackReasionList(data) {
        return ipcRenderer.invoke('get-Feedback', data);
    },
    setFeedbackReasionList(data) {
        ipcRenderer.send('set-Feedback', data);
    },
    getAppdataStorage(key) {
        return ipcRenderer.sendSync('get-appdataStorage', { key });
    },
    close() {
        return ipcRenderer.invoke('callfeedback', { type: 'close' });
    },
    setOpacity(data) {
        return ipcRenderer.invoke('callfeedback', { type: 'setOpacity', data });
    },
    focus() {
        return ipcRenderer.invoke('callfeedback', { type: 'focus' });
    },
    setSize(data) {
        return ipcRenderer.invoke('callfeedback', { type: 'setSize', data });
    },
    hide() {
        return ipcRenderer.invoke('callfeedback', { type: 'hide' });
    }
};
```

| 方法 | 功能 |
|------|------|
| `getStoreSyncDeviceId()` | 同步获取设备 ID |
| `getFeedbackReasionList(data)` | 获取反馈原因列表 |
| `setFeedbackReasionList(data)` | 提交反馈原因 |
| `getAppdataStorage(key)` | 访问 appdataStorage |
| `close()` | 关闭反馈窗口 |
| `setOpacity(data)` | 设置窗口透明度 |
| `focus()` | 窗口获焦 |
| `setSize(data)` | 设置窗口大小 |
| `hide()` | 隐藏窗口 |

## aiModel/preload.js - AI 助手窗口预加载

**文件**: `src/renderer/aiModel/preload.js`

AI 助手窗口预加载脚本提供 AI 对话相关的 API 接口。

### ipcRenderer 包装

与 callfeedback 共享相同的白名单配置。

### AI 对话 API

```javascript
window.aiIpcBack = {
    createSession: data => ipcRenderer.invoke('get-ai-new-id', data),
    listSessions: data => ipcRenderer.invoke('get-ai-list', data),
    deleteConversation: data => ipcRenderer.invoke('delete-ai-conversation', data),
    sendMessage: data => ipcRenderer.invoke('get-ai-chart', data),
    getMessageHistory: data => ipcRenderer.invoke('get-ai-message', data),
    deleteMessage: data => ipcRenderer.invoke('delete-ai-message', data),
    uploadFile: data => ipcRenderer.invoke('get-ai-file', data),
    uploadAiFile: data => ipcRenderer.invoke('get-ai-file-upload', data),
    downLoadAiFile: data => ipcRenderer.invoke('get-ai-file-down', data)
};
```

| 方法 | IPC 频道 | 功能 |
|------|----------|------|
| `createSession` | `get-ai-new-id` | 创建新对话会话 |
| `listSessions` | `get-ai-list` | 获取会话列表 |
| `deleteConversation` | `delete-ai-conversation` | 删除对话 |
| `sendMessage` | `get-ai-chart` | 发送消息给 AI |
| `getMessageHistory` | `get-ai-message` | 获取历史消息 |
| `deleteMessage` | `delete-ai-message` | 删除消息 |
| `uploadFile` | `get-ai-file` | 上传文件 |
| `uploadAiFile` | `get-ai-file-upload` | 上传 AI 文件 |
| `downLoadAiFile` | `get-ai-file-down` | 下载 AI 文件 |

所有 AI API 均使用 `ipcRenderer.invoke` 实现异步请求-响应模式，由主进程中的 `ipcMain.handle` 处理并返回结果。

## combineChat/preload.js - 合并聊天窗口预加载

**文件**: `src/renderer/combineChat/preload.js`

合并聊天记录查看窗口的预加载脚本。

### ipcRenderer 包装

```javascript
const validChannels = ['uploadCombime', 'getChatImages', 'picture-viewer'];

window.ipcRenderer = {
    send: (channel, data) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, func);
        }
    },
    removeListener: (channel, func) => {
        ipcRenderer.removeListener(channel, func);
    }
};
```

白名单频道：`uploadCombime`、`getChatImages`、`picture-viewer`

### 合并聊天专用 API

```javascript
window.combineIpcBack = {
    getCombineMsgs: data => ipcRenderer.invoke('get-combine-msgs', data),
    getRobotInfo: data => ipcRenderer.invoke('get-robots-msgs', data)
};
```

| 方法 | 功能 |
|------|------|
| `getCombineMsgs` | 获取合并转发的消息列表 |
| `getRobotInfo` | 获取机器人信息 |

### appdataStorage 远程桥接

```javascript
window.appdataStorage = {
    getItem: key => ipcRenderer.sendSync('get-appdataStorage', { key }),
    setItem: (key, value) => ipcRenderer.send('set-appdataStorage', { key, value })
};
```

合并聊天窗口通过 IPC 同步调用实现 `appdataStorage` 的远程访问，使独立窗口能够读写主窗口的 appdata 存储。

## contextBridge API 暴露模式

### 当前实现模式

Matrx Windows 客户端目前使用直接挂载 `window` 对象的方式暴露 API，而非 Electron 推荐的 `contextBridge.exposeInMainWorld`：

```javascript
// 当前方式：直接挂载 window
window.ipcRenderer = { /* ... */ };
window.screenshot = { /* ... */ };
```

这种方式在 `contextIsolation: false` 配置下工作。项目使用的 Electron 20 版本中，这是常见的做法。

### API 暴露对比表

| 预加载脚本 | window 对象 | API 数量 | 白名单策略 |
|-----------|-------------|----------|-----------|
| `preload.js` | `ipcRenderer`、`mainwindow`、`screenshot.globalShortcut` | 7 | 无（开放） |
| `screenshot/preload.js` | `ipcRenderer`、`screenshot` | 18+ | send: 2 个频道，receive: 1 个频道 |
| `callfeedback/preload.js` | `ipcRenderer`、`callfeedback` | 12 | send: 3 个频道，receive: 1 个频道 |
| `aiModel/preload.js` | `ipcRenderer`、`aiIpcBack` | 12 | send: 3 个频道，receive: 1 个频道 |
| `combineChat/preload.js` | `ipcRenderer`、`combineIpcBack`、`appdataStorage` | 9 | send/receive: 3 个频道 |

## 安全最佳实践

### 当前安全措施

1. **频道白名单**：独立窗口的预加载脚本对 `send` 和 `receive` 使用频道白名单过滤，限制渲染进程可访问的 IPC 频道
2. **event 对象剥离**：`receive` 方法通过回调包装剥离 `event` 对象，防止暴露 `sender` 信息
3. **最小权限原则**：每个独立窗口仅暴露其业务所需的最小 API 集合
4. **同步/异步分离**：敏感操作（如窗口控制）使用 `invoke` 异步模式，查询操作使用 `sendSync` 同步模式

### IPC 通信方式选择指南

| 通信方式 | 特点 | 适用场景 |
|----------|------|----------|
| `ipcRenderer.send` | 单向异步，无返回值 | 事件通知、状态更新 |
| `ipcRenderer.sendSync` | 同步阻塞，有返回值 | 快速查询（如获取窗口状态） |
| `ipcRenderer.invoke` | 双向异步，Promise 返回 | 数据请求、文件操作等耗时操作 |
| `ipcRenderer.sendTo` | 直接发送到指定 webContents | 窗口间直接通信 |

### 预加载脚本加载时机

```
BrowserWindow 创建
    │
    ▼
preload 脚本执行
    │
    ├─ 导入 electron 模块
    ├─ 初始化 localforage（仅主窗口）
    ├─ 挂载 window API
    │
    ▼
页面 HTML 加载
    │
    ▼
渲染进程 JS 执行（main.js / index.js）
    │
    ├─ 通过 window.ipcRenderer 进行 IPC 通信
    ├─ 通过 window.screenshot 等控制窗口
    └─ 通过 window.appdataStorage 访问存储
```

### 主窗口与独立窗口预加载差异

| 特性 | 主窗口 `preload.js` | 独立窗口 `preload.js` |
|------|---------------------|----------------------|
| 频道白名单 | 无（全部开放） | 有（严格限制） |
| 存储初始化 | `initStorage.js` | 无或 IPC 桥接 |
| API 丰富度 | 基础 IPC + 窗口查询 | 业务专用 API |
| 直接 Electron API | 无 | 部分（如 clipboard） |
| 全局存储 | 在 `main.js` 中初始化 | 通过 IPC 远程访问 |
