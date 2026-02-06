# 消息系统架构

## 概述

Matrx Windows客户端的消息系统是整个IM即时通讯模块的核心，主要由 `messageManger.js` 作为中枢进行统一管理。该模块负责消息的接收、处理、存储、分发以及与服务器的通信协调。

## 核心文件结构

```
src/
├── api/
│   ├── messageManger.js      # 消息管理核心 (~171KB)
│   ├── messageApi.js         # 消息数据库操作API
│   ├── receiveMessage.js     # 消息接收队列管理
│   ├── sessionApi.js         # 会话管理API
│   └── socketUtil.js         # Socket连接工具
├── socket/
│   ├── handlePush.js         # 推送消息处理
│   └── messageTemplate.js    # 消息模板类
└── utils/
    └── chat/
        └── receiptUtils.js   # 已读回执工具
```

## messageManger.js 核心解析

### 模块职责

`messageManger.js` 是消息系统的中央处理器，主要职责包括：

1. **消息入口处理** - `onMessage()` 函数作为所有消息的统一入口
2. **消息类型路由** - `handleMessage()` 根据消息类型分发到不同处理器
3. **消息预处理** - `preprocess()` 对消息进行标准化处理
4. **会话同步** - 与会话状态、未读数等进行协调
5. **E2EE加密处理** - 端到端加密消息的解密流程

### 核心函数流程

```javascript
// 消息处理主入口
onMessage(data, uuid, tempUuid)
    ↓
// 空间消息验证
isIgnoreNotExistSpaceMsg(data)
    ↓
// 好友关系验证
Peer.isMyfriend(data)
    ↓
// 核心消息处理
handleMessage(srcData)
    ↓
// 根据消息类型分发
switch(cType) {
    case 'WPushRegRes':   // 推送注册响应
    case 'PullDetailRes': // 拉取详情响应
    case 'HyperText':     // 超文本消息
    case 'E2EKeyChange':  // E2EE密钥变更
    case 'Event':         // 事件消息
    case 'Notification':  // 通知消息
    case 'ForceClose':    // 强制关闭
}
```

### 消息类型映射

```javascript
const msgType = {
    HyperText: 'HyperText',
    Event: 'Event',
    'application/receipt': 'RECTIPT',
    'text/plain': 'TXT',
    'application/sticker': 'PICTURE',
    'image/jpeg': 'PICTURE',
    'image/webp': 'PICTURE',
    'image/jpg': 'PICTURE',
    'image/gif': 'PICTURE',
    'image/png': 'PICTURE',
    'image/bmp': 'PICTURE'
};
```

## 消息生命周期

### 时间戳体系

消息系统使用三个关键时间戳来追踪消息的完整生命周期：

| 字段 | 含义 | 说明 |
|------|------|------|
| `ctime` | 创建时间 (Create Time) | 消息在客户端创建的时间戳 |
| `stime` | 服务器时间 (Server Time) | 消息到达服务器的时间戳，用于排序 |
| `mtime` | 修改时间 (Modify Time) | 消息最后修改时间（编辑、撤回等） |

### 生命周期阶段

```
[创建阶段]
    客户端创建消息 → 设置 ctime → 生成 uuid
        ↓
[发送阶段]
    加入发送队列 → messageStatus: 2 (sending)
        ↓
[确认阶段]
    服务器确认 → 设置 stime → messageStatus: 3 (sent)
        ↓
[接收阶段]
    对端接收 → 可能触发已读回执
        ↓
[修改阶段] (可选)
    编辑/撤回 → 更新 mtime
```

## 消息状态机 (messageStatus)

### 状态定义

```javascript
// 消息状态枚举
const MessageStatus = {
    PENDING: 0,    // 待发送
    FAILED: 1,     // 发送失败
    SENDING: 2,    // 发送中
    SENT: 3,       // 已发送
    DELIVERED: 4,  // 已送达
    READ: 5        // 已读
};
```

### 状态转换图

```
         ┌─────────────────────────────┐
         │                             │
         ▼                             │
    [PENDING] ──────────► [SENDING] ───┼──► [SENT] ──► [DELIVERED] ──► [READ]
         │                     │       │
         │                     │       │
         └─────► [FAILED] ◄────┘       │
                    │                  │
                    └──── 重试 ────────┘
```

### 状态处理代码

```javascript
// socketUtil.js 中的状态处理
handleMsgStatus(payloadArray, status) {
    // status: 1-fail, 2-sending, 3-sent
    for (const payload of payloadArray) {
        const spaceId = getSpaceId(payload.mcTo);
        const uuid = payload.m.uuid;

        store.dispatch('messageCollection/setMessageStatus', {
            uuid,
            spaceId,
            status,
            t: payload.t
        });
    }
}
```

## 消息队列管理

### 接收队列 (receiveMessage.js)

消息接收使用队列机制确保消息按序处理：

```javascript
// 创建接收队列
function createQ() {
    if (!queueInstance) {
        queueInstance = createQueue({
            name: 'socketInstance',
            maxTask: 1,        // 单任务执行
            interval: null,
            hooks: false
        });

        // 队列空闲时检查临时消息
        queueInstance.hooks.lastTaskAfter(function(res) {
            checkTempMsgAndBatchSend(true);
        });
    }
}

// 添加消息任务
function addMessageTask(onMessage, ...args) {
    createQ();
    return queueInstance.addTask(onMessage, ...args);
}
```

### 推送处理队列 (handlePush.js)

```javascript
// 创建推送接收队列
function createReceiveQ() {
    if (!queueReceiveInstance) {
        queueReceiveInstance = createQueue({
            name: 'socketReceive',
            maxTask: 1,
            interval: null,
            hooks: false
        });
    }
}

// 普通优先级任务
function addReceiveMessageTask(func, ...args) {
    createReceiveQ();
    return queueReceiveInstance.addTask(func, ...args);
}

// 高优先级任务（插入队首）
function addReceiveMessageTopTask(func, ...args) {
    createReceiveQ();
    return queueReceiveInstance.addTopTask(func, ...args);
}
```

### 临时消息存储

```javascript
// 将消息暂存到临时数据库
async function insertSaveTempMsg(data) {
    await insertWith('temp_message', data);
}

// 批量保存临时消息
async function batchSaveTempMsg(tempMsgList) {
    await batchInsertWith('temp_message', tempMsgList);
    checkTempMsgAndBatchSend(true);
}

// 临时消息结构
function normalTempDBMsg(singleMsg, uuid, priority) {
    return {
        key: uuid,
        tempMessage: JSON.stringify(singleMsg),
        stime: singleMsg.m.stime || singleMsg.m.etime,
        p: priority || getMsgpriority(singleMsg),
        msgSeq: singleMsg?.m?.msgSeq,
        dialogId: dialogId,
        spaceId: getSpaceId(singleMsg.mcTo)
    };
}
```

## 消息去重机制

### UUID去重

```javascript
// 防止消息重复处理的Map
let preventBlockMap = {};

async function preventBlockMsg(data) {
    const uuid = data?.m?.uuid || '';

    // 同一消息处理超过3次则丢弃
    if (uuid && preventBlockMap[uuid] >= 3) {
        await checkAndDeleteTempMsg(uuid, 'preventBlockMsg');
        return true;
    }

    // 计数器累加
    preventBlockMap[uuid] = (preventBlockMap[uuid] || 0) + 1;
    return false;
}
```

### ACK确认去重

```javascript
// handlePush.js 中的ACK集合管理
import { addAckSet, ackSetHas, delAckSet } from '@/staticData/ackSet';

// 检查消息是否已处理
if (uuid && !ackSetHas(uuid)) {
    addAckSet(uuid);
    addMessageTask(onMessage, tempMessage, uuid);
}

// 消息处理完成后删除
async function checkAndDeletePushTempMsg(uuid, id) {
    if (uuid) {
        await runWith('DELETE FROM temp_message WHERE key = :key', { key: uuid });
        delAckSet(uuid);
        checkTempMsgAndBatchSend();
    }
}
```

### 历史消息去重

```javascript
// 历史消息处理时的去重
window.historyMessage = {};
window.historyMessageIs = {};

// 历史消息去重逻辑
if (F.isHistoryFromTop(srcData)) {
    const id = historyIdFromTop(srcData);
    const uuid = srcData?.m?.uuid || '';

    // 检查是否已处理
    if (!window.historyMessageIs[id][uuid]) {
        window.historyMessageIs[id][uuid] = true;
        window.historyMessage[id].push(srcData);
    }
}
```

## 消息数据流图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         服务器推送                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Socket.io 'WPushRes' 事件                                           │
│  socketUtil.js → handleReceivePush()                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  消息解密 DecryptedPushMsg()                                         │
│  handlePush.js                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  临时存储 batchSaveTempMsg()                                         │
│  temp_message 表                                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  队列处理 addMessageTask()                                           │
│  receiveMessage.js                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  核心处理 onMessage() → handleMessage()                              │
│  messageManger.js                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ HyperText │   │   Event   │   │Notification│
            └───────────┘   └───────────┘   └───────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  数据持久化                                                          │
│  message 表 / session 表 / peer 表                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  UI 更新                                                             │
│  Vuex Store → Vue Components                                        │
└─────────────────────────────────────────────────────────────────────┘
```

## E2EE消息处理

### 加密消息识别

```javascript
// 判断是否为E2EE消息
if (push_msg.m?.isE2EE) {
    // 群消息忽略E2EE
    if (dataUtil.getPeerType(push_msg.f) === 'group') {
        push_msg.isIgnoreE2EEMsg = true;
        return;
    }

    // 进行E2EE解密处理
    await e2eProcess(push_msg);
}
```

### 解密流程

```javascript
async function e2eProcess(push_msg) {
    const meFrom = push_msg.meFrom.split('#');

    if (meFrom.length === 2) {
        // 解密 body
        if (push_msg.m.body) {
            const body_buffer = Buffer.from(push_msg.m.body, 'base64');
            const body_result = await sendSdk('E2EE-Help-Method', 5, body_buffer, meFrom[0], push_msg.m.deviceId);

            if (body_result.code === 0) {
                push_msg.m.body = bufferTostring(body_result.decrypted);
            } else {
                push_msg.isStar = true; // 标记解密失败
            }
        }

        // 解密 meta
        if (push_msg.m.meta && typeof push_msg.m.meta === 'string') {
            const meta_buffer = Buffer.from(push_msg.m.meta, 'base64');
            const meta_result = await sendSdk('E2EE-Help-Method', 5, meta_buffer, meFrom[0], push_msg.m.deviceId);

            if (meta_result.code === 0) {
                push_msg.m.meta = JSON.parse(bufferTostring(meta_result.decrypted));
            }
        }
    }
}
```

## 错误处理与恢复

### 协议错误处理

```javascript
async function errorHandle(error) {
    // 30007: 需要重新登录
    if (error.m.reason.indexOf('30007') >= 0) {
        disconnectedHandle('errorHandle 30007');
        forceCloseHandle('', '30007');
    }

    // 40004: 需要重新获取空间信息
    if (error.m.reason.indexOf('40004') >= 0) {
        disconnectedHandle('errorHandle 40004');
        getSpaceInfoList('', true, true);
    }

    // user_not_registered: 重新注册推送
    if (error.m.reason.indexOf('user_not_registered') >= 0) {
        await sendWPushMsg();
    }
}
```

### 消息发送失败处理

```javascript
// 发送超时后的状态更新
onTimeout: () => {
    this.handleMsgStatus(payloadArray, 1); // 标记为失败
    reject(`send timeout:${timeout}`);
}
```

## 性能优化建议

1. **消息批处理** - 使用 `batchSaveTempMsg` 批量保存消息减少数据库IO
2. **队列限流** - 通过 `getLimite()` 控制单次处理消息数量
3. **优先级队列** - 系统通知消息使用 `addReceiveMessageTopTask` 优先处理
4. **懒加载历史** - 历史消息按需加载，避免一次性加载过多
5. **内存管理** - 及时清理 `preventBlockMap` 防止内存泄漏
