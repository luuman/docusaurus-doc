# 工具函数 API 参考

本文档介绍项目中常用的公共工具函数，帮助开发者快速了解和使用这些工具。

---

## 目录

- [IPC 通信工具](#ipc-通信工具)
- [数据处理工具](#数据处理工具)
- [时间格式化工具](#时间格式化工具)
- [文件处理工具](#文件处理工具)
- [加密工具](#加密工具)
- [通用工具函数](#通用工具函数)

---

## IPC 通信工具

**文件**: `src/utils/ipc/ipcSend.js`

### ipcInvoke(type, ...args)

双向 IPC 通信，返回 Promise。

```javascript
import { ipcInvoke } from '@/utils/ipc/ipcSend';

// 示例：获取存储数据
const result = await ipcInvoke('getStore', 'storage');

// 示例：调用主进程方法
const data = await ipcInvoke('getUserInfo');
```

**参数**:
- `type` (string): IPC 通道名称
- `...args` (any): 传递给主进程的参数

**返回**: `Promise<any>` - 主进程返回的数据

---

### ipcSend(type, ...args)

单向 IPC 通信，无返回值。

```javascript
import { ipcSend } from '@/utils/ipc/ipcSend';

// 示例：发送通知
ipcSend('showNotification', { title: '新消息', body: '你有一条新消息' });

// 示例：最小化窗口
ipcSend('minimize');
```

**参数**:
- `type` (string): IPC 通道名称
- `...args` (any): 传递给主进程的参数

---

### ipcSendTo(to, type, ...args)

向指定窗口发送 IPC 消息。

```javascript
import { ipcSendTo } from '@/utils/ipc/ipcSend';

// 示例：向 SDK 窗口发送消息
ipcSendTo(sdkWindowId, 'sdk-command', { action: 'start' });
```

**参数**:
- `to` (number): 目标窗口的 webContents ID
- `type` (string): IPC 通道名称
- `...args` (any): 传递的参数

---

### sendSdk(type, ...args)

向 SDK 进程发送消息并等待响应。

```javascript
import { sendSdk } from '@/utils/ipc/ipcSend';

// 示例：调用 SDK 方法
const result = await sendSdk('cst-join-meeting', meetingParams);
```

**参数**:
- `type` (string): SDK 命令类型
- `...args` (any): 传递给 SDK 的参数

**返回**: `Promise<any>` - SDK 返回的数据

---

### getStorage(name, refresh)

获取 electron-store 中的存储数据。

```javascript
import { getStorage } from '@/utils/ipc/ipcSend';

// 获取全部存储
const storage = getStorage();

// 获取指定字段
const token = getStorage('accessToken');

// 强制刷新后获取
const freshData = getStorage('userInfo', true);
```

**参数**:
- `name` (string, optional): 存储字段名，不传则返回全部
- `refresh` (boolean, optional): 是否强制刷新缓存

**返回**: 存储的数据

---

## 数据处理工具

**文件**: `src/utils/dataUtil.js`

### prettyShortTime(stime, currentDate)

格式化时间为简短显示格式（今天显示时间，昨天显示"昨天"，其他显示日期）。

```javascript
import { prettyShortTime } from '@/utils/dataUtil';

// 今天的消息
prettyShortTime(Date.now()); // "14:30"

// 昨天的消息
prettyShortTime(Date.now() - 86400000); // "昨天"

// 更早的消息
prettyShortTime(Date.now() - 172800000); // "3/2" 或 "2/3"（根据语言）
```

**参数**:
- `stime` (number): 时间戳（毫秒）
- `currentDate` (Date, optional): 当前日期，默认为今天

**返回**: `string` - 格式化后的时间字符串

---

### renderDisplayName(peer, type)

根据用户/群组信息渲染显示名称，支持备注优先。

```javascript
import { renderDisplayName } from '@/utils/dataUtil';

// 渲染用户名称
const name = renderDisplayName(userPeer); // "张三" 或备注名

// 指定类型
const groupName = renderDisplayName(groupPeer, 'group');
```

**参数**:
- `peer` (object): 用户/群组对象
- `type` (string, optional): 类型 'user' | 'group'

**返回**: `string` - 显示名称

---

### formatDate(date, format)

通用日期格式化函数。

```javascript
import { formatDate } from '@/utils/dataUtil';

formatDate(new Date(), 'yyyy-MM-dd'); // "2026-02-05"
formatDate(new Date(), 'h:mm'); // "14:30"
formatDate(new Date(), 'd/M/yyyy'); // "5/2/2026"
```

**参数**:
- `date` (Date): 日期对象
- `format` (string): 格式字符串

**返回**: `string` - 格式化后的日期字符串

---

## 文件处理工具

**文件**: `src/utils/FileTool.js`

### FileTool 类

文件操作的核心工具类。

```javascript
import FileTool from '@/utils/FileTool';

// 获取文件信息
const info = await FileTool.getFileInfo(filePath);

// 计算文件 SHA256
const hash = await FileTool.calculateFileSHA256(filePath);

// 读取文件为 Base64
const base64 = await FileTool.readFileAsBase64(filePath);

// 检查文件是否存在
const exists = await FileTool.fileExists(filePath);

// 获取文件大小
const size = await FileTool.getFileSize(filePath);
```

---

### 常用文件操作函数

```javascript
import {
  getFileInfo,
  calculateFileSHA256,
  readFileAsBase64,
  fileExists,
  getFileSize,
  copyFile,
  moveFile,
  deleteFile,
  createDirectory,
  listDirectory
} from '@/utils/FileTool';

// 获取文件信息
const info = await getFileInfo('/path/to/file');
// 返回: { name, size, extension, mtime, ... }

// 复制文件
await copyFile(sourcePath, destPath);

// 移动文件
await moveFile(sourcePath, destPath);

// 创建目录
await createDirectory('/path/to/new/dir');

// 列出目录内容
const files = await listDirectory('/path/to/dir');
```

---

## 加密工具

**文件**: `src/utils/aes128gcm.js`

### AES-128-GCM 加密

```javascript
import { encrypt, decrypt } from '@/utils/aes128gcm';

// 加密数据
const encrypted = encrypt(plainText, key);

// 解密数据
const decrypted = decrypt(encryptedText, key);
```

---

**文件**: `src/utils/caTool.js`

### CA 证书工具

```javascript
import { verifyCertificate, getCertificateInfo } from '@/utils/caTool';

// 验证证书
const isValid = await verifyCertificate(certPath);

// 获取证书信息
const certInfo = await getCertificateInfo(certPath);
```

---

## 通用工具函数

**文件**: `src/utils/base.js`

### getPFMBaseURL()

获取当前环境的平台基础 URL。

```javascript
import { getPFMBaseURL } from '@/utils/base';

const baseUrl = getPFMBaseURL();
// 返回: "https://api.example.com"
```

---

### getEnvConfig()

获取当前环境配置。

```javascript
import { getEnvConfig } from '@/utils/base';

const config = getEnvConfig();
// 返回: { apiUrl, wsUrl, ... }
```

---

**文件**: `src/utils/deepCopy.js`

### deepCopy(obj)

深拷贝对象。

```javascript
import { deepCopy } from '@/utils/deepCopy';

const original = { a: 1, b: { c: 2 } };
const copy = deepCopy(original);
copy.b.c = 3;
// original.b.c 仍然是 2
```

---

**文件**: `src/utils/debounce.js`

### debounce(fn, delay)

防抖函数。

```javascript
import { debounce } from '@/utils/debounce';

const debouncedSearch = debounce((query) => {
  // 执行搜索
  searchApi(query);
}, 300);

// 在输入框中使用
input.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

**参数**:
- `fn` (function): 要防抖的函数
- `delay` (number): 延迟毫秒数

**返回**: 防抖后的函数

---

**文件**: `src/utils/clipboard.js`

### 剪贴板操作

```javascript
import {
  copyText,
  copyImage,
  pasteText,
  pasteImage
} from '@/utils/clipboard';

// 复制文本
await copyText('要复制的文本');

// 复制图片
await copyImage(imagePath);

// 粘贴文本
const text = await pasteText();

// 粘贴图片
const imageData = await pasteImage();
```

---

**文件**: `src/utils/dom.js`

### DOM 操作工具

```javascript
import {
  scrollToBottom,
  scrollToElement,
  getElementPosition
} from '@/utils/dom';

// 滚动到底部
scrollToBottom(containerElement);

// 滚动到指定元素
scrollToElement(targetElement, containerElement);

// 获取元素位置
const pos = getElementPosition(element);
// 返回: { top, left, width, height }
```

---

## 用户/会话相关工具

**文件**: `src/dataController/hid.js`

### getHid()

获取当前登录用户的 HID。

```javascript
import { getHid } from '@/dataController/hid';

const currentUserHid = await getHid();
```

---

### enCodeSpaceHid(hid, spaceId)

编码空间和 HID 为唯一键。

```javascript
import { enCodeSpaceHid } from '@/dataController/hid';

const key = enCodeSpaceHid('user123', 'space456');
// 返回: "space456_user123"
```

---

### defaultSpaceId()

获取默认空间 ID。

```javascript
import { defaultSpaceId } from '@/dataController/hid';

const spaceId = defaultSpaceId();
```

---

## 空间管理工具

**文件**: `src/utils/SpaceManager.js`

### getSpaceId()

获取当前空间 ID。

```javascript
import { getSpaceId } from '@/utils/SpaceManager';

const currentSpaceId = getSpaceId();
```

---

### switchSpace(spaceId)

切换到指定空间。

```javascript
import { switchSpace } from '@/utils/SpaceManager';

await switchSpace('newSpaceId');
```

---

## 最佳实践

### 1. 导入方式

推荐使用按需导入，减少打包体积：

```javascript
// 推荐
import { ipcInvoke, ipcSend } from '@/utils/ipc/ipcSend';

// 不推荐
import * as ipc from '@/utils/ipc/ipcSend';
```

### 2. 错误处理

所有异步工具函数都应该添加错误处理：

```javascript
try {
  const result = await ipcInvoke('getData');
  // 处理结果
} catch (error) {
  console.error('获取数据失败:', error);
  // 错误处理逻辑
}
```

### 3. 避免重复调用

对于频繁调用的函数，使用缓存或防抖：

```javascript
// 使用防抖
const debouncedSave = debounce(saveData, 500);

// 使用缓存
let cachedData = null;
function getData() {
  if (cachedData) return cachedData;
  cachedData = fetchData();
  return cachedData;
}
```

---

## 相关文档

- [IPC 通信机制](../architecture/ipc-communication.md)
- [数据存储模块](../modules/data-storage.md)
- [Store API 参考](./store-api.md)
- [Database API 参考](./database-api.md)

---

**最后更新**: 2026-02-05
