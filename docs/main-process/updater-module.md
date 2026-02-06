# 自动更新

## 概述

Matrx Windows 客户端的自动更新模块基于 `electron-updater` 实现，核心代码位于 `src/main/updater.js`。该模块通过 `AppUpdater` 类封装了完整的更新生命周期：从服务器检查新版本、下载安装包、显示下载进度、SHA-512 完整性校验，到最终安装重启。此外，模块还支持强制更新、用户跳过版本、定时重新提醒、网络断线续传、静默后台下载等高级功能。更新窗口 UI 由独立的 `src/main/update/index.js` 模块管理。

## 核心文件结构

```
src/main/
├── updater.js                  # 更新逻辑核心（AppUpdater 类 + initUpdater）
├── update/
│   └── index.js                # 更新窗口管理（BrowserWindow）
├── mainWindow/
│   └── index.js                # sendWinMsg 函数
├── mainUtils.js                # checkHash / openExternal / spawnThen 工具
├── tray.js                     # trayExit（安装时退出应用）
├── store.js                    # electron-store 持久化
└── forwardDB/
    └── appdataUtil.js          # getItem / removeItemList（本地 DB 操作）
config.js                       # skipUpdateExpireTime / debug 配置
```

## updater.js 完整解析

### 导入依赖

```javascript
import {skipUpdateExpireTime} from '../../config';
import {getStore, setStore} from './store';
import {autoUpdater} from 'electron-updater';
import {sendWinMsg} from './mainWindow/index';
import {getItem, removeItemList} from '@/main/forwardDB/appdataUtil';
import {trayExit} from '@/main/tray.js';
import {debug} from '../../config';
const {ipcMain} = require('electron');
const fs = require('fs');
const path = require('path');
const {checkHash, openExternal, spawnThen} = require('./mainUtils');
import log from '@/logs/devBackLog';
```

### 模块级状态

```javascript
let updateObj = null;                         // AppUpdater 单例
let updateTimer = null;                       // 稍后提醒定时器
let endTime = null;                           // 下次提醒的时间点
let initTime = 0;                             // 刷新定时器起始时间
let refreshTimer = null;                      // 定期检查更新定时器
let refreshInterval = skipUpdateExpireTime;   // 刷新间隔（从配置读取）
```

### 开发环境配置

```javascript
if (process.env.NODE_ENV === 'development') {
    autoUpdater.updateConfigPath = path.join(
        __filename, '../../dist_electron/win-unpacked/resources/app-update.yml'
    );
}
```

开发环境下手动指定 `app-update.yml` 路径，否则 `electron-updater` 找不到更新配置文件。

## AppUpdater 类详解

### 构造函数

```javascript
export default class AppUpdater {
    constructor(data) {
        this.initData(data);
        this.initEvent();
        this.autoUpdateDownloading = false;
    }
}
```

### initData 方法

```javascript
initData(data) {
    const {
        updateServer,        // 更新服务器地址
        updateMarketUrl,     // 应用市场更新链接
        updateWebUrl,        // Web 端更新链接
        targetVersion,       // 目标版本号
        updatePath,          // 更新路径
        reminderInterval,    // 提醒间隔
        description,         // 版本描述
        forceUpdate,         // 是否强制更新
        canSkipUpdate,       // 是否可跳过
        updateNow,           // 是否立即更新
        manualCheck,         // 是否手动检查
        autoUpdateDownload   // 是否自动下载
    } = data;

    this.updateUrl = `${updateServer}${updatePath}`;
    this.forceUpdate = forceUpdate;
    this.canSkipUpdate = canSkipUpdate;
    this.autoUpdateDownload = (!manualCheck && autoUpdateDownload) || false;

    // ... 初始化其他属性

    this.setUpdaterUrl();

    if (this.updateNow) {
        this.checkUpdater();
    }
}
```

### 属性一览

| 属性 | 类型 | 说明 |
|------|------|------|
| `updateUrl` | string | 完整的更新检查 URL |
| `forceUpdate` | boolean | 强制更新标志 |
| `canSkipUpdate` | boolean | 允许用户跳过此版本 |
| `fileSize` | number | 安装包大小（字节） |
| `downloadSize` | number | 已下载大小 |
| `downloadPercent` | number | 下载百分比 |
| `downloadedPath` | string | 下载完成后的文件路径 |
| `cancellationToken` | object | 用于取消下载的令牌 |
| `fileSha512` | string | 安装包的 SHA-512 哈希值 |
| `skipVer` | boolean | 用户已跳过此版本 |
| `clickLater` | boolean | 用户点击了"稍后" |
| `startUpdate` | boolean | 已开始下载 |
| `downloadNetError` | boolean | 下载网络错误标志 |
| `continueUpdate` | boolean | 断线续传标志 |
| `autoUpdateDownload` | boolean | 静默后台下载模式 |
| `manualCheck` | boolean | 手动检查更新 |

## 更新检查流程

### checkUpdater 方法

```javascript
async checkUpdater() {
    // 1. 非手动检查时，先判断是否已跳过
    if (!this.manualCheck) {
        const isSkip = await this.checkSkip();
        if (isSkip) return;
    }

    // 2. 应用市场更新（外部链接）
    if (this.updateMarketUrl) {
        // 直接显示更新弹窗，引导用户到应用市场
        return;
    }

    // 3. Web 端更新（外部链接）
    if (this.updateWebUrl) {
        // 直接显示更新弹窗，引导用户到 Web 下载
        return;
    }

    // 4. 内置更新（electron-updater）
    this.checkForUpdates();
}
```

### 更新检查流程图

```
checkUpdater()
    │
    ├── 非手动检查？
    │     ├── 是 → checkSkip()
    │     │         ├── 已跳过/未过期 → return
    │     │         └── 未跳过/已过期 → 继续
    │     └── 否 → 继续
    │
    ├── 有 updateMarketUrl？
    │     └── 是 → 显示更新弹窗（应用市场链接）→ return
    │
    ├── 有 updateWebUrl？
    │     └── 是 → 显示更新弹窗（Web 下载链接）→ return
    │
    └── checkForUpdates()
          │
          └── autoUpdater.checkForUpdates()
                │
                ├── update-available → 显示更新弹窗 / 自动下载
                └── update-not-available → 显示已是最新
```

### checkSkip 版本跳过判断

```javascript
checkSkip() {
    const {skipUpdateVersion, skipUpdateTime} = getStore('storage');

    // 计算是否过期
    let isExpire = false;
    if (skipUpdateTime) {
        endTime = Number(skipUpdateTime) + this.reminderInterval;
        isExpire = endTime <= Date.now() / 1000;
    }

    // 目标版本 === 已跳过版本，或跳过未过期 → 返回 true
    if (this.targetVersion === skipUpdateVersion || (!isExpire && skipUpdateTime)) {
        return true;
    }

    return false;
}
```

## electron-updater 事件处理

### initEvent 方法

```javascript
async initEvent() {
    // 全局配置
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false;       // 禁用自动下载
    autoUpdater.allowDowngrade = false;      // 禁止降级
    autoUpdater.autoInstallOnAppQuit = false; // 退出时不自动安装
    autoUpdater.forceDevUpdateConfig = true;  // 强制使用开发更新配置
}
```

### error 事件

```javascript
autoUpdater.on('error', err => {
    log.error('autoUpdater=>error', err.message, err.code, err.errno);

    if (this.isNetworkError(err)) {
        this.downloadNetError = true;
        if (this.continueUpdate) {
            this.downloadNetError = false;
            this.continueUpdate = false;
            ipcMain.emit('sys:updateNow');   // 自动重试下载
        }
    }

    ipcMain.emit('SEND-CURRENT-WIN-MSG', {
        type: 'CHECK_UPDATE_ERROR', data: {}
    });
    this.autoUpdateDownloading = false;
});
```

### 网络错误识别

```javascript
isNetworkError(errorObject) {
    return (
        errorObject.message === 'net::ERR_INTERNET_DISCONNECTED' ||
        errorObject.message === 'net::ERR_PROXY_CONNECTION_FAILED' ||
        errorObject.message === 'net::ERR_CONNECTION_RESET' ||
        errorObject.message === 'net::ERR_CONNECTION_CLOSE' ||
        errorObject.message === 'net::ERR_NAME_NOT_RESOLVED' ||
        errorObject.message === 'net::ERR_CONNECTION_TIMED_OUT'
    );
}
```

### update-available 事件

```javascript
autoUpdater.on('update-available', info => {
    this.fileSize = info.files[0] ? info.files[0].size : 0;
    this.fileSha512 = info.sha512;

    if (this.autoUpdateDownload) {
        // 静默下载模式
        // 先检查本地是否已有相同版本的安装包
        getItem('downloadedNewVersion').then(async res => {
            if (res && res.fileSha512 === info.sha512 && fs.existsSync(res.downloadedPath)) {
                const check = await checkHash(res.downloadedPath, res.fileSha512);
                if (check) {
                    // 已下载且校验通过，直接通知
                    this.downloadedPath = res.downloadedPath;
                    sendWinMsg('sendTo-main-win', 'download-newUpdateVersion', res);
                    return;
                }
            }
            // 开始自动下载
            setTimeout(() => ipcMain.emit('sys:updateNow'), 2000);
        });
        return;
    }

    // 非自动下载：显示更新弹窗
    const modalData = {
        updateVisible: true,
        processVisible: false,
        downloadedVisible: false,
        newVersion: info.version,
        newVersionInfo: this.description,
        forceUpdate: this.forceUpdate,
        fileSize: this.fileSize,
        canSkipUpdate: this.canSkipUpdate,
        updateWebUrl: this.updateWebUrl,
        updateMarketUrl: this.updateMarketUrl
    };
    ipcMain.emit('SEND-CURRENT-WIN-MSG', {type: 'SET_UPDATE_MODAL', data: modalData});
    ipcMain.emit('SEND-CURRENT-UPDATE-MSG', {type: 'SET_UPDATE_MODAL', data: modalData});
});
```

### download-progress 事件

```javascript
autoUpdater.on('download-progress', params => {
    // 静默下载模式不更新 UI
    if (this.autoUpdateDownload && !this.manualCheck && this.autoUpdateDownloading) {
        return;
    }

    this.downloadNetError = false;
    this.continueUpdate = false;
    this.downloadSize = params.transferred;

    if (!this.cancellationToken || !this.startUpdate) return;

    const percent = parseFloat(params.percent.toFixed(2));
    if (this.downloadPercent <= percent) {
        this.downloadPercent = percent;
        const modalData = {
            updateVisible: false,
            processVisible: true,
            forceUpdate: this.forceUpdate,
            downloadProcess: this.downloadPercent,
            downloadSize: this.downloadSize
        };
        ipcMain.emit('SEND-CURRENT-WIN-MSG', {type: 'SET_UPDATE_MODAL', data: modalData});
        ipcMain.emit('SEND-CURRENT-UPDATE-MSG', {type: 'SET_UPDATE_MODAL', data: modalData});
    }
});
```

### update-downloaded 事件

```javascript
autoUpdater.on('update-downloaded', e => {
    this.downloadPercent = 0;
    this.downloadSize = e.files[0] ? e.files[0].size : 0;

    if (this.autoUpdateDownload) {
        // 静默下载完成，通知渲染进程
        sendWinMsg('sendTo-main-win', 'download-newUpdateVersion', {
            version: this.targetVersion,
            downloadSize: this.downloadSize,
            fileSha512: this.fileSha512,
            downloadedPath: this.downloadedPath
        });
        // 显示"已下载完成"弹窗
        return;
    }

    // 用户触发的下载完成
    // 先显示 100%，1 秒后切换到"已下载完成"界面
    setTimeout(() => {
        const modalData = {
            forceUpdate: this.forceUpdate,
            updateVisible: false,
            downloadedVisible: true,
            processVisible: false,
            downloadProcess: 100
        };
        ipcMain.emit('SEND-CURRENT-WIN-MSG', {type: 'SET_UPDATE_MODAL', data: modalData});
        ipcMain.emit('SEND-CURRENT-UPDATE-MSG', {type: 'SET_UPDATE_MODAL', data: modalData});
    }, 1000);
});
```

## 下载与安装

### downloadUpdater 方法

```javascript
downloadUpdater() {
    autoUpdater
        .downloadUpdate(this.cancellationToken)
        .then(downloadPath => {
            this.downloadedPath = downloadPath[0];
        })
        .catch(err => {
            log.error('autoUpdater downloadUpdate=>error', err);
        });
}
```

### sys:nowRestart 安装流程

```javascript
ipcMain.on('sys:nowRestart', async () => {
    try {
        if (fs.existsSync(this.downloadedPath)) {
            const check = await checkHash(this.downloadedPath, this.fileSha512);
            if (check) {
                ipcMain.emit('MAIN-WIN-IS-CLOSE');   // 标记窗口可关闭
                this.openInstall(this.downloadedPath); // 启动安装
            } else {
                this.updateFail();                     // 校验失败
            }
        } else {
            this.updateFail();                         // 文件不存在
        }
    } catch (err) {
        log.error('sys:nowRestart err', err);
    }
});
```

### openInstall 方法

```javascript
openInstall(url) {
    if (this.autoUpdateDownload) {
        // 自动下载模式：通过 trayExit 回调安装
        trayExit(async function (res) {
            if (!res) {
                await removeItemList(['downloadedNewVersion', 'downloadedVersion']);
                const args = ['--updated', '--force-run'];
                await spawnThen(url, args);
            }
        });
    } else {
        // 手动模式：使用 shell 打开安装包
        openExternal(url);
    }
}
```

### 安装流程图

```
用户点击"立即安装"
    │
    └── sys:nowRestart
         │
         ├── 检查文件是否存在
         │     └── 不存在 → updateFail()
         │
         ├── SHA-512 哈希校验
         │     └── 失败 → updateFail()
         │
         ├── 校验通过
         │     │
         │     ├── MAIN-WIN-IS-CLOSE（标记窗口可关闭）
         │     │
         │     └── openInstall()
         │           │
         │           ├── 自动下载模式
         │           │     ├── trayExit() 退出应用
         │           │     ├── 清除本地已下载记录
         │           │     └── spawnThen(installer, ['--updated', '--force-run'])
         │           │
         │           └── 手动模式
         │                 └── openExternal(installer)
         │
         └── 安装程序启动 → 应用退出
```

## 强制更新

当服务器返回 `updateType === 1` 时，`forceUpdate` 被设为 `true`：

```javascript
const forceUpdate = res.updateType === 1;
```

强制更新的影响：

| 场景 | 正常更新 | 强制更新 |
|------|----------|----------|
| 更新弹窗 | 可关闭 | 不可关闭 |
| "稍后"按钮 | 可用 | 隐藏 |
| "跳过"按钮 | 可用（若 canSkipUpdate） | 隐藏 |
| 更新窗口 | 普通窗口 | modal 模态窗口（阻断主窗口） |
| 键盘关闭 | Alt+F4/Ctrl+W/Esc 可用 | Alt+F4/Ctrl+W/Esc 被拦截 |

在更新窗口模块 `update/index.js` 中：

```javascript
winInstance = new BrowserWindow({
    modal: data.initState.forceUpdate || false,
    parent: data.initState.forceUpdate ? global.currentWin : undefined,
});

// 拦截键盘关闭快捷键
winInstance.webContents.on('before-input-event', (event, input) => {
    if ((input.key === 'F4' && input.alt) || (input.key === 'W' && input.control) || input.key === 'Escape') {
        event.preventDefault();
    }
});
```

## 版本跳过

### 更新类型对照

| updateType | 含义 | canSkipUpdate |
|------------|------|---------------|
| 0 | 无需更新 | - |
| 1 | 强制更新 | false |
| 2 | 普通更新 | false |
| 3 | 建议更新 | true |

### 跳过机制

```javascript
ipcMain.on('sys:skipUpdater', () => {
    this.skipVer = true;
    this.clickLater = false;
    this.startUpdate = false;
    startRefreshTimer();  // 启动定期重新检查
});
```

用户跳过后，渲染进程将跳过的版本号和时间写入 `storage.skipUpdateVersion` / `storage.skipUpdateTime`。下次检查更新时 `checkSkip()` 会判断：

- 如果目标版本 === 已跳过版本 → 跳过
- 如果跳过时间 + 提醒间隔 > 当前时间 → 跳过（未过期）
- 否则 → 重新弹出更新提示

## mainEvent IPC 注册

```javascript
mainEvent() {
    // 断线续传
    ipcMain.on('sys:continueUpdate', () => { ... });

    // 取消下载
    ipcMain.on('sys:cancelUpdate', (e, data) => {
        this.cancellationToken = null;
        clearInterval(updateTimer);
        clearInterval(refreshTimer);
        startRefreshTimer();
    });

    // 立即下载
    ipcMain.on('sys:updateNow', () => {
        this.downloadUpdater();
        this.startUpdate = true;
    });

    // 稍后提醒
    ipcMain.on('sys:updateLater', (e, t) => {
        this.clickLater = true;
        startUpdateTimer(t);
    });

    // 跳过此版本
    ipcMain.on('sys:skipUpdater', () => {
        this.skipVer = true;
        startRefreshTimer();
    });

    // 立即安装
    ipcMain.on('sys:nowRestart', async () => { ... });
}
```

## 定时器机制

### startUpdateTimer -- 稍后提醒

```javascript
function startUpdateTimer(t) {
    if (!updateObj) return;
    if (t) {
        endTime = Number(t) + updateObj.reminderInterval;
    }
    if (endTime) {
        clearInterval(updateTimer);
        clearInterval(refreshTimer);
        updateTimer = setInterval(getDate, 1000 * 10);  // 每 10 秒检查
    }
}

function getDate() {
    if (Date.now() - endTime * 1000 >= 0) {
        // 时间到，重新触发更新检查
        ipcMain.emit('SEND-CURRENT-WIN-MSG', {
            type: 'start-CheckUpdateVersion', data: {}
        });
        clearInterval(updateTimer);
    }
}
```

### startRefreshTimer -- 定期检查

```javascript
function startRefreshTimer() {
    initTime = Date.now();
    clearInterval(updateTimer);
    clearInterval(refreshTimer);
    refreshTimer = setInterval(refresh, 1000 * 5);  // 每 5 秒检查
}

function refresh() {
    if ((Date.now() - initTime) / 1000 >= refreshInterval) {
        ipcMain.emit('SEND-CURRENT-WIN-MSG', {
            type: 'start-CheckUpdateVersion', data: {}
        });
        clearInterval(refreshTimer);
    }
}
```

## initUpdater 入口函数

```javascript
export function initUpdater() {
    setStore('storage.skipUpdateTime', '');

    ipcMain.on('start-checkUpdate', async (e, res) => {
        // updateType 映射
        // 0: 无需更新
        // 1: 强制更新
        // 2: 普通更新
        // 3: 建议更新

        if (res) {
            if (res.refreshInterval) {
                refreshInterval = res.refreshInterval;
            }
            if (!res.manualCheck) {
                startRefreshTimer();
            }

            const forceUpdate = res.updateType === 1;
            const canSkipUpdate = res.updateType === 3;
            const updateNow = typeof res.updateType === 'number' && res.updateType !== 0;
            const downloadUrl = getUploadPath(res.downLoadUrl);

            const updateData = {
                ...res,
                updateServer: downloadUrl,
                forceUpdate,
                canSkipUpdate,
                updateNow
            };

            if (!updateObj) {
                updateObj = new AppUpdater(updateData);
            } else {
                updateObj.initData(updateData);
            }
        }
    });
}
```

## 完整更新流程时序

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  渲染进程      │     │  主进程       │     │  更新服务器    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       │ start-checkUpdate  │                     │
       │ (含服务器版本信息)   │                     │
       │───────────────────>│                     │
       │                    │                     │
       │                    │ checkForUpdates()   │
       │                    │────────────────────>│
       │                    │                     │
       │                    │ update-available    │
       │                    │<────────────────────│
       │                    │                     │
       │ SET_UPDATE_MODAL   │                     │
       │ (updateVisible)    │                     │
       │<───────────────────│                     │
       │                    │                     │
       │ sys:updateNow      │                     │
       │───────────────────>│                     │
       │                    │                     │
       │                    │ downloadUpdate()    │
       │                    │────────────────────>│
       │                    │                     │
       │                    │ download-progress   │
       │                    │<────────────────────│
       │                    │                     │
       │ SET_UPDATE_MODAL   │                     │
       │ (processVisible)   │                     │
       │<───────────────────│                     │
       │                    │                     │
       │                    │ update-downloaded   │
       │                    │<────────────────────│
       │                    │                     │
       │ SET_UPDATE_MODAL   │                     │
       │ (downloadedVisible)│                     │
       │<───────────────────│                     │
       │                    │                     │
       │ sys:nowRestart     │                     │
       │───────────────────>│                     │
       │                    │                     │
       │                    │ SHA-512 校验        │
       │                    │ openInstall()       │
       │                    │ app.exit()          │
       │                    │                     │
```

## IPC 通道汇总

| 通道名 | 方向 | 说明 |
|--------|------|------|
| `start-checkUpdate` | 渲染 -> 主 | 服务器返回的版本信息，触发更新流程 |
| `sys:updateNow` | 内部 | 开始下载更新 |
| `sys:updateLater` | 渲染 -> 主 | 用户选择稍后提醒 |
| `sys:skipUpdater` | 渲染 -> 主 | 用户选择跳过此版本 |
| `sys:cancelUpdate` | 渲染 -> 主 | 用户取消下载 |
| `sys:continueUpdate` | 渲染 -> 主 | 断线后续传 |
| `sys:nowRestart` | 渲染 -> 主 | 用户确认安装并重启 |
| `SET_UPDATE_MODAL` | 主 -> 渲染/更新窗口 | 更新 UI 状态数据 |
| `CHECK_UPDATE_ERROR` | 主 -> 渲染 | 更新检查错误 |
| `CHECK_UPDATE_NEW_VERSION` | 主 -> 渲染 | 发现新版本 |
| `SHOW_CHECK_UPDATE_TIP` | 主 -> 渲染 | 已是最新版本提示 |
| `start-CheckUpdateVersion` | 主 -> 渲染 | 触发渲染进程重新向服务器检查版本 |
| `SEND-CURRENT-UPDATE-MSG` | 内部 | 转发消息到更新窗口 |
