# 系统托盘

## 概述

Matrx Windows 客户端的系统托盘模块位于 `src/main/tray.js`，负责在 Windows 任务栏通知区域创建和管理托盘图标。该模块实现了托盘图标的创建与销毁、右键菜单构建、左键单击聚焦窗口、新消息时图标闪烁以及安全退出流程。作为 IM 客户端，系统托盘是用户在"关闭"主窗口后继续接收消息通知的核心交互入口。

## 核心文件结构

```
src/main/
├── tray.js                     # 托盘模块（本文档主题）
├── mainWindow/
│   ├── index.js                # 主窗口管理（getCurrentWinState、showWin）
│   └── settingsCalendar.js     # 日历设置
├── meetingSDK/                 # 会议 SDK（退出时需反初始化）
└── ...
public/
└── tray/
    ├── trayOn.png              # 正常状态托盘图标
    └── trayOff.png             # 新消息状态托盘图标（用于闪烁）
```

## tray.js 完整解析

### 导入依赖

```javascript
import path from 'path';
import {ipcMain, Menu, Tray, BrowserWindow} from 'electron';
import {productName} from '../../package.json';
import cryptolog from '@/logs/cryptolog';
import {getCurrentWinState} from '@/main/mainWindow';
```

- `productName` -- 用作托盘鼠标悬停时的 Tooltip 文本
- `getCurrentWinState` -- 判断主窗口是否处于崩溃/无响应状态

### 模块状态

```javascript
let tray = null;  // Tray 实例引用，模块内单例
```

## setTray 函数

### 函数签名

```javascript
export function setTray()
```

### 完整源码解析

```javascript
export function setTray() {
    // 1. 防止重复创建
    if (tray && !tray.isDestroyed()) {
        return;
    }

    // 2. 加载图标资源
    let trayIcon = path.join(__static, 'tray/trayOn.png');    // 正常图标
    let trayIcons = path.join(__static, 'tray/trayOff.png');  // 消息图标

    // 3. 创建 Tray 实例
    tray = new Tray(trayIcon);

    // 4. 构建右键菜单
    const contextMenu = Menu.buildFromTemplate([
        {
            label: global.$t('contextMenu.openApp'),  // "打开应用"
            click: () => {
                ipcMain.emit('showMainWin');
            }
        },
        {
            label: global.$t('contextMenu.exit'),      // "退出"
            click: trayExit
        }
    ]);

    // 5. 左键单击事件
    tray.on('click', () => {
        cryptolog.info('tray click');
        currentWin && !currentWin.isDestroyed() &&
            currentWin.webContents.send('ipcSendTrayClear');  // 通知渲染进程清除未读
        ipcMain.emit('showMainWin');                          // 显示主窗口
    });

    // 6. 右键单击事件
    tray.on('right-click', () => {
        cryptolog.info('tray right-click');
        tray.popUpContextMenu([contextMenu]);
    });

    // 7. 设置 Tooltip
    tray.setToolTip(productName);

    // 8. 监听图标切换 IPC
    ipcMain.on('setTraySetImage', (e, imNotify) => {
        if (imNotify && currentWin && !currentWin.isFocused())
            currentWin.flashFrame(true);                      // 任务栏闪烁
        tray.setImage(imNotify ? trayIcons : trayIcon);       // 切换图标
    });

    // 9. 右键菜单（文本复制）
    ipcMain.on('ipc_show_context_menu', (event, param) => {
        let template = [
            {role: 'copy', label: 'Copy', enabled: param.copy}
        ];
        const menu = Menu.buildFromTemplate(template);
        menu.popup(BrowserWindow.fromWebContents(event.sender));
    });

    // 10. 设置默认右键菜单
    tray.setContextMenu(contextMenu);

    return tray;
}
```

### 创建流程图

```
setTray()
    │
    ├── tray 已存在且未销毁？ ── 是 ──→ return（不重复创建）
    │
    └── 否
         │
         ├── 加载 trayOn.png / trayOff.png
         │
         ├── new Tray(trayIcon)
         │
         ├── 构建右键菜单 Menu.buildFromTemplate
         │     ├── "打开应用" → showMainWin
         │     └── "退出"     → trayExit
         │
         ├── 绑定 click 事件     → 清除未读 + 显示窗口
         │
         ├── 绑定 right-click    → 弹出右键菜单
         │
         ├── 设置 Tooltip
         │
         ├── 注册 setTraySetImage IPC
         │
         └── tray.setContextMenu
```

## destroyTray 函数

```javascript
export function destroyTray() {
    tray && !tray.isDestroyed() && tray.destroy();
}
```

安全销毁托盘图标。调用前检查 `tray` 是否存在且未被销毁，避免在重复调用时抛出异常。

### 调用时机

| 调用场景 | 源文件 | 说明 |
|----------|--------|------|
| 用户退出登录 | `background.js` `CLEAR-TEMP-USER-RES` | 清理临时用户数据前销毁托盘 |
| 切换语言 | `background.js` `ipcChangeAppLang` | 语言切换需重建托盘菜单 |
| 窗口全部关闭 | `background.js` `window-all-closed` | 非 macOS 退出流程 |
| app.before-quit | `background.js` | 应用退出前清理 |
| appQuit | `mainWindow/index.js` | 通用退出函数 |

## trayExit 退出函数

### 函数签名

```javascript
export async function trayExit(callback)
```

### 完整解析

```javascript
export async function trayExit(callback) {
    try {
        cryptolog.info('tray Exit app');

        // 1. 会议 SDK 反初始化
        if (global.meetingSDK) {
            const res = await global.meetingSDK.unInitialize();
            cryptolog.log('meetingSDK unInitialize', res);

            // 如果返回 1，表示用户在会议中且选择了取消退出
            if (res === 1) {
                cryptolog.warn('meetingSDK exit cancel');
                return res;
            }
            global.meetingSDK = null;
        }

        // 2. 执行回调（更新模块使用此回调清理下载状态）
        typeof callback === 'function' && (await callback());

        // 3. 判断窗口状态决定退出方式
        if (getCurrentWinState()) {
            // 窗口已崩溃/无响应，直接发出退出信号
            cryptolog.info('currentCrash Exit app');
            ipcMain.emit('CLEAR-TEMP-USER-RES');
        } else {
            // 窗口正常，通知渲染进程清理后再退出
            if (currentWin && !currentWin.isDestroyed() && !currentWin.getBrowserView()) {
                currentWin.webContents.send('CLEAR-TEMP-USER');
            } else {
                ipcMain.emit('CLEAR-TEMP-USER-RES');
            }
        }
    } catch (e) {
        // 异常时也确保能退出
        if (currentWin && !currentWin.isDestroyed() && !currentWin.getBrowserView()) {
            currentWin.webContents.send('CLEAR-TEMP-USER');
        } else {
            ipcMain.emit('CLEAR-TEMP-USER-RES');
        }
    }
}
```

### 退出流程图

```
trayExit()
    │
    ├── meetingSDK 存在？
    │     ├── 是 → unInitialize()
    │     │         ├── 返回 1（用户取消）→ return 1（中止退出）
    │     │         └── 返回 0（成功）→ meetingSDK = null
    │     └── 否 → 继续
    │
    ├── 执行 callback（如有）
    │
    ├── getCurrentWinState() = true？（窗口已崩溃）
    │     ├── 是 → ipcMain.emit('CLEAR-TEMP-USER-RES')
    │     └── 否 → currentWin.send('CLEAR-TEMP-USER')
    │                    │
    │                    ▼
    │              渲染进程清理完成后
    │              发送 'CLEAR-TEMP-USER-RES'
    │                    │
    │                    ▼
    │              background.js 处理退出
    │              ├── destroyTray()
    │              ├── currentWin.destroy()
    │              ├── LoadingView.destroy()
    │              └── app.exit(0)
    │
    └── 异常捕获 → 同样确保退出
```

### 关键设计：会议中退出保护

当用户正在会议中点击「退出」时，`meetingSDK.unInitialize()` 会弹出确认对话框。如果用户选择取消（返回值 1），`trayExit` 直接 return，不执行后续退出逻辑。

## 托盘图标切换与新消息闪烁

### IPC 通道 setTraySetImage

```javascript
ipcMain.on('setTraySetImage', (e, imNotify) => {
    // imNotify: boolean - true 表示有新消息
    if (imNotify && currentWin && !currentWin.isFocused())
        currentWin.flashFrame(true);                     // 任务栏图标闪烁
    tray.setImage(imNotify ? trayIcons : trayIcon);      // 切换托盘图标
});
```

### 闪烁机制说明

| 条件 | 行为 |
|------|------|
| `imNotify = true` 且窗口未聚焦 | 任务栏闪烁 + 托盘切换为 `trayOff.png` |
| `imNotify = true` 且窗口已聚焦 | 仅切换托盘图标（用户已在看消息） |
| `imNotify = false` | 恢复正常图标 `trayOn.png` |

### 闪烁清除时机

闪烁的清除由渲染进程控制，通过以下路径：

```
用户点击托盘图标
    │
    └── tray.on('click')
         │
         ├── currentWin.send('ipcSendTrayClear')  → 渲染进程清除未读数
         │                                            → 发送 setTraySetImage(false)
         │                                            → 托盘恢复正常图标
         │
         └── showMainWin()                         → 显示并聚焦窗口
```

同样，当主窗口获得焦点时也会触发清除：

```javascript
// mainWindow/index.js
currentWin.on('focus', () => {
    sendMainWinMsg('ipcSendTrayClear');
});
```

## 托盘菜单构建

### 右键菜单

```javascript
const contextMenu = Menu.buildFromTemplate([
    {
        label: global.$t('contextMenu.openApp'),  // 国际化文本
        click: () => {
            ipcMain.emit('showMainWin');
        }
    },
    {
        label: global.$t('contextMenu.exit'),
        click: trayExit                            // 异步退出函数
    }
]);
```

菜单项使用 `global.$t()` 进行国际化，支持英文（en）和阿拉伯语（ar）。

### 文本右键菜单

`tray.js` 中还注册了一个通用的文本右键菜单，供渲染进程中的文本选中场景使用：

```javascript
ipcMain.on('ipc_show_context_menu', (event, param) => {
    let template = [
        {role: 'copy', label: 'Copy', enabled: param.copy}
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
});
```

`param.copy` 控制复制菜单项是否可用（有文本选中时为 true）。

## 完整 IPC 通道汇总

| 通道名 | 方向 | 说明 |
|--------|------|------|
| `setTraySetImage` | 渲染 -> 主 | 切换托盘图标（true=新消息/false=正常） |
| `ipcSendTrayClear` | 主 -> 渲染 | 通知渲染进程清除未读标记 |
| `showMainWin` | 内部 emit | 显示并聚焦主窗口 |
| `ipc_show_context_menu` | 渲染 -> 主 | 弹出文本右键菜单 |
| `CLEAR-TEMP-USER` | 主 -> 渲染 | 退出前通知渲染进程清理 |
| `CLEAR-TEMP-USER-RES` | 渲染 -> 主 / 内部 | 清理完成，执行退出 |

## 托盘生命周期

```
应用启动
    │
    ├── app.ready
    │     │
    │     └── createWindow(callback)
    │              │
    │              └── did-finish-load → loadInitSDK()
    │                                      │
    │                                      └── setTray()  ← 托盘创建
    │
    ├── 正常运行中
    │     │
    │     ├── 新消息 → setTraySetImage(true) → 图标闪烁
    │     │
    │     ├── 用户点击托盘 → 清除闪烁 + 显示窗口
    │     │
    │     └── 用户关闭窗口 → 隐藏到托盘（非退出）
    │
    └── 退出
          │
          ├── 托盘右键 "退出" → trayExit()
          │     ├── SDK 反初始化
          │     └── 清理 → destroyTray() → app.exit(0)
          │
          ├── 切换语言 → destroyTray() → appRestart()
          │
          └── 窗口全关闭 → destroyTray() → appExit()
```

## 注意事项

1. **图标路径** -- 使用 `__static` 指向 `public/` 目录，打包后路径会自动映射到 `resources/app.asar.unpacked/public/`
2. **单例保护** -- `setTray` 开头检查是否已有未销毁的实例，防止重复创建
3. **语言依赖** -- 菜单文本在创建时绑定，切换语言后需要 `destroyTray()` + `setTray()` 重建
4. **会议保护** -- `trayExit` 中的 meetingSDK 退出取消机制防止用户在会议中误退出
