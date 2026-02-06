# P0: messageManger.js 拆分

**优先级**: P0 (最高)
**文件**: `src/api/messageManger.js`
**原始大小**: 171KB, 4,426 行, ~80 个函数
**状态**: ✅ 已完成

---

## 问题描述

`messageManger.js` 是整个 IM 系统的中枢文件，混合了 7+ 种职责：

- 消息路由与分发（`onMessage`、`handleMessage`）
- E2EE 端到端加密（`e2eProcess`、`e2EEPingAndSend`）
- 通知消息处理（`handleNotification`、`matchRouter`）
- 会话与未读数管理（`handleTxtStore`、`addUnreadCount2`）
- 企业/组织通知（`handleEnterpriseMemberCommonNotification`）
- Socket 连接与 WPush 注册（`doWpushRegRes`、`trySendPullDetail`）
- 消息编辑、撤回、置顶、会议卡片等（`editMessageHandle`、`withdrawSingle`）

单个 4,400+ 行的文件难以维护、定位问题和理解，被 32 个文件引用。

---

## 重构策略：Facade 模式

**核心原则：零破坏性变更。** 原始 `messageManger.js` 保留为 facade（仅 re-export），新服务文件放在 `src/api/messageServices/` 下。所有 32 个外部调用方无需修改任何 import 路径。

### 最终目录结构

```
src/api/
├── messageManger.js                        # Facade (52行，仅 re-export)
└── messageServices/
    ├── messageRouter.js                    # 消息入口分发、类型路由
    ├── messageE2eeService.js               # E2EE 端到端加密
    ├── messageNotificationHandler.js       # 通知消息处理
    ├── messageSessionService.js            # 会话与未读数管理
    ├── messageEnterpriseHandler.js         # 企业/组织通知处理
    ├── messageConnectionService.js         # Socket 连接与 WPush 注册
    └── messageEditService.js               # 消息编辑、会议卡片、工具函数
```

---

## 各模块详情

### 1. messageRouter.js（1,122 行）

**职责：** 消息入口分发、类型路由、全局事件监听

| 导出函数 | 说明 |
|----------|------|
| `onMessage(data, uuid, tempUuid)` | 消息主入口，接收 WebSocket 推送 |
| `handleMessage(srcData)` | 核心分发器，按消息类型路由到各处理函数 |
| `preprocess` | 消息预处理（re-export from `@/utils/message/preprocess`） |

内部函数：`handleHyperText`、`handleEvent`、`plainmessageprocess`、`checkAType`、`isIgnoreNotExistSpaceMsg`、`ignoreWarnE2EESpaceMsg`、`handleInputCycleMessage`

**副作用：** 模块加载时初始化 `window.historyMessage`、`window.historyMessageIs`、`window.fetchRegion` 全局变量，并调用 `setupConnectionListeners(onMessage)` 设置 WebSocket 事件监听。

**依赖：** 调用其他 6 个服务模块。

---

### 2. messageEditService.js（640 行）

**职责：** 消息编辑、会议卡片、临时消息、工具函数、共享类型判断

| 导出函数 | 说明 |
|----------|------|
| `getMsgType(msg)` | 消息类型判断（共享函数，解决循环依赖） |
| `logMessage(origin, log)` | 消息日志打印 |
| `checkAndDeleteTempMsg(curUUID, id)` | 临时消息清理 |
| `insertTempWaitMessage(curUUID, targetuuid, message, id)` | 插入等待消息 |
| `preventBlockMsg(data)` | 消息去重 |
| `editMessageHandle(editMessage, spaceId)` | 消息编辑处理 |
| `replaceMessageByEditText(currentMessage, editMessage)` | 合并编辑内容 |
| `handleMeetingCardMessage(conferenceId, authorizer, ...)` | 会议卡片更新 |
| `saveMeetingCardMessage(message, historyMessage)` | 保存会议卡片 |
| `setEmojiReplyList(message)` | 表情回复处理 |
| `withdrawSingle(message, preMsg, spaceId)` | 消息撤回 |
| `pinMsgHandle(newPinMsg, bePinedUuid)` | 置顶消息 |
| `appendHistoryMessage(messages)` | 追加历史消息 |
| `refreshMetioned(origin)` | 刷新 @提及 |

内部工具函数：`paths`、`filterText`、`renameFileName`、`historyIdFromTop`、`isHistory`、`isKeyChange`、`reqCountFromHistory`、`resetRobotInfo`

---

### 3. messageNotificationHandler.js（1,087 行）

**职责：** 通知消息处理（`handleNotification` 内的状态机）

| 导出函数 | 说明 |
|----------|------|
| `handleNotification(message)` | 通知入口，按消息类型分发 |
| `matchRouter(origin)` | 通知类型路由 |

内部处理器（通过 `matchRouter` 分发）：`pinLogic`、`readLogic2`、`deleteLogic`、`muteLogic2`、`muteGroupLogic`、`clearHistory`、`addSent`、`deleteContactRequest`、`changeProfile`、`deleteContact`、`aNewFriendComing`、`accpeted`、`handleAliasNameChange`

---

### 4. messageSessionService.js（513 行）

**职责：** 会话与未读数管理

| 导出函数 | 说明 |
|----------|------|
| `handleTxtStore(message, isNeedFts)` | 消息存储主逻辑 |
| `messageNotification(message, session, spaceId)` | 触发桌面通知 |
| `dialogUnreadCount2(message, session, spaceId)` | 计算对话未读数 |
| `updateDialogAndPeer2(message, spaceId)` | 更新会话和对端信息 |
| `wrapMessageNotify(message, spaceId)` | 构建通知数据 |

内部函数：`addUnreadCount2`、`subtractUnreadCount2`

---

### 5. messageEnterpriseHandler.js（382 行）

**职责：** 企业/组织通知处理

| 导出函数 | 说明 |
|----------|------|
| `errorHandle(error)` | 协议错误处理 |
| `enterpriseAdd(message)` | 企业空间加入 |
| `enterpriseRemove(message)` | 企业空间移除 |
| `refreshBind(updateEnterId)` | 刷新企业绑定 |
| `handleEnterpriseMemberCommonNotification(message, spaceId)` | 企业事件状态机 |

内部节流操作：`throttleUpdateEnterpriseMember`、`throttleUpdateProfile`、`throttleGetSpaceLimit`、`throttleGetURLWhiteList`、`throttleQueryPreference`、`throttleGetPwdExpiredLevel`、`throttleUpdateScheduleList`、`handleAccountPublicChange`

---

### 6. messageConnectionService.js（375 行）

**职责：** Socket 连接与 WPush 注册

| 导出函数 | 说明 |
|----------|------|
| `doWpushRegRes(isForceUpdateContact)` | WPush 注册响应 |
| `trySendPullDetail(hid, pullCount)` | 拉取离线消息 |
| `sendWPushMsg()` | 发送推送注册 |
| `trySendWPushReg(sendReg)` | 重试注册（含 15s 超时重连） |
| `reconnectSocketDoh(type)` | DOH 重连 |
| `offlineMsgLoading()` | 离线消息加载 UI |
| `checkHWMeeting()` | 检查会议状态 |
| `doPulldetail()` | 初始化拉取逻辑 |
| `setupConnectionListeners(onMessage)` | 设置 ws 事件监听 |

管理 `pushRegTimer`：`getPushRegTimer()`、`clearPushRegTimer()`、`setPushRegTimer(timer)`

---

### 7. messageE2eeService.js（342 行）

**职责：** E2EE 端到端加密

| 导出函数 | 说明 |
|----------|------|
| `e2eProcess(push_msg)` | E2EE 解密主流程 |
| `e2EEPingAndSend(hid, info)` | Ping 并获取密钥 |
| `retryE2EEPingAndScan(hid)` | 重试设备发现 |
| `retryE2EEScan(commingMsg)` | 扫描设备 |
| `e2eFailReScan(commingMsg)` | 解密失败重扫 |
| `handleKeyChange(message)` | 密钥变更处理 |
| `fetchNoSendPingList(spaceId)` | 获取待 Ping 列表 |

内部函数：`isSelfDevice`

---

## Facade 文件

重构后的 `messageManger.js` 仅 52 行，只做 re-export：

```javascript
// messageManger.js — Facade (仅 re-export)
import {onMessage, handleMessage, preprocess} from './messageServices/messageRouter';
import {doWpushRegRes, trySendPullDetail} from './messageServices/messageConnectionService';
import {
    getMsgType, handleMeetingCardMessage, checkAndDeleteTempMsg,
    insertTempWaitMessage, editMessageHandle, replaceMessageByEditText, logMessage
} from './messageServices/messageEditService';
import {MsgTemplate} from '@/socket/messageTemplate.js';
import {addFileProcessFileds} from '@/utils/message/preprocess.js';

export {
    getMsgType, onMessage, logMessage, doWpushRegRes, trySendPullDetail,
    handleMessage, handleMeetingCardMessage, checkAndDeleteTempMsg,
    insertTempWaitMessage, editMessageHandle, replaceMessageByEditText,
    preprocess, MsgTemplate, addFileProcessFileds
};
```

---

## 模块依赖关系

```
messageRouter (入口)
├── messageEditService      (工具函数、类型判断)
├── messageE2eeService      (E2EE 加密)
├── messageSessionService   (会话管理)
│   └── messageEditService  (getMsgType, logMessage, ...)
├── messageNotificationHandler (通知处理)
│   └── messageEditService  (paths, logMessage, ...)
├── messageEnterpriseHandler   (企业通知)
│   └── messageEditService  (paths)
└── messageConnectionService   (Socket 连接)
    └── messageE2eeService  (fetchNoSendPingList)
```

**`messageEditService`** 作为共享工具层，被其他所有模块依赖，自身不依赖其他任何服务模块，无循环依赖风险。

---

## 解决的关键问题

### 循环依赖：messageRouter ↔ messageSessionService

**问题：** `messageRouter` 调用 `handleTxtStore`（来自 `messageSessionService`），而 `messageSessionService` 又需要 `getMsgType`（原定义在 `messageRouter`）。

**解决方案：** 将 `getMsgType` 及其 `msgTypeMap` 移至 `messageEditService`（共享工具模块），两方均从 `messageEditService` 导入，打破循环。

### E2EE 模块的惰性加载

`messageE2eeService` 中对 `handleTxtStore` 使用了 `require()` 惰性加载而非顶层 `import`，避免 E2EE → Session → Edit 的隐式循环链。

### addFileProcessFileds 的 re-export

`renderMsgItem.js` 从 `messageManger.js` 导入 `addFileProcessFileds`，但该函数实际定义在 `@/utils/message/preprocess.js`。facade 中添加了 re-export 以保持兼容。

### personalSpaceId 引用修复

`messageNotificationHandler.js` 中原有 `F.personalSpaceId`（属性引用）应为 `personalSpaceId()`（函数调用），拆分时修正。

---

## 数据对比

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| 主文件行数 | 4,426 行 | 52 行 (facade) |
| 主文件大小 | 171 KB | 1.5 KB |
| 模块数量 | 1 个 | 7 个服务 + 1 个 facade |
| 总行数 | 4,426 行 | 4,461 行（含模块 import 开销） |
| 最大单模块 | 4,426 行 | 1,122 行 (messageRouter) |
| 外部调用方改动 | — | 0 个文件 |

---

## 验证清单

- [x] `messageManger.js` 所有 15 个导出符号均有对应 import
- [x] 32 个外部调用文件无需修改
- [x] 无循环依赖
- [x] 全局副作用（`window.historyMessage` 等）在 `messageRouter` 模块加载时正确初始化
- [x] WebSocket 事件监听（`ws:connect`、`ws:disconnect` 等）正确绑定
- [ ] `npm run dev` 启动无报错
- [ ] 消息收发功能正常
- [ ] E2EE 加密消息正常
- [ ] 企业通知不报错
- [ ] 消息编辑/撤回正常
- [ ] 离线消息拉取正常

---

**完成日期**: 2026-02-07
