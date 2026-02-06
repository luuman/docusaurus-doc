# 主进程架构详解

## 概述

主进程是 Electron 应用的核心，负责管理应用生命周期、创建窗口、处理系统交互等。

## 入口文件分析

### `src/background.js`

主进程入口文件，负责以下职责：

```javascript
// 核心职责
1. 应用初始化与事件监听
2. 单实例锁管理
3. 协议处理 (matrxmeeting://)
4. 全局错误处理
5. 窗口生命周期管理
```

### 关键代码片段

```javascript
// 单实例锁
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}

// 协议注册
app.setAsDefaultProtocolClient('matrxmeeting');

// 应用就绪
app.on('ready', async () => {
  // 初始化流程
  await appPre();
  createStartPage();
  // ...
});

// 第二实例
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // 处理协议 URL
  handleProtocol(commandLine);
  // 聚焦窗口
  if (currentWin) {
    currentWin.focus();
  }
});
```

## 主进程模块详解

### 1. 窗口管理模块 (`src/main/mainWindow/`)

#### `index.js` - 主窗口管理器 (18.3KB)

**核心功能**：
- 创建主窗口
- 配置窗口属性
- 处理窗口事件
- 管理窗口生命周期

**窗口配置**：

```javascript
const windowConfig = {
  height: 680,
  width: 1130,
  minHeight: 600,
  minWidth: 984,
  titleBarStyle: 'hidden',  // 隐藏标题栏
  frame: false,             // 无边框窗口
  show: false,              // 初始隐藏
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    enableRemoteModule: false,
    backgroundThrottling: false,  // 后台不节流
    webviewTag: true,             // 允许 webview
    contextIsolation: true,
    nodeIntegration: false
  }
};
```

**窗口事件处理**：

```javascript
// 窗口关闭
win.on('close', (e) => {
  if (shouldMinimizeToTray) {
    e.preventDefault();
    win.hide();
  }
});

// 窗口就绪
win.once('ready-to-show', () => {
  win.show();
  hideStartPage();
});

// 内容加载完成
win.webContents.on('did-finish-load', () => {
  // 发送初始化数据
});
```

### 2. 数据存储模块 (`src/main/store.js`)

**使用技术**: `electron-store-atomically`

**Schema 定义**：

```javascript
const schema = {
  deviceId: { type: 'string' },
  lang: { type: 'string', default: 'en' },
  skipUpdateVersion: { type: 'string' },
  userData: { type: 'object' },
  accountData: { type: 'object' },
  win32SystemInfo: { type: 'object' }
};
```

**加密配置**：

```javascript
const store = new Store({
  schema,
  encryptionKey: process.env.NODE_ENV === 'production'
    ? 'your-encryption-key'
    : undefined
});
```

**IPC 集成**：

```javascript
// 同步获取
ipcMain.on('getStore-Sync', (event, key) => {
  event.returnValue = store.get(key);
});

// 异步获取
ipcMain.handle('getStore', async (event, key) => {
  return store.get(key);
});

// 设置值
ipcMain.handle('setStore', async (event, key, value) => {
  store.set(key, value);
  // 广播变更
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('changeStorage', { key, value });
  });
});
```

### 3. IPC 通信模块 (`src/main/IPCMainChannel.js`)

**核心 IPC 频道**：

```javascript
// 用户数据管理
ipcMain.handle('REMOVE_USER_DATA', async (event, userId) => {
  // 清除用户相关数据
});

// 崩溃日志
ipcMain.handle('get-pre-crash-log', async () => {
  // 获取崩溃前日志
});

ipcMain.handle('set-pre-crash-log', async (event, log) => {
  // 设置崩溃标志
});

// 剪贴板操作
ipcMain.handle('clipboad-multiple-get', async () => {
  // 获取剪贴板多文件
});

ipcMain.handle('set-clipboad-multiple', async (event, files) => {
  // 设置剪贴板多文件
});

// 路径管理
ipcMain.handle('set-record-path', async (event, path) => {
  // 设置录制路径
});

ipcMain.handle('get-document-download-path', async () => {
  return app.getPath('downloads');
});
```

### 4. 会议 SDK 模块 (`src/main/meetingSDK.js`)

**文件大小**: 89.4KB (项目最大模块)

**核心功能**：
- SDK 初始化与配置
- 会议创建与加入
- 音视频控制
- 屏幕共享
- 会议状态管理

**关键接口**：

```javascript
// SDK 初始化
async function initMeetingSDK(config) {
  global.meetingSDK = new MeetingSDK(config);
  await global.meetingSDK.init();
}

// 创建会议
async function createMeeting(options) {
  return await global.meetingSDK.createMeeting(options);
}

// 加入会议
async function joinMeeting(meetingId, password) {
  return await global.meetingSDK.joinMeeting(meetingId, password);
}

// 结束会议
async function endMeeting() {
  return await global.meetingSDK.endMeeting();
}
```

### 5. 系统托盘模块 (`src/main/tray.js`)

**功能**：
- 创建系统托盘图标
- 托盘右键菜单
- 托盘点击事件
- 消息通知气泡

```javascript
function createTray() {
  const tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => showMainWindow() },
    { label: '设置', click: () => openSettings() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Matrx');

  // 双击显示窗口
  tray.on('double-click', () => {
    showMainWindow();
  });

  return tray;
}
```

### 6. 更新管理模块 (`src/main/updater.js`)

**使用技术**: `electron-updater`

```javascript
const { autoUpdater } = require('electron-updater');

// 配置更新服务器
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://your-update-server.com/releases'
});

// 检查更新
autoUpdater.checkForUpdates();

// 更新事件
autoUpdater.on('update-available', (info) => {
  // 通知渲染进程
  mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('download-progress', (progress) => {
  mainWindow.webContents.send('download-progress', progress);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('update-downloaded', info);
});
```

### 7. 全局快捷键模块 (`src/main/globalShortcut.js`)

```javascript
const { globalShortcut } = require('electron');

function registerShortcuts() {
  // 截图快捷键
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    createScreenshotWindow();
  });

  // 显示/隐藏窗口
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    toggleMainWindow();
  });
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

app.on('will-quit', () => {
  unregisterShortcuts();
});
```

### 8. 通知模块 (`src/main/notification.js`)

```javascript
const { Notification } = require('electron');

function showNotification(title, body, onClick) {
  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, 'icon.png')
  });

  notification.on('click', () => {
    if (onClick) onClick();
    showMainWindow();
  });

  notification.show();
}
```

### 9. 设备 ID 模块 (`src/main/deviceId.js`)

**功能**: 生成并持久化唯一设备标识

```javascript
const { machineIdSync } = require('node-machine-id');

function getDeviceId() {
  let deviceId = store.get('deviceId');

  if (!deviceId) {
    deviceId = machineIdSync(true);
    store.set('deviceId', deviceId);
  }

  return deviceId;
}
```

### 10. 证书验证模块 (`src/main/certs/`)

```javascript
// useCertificateVerifyProc.js
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // 自定义证书验证逻辑
  if (isDevelopment) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
```

## 多窗口创建模式

项目中创建子窗口的标准模式：

```javascript
function createChildWindow(name, options = {}) {
  const defaultOptions = {
    width: 800,
    height: 600,
    parent: mainWindow,
    modal: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, `preload/${name}.js`),
      contextIsolation: true,
      nodeIntegration: false
    }
  };

  const win = new BrowserWindow({ ...defaultOptions, ...options });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL(`http://localhost:8080/${name}.html`);
  } else {
    win.loadFile(path.join(__dirname, `../dist/${name}.html`));
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  return win;
}
```

## 窗口类型清单

| 窗口名称 | 文件位置 | 功能说明 |
|---------|---------|---------|
| mainWindow | mainWindow/index.js | 主应用窗口 |
| startPage | startPage.js | 启动加载页 |
| screenshot | preload/screenshot.js | 截图窗口 |
| ssoWin | ssoWin.js | SSO 登录窗口 |
| robotPage | robotPage.js | 机器人页面 |
| notification | notification.js | 通知窗口 |

## 错误处理

### 全局错误捕获

```javascript
// 未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // 记录崩溃日志
  writeCrashLog(error);
});

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});
```

### 渲染进程崩溃处理

```javascript
win.webContents.on('crashed', (event, killed) => {
  logger.error('Renderer crashed', { killed });
  // 尝试恢复或重新加载
  if (!killed) {
    win.reload();
  }
});
```

## 性能优化

### 内存监控 (`src/main/memoryUsage.js`)

```javascript
const v8 = require('v8');

function logMemoryUsage() {
  const heapStats = v8.getHeapStatistics();
  logger.info('Memory Usage:', {
    heapUsed: heapStats.used_heap_size,
    heapTotal: heapStats.total_heap_size
  });
}

// 定期记录内存使用
setInterval(logMemoryUsage, 60000);
```

### 后台节流控制

```javascript
webPreferences: {
  backgroundThrottling: false  // 后台运行时不降低性能
}
```

## 下一步阅读

- [渲染进程架构](./renderer-process.md) - Vue 应用架构
- [IPC 通信机制](./ipc-communication.md) - 进程间通信详解
