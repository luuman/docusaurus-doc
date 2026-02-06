# 主进程架构详解

## 1. background.js 入口完整分析

### 1.1 文件结构概览

```javascript
// src/background.js 结构
+------------------------------------------------------------------+
| 1. 模块导入区                                                      |
|    - Electron核心模块 (app, ipcMain, shell, dialog...)            |
|    - 主进程模块 (appPre, store, tray, mainWindow...)              |
|    - 功能模块 (screenshot, notification, updater...)              |
+------------------------------------------------------------------+
| 2. 全局变量初始化                                                   |
|    - global.LoadingView, global.currentWin                        |
|    - global.envConfig, global.meetingSDK                          |
+------------------------------------------------------------------+
| 3. 错误处理设置                                                     |
|    - app.on('unhandledRejection')                                 |
|    - process.on('uncaughtException')                              |
+------------------------------------------------------------------+
| 4. 单例锁检测                                                       |
|    - app.requestSingleInstanceLock()                              |
+------------------------------------------------------------------+
| 5. 应用生命周期事件                                                  |
|    - app.on('ready')                                              |
|    - app.on('second-instance')                                    |
|    - app.on('window-all-closed')                                  |
|    - ...                                                          |
+------------------------------------------------------------------+
| 6. IPC事件监听                                                      |
|    - ipcMain.on() / ipcMain.handle()                              |
+------------------------------------------------------------------+
```

### 1.2 启动流程详解

```
应用启动序列:
+------------------------------------------------------------------+
| 1. appPre.js 预处理                                                |
|    ├── disableDebug()         # 生产环境禁用调试                    |
|    ├── loadPath()             # 设置用户数据路径                    |
|    ├── commandLine设置         # V8参数、硬件加速                   |
|    └── protocol注册           # matrxmeeting://协议                |
+------------------------------------------------------------------+
                                    ↓
+------------------------------------------------------------------+
| 2. 单例锁检测                                                       |
|    ├── gotTheLock = app.requestSingleInstanceLock()               |
|    ├── 如果未获得锁 → app.quit()                                   |
|    └── 如果获得锁 → 继续启动                                       |
+------------------------------------------------------------------+
                                    ↓
+------------------------------------------------------------------+
| 3. app.on('ready') 事件                                           |
|    ├── startLoading()          # 显示启动加载页                    |
|    ├── electronStore()         # 初始化本地存储                    |
|    ├── initDeviceId()          # 生成/读取设备ID                   |
|    ├── initLocaleLange()       # 初始化语言                        |
|    ├── initScreenEvent()       # 屏幕事件监听                      |
|    ├── createWindow()          # 创建主窗口                        |
|    ├── initUpdater()           # 初始化自动更新                    |
|    ├── ipcListener()           # 注册IPC监听器                     |
|    ├── initNotification()      # 初始化通知                        |
|    └── 初始化各功能模块...                                         |
+------------------------------------------------------------------+
```

### 1.3 模块导入清单

```javascript
// 核心Electron模块
import {app, ipcMain, shell, dialog, globalShortcut, session, clipboard, nativeImage} from 'electron';

// 主进程子模块
import './main/appPre.js';                    // 预处理
import {electronStore, setStore, getStore} from '@/main/store';  // 存储
import {generateDeviceId} from '@/main/deviceId.js';             // 设备ID
import Translator from '@/main/translator';                       // 翻译器
import {initStartPage} from '@/main/startPage';                   // 启动页
import {setTray, destroyTray} from '@/main/tray';                 // 系统托盘
import {sysMemory} from '@/main/memoryUsage';                     // 内存监控
import {createPreferencesWindow} from '@/main/preferences/index.js';  // 设置窗口
import {initLiveWebview} from '@/main/livesdk/index.js';          // Live SDK
import currentVersion from '@/main/version.js';                    // 版本信息

// 功能窗口初始化
import {initshortcutWin} from './main/shortCut/index.js';         // 快捷键窗口
import {initUpdateWin} from './main/update/index.js';             // 更新窗口
import {initNewGuideWin} from './main/newGuide/index.js';         // 新手引导
import {initHelpCenterWin} from './main/helpCenter/index.js';     // 帮助中心
```

## 2. 应用生命周期事件

### 2.1 完整事件清单

```javascript
// app.on 事件处理
+------------------------------------------------------------------+
| 事件名                    | 触发时机                | 处理逻辑      |
+------------------------------------------------------------------+
| unhandledRejection        | Promise未捕获异常       | 记录日志      |
| uncaughtException         | 未捕获同步异常          | 记录日志      |
| second-instance           | 尝试启动第二实例        | 聚焦现有窗口   |
| ready                     | Electron初始化完成      | 创建窗口/初始化 |
| browser-window-created    | 新窗口创建              | 记录日志      |
| renderer-process-crashed  | 渲染进程崩溃            | 错误处理      |
| render-process-gone       | 渲染进程消失            | 崩溃恢复      |
| child-process-gone        | 子进程消失              | 记录日志      |
| gpu-process-crashed       | GPU进程崩溃             | 记录日志      |
| window-all-closed         | 所有窗口关闭            | 退出应用      |
| activate                  | 点击Dock图标(macOS)     | 显示窗口      |
| before-quit               | 应用即将退出            | 清理资源      |
| will-quit                 | 应用即将退出            | 注销快捷键    |
| web-contents-created      | WebContents创建         | 处理新窗口    |
+------------------------------------------------------------------+
```

### 2.2 关键事件代码示例

```javascript
// 单例检测与第二实例处理
app.on('second-instance', async (event, commandLine, workingDirectory) => {
    cryptolog.info('second-instance here');
    showWin();  // 显示现有窗口

    // 处理URL Schema
    const url = commandLine.find(arg => arg.startsWith('matrxmeeting://'));
    if (url) {
        if (url.indexOf('/sso_redirect') !== -1) {
            currentWin.webContents.send('SEND_SSO_DATA', url);
        } else {
            currentWin.webContents.send('LINK-JOIN-MEETING', url);
        }
    }
});

// 渲染进程崩溃恢复
app.on('render-process-gone', (e, w, details) => {
    devLog.error('error render-process-gone', details);

    let storage = getStore('storage');
    // 检查是否为主窗口或SDK窗口崩溃
    if (details.reason !== 'killed' &&
        [storage.mainContentId, global.sdkContentId].includes(w.id)) {
        handleCurrentCrash(global.currentWin, global.sdkContentId === w.id);
        throttleSetCrashLog();
    }
});

// 应用退出清理
app.on('before-quit', () => {
    destroyTray();  // 销毁系统托盘
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();  // 注销所有全局快捷键
});
```

## 3. 全局对象管理

### 3.1 全局变量定义

```javascript
// src/background.js 中定义的全局变量
global.LoadingView = '';      // 加载视图BrowserView
global.currentWin = null;     // 主窗口BrowserWindow实例
global.envConfig = {};        // 环境配置对象
global.meetingSDK = null;     // 会议SDK实例

// src/main/appPre.js 中定义
global.userDatapath = '';     // 用户数据目录路径
global.checkPermittedUrl = false;  // URL权限检查标志

// 运行时设置
global.translator = new Translator(lang);  // 翻译器实例
global.$t = global.translator.get();       // 翻译函数快捷方式
global.sdkContentId = null;   // SDK进程的webContents ID
```

### 3.2 全局对象生命周期

```
+------------------------------------------------------------------+
| 阶段            | 全局对象状态                                     |
+------------------------------------------------------------------+
| 应用启动前       | global.userDatapath 设置 (appPre.js)            |
+------------------------------------------------------------------+
| app.ready       | global.envConfig 加载                            |
|                 | global.currentWin 创建                           |
|                 | global.LoadingView 创建                          |
|                 | global.meetingSDK 初始化                         |
|                 | global.translator 初始化                         |
+------------------------------------------------------------------+
| 应用运行中       | global.currentWin 管理窗口状态                    |
|                 | global.meetingSDK 处理会议逻辑                    |
+------------------------------------------------------------------+
| 应用退出         | global.meetingSDK.unInitialize()                |
|                 | global.currentWin.destroy()                      |
|                 | global.LoadingView.destroy()                     |
+------------------------------------------------------------------+
```

## 4. 单例锁机制

### 4.1 实现原理

```javascript
// 单例锁请求
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // 未获得锁，说明已有实例运行
    cryptolog.info('second-instace quited');
    app.quit();
} else {
    // 获得锁，监听第二实例启动事件
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        showWin();  // 聚焦现有窗口
        // 处理从第二实例传递的命令行参数
        handleUrlSchema(commandLine);
    });

    // 继续正常启动流程
    app.on('ready', async () => {
        // ...
    });
}
```

### 4.2 URL Schema 处理流程

```
+------------------------------------------------------------------+
| 用户点击 matrxmeeting://xxx 链接                                   |
+------------------------------------------------------------------+
                                    ↓
+------------------------------------------------------------------+
| 操作系统启动 Matrx 应用                                            |
+------------------------------------------------------------------+
                                    ↓
                    +---------------+---------------+
                    |                               |
            首次启动                          已有实例运行
                    |                               |
                    ↓                               ↓
            获得单例锁                    触发 second-instance 事件
                    |                               |
                    ↓                               ↓
            client-view-ready           showWin() 聚焦窗口
            事件中处理URL                          |
                                                   ↓
                                    发送 LINK-JOIN-MEETING 事件
```

## 5. 崩溃恢复流程

### 5.1 崩溃检测

```javascript
// 主窗口崩溃检测
currentWin.webContents.on('crashed', function (e) {
    devLog.error('currentWin crashed');
    currentCrash = true;
});

currentWin.webContents.on('render-process-gone', function (e, details) {
    // reason: 'clean-exit' | 'abnormal-exit' | 'killed' |
    //         'crashed' | 'oom' | 'launch-failed' | 'integrity-failure'
    devLog.error('currentWin render-process-gone', details.reason);
    currentCrash = true;
});

currentWin.webContents.on('unresponsive', function () {
    devLog.error('currentWin unresponsive');
    currentUnresponsive = true;
    handleCurrentCrash(currentWin);
});
```

### 5.2 崩溃恢复弹窗

```javascript
// src/main/mainWindow/index.js
export function handleCurrentCrash(win, isSdkCrashed) {
    const options = {
        type: 'warning',
        title: pkgName,
        message: `${global.$t('somethingWrongUpdate', {names: pkgName})}`,
        buttons: [
            global.$t('langChange.Quit'),
            process.env.NODE_ENV === 'development'
                ? 'Reload'
                : global.$t('langChange.Restart')
        ],
        icon: path.join(__static, 'icon.png')
    };

    dialog.showMessageBox(win, options).then(data => {
        if (data.response === 0) {
            appQuit({isSdkCrashed});    // 退出
        } else if (data.response === 1) {
            appRestart({isSdkCrashed}); // 重启
        }
    });
}
```

### 5.3 崩溃日志记录

```javascript
// 崩溃日志写入
const {setCrashLog} = require('@/main/utils/crashAndReport');

throttleSetCrashLog = throttle(() => {
    setCrashLog('default');
}, 1000);

// 启动时检查上次崩溃
ipcMain.on('get-pre-crash-log', async (event, arg) => {
    let hasCrash = await checkCrashAndReport();
    event.reply('get-pre-crash-log-res', {default: hasCrash});
});
```

## 6. 主进程模块清单

### 6.1 目录结构

```
src/main/
├── mainWindow/           # 主窗口管理
│   ├── index.js          # createWindow, showWin, appQuit, appRestart
│   └── settingsCalendar.js
│
├── certs/                # SSL证书验证
│   ├── useCertificateVerifyProc.js  # SSL Pinning实现
│   └── fetchSslPinningConfig.js
│
├── forwardDB/            # 数据库转发
│   └── appdataUtil.js    # 主进程-渲染进程数据同步
│
├── sdk/                  # SDK加载
│   └── cst/
│       └── CST_Loader.js # 会议SDK加载器
│
├── screenshot/           # 截图功能
│   └── capture-main.js
│
├── livesdk/              # Live SDK
│   └── index.js
│
├── preferences/          # 设置窗口
│   └── index.js
│
├── pictureViewer/        # 图片查看器主进程
├── fileViewer/           # 文件查看器主进程
├── dialogWin/            # 自定义对话框
├── meetingInvite/        # 会议邀请窗口
├── meetingPwd/           # 会议密码窗口
├── meetingVote/          # 会议投票窗口
├── e2eeMeeting/          # E2EE会议窗口
├── aiModel/              # AI模型窗口
├── combineChat/          # 合并聊天窗口
├── mapWin/               # 地图窗口
├── storageData/          # 存储数据管理窗口
├── profilePhoto/         # 头像编辑窗口
├── webview/              # Webview窗口
├── pictureEditor/        # 图片编辑窗口
├── devicesManagement/    # 设备管理窗口
├── update/               # 更新窗口
├── shortcut/             # 快捷键设置窗口
├── helpCenter/           # 帮助中心窗口
├── newGuide/             # 新手引导窗口
│
├── IPCMainChannel.js     # IPC通道管理
├── meetingSDK.js         # 会议SDK封装 (89KB)
├── updater.js            # 自动更新 (26KB)
├── store.js              # 本地存储
├── tray.js               # 系统托盘
├── notification.js       # 系统通知
├── mainUtils.js          # 工具函数
├── memoryUsage.js        # 内存监控
├── translator.js         # 翻译器
├── startPage.js          # 启动页
├── appLoading.js         # 加载动画
├── appPre.js             # 应用预处理
├── deviceId.js           # 设备ID生成
├── constants.js          # 常量定义
├── globalShortcut.js     # 全局快捷键
├── ssoWin.js             # SSO登录窗口
├── dialogOpen.js         # 原生对话框
├── mainMenu.js           # 应用菜单
├── robotPage.js          # 机器人页面
└── winUser32.js          # Win32 API调用
```

### 6.2 核心模块功能说明

| 模块 | 文件 | 主要功能 |
|------|------|----------|
| 窗口管理 | `mainWindow/index.js` | 创建/显示/隐藏/销毁窗口 |
| 本地存储 | `store.js` | electron-store封装，IPC同步 |
| 会议SDK | `meetingSDK.js` | 会议功能封装，89KB大文件 |
| 自动更新 | `updater.js` | electron-updater封装 |
| 系统托盘 | `tray.js` | 托盘图标和菜单 |
| SSL验证 | `certs/useCertificateVerifyProc.js` | SSL Pinning |
| IPC通道 | `IPCMainChannel.js` | 主进程IPC事件处理 |
| 截图功能 | `screenshot/capture-main.js` | 屏幕截图 |

### 6.3 模块初始化顺序

```javascript
// app.on('ready') 中的初始化顺序
app.on('ready', async () => {
    // 1. 基础设施
    startLoading();           // 加载页面
    electronStore();          // 本地存储
    initDeviceId();          // 设备ID
    initLocaleLange();       // 语言设置

    // 2. 环境配置
    global.envConfig = require('@/config/config');

    // 3. 数据库连接
    mainConnectAppdata();    // 主进程数据库

    // 4. 内存监控
    sysMemory();
    initScreenEvent();

    // 5. 核心功能初始化
    appLoading();
    initStartPage();         // SDK启动页
    initLiveWebview();       // Live SDK
    initCstMeeting();        // 会议SDK
    useMainWindowSettings(); // 窗口设置

    // 6. 创建主窗口
    createWindow(() => {
        loadInitSDK();       // 加载SDK
    });

    // 7. 功能模块
    ipcListener();
    initUpdater();
    useCapture();            // 截图
    initNotification();

    // 8. 各种功能窗口初始化
    onMeetingInfoChannel();
    usePictureViewer();
    useFileViewer();
    useMeetingInvite();
    initSSOWin();
    useMeetingPwd();
    initE2eeMeeting();
    useMeetingVote();
    useMeetingWhiteboardShare();
    initRobotPage();
    registerShortcut();
    initDialogWin();
    initMapWin();
    initStorageDataWin();
    initProfilePhotoWin();
    initPreferencesWin();
    initWebviewWin();
    initPictureEditorWin();
    initDevicesManagementWin();
    initUpdateWin();
    initshortcutWin();
    initHelpCenterWin();
    initNewGuideWin();
    useAiModel();
    useCombineTextWin();
});
```
