# 已读未读机制

## 概述

Matrx IM实现了完整的已读回执(Read Receipt)机制，支持单聊和群聊场景。该功能允许发送方了解消息是否被接收方阅读，提升沟通效率。核心逻辑位于 `receiptUtils.js`。

## 回执数据结构

### 消息中的回执字段

```javascript
{
    m: {
        uuid: 'msg_uuid',
        MIMETYPE: 'text/plain',
        receipt: 255,          // 回执要求标志
        // ...
    },
    unreadReceipt: '0',        // 已读状态: '0'=未读, '1'=待发送, '2'=已读
    receiptShow: 'show'        // 显示状态: 'show'/'hide'
}
```

### 回执状态枚举

| 值 | 含义 | 说明 |
|----|------|------|
| `'0'` | 未读 | 消息未被阅读 |
| `'1'` | 待发送 | 已阅读但回执未发送 |
| `'2'` | 已读 | 已阅读且回执已发送 |
| `null` | 不需要回执 | 早期消息或特殊消息 |

### 已读回执消息格式

```javascript
{
    c: 'HyperText',
    t: 'dialog_id',
    meFrom: 'uid#desktop',
    mcTo: 'spaceId#uid',
    noDisturb: true,
    m: {
        si: 1,
        flags: 22,
        ctime: 1234567890,
        uuid: 'receipt_uuid',
        MIMETYPE: 'application/receipt',
        stime: '',
        receipt: 2,
        nf: 1,
        meta: {
            origUUID: 'original_msg_uuid',
            origMimeType: 'application/receipt',
            type: 0,
            receiptInfo: [{
                ruuid: 'msg_uuid',      // 原消息UUID
                rstime: 1234567890      // 原消息时间
            }]
        }
    }
}
```

## receiptUtils.js 工具函数

### 文件位置

```
src/utils/chat/receiptUtils.js
```

### 核心导出函数

| 函数 | 说明 |
|------|------|
| `appendReceipt()` | 初始化消息的回执状态 |
| `saveReceiptAllMessage()` | 处理接收到的回执消息 |
| `sendMsgReceiptInfo()` | 发送已读回执 |
| `clearReceiptShow()` | 清除回执显示状态 |
| `clearReceiptInfo()` | 清空回执缓存 |
| `clearUserReceiptShow()` | 清除指定用户回执 |
| `resetReceiptInfo()` | 重置回执信息 |

### appendReceipt - 回执初始化

```javascript
// receiptUtils.js

export function appendReceipt(messageItem) {
    let isReceipt = true;
    const userInfoHid = messageItem.f === store.state.userInfo.hid;

    // 检查消息时间是否在回执功能启用之后
    if (messageItem.m.stime) {
        isReceipt = messageItem.m.stime > appdataStorage.getItem('RECEIPT_START_TIME');
    }

    // 初始化未读状态
    if (!messageItem.unreadReceipt) {
        messageItem.unreadReceipt = isReceipt ? '0' : null;
    }

    // 自己发送的消息，根据回执开关决定显示
    if (!store.state.setting.receiptsSwitch && userInfoHid) {
        messageItem.receiptShow = 'hide';
    }

    // 带回执标记的个人消息
    if (messageItem.m.receipt === 2 &&
        dataUtil.getPeerType(messageItem.f) === 'user' &&
        messageItem.f === store.state.userInfo.hid) {
        messageItem.unreadReceipt = 2;
    }

    // 解析群聊回执信息
    if (messageItem.m?.meta?.receiptInfo) {
        const receiptInfo = messageItem.m.meta.receiptInfo;
        const { readcnt, unreadcnt, readRefs } = Array.isArray(receiptInfo)
            ? receiptInfo[0]
            : receiptInfo;

        let hids = [];
        if (Array.isArray(readRefs) && readRefs.length) {
            hids = readRefs.map(id => dataUtil.numberToHid(id));
        }

        messageItem.m.meta.receiptInfos = {
            readcnt,
            unreadcnt,
            readRefs: hids
        };

        // 清理原始数据
        if (messageItem.m.MIMETYPE !== 'application/receipt/count' &&
            messageItem.m.MIMETYPE !== 'application/receipt') {
            delete messageItem.m.meta.receiptInfo;
        }
    }
}
```

### sendMsgReceiptInfo - 发送已读回执

```javascript
// receiptUtils.js

export function sendMsgReceiptInfo(viewChatList, receiptsSwitch, actDialogId, SpaceId) {
    let dialogMap = {};

    // 按会话分组
    viewChatList.forEach(item => {
        const dialogId = item?.plainMsg?.dialogId;
        if (!dialogId) return;

        if (!dialogMap[dialogId]) {
            dialogMap[dialogId] = [];
        }
        dialogMap[dialogId].push(item);
    });

    // 分别发送
    for (let dialogId in dialogMap) {
        sendMsgReceiptToMetion(dialogMap[dialogId], receiptsSwitch, dialogId, SpaceId);
    }
}

async function sendMsgReceiptToMetion(viewChatList, receiptsSwitch, actDialogId, SpaceId) {
    if (!viewChatList.length) return;

    await checkIfsendMsg(actDialogId);

    let newData = {};
    let isE2EE = false;

    // 构建回执数据
    viewChatList.forEach(item => {
        const { uuid: ruuid, stime: rstime, peerId, plainMsg } = item;

        // 只对非自己发送的未读消息发送回执
        const unreadReceipt = plainMsg?.unreadReceipt || item.unreadReceipt;
        if (store.state.userInfo.hid !== peerId && unreadReceipt < '1') {
            if (!newData[peerId]) newData[peerId] = [];
            newData[peerId].push({ ruuid, rstime });
        }
    });

    sendReceiptMsg(newData, receiptsSwitch, isE2EE, actDialogId, viewChatList, SpaceId);
}
```

### sendReceiptMsg - 发送回执消息

```javascript
// receiptUtils.js

function sendReceiptMsg(newData, receiptsSwitch, isE2EE, actDialogId, viewChatList, SpaceId) {
    // 创建回执消息
    const sendData = [];
    for (let key in newData) {
        const msgTemplate = new MsgTemplate();
        sendData.push(msgTemplate.getReceipTemplate(key, newData[key], isE2EE, actDialogId));
    }

    if (!sendData.length) return;

    let isGroup = dataUtil.getPeerType(actDialogId) == 'group';

    // 群消息或开启回执开关时立即发送
    if (receiptsSwitch || isGroup) {
        const connectState = store.state.uiControl.connectState;

        if (connectState === 'connect') {
            store.state.uiControl.socketInstance
                ?._sendMsg(sendData, 'HyperText')
                .then(res => {
                    // 发送成功，更新本地状态
                    backReceiptMsgSucces(viewChatList, SpaceId, isGroup, actDialogId);
                })
                .catch(err => {
                    console.error('sendReceiptMsg error', err);
                });
        }
    } else {
        // 回执开关关闭，缓存回执
        backReceiptMsgCache(viewChatList, SpaceId, sendData);
    }
}
```

### saveReceiptAllMessage - 处理接收的回执

```javascript
// receiptUtils.js

export async function saveReceiptAllMessage(message) {
    const receiptInfo = message.m.meta.receiptInfo;
    if (!receiptInfo?.length && !Array.isArray(receiptInfo)) return;

    const userInfoHid = message.f === store.state.userInfo.hid;
    const spaceId = getSpaceId(message.mcTo);

    const receiptObjInfo = {};

    // 查询原消息
    return getMessageWithDatabase(
        receiptInfo.map(item => {
            receiptObjInfo[item.ruuid] = item;
            return item.ruuid;
        }),
        spaceId
    ).then(currentMsg => {
        if (!currentMsg?.length) {
            throw message.m.uuid;
        }

        const messageType = currentMsg[0].messageType;

        if (!userInfoHid) {
            // 别人发送的回执
            if (messageType === 'user') {
                // 单聊回执
                if (!store.state.setting.receiptsSwitch) {
                    currentMsg.receiptShow = 'hide';
                    updateMessageReceiptList(spaceId, currentMsg, 'receiptsSwitch');
                } else {
                    updateMessageReceiptList(spaceId, currentMsg, 'receiptRead');
                }
                Bus.$emit('UPDATE_DIALOGS_LIST');
            } else if (messageType === 'group') {
                // 群聊回执
                let NewCurrentMsg = [];
                currentMsg.forEach(item => {
                    const { readcnt, unreadcnt, readRefs } = receiptObjInfo[item.uuid];

                    if (readcnt || unreadcnt) {
                        if (!item.m.meta) item.m.meta = {};

                        let hids = [];
                        if (Array.isArray(readRefs) && readRefs.length) {
                            hids = readRefs.map(id => dataUtil.numberToHid(id));
                        }

                        item.m.meta.receiptInfos = {
                            readcnt,
                            unreadcnt,
                            readRefs: hids
                        };

                        NewCurrentMsg.push({
                            content: item.content,
                            m: item.m,
                            meta: item.m.meta,
                            uuid: item.uuid
                        });
                    }
                });

                if (NewCurrentMsg.length) {
                    updateMessageReceiptList(spaceId, NewCurrentMsg, 'receiptGroup');
                }
            }
        } else {
            // 自己发送的消息被已读
            updateMessageReceiptList(spaceId, currentMsg, 'receiptRead');
        }
    });
}
```

## 群聊已读回执

### 群回执数据结构

```javascript
{
    m: {
        MIMETYPE: 'application/receipt',
        meta: {
            receiptInfo: [{
                ruuid: 'msg_uuid',
                rstime: 1234567890,
                readcnt: 5,           // 已读人数
                unreadcnt: 10,        // 未读人数
                readRefs: [           // 已读用户列表
                    '86107369891064677',
                    '65135978691849975'
                ]
            }]
        }
    }
}
```

### 群回执显示

```javascript
// 消息元数据中存储的回执信息
meta: {
    receiptInfos: {
        readcnt: 5,
        unreadcnt: 10,
        readRefs: ['hid1', 'hid2', ...]
    }
}
```

### 批量回执处理

```javascript
// messageManger.js - handleHyperText()

case 'application/receipt/count':
case 'application/receipt':
    const receiptInfo = message.m.meta.receiptInfo;

    if (receiptInfo && receiptInfo.length > 1) {
        // 多条回执，分别处理
        const messageList = receiptInfo.map(item => {
            const simpleMessage = _.cloneDeep(message);
            simpleMessage.m.meta.receiptInfo = [item];
            simpleMessage.m.uuid = 'receipt|' + message.m.uuid + '|' + item.ruuid;
            simpleMessage.__ruuid = item.ruuid;
            return simpleMessage;
        });

        for (let i = 0; i < messageList.length; i++) {
            try {
                await saveReceiptAllMessage(_.cloneDeep(messageList[i]));
            } catch (error) {
                // 原消息不存在，暂存等待
                insertTempWaitMessage(
                    messageList[i].m.uuid,
                    messageList[i].__ruuid,
                    _.cloneDeep(messageList[i]),
                    12
                );
            }
        }
    } else {
        // 单条回执
        try {
            await saveReceiptAllMessage(_.cloneDeep(message));
        } catch (error) {
            insertTempWaitMessage(
                message.m.uuid,
                receiptInfo[0].ruuid,
                _.cloneDeep(message),
                12
            );
        }
    }
    return;
```

## 性能优化策略

### 1. 批量发送回执

```javascript
// 视窗内的消息批量发送回执，而非单条发送
function sendMsgReceiptInfo(viewChatList, receiptsSwitch, actDialogId, SpaceId) {
    // 按会话分组后批量发送
    let dialogMap = {};
    viewChatList.forEach(item => {
        const dialogId = item?.plainMsg?.dialogId;
        if (!dialogMap[dialogId]) dialogMap[dialogId] = [];
        dialogMap[dialogId].push(item);
    });

    for (let dialogId in dialogMap) {
        sendMsgReceiptToMetion(dialogMap[dialogId], receiptsSwitch, dialogId, SpaceId);
    }
}
```

### 2. 防抖处理

```javascript
// receiptUtils.js

function debounce(fn, delay) {
    let timerId;
    return function(...args) {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => {
            fn(...args);
            timerId = null;
        }, delay);
    };
}

// 清除回执显示使用防抖
export const clearReceiptShow = new debounce(clearReceiptShowDeb, 500);
```

### 3. 回执缓存机制

当回执开关关闭时，回执会被缓存到本地数据库：

```javascript
// 缓存回执
function backReceiptMsgCache(viewChatList, SpaceId, sendData) {
    updateMessageReceiptList(SpaceId, viewChatList, 'receiptSend');
    setPeddingUnreadDatabase(sendData);  // 存入pending_unread表
}

// 批量清空缓存
async function clearPeddingUnreadList(dialogId) {
    let SpaceId = defaultSpaceId();
    let PeddingUnreadList = await getPeddingUnreadList(SpaceId, dialogId);

    let sendSaveDate = [];
    let sendId = [];

    PeddingUnreadList.forEach(item => {
        const saveDate = JSON.parse(item.payload);
        saveDate.m = decodeMessageTransform(saveDate.m);
        sendSaveDate.push(saveDate);
        sendId.push(item.id);
    });

    // 批量发送
    await store.state.uiControl.socketInstance?._sendMsg(sendSaveDate, 'HyperText');
    // 删除缓存
    await deletePeddingUnread(SpaceId, sendId);
}
```

### 4. 空闲时间处理

利用 `requestIdleCallback` 在浏览器空闲时处理缓存回执：

```javascript
// receiptUtils.js

let UnreadNumCount = 0;

export async function clearReceiptInfo(SpaceId) {
    // 清空过期缓存(7天)
    const newTime = getTimestamp() - 7 * 24 * 60 * 60 * 1000;
    const newTimeId = await getPeddingUnreadOutTime(SpaceId, newTime);
    if (newTimeId.length) await deletePeddingUnread(SpaceId, newTimeId);

    // 检查缓存数量
    const receiptsSwitch = store.state.setting.receiptsSwitch;
    if (!receiptsSwitch) return;

    const numCount = await getPeddingUnreadNumCount(SpaceId);
    if (!numCount) return;

    UnreadNumCount = numCount;
    if (UnreadNumCount > 0) {
        requestIdleCallback(myNonEssentialWork);
    }
}

async function myNonEssentialWork(deadline) {
    const receiptsSwitch = store.state.setting.receiptsSwitch;
    if (!receiptsSwitch) return;

    const connectState = store.state.uiControl.connectState;

    // 空闲时间或超时时处理
    if ((deadline.timeRemaining() > 0 || deadline.didTimeout) &&
        connectState === 'connect' &&
        UnreadNumCount > 0) {
        const isUnRead = await clearPeddingUnreadList();
        if (isUnRead) {
            UnreadNumCount -= 10;
        }
    }

    // 继续调度
    if (UnreadNumCount > 0 && connectState === 'connect') {
        requestIdleCallback(myNonEssentialWork, { timeout: 5000 });
    }
}
```

### 5. 数据库批量更新

```javascript
// 批量修改消息已读状态
function updateMessageReceiptList(spaceId, viewChatList, editType, actDialogId) {
    switch (editType) {
        case 'receiptRead':
            viewChatList.forEach(item => {
                const data = {
                    unreadReceipt: '2',
                    messageStatus: 3,
                    receiptShow: 'show'
                };
                updateMessageReceiptRead(data, item.uuid, spaceId);
                store.dispatch('messageCollection/haveSent', item.uuid);
            });
            break;

        case 'receiptGroup':
            viewChatList.forEach(item => {
                const { m, meta } = item;
                updateMessageReceiptRead({
                    unreadReceipt: '2',
                    messageStatus: 3,
                    m: JSON.stringify(m),
                    meta: JSON.stringify(meta)
                }, item.uuid, spaceId);
            });
            break;
        // ...
    }

    // 通知UI更新
    Bus.$emit('set-message-unread-receipt', viewChatList, editType);
}
```

## 回执开关控制

### 全局回执开关

```javascript
// store/modules/setting.js
state: {
    receiptsSwitch: true  // 默认开启
}

// 切换回执开关
actions: {
    setReceipt({ commit }, status) {
        commit('SET_RECEIPTS_SWITCH', status);
    }
}
```

### 开关影响

1. **开启时**: 实时发送已读回执
2. **关闭时**: 回执缓存到本地，开启后批量发送
3. **自己发送的消息**: 不显示已读状态

### 服务端同步

```javascript
// messageManger.js - handleNotification()

case 'ReadReceiptStatusChanged':
    store.dispatch('setting/setReceipt', Boolean(message.m.body.status));
    break;
```

## 销毁消息与回执

阅后即焚消息在发送回执后触发销毁：

```javascript
// receiptUtils.js - updateMessageReceiptList()

// Receipt destroy_message
if (!['receiptGroup'].includes(editType)) {
    if (['receiptsNoSwitch'].includes(editType)) {
        if (dataUtil.getPeerType(actDialogId) === 'user') {
            handleTempMessage(viewChatList, spaceId);
        }
    } else {
        handleTempMessage(viewChatList, spaceId);
    }
}
```
