# 会话管理

## 概述

会话(Session)是IM系统中用户与联系人/群组之间交流的抽象单元。Matrx Windows客户端通过 `sessionApi.js` 管理会话的创建、更新、排序和状态同步。

## sessionApi.js 核心API

### 文件位置

```
src/api/sessionApi.js
```

### 核心导出函数

| 函数 | 说明 |
|------|------|
| `getUISessionList()` | 获取UI渲染所需的会话列表 |
| `getDBSessionList()` | 获取数据库中的会话列表 |
| `getSessionList()` | 获取会话列表(包含置顶分离) |
| `getSingleDBSession()` | 获取单个会话信息 |
| `updateSingleSession()` | 更新单个会话 |
| `insertSingleSession()` | 插入单个会话 |
| `updateBatchSession()` | 批量更新会话 |
| `clearMentioned()` | 清除@提醒 |
| `deleteChatFromNotify()` | 从通知删除会话 |
| `getMsgRemind()` | 获取消息提醒数据 |
| `hasInstalled()` | 检查是否已初始化 |
| `installed()` | 标记已初始化 |

## 会话数据结构

### Session表结构

```sql
CREATE TABLE session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hid TEXT NOT NULL,           -- 会话标识(联系人/群组hid)
    hostId TEXT NOT NULL,        -- 当前用户hid
    lastMessageUUID TEXT,        -- 最后一条消息UUID
    lastReactTime INTEGER,       -- 最后活跃时间
    unreadCount INTEGER DEFAULT 0, -- 未读消息数
    isTop TEXT,                  -- 是否置顶 ('true'/null)
    isMute TEXT,                 -- 是否静音 ('true'/null)
    isDeleted TEXT,              -- 是否删除 ('true'/null)
    insertState INTEGER,         -- 插入状态
    remindlist TEXT,             -- @提醒列表(JSON)
    extraData TEXT,              -- 扩展数据(JSON)
    meta TEXT,                   -- 元数据(JSON)
    draftObj TEXT,               -- 草稿内容(JSON)
    readtime INTEGER,            -- 已读时间戳
    clearHistoryTime INTEGER,    -- 清除历史时间
    updateTopTime INTEGER,       -- 置顶更新时间
    updateMuteTime INTEGER,      -- 静音更新时间
    updateDeleteTime INTEGER,    -- 删除更新时间
    isGroupDismiss TEXT          -- 群组是否解散
);
```

### 会话状态字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `isTop` | string/null | 置顶状态，'true'表示置顶 |
| `isMute` | string/null | 静音状态，'true'表示静音 |
| `isDeleted` | string/null | 删除状态，'true'表示已删除 |
| `insertState` | number | 插入状态，2表示正常显示 |
| `unreadCount` | number | 未读数，-1表示标记未读 |

## 会话列表渲染

### 获取UI会话列表

```javascript
// sessionApi.js

export async function getUISessionList(spaceId = defaultSpaceId()) {
    let hostId = await getHid();
    let result = await allWith(
        `SELECT
            s.*,
            JSON_OBJECT(
                'c', m.c,
                'filelisttype', m.filelisttype,
                'meta', m.meta,
                'messageStatus', m.messageStatus,
                'MIMETYPE', m.MIMETYPE,
                'body', m.body,
                'dialogId', m.dialogId,
                'f', m.f,
                's', m.s,
                'm', m.m,
                'stime', m.stime,
                'isStar', m.isStar,
                'sessionHide', m.sessionHide,
                'burned', m.burned,
                'uuid', m.uuid,
                'unreadReceipt', m.unreadReceipt
            ) AS message,
            p.name, p.lastName, p.firstName, p.alias, p.portraitPath
        FROM session s
        LEFT JOIN message m ON s.lastMessageUUID = m.uuid
            AND m.sessionHide IS NULL
            AND m.burned IS NULL
            AND s.lastMessageUUID IS NOT NULL
        LEFT JOIN peer p ON s.hid = p.hid
            AND s.hostId = :hostId
        WHERE s.isDeleted IS NULL
            AND (s.insertState = 2 OR s.lastMessageUUID IS NOT NULL)
        ORDER BY s.isTop DESC, s.lastReactTime DESC`,
        { hostId },
        spaceId
    );

    // 数据解码转换
    result = result.map(session => {
        session.remindlist = session.remindlist && decodeString(session.remindlist);
        session.extraData = session.extraData && decodeString(session.extraData);
        session.meta = session.meta && decodeString(session.meta);
        session.draftObj = session.draftObj && decodeString(session.draftObj);
        session.message = decodeString(session.message);
        session.unreadCount = unReadCount2Number(session.unreadCount);

        if (session?.message?.uuid) {
            session.message.m = decodeString(session.message.m);
            session.message.meta = decodeString(session.message.meta);
        } else {
            session.message = null;
        }

        return session;
    });

    return result;
}
```

### 会话列表初始化

```javascript
// sessionApi.js

export async function initAllSession() {
    const spaceList = appdataStorage.getItem('xx_spaceList') || [];

    spaceList.forEach(item => {
        getSessionList(item.id)
            .then(sessionMap => {
                if (sessionMap.peers) {
                    // 合并会话到Vuex
                    store.commit('sessionCollection/mergeDBSessionsToVuex', {
                        peers: sessionMap.peers,
                        spaceId: item.id
                    });
                }

                // 初始化会话列表UI
                initDialogs(item.id, sessionMap, false);
            })
            .catch(error => {
                devLog.error('initAllSession getSessionList error', item, error);
            });
    });
}
```

## 会话排序规则

### 排序优先级

1. **置顶优先**: `isTop = 'true'` 的会话排在最前
2. **时间排序**: 按 `lastReactTime` 降序排列
3. **相同时间**: 保持原有顺序

### 排序SQL

```sql
ORDER BY s.isTop DESC, s.lastReactTime DESC
```

### Vuex中的排序处理

```javascript
// store/modules/dialogList.js

initDialog(state, { dialogs, stickyList, spaceId }) {
    // 置顶列表
    state.stickyList = stickyList || [];

    // 普通列表(已排除置顶)
    state.list = dialogs.filter(d => !d.isTop);
}

// 置顶切换
toggleTop(state, { dialogItem, index, spaceId }) {
    const { oldType, newIndex } = index;

    if (oldType === 'list') {
        // 从普通列表移到置顶列表
        const idx = state.list.findIndex(d => d.hid === dialogItem.hid);
        if (idx > -1) {
            state.list.splice(idx, 1);
        }
        state.stickyList.push(dialogItem);
    } else {
        // 从置顶列表移到普通列表
        const idx = state.stickyList.findIndex(d => d.hid === dialogItem.hid);
        if (idx > -1) {
            state.stickyList.splice(idx, 1);
        }
        // 插入到正确位置
        if (newIndex !== undefined) {
            state.list.splice(newIndex, 0, dialogItem);
        } else {
            state.list.push(dialogItem);
        }
    }
}
```

## 会话未读数管理

### 未读数计算

```javascript
// messageManger.js

function addUnreadCount2(session, spaceId) {
    let storeUnreadCount = session?.unreadCount;

    // 确保是有效数字
    storeUnreadCount = typeof storeUnreadCount === 'number'
        ? Math.max(storeUnreadCount, 0)
        : 0;

    storeUnreadCount += 1;

    return storeUnreadCount;
}

function subtractUnreadCount2(session, spaceId) {
    let storeUnreadCount = session?.unreadCount;

    if (storeUnreadCount >= 1) {
        storeUnreadCount -= 1;
        return storeUnreadCount;
    }

    return 0;
}
```

### 未读数更新逻辑

```javascript
// messageManger.js

function dialogUnreadCount2(message, session, spaceId) {
    const MIMETYPE = message?.m?.MIMETYPE;

    // 不计入未读的消息类型
    if (message.c === 'Event' || message.c == 'E2EKeyChange') return;
    if (MIMETYPE === 'withdraw/remind') return;
    if (message?.m?.meta?.editInfo) return;  // 编辑消息
    if (message?.__fetchRegionMsg) return;   // 区域拉取消息

    // 已读消息不增加未读数
    if (session?.readtime > message?.m?.stime) return;

    // 当前会话且滚动到底部，不增加未读数
    if (store.state.uiControl.hideDialogUnRead &&
        store.state.uiControl.currentDialogIsBottomed &&
        store.getters['uiControl/getActDialogId'] == message.dialogId) {
        return {
            unreadCount: 0,
            readtime: session.lastReactTime || getTimestamp()
        };
    }

    // 非自己发送的消息且非历史消息
    if (!message.__fetchRegionMsg && !message.isMine && !isHistory(message)) {
        let unreadCount = session.unreadCount;
        const meta = paths(message, 'm', 'meta') || {};
        const isMissCall = isMissedCall(meta);

        // 只有未接来电才计入未读
        const onlyMissedCall = MIMETYPE !== 'call/record' ||
            (MIMETYPE === 'call/record' && isMissCall);

        if (message.m.MIMETYPE == 'application/withdraw') {
            // 撤回消息减少未读数
            unreadCount = subtractUnreadCount2(session, spaceId);
        } else if (onlyMissedCall && MIMETYPE !== 'withdraw/remind') {
            // 普通消息增加未读数
            unreadCount = addUnreadCount2(session, spaceId);
        }

        return { unreadCount };
    }
}
```

### 标记已读/未读

```javascript
// peerApi.js

// 标记为未读
export async function markDialogUnread2(hid) {
    let spaceId = defaultSpaceId();
    let session = store.state.sessionCollection[enCodeSpaceHid(hid, spaceId)];

    if (!session) {
        session = { hid, unreadCount: -1 };
        await store.dispatch('sessionCollection/initOrUpdateSession', {
            session,
            spaceId
        });
    } else {
        await store.dispatch('sessionCollection/changeSession', {
            session: { hid, unreadCount: -1 },
            spaceId
        });
    }

    // 通知服务器
    userMessage({ conversation: my + '|' + other, read: 0 }, true);
}

// 标记为已读
export async function markDialogRead2(hid, spaceId, isNeedReact = true, isUpdateDeleted = false) {
    if (!hid) {
        console.error('markDialogRead2 markAsRead need hid');
        return;
    }

    let session = store.state.sessionCollection[enCodeSpaceHid(hid, spaceId)];

    if (!session) {
        session = { hid, unreadCount: 0, readtime: getTimestamp() };
        await store.dispatch('sessionCollection/initOrUpdateSession', {
            session,
            spaceId
        });
    } else {
        await store.dispatch('sessionCollection/changeSession', {
            session: {
                hid,
                unreadCount: 0,
                readtime: session.lastReactTime || getTimestamp()
            },
            spaceId
        });
    }

    // 通知服务器
    userMessage({ conversation: my + '|' + other, read: 1 }, true);
}
```

## 会话静音与隐藏

### 静音控制

```javascript
// peerApi.js

export async function togglePeerMute(muteStatus, hid, spaceId) {
    let session = await getSingleDBSession(spaceId, hid);
    let peerType = dataUtil.getPeerType(session.hid);

    if (peerType != 'group') {
        // 个人会话静音
        if (appdataStorage.getItem('imSdkOpen')) {
            await userMuteUpdate({
                friendUserId: dataUtil.hidToNumber(hid),
                notifyLevel: muteStatus ? 1 : 0
            });
        } else {
            await commonUCRequest({
                url: `/contact/mute`,
                method: 'POST',
                data: [{
                    muteAction: muteStatus ? 1 : 0,
                    friendId: hid + '='
                }]
            });
        }
    } else {
        // 群会话静音
        if (appdataStorage.getItem('imSdkOpen')) {
            await groupMuteUpdate({
                groupId: dataUtil.hidToNumber(hid),
                notifyLevel: muteStatus ? 1 : 0
            });
        } else {
            await commonUCRequest({
                url: `/channel/config`,
                method: 'POST',
                data: { noDisturb: muteStatus ? 1 : 0 }
            });
        }
    }

    // 更新本地状态
    session.isMute = muteStatus ? 'true' : null;

    await store.dispatch('sessionCollection/changeSession', {
        session: {
            hid,
            isMute: session.isMute,
            updateMuteTime: getTimestamp()
        },
        spaceId
    });
}
```

### 静音状态同步

```javascript
// messageManger.js - handleNotification()

case 'MuteChanged':
    atomrun(async () => {
        let whichone = paths(origin, 'm', 'body', 'friendHId').replace(/=/g, '');
        let spaceId = getSpaceId(origin.mcTo);
        let mute = paths(origin, 'm', 'body', 'mute');
        let muteTime = origin.m.ctime;

        let session = store.state.sessionCollection[enCodeSpaceHid(whichone, spaceId)];

        // 时间戳防重
        if (session?.updateMuteTime > muteTime) {
            return;
        }

        await store.dispatch('sessionCollection/changeSession', {
            session: {
                hid: whichone,
                isMute: mute == '1' ? 'true' : null,
                updateMuteTime: muteTime
            },
            spaceId
        });
    });
    break;
```

### 删除会话

```javascript
// peerApi.js

export async function deleteChat(hid, spaceId) {
    await deleteChatOnly(hid, spaceId);

    // 通知服务器
    let hostId = await getHid();
    let my = dataUtil.hidToNumber(hostId);
    let other = dataUtil.hidToNumber(hid);

    userRemove({
        rid: appdataStorage.getItem('c_rid'),
        conversation: my + '|' + other,
        move: true,
        clienttype: 'windows'
    });
}

export async function deleteChatOnly(hid, spaceId) {
    let session = store.state.sessionCollection[enCodeSpaceHid(hid, spaceId)];

    await store.dispatch('sessionCollection/changeSession', {
        session: {
            hid,
            isDeleted: true,
            updateDeleteTime: session?.lastReactTime
                ? session.lastReactTime + 1
                : getTimestamp()
        },
        spaceId,
        isUpdateDeleted: true
    });

    // 从会话列表移除
    store.commit('dialogList/removeDialog', {
        dialogItem: { hid, spaceId },
        spaceId
    });

    // 如果是当前会话，清空选中
    if (store.state.uiControl.actDialogId == hid) {
        store.commit('uiControl/setActDialogId', '');
    }
}
```

## 群会话特殊处理

### 群消息来源标识

群消息需要额外的 `s` 字段标识消息发送者：

```javascript
{
    c: 'HyperText',
    f: 'group_hid',    // 群hid
    s: 'sender_hid',   // 实际发送者hid
    t: 'receiver_hid'
}
```

### 群会话状态

```javascript
// 群解散标记
export async function setGroupDismiss(hid, spaceId) {
    await store.dispatch('sessionCollection/changeSession', {
        session: {
            hid,
            isGroupDismiss: true
        },
        spaceId
    });
}
```

### 群@提醒管理

```javascript
// sessionApi.js

// 清除@提醒
export async function clearMentioned(peerid, spaceId = defaultSpaceId()) {
    let hostId = await getHid();
    await updateWith(
        spaceId,
        'session',
        { remindlist: JSON.stringify([]) },
        peerid,
        'hid',
        hostId
    );
}

// 保存@提醒
// peerApi.js
export async function saveMentioned(dialogID, uuid, spaceId, isRemove = false) {
    let session = store.state.sessionCollection[enCodeSpaceHid(dialogID, spaceId)];
    let remindlist = session?.remindlist || [];

    if (isRemove) {
        // 移除提醒
        remindlist = remindlist.filter(id => id !== uuid);
    } else {
        // 添加提醒
        if (!remindlist.includes(uuid)) {
            remindlist.push(uuid);
        }
    }

    await store.dispatch('sessionCollection/changeSession', {
        session: {
            hid: dialogID,
            remindlist
        },
        spaceId
    });
}
```

### 群成员变更处理

```javascript
// messageManger.js - handleEvent()

case 'GroupAdd':
    // 添加群成员
    await refreshGroupMembers(message.dialogId, spaceId, message.m.stime, true);
    break;

case 'GroupKick':
    // 踢出群成员
    await refreshGroupMembers(message.dialogId, spaceId, message.m.stime, true);
    break;

case 'GroupLeave':
    // 退出群组
    await refreshGroupMembers(message.dialogId, spaceId, message.m.stime, true);
    break;
```

## 会话草稿管理

### 草稿数据结构

```javascript
draftObj: {
    content: '草稿内容',
    time: 1234567890,
    replyInfo: {          // 回复信息(可选)
        uuid: 'reply_uuid',
        preview: '预览内容'
    }
}
```

### 草稿保存

```javascript
// 保存草稿
async function saveDraft(hid, spaceId, draftContent, replyInfo) {
    const draftObj = {
        content: draftContent,
        time: getTimestamp(),
        replyInfo
    };

    await store.dispatch('sessionCollection/changeSession', {
        session: {
            hid,
            draftObj
        },
        spaceId
    });
}

// 清除草稿
async function clearDraft(hid, spaceId) {
    await store.dispatch('sessionCollection/changeSession', {
        session: {
            hid,
            draftObj: null
        },
        spaceId
    });
}
```

## Vuex Store 结构

### sessionCollection 模块

```javascript
// store/modules/sessionCollection.js

state: {
    // 按 'spaceId#hid' 索引的会话对象
    // 例: 'UAE-971-1000000#abc123': { hid, unreadCount, ... }
}

mutations: {
    mergeDBSessionsToVuex(state, { peers, spaceId }) {
        // 批量合并会话
    }
}

actions: {
    changeSession({ commit }, { session, spaceId }) {
        // 更新单个会话
    },

    initOrUpdateSession({ commit }, { session, spaceId }) {
        // 初始化或更新会话
    },

    checkSession({ state }, { hid, spaceId }) {
        // 检查并返回会话
    }
}
```

### dialogList 模块

```javascript
// store/modules/dialogList.js

state: {
    list: [],       // 普通会话列表
    stickyList: []  // 置顶会话列表
}

mutations: {
    initDialog(state, { dialogs, stickyList, spaceId }) {
        // 初始化会话列表
    },

    makeItReact(state, { dialogItem, spaceId }) {
        // 触发会话列表刷新
    },

    toggleTop(state, { dialogItem, index, spaceId }) {
        // 切换置顶状态
    },

    removeDialog(state, { dialogItem, spaceId }) {
        // 移除会话
    }
}
```
