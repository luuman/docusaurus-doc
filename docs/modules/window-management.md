# 窗口管理模块

## 概述

本项目采用多窗口架构，共管理 30+ 个功能窗口。窗口管理模块负责创建、配置和管理所有应用窗口。

## 窗口类型分类

### 1. 主窗口类型

| 窗口 | 文件位置 | 说明 |
|------|---------|------|
| Main Window | `mainWindow/index.js` | 主应用窗口 |
| Start Page | `startPage.js` | 启动加载页 |

### 2. 功能窗口类型

| 窗口 | 文件位置 | 说明 |
|------|---------|------|
| Screenshot | `preload/screenshot.js` | 截图窗口 |
| File Viewer | `renderer/fileViewer/` | 文件查看器 |
| Picture Editor | `renderer/pictureEditor/` | 图片编辑器 |
| Picture Viewer | `renderer/pictureViewer/` | 图片查看器 |

### 3. 会议相关窗口

| 窗口 | 文件位置 | 说明 |
|------|---------|------|
| Meeting Info | `renderer/meetingInfo/` | 会议信息 |
| Meeting Invite | `renderer/meetingInvite/` | 会议邀请 |
| Meeting Password | `renderer/meetingPwd/` | 会议密码 |
| Whiteboard Share | `renderer/meetingWhiteboardShare/` | 白板分享 |

### 4. 设置类窗口

| 窗口 | 文件位置 | 说明 |
|------|---------|------|
| Shortcut | `renderer/shortcut/` | 快捷键设置 |
| Devices Management | `renderer/devicesManagement/` | 设备管理 |
| Profile Photo | `renderer/profilePhoto/` | 头像设置 |

### 5. 辅助窗口

| 窗口 | 文件位置 | 说明 |
|------|---------|------|
| SSO | `renderer/sso/` | SSO 登录 |
| Update | `renderer/update/` | 应用更新 |
| Help Center | `renderer/helpCenter/` | 帮助中心 |
| New Guide | `renderer/newGuide/` | 新手指南 |
| Toast | `renderer/toast/` | 提示通知 |
| Dialog | `renderer/dialogWin/` | 通用对话框 |

## 主窗口创建

### `src/main/mainWindow/index.js`

```javascript
const { BrowserWindow, screen } = require('electron');
const path = require('path');

// 窗口配置
const defaultWindowConfig = {
  height: 680,
  width: 1130,
  minHeight: 600,
  minWidth: 984,
  titleBarStyle: 'hidden',
  frame: false,
  show: false,
  backgroundColor: '#ffffff',
  webPreferences: {
    preload: path.join(__dirname, '../preload.js'),
    enableRemoteModule: false,
    backgroundThrottling: false,
    webviewTag: true,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false
  }
};

// 创建主窗口
function createMainWindow() {
  // 获取屏幕尺寸
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  // 计算窗口位置（居中）
  const x = Math.floor((screenWidth - defaultWindowConfig.width) / 2);
  const y = Math.floor((screenHeight - defaultWindowConfig.height) / 2);

  // 创建窗口
  const win = new BrowserWindow({
    ...defaultWindowConfig,
    x,
    y
  });

  // 存储全局引用
  global.currentWin = win;

  // 加载页面
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:8080');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // 绑定事件
  setupWindowEvents(win);

  return win;
}

// 窗口事件处理
function setupWindowEvents(win) {
  // 准备显示
  win.once('ready-to-show', () => {
    win.show();
    hideStartPage();
  });

  // 关闭事件
  win.on('close', (e) => {
    const shouldMinimizeToTray = store.get('minimizeToTray');
    if (shouldMinimizeToTray && !app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  // 窗口状态变化
  win.on('maximize', () => {
    win.webContents.send('window-maximized', true);
  });

  win.on('unmaximize', () => {
    win.webContents.send('window-maximized', false);
  });

  // 焦点事件
  win.on('focus', () => {
    win.webContents.send('window-focus', true);
  });

  win.on('blur', () => {
    win.webContents.send('window-focus', false);
  });
}

module.exports = {
  createMainWindow,
  defaultWindowConfig
};
```

## 子窗口创建模式

### 通用子窗口工厂

```javascript
// src/main/windowFactory.js

const windowInstances = new Map();

/**
 * 创建子窗口
 * @param {string} name - 窗口名称
 * @param {object} options - 窗口配置
 * @returns {BrowserWindow}
 */
function createChildWindow(name, options = {}) {
  // 检查是否已存在
  if (windowInstances.has(name)) {
    const existingWin = windowInstances.get(name);
    if (!existingWin.isDestroyed()) {
      existingWin.focus();
      return existingWin;
    }
  }

  // 默认配置
  const defaultOptions = {
    width: 800,
    height: 600,
    parent: global.currentWin,
    modal: false,
    show: false,
    resizable: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, `preload/${name}.js`),
      contextIsolation: true,
      nodeIntegration: false
    }
  };

  // 合并配置
  const windowConfig = { ...defaultOptions, ...options };

  // 创建窗口
  const win = new BrowserWindow(windowConfig);

  // 存储实例
  windowInstances.set(name, win);

  // 加载页面
  loadWindowContent(win, name);

  // 显示窗口
  win.once('ready-to-show', () => {
    win.show();
  });

  // 清理引用
  win.on('closed', () => {
    windowInstances.delete(name);
  });

  return win;
}

/**
 * 加载窗口内容
 */
function loadWindowContent(win, name) {
  if (process.env.NODE_ENV === 'development') {
    win.loadURL(`http://localhost:8080/${name}.html`);
  } else {
    win.loadFile(path.join(__dirname, `../../dist/${name}.html`));
  }
}

/**
 * 获取窗口实例
 */
function getWindow(name) {
  return windowInstances.get(name);
}

/**
 * 关闭窗口
 */
function closeWindow(name) {
  const win = windowInstances.get(name);
  if (win && !win.isDestroyed()) {
    win.close();
  }
}

/**
 * 关闭所有子窗口
 */
function closeAllChildWindows() {
  windowInstances.forEach((win, name) => {
    if (!win.isDestroyed()) {
      win.close();
    }
  });
}

module.exports = {
  createChildWindow,
  getWindow,
  closeWindow,
  closeAllChildWindows
};
```

## 特定窗口实现

### 截图窗口

```javascript
// src/main/screenshot.js

function createScreenshotWindow() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  // 计算所有屏幕的总边界
  let totalBounds = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  displays.forEach(display => {
    totalBounds.x = Math.min(totalBounds.x, display.bounds.x);
    totalBounds.y = Math.min(totalBounds.y, display.bounds.y);
    totalBounds.width = Math.max(
      totalBounds.width,
      display.bounds.x + display.bounds.width
    );
    totalBounds.height = Math.max(
      totalBounds.height,
      display.bounds.y + display.bounds.height
    );
  });

  // 创建全屏透明窗口
  const screenshotWin = new BrowserWindow({
    x: totalBounds.x,
    y: totalBounds.y,
    width: totalBounds.width - totalBounds.x,
    height: totalBounds.height - totalBounds.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    fullscreen: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload/screenshot.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  screenshotWin.loadFile(path.join(__dirname, '../dist/screenshot.html'));

  // 捕获屏幕
  screenshotWin.once('ready-to-show', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: totalBounds.width,
        height: totalBounds.height
      }
    });

    screenshotWin.webContents.send('screenshot-sources', sources);
    screenshotWin.show();
    screenshotWin.setFullScreen(true);
  });

  return screenshotWin;
}
```

### 模态对话框窗口

```javascript
// src/main/dialogWindow.js

function createDialogWindow(options) {
  const {
    title,
    message,
    buttons = ['确定', '取消'],
    defaultId = 0,
    cancelId = 1,
    type = 'info'
  } = options;

  return new Promise((resolve) => {
    const dialogWin = new BrowserWindow({
      width: 400,
      height: 200,
      parent: global.currentWin,
      modal: true,
      show: false,
      frame: false,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload/dialog.js'),
        contextIsolation: true
      }
    });

    dialogWin.loadFile(path.join(__dirname, '../dist/dialogWin.html'));

    dialogWin.once('ready-to-show', () => {
      dialogWin.webContents.send('dialog-data', {
        title,
        message,
        buttons,
        defaultId,
        type
      });
      dialogWin.show();
    });

    // 监听响应
    ipcMain.once('dialog-response', (event, buttonIndex) => {
      dialogWin.close();
      resolve(buttonIndex);
    });
  });
}
```

## 窗口间通信

### 父子窗口通信

```javascript
// 父窗口向子窗口发送消息
const childWin = createChildWindow('settings');
childWin.webContents.send('init-data', { theme: 'dark' });

// 子窗口向父窗口发送消息
// 在子窗口的渲染进程中
ipcRenderer.sendTo(parentWebContentsId, 'settings-changed', newSettings);
```

### 窗口广播

```javascript
// 向所有窗口广播消息
function broadcastToAllWindows(channel, data) {
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  });
}

// 使用示例
broadcastToAllWindows('theme-changed', 'dark');
broadcastToAllWindows('user-logged-out');
```

## 窗口状态管理

### 保存窗口状态

```javascript
// src/main/windowState.js

const Store = require('electron-store');
const windowStateStore = new Store({ name: 'window-state' });

function saveWindowState(win, name) {
  if (win.isDestroyed()) return;

  const bounds = win.getBounds();
  const isMaximized = win.isMaximized();

  windowStateStore.set(name, {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized
  });
}

function loadWindowState(name, defaults) {
  const state = windowStateStore.get(name);

  if (!state) return defaults;

  // 验证窗口位置在可见区域内
  const displays = screen.getAllDisplays();
  const isVisible = displays.some(display => {
    return (
      state.x >= display.bounds.x &&
      state.x < display.bounds.x + display.bounds.width &&
      state.y >= display.bounds.y &&
      state.y < display.bounds.y + display.bounds.height
    );
  });

  if (!isVisible) return defaults;

  return state;
}

// 自动保存窗口状态
function enableWindowStateTracking(win, name) {
  // 防抖保存
  let saveTimeout;
  const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveWindowState(win, name), 500);
  };

  win.on('resize', debouncedSave);
  win.on('move', debouncedSave);
  win.on('close', () => saveWindowState(win, name));
}

module.exports = {
  saveWindowState,
  loadWindowState,
  enableWindowStateTracking
};
```

## 窗口生命周期

```
创建 (new BrowserWindow)
       │
       ▼
加载内容 (loadURL/loadFile)
       │
       ▼
ready-to-show 事件
       │
       ▼
显示 (show)
       │
       ▼
   用户交互
       │
       ▼
close 事件 (可阻止)
       │
       ▼
closed 事件 (已关闭)
       │
       ▼
清理引用
```

## 最佳实践

### 1. 窗口复用

```javascript
// 不要重复创建相同窗口
function showSettingsWindow() {
  let settingsWin = getWindow('settings');

  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.focus();
    return settingsWin;
  }

  return createChildWindow('settings');
}
```

### 2. 延迟加载

```javascript
// 只在需要时创建窗口
let screenshotWin = null;

function takeScreenshot() {
  if (!screenshotWin || screenshotWin.isDestroyed()) {
    screenshotWin = createScreenshotWindow();
  } else {
    screenshotWin.show();
  }
}
```

### 3. 内存管理

```javascript
// 关闭时清理资源
win.on('closed', () => {
  // 移除所有监听器
  win.webContents.removeAllListeners();
  // 清理引用
  windowInstances.delete(name);
});
```
