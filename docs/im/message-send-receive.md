# 消息收发流程

## 概述

Matrx IM的消息收发采用Socket.io长连接进行实时通信，结合本地数据库存储实现离线消息支持。本文档详细介绍消息的发送和接收完整流程。

## 发送流程详解

### 发送流程图

```
┌──────────────────────────────────────────────────────────────────┐
│                       用户发送消息                                 │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. 使用 MsgTemplate 构建消息模板                                  │
│     messageTemplate.js                                           │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. 生成唯一UUID                                                  │
│     uuid: uuidv1()                                               │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. 本地预存消息 (乐观更新)                                        │
│     messageCollection/saveMessage                                │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. E2EE加密处理 (如需)                                           │
│     sendSdk('E2EE-Help-Method', ...)                             │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. Socket发送                                                   │
│     socketUtil._sendMsg(payloadArray, cmd)                       │
└──────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│  ACK成功                 │      │  发送超时/失败           │
│  messageStatus: 3       │      │  messageStatus: 1       │
└─────────────────────────┘      └─────────────────────────┘
```

### 消息模板构建

```javascript
// messageTemplate.js - MsgTemplate类

class MsgTemplate {
    constructor(aParm = 5, spaceId = defaultSpaceId()) {
        let template = {
            c: 'HyperText',
            f: store.state.userInfo.hid,
            t: '',
            mcFrom: aParm == 13
                ? `${personalSpaceId()}#${hidToNumber(store.state.userInfo.hid)}`
                : `${spaceId}#${hidToNumber(store.state.userInfo.hid)}`,
            mcTo: '',
            a: aParm,
            needAck: true
        };
        this.HyperTextTemplate = template;
    }
}
```

### Socket发送实现

```javascript
// socketUtil.js

_sendMsg(payloadArray, cmd, timeout = msgTimeOut) {
    return new Promise(async (resolve, reject) => {
        // 深拷贝避免污染原数据
        payloadArray = _.cloneDeep(payloadArray);

        // 连接状态检查
        if (appdataStorage.getItem('c_socket_state') != 'WPushRes' && cmd !== 'WPushReg') {
            this.handleMsgStatus(payloadArray, 1); // 标记失败
            reject('WPushRes Disconnected send error');
            return;
        }

        // 设置为发送中状态
        this.handleMsgStatus(payloadArray, 2);

        // 加密消息
        let extraHeader = {...this.commonHead, cmd};
        let content = {extraHeader, payload: payloadArray};
        const cipher = await sendSdk('IKEY-SDK-Encrypted-Push-Msg', JSON.stringify(content));

        // 发送并等待ACK
        this.ioInstance.emit(
            'WPush',
            cipher,
            this.withTimeout(
                async data => {
                    // 发送成功回调
                    for (const payload of payloadArray) {
                        const spaceId = getSpaceId(payload.mcTo);
                        if (payload?.m?.uuid) {
                            await store.dispatch('messageCollection/haveSent', {
                                uuid: payload.m.uuid,
                                spaceId
                            });
                        }
                    }
                    resolve(data);
                },
                () => {
                    // 超时回调
                    this.handleMsgStatus(payloadArray, 1);
                    reject(`send timeout:${timeout}`);
                },
                timeout
            )
        );
    });
}
```

### 超时处理机制

```javascript
// socketUtil.js

withTimeout(onSuccess, onTimeout, timeout = msgTimeOut) {
    let called = false;

    const timer = setTimeout(() => {
        if (called) return;
        called = true;
        onTimeout();
    }, timeout);

    return (...args) => {
        if (called) return;
        called = true;
        clearTimeout(timer);
        onSuccess.apply(this, args);
    };
}
```

## 接收流程详解

### 接收流程图

```
┌──────────────────────────────────────────────────────────────────┐
│                    服务器推送 WPushRes                             │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. Socket接收事件                                                │
│     this.ioInstance.on('WPushRes', callback)                     │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. 加入接收队列                                                  │
│     addReceiveMessageTask/addReceiveMessageTopTask               │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. 解密消息                                                      │
│     DecryptedPushMsg(data)                                       │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. 临时存储 (防丢失)                                              │
│     batchSaveTempMsg(tempMsgList)                                │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. 队列消费处理                                                  │
│     addMessageTask(onMessage, message, uuid)                     │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. 消息分发处理                                                  │
│     onMessage() → handleMessage()                                │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  7. 持久化存储                                                    │
│     setMessageWithDatabase()                                     │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  8. 删除临时消息                                                  │
│     checkAndDeletePushTempMsg(uuid)                              │
└──────────────────────────────────────────────────────────────────┘
```

### handlePush.js 核心逻辑

#### Socket事件监听

```javascript
// socketUtil.js

this.ioInstance.on('WPushRes', async (data, ackCallFn) => {
    let ackCallback;
    let taskKey = 'WPushRes|' + uuidv4();

    // 构建ACK回调
    if (ackCallFn) {
        ackCallback = uuidList => {
            ackCallFn('200');
        };
    }

    // 根据连接状态决定任务优先级
    if (appdataStorage.getItem('c_socket_state') != 'WPushRes') {
        // 未完成注册，高优先级
        addReceiveMessageTopTask(handleReceivePush, data, ackCallback, taskKey);
    } else {
        // 正常优先级
        addReceiveMessageTask(handleReceivePush, data, ackCallback, taskKey);
    }
});
```

#### 消息解密与分发

```javascript
// handlePush.js

export async function handleReceivePush(data, callback, taskKey) {
    const startTime = performance.now();

    // 解密消息
    let push_msgArray = await DecryptedPushMsg(data);

    let batchMsgList = [];

    for (let index = 0; index < push_msgArray.length; index++) {
        const wrapMessage = removeGIdOfUUID(push_msgArray[index]);

        if (!wrapMessage.uuid || store.state.userInfo.loginStatus !== 'LOGINFINISH') {
            // 无UUID或未登录完成，直接处理
            onMessage(wrapMessage.message, wrapMessage.uuid);
        } else {
            // 构建临时存储消息
            const tempMsg = normalTempDBMsg(wrapMessage.message, wrapMessage.uuid, 1);
            batchMsgList.push(tempMsg);
        }
    }

    // 批量处理
    if (callback) {
        let uuidList = push_msgArray.map(v => v?.m?.uuid)?.join();
        await BatchProcessor.process(batchMsgList, () => callback(uuidList));
    } else {
        await BatchProcessor.process(batchMsgList);
    }
}
```

#### 消息解密

```javascript
// handlePush.js

export async function DecryptedPushMsg(data) {
    let push_msg = await sendSdk('IKEY-SDK-Decrypted-Push-Msg', data);

    // 处理大数字精度问题
    if (push_msg && push_msg.match(/\"trigger\":(\d+)/g)) {
        push_msg = push_msg.replace(/\"trigger\":(\d+)/g, (a, b) => `"trigger":"${b}"`);
    }
    if (push_msg && push_msg.match(/\"groupId\":(\d+)/g)) {
        push_msg = push_msg.replace(/\"groupId\":(\d+)/g, (a, b) => `"groupId":"${b}"`);
    }

    return safeParse(push_msg);
}
```

## receiveMessage.js 核心逻辑

### 队列管理

```javascript
// receiveMessage.js

let queueInstance = null;

export function createQ() {
    if (!queueInstance) {
        queueInstance = createQueue({
            name: 'socketInstance',
            maxTask: 1,           // 单任务串行执行
            interval: null,
            hooks: false
        });

        // 队列空闲钩子
        queueInstance.hooks.lastTaskAfter(function(res) {
            checkTempMsgAndBatchSend(true);
        });
    }
}

export function addMessageTask(onMessage, ...args) {
    createQ();
    return queueInstance.addTask(onMessage, ...args).catch(err => {
        console.error('addMessageTask catch:', err);
    });
}
```

### 临时消息检查与批量发送

```javascript
// handlePush.js

export async function checkTempMsgAndBatchSend(last) {
    if (store.state.userInfo.loginStatus !== 'LOGINFINISH') {
        return;
    }

    // 限流控制，5秒间隔
    if (last || getTimestamp() - checkTempMsgTime >= 5000) {
        if (checkTempMsgInprocess) return;

        checkTempMsgTime = getTimestamp();
        checkTempMsgInprocess = true;

        try {
            // 优先处理高优先级消息
            let priorityList = await allWith(
                `SELECT * FROM temp_message WHERE p = 1 ORDER BY id ASC LIMIT :limitCount`,
                { limitCount: getLimite() }
            );

            let tempMsgList = [...priorityList];

            // 补充普通消息
            let otherMsgCount = getLimite() - priorityList.length;
            if (otherMsgCount > 0) {
                let otherMsgList = await allWith(
                    `SELECT * FROM temp_message WHERE p is null or p != 1 ORDER BY stime ASC LIMIT :limitCount`,
                    { limitCount: otherMsgCount }
                );
                tempMsgList.push(...otherMsgList);
            }

            // 逐个处理
            for (let tempMsg of tempMsgList) {
                let uuid = tempMsg.key;
                if (uuid && !ackSetHas(uuid)) {
                    addAckSet(uuid);
                    const tempMessage = safeParse(tempMsg.tempMessage);
                    addMessageTask(onMessage, tempMessage, uuid);
                }
            }
        } catch (e) {
            console.error('[checkTempMsgAndBatchSend catch error]', e);
        }
    }
    checkTempMsgInprocess = false;
}
```

## messageTemplate.js 消息模板

### MsgTemplate 类结构

```javascript
// messageTemplate.js

export class MsgTemplate {
    constructor(aParm = 5, spaceId = defaultSpaceId()) {
        let template = {
            c: 'HyperText',
            f: store.state.userInfo.hid,
            t: '',
            mcFrom: aParm == 13
                ? `${personalSpaceId()}#${hidToNumber(store.state.userInfo.hid)}`
                : `${spaceId}#${hidToNumber(store.state.userInfo.hid)}`,
            mcTo: '',
            a: aParm,
            needAck: true
        };
        this.msgWrap = {};
        this.HyperTextTemplate = template;
    }
}
```

### 常用模板方法

| 方法 | 用途 |
|------|------|
| `getMsgTemplate()` | 普通文本消息 |
| `getFileTemplate()` | 文件消息 |
| `getReceipTemplate()` | 已读回执消息 |
| `getEmojiReplyTemplate()` | 表情回复消息 |
| `getMsgReadReceiptTemplate()` | 消息已读回执 |
| `getInviteTemplate()` | 会议邀请 |
| `getCallTemplate()` | 通话记录 |
| `getNameCardTemplate()` | 名片消息 |
| `renderWithDrawMsg()` | 撤回消息 |
| `getDestroyMsgTemplate()` | 销毁消息 |

## 发送失败重试机制

### 重试策略

```javascript
// 消息发送失败后的重试逻辑

// 1. 标记消息状态为失败
handleMsgStatus(payloadArray, 1);

// 2. 触发UI重试按钮
store.dispatch('messageCollection/setMessageStatus', {
    uuid,
    spaceId,
    status: 1,  // FAILED
    t: payload.t
});

// 3. 用户点击重试时
async function resendMessage(message) {
    // 重新构建消息
    const newPayload = rebuildPayload(message);

    // 更新状态为发送中
    store.dispatch('messageCollection/setMessageStatus', {
        uuid: message.uuid,
        spaceId: message.spaceId,
        status: 2  // SENDING
    });

    // 重新发送
    try {
        await socketInstance._sendMsg([newPayload], 'HyperText');
    } catch (error) {
        // 再次失败
        handleMsgStatus([newPayload], 1);
    }
}
```

### 网络恢复重试

```javascript
// 监听网络恢复事件
window.MatrxGlobalEvent.on('ws:connect', async () => {
    // 重新注册推送
    await sendWPushMsg();

    // 检查待发送消息
    Bus.$emit('online-resend-message');
});
```

## 消息确认 (ackDB)

### ACK集合管理

```javascript
// staticData/ackSet.js

const ackSet = new Set();

export function addAckSet(uuid) {
    ackSet.add(uuid);
}

export function ackSetHas(uuid) {
    return ackSet.has(uuid);
}

export function delAckSet(uuid) {
    ackSet.delete(uuid);
}

export function getLimite() {
    // 根据当前处理能力动态调整
    return 50;
}
```

### ACK数据库操作

```javascript
// utils/ackDBUtil.js

// 批量插入临时消息
export async function batchInsertWith(tableName, dataList) {
    // 插入到临时消息表
}

// 删除已处理消息
export async function runWith(sql, params) {
    // 执行SQL删除
}

// 查询临时消息
export async function allWith(sql, params) {
    // 查询未处理消息
}
```

### 消息确认流程

```javascript
// handlePush.js

export async function checkAndDeletePushTempMsg(uuid, id) {
    if (store.state.userInfo.loginStatus !== 'LOGINFINISH') {
        return false;
    }

    if (uuid) {
        try {
            // 从临时表删除
            await runWith('DELETE FROM temp_message WHERE key = :key', {
                key: uuid
            });

            // 从ACK集合删除
            delAckSet(uuid);

            // 继续处理队列
            checkTempMsgAndBatchSend();
        } catch (error) {
            console.error('[checkAndDeletePushTempMsg]', uuid, error);
        }
    }
}
```

## 消息处理优先级

### 优先级分类

```javascript
// handlePush.js

export function getMsgpriority(msg) {
    // 企业加入/踢出通知为最高优先级
    if (msg?.c == 'Notification' &&
        msg?.m &&
        ['Contact_Enterprise_Add', 'Contact_Enterprise_Kick'].includes(msg.m.type)) {
        return 1;  // 高优先级
    }
    return 0;  // 普通优先级
}
```

### 优先级处理逻辑

```javascript
// 高优先级消息使用 addReceiveMessageTopTask
// 插入队列头部优先处理

// 普通消息使用 addReceiveMessageTask
// 按顺序加入队列尾部
```

## WPushReg 注册流程

### 推送注册消息

```javascript
// messageManger.js

async function sendWPushMsg() {
    let from = store.state.userInfo.hid;

    const sendReg = {
        payloadArray: [{
            f: from,
            mcFrom: `${defaultSpaceId()}#${dataUtil.hidToNumber(from)}`,
            m: {
                info: {
                    os: 'windows',
                    osver: osVersion,
                    clientver: store.state.userInfo.clientver,
                    pkg: store.state.userInfo.pkg,
                    reason: ''
                }
            }
        }],
        cmd: 'WPushReg'
    };

    await trySendWPushReg(sendReg);
}
```

### 注册响应处理

```javascript
// messageManger.js - handleMessage()

case 'WPushRegRes':
    if (messageItem?.m?.reason === '40004') {
        // 注册失败
        await errorHandle(messageItem);
    } else {
        // 注册成功，标记连接状态
        appdataStorage.setItem('c_socket_state', 'WPushRes');

        // 清除注册超时定时器
        clearTimeout(pushRegTimer);

        // 拉取离线消息
        doWpushRegRes();
    }
    break;
```

## 调试与监控

### 消息日志

```javascript
// messageManger.js

export function logMessage(origin, log = true) {
    let tempMsg = _.cloneDeep(origin);

    // 脱敏处理
    tempMsg.binaryPart && (tempMsg.binaryPart = '***');
    tempMsg.m?.body && (tempMsg.m.body = '***');
    tempMsg.m?.meta?.meetingPassword && (tempMsg.m.meta.meetingPassword = '***');

    if (log) {
        messageLog.info('reciving messages::', [
            tempMsg.m?.uuid,
            JSON.stringify(tempMsg)
        ].join('->'));
    }

    return tempMsg;
}
```

### 性能监控

```javascript
// handlePush.js

export async function handleReceivePush(data, callback, taskKey) {
    const startTime = performance.now();

    // ... 处理逻辑 ...

    msgTaskLog.log('received->', taskKey, performance.now() - startTime);
}
```
