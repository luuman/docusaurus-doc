# UI 工具

本文档介绍项目中与 UI 交互相关的工具函数，包括 DOM 操作、跨窗口元素迁移、消息渲染模板、系统通知、剪贴板操作等。

---

## 目录

- [核心文件结构](#核心文件结构)
- [dom - DOM 操作工具](#dom---dom-操作工具)
- [moveElement - 跨窗口元素迁移](#moveelement---跨窗口元素迁移)
- [renderMsgItem - 消息渲染模板](#rendermsgitem---消息渲染模板)
- [notification - 系统通知](#notification---系统通知)
- [clipboard - 剪贴板操作](#clipboard---剪贴板操作)

---

## 核心文件结构

```
src/utils/
├── dom.js              # DOM 元素操作（class检测、样式前缀、滚动判断等）
├── moveElement.js      # 跨窗口元素迁移（样式复制、SVG复制、DOM观察）
├── renderMsgItem.js    # 消息组件类型映射与渲染模板
├── notification.js     # 浏览器/系统消息通知
└── clipboard.js        # Electron 剪贴板读写（图片、文件、文本）
```

---

## dom - DOM 操作工具

**文件**: `src/utils/dom.js`

封装常用的 DOM 操作函数，提供跨浏览器兼容的样式前缀、class 检测、滚动状态判断等。

### 导入方式

```javascript
import dom from '@/utils/dom';
// 或按需导入
import { ownHasClass, getData, prefixStyle, hasCalss, parentIs } from '@/utils/dom';
```

### ownHasClass(el, className)

检查元素自身是否包含指定 class（通过正则匹配 `className` 属性）。

```javascript
ownHasClass(document.querySelector('.btn'), 'active');  // true/false
```

**参数**:
- `el` (HTMLElement): 目标元素
- `className` (string): class 名称

**返回**: `boolean`

### hasCalss(el, className)

使用 `classList.contains` 检查元素是否包含指定 class。

```javascript
hasCalss(element, 'selected');  // true/false
```

**区别**: 与 `ownHasClass` 不同，`hasCalss` 使用原生 `classList` API，更可靠。对非 HTMLElement 类型返回 `false`。

### getData(el, name, val)

读取或设置元素的 `data-*` 属性。

```javascript
// 读取
const value = getData(element, 'index');       // 读取 data-index
// 设置
getData(element, 'index', '5');                // 设置 data-index="5"
```

**参数**:
- `el` (HTMLElement): 目标元素
- `name` (string): data 属性名（不含 `data-` 前缀）
- `val` (string): 可选，设置的值

### prefixStyle(style)

自动添加浏览器厂商前缀。

```javascript
prefixStyle('transform');     // "webkitTransform" 或 "transform"
prefixStyle('transition');    // "webkitTransition" 或 "transition"
```

**参数**:
- `style` (string): CSS 属性名

**返回**: `string | false` - 带前缀的属性名，不支持时返回 `false`

**支持的前缀**: `webkit`、`Moz`、`O`、`ms`、`standard`

### parentIs(curEl, parentDomClassName)

向上查找父元素，判断是否存在包含指定 class 的祖先元素。

```javascript
const parent = parentIs(clickedElement, 'dropdown-menu');
// 返回匹配的父元素，或空字符串
```

**参数**:
- `curEl` (HTMLElement): 起始元素
- `parentDomClassName` (string): 目标 class 名

**返回**: `HTMLElement | string` - 找到的父元素，未找到返回 `""`

### isScrollBarToBottom(ele)

判断元素的滚动条是否到达底部。

```javascript
if (isScrollBarToBottom(scrollContainer)) {
    loadMore();
}
```

### getStyle(ele, property)

获取元素的计算样式值（整数）。

```javascript
const height = getStyle(element, 'height');   // 返回整数像素值
const width = getStyle(element, 'width');
```

### getcursorPosition()

获取当前光标选区对象。

```javascript
const selection = getcursorPosition();
// 返回 window.getSelection()
```

### getEmojiHtml(code)

将 emoji 字符包装为 `<span>` 元素。

```javascript
const emojiSpan = getEmojiHtml('😀');
// 返回 <span>😀</span> HTMLElement
```

### checkDragEvent(e)

检查拖拽事件是否为文件拖拽（过滤图片和链接的拖拽）。

```javascript
element.ondragover = (e) => {
    if (checkDragEvent(e)) {
        // 是文件拖拽
        showDropZone();
    }
};
```

---

## moveElement - 跨窗口元素迁移

**文件**: `src/utils/moveElement.js`

Electron 多窗口场景下，将 DOM 元素、样式、SVG 精灵图从一个窗口迁移到另一个窗口。主要用于独立窗口（如会议窗口、聊天弹出窗口）的初始化。

### 导入方式

```javascript
import {
    copyStylesToWin,
    copySvgToWin,
    moveElementToWin,
    observerLinkToWin
} from '@/utils/moveElement';
```

### copyStylesToWin(sourceWin, targetWin)

将源窗口的所有样式表复制到目标窗口，包括 `<style>` 标签和外部 `<link>` 样式表。

```javascript
await copyStylesToWin(window, newWindow);
// 等待所有外部样式表加载完成后 resolve
```

**参数**:
- `sourceWin` (Window): 源窗口对象
- `targetWin` (Window): 目标窗口对象

**返回**: `Promise<void>` - 所有样式加载完成后 resolve

**处理逻辑**:
1. 复制所有 `<style>` 标签到目标窗口
2. 为每个外部 `<link>` 样式表创建新的 `<link>` 标签
3. 等待所有外部样式表的 `onload` 或 `onerror` 回调

### copySvgToWin(sourceWin, targetWin)

将 SVG 精灵图（ID 为 `__SVG_SPRITE_NODE__`）从源窗口复制到目标窗口。

```javascript
copySvgToWin(window, newWindow);
```

### moveElementToWin(element, targetWin)

将 DOM 元素移动到目标窗口的 body 中。

```javascript
const popupContent = document.getElementById('popup-content');
moveElementToWin(popupContent, newWindow);
```

**参数**:
- `element` (HTMLElement): 要移动的元素
- `targetWin` (Window): 目标窗口对象

### observerLinkToWin(sourceWin, targetWin)

监听源窗口 `<head>` 中新增的样式资源，自动同步到目标窗口。适用于运行时动态加载的样式。

```javascript
const observer = observerLinkToWin(window, newWindow);
// 返回 MutationObserver 实例，需要时可调用 observer.disconnect()
```

**参数**:
- `sourceWin` (Window): 源窗口对象
- `targetWin` (Window): 目标窗口对象

**返回**: `MutationObserver` - 观察器实例

**监听范围**: `<head>` 下的 `childList` 和 `subtree` 变化，自动复制新增的 `<link type="text/css">` 和 `<style>` 标签。

---

## renderMsgItem - 消息渲染模板

**文件**: `src/utils/renderMsgItem.js`

根据消息的 MIME 类型，将原始消息数据映射为对应的 Vue 组件渲染模板。

### 导入方式

```javascript
import renderMsgItem, {
    msgTypeInfo,
    msgRestrictedTypeInfo,
    getSpaceLimitMsgText
} from '@/utils/renderMsgItem';
```

### renderMsgItem(msgItem)

核心渲染函数，将消息对象转换为组件渲染模板。

```javascript
const template = renderMsgItem(decodedMessage);
// template.chatComponentType: 'MESSAGE' | 'PICTURE' | 'DOCUMENT' | ...
// template.customData: 渲染数据
// template.plainMsg: 原始消息引用
```

**参数**:
- `msgItem` (Object): 解码后的消息对象，需包含 `m.MIMETYPE`、`m.body`、`m.meta` 等字段

**返回**: 模板对象
```javascript
{
    customData: { msg },         // 渲染用数据
    direct: 'LEFT',              // 显示方向
    token: peerId,               // 发送者标识
    chatComponentType: string,   // 组件类型
    timestamp: number,           // 时间戳
    uuid: string,                // 消息唯一ID
    isShowTimeStamp: boolean,    // 是否显示时间
    plainMsg: Object,            // 原始消息
    stime: number,               // 发送时间
    peerId: string,              // 对方ID
    msgSeq: number,              // 消息序号
    lastSeq: number              // 上一条序号
}
```

### MIME 类型与组件映射

| MIME 类型 | chatComponentType | 说明 |
|-----------|------------------|------|
| `text/plain` | `MESSAGE` | 普通文本消息 |
| `longtext/plain` | `MESSAGELONG` | 长文本消息 |
| `richtext/plain` | `RICHTEXT` | 富文本消息 |
| `image/jpeg`, `image/png`, `image/gif`, ... | `PICTURE` | 图片消息 |
| `x-filetransfer/octet-stream` | `DOCUMENT` | 文件消息 |
| `application/video` | `DOCUMENT` | 视频消息（复用文件组件） |
| `audio/voice-msg` | `VOICE` | 语音消息 |
| `long-audio/voice-msg` | `LONGVOICE` | 长语音消息 |
| `text/vcard` | `VCARD` | 名片消息 |
| `meeting/invite` | `MEETINGINVITE` | 会议邀请 |
| `meeting/card` | `MEETINGCARD` | 会议卡片 |
| `approval/card` | `APPROVALCARD` | 审批卡片 |
| `application/sticker` | `STICKER` | 表情贴纸 |
| `application/announcement` | `Announcement` | 公告消息 |
| `robot/richtext` | `RobotRich` | 机器人富文本 |
| `text/combine` | `CombineText` | 合并转发消息 |
| `text/richurl-x` | `RICHURL` | 富链接消息 |
| `poi/card` | `MAPVIEW` | 地图卡片 |
| `location/share` | (默认) | 位置分享 |
| `call/record` | `CALLRECORD` | 通话记录 |
| `application/withdraw` | `EVENT` | 撤回通知 |
| `application/restricted` | `RESTRICTED` | 受限消息 |
| `application/card` | `UNSUPPORTED` | 不支持的卡片消息 |
| E2EE 解密失败 | `E2EDESCRIPT` | 端到端加密解密失败 |
| 未知类型 | `UNKNOW` | 未知消息类型 |

### getSpaceLimitMsgText(MIMETYPE, isWrapper)

检查消息类型是否被当前空间限制发送。

```javascript
const limit = getSpaceLimitMsgText('image/jpeg');
// { isIncluded: true/false, showMsgText: '[Picture]' }
```

**参数**:
- `MIMETYPE` (string): 消息 MIME 类型
- `isWrapper` (boolean): 是否用方括号包裹文案，默认 `true`

**返回**: `{isIncluded: boolean, showMsgText: string}`

---

## notification - 系统通知

**文件**: `src/utils/notification.js`

封装浏览器 Notification API 和 Electron 窗口通知，支持消息通知的节流控制、声音提示和点击跳转。

### 导入方式

```javascript
import { messageNotify } from '@/utils/notification';
```

### MessageNotify 类

单例模式导出，全局使用 `messageNotify` 实例。

### messageNotify.notify(data)

触发系统通知。内置 5 秒节流，连续消息不会重复弹出通知。

```javascript
messageNotify.notify({
    title: '新消息',
    message: '你收到了一条新消息',
    image: iconUrl,          // 可选，通知图标
    silent: false,           // 可选，是否静音
    curTime: Date.now(),     // 当前时间（用于节流判断）
    peerId: 'peerHid',      // 可选，点击跳转的对话 HID
    spaceId: 'spaceId'      // 可选，点击跳转的空间 ID
});
```

**参数**:
- `data.title` (string): 通知标题
- `data.message` (string): 通知内容
- `data.image` (string): 通知图标 URL
- `data.silent` (boolean): 是否静音
- `data.curTime` (number): 当前时间戳
- `data.peerId` (string): 关联的 Peer HID
- `data.spaceId` (string): 关联的空间 ID

**行为**:
1. 检查通知权限和浏览器支持
2. 节流控制（5 秒内不重复弹出）
3. 创建 `Notification` 实例
4. 点击通知: 聚焦窗口 + 切换到对应对话
5. 非 Firefox: 播放提示音

### messageNotify.requestPermission()

请求通知权限（构造时自动调用）。

### messageNotify.notificationsClear()

清除 Windows Site Mode 下的图标覆盖。

---

## clipboard - 剪贴板操作

**文件**: `src/utils/clipboard.js`

基于 Electron `clipboard` API 封装的剪贴板工具，支持图片读取、Data URL 图片转换、多文件复制粘贴、文本剪贴板操作。

### 导入方式

```javascript
import { getClipboardData, setClipboard } from '@/utils/clipboard';
```

### getClipboardData(url)

读取剪贴板内容，自动识别文本和图片/文件。

```javascript
const data = await getClipboardData();

if (data.files) {
    // 剪贴板包含文件/图片
    console.log(data.files);  // [{ name, path, size, type, ... }]
} else {
    // 剪贴板只有文本
    console.log(data.text);   // "clipboard text content"
}

// 从 Data URL 创建文件
const dataFromUrl = await getClipboardData('data:image/png;base64,...');
```

**参数**:
- `url` (string): 可选，Data URL 字符串。提供时直接从 Data URL 生成文件

**返回**: `Promise<{files: Array|false, text: string}>`

**处理优先级**:
1. 有文本内容: 返回 `{files: false, text: '...'}`
2. 有 Data URL: 将 Base64 解码为文件保存到临时目录
3. 有多文件复制: 通过 IPC 获取文件路径列表
4. 有图片: 从 NativeImage 读取 PNG 数据保存到临时目录

### setClipboard(type, content)

设置剪贴板内容。

```javascript
// 写入文本
await setClipboard('text', 'Hello World');

// 写入 HTML
await setClipboard('html', '<b>Bold Text</b>');

// 写入图片（通过文件路径）
await setClipboard('img', '/path/to/image.png');

// 写入文件（通过文件路径）
await setClipboard('file', '/path/to/document.pdf');
```

**参数**:
- `type` (string): 内容类型，支持 `'text'`、`'html'`、`'img'`、`'file'`
- `content` (string): 写入的内容或文件路径

**类型处理**:
- `text`: 调用 `clipboard.writeText`
- `html`: 调用 `clipboard.writeHTML`
- `img` / `file`: 通过 IPC 调用 `set-clipboad-multiple` 设置文件路径

### 临时文件处理

剪贴板图片会保存到应用数据目录的 `clipboard-temp` 文件夹中:

```
{configDir}/clipboard-temp/{uuid}.png
```

文件名使用 UUID v1 生成以避免冲突。
