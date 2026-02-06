# IPC 通道 API 参考

本文档介绍项目中主进程和渲染进程之间的 IPC 通信通道和使用方法。

---

## 目录

- [IPC 通信概述](#ipc-通信概述)
- [常用 IPC 通道](#常用-ipc-通道)
- [窗口控制通道](#窗口控制通道)
- [文件操作通道](#文件操作通道)
- [存储操作通道](#存储操作通道)
- [会议 SDK 通道](#会议-sdk-通道)
- [系统功能通道](#系统功能通道)
- [使用示例](#使用示例)

---

## IPC 通信概述

### 通信方式

| 方式 | 函数 | 说明 |
|------|------|------|
| 单向通信 | `ipcSend` | 渲染进程 → 主进程，无返回值 |
| 双向通信 | `ipcInvoke` | 渲染进程 → 主进程 → 渲染进程，Promise 返回 |
| 同步通信 | `sendSync` | 渲染进程 ↔ 主进程，同步阻塞 |
| 窗口间通信 | `ipcSendTo` | 渲染进程 → 其他渲染进程 |

### 文件位置

- 主进程监听: `src/main/IPCMainChannel.js`
- 渲染进程发送: `src/IPCRenderChannel.js`
- 工具函数: `src/utils/ipc/ipcSend.js`

---

## 常用 IPC 通道

### 用户数据通道

| 通道名 | 方向 | 说明 |
|--------|------|------|
| `REMOVE_USER_DATA` | render → main | 清除用户数据 |
| `getUserInfo` | render → main | 获取用户信息 |
| `setUserInfo` | render → main | 设置用户信息 |

```javascript
import { ipcInvoke, ipcSend } from '@/utils/ipc/ipcSend';

// 获取用户信息
const userInfo = await ipcInvoke('getUserInfo');

// 清除用户数据
ipcSend('REMOVE_USER_DATA', { userId: 'xxx' });
```

---

## 窗口控制通道

### 主窗口控制

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `showMainWin` | - | 显示主窗口 |
| `hideMainWin` | - | 隐藏主窗口 |
| `minimize` | - | 最小化窗口 |
| `maximize` | - | 最大化窗口 |
| `unmaximize` | - | 还原窗口 |
| `close` | - | 关闭窗口 |
| `setAlwaysOnTop` | boolean | 设置置顶 |

```javascript
import { ipcSend, ipcInvoke } from '@/utils/ipc/ipcSend';

// 最小化窗口
ipcSend('minimize');

// 最大化/还原
ipcSend('maximize');
ipcSend('unmaximize');

// 设置置顶
ipcSend('setAlwaysOnTop', true);

// 关闭窗口
ipcSend('close');
```

### 子窗口管理

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `openWindow` | `{ name, params }` | 打开子窗口 |
| `closeWindow` | windowName | 关闭子窗口 |
| `focusWindow` | windowName | 聚焦窗口 |

```javascript
// 打开截图窗口
ipcSend('openWindow', {
  name: 'screenshot',
  params: { mode: 'capture' }
});

// 打开文件查看器
ipcSend('openWindow', {
  name: 'fileViewer',
  params: { filePath: '/path/to/file' }
});

// 关闭窗口
ipcSend('closeWindow', 'screenshot');
```

---

## 文件操作通道

### 剪贴板操作

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `clipboard-write-text` | text | 写入文本到剪贴板 |
| `clipboard-read-text` | - | 读取剪贴板文本 |
| `clipboard-write-image` | imagePath | 写入图片到剪贴板 |
| `clipboard-read-image` | - | 读取剪贴板图片 |

```javascript
import { ipcInvoke, ipcSend } from '@/utils/ipc/ipcSend';

// 复制文本
ipcSend('clipboard-write-text', '要复制的文本');

// 读取文本
const text = await ipcInvoke('clipboard-read-text');

// 复制图片
ipcSend('clipboard-write-image', '/path/to/image.png');

// 读取图片
const imageData = await ipcInvoke('clipboard-read-image');
```

### 文件对话框

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `showOpenDialog` | options | 打开文件选择对话框 |
| `showSaveDialog` | options | 打开保存对话框 |
| `showMessageBox` | options | 显示消息框 |

```javascript
import { ipcInvoke } from '@/utils/ipc/ipcSend';

// 选择文件
const result = await ipcInvoke('showOpenDialog', {
  properties: ['openFile', 'multiSelections'],
  filters: [
    { name: '图片', extensions: ['jpg', 'png', 'gif'] },
    { name: '所有文件', extensions: ['*'] }
  ]
});
// result.filePaths: ['path1', 'path2', ...]

// 保存文件
const savePath = await ipcInvoke('showSaveDialog', {
  defaultPath: 'document.pdf',
  filters: [{ name: 'PDF', extensions: ['pdf'] }]
});

// 显示确认框
const { response } = await ipcInvoke('showMessageBox', {
  type: 'warning',
  buttons: ['取消', '确定'],
  title: '确认',
  message: '确定要删除吗？'
});
// response: 0 = 取消, 1 = 确定
```

### 文件操作

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `openPath` | path | 在系统中打开路径 |
| `showItemInFolder` | path | 在文件管理器中显示 |
| `openExternal` | url | 在默认浏览器打开 |
| `set-record-path` | path | 设置录制路径 |

```javascript
import { ipcSend, ipcInvoke } from '@/utils/ipc/ipcSend';

// 在文件管理器中显示文件
ipcSend('showItemInFolder', '/path/to/file');

// 打开文件夹
ipcSend('openPath', '/path/to/folder');

// 在浏览器打开链接
ipcSend('openExternal', 'https://example.com');

// 设置录制保存路径
ipcSend('set-record-path', '/path/to/recordings');
```

---

## 存储操作通道

### electron-store 操作

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `getStore` | key | 获取存储值 |
| `setStore` | key, value | 设置存储值 |
| `deleteStore` | key | 删除存储值 |
| `getStore-Sync` | key | 同步获取存储值 |

```javascript
import { ipcInvoke, ipcSend } from '@/utils/ipc/ipcSend';
import { ipcRenderer } from 'electron';

// 异步获取
const value = await ipcInvoke('getStore', 'storage.token');

// 同步获取（阻塞）
const syncValue = ipcRenderer.sendSync('getStore-Sync', 'storage');

// 设置值
ipcSend('setStore', 'storage.token', 'newToken');

// 设置嵌套值
ipcSend('setStore', 'storage.user.name', '张三');

// 删除值
ipcSend('deleteStore', 'storage.tempData');
```

---

## 会议 SDK 通道

### SDK 初始化

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `cst-initialize` | config | 初始化 SDK |
| `cst-uninitialize` | - | 卸载 SDK |
| `sdkContentId` | - | 获取 SDK 窗口 ID |

```javascript
import { ipcInvoke, sendSdk } from '@/utils/ipc/ipcSend';

// 获取 SDK 窗口 ID
const sdkId = await ipcInvoke('sdkContentId');

// 初始化 SDK
await sendSdk('cst-initialize', {
  appId: 'xxx',
  token: 'xxx'
});
```

### 会议操作

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `cst-join-meeting` | meetingParams | 加入会议 |
| `cst-leave-meeting` | - | 离开会议 |
| `cst-end-meeting` | - | 结束会议 |
| `cst-mute-audio` | muted | 静音/取消静音 |
| `cst-mute-video` | muted | 关闭/打开视频 |

```javascript
import { sendSdk } from '@/utils/ipc/ipcSend';

// 加入会议
await sendSdk('cst-join-meeting', {
  meetingId: 'meeting-123',
  password: '123456',
  userName: '张三'
});

// 静音
await sendSdk('cst-mute-audio', true);

// 开启视频
await sendSdk('cst-mute-video', false);

// 离开会议
await sendSdk('cst-leave-meeting');
```

---

## 系统功能通道

### 通知

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `showNotification` | options | 显示系统通知 |
| `flashFrame` | flag | 任务栏闪烁 |

```javascript
import { ipcSend } from '@/utils/ipc/ipcSend';

// 显示通知
ipcSend('showNotification', {
  title: '新消息',
  body: '你有一条新消息',
  icon: '/path/to/icon.png'
});

// 任务栏闪烁
ipcSend('flashFrame', true);

// 停止闪烁
ipcSend('flashFrame', false);
```

### 快捷键

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `shortcut-win` | action | 快捷键窗口操作 |
| `registerShortcut` | shortcut | 注册全局快捷键 |
| `unregisterShortcut` | shortcut | 注销全局快捷键 |

```javascript
import { ipcSend, ipcInvoke } from '@/utils/ipc/ipcSend';

// 打开快捷键设置窗口
ipcSend('shortcut-win', 'open');

// 注册快捷键
await ipcInvoke('registerShortcut', {
  accelerator: 'CommandOrControl+Shift+S',
  action: 'screenshot'
});
```

### 托盘操作

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `setTraySetImage` | type | 设置托盘图标 |
| `updateBadgeCount` | count | 更新角标数量 |

```javascript
import { ipcSend } from '@/utils/ipc/ipcSend';

// 设置托盘图标（新消息状态）
ipcSend('setTraySetImage', 'new-message');

// 恢复正常图标
ipcSend('setTraySetImage', 'normal');

// 更新角标数
ipcSend('updateBadgeCount', 5);
```

### 应用更新

| 通道名 | 参数 | 说明 |
|--------|------|------|
| `check-update` | - | 检查更新 |
| `download-update` | - | 下载更新 |
| `install-update` | - | 安装更新 |
| `skip-update` | version | 跳过版本 |

```javascript
import { ipcSend, ipcInvoke } from '@/utils/ipc/ipcSend';

// 检查更新
const hasUpdate = await ipcInvoke('check-update');

// 下载更新
ipcSend('download-update');

// 安装更新
ipcSend('install-update');

// 跳过此版本
ipcSend('skip-update', '1.25.0');
```

---

## 使用示例

### 在 Vue 组件中使用

```vue
<template>
  <div>
    <button @click="copyText">复制</button>
    <button @click="openFile">选择文件</button>
  </div>
</template>

<script>
import { ipcSend, ipcInvoke } from '@/utils/ipc/ipcSend';

export default {
  methods: {
    copyText() {
      ipcSend('clipboard-write-text', '要复制的内容');
      this.$message.success('已复制');
    },

    async openFile() {
      const result = await ipcInvoke('showOpenDialog', {
        properties: ['openFile'],
        filters: [{ name: '图片', extensions: ['jpg', 'png'] }]
      });

      if (!result.canceled && result.filePaths.length) {
        this.handleFile(result.filePaths[0]);
      }
    }
  }
}
</script>
```

### 在主进程中监听

```javascript
// src/main/IPCMainChannel.js
const { ipcMain, dialog, clipboard } = require('electron');

// 处理文件选择
ipcMain.handle('showOpenDialog', async (event, options) => {
  return dialog.showOpenDialog(options);
});

// 处理剪贴板写入
ipcMain.on('clipboard-write-text', (event, text) => {
  clipboard.writeText(text);
});

// 处理剪贴板读取
ipcMain.handle('clipboard-read-text', () => {
  return clipboard.readText();
});

// 获取存储
ipcMain.handle('getStore', (event, key) => {
  return store.get(key);
});

// 设置存储
ipcMain.on('setStore', (event, key, value) => {
  store.set(key, value);
});
```

---

## 最佳实践

### 1. 选择正确的通信方式

```javascript
// 需要返回值 - 使用 invoke
const result = await ipcInvoke('getData');

// 不需要返回值 - 使用 send
ipcSend('logEvent', { action: 'click' });

// 避免同步通信（会阻塞）
// 仅在必要时使用 sendSync
```

### 2. 错误处理

```javascript
try {
  const result = await ipcInvoke('riskyOperation');
} catch (error) {
  console.error('IPC 调用失败:', error);
  // 处理错误
}
```

### 3. 数据序列化

IPC 传输的数据会被序列化，避免传输：
- 函数
- Symbol
- 循环引用的对象
- DOM 元素

```javascript
// 正确
ipcSend('saveData', { name: '张三', age: 25 });

// 错误 - 函数无法序列化
ipcSend('saveData', {
  name: '张三',
  callback: () => {} // 会丢失
});
```

### 4. 安全考虑

- 验证 IPC 消息来源
- 不要通过 IPC 传输敏感数据明文
- 限制可调用的通道

---

## 相关文档

- [IPC 通信机制](../architecture/ipc-communication.md)
- [主进程架构](../architecture/main-process.md)
- [Utils API 参考](./utils-api.md)

---

**最后更新**: 2026-02-05
