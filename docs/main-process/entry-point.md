# 主进程入口

## 概述

Matrx Windows 客户端基于 Electron 20 构建，主进程入口文件为 `background.js`。该文件承担了整个应用从冷启动到完全就绪的全部编排工作，包括：单实例锁定、预初始化（`appPre.js`）、原生启动画面（`start.js`）、应用内加载视图（`appLoading.js`）、SDK 页面（`startPage.js`）以及数十个子模块的按序初始化。理解本文件是深入其它主进程模块的前提。

## 核心文件结构

```
src/
├── background.js                # 主进程总入口，编排所有启动逻辑
├── main/
│   ├── appPre.js                # 预初始化：路径迁移、调试禁用、命令行开关
│   ├── start.js                 # 原生 exe 启动画面（splash screen）
│   ├── appLoading.js            # BrowserView 应用内加载页
│   ├── startPage.js             # SDK 隐藏窗口（startPagePro 类）
│   ├── mainWindow/index.js      # 主窗口创建与管理
│   ├── store.js                 # electron-store 持久化
│   ├── deviceId.js              # 设备 ID 生成
│   ├── translator.js            # 多语言（i18n）
│   ├── version.js               # 当前版本号
│   └── commonOption.js          # 公共 webPreferences
├── logs/
│   ├── cryptolog.js             # 加密日志
│   ├── infoLog.js               # 信息日志
│   └── devLog.js                # 开发日志
└── buildConfig/
    └── currentConfig.js         # 构建时产品名称配置
```

## background.js 完整解析

### 模块职责

`background.js` 是 Electron 的 `main` 入口（由 `vue.config.js` 中 `pluginOptions.electronBuilder.mainProcessFile` 指定），职责如下：

1. **导入预初始化** -- 第一行即 `import './main/appPre.js'`，确保在任何其它代码执行前完成路径与安全设置
2. **单实例控制** -- 通过 `app.requestSingleInstanceLock()` 保证同一时刻只有一个实例运行
3. **app.ready 事件处理** -- 编排所有子系统的初始化顺序
4. **IPC 通道注册** -- 注册数十个 `ipcMain.on / ipcMain.handle` 监听器
5. **全局错误兜底** -- 捕获 `uncaughtException` 与 `unhandledRejection`
6. **生命周期管理** -- 处理 `window-all-closed`、`before-quit`、`will-quit`、`activate` 等事件

### 全局变量声明

```javascript
global.LoadingView = '';      // 应用内加载 BrowserView 实例
global.currentWin = null;     // 主窗口 BrowserWindow 引用
global.envConfig = {};        // 环境配置（私有部署/公有云）
global.meetingSDK = null;     // 会议 SDK 实例
```

这些全局变量在整个主进程的各子模块中被广泛引用。`currentWin` 尤为重要，是向渲染进程发送消息的唯一通道。

### 单实例锁定

```javascript
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', async (event, commandLine, workingDirectory) => {
        showWin();
        // 解析 commandLine 中的协议链接（matrxmeeting://...）
        // 分发给渲染进程处理 SSO 或会议加入
    });
}
```

当用户尝试打开第二个实例时：
- 第二个进程获取锁失败，立即退出
- 第一个进程接收到 `second-instance` 事件，聚焦主窗口并解析启动参数中的自定义协议链接

### app.ready 事件核心流程

```javascript
app.on('ready', async () => {
    // 1. 原生启动画面
    startLoading();

    // 2. 初始化 electron-store
    electronStore();

    // 3. 设置 AppUserModelId（用于 Windows 通知）
    app.setAppUserModelId(appId);

    // 4. 数据库文件名迁移
    await changeDbName(userDatapath);

    // 5. 设备 ID 初始化
    initDeviceId();

    // 6. 语言初始化
    initLocaleLange();

    // 7. 加载环境配置
    global.envConfig = require('@/config/config');

    // 8. 系统内存监控
    sysMemory();

    // 9. 屏幕事件
    initScreenEvent();

    // 10. AppData 数据库连接
    mainConnectAppdata();

    // 11. 应用内加载页 IPC 注册
    appLoading();

    // 12. SDK 隐藏窗口
    initStartPage();

    // 13. 会议 SDK 初始化
    initCstMeeting();

    // 14. 主窗口设置
    useMainWindowSettings();

    // 15. 创建主窗口（回调中初始化 Tray 和 Toaster）
    createWindow(() => { loadInitSDK(); });

    // 16. 截图、更新、IPC 监听、通知等初始化
    useCapture();
    initUpdater();
    ipcListener();
    initNotification();

    // 17. 其余子窗口模块按需初始化（20+ 个模块）
    // ...
});
```

### initDeviceId 函数

```javascript
function initDeviceId() {
    deviceId = getStore('storage.deviceId');
    if (!deviceId || deviceId.length !== 48) {
        deviceId = generateDeviceId();
    }
    setStore('storage.deviceId', deviceId);
}
```

设备 ID 为 48 位字符串，首次生成后持久化到 electron-store。用于与服务器通信时唯一标识当前设备。

### initLocaleLange 函数

```javascript
function initLocaleLange() {
    const getLocale = getStore('storage.lang');
    if (!getLocale) {
        let langLocale = app.getLocale();
        // 仅支持 en 和 ar 两种语言
        if (langLocale.indexOf('en-') !== -1) langLocale = 'en';
        if (langLocale.indexOf('ar-') !== -1) langLocale = 'ar';
        if (langLocale !== 'en' && langLocale !== 'ar') langLocale = 'en';
        setStore('storage.lang', langLocale || 'en');
    }
    global.translator = new Translator(getStore('storage.lang'));
    global.$t = global.translator.get();
}
```

语言系统初始化后，`global.$t` 可在所有主进程模块中直接使用，用于托盘菜单、对话框、崩溃提示等文本翻译。

### loadInitSDK 回调

```javascript
function loadInitSDK() {
    const { initToaster } = require('@/main/toaster');
    const { getWinUser32 } = require('./main/mainUtils');
    initToaster();     // Toast 通知初始化
    getWinUser32();    // Windows User32 API 绑定
    setTray();         // 系统托盘初始化
}
```

该回调在主窗口 `did-finish-load` 之后执行，确保窗口已准备好接收消息后再初始化依赖窗口的模块。

## appPre.js 预初始化

### 模块职责

`appPre.js` 在 `background.js` 的最顶部通过 `import './main/appPre.js'` 同步导入，是整个应用最先执行的代码。

### 核心功能

| 功能 | 说明 |
|------|------|
| `disableDebug()` | 生产环境禁止 `--inspect` 和 `--remote-debugging-port` 参数 |
| `loadPath()` | 处理产品更名时的数据目录迁移（oldName -> productName） |
| 路径权限检查 | 调用 `checkPathPermitted` 验证 userData 路径是否可写 |
| 命令行开关 | 忽略证书错误、禁用窗口动画、配置 GC 参数 |
| 协议注册 | `app.setAsDefaultProtocolClient(defaultProtocol)` |
| Scheme 注册 | `protocol.registerSchemesAsPrivileged` 注册 `app://` scheme |

### loadPath 路径迁移逻辑

```
旧版数据目录 (oldName)
    │
    ├── 存在？─── 是 ──→ 复制/重命名到新目录 (productName)
    │                     然后删除旧目录及 Local 下的更新目录
    │
    └── 不存在 ──→ 使用默认 appData/productName

开发环境追加 "-development" 后缀
```

### 内存配置

```javascript
let size = 1024;
if (process.getSystemMemoryInfo().free / 1024 / 1024 > 3) {
    size = 2048;  // 空闲内存大于 3GB 时允许更大堆
}
if (process.arch === 'ia32' && size > 1024) {
    app.commandLine.appendSwitch('js-flags',
        '--expose-gc --max-semi-space-size=64 --max-old-space-size=' + size);
} else {
    app.commandLine.appendSwitch('js-flags', '--expose-gc');
}
```

`--expose-gc` 使渲染进程可以通过 `window.gc()` 主动触发垃圾回收，用于调试内存泄漏。

## start.js 原生启动画面

### 模块职责

`start.js` 通过 `child_process.spawn` 启动一个原生 exe 进程来显示启动动画（GIF），在 Electron 窗口准备好之前给用户视觉反馈。

### 核心函数

```javascript
function startLoading(file, args) {
    return new Promise((resolve, reject) => {
        file = file || path.resolve(__static, `./sdk/cst_lib/sdk/${name}.exe`);
        args = [Buffer.from(gifPath).toString('base64')];
        child_loading = spawn(file, args);

        child_loading.on('exit', (e) => resolve(e));
        child_loading.on('error', (err) => reject(err));
        child_loading.stdin.end();
    });
}

function closeStartLoading() {
    if (child_loading) {
        child_loading.kill();
        child_loading = null;
    }
}
```

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `startLoading(file?, args?)` | 可选的 exe 路径和参数 | `Promise<number>` | 启动原生 splash，退出码为 resolve 值 |
| `closeStartLoading()` | 无 | 无 | 杀死 splash 进程 |

### 生命周期

```
app 启动
  │
  ├──→ startLoading() 启动原生 exe splash
  │         │
  │     ┌───┴─── exe 进程独立运行 ───┐
  │     │    显示 waiting.gif 动画    │
  │     └────────────────────────────┘
  │
  ├──→ Electron 窗口 ready-to-show
  │
  └──→ closeStartLoading() 杀死 splash
```

当 `startLoading()` 的 Promise resolve 时返回退出码，如果退出码是数字，`background.js` 会调用 `process.exit(0)` 终止应用。

## appLoading.js 应用内加载视图

### 模块职责

`appLoading.js` 使用 Electron 的 `BrowserView` 在主窗口上覆盖一个加载页面（loading-logo.html），用于在页面跳转、登录、切换空间等耗时操作期间向用户展示加载状态。

### 核心函数

```javascript
function loadingAppInit({height, width, x, y}, text) {
    // 若 LoadingView 已存在，更新尺寸并发送 reload 消息
    if (global.LoadingView) {
        global.LoadingView.setBounds({x, y, width, height});
        global.LoadingView.webContents.send('reload-view', {text});
        return;
    }
    // 否则创建新的 BrowserView
    global.LoadingView = new BrowserView({ webPreferences: commonWebPreferences });
    global.LoadingView.setBounds({x, y, width, height});
    global.LoadingView.setAutoResize({width: true, height: true});
    global.LoadingView.webContents.loadURL(`app://./loading/loading-logo.html?text=${text}`);

    // 挂载到主窗口
    if (global.currentWin && !global.currentWin.getBrowserView()) {
        global.currentWin.setBrowserView(global.LoadingView);
    }
}
```

### IPC 通道

| 通道名 | 方向 | 说明 |
|--------|------|------|
| `init-Loading-App` | 渲染进程 -> 主进程 | 初始化/更新加载视图 |
| `Remove-Loading-App` | 渲染进程 -> 主进程 | 移除加载视图并销毁 |
| `reload-view` | 主进程 -> LoadingView | 更新加载文字 |
| `stop-loading` | 主进程 -> LoadingView | 通知加载页停止动画 |

### 移除流程

```javascript
ipcMain.on('Remove-Loading-App', () => {
    if (currentWin.getBrowserView()) {
        global.LoadingView.webContents.send('stop-loading');
        setTimeout(() => {
            currentWin.removeBrowserView(global.LoadingView);
            global.LoadingView.webContents.destroy();
            global.LoadingView = null;
        }, 100);
    }
});
```

延迟 100ms 确保 `stop-loading` 消息被处理后再销毁，避免白屏闪烁。

## startPage.js SDK 启动页

### 模块职责

`startPage.js` 创建一个不可见的隐藏窗口（1x1 像素、透明度 0、偏移到屏幕外），专门用于运行 SDK 相关的渲染进程逻辑。这是一个典型的 "headless renderer" 模式。

### startPagePro 类

```javascript
class startPagePro {
    constructor(props) {
        this.options = {
            x: -100, y: -100,       // 屏幕外
            height: 1, width: 1,    // 最小尺寸
            opacity: 0,             // 完全透明
            frame: false,
            skipTaskbar: true,
            show: false
        };
        this.win = null;
        this.contentId = null;
    }

    async showPage(data) {
        this.win = new BrowserWindow({...this.options});
        this.win.loadURL(this.htmlFile);
        this.contentId = this.win.webContents.id;
        global.sdkContentId = this.contentId;
        // 注册 crashed / destroyed / unresponsive 等异常监听
    }
}
```

| 方法 | 说明 |
|------|------|
| `showPage()` | 创建窗口并加载 start.html |
| `sendWin(data)` | 向 SDK 窗口发送消息 |
| `sendToWin(type, sendType, data)` | 带类型的消息发送 |
| `showWin() / hideWin() / closeWin()` | 窗口状态控制 |
| `reloadWin()` | 重新加载 SDK 页面 |
| `setWin(style)` | 调整窗口高度 |

### initStartPage 注册的 IPC 通道

| 通道名 | 说明 |
|--------|------|
| `start-page-load` | 重新显示 SDK 页面 |
| `start-page-hide` | 隐藏 SDK 窗口 |
| `start-page-reload` | 重新加载 SDK 页面 |
| `start-page-close` | 关闭 SDK 窗口 |
| `start-page-set` | 调整 SDK 窗口尺寸 |
| `start-page-send` | 向 SDK 窗口发送数据 |
| `openDevTools-start` | 开发环境打开 SDK 窗口的 DevTools |

## 启动流程时序图

```
┌─────────────┐
│ 进程启动     │
│ background.js│
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ appPre.js    │  同步执行
│ 路径/安全/GC  │
└──────┬───────┘
       │
       ▼
┌───────────────────┐
│ requestSingle-    │
│ InstanceLock()    │──── 失败 ──→ app.quit()
└──────┬────────────┘
       │ 成功
       ▼
┌───────────────────┐
│ app.on('ready')   │
└──────┬────────────┘
       │
       ├──→ startLoading()           原生 exe splash
       │
       ├──→ electronStore()          持久化存储
       │
       ├──→ changeDbName()           数据库迁移
       │
       ├──→ initDeviceId()           设备 ID
       │
       ├──→ initLocaleLange()        语言初始化
       │
       ├──→ sysMemory()              内存监控
       │
       ├──→ mainConnectAppdata()     AppData DB
       │
       ├──→ appLoading()             加载视图 IPC
       │
       ├──→ initStartPage()          SDK 隐藏窗口
       │
       ├──→ initCstMeeting()         会议 SDK
       │
       ├──→ useMainWindowSettings()  窗口设置 IPC
       │
       ├──→ createWindow(callback)   主窗口创建
       │         │
       │         └──→ did-finish-load ──→ loadInitSDK()
       │                                    ├── initToaster()
       │                                    ├── getWinUser32()
       │                                    └── setTray()
       │
       ├──→ initUpdater()            自动更新
       │
       ├──→ ipcListener()            IPC 监听
       │
       ├──→ initNotification()       系统通知
       │
       └──→ 20+ 子窗口模块初始化
```

## 全局错误处理

```javascript
// app 级别
app.on('unhandledRejection', error => { devLog.error(...) });
app.on('uncaughtException', error => { devLog.error(...) });

// process 级别
process.on('uncaughtException', error => { devLog.error(...) });
process.on('unhandledRejection', error => { devLog.error(...) });

// 渲染进程崩溃
app.on('renderer-process-crashed', (e, w, details) => { ... });
app.on('render-process-gone', (e, w, details) => {
    // 非 killed 原因且为主窗口/SDK窗口时，显示崩溃对话框
    handleCurrentCrash(global.currentWin, global.sdkContentId === w.id);
});
app.on('child-process-gone', (e, details) => { ... });
app.on('gpu-process-crashed', () => { ... });
```

## 应用生命周期事件

| 事件 | 处理逻辑 |
|------|----------|
| `window-all-closed` | 非 macOS 平台：卸载会议 SDK、销毁托盘、退出应用 |
| `activate` | macOS：如果主窗口为 null 则重新创建，否则显示并聚焦 |
| `before-quit` | 销毁系统托盘 |
| `will-quit` | 注销所有全局快捷键 |
| `web-contents-created` | 拦截 `new-window` 事件，使用默认浏览器打开外部链接 |

## background.js 注册的 IPC 通道汇总

| 通道名 | 类型 | 说明 |
|--------|------|------|
| `UUID_REQUEST` | handle | 返回设备 ID |
| `client-view-ready` | on | 渲染进程就绪后分发协议链接 |
| `WINDOW-CONTROL` | on | 窗口最小化/最大化/关闭控制 |
| `GET-IS-MAXIMIZED` | on | 查询窗口是否最大化 |
| `SAVE-AS-PIC` | on | 图片另存为对话框 |
| `SAVE-FILE-CHOOSE-PATH` | on | 文件下载路径选择 |
| `check-disk-space` | on | 磁盘空间检查 |
| `CLEAR-TEMP-USER-RES` | on | 用户退出清理流程 |
| `SET_AUTO_LAUNCH` | on | 设置开机自启 |
| `ipcChangeAppLang` | on | 切换应用语言 |
| `CLEAR_LOCAL_STORAGE` | on | 清除本地存储 |
| `Encryptd-Content` | on | AES-GCM 加密 |
| `Decryptd-Content` | on | AES-GCM 解密 |
