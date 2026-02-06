# IPC 发送与接收

## 概述

Matrx Windows 客户端在渲染进程侧通过 `src/utils/ipc/ipcSend.js` 提供了一套统一的 IPC 发送工具集，封装了 Electron 原生的 `ipcRenderer` API。在主进程侧，各模块通过 `ipcMain.on`、`ipcMain.handle` 等方式注册监听器。本文档详细分析 IPC 发送工具的实现原理、各种通信模式的使用方式，以及渲染进程与主进程之间的监听器管理策略。

## 核心文件结构

```
src/
├── utils/
│   └── ipc/
│       └── ipcSend.js                # 渲染进程 IPC 工具集（核心）
├── IPCRenderChannel.js               # 渲染进程 SQLite IPC 通道
├── renderer/
│   └── start/
│       └── bridge/
│           └── sendTo.js             # SDK 进程 IPC 桥接工具
├── tools/
│   └── forwardDB/
│       └── appdataStorage.js         # appdata 存储 IPC 监听
├── preload.js                        # 预加载脚本 IPC 接口
└── main/
    ├── mainWindow/index.js           # 主进程消息发送工具
    ├── mainToPage.js                 # 主进程到 SDK 的桥接
    └── store.js                      # Store 数据同步监听
```

## ipcSend.js 工具详解

`src/utils/ipc/ipcSend.js` 是渲染进程中使用最广泛的 IPC 工具模块。它被整个 Vue 应用的组件、mixins、utils 等模块引用。

### 模块全貌

```javascript
// src/utils/ipc/ipcSend.js
import {ipcRenderer} from 'electron';
import {v4 as uuidv4} from 'uuid';

let sdkContentId;
let storage;
```

模块顶层维护了两个缓存变量：
- `sdkContentId`：SDK 进程的 `webContents.id`，用于跨窗口通信
- `storage`：从主进程同步来的全局 storage 数据

### getLocalStorage - 同步获取存储

```javascript
function getLocalStorage() {
    try {
        let data = ipcRenderer.sendSync('getStore-Sync', 'storage');
        if (data) {
            if (data.platform) {
                return data;
            } else {
                return null;
            }
        } else {
            return null;
        }
    } catch (e) {
        console.error('getLocalStorage', e.message);
        return null;
    }
}
```

该函数通过同步 IPC 调用 `sendSync` 从主进程获取 `storage` 对象。通过检查 `data.platform` 字段来验证数据有效性。此函数是阻塞调用，会冻结渲染进程直到主进程返回。

### getStorage - 带缓存的存储获取

```javascript
export function getStorage(name, refresh) {
    if (!storage || refresh) {
        storage = getLocalStorage() || ipcRenderer.sendSync('getStore-Sync', 'storage');
    }
    if (name) {
        return storage[name];
    } else {
        return storage;
    }
}
```

`getStorage` 实现了简单的缓存策略：
- 首次调用或 `refresh=true` 时，从主进程同步获取
- 后续调用直接返回缓存值
- 支持按 key 获取特定字段

### getSdkContentId - 获取 SDK 进程 ID

```javascript
export function getSdkContentId(refresh) {
    if (sdkContentId && !refresh) return sdkContentId;
    let eleStore = getStorage('', refresh);
    if (!eleStore.sdkContentId) {
        sdkContentId = ipcRenderer.sendSync('sdkContentId');
    } else {
        sdkContentId = eleStore.sdkContentId;
    }
    return sdkContentId;
}
```

SDK 进程的 `webContents.id` 有两个获取路径：
1. 优先从 `storage.sdkContentId` 读取
2. 回退到同步 IPC 调用 `sdkContentId` 通道

对应的主进程处理：

```javascript
// src/background.js
ipcMain.on('sdkContentId', e => {
    e.returnValue = global.sdkContentId;
});
```

### ipcSend - 单向发送

```javascript
export function ipcSend(type, ...args) {
    ipcRenderer.send(type, ...args);
}
```

最简单的 fire-and-forget 模式。用于不需要返回值的操作，如：

```javascript
import {ipcSend} from '@/utils/ipc/ipcSend';

// 设置 store 值
ipcSend('setStore', 'storage.lang', 'en');

// 设置系统托盘图标
ipcSend('setTraySetImage', true);

// 删除文件
ipcSend('DELETE_FILE', '/path/to/file');
```

### ipcSendTo - 跨窗口发送

```javascript
export function ipcSendTo(to, type, ...args) {
    ipcRenderer.sendTo(to, type, ...args);
}
```

通过指定目标 `webContents.id` 实现渲染进程之间的直接通信，绕过主进程中转。典型用法：

```javascript
// 从主窗口发送到 SDK 进程
ipcSendTo(getSdkContentId(), 'some-sdk-command', data);
```

### ipcInvoke - 异步调用

```javascript
export function ipcInvoke(type, ...args) {
    return ipcRenderer.invoke(type, ...args);
}
```

基于 Promise 的异步请求-响应模式。主进程通过 `ipcMain.handle` 注册处理器：

```javascript
// 获取 store 数据
const storage = await ipcInvoke('getStore', 'storage');

// 获取剪贴板文件
const files = await ipcInvoke('clipboad-multiple-get');

// 获取登录项设置
const settings = await ipcInvoke('GET_LOGIN_ITEM_SETTING');
```

### ipcInvokeThen - 回调式异步调用

```javascript
export function ipcInvokeThen(type, args, callback) {
    ipcRenderer.invoke(type, args).then(result => {
        callback(result);
    });
}
```

对 `ipcInvoke` 的回调风格包装，适用于不使用 async/await 的场景。

### sendSdk - SDK 进程通信

```javascript
export function sendSdk(type, ...args) {
    return new Promise(resolve => {
        const sendId = uuidv4();
        ipcRenderer.once(type + sendId, (e, data, ts) => {
            resolve(data);
        });
        sendToSdk(type, ...args, sendId);
    });
}
```

这是项目中最精巧的 IPC 模式。其工作原理：

1. 生成唯一的 `sendId`（UUID v4）
2. 注册一次性监听器，监听 `type + sendId` 通道
3. 通过 `sendTo` 将请求发送到 SDK 进程
4. SDK 进程处理后，通过 `type + sendId` 通道返回结果
5. 一次性监听器触发，Promise resolve

```
渲染进程                          SDK 进程
    │                                │
    │ sendTo('joinMeeting',          │
    │        data, sendId)           │
    ├───────────────────────────────►│
    │                                │ 处理 joinMeeting
    │                                │
    │ once('joinMeeting'+sendId)     │
    │◄───────────────────────────────┤
    │                                │
    │ resolve(data)                  │
```

### sendToSdk - 底层 SDK 发送

```javascript
export function sendToSdk(type, ...args) {
    ipcRenderer.sendTo(getSdkContentId(), type, ...args);
}
```

直接调用 `ipcRenderer.sendTo` 向 SDK 进程发送消息。

### SDK 事件监听

模块底部注册了三个持久化的 SDK 事件监听器：

```javascript
// SDK 日志工具初始化完成
ipcRenderer.on('sdk-log-util-ok', (e, data) => {
    ipcRenderer.send('setStore', 'storage.sdkUtilInit', true);
    getSdkContentId(true);  // 刷新 SDK 进程 ID
});

// SDK 进程就绪
ipcRenderer.on('sdk-process-ok', (e, data) => {
    getSdkContentId(true);
    ipcInvoke('getStore', 'storage').then(eleStore => {
        ipcRenderer.emit('changeStorage', null, eleStore);  // 本地触发 storage 更新
    });
});

// HWM 进程就绪
ipcRenderer.on('hwm-process-ok', (e, data) => {
    getSdkContentId(true);
    ipcInvoke('getStore', 'storage').then(eleStore => {
        ipcRenderer.emit('changeStorage', null, eleStore);
    });
});
```

注意 `ipcRenderer.emit('changeStorage', ...)` 是本地事件触发，不经过主进程，直接在当前渲染进程内分发。

## 主进程消息发送工具

### sendMainWinMsg - 安全发送到主窗口

```javascript
// src/main/mainWindow/index.js
export function sendMainWinMsg(msg) {
    try {
        if (
            currentWin &&
            currentWin.webContents &&
            !currentWin.webContents.isCrashed() &&
            !currentWin.webContents.isLoading() &&
            !currentWin.webContents.isLoadingMainFrame()
        ) {
            if (typeof msg === 'string') {
                currentWin.send(msg);
            } else {
                currentWin.send(msg.type, msg.data);
            }
        } else {
            loadingMsgs.push(msg);
        }
    } catch (e) {
        cryptolog.error('sendMainWinMsg catch', e, msg);
    }
}
```

此函数在发送前进行完整的状态检查：
1. **窗口存在检查** - `currentWin` 不为 null
2. **webContents 存在检查** - 确保渲染进程已创建
3. **崩溃检查** - `isCrashed()` 返回 false
4. **加载状态检查** - `isLoading()` 和 `isLoadingMainFrame()` 返回 false

支持两种消息格式：
- **字符串** - 直接作为通道名发送，无附加数据
- **对象** - `{type, data}` 结构，type 为通道名，data 为负载

### sendWinMsg - 通用窗口消息发送

```javascript
export function sendWinMsg(type, ...args) {
    try {
        if (
            currentWin &&
            currentWin.webContents &&
            !currentWin.webContents.isCrashed() &&
            !currentWin.webContents.isLoading() &&
            !currentWin.webContents.isLoadingMainFrame()
        ) {
            currentWin.send(type, ...args);
        } else {
            loadingMsgs.push([type, args]);
        }
    } catch (e) {
        cryptolog.error('sendWinMsg catch', e, type, args);
    }
}
```

与 `sendMainWinMsg` 类似，但使用 `(type, ...args)` 签名，更灵活。缓存格式为 `[type, args]` 数组。

### 消息缓冲与重放

当主窗口正在加载时（页面刷新、初始加载），消息会被缓存到 `loadingMsgs` 数组。窗口加载完成后通过 `handleLoadingMsg()` 统一重放：

```javascript
function handleLoadingMsg() {
    if (loadingMsgs && loadingMsgs.length) {
        for (let index = 0; index < loadingMsgs.length; index++) {
            const msg = loadingMsgs[index];
            if (typeof msg === 'string') {
                currentWin.send(msg);
            } else if (Array.isArray(msg)) {
                currentWin.send(msg[0], ...msg[1]);
            } else {
                currentWin.send(msg.type, msg.data);
            }
        }
        loadingMsgs = [];
    }
}
```

此函数在 `currentWin.webContents.once('did-finish-load', ...)` 回调中调用。

### mainToSdk - 主进程到 SDK 的异步桥接

```javascript
// src/main/mainToPage.js
export function mainToSdk(data) {
    return new Promise(resolve => {
        const sendType = uuidv4();
        ipcMain.once(sendType, (e, res) => {
            resolve(res);
        });
        startPageSend('MAIN_TO_SDK', sendType, data);
    });
}
```

与渲染进程的 `sendSdk` 模式类似，使用 UUID 一次性通道实现请求-响应对应。

## SDK 进程桥接工具

### sendTo.js

`src/renderer/start/bridge/sendTo.js` 在 SDK 进程（start.html）中使用，提供与主窗口的双向通信：

```javascript
// 获取主窗口 webContents ID
export function getMainWin() {
    if (mainContentId) return mainContentId;
    let eleStore = getStorage();
    if (!eleStore.mainContentId) {
        mainContentId = ipcRenderer.sendSync('mainContentId');
    } else {
        mainContentId = eleStore.mainContentId;
    }
    return mainContentId;
}

// 发送到主窗口
export function sendToMainWin(type, ...args) {
    ipcRenderer.sendTo(getMainWin(), type, ...args);
}

// 发送到主窗口（对象格式）
export function sendToMainWinData(data) {
    ipcRenderer.sendTo(getMainWin(), data.type, data.data);
}

// 异步获取主进程数据
export function getToMain(type, ...args) {
    return new Promise((resolve, reject) => {
        ipcRenderer.once(`${type}_RES`, (e, res) => {
            resolve(res);
        });
        ipcRenderer.send(type, ...args);
    });
}
```

`getToMain` 使用约定的 `${type}_RES` 通道名接收响应，要求主进程以此通道名回复。

## ipcReceive 监听器模式

### 渲染进程监听模式

渲染进程中监听主进程消息的几种方式：

#### 1. 直接 ipcRenderer.on

```javascript
// src/tools/forwardDB/appdataStorage.js
ipcRenderer.on('get-appdataStorage', (e, data) => {
    if (data.key) {
        if (Array.isArray(data.key)) {
            let arr = [];
            data.key.forEach(ele => {
                arr.push(appdataStorage.getItem(ele));
            });
            e.sender.send('get-appdataStorage-res', arr);
        } else {
            e.sender.send('get-appdataStorage-res', appdataStorage.getItem(data.key));
        }
    }
});
```

注意此处使用 `e.sender.send()` 回复，这在渲染进程中表示通过 webContents 发送回消息源。

#### 2. preload.js 中的 receive 封装

```javascript
// src/preload.js
window.ipcRenderer = {
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
};
```

子窗口通过 `window.ipcRenderer.receive()` 注册监听，`event` 对象被故意剥离。

#### 3. 模块级自动监听

`ipcSend.js` 模块在导入时自动注册全局监听器：

```javascript
// 模块加载时自动执行
ipcRenderer.on('sdk-log-util-ok', (e, data) => { ... });
ipcRenderer.on('sdk-process-ok', (e, data) => { ... });
ipcRenderer.on('hwm-process-ok', (e, data) => { ... });
```

#### 4. Storage 变更监听

```javascript
// src/renderer/start/bridge/sendTo.js
ipcRenderer.on('changeStorage', (e, data) => {
    storage = data;
});
```

当主进程的 electron-store 数据变化时，通过 `changeStorage` 通道自动同步到各渲染进程。

### 主进程监听模式

#### 1. ipcMain.on - 持久监听

```javascript
// src/main/store.js
ipcMain.on('setStore', (e, key, value) => {
    setStore(key, value);
});
```

#### 2. ipcMain.handle - 异步处理

```javascript
// src/main/store.js
ipcMain.handle('getStore', (e, key) => {
    return getStore(key);
});
```

#### 3. ipcMain.once - 一次性监听

```javascript
// src/main/IPCMainChannel.js
function getMainWinData(req) {
    return new Promise(resolve => {
        ipcMain.once('GET_CURRENT_WIN_DATA_RES', (e, res) => {
            resolve(res);
        });
        global.currentWin.send('GET_CURRENT_WIN_DATA', req);
    });
}
```

#### 4. ipcMain.emit - 内部事件

主进程内部模块间通过 `ipcMain.emit` 通信，不涉及渲染进程：

```javascript
// store 变化时触发
ipcMain.emit('SEND-CURRENT-WIN-MSG', {
    type: 'changeStorage',
    data: newValue.storage
});

// 托盘退出时
ipcMain.emit('CLEAR-TEMP-USER-RES');

// 关闭 SDK 进程
ipcMain.emit('start-page-close');
```

## 通信模式对比

| 模式 | API | 方向 | 返回值 | 阻塞 | 适用场景 |
|------|-----|------|--------|------|---------|
| 单向发送 | `ipcSend` | Renderer -> Main | 无 | 否 | 设置操作、通知 |
| 同步请求 | `sendSync` | Renderer -> Main | `returnValue` | 是 | 获取配置、ID |
| 异步请求 | `ipcInvoke` | Renderer -> Main | Promise | 否 | 数据查询、文件操作 |
| 请求-响应 | `send + reply` | Renderer &lt;-&gt; Main | 通过通道 | 否 | 对话框结果 |
| 跨窗口 | `ipcSendTo` | Renderer -> Renderer | 无 | 否 | SDK 通信 |
| SDK 请求 | `sendSdk` | Renderer -> SDK | Promise (UUID) | 否 | 会议 SDK 操作 |
| 主进程桥接 | `mainToSdk` | Main -> SDK | Promise (UUID) | 否 | 主进程调用 SDK |

## 消息流转实例

### 实例 1：获取下载路径

```
用户点击"选择下载路径"按钮
    │
    ▼
Vue 组件
    │  ipcSend('set-document-download-path', {title, defaultPath})
    │  ipcRenderer.on('set-document-download-path-res', callback)
    │
    ▼
主进程 (IPCMainChannel.js)
    │  ipcMain.on('set-document-download-path', handler)
    │  dialog.showOpenDialog({...})
    │  event.reply('set-document-download-path-res', {filePath, err})
    │
    ▼
Vue 组件回调处理
    │  更新 UI 显示新路径
```

### 实例 2：SDK 会议操作

```
Vue 组件
    │  sendSdk('joinMeeting', data)
    │  内部: sendId = uuidv4()
    │  内部: ipcRenderer.once('joinMeeting' + sendId, resolve)
    │  内部: ipcRenderer.sendTo(sdkContentId, 'joinMeeting', data, sendId)
    │
    ▼
SDK 进程 (start.html)
    │  ipcRenderer.on('joinMeeting', handler)
    │  处理会议逻辑
    │  ipcRenderer.sendTo(mainContentId, 'joinMeeting' + sendId, result)
    │
    ▼
Vue 组件 - Promise resolve(result)
```

### 实例 3：Store 数据同步

```
任意渲染进程
    │  ipcSend('setStore', 'storage.lang', 'en')
    │
    ▼
主进程 (store.js)
    │  ipcMain.on('setStore', handler)
    │  store.set('storage.lang', 'en')
    │  store.onDidAnyChange 触发
    │  ipcMain.emit('SEND-CURRENT-WIN-MSG', {type: 'changeStorage', data})
    │
    ▼
主进程 (mainWindow/index.js)
    │  ipcMain.on('SEND-CURRENT-WIN-MSG', handler)
    │  sendMainWinMsg({type: 'changeStorage', data})
    │  currentWin.send('changeStorage', data)
    │
    ▼
所有渲染进程
    │  ipcRenderer.on('changeStorage', handler)
    │  更新本地 storage 缓存和 Vuex
```

## 同步通信使用分析

项目中同步 IPC（`sendSync`）的使用场景集中在以下几处：

```javascript
// 1. 获取 store 数据
ipcRenderer.sendSync('getStore-Sync', 'storage');
ipcRenderer.sendSync('getStore', key);

// 2. 获取进程 ID
ipcRenderer.sendSync('mainContentId');
ipcRenderer.sendSync('sdkContentId');

// 3. 获取路径
ipcRenderer.sendSync('getExePath');

// 4. 窗口状态查询
ipcRenderer.sendSync('main-window', {type: 'isVisible'});
ipcRenderer.sendSync('main-window', {type: 'isMinimized'});

// 5. 截图相关
ipcRenderer.sendSync('capture-screen', {type: 'isRegistered', data});
ipcRenderer.sendSync('capture-screen', {type: 'getCursorScreenPoint'});

// 6. 清理 localStorage
ipcRenderer.sendSync('CLEAR_LOCAL_STORAGE');  // 带 2s 超时
```

同步 IPC 会阻塞渲染进程的 UI 线程，应谨慎使用。上述场景多为初始化阶段或需要立即获取结果的操作。

## 错误处理策略

### 渲染进程侧

```javascript
// ipcSend.js 中 getLocalStorage 的 try-catch
function getLocalStorage() {
    try {
        let data = ipcRenderer.sendSync('getStore-Sync', 'storage');
        if (data) {
            if (data.platform) return data;
            else return null;
        } else {
            return null;
        }
    } catch (e) {
        console.error('getLocalStorage', e.message);
        return null;  // 返回 null 而非抛出异常
    }
}
```

### 主进程侧

```javascript
// 主进程消息发送的防御性检查
export function sendMainWinMsg(msg) {
    try {
        if (currentWin && currentWin.webContents &&
            !currentWin.webContents.isCrashed() &&
            !currentWin.webContents.isLoading()) {
            // 安全发送
        } else {
            loadingMsgs.push(msg);  // 缓存待发送
        }
    } catch (e) {
        cryptolog.error('sendMainWinMsg catch', e, msg);
    }
}
```

关键的错误处理策略：
1. **所有 IPC 调用包裹 try-catch**，防止未处理异常导致进程崩溃
2. **窗口状态检查**，发送前确认目标窗口可用
3. **消息缓冲**，目标不可用时暂存消息
4. **同步调用的回退值**，`sendSync` 失败时返回合理默认值
