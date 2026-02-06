# 窗口管理

## 概述

Matrx Windows 客户端的窗口管理核心位于 `src/main/mainWindow/index.js`，负责主窗口（`BrowserWindow`）的创建、事件处理、状态管理以及与渲染进程的消息通信。窗口管理采用单例模式，通过 `global.currentWin` 全局引用来协调主进程中所有子模块与主窗口的交互。此外，该模块还提供了崩溃恢复、消息队列缓冲等机制来保障应用的稳定性。

## 核心文件结构

```
src/main/
├── mainWindow/
│   ├── index.js              # 主窗口创建、事件、消息通信、崩溃恢复
│   └── settingsCalendar.js   # 日历视图模式的本地持久化
├── commonOption.js           # 公共 webPreferences 配置
├── mainUtils.js              # 工具函数（屏幕事件、显示因子调整）
├── store.js                  # electron-store 持久化
├── tray.js                   # 托盘（窗口关闭时配合使用）
├── start.js                  # 启动画面（窗口 show 时关闭）
└── certs/
    └── useCertificateVerifyProc.js  # SSL 证书验证
```

## createWindow 详解

### 函数签名

```javascript
export async function createWindow(cb)
```

参数 `cb` 为回调函数，在主窗口的 `did-finish-load` 事件触发后调用。在 `background.js` 中传入 `loadInitSDK` 作为回调。

### 窗口配置参数

```javascript
const options = {
    height: 680,               // 初始高度
    width: 1130,               // 初始宽度
    minHeight: 600,            // 最小高度
    minWidth: 984,             // 最小宽度
    resizable: true,           // 允许调整大小
    titleBarStyle: 'hidden',   // 隐藏标题栏（使用自定义标题栏）
    backgroundColor: '#ffffff', // 白色背景防闪烁
    frame: false,              // 无边框窗口
    show: false,               // 创建时不显示（等待内容加载）
    center: true,              // 窗口居中
    fullscreenable: true,      // 允许全屏
    useContentSize: true,      // width/height 指内容区域尺寸
    icon: path.join(__static, './icon.png'),
    webPreferences: {
        enableRemoteModule: false,
        nodeIntegration: true,       // 允许 Node.js API
        webSecurity: false,          // 禁用同源策略
        contextIsolation: false,     // 不隔离上下文
        spellcheck: false,           // 禁用拼写检查
        backgroundThrottling: false, // 后台不节流
        webviewTag: true             // 允许 <webview> 标签
    }
};
```

### 关键配置说明

| 配置项 | 值 | 理由 |
|--------|-----|------|
| `frame: false` | 无边框 | 使用 Vue 组件实现自定义标题栏 |
| `show: false` | 隐藏创建 | 避免白屏，等加载完成再显示 |
| `backgroundThrottling: false` | 禁用后台节流 | IM 应用需要后台持续接收消息 |
| `webviewTag: true` | 启用 webview | 用于嵌入第三方页面（机器人、应用商店等） |
| `contextIsolation: false` | 禁用上下文隔离 | 项目依赖 Vue 2 直接访问 Node API |

### 显示因子调整

```javascript
changeOptionFactor(options);
```

`changeOptionFactor` 函数根据当前屏幕的 DPI 缩放因子调整窗口初始尺寸，确保高 DPI 显示器上窗口大小合理。

### SSL 证书验证

```javascript
if (debug) {
    const { enableDebugUpdater } = getStore('storage');
    if (!enableDebugUpdater) {
        initVerifyProc();  // 仅在非调试更新模式下启用
    }
} else {
    initVerifyProc();      // 生产环境始终启用
}
```

### URL 加载

```javascript
let url = 'app://./index.html';
if (process.env.WEBPACK_DEV_SERVER_URL) {
    url = process.env.WEBPACK_DEV_SERVER_URL;
} else {
    createProtocol('app');
}
url += `?userDatapath=${userDatapath}&lang=${getStore('storage.lang')}`;

currentWin.loadURL(url, {
    userAgent: `${currentWin.webContents.session.getUserAgent()} matrx windows ${version} matrxlan/en`
});
```

- 开发环境使用 webpack-dev-server URL
- 生产环境通过 `app://` 自定义协议加载
- URL 参数携带数据路径和语言设置
- User-Agent 追加 `matrx windows ${version}` 标识

## 窗口事件处理

### 加载生命周期事件

```
┌─────────────────┐
│ createWindow()  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ did-start-loading   │ ──→ 挂载 LoadingView
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ did-frame-navigate  │ ──→ 显示窗口 + 挂载 LoadingView
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ ready-to-show       │ ──→ 记录日志
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ dom-ready           │ ──→ 记录日志
└────────┬────────────┘
         │
         ▼
┌─────────────────────────────┐
│ did-finish-load (once)      │ ──→ 执行 cb()（loadInitSDK）
│                             │ ──→ 处理消息缓冲队列
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────┐
│ did-stop-loading    │ ──→ 标记加载完成
└─────────────────────┘
```

### 焦点事件

```javascript
currentWin.on('blur', () => {
    sendMainWinMsg('mainwindow-blur');
});

currentWin.on('focus', () => {
    sendMainWinMsg('ipcSendTrayClear');        // 清除托盘闪烁
    sendMainWinMsg('ipcSendGetPreceiptView');   // 触发已读回执
    sendMainWinMsg('MAINWINDOW_FOCUS');          // 通知渲染进程聚焦
});
```

窗口获得焦点时的三个关键动作：
1. 停止托盘图标闪烁（表示用户已看到新消息）
2. 发送已读回执请求
3. 通知渲染进程更新 UI 状态

### 窗口尺寸事件

```javascript
currentWin.on('maximize', () => {
    sendMainWinMsg({type: 'MAXIMIZE_CHANGE', data: true});
});
currentWin.on('unmaximize', () => {
    sendMainWinMsg({type: 'MAXIMIZE_CHANGE', data: false});
});
currentWin.on('resize', () => {
    sendMainWinMsg('RESIZE_CHANGE');
});
```

渲染进程中的自定义标题栏组件依赖 `MAXIMIZE_CHANGE` 消息来切换最大化/还原按钮的图标。

### 关闭行为

```javascript
currentWin.on('close', event => {
    if (winIsClose) return;         // 如果标记为真正关闭，不拦截
    if (currentWin.isVisible()) {
        currentWin.hide();          // 仅隐藏，不退出
        event.preventDefault();     // 阻止默认关闭
    }
});

currentWin.on('closed', () => {
    currentWin = null;
    ipcMain.emit('meeting-invite', null, {type: 'close'});
    ipcMain.emit('meeting-vote', null, {type: 'close'});
});
```

窗口关闭行为采用 "最小化到托盘" 策略：点击关闭按钮只是隐藏窗口，应用继续在后台运行。只有通过托盘菜单「退出」或更新重启时才会真正关闭。

`winIsClose` 标志通过 IPC `MAIN-WIN-IS-CLOSE` 通道控制：

```javascript
ipcMain.on('MAIN-WIN-IS-CLOSE', (e, data) => {
    winIsClose = typeof data === 'boolean' ? data : true;
});
```

## 消息通信机制

### sendMainWinMsg 函数

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
            if (typeof msg === 'string') {
                currentWin.send(msg);
            } else {
                currentWin.send(msg.type, msg.data);
            }
        } else {
            loadingMsgs.push(msg);   // 缓冲到队列
        }
    } catch (e) {
        cryptolog.error('sendMainWinMsg catch', e, msg);
    }
}
```

该函数是主进程向渲染进程发送消息的安全封装，具有以下特性：

1. **状态检查** -- 确认窗口未崩溃、未加载中才发送
2. **消息缓冲** -- 窗口不可用时将消息暂存到 `loadingMsgs` 队列
3. **格式兼容** -- 支持字符串（通道名）和对象（`{type, data}`）两种格式

### sendWinMsg 函数

```javascript
export function sendWinMsg(type, ...args) {
    // 与 sendMainWinMsg 类似，但接受独立的 type 和 args 参数
}
```

### 消息缓冲队列

```javascript
let loadingMsgs = [];

function handleLoadingMsg() {
    if (loadingMsgs && loadingMsgs.length) {
        for (const msg of loadingMsgs) {
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

`handleLoadingMsg` 在 `did-finish-load` 时调用，将窗口加载期间积累的消息全部重放。这确保了在页面跳转或重载期间不会丢失主进程发来的更新通知、版本检查结果等重要消息。

## showWin 函数

```javascript
export function showWin() {
    try {
        if (!currentWin || currentWin.isDestroyed()) return;
        if (!currentWin.isVisible()) {
            currentWin.show();
        }
        currentWin.focus();
    } catch (e) {
        cryptolog.error('showWin catch', e);
    }
}
```

`showWin` 被多处调用：
- 托盘图标点击
- 通知点击
- 第二实例启动时聚焦
- `Notification-Click` IPC 通道
- `ON_MAINWINDOW_SHOW` IPC 通道

## 崩溃恢复机制

### handleCurrentCrash 函数

```javascript
export function handleCurrentCrash(win, isSdkCrashed) {
    if (isShowCrash) return;       // 防止重复弹框
    isShowCrash = true;

    const options = {
        type: 'warning',
        title: pkgName,
        message: global.$t('somethingWrongUpdate', {names: pkgName}),
        buttons: [
            global.$t('langChange.Quit'),
            process.env.NODE_ENV === 'development' ? 'Reload' : global.$t('langChange.Restart')
        ]
    };

    dialog.showMessageBox(win, options).then(data => {
        if (data.response === 0) {
            appQuit({isSdkCrashed});        // 退出
        } else if (data.response === 1) {
            if (isDevelopment) {
                currentWin.reload();         // 开发环境：重载
            } else {
                appRestart({isSdkCrashed}); // 生产环境：重启
            }
        }
    });
}
```

### 崩溃检测触发点

| 事件 | 触发条件 |
|------|----------|
| `crashed` | 渲染进程崩溃 |
| `render-process-gone` | 渲染进程异常退出（含 OOM、完整性失败等） |
| `unresponsive` | 渲染进程无响应 |

### 崩溃状态查询

```javascript
export function getCurrentWinState() {
    return currentCrash || currentUnresponsive;
}
```

被托盘退出逻辑引用，判断是否应跳过向渲染进程发送清理消息。

## appQuit 与 appRestart

```javascript
export function appQuit(data = {}) {
    destroyTray();
    ipcMain.emit('CLEAR-TEMP-USER-RES', null, data);
}

export function appRestart(data = {}) {
    app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])});
    appQuit(data);
}
```

退出流程通过 `CLEAR-TEMP-USER-RES` 事件触发 `background.js` 中的清理逻辑（销毁窗口、SDK 反初始化、进程退出）。重启额外调用 `app.relaunch()` 在退出后自动启动新实例。

## useMainWindowSettings IPC 注册

```javascript
export function useMainWindowSettings() {
    // 窗口状态查询
    ipcMain.on('main-window', (event, params) => {
        if (params.type === 'isVisible') {
            event.returnValue = currentWin.isVisible();
        }
        if (params.type === 'isMinimized') {
            event.returnValue = currentWin.isMinimized();
        }
    });

    // 显示主窗口
    ipcMain.on('showMainWin', () => showWin());

    // 主窗口 webContents ID
    ipcMain.on('mainContentId', e => {
        e.returnValue = currentWin.webContents.id;
    });

    // 窗口关闭标志
    ipcMain.on('MAIN-WIN-IS-CLOSE', (e, data) => { ... });

    // 消息转发
    ipcMain.on('SEND-CURRENT-WIN-MSG', (e, msg) => sendMainWinMsg(msg));
    ipcMain.on('sendTo-main-win', (e, ...args) => sendWinMsg('sendTo-main-win', ...args));

    // 日历视图设置
    ipcMain.on('main-window-settings', (event, params) => {
        switch (params.type) {
            case 'appGetPath':
                event.returnValue = app.getPath(params.data);
                break;
            case 'settings-set-calendar-mode':
                settingsSetCalendarMode(params.data);
                break;
            case 'settings-get-calendar-mode':
                event.sender.send('main-window-settings', {
                    type: 'settings-get-calendar-mode',
                    data: settingsGetCalendarMode(params.data)
                });
                break;
        }
    });
}
```

## settingsCalendar.js 日历状态持久化

```javascript
export function settingsGetCalendarMode({userid} = {}) {
    const result = getStore('storage.calendarViewTypes');
    if (userid && result && typeof result === 'object') {
        return result[userid];
    }
    return result;
}

export function settingsSetCalendarMode({userid, value} = {}) {
    let modeData = settingsGetCalendarMode();
    modeData = modeData && typeof modeData === 'object' ? modeData : {};
    modeData[userid] = value;
    setStore('storage.calendarViewTypes', modeData);
}
```

日历视图模式按用户 ID 隔离存储，支持每个登录用户有独立的日历视图偏好。

## 多窗口管理策略

Matrx 采用 "一个主窗口 + 多个功能子窗口" 的架构：

| 窗口 | 模块 | 说明 |
|------|------|------|
| 主窗口 | `mainWindow/index.js` | 核心 IM、通讯录、会议等所有主要功能 |
| SDK 窗口 | `startPage.js` | 隐藏窗口，运行 SDK 渲染进程 |
| 更新窗口 | `update/index.js` | 更新提示/下载进度弹窗 |
| 图片查看器 | `pictureViewer/index.js` | 独立图片预览窗口 |
| 文件查看器 | `fileViewer/index.js` | 文件预览 |
| 会议邀请 | `meetingInvite/index.js` | 来电弹窗 |
| 偏好设置 | `preferences/index.js` | 设置页面 |
| SSO 窗口 | `ssoWin.js` | 第三方 SSO 登录 |
| 快捷键设置 | `shortCut/index.js` | 快捷键配置 |

所有子窗口均通过各自模块的 `init*` 函数在 `background.js` 的 `app.ready` 中初始化，但不会立即创建 `BrowserWindow` 实例，而是注册 IPC 监听器，在需要时按需创建。

## commonOption.js 公共配置

```javascript
export const commonWebPreferences = {
    nodeIntegration: true,
    webSecurity: false,
    contextIsolation: false,
    spellcheck: false
};
```

所有窗口共享此基础配置。各窗口可在此基础上追加自定义项（如 `backgroundThrottling`、`webviewTag`、`preload` 等）。
