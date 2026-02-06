# 系统通知

## 概述

Matrx Windows 客户端的系统通知模块位于 `src/main/notification.js`，基于 Electron 的 `Notification` API 实现原生系统通知功能。该模块负责在收到新消息、会议邀请等需要用户关注的事件时，在 Windows 通知中心弹出系统级通知。模块实现了通知节流（throttle）、自动关闭、点击回调、声音控制等机制，确保通知既及时又不过度打扰用户。

## 核心文件结构

```
src/main/
├── notification.js             # 通知模块（本文档主题）
├── mainWindow/
│   └── index.js                # sendWinMsg / showWin 函数
├── toaster/
│   └── index.js                # Toast 通知（应用内，非系统通知）
└── ...
public/
└── icon.png                    # 通知图标
```

## notification.js 完整解析

### 导入依赖

```javascript
import {ipcMain, Notification} from 'electron';
import path from 'path';
import devLog from '@/logs/devLog';
import {sendWinMsg, showWin} from './mainWindow/index';
import throttle from 'lodash/throttle';
```

- `Notification` -- Electron 原生通知 API
- `sendWinMsg` -- 安全地向主窗口渲染进程发送消息
- `showWin` -- 显示并聚焦主窗口
- `throttle` -- lodash 节流函数，限制通知弹出频率

### 模块状态变量

```javascript
let notification,           // 当前 Notification 实例
    timerOut = null;        // 自动关闭定时器

const noticeDelay = 10000;  // 通知自动关闭延迟：10 秒
const noticeTimer = 3000;   // 通知节流间隔：3 秒
```

| 变量/常量 | 类型 | 说明 |
|-----------|------|------|
| `notification` | `Notification \| null` | 当前活跃的通知实例，同时只有一个 |
| `timerOut` | `number \| null` | `setTimeout` 返回的定时器 ID |
| `noticeDelay` | `number` | 通知自动消失时间，10000ms（10秒） |
| `noticeTimer` | `number` | 节流时间窗口，3000ms（3秒） |

## showNotification 函数

### 函数签名

```javascript
function showNotification(data)
```

### 参数结构

```javascript
data = {
    title: string,      // 通知标题（如发送者名称）
    message: string,    // 通知正文（如消息内容摘要）
    key: string,        // 通知唯一标识（用于日志追踪）
    silent: boolean     // 是否为静默通知（不播放提示音）
}
```

### 完整源码解析

```javascript
function showNotification(data) {
    try {
        // 1. 清除已有通知（单例模式）
        if (notification) {
            devLog.warn('notification exists');
            notification.close();
            notification = null;
            clearTimeout(timerOut);
        }

        // 2. 创建新通知
        notification = new Notification({
            title: data.title,
            body: data.message,
            silent: true,                           // Electron 层面始终静默
            icon: path.join(__static, './icon.png')  // 应用图标
        });

        // 3. 通知显示事件
        notification.on('show', () => {
            devLog.log('notification show', data.key);
            if (!data.silent) {
                // 非静默模式：通知渲染进程播放提示音
                sendWinMsg('notification-send', 'show', data);
            }
        });

        // 4. 通知点击事件
        notification.on('click', () => {
            sendWinMsg('notification-send', 'click', data);  // 通知渲染进程处理跳转
            showWin();                                        // 显示并聚焦窗口
            devLog.log('notification click');
            notification.close();
            notification = null;
            clearTimeout(timerOut);
        });

        // 5. 通知关闭事件
        notification.on('close', () => {
            devLog.log('notification close');
            notification.close();
            notification = null;
            clearTimeout(timerOut);
        });

        // 6. 自动关闭定时器
        timerOut = setTimeout(() => {
            devLog.log('notification timerOut close');
            notification.close();
            notification = null;
            clearTimeout(timerOut);
        }, noticeDelay);

        // 7. 显示通知
        notification.show();
    } catch (e) {
        console.error('showNotification catch', e);
        devLog.error('showNotification catch', e);
    }
}
```

### 流程图

```
showNotification(data)
    │
    ├── 已有通知？
    │     ├── 是 → close + 清空 + clearTimeout
    │     └── 否 → 继续
    │
    ├── new Notification({title, body, silent: true, icon})
    │
    ├── 绑定 'show' 事件
    │     └── data.silent = false？→ sendWinMsg('notification-send', 'show')
    │
    ├── 绑定 'click' 事件
    │     ├── sendWinMsg('notification-send', 'click')
    │     ├── showWin()
    │     └── close + 清空 + clearTimeout
    │
    ├── 绑定 'close' 事件
    │     └── close + 清空 + clearTimeout
    │
    ├── 启动 10s 自动关闭定时器
    │
    └── notification.show()
```

## initNotification 函数

### 函数签名

```javascript
export function initNotification()
```

### 完整源码

```javascript
export function initNotification() {
    ipcMain.on(
        'showNotification',
        throttle((e, val) => {
            showNotification(val);
        }, noticeTimer)
    );
}
```

### 节流机制

使用 lodash 的 `throttle` 函数包裹 IPC 监听器回调，确保在 3 秒窗口内最多只弹出一个通知。这对于 IM 应用至关重要：当用户收到大量消息时（如群消息轰炸），避免系统通知中心被淹没。

```
时间轴 →

消息1   消息2   消息3       消息4           消息5
  │      │      │           │               │
  ▼      ×      ×           ▼               ×
通知1                     通知2
  │←──── 3s ────→│←──── 3s ────→│
```

- 消息 1 触发通知 1
- 消息 2、3 在节流窗口内，被忽略
- 消息 4 超过 3 秒，触发通知 2
- 消息 5 在新的节流窗口内，被忽略

## 通知显示 API

### IPC 通道

| 通道名 | 方向 | 说明 |
|--------|------|------|
| `showNotification` | 渲染 -> 主 | 请求显示系统通知（带节流） |
| `notification-send` | 主 -> 渲染 | 通知事件回调（show/click） |

### 渲染进程调用方式

```javascript
// 渲染进程中
const { ipcRenderer } = require('electron');

ipcRenderer.send('showNotification', {
    title: '张三',
    message: '你好，在吗？',
    key: 'msg_uuid_123',
    silent: false
});
```

### 渲染进程事件监听

```javascript
// 渲染进程中
ipcRenderer.on('notification-send', (event, action, data) => {
    if (action === 'show') {
        // 通知已显示，播放提示音
        playNotificationSound();
    }
    if (action === 'click') {
        // 用户点击了通知，跳转到对应会话
        router.push(`/chat/${data.key}`);
    }
});
```

## 点击处理

当用户点击系统通知时，执行以下操作序列：

```
用户点击通知
    │
    ├── 1. sendWinMsg('notification-send', 'click', data)
    │      └── 渲染进程接收后跳转到对应会话
    │
    ├── 2. showWin()
    │      ├── 如果窗口不可见 → show()
    │      └── focus() 聚焦窗口
    │
    ├── 3. notification.close() 关闭通知
    │
    └── 4. clearTimeout(timerOut) 取消自动关闭
```

## 声音控制

### 设计说明

通知声音的播放不由 `Notification` 的 `silent` 参数控制（该参数始终为 `true`），而是通过通知回调通知渲染进程来播放声音。这种设计有以下优势：

1. **统一控制** -- 声音播放逻辑在渲染进程中统一管理
2. **灵活配置** -- 可以根据用户偏好、免打扰模式等动态决定是否播放
3. **自定义音效** -- 不受系统默认通知音限制

### 免打扰模式

免打扰模式的实现在渲染进程侧：当用户开启免打扰时，渲染进程不会发送 `showNotification` IPC 消息，从而从源头阻止通知弹出。

```
新消息到达（渲染进程）
    │
    ├── 免打扰已开启？
    │     ├── 是 → 不发送 showNotification（无通知、无声音）
    │     └── 否 → 继续
    │
    ├── 窗口已聚焦？
    │     ├── 是 → 仅播放提示音（不弹通知）
    │     └── 否 → ipcRenderer.send('showNotification', data)
    │
    └── 会话已静音？
          ├── 是 → data.silent = true（弹通知但不播放声音）
          └── 否 → data.silent = false（弹通知 + 播放声音）
```

## 通知单例管理

模块采用严格的单例模式管理通知实例，同一时间只允许显示一个通知：

```javascript
// 新通知到达时，先关闭旧通知
if (notification) {
    notification.close();
    notification = null;
    clearTimeout(timerOut);
}
```

这种设计避免了多个通知堆叠在通知中心的问题，确保用户看到的始终是最新的消息通知。

## 自动关闭机制

```javascript
timerOut = setTimeout(() => {
    notification.close();
    notification = null;
    clearTimeout(timerOut);
}, noticeDelay);  // 10 秒
```

通知在显示 10 秒后自动关闭。定时器在以下情况下被清除：

1. 用户点击通知
2. 用户手动关闭通知
3. 新通知到来覆盖旧通知
4. 定时器自然触发

## 错误处理

```javascript
try {
    // ... 通知逻辑
} catch (e) {
    console.error('showNotification catch', e);
    devLog.error('showNotification catch', e);
}
```

整个 `showNotification` 函数被 try-catch 包裹，确保通知模块的异常不会影响主进程的其它功能。常见的异常场景包括：

- 通知权限被系统拒绝
- 图标文件不存在
- 通知 API 在某些 Windows 版本上的兼容性问题

## Windows 通知中心集成

### AppUserModelId 要求

Windows 10+ 的通知中心要求应用设置 `AppUserModelId` 才能正确显示通知。在 `background.js` 中：

```javascript
if (process.platform === 'win32') {
    app.setAppUserModelId(isDevelopment ? process.execPath : appId);
}
```

生产环境使用 `exeConfig.js` 中配置的 `appId`，开发环境使用 Electron 可执行文件路径。

### 通知图标

```javascript
icon: path.join(__static, './icon.png')
```

使用应用主图标（`public/icon.png`）作为通知图标，确保用户能一眼识别通知来源。

## 与托盘模块的协作

通知模块与托盘模块共同构成了 Matrx 的后台消息提醒体系：

```
新消息到达
    │
    ├── 系统通知
    │     └── notification.js
    │           └── 系统通知中心弹出通知
    │
    ├── 托盘图标闪烁
    │     └── tray.js
    │           └── 切换图标 + 任务栏闪烁
    │
    └── 声音提示
          └── 渲染进程播放音效
```

三者独立运作但由渲染进程统一协调，用户的免打扰设置、会话静音设置等影响全部三个通道。
