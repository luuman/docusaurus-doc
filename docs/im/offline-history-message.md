# 离线与历史消息

## 概述

Matrx IM支持完整的离线消息和历史消息功能，确保用户在断线重连后能够接收到离线期间的所有消息，同时支持按需加载历史消息。相关API位于 `offlineMsgApi.js` 和 `historyMsgApi.js`。

## offlineMsgApi.js 离线消息拉取

### 文件位置

```
src/api/offlineMsgApi.js
```

### 核心API

| API | 说明 |
|-----|------|
| `getOfflineMsgs()` | 获取离线消息 |
| `getPersonalOfflineMsgs()` | 获取个人空间离线消息 |
| `getRegionMsgs()` | 获取区域消息 |
| `getMessageWithoutSeq()` | 获取无序列号消息 |
| `confirmDigest()` | 确认消息摘要 |
| `confirmRead()` | 确认消息已读 |
| `confirmReceiveOffline()` | 确认接收离线消息 |
| `getCombineMsgs()` | 获取合并消息 |
| `getConMaxSeq()` | 获取会话最大序列号 |

### getOfflineMsgs - 获取离线消息

```javascript
// offlineMsgApi.js

export async function getOfflineMsgs(data) {
    return promiseRetry(commonUCRequest, {
        times: 5,                    // 重试次数
        delay: 1000,                 // 重试延迟
        increment: 0,                // 延迟增量
        data: {
            baseURL: getImSdkGwURL(),
            url: `/sdk-ofms/rest/OfflineMsg/getOfflineMsgsV3`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            transformRequest: req => req,
            data: JSON.stringify({ ...commonParams(), ...data })
        },
        shouldRetry: (err, opts) => navigator.onLine  // 有网络时重试
    });
}
```

### getConMaxSeq - 获取会话最大序列号

```javascript
// offlineMsgApi.js

export async function getConMaxSeq(data) {
    return promiseRetry(commonUCRequest, {
        times: 5,
        delay: 1000,
        increment: 0,
        data: {
            baseURL: getImSdkGwURL(),
            url: `/imsdk-msgmgr/history/rest/getConMaxSeq`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ ...commonParams(), ...data })
        },
        shouldRetry: (err, opts) => navigator.onLine
    });
}
```

## historyMsgApi.js 历史消息加载

### 文件位置

```
src/api/historyMsgApi.js
```

### historyQuery - 历史消息查询

```javascript
// historyMsgApi.js

export async function historyQuery(data) {
    return commonUCRequest({
        baseURL: getImSdkGwURL(),
        url: `/imsdk-msgmgr/history/query`,
        customLog: true,
        method: 'POST',
        headers: {
            deviceId: store.state.storage.deviceId,
            'Content-Type': 'application/json'
        },
        transformRequest: req => req,
        data: JSON.stringify({ ...commonParams(), ...data })
    });
}
```

## 离线消息拉取流程

### 1. WPushReg完成后触发

```javascript
// messageManger.js

case 'WPushRegRes':
    if (messageItem?.m?.reason === '40004') {
        await errorHandle(messageItem);
    } else {
        // 标记连接状态
        appdataStorage.setItem('c_socket_state', 'WPushRes');

        // 触发离线消息拉取
        if (appdataStorage.getItem('imSdkOpen')) {
            fetchOfflineMessageTask(fetchOfflineMsgs);
            fetchOfflineMessageTask(fetchOfflineWithoutMsgs);
        }

        doWpushRegRes();
    }
    break;
```

### 2. 离线消息任务队列

```javascript
// utils/message/offlineMessageTask.js

export function fetchOfflineMessageTask(fetchFunc) {
    // 将离线消息拉取任务加入队列
    // 确保按序执行，避免重复拉取
}
```

### 3. 分批拉取离线消息

```javascript
// utils/message/offlineMsg.js

export async function fetchOfflineMsgs(spaceId) {
    // 获取离线消息
    const response = await getOfflineMsgs({
        enterpriseId: spaceId,
        count: 100,  // 每批数量
        // ...
    });

    // 处理返回的消息
    if (response?.messages?.length) {
        for (const msg of response.messages) {
            await processOfflineMessage(msg);
        }
    }

    // 确认接收
    await confirmReceiveOffline({
        enterpriseId: spaceId,
        // ...
    });
}
```

### 4. 离线消息加载状态

```javascript
// messageManger.js

function offlineMsgLoading() {
    store.commit('uiControl/setOfflineMsgLoading', true);
}

// 离线消息加载完成通知
case 'Offline_Msg_End':
    store.commit('uiControl/setOfflineMsgLoading', false);
    break;
```

## 历史消息加载流程

### 1. 初始化时拉取历史

```javascript
// messageManger.js

async function doPulldetail() {
    // 检查是否已初始化
    let installed = await hasInstalled();
    if (installed) return;

    if (appdataStorage.getItem('imSdkOpen')) {
        const spaceId = defaultSpaceId();

        window.MatrxGlobalEvent[spaceId] = {
            sessionInstallPedding: true
        };

        fetchHistoryMsgs(spaceId)
            .then(() => {
                sessionInstalled(spaceId);
                window.MatrxGlobalEvent[defaultSpaceId()] = {
                    hasInstalled: true,
                    sessionInstallPedding: false
                };
            })
            .catch(error => {
                window.MatrxGlobalEvent[spaceId] = {
                    sessionInstallPedding: false
                };
            });
    } else {
        // 旧版本使用PullDetail命令
        window.MatrxGlobalEvent[defaultSpaceId()] = {
            hasInstalled: true
        };
        await sessionInstalled();
        await trySendPullDetail(hid);
    }
}
```

### 2. PullDetail命令

```javascript
// messageManger.js

export async function trySendPullDetail(hid, pullCount = 2) {
    const pullData = {
        cmd: 'PullDetail',
        payloadArray: [{
            f: hid,
            mcFrom: `${defaultSpaceId()}#${hidToNumber(hid)}`,
            m: {
                tid: '',
                reqId: 'pullDetail-iam',
                ignoreReciept: getTimestamp() > appdataStorage.getItem('RECEIPT_START_TIME') ? 1 : 0,
                count: pullCount,  // 每会话拉取消息数
                sTS: getTimestamp()
            }
        }]
    };

    await store.state.uiControl.socketInstance._sendMsg(pullData.payloadArray, pullData.cmd);
}
```

### 3. 按会话加载更多历史

```javascript
// 用户滚动到顶部时触发
async function loadMoreHistory(dialogId, spaceId, beforeTime) {
    const response = await historyQuery({
        enterpriseId: spaceId,
        tid: dialogId,
        stime: beforeTime,
        count: 20,
        direction: 'before'  // 向前加载
    });

    if (response?.messages?.length) {
        await appendHistoryMessage(response.messages);
    }
}
```

## 消息合并与去重

### 历史消息存储

```javascript
// messageManger.js

window.historyMessage = {};
window.historyMessageIs = {};

async function appendHistoryMessage(messages) {
    for (const message of messages) {
        // 安全忽略检查
        if (message?.m?.MIMETYPE && message.m.si == 1) {
            continue;
        }

        // 预处理
        await preprocess(message);
        logMessage(message);

        // 编码转换
        let newmsg = encodeMessageTransform(message);

        // 全文检索索引
        FtsService.nomarlFtsMsg(message);

        // 存入数据库
        await setMessageWithDatabase([newmsg]);

        // 会议卡片特殊处理
        if (message.m.MIMETYPE === 'meeting/card') {
            saveMeetingCardMessage(message, true);
        }
    }
}
```

### 历史消息去重

```javascript
// messageManger.js - handleMessage()

if (F.isHistoryFromTop(srcData)) {
    let id = historyIdFromTop(srcData);

    // 追加回执信息
    if (srcData.c === 'HyperText') appendReceipt(srcData);

    // 存储消息
    await appendHistoryMessage([srcData]);

    if (id && window.historyMessage[id]) {
        let uuid = srcData?.m?.uuid || '';

        // 去重检查
        let historyMessageIsId = window.historyMessageIs[id];
        if (!historyMessageIsId[uuid]) {
            window.historyMessageIs[id][uuid] = true;
            window.historyMessage[id].push(srcData);

            // 检查是否加载完成
            if (window.historyMessage[id].length == reqCountFromHistory(srcData)) {
                if (window.historyMessage['function' + id]) {
                    window.historyMessage['function' + id](
                        Object.keys(window.historyMessageIs[id])
                    );

                    // 清理
                    delete window.historyMessage[id];
                    delete window.historyMessageIs[id];
                    window.historyMessage['function' + id] = null;
                }
            }
        }

        // 删除临时消息
        if (uuid) {
            await checkAndDeleteTempMsg(uuid, 3);
        }

        return;  // 历史消息不继续处理
    }
}
```

### 基于UUID去重

```javascript
// messageApi.js

export async function setMessageWithDatabase(messageList) {
    let hostId = await getHid();
    let ps = messageList.map(message => {
        message.hostId = hostId;
        let spaceId = getSpaceId(message.mcTo);
        // insertWith 使用 INSERT OR REPLACE
        // 相同UUID的消息会被更新而非重复插入
        return insertWith('message', message, spaceId);
    });
    return Promise.all(ps);
}
```

### 基于msgSeq排序去重

```javascript
// utils/message/msgSeqUtils.js

export function sortByMsgSeq(messages) {
    return messages.sort((a, b) => {
        const seqA = a?.m?.msgSeq || 0;
        const seqB = b?.m?.msgSeq || 0;
        return seqA - seqB;
    });
}
```

## 增量同步机制

### 1. 序列号追踪

每条消息携带 `msgSeq` 字段，用于增量同步：

```javascript
{
    m: {
        uuid: 'msg_uuid',
        msgSeq: 12345,  // 消息序列号
        // ...
    }
}
```

### 2. 获取会话最大序列号

```javascript
// offlineMsgApi.js

export async function getConMaxSeq(data) {
    // 获取各会话的最大序列号
    // 用于判断是否有新消息
}
```

### 3. 增量拉取

```javascript
// utils/message/offlineMsg.js

export async function fetchConMaxSeq(spaceId) {
    // 获取服务端各会话最大序列号
    const serverSeqs = await getConMaxSeq({ enterpriseId: spaceId });

    // 与本地序列号对比
    for (const [dialogId, serverSeq] of Object.entries(serverSeqs)) {
        const localSeq = await getLocalMaxSeq(dialogId, spaceId);

        if (serverSeq > localSeq) {
            // 有新消息，拉取增量
            await fetchDeltaMessages(dialogId, spaceId, localSeq, serverSeq);
        }
    }
}
```

### 4. 无序列号消息处理

某些特殊消息没有序列号，需要单独拉取：

```javascript
// offlineMsgApi.js

export async function getMessageWithoutSeq(data) {
    return promiseRetry(commonUCRequest, {
        data: {
            url: `/sdk-ofms/rest/OfflineMsg/getMessageWithoutSeq`,
            // ...
        }
    });
}
```

## 跨机房消息同步

### IDC离线通知

```javascript
// messageManger.js - handleNotification()

case 'Idc_Offline_Notification':
    const spaceId = paths(message, 'm', 'body', 'enterpriseId');

    if (spaceId) {
        // 显示通知
        messageNotification(message, session, spaceId);

        // 更新跨机房未读计数
        let IdcOfflineUnreadCount = store.state.spaceCollection.spaceData[spaceId]?.IdcOfflineUnreadCount;
        store.dispatch('spaceCollection/setSpaceData', {
            spaceId,
            data: {
                IdcOfflineUnreadCount: IdcOfflineUnreadCount ? IdcOfflineUnreadCount + 1 : 1
            }
        });
    }
    break;
```

### 切换机房后同步

```javascript
// messageManger.js - handleNotification()

case 'Idc_Change':
    getSpaceInfoList('', true);
    store.commit('userInfo/SET_IDC_COUNT');
    break;
```

## 消息存储优化

### 1. 批量插入

```javascript
// 使用事务批量插入消息
async function batchInsertMessages(messages, spaceId) {
    const hostId = await getHid();

    await runWith('BEGIN TRANSACTION', {}, spaceId);

    try {
        for (const msg of messages) {
            msg.hostId = hostId;
            await insertWith('message', msg, spaceId);
        }
        await runWith('COMMIT', {}, spaceId);
    } catch (error) {
        await runWith('ROLLBACK', {}, spaceId);
        throw error;
    }
}
```

### 2. 清除过期历史

```javascript
// messageApi.js

export async function deleteMessageForContact(actDialogId, stime, spaceId, isDelEvent = false) {
    let hostId = await getHid();

    // 删除缓存文件
    await deleteChatCacheFiles(actDialogId, spaceId, stime || getTimestamp());

    // 删除消息记录
    await runWith(
        `DELETE FROM message WHERE dialogId = :actDialogId AND hostId = :hostId AND stime <= :stime`,
        { actDialogId, hostId, stime: stime || getTimestamp() },
        spaceId
    );

    // 清除@提醒
    await updateWith(
        spaceId,
        'session',
        { remindlist: JSON.stringify([]) },
        actDialogId,
        'hid',
        hostId
    );

    // 刷新UI
    store.dispatch('uiControl/refreshMetioned');
}
```

### 3. 区域消息拉取

支持按时间范围拉取消息：

```javascript
// offlineMsgApi.js

export async function getRegionMsgs(data) {
    return commonUCRequest({
        url: `/sdk-msrs/rest/Msrs/getRegionMsgs`,
        method: 'POST',
        data: JSON.stringify({
            ...commonParams(),
            ...data,
            // data包含:
            // tid: 会话ID
            // startTime: 开始时间
            // endTime: 结束时间
            // count: 数量限制
        })
    });
}
```

## 历史消息搜索

### 全文检索集成

```javascript
// messageManger.js - appendHistoryMessage()

// 存储消息时同步更新全文索引
FtsService.nomarlFtsMsg(message);
```

### 搜索历史消息

```javascript
// 支持按关键词、时间范围、消息类型搜索
async function searchHistoryMessages({
    keyword,
    dialogId,
    spaceId,
    startTime,
    endTime,
    messageTypes
}) {
    // 使用FTS进行全文搜索
    const results = await FtsService.search({
        keyword,
        spaceId,
        // ...
    });

    return results;
}
```

## 已安装标识管理

### 检查是否已初始化

```javascript
// sessionApi.js

export async function hasInstalled(spaceId = defaultSpaceId()) {
    let hostId = await getHid();
    let a = await getWith(
        'SELECT pairValue FROM keypairs WHERE hostId = :hostId AND pairName = :pairName',
        { hostId, pairName: 'installed' },
        spaceId
    );
    return (a || {}).pairValue == 'true';
}
```

### 标记已初始化

```javascript
// sessionApi.js

export async function installed(spaceId = defaultSpaceId()) {
    let pairName = 'installed';
    let pairValue = 'true';
    let hostId = await getHid();

    let a = await getWith(
        'SELECT pairValue FROM keypairs WHERE hostId = :hostId AND pairName = :pairName',
        { hostId, pairName },
        spaceId
    );

    if (a == null) {
        await insertWith('keypairs', { pairValue, pairName, hostId }, spaceId);
    } else {
        await updateWith(spaceId, 'keypairs', { pairValue }, pairName, 'pairName', hostId);
    }
}
```

## 断网恢复处理

### 网络恢复后的同步

```javascript
// messageManger.js

window.MatrxGlobalEvent.on('ws:connect', async () => {
    // 重新注册推送
    await sendWPushMsg();

    // 拉取离线消息
    if (store.state.userInfo.loginStatus === 'LOGINFINISH') {
        if (appdataStorage.getItem('imSdkOpen')) {
            fetchOfflineMessageTask(fetchOfflineMsgs);
        }
    }
});
```

### 临时消息恢复

```javascript
// handlePush.js

export async function checkTempMsgAndBatchSend(last) {
    // 检查temp_message表中的未处理消息
    // 网络恢复后继续处理
}
```
