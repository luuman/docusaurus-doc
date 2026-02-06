# IPC 最佳实践

## 概述

基于对 Matrx Windows 客户端源码中 IPC 通信模式的全面分析，本文档总结了项目中已采用的良好实践、已发现的潜在问题，以及推荐的改进方向。内容涵盖通道管理策略、大数据传输优化、超时与重试机制、错误处理模式和调试技巧。

## 核心文件结构

```
涉及 IPC 最佳实践的关键文件：
src/
├── utils/ipc/ipcSend.js               # 渲染进程工具集（参考实现）
├── main/mainWindow/index.js            # 消息缓冲模式（参考实现）
├── main/mainToPage.js                  # UUID 请求匹配（参考实现）
├── main/store.js                       # 数据同步模式（参考实现）
├── main/toaster.js                     # 子窗口通信模式
├── main/update/index.js                # 通道清理模式
├── main/notification.js                # 节流控制模式
├── main/screenshot/capture-main.js     # 复合通道模式
├── preload.js                          # 安全接口暴露
└── background.js                       # 集中注册模式
```

## 一、通道管理策略

### 1.1 通道命名统一

项目中存在多种命名风格混用的情况。推荐统一采用以下规范：

```
现状：
  REMOVE_USER_DATA      (UPPER_SNAKE)
  get-document-download-path  (kebab-case)
  setStore              (camelCase)
  sys:win32ComputerSystem     (namespace:camelCase)

推荐规范：
  模块前缀:操作描述
  store:set             代替 setStore
  store:get             代替 getStore
  store:get-sync        代替 getStore-Sync
  window:control        代替 WINDOW-CONTROL
  file:save-as          代替 SAVE-AS-PIC
  capture:screen        代替 capture-screen
```

项目中已有部分良好实践的命名约定：

```javascript
// src/main/constants.js - 使用常量统一管理通道名
export const MEETING_INFO_CREATE_WINDOW = 'MEETING_INFO_CREATE_WINDOW';
export const MEETING_INFO_CLOSE_WINDOW = 'MEETING_INFO_CLOSE_WINDOW';
export const MEETING_INFO_HIDE_WINDOW = 'MEETING_INFO_HIDE_WINDOW';
export const MEETING_INFO_REFRESH_DATA = 'MEETING_INFO_REFRESH_DATA';
export const MEETING_INFO_SET_SIZE = 'MEETING_INFO_SET_SIZE';
export const SET_CALL_FEEDBACK = 'SET_CALL_FEEDBACK';
```

```javascript
// src/main/callfeedback/channel.js - 模块级通道常量
export const CALL_FEEDBACK_MEETING_INFO = 'CALL_FEEDBACK_MEETING_INFO';
export const CALL_FEEDBACK_CREATE_WINDOW = 'CALL_FEEDBACK_CREATE_WINDOW';
export const CALL_FEEDBACK_CLOSE_WINDOW = 'CALL_FEEDBACK_CLOSE_WINDOW';
export const CALL_FEEDBACK_SET_SIZE = 'CALL_FEEDBACK_SET_SIZE';
export const CALL_FEEDBACK_BLUR_WINDOW = 'CALL_FEEDBACK_BLUR_WINDOW';
export const CALL_FEEDBACK_GET_ACTIONS = 'CALL_FEEDBACK_GET_ACTIONS';
export const CALL_FEEDBACK_SET_ACTION = 'CALL_FEEDBACK_SET_ACTION';
export const CALL_FEEDBACK_SET_CONFIG = 'CALL_FEEDBACK_SET_CONFIG';
export const CALL_FEEDBACK_RESET_ACTIONS = 'CALL_FEEDBACK_RESET_ACTIONS';
export const CALL_FEEDBACK_SHOW_WINDOW = 'CALL_FEEDBACK_SHOW_WINDOW';
```

建议所有模块都遵循此模式，将通道名提取为常量，避免字符串硬编码导致的拼写错误。

### 1.2 通道分模块注册

项目中各模块独立注册自己的 IPC 通道，这是一个好的实践：

```javascript
// 每个模块导出一个初始化函数
export function initNotification() { ... }   // notification.js
export function initDialogIpc() { ... }      // dialogOpen.js
export function initshortcutWin() { ... }    // shortcut/index.js
export function initUpdateWin() { ... }      // update/index.js
export function initStorageDataWin() { ... } // storageData/index.js
export function initToaster() { ... }        // toaster.js
```

但 `background.js` 中仍存在大量直接注册的通道（约 30 个），建议进一步拆分到独立模块。

### 1.3 通道清理

`update/index.js` 展示了良好的通道清理实践：

```javascript
export function initUpdateWin() {
    // 移除已有监听器，防止热更新时重复绑定
    ipcMain.removeAllListeners('update-win');
    ipcMain.removeAllListeners('SEND-CURRENT-UPDATE-MSG');
    ipcMain.removeAllListeners('update-center');

    ipcMain.on('update-win', async function (event, params) { ... });
    ipcMain.on('SEND-CURRENT-UPDATE-MSG', (e, msg) => { ... });
    ipcMain.on('update-center', (event, params) => { ... });
}
```

在开发模式下的热重载（HMR）中，模块可能被多次加载。如果不清理旧监听器，同一通道会注册多个处理函数，导致重复执行。建议所有模块在初始化时都采用此模式。

### 1.4 复合通道模式

`capture-screen` 通道展示了一种"单通道多操作"的设计模式：

```javascript
ipcMain.on('capture-screen', async (event, params) => {
    const {type = 'start', ...rest} = params || {};
    switch (type) {
        case 'start': ...
        case 'complete': ...
        case 'select': ...
        case 'reset': ...
        case 'close': ...
        case 'Escape': ...
        case 'register-shortcut': ...
    }
});
```

**优点**：减少通道数量，相关功能集中管理。

**缺点**：同步和异步操作混在一个处理函数中，`returnValue` 和普通回调混用。

**建议**：将同步操作（如 `getCursorScreenPoint`、`getBounds`）拆分为独立的 `handle` 通道，异步操作保持在复合通道中。

## 二、大数据传输优化

### 2.1 SQLite 数据传输

`IPCRenderChannel.js` 使用了基于 `callId` 的异步请求-响应模式处理数据库操作：

```javascript
const pendingCalls = {};

export const IPCRenderChannel = {
    init() {
        ipcRenderer.on('sqliteRsp', async (event, callId, error, data) => {
            const callInfo = pendingCalls[callId];
            delete pendingCalls[callId];
            if (callInfo) {
                if (error) {
                    callInfo.reject(error);
                } else {
                    callInfo.resolve(data);
                }
            }
        });
    }
};
```

此模式的优点：
- 使用统一的 `sqliteRsp` 通道，减少通道注册开销
- `callId` 机制支持并发请求
- 及时清理 `pendingCalls` 中已完成的请求，避免内存泄漏

### 2.2 Store 数据同步

`store.js` 通过 `onDidAnyChange` 监听器实现数据同步：

```javascript
store.onDidAnyChange((newValue, oldValue) => {
    if (!isEqual(newValue.storage, oldValue.storage)) {
        ipcMain.emit('SEND-CURRENT-WIN-MSG', {
            type: 'changeStorage',
            data: newValue.storage
        });
    }
});
```

使用 `lodash.isEqual` 进行深度比较，避免无变更时的无效传输。这是一个重要的优化，因为 store 的写入操作可能频繁发生。

### 2.3 图片数据传输

图片相关操作中，项目使用了文件路径传输而非直接传输图片二进制数据：

```javascript
// 截图完成后传递文件 URL
mainWindow.webContents.send('PASTE_CAPTURE_IMG', url);

// 图片旋转后传递路径
currentWin.webContents.send('rotate-img-Res', res);
// res = [{index, path, isReplaceIgnoreSymbol}]
```

**建议**：对于需要传输大文件的场景，始终优先传递文件路径而非文件内容，让渲染进程按需读取。

### 2.4 加密数据传输

加密操作中使用 Buffer 进行高效传输：

```javascript
ipcMain.on('Encryptd-Content', (e, msg, key, iv) => {
    // msg, key, iv 均为 Buffer
    let res = SDKSSEncryptd(msg, key, iv);
    e.reply('Encryptd-Content-Res', res);  // res 为 Buffer
});
```

Electron IPC 的结构化克隆算法原生支持 Buffer 和 ArrayBuffer 传输，无需额外的 base64 编码/解码开销。

## 三、超时与重试机制

### 3.1 现有超时实现

项目中有少量的超时处理：

```javascript
// background.js - CLEAR_LOCAL_STORAGE 带 2 秒超时
ipcMain.on('CLEAR_LOCAL_STORAGE', async e => {
    let timer = setTimeout(() => {
        e.returnValue = 1;
        cryptolog.warn('app CLEAR_LOCAL_STORAGE setTimeout');
    }, 2000);
    await session.defaultSession.clearStorageData({
        storages: ['localstorage', 'indexdb', 'websql']
    });
    e.returnValue = 1;
    clearTimeout(timer);
    timer = null;
});
```

此实现对同步 IPC 设置了超时保护，防止长时间阻塞渲染进程。

### 3.2 SDK 通信超时

`meetingSDK.js` 中的令牌刷新存在超时控制：

```javascript
let maxWait = 5 * 1000;
let maxTokenTimer = 0;
```

### 3.3 通知节流

`notification.js` 使用 lodash throttle 控制通知频率：

```javascript
export function initNotification() {
    ipcMain.on(
        'showNotification',
        throttle((e, val) => {
            showNotification(val);
        }, noticeTimer)  // noticeTimer = 3000ms
    );
}
```

同时设置了通知自动关闭超时：

```javascript
const noticeDelay = 10000;
timerOut = setTimeout(() => {
    notification.close();
    notification = null;
    clearTimeout(timerOut);
}, noticeDelay);
```

### 3.4 建议的超时包装器

对于使用 `ipcRenderer.once` + UUID 的请求-响应模式，建议添加超时保护：

```javascript
// 推荐的超时包装
function sendSdkWithTimeout(type, args, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const sendId = uuidv4();
        const timer = setTimeout(() => {
            ipcRenderer.removeAllListeners(type + sendId);
            reject(new Error(`IPC timeout: ${type} after ${timeout}ms`));
        }, timeout);

        ipcRenderer.once(type + sendId, (e, data) => {
            clearTimeout(timer);
            resolve(data);
        });

        sendToSdk(type, ...args, sendId);
    });
}
```

当前的 `sendSdk` 实现没有超时机制，如果 SDK 进程未响应，Promise 将永远处于 pending 状态，导致内存泄漏。

### 3.5 mainToSdk 的超时风险

```javascript
// src/main/mainToPage.js - 当前实现无超时
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

如果 SDK 进程崩溃或未启动，`ipcMain.once(sendType, ...)` 将永远不会触发。建议添加超时和错误处理。

## 四、错误处理模式

### 4.1 主进程发送防御

项目中最成熟的错误处理模式是 `sendMainWinMsg`：

```javascript
export function sendMainWinMsg(msg) {
    try {
        if (
            currentWin &&
            currentWin.webContents &&
            !currentWin.webContents.isCrashed() &&
            !currentWin.webContents.isLoading() &&
            !currentWin.webContents.isLoadingMainFrame()
        ) {
            // 安全发送
            if (typeof msg === 'string') {
                currentWin.send(msg);
            } else {
                currentWin.send(msg.type, msg.data);
            }
        } else {
            // 窗口不可用时缓冲消息
            loadingMsgs.push(msg);
        }
    } catch (e) {
        cryptolog.error('sendMainWinMsg catch', e, msg);
    }
}
```

检查项：
1. 窗口引用是否存在
2. webContents 是否可用
3. 渲染进程是否已崩溃
4. 页面是否正在加载
5. 主框架是否正在加载

### 4.2 渲染进程防御

```javascript
// src/utils/ipc/ipcSend.js
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

返回 `null` 而非抛出异常，调用方需要处理 `null` 值。

### 4.3 handle 模式的错误传播

`ipcMain.handle` 的异常会自动传播到 `ipcRenderer.invoke` 的 reject：

```javascript
// 主进程
ipcMain.handle('getStore', (e, key) => {
    return getStore(key);  // 如果抛出异常，会被自动传播
});

// 渲染进程
try {
    const data = await ipcRenderer.invoke('getStore', 'storage');
} catch (err) {
    // 捕获主进程传播的异常
}
```

这是使用 `handle/invoke` 的一大优势，建议逐步将 `on/reply` 模式迁移到 `handle/invoke`。

### 4.4 常见错误场景与处理

| 错误场景 | 现有处理 | 建议改进 |
|---------|---------|---------|
| 窗口已销毁 | `currentWin && !currentWin.isDestroyed()` 检查 | 统一封装为 safeSend 工具 |
| 渲染进程崩溃 | `isCrashed()` 检查 + 消息缓冲 | 添加崩溃恢复逻辑 |
| 同步调用阻塞 | 部分有超时保护 | 全面添加超时 |
| UUID 响应丢失 | 无处理 | 添加超时清理 |
| 重复注册 | update 模块有 removeAllListeners | 所有模块统一处理 |

### 4.5 update/index.js 中的 safeSend 模式

```javascript
// src/main/update/index.js
function safeSendToMain(channel, data) {
    const win = global.currentWin;
    if (win && win.webContents) {
        win.webContents.send(channel, data);
    } else {
        devLog.warn(`[safeSendToMain] cannot send message, currentWin or webContents unavailable. Channel: ${channel}`);
    }
}
```

这是一个简洁的安全发送模式，建议将其提升为全局工具函数。

## 五、调试技巧

### 5.1 开发者工具

项目中多处提供了打开 DevTools 的 IPC 通道：

```javascript
// 打开主窗口 DevTools
ipcMain.on('openDevTools-main', e => {
    if (process.env.NODE_ENV === 'development') {
        currentWin.webContents.openDevTools({ mode: 'detach' });
    }
});

// 打开 SDK 进程 DevTools
ipcMain.on('openDevTools-start', e => {
    if (debug) {
        startPage.win.webContents.openDevTools({ mode: 'detach' });
    }
});
```

使用 `mode: 'detach'` 将 DevTools 作为独立窗口打开，不影响主窗口布局。

### 5.2 日志追踪

项目使用多级日志系统记录 IPC 通信：

```javascript
// 加密日志 - 安全相关
const cryptolog = require('./logs/cryptolog.js');
cryptolog.info('createWindow in ready');

// 开发日志 - 调试信息
const devLog = require('./logs/devLog.js');
devLog.log('storage.mainContentId', currentWin.webContents.id);

// 会议日志 - SDK 相关
const log = require('../logs/meetingLog');
log.log('CST_SDK000:');

// 截图日志 - 截图模块
import screenshotLogMain from '@/logs/screenshotLogMain';
screenshotLogMain.log('captureScreen start');
```

### 5.3 IPC 通信调试建议

#### 使用 console.time 测量 IPC 耗时

项目中已有此实践：

```javascript
// src/utils/ipc/ipcSend.js (注释掉的代码)
export function sendSdk(type, ...args) {
    return new Promise(resolve => {
        const sendId = uuidv4();
        // console.time(type + sendId);
        ipcRenderer.once(type + sendId, (e, data, ts) => {
            // console.timeEnd(type + sendId);
            resolve(data);
        });
        sendToSdk(type, ...args, sendId);
    });
}
```

建议在开发环境启用此计时功能，帮助识别慢速 IPC 调用。

#### Electron DevTools 中查看 IPC 消息

在渲染进程的 DevTools Console 中：

```javascript
// 监听所有发送的 IPC 消息
const originalSend = ipcRenderer.send;
ipcRenderer.send = function(channel, ...args) {
    console.log('[IPC Send]', channel, args);
    return originalSend.call(this, channel, ...args);
};
```

#### 主进程调试

通过 `--inspect` 参数启动 Electron 调试主进程：

```bash
electron --inspect=5858 .
```

然后在 Chrome 中打开 `chrome://inspect` 连接到主进程。

### 5.4 性能监控

项目中 `memoryUsage.js` 提供了进程性能指标获取：

```javascript
// src/main/memoryUsage.js
ipcMain.on('getAppMetrics', () => {
    // 获取所有进程的内存使用情况
});
```

在应用崩溃时自动调用以记录内存状态。

### 5.5 常见调试场景

#### 场景 1：消息发送后无响应

排查步骤：
1. 确认通道名是否拼写正确（常见问题：大小写、连字符/下划线混用）
2. 确认目标进程是否已初始化并注册监听器
3. 检查是否存在同名 `on` 和 `handle` 冲突
4. 使用 `webContents.id` 确认 `sendTo` 的目标正确

#### 场景 2：消息重复接收

排查步骤：
1. 检查是否存在多次 `on` 注册（热更新导致）
2. 确认 `once` 和 `on` 是否混用
3. 检查 `removeAllListeners` 是否在模块重新初始化时调用

#### 场景 3：同步调用导致界面卡顿

排查步骤：
1. 搜索 `sendSync` 调用
2. 确认同步处理函数中是否有异步操作（如文件 I/O）
3. 考虑迁移到 `invoke/handle` 模式

## 六、迁移建议

### 6.1 同步调用迁移

项目中存在重复注册的 `getStore` 通道：

```javascript
// 同步版本
ipcMain.on('getStore-Sync', (e, key, type) => {
    e.returnValue = getStore(key);
});
ipcMain.on('getStore', (e, key) => {
    e.returnValue = getStore(key);
});

// 异步版本
ipcMain.handle('getStore', (e, key) => {
    return getStore(key);
});
```

建议逐步将渲染进程中的 `sendSync('getStore-Sync', ...)` 和 `sendSync('getStore', ...)` 迁移为 `invoke('getStore', ...)`。

### 6.2 reply 模式迁移

```javascript
// 当前模式（需要手动管理响应通道名）
ipcMain.on('get-document-download-path', (event, arg) => {
    let docPath = getDocumentPath();
    event.reply('get-document-download-path-res', docPath);
});

// 推荐模式（自动管理响应）
ipcMain.handle('get-document-download-path', (event, arg) => {
    return getDocumentPath();
});
```

`handle/invoke` 模式的优势：
- 无需管理响应通道名
- 自动异常传播
- 返回值自动 Promise 包装
- 避免响应通道名不匹配的 bug

### 6.3 contextIsolation 准备

当前项目使用 `contextIsolation: false`，这在 Electron 20 中已标记为不安全。如果未来升级 Electron，需要：

1. 启用 `contextIsolation: true`
2. 使用 `contextBridge.exposeInMainWorld` 暴露 API
3. 将所有 `require('electron')` 替换为 preload 暴露的 API

```javascript
// 未来的 preload.js 模式
const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, callback) => {
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
});
```

## 七、总结

### 项目中已有的良好实践

1. **消息缓冲机制**（`loadingMsgs` + `handleLoadingMsg`）保证消息不丢失
2. **UUID 请求匹配**（`sendSdk`、`mainToSdk`）实现可靠的异步请求-响应
3. **常量定义通道名**（`constants.js`、`channel.js`）减少拼写错误
4. **状态检查后发送**（`sendMainWinMsg`）防止向不可用窗口发送消息
5. **通道清理**（`removeAllListeners`）防止热更新时重复注册
6. **日志分级**（cryptolog/devLog/meetingLog/screenshotLogMain）便于问题定位
7. **节流控制**（notification throttle）防止高频消息风暴

### 需要关注的改进点

1. **添加超时机制**到所有使用 `once` + UUID 的请求-响应模式
2. **统一通道命名规范**，将现有混合命名逐步标准化
3. **减少同步 IPC 使用**，迁移到 `invoke/handle` 模式
4. **拆分 background.js 中的 IPC 注册**，按功能模块化
5. **为所有模块添加 removeAllListeners**，防止开发模式下的重复注册
6. **考虑引入 IPC 中间件层**，统一日志、超时、错误处理
