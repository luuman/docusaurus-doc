# 通用函数参考

本文档是 `Function.js` 核心函数库的参考手册。`Function.js` 是项目中体量最大的工具文件（约 59KB），包含了消息处理、视图逻辑、排序工具、转发机制、全局控制等大量通用函数。

---

## 目录

- [文件概述](#文件概述)
- [消息类型判断函数](#消息类型判断函数)
- [消息转发与发送](#消息转发与发送)
- [视图与滚动逻辑](#视图与滚动逻辑)
- [排序与数据操作](#排序与数据操作)
- [Peer 信息获取](#peer-信息获取)
- [并发控制与队列](#并发控制与队列)
- [日志上传](#日志上传)
- [UI 辅助函数](#ui-辅助函数)
- [全局工具函数](#全局工具函数)
- [废弃与待重构函数](#废弃与待重构函数)

---

## 文件概述

**文件**: `src/utils/Function.js`

```javascript
import * as F from '@/utils/Function';

// 或按需导入
import {
    paths,
    isString,
    isPicture,
    forwords,
    sendMsg,
    createAtomRun,
    // ...
} from '@/utils/Function';
```

**依赖关系**: Function.js 引用了项目中大量模块，包括 store、API 层、Socket 层、加密模块等，是一个高度耦合的工具集合。

---

## 消息类型判断函数

一组纯函数，根据消息对象的 `MIMETYPE` 字段判断消息类型。

| 函数名 | 签名 | 匹配的 MIMETYPE | 说明 |
|--------|------|-----------------|------|
| `isPicture` | `(message) => boolean` | `image/webp`, `image/png`, `image/jpeg`, `image/jpg`, `image/gif`, `image/bmp` | 是否为图片消息 |
| `isDocument` | `(message) => boolean` | `x-filetransfer/octet-stream` | 是否为文件消息 |
| `isVideo` | `(message) => boolean` | `application/video` | 是否为视频消息 |
| `isVoice` | `(message) => boolean` | `audio/voice-msg`, `long-audio/voice-msg` | 是否为语音消息 |
| `isText` | `(message) => boolean` | `text/plain` (且非 E2EE 失败) | 是否为纯文本消息 |
| `isVcard` | `(message) => boolean` | `text/vcard` | 是否为名片消息 |
| `isCall` | `(message) => boolean` | `call/record` | 是否为通话记录 |
| `isRichText` | `(message) => boolean` | `richtext/plain` | 是否为富文本消息 |
| `isE2EE` | `(message) => boolean` | 通过 `isStar` 字段判断 | 是否为 E2EE 解密失败消息 |
| `isWithDraw` | `(message) => boolean` | `application/withdraw`, `application/eliminate` | 是否为撤回消息 |
| `isRestricted` | `(message) => boolean` | `application/restricted` | 是否为受限消息 |
| `isPoiCard` | `(message) => boolean` | `poi/card` | 是否为地图卡片 |
| `isLocationShare` | `(message) => boolean` | `location/share` | 是否为位置分享 |
| `isForRobot` | `(message) => boolean` | `forward/robot/richtext` | 是否为转发机器人消息 |
| `isMeetingInvite` | `(message) => boolean` | `meeting/invite` | 是否为会议邀请 |
| `isForwardApprovalCard` | `(message) => boolean` | `forward/approval/card` | 是否为转发审批卡片 |
| `isReplyMeetingCard` | `(message) => boolean` | 通过 `replyMeetingCard` 字段判断 | 是否为回复会议卡片 |

### 使用示例

```javascript
import { isPicture, isDocument, isText } from '@/utils/Function';

if (isPicture(message)) {
    // 显示图片预览
} else if (isDocument(message)) {
    // 显示文件信息
} else if (isText(message)) {
    // 显示文本内容
}
```

---

## 消息转发与发送

### forwords(uuid, isFromGroupPin, groupPinInfo, isNeedAt, data)

批量转发消息到多个目标。返回一个高阶函数，接收 HID 列表执行转发。

```javascript
import { forwords } from '@/utils/Function';

const doForward = forwords(messageUuid, false, null, false, null);
await doForward([hid1, hid2, hid3]);
// 将指定消息转发给 3 个目标
```

**参数**:
- `uuid` (string): 待转发消息的 UUID
- `isFromGroupPin` (boolean): 是否来自群置顶
- `groupPinInfo` (Object): 群置顶消息信息
- `isNeedAt` (boolean): 是否保留 @提及
- `data` (Object): 自定义消息数据（优先于数据库查询）

### forwordMerges(messageList)

批量合并转发消息。

```javascript
const doMergeForward = forwordMerges(messageList);
await doMergeForward([targetHid1, targetHid2]);
```

### forwardFile(filePath)

转发文件到指定目标。

```javascript
const doFileForward = forwardFile('/path/to/file');
await doFileForward([targetHid]);
```

### sendMsg(payload)

发送消息的核心函数，等同于 `sendPlainMsg('HyperText')`。处理 E2EE 加密和多设备同步。

```javascript
import { sendMsg } from '@/utils/Function';

await sendMsg(messagePayload);
```

### sendPlainMsg(cmd)

创建指定命令类型的消息发送函数。

```javascript
const sender = sendPlainMsg('HyperText');
await sender(payload);
```

**流程**:
1. 调用 `handleMessage` 处理消息入库
2. 调用 `sendE2EMessage` 发送（含 E2EE 加密多设备分发）

### createMsg(message)

从数据库消息对象创建新的消息模板（用于转发）。

```javascript
const msgCreator = createMsg(dbMessage);
const newMsg = msgCreator(targetHid);
```

### createFileMessage(message, hid)

创建文件类消息模板（用于文件/图片/视频转发）。

```javascript
const fileMsg = await createFileMessage(dbMessage, targetHid);
```

---

## 视图与滚动逻辑

### isBehindViewportTop(detected, view, deviation)

判断元素是否在视口顶部之下（可见区域内）。

```javascript
if (isBehindViewportTop(messageEl, scrollContainer, 5)) {
    // 元素在可视区域内
}
```

### isBeforeViewportBottom(detected, view, deviation)

判断元素是否在视口底部之上（可见区域内）。

### isInOfViewport(detected, view, deviation)

判断元素是否完全在视口内部。

```javascript
if (isInOfViewport(messageEl, scrollContainer)) {
    // 元素完全可见，可以标记为已读
}
```

### timeLogic(currentMsg, lastMsg)

消息时间戳显示逻辑，决定是否在消息间显示时间分隔。

```javascript
timeLogic(currentMsg, prevMsg);
// 设置 currentMsg.isShowTimeStamp = true/false
```

**显示时间的条件**:
- 发送者不同
- 上一条是撤回/事件/群创建消息
- 上一条是 E2EE 密钥变更
- 标记为未读消息
- 与上一条间隔超过 5 分钟
- 跨天

### dateLogic(currentMsg, lastMsg)

消息日期分隔逻辑。

```javascript
dateLogic(currentMsg, prevMsg);
// 设置 currentMsg.isShowDate = true/false
```

### ifLoadMoreIsNeeded(dom, vm)

检查消息列表是否需要加载更多（顶部或底部）。

```javascript
ifLoadMoreIsNeeded(scrollContainer, vueInstance);
```

### metionAnimation(el)

触发 @提及消息的高亮动画（添加 `view-animation` class，2 秒后移除）。

```javascript
metionAnimation(messageElement);
```

---

## 排序与数据操作

### paths(obj, ...keys)

安全的深层属性访问，类似 lodash 的 `_.get`。

```javascript
import { paths } from '@/utils/Function';

paths(message, 'm', 'meta', 'filename');
// 等同于 message?.m?.meta?.filename，但兼容旧环境
// 属性不存在时返回 null
```

### isString(obj) / isObject(obj)

类型检查函数。

```javascript
isString('hello');  // true
isString(123);      // false
isObject({});       // true
isObject([]);       // false
```

### 函数式排序工具

一组柯里化的排序工具函数，用于联系人列表排序。

```javascript
import { sortBy, ascending, firstName, lastName, name } from '@/utils/Function';

// 按 firstName 升序排序联系人列表
const sorted = sortBy(contactList)(ascending([firstName, lastName]));
```

| 函数名 | 签名 | 说明 |
|--------|------|------|
| `ascending` | `order((a, b) => a > b)` | 升序比较器 |
| `descending` | `order((a, b) => a < b)` | 降序比较器 |
| `sortBy` | `(xs) => (fn) => Array` | 柯里化排序 |
| `order` | `(by) => (propLens) => (a) => (b) => number` | 多属性排序器 |
| `firstName` | `(obj) => string` | 提取 firstName 并转小写 |
| `lastName` | `(obj) => string` | 提取 lastName 并转小写 |
| `name` | `(obj) => string` | 提取 name 并转小写 |
| `alias` | `(obj) => string` | 提取 alias 并转小写 |
| `dot` | `(...fns) => (a) => any` | 函数组合（管道） |
| `prop` | `(name) => (obj) => any` | 属性访问器 |
| `toLowerCase` | `(str) => string` | 转小写 |

### encodeForMetion(str)

将编辑器中的 @提及 HTML 解析为消息体格式（body + ref 数组）。

```javascript
const result = encodeForMetion(
    'Hello @<a metion hid="DXp90Pz1tq0" name="John">John</a> how are you?'
);
// result: {
//     body: 'Hello @John how are you?',
//     ref: [{ len: 4, start: 8, hid: 'DXp90Pz1tq0' }]
// }
```

### translateMsgMetionToAlias(&#123;body, ref, dialogId&#125;)

将消息中的 @提及替换为用户的显示别名。

```javascript
const displayText = translateMsgMetionToAlias({
    body: '@John Hello',
    ref: [{ hid: 'xxx', start: 1, len: 4 }],
    dialogId: 'groupHid'
});
// "@显示名称 Hello"
```

---

## Peer 信息获取

### getUserInfo(hid)

异步获取用户信息。

```javascript
const userInfo = await getUserInfo(peerHid);
```

### getCardUserInfo(message)

从名片消息中提取用户信息。

```javascript
const cardUser = await getCardUserInfo(vcardMessage);
```

### takePeerList(spaceId, hid, realFn, isNeedServe)

优化版的 Peer 获取函数，自动去重相同请求。短时间内多次请求同一 HID 时只发起一次实际请求。

```javascript
import { takePeerList } from '@/utils/Function';

const peer = await takePeerList(spaceId, hid, mangePeerList, false);
```

### calcNameForAvatarFromPeer(peer) / cname(peer)

计算用户头像显示名称。

```javascript
import { cname } from '@/utils/Function';

cname(peerObj);  // "John Smith" 或群组名称
```

### formatHidArgByProtraitMtime(hidList, members, spaceId, isEditContact)

根据头像更新时间过滤需要刷新的 HID 列表，避免不必要的头像请求。

```javascript
const { hids, noNeedFetchHidList, noProtraitMtimeList } =
    formatHidArgByProtraitMtime(hidList, membersMap, spaceId);
// hids: 需要请求的
// noNeedFetchHidList: 本地已是最新
// noProtraitMtimeList: 无头像时间信息
```

---

## 并发控制与队列

### createAtomRun()

创建原子化的异步队列，确保 Promise 函数按调用顺序串行执行。

```javascript
import { createAtomRun } from '@/utils/Function';

const atomRun = createAtomRun();

// 以下三个异步操作将严格按顺序执行
atomRun(() => asyncOperation1());
atomRun(() => asyncOperation2());
atomRun(() => asyncOperation3());
```

### globalAtomRun(fn)

全局原子运行器实例，整个应用共享。

```javascript
import { globalAtomRun } from '@/utils/Function';

globalAtomRun(async () => {
    await someOperation();
});
```

### createConsumeCommand() / globalConsume()

生产者-消费者模式的命令管理器，用于跨模块的异步回调协调。

```javascript
const [produce, consume] = globalConsume();

// 生产者注册回调（可选超时）
produce('requestId', (result) => {
    console.log('收到结果:', result);
}, 5000);  // 5 秒超时

// 消费者触发回调
consume('requestId', responseData);

// 永久注册（key 以 'forever' 开头不会被消费后删除）
produce('forever-onMessage', handleMessage);
```

### doAvoidDuplicateMethod(cacheKey, realFn, ...args)

避免短时间内重复请求，通过 key 复用进行中的 Promise。

```javascript
import { doAvoidDuplicateMethod } from '@/utils/Function';

const result = await doAvoidDuplicateMethod(
    'fetchUserList',          // 缓存 key
    fetchUserListApi,         // 实际请求函数
    param1, param2            // 请求参数
);
```

---

## 日志上传

### uploadLog(isDir, uploadType)

上传应用日志到服务器。

```javascript
import { uploadLog } from '@/utils/Function';

const result = await uploadLog(true, { isFeedback: true });
// result: { fid, name }
```

**参数**:
- `isDir` (boolean): `true` 上传日志目录，`false` 上传单个日志文件
- `uploadType` (Object): 上传配置 `{ isFeedback?, isCrystalSdk? }`

### getLogsArchiver(dirPath, uploadType)

将日志目录打包为加密的 zip 文件。

```javascript
const archive = await getLogsArchiver(logsDir, { isFeedback: false });
// archive: { path, name }
```

### clearTempZip(url)

清理上传完成后的临时 zip 文件。

---

## UI 辅助函数

### leftBottomPosotion(el, rectShowed) / rightBottomPosition(el, rectShowed)

计算弹出面板的定位坐标，自动处理视口边界碰撞和 RTL 布局。

```javascript
import { leftBottomPosotion, rightBottomPosition } from '@/utils/Function';

const pos = leftBottomPosotion(triggerElement, popupRect);
// pos: { top?: '100px', bottom?: '8px', left: '200px' }
```

### isFailLogic(status, info) / isSendingLogic(status, info) / isSuccessLogic(status, info)

消息发送状态判断。

```javascript
if (isFailLogic(statusMap, msgInfo)) {
    showResendButton();
} else if (isSendingLogic(statusMap, msgInfo)) {
    showLoadingSpinner();
} else if (isSuccessLogic(statusMap, msgInfo)) {
    showSentIcon();
}
```

**状态码**: `1` = 失败, `2` = 发送中, `3` = 成功

### draft(uuid, content)

消息草稿管理。

```javascript
import { draft } from '@/utils/Function';

// 保存草稿
draft(dialogUuid, '未完成的消息...');

// 读取草稿
const savedDraft = draft(dialogUuid, null);
```

### copy(text)

复制文本到剪贴板。

```javascript
import { copy } from '@/utils/Function';
await copy('要复制的文本');
```

---

## 全局工具函数

### removeEqualSign(a) / forceAddEqForHid(hid)

HID 等号处理工具。

```javascript
removeEqualSign('AAAAuvTOo94=');    // 'AAAAuvTOo94'
forceAddEqForHid('AAAAuvTOo94');    // 'AAAAuvTOo94='
forceAddEqForHid('all');            // 'all'
```

### getCountries() / lookupCode(phone)

国家代码查询。

```javascript
const countries = getCountries();
// [{ code: 'AF', dial_code: '+93', name: 'Afghanistan' }, ...]

const [code, phone] = lookupCode('8613812345678');
// ['+86', '13812345678']
```

### verifyURL(str)

URL 安全性验证（私有化部署环境使用白名单机制）。

```javascript
const result = verifyURL('https://example.com');
// { url, safe: true/false/'', inWebview: true/false }
```

### openLink(str)

打开链接，自动识别会议链接和普通链接。

```javascript
openLink('https://example.com');          // 浏览器或 WebView 打开
openLink('https://meeting.matrx.io/xxx'); // 加入会议
```

### pipeGlobalHandle(name, fn)

向全局函数添加管道处理，不覆盖原有功能。

```javascript
pipeGlobalHandle('onResize', () => {
    // 在原有 window.onResize 基础上追加处理
    recalcLayout();
});
```

### generalReadyInfo(info)

为请求添加通用设备信息字段。

```javascript
const readyInfo = generalReadyInfo({ customField: 'value' });
// { customField: 'value', osType: 3, appVersion: '1.25.0', dev: 2, appId: '1001' }
```

### startQueryPreference()

启动用户偏好设置查询（已读回执状态、远程存储路径等）。

---

## 废弃与待重构函数

以下函数存在设计问题或已被标记为需要重构:

| 函数名 | 问题 | 建议 |
|--------|------|------|
| `initial()` | 闭包状态管理，初始化逻辑散落 | 应迁入 store action |
| `sendE2EMessage` | 内部函数但被 `sendPlainMsg` 依赖 | 应抽离为独立模块 |
| `fix(fn)` | Y-combinator 风格的不动点函数，项目中未被实际使用 | 可移除 |
| `multiLineMenus` | 耦合了 i18n 和 window 操作 | 应迁入组件内 |
| `getMemberObjByArr` | 简单的数组转对象，过于简单 | 可直接内联 |
| `setSettingsData` | 直接操作 store，耦合度高 | 应通过 action 封装 |

### 关于 Function.js 的重构建议

Function.js 承载了过多职责，建议按功能域拆分:

```
src/utils/Function.js (约 59KB)
  -> src/utils/message/messageType.js      (消息类型判断)
  -> src/utils/message/messageForward.js   (转发逻辑)
  -> src/utils/message/messageSend.js      (发送逻辑)
  -> src/utils/view/scrollLogic.js         (滚动视图)
  -> src/utils/view/positionCalc.js        (定位计算)
  -> src/utils/peer/peerHelper.js          (Peer 获取)
  -> src/utils/async/atomRun.js            (并发控制)
  -> src/utils/log/logUpload.js            (日志上传)
```
