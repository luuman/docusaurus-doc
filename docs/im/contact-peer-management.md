# 联系人与 Peer 管理

## 概述

联系人与 Peer 管理是 IM 系统的基础数据层，负责用户信息的获取、存储、同步和展示。本文档详细介绍 `peerApi.js` 和 `contactApi.js` 的实现原理，包括 Peer 表结构、联系人状态管理、组织架构等核心功能。

## 核心文件

| 文件 | 职责 |
|------|------|
| `src/api/peerApi.js` | Peer 数据管理、会话操作、搜索 |
| `src/api/contactApi.js` | 联系人 API、好友关系、组织架构 |
| `src/utils/dataDao.js` | 数据编解码转换 |
| `src/utils/SqliteUtil.js` | SQLite 数据库操作 |

## Peer 概念模型

### Peer 类型定义

```javascript
// Peer 类型枚举
const PeerType = {
    friend: 'friend',   // 好友
    group: 'group',     // 群组
    peer: 'peer',       // 普通用户（非好友）
    person: 'person'    // 人员（企业成员）
};

// 判断 Peer 类型
function getPeerType(hid) {
    // hid 格式决定类型
    // 群组 hid 包含特定标识
    return dataUtil.getPeerType(hid);
}
```

### Peer 数据流向

```
                    ┌──────────────┐
                    │   服务端     │
                    │  (UC Server) │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ describe │ │  scanv2  │ │  getlist │
       │ (详情)   │ │ (简略)   │ │ (列表)   │
       └────┬─────┘ └────┬─────┘ └────┬─────┘
            │            │            │
            └────────────┼────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  peerApi.js │
                  │  (数据处理) │
                  └──────┬──────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │  Vuex    │ │ SQLite   │ │  头像    │
       │  Store   │ │  peer表  │ │  缓存    │
       └──────────┘ └──────────┘ └──────────┘
```

## Peer 表结构

### 核心字段

| 字段 | 类型 | 说明 |
|------|------|------|
| hid | string | 用户/群组唯一标识 |
| hostId | string | 当前登录用户 hid |
| name | string | 名称 |
| alias | string | 备注名 |
| email | string | 邮箱地址 |
| portraitPath | string | 头像本地路径 |
| protraitMtime | number | 头像修改时间 |
| type | string | peer/friend/group/person |
| isDeleted | string | 是否删除 |
| isTop | string | 是否置顶 |
| isMute | string | 是否静音 |
| isBeBlock | string | 是否被对方拉黑 |
| myBlock | string | 是否被我拉黑 |
| subscribeType | number | 订阅类型（机器人等） |
| survivalTime | number | 缓存有效期 |
| ctime | number | 创建时间 |
| mtime | number | 修改时间 |

### 群组特有字段

| 字段 | 类型 | 说明 |
|------|------|------|
| groupInfo | object | 群组信息 |
| members | array | 群成员列表 |
| destroyInterval | number | 阅后即焚时间 |
| updateDestructTime | number | 销毁时间更新 |

### 企业用户特有字段

| 字段 | 类型 | 说明 |
|------|------|------|
| enterpriseId | string | 企业ID |
| h_id | string | 华为ID |
| h_account | string | 华为账号 |
| h_sip_number | string | SIP号码 |
| pwd | string | 密码信息 |

## 联系人 API (contactApi.js)

### 好友关系管理

```javascript
// 获取联系人列表
export function contactGetList(params) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        url: `/contact/getlist`,
        method: 'GET',
        params: {
            deviceType: 'windows',
            ...params
        }
    });
}

// 发送好友请求
export function contactRequest(params, data) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'POST',
        url: '/contact/request',
        params: {...params},
        data: {...data}
    });
}

// 接受好友请求
export function contactAccept(params) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'POST',
        url: '/contact/accept',
        params: {...params},
        data: {
            by: JSON.stringify({type: 'NumberSearch'})
        }
    });
}

// 拒绝好友请求
export async function contactReject(data) {
    return await commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'POST',
        url: '/contact/reject',
        data: {...data}
    });
}

// 撤回好友请求
export async function contactWithdraw(data) {
    return await commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'POST',
        url: '/contact/withdraw',
        data: {...data}
    });
}

// 删除好友
export function contactDelete(params, data) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'POST',
        url: '/contact/delete',
        params: {...params},
        data: {
            rid: getRid(),
            ...data
        }
    });
}

// 判断是否为好友
export function contactIsFriend(params) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'GET',
        url: '/contact/isFriend',
        params: {...params}
    });
}
```

### 黑名单管理

```javascript
// 获取黑名单
export function contactBlocklist(data, params) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'GET',
        url: '/contact/blocklist',
        params: {
            rid: getRid(),
            ...params
        },
        data: {...data}
    });
}
```

### 静音设置

```javascript
// 设置联系人静音
export async function contactMute(params, data) {
    let hostId = await getHid();
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        url: `/contact/mute`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'C-HID': hostId + '=',
            'C-Type': 'windows'
        },
        transformRequest: a => JSON.stringify(a),
        params: {
            rid: getRid(),
            ...params
        },
        data: data
    });
}
```

### 联系人详情

```javascript
// 获取联系人详细信息
export function contactDescribe(userList, spaceId) {
    if (userList?.length === 1 && userList.includes(appdataStorage.hid)) return {};

    return commonUCRequest({
        baseURL: getUCBaseURL(spaceId),
        url: `/contact/describe`,
        method: 'POST',
        params: {
            enterpriseId: spaceId
        },
        data: {
            users: userList.join(',')
        }
    });
}
```

### 好友请求历史

```javascript
// 获取好友请求列表
export function contactReqList(params) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'GET',
        url: '/contact/reqlist',
        params: {...params}
    });
}

// 获取请求历史
export async function getContactHistoryList() {
    return await commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'GET',
        url: '/contact/reqhistorylist'
    });
}

// 清空请求历史
export async function clearAllReqHistory() {
    return await commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'GET',
        url: '/contact/clearallreqhistory'
    });
}

// 删除单个请求记录
export function contactDelReq(params) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'GET',
        url: '/contact/delreq',
        params: {...params}
    });
}

// 获取请求详情
export async function getContactDetail(data) {
    return await commonUCRequest({
        baseURL: getUCBaseURL(),
        method: 'POST',
        url: '/contact/reqDetail',
        data: {...data}
    });
}
```

## 组织架构 API

### 获取企业组织树

```javascript
export async function getEnterpriseTree(data, params) {
    return commonUCRequest({
        baseURL: getUCBaseURL(data.spaceId),
        url: '/matrx-user/client/enterpriseInfo/getEnterpriseTree',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        params: {
            pattern: 'windows',
            ...params
        },
        transformRequest: req => req,
        data: JSON.stringify(data)
    }, true);
}
```

### 邮箱联系人管理

```javascript
// 获取邮箱联系人列表
export async function emailContactsList(data, params) {
    return commonUCRequest({
        baseURL: getUCBaseURL(data.spaceId),
        url: '/matrx-user/client/emailContacts/list',
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        params: {pattern: 'windows', ...params},
        data: JSON.stringify(data)
    }, true);
}

// 添加邮箱联系人
export async function emailContactsAdd(data, params) {
    return commonUCRequest({
        baseURL: getUCBaseURL(data.spaceId),
        url: '/matrx-user/client/emailContacts/add',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            clienttype: 'win'
        },
        params: {
            enterpriseId: data.spaceId,
            pattern: 'windows',
            ...params
        },
        data: JSON.stringify(data)
    }, true);
}

// 编辑邮箱联系人
export async function emailContactsEdit(data, params) {...}

// 删除邮箱联系人
export async function emailContactsRemove(data, params) {...}
```

## Peer 管理 (peerApi.js)

### 会话操作

#### 静音切换

```javascript
export async function togglePeerMute(muteStatus, hid, spaceId) {
    let session = await getSingleDBSession(spaceId, hid);
    session = decodeSessionTransform(session);

    if (session) {
        let peerType = dataUtil.getPeerType(session.hid);

        if (peerType != 'group') {
            // 个人静音
            if (appdataStorage.getItem('imSdkOpen')) {
                if (spaceId === 'UAE-971-1000000') {
                    await userMuteUpdate({
                        friendUserId: dataUtil.hidToNumber(hid),
                        notifyLevel: muteStatus ? 1 : 0
                    });
                } else {
                    await enterpriseUserMuteUpdate({
                        enterpriseId: spaceId,
                        targetSdkUserId: dataUtil.hidToNumber(hid),
                        notifyLevel: muteStatus ? 1 : 0
                    });
                }
            } else {
                await commonUCRequest({
                    baseURL: getUCBaseURL(spaceId),
                    url: `/contact/mute`,
                    method: 'POST',
                    data: [{
                        muteAction: muteStatus ? 1 : 0,
                        friendId: hid + '='
                    }]
                });
            }

            // 更新本地状态
            session.isMute = muteStatus ? 'true' : null;
            store.dispatch('peerCollection/changePeerProps', {
                hid,
                props: {isMute: session.isMute, updateMuteTime: getTimestamp()},
                spaceId
            });
        } else if (peerType == 'group') {
            // 群组静音
            if (appdataStorage.getItem('imSdkOpen')) {
                await groupMuteUpdate({
                    groupId: dataUtil.hidToNumber(hid),
                    notifyLevel: muteStatus ? 1 : 0
                });
            } else {
                await commonUCRequest({
                    baseURL: getUCBaseURL(spaceId),
                    url: `/channel/config`,
                    method: 'POST',
                    data: {noDisturb: muteStatus ? 1 : 0}
                });
            }
        }

        // 刷新会话列表
        store.commit('dialogList/makeItReact', {
            dialogItem: {hid, spaceId},
            spaceId
        });
    }
}
```

#### 已读/未读标记

```javascript
// 标记为未读
export async function markDialogUnread2(hid) {
    let spaceId = defaultSpaceId();
    let session = store.state.sessionCollection[enCodeSpaceHid(hid, spaceId)];

    if (!session) {
        session = {hid: hid, unreadCount: -1};
        await store.dispatch('sessionCollection/initOrUpdateSession', {
            session: session,
            spaceId: spaceId
        });
    } else {
        await store.dispatch('sessionCollection/changeSession', {
            session: {hid, unreadCount: -1, location: 9},
            spaceId
        });
    }

    // 同步到服务端
    let hostId = await getHid();
    let my = dataUtil.hidToNumber(hostId);
    let other = dataUtil.hidToNumber(hid);
    userMessage({
        conversation: my + '|' + other,
        read: 0
    }, true);
}

// 标记为已读
export async function markDialogRead2(hid, spaceId, isNeedReact = true, isUpdateDeleted = false) {
    if (hid) {
        let session = store.state.sessionCollection[enCodeSpaceHid(hid, spaceId)];

        if (!session) {
            session = {
                hid: hid,
                unreadCount: 0,
                readtime: getTimestamp()
            };
            if (isUpdateDeleted) {
                session.insertState = 2;
            }
            await store.dispatch('sessionCollection/initOrUpdateSession', {
                session: session,
                spaceId: spaceId
            });
        } else {
            await store.dispatch('sessionCollection/changeSession', {
                session: {
                    hid,
                    unreadCount: 0,
                    readtime: session.lastReactTime || getTimestamp()
                },
                spaceId,
                isUpdateDeleted
            });
        }

        // 同步到服务端
        let hostId = await getHid();
        userMessage({
            conversation: dataUtil.hidToNumber(hostId) + '|' + dataUtil.hidToNumber(hid),
            read: 1
        }, true);
    }
}
```

#### 置顶切换

```javascript
export async function toggleDialogPin(pinStatus, hid) {
    if (hid) {
        let spaceId = defaultSpaceId();
        let session = await getSingleDBSession(spaceId, hid);

        if (session) {
            session.isTop = pinStatus ? 'true' : null;
            await store.dispatch('sessionCollection/changeSession', {
                session: session,
                spaceId
            });

            if (pinStatus) {
                store.commit('dialogList/toggleTop', {
                    dialogItem: {hid, spaceId},
                    index: {oldType: 'list'},
                    spaceId
                });
            } else {
                store.commit('dialogList/toggleTop', {
                    dialogItem: {hid, spaceId},
                    index: {oldType: 'sticky', newIndex: curIdx},
                    spaceId
                });
            }

            // 同步到服务端
            await setUserTop({
                pin: pinStatus,
                top: pinStatus ? 1 : 0,
                conversation: hid
            });

            // 更新 Peer 状态
            store.dispatch('peerCollection/changePeerProps', {
                hid,
                props: {isTop: session.isTop},
                spaceId
            });
        }
    }
}
```

#### 删除会话

```javascript
export async function deleteChatOnly(hid, spaceId) {
    let session = store.state.sessionCollection[enCodeSpaceHid(hid, spaceId)];

    await store.dispatch('sessionCollection/changeSession', {
        session: {
            hid: hid,
            isDeleted: true,
            updateDeleteTime: session?.lastReactTime ? session.lastReactTime + 1 : getTimestamp()
        },
        spaceId: spaceId,
        isUpdateDeleted: true
    });

    store.commit('dialogList/removeDialog', {
        dialogItem: {hid, spaceId},
        spaceId
    });

    if (store.state.uiControl.actDialogId == hid) {
        store.commit('uiControl/setActDialogId', '');
    }
}

export async function deleteChat(hid, spaceId) {
    await deleteChatOnly(hid, spaceId);

    // 同步到服务端
    let hostId = await getHid();
    userRemove({
        rid: appdataStorage.getItem('c_rid'),
        conversation: dataUtil.hidToNumber(hostId) + '|' + dataUtil.hidToNumber(hid),
        move: true,
        clienttype: 'windows'
    });
}
```

### 数据获取与同步

#### 从数据库获取 Peer

```javascript
export async function getPeersWithDatabase(spaceId, prePeerList) {
    let hostId = await getHid();
    let result = await allWith(
        `SELECT * FROM peer WHERE hid IN (${prePeerList
            .map(peerHid => `"${peerHid}"`)
            .join(',')}) AND isDeleted is NULL AND hostId = :hostId`,
        {hostId},
        spaceId
    );
    return result;
}

export async function getPeerInfoWithDatabase(spaceId, hid, getCustomerInfoOnly = false) {
    let hostId = await getHid();
    let _hid = Array.isArray(hid) ? hid[0] : hid;

    let peerInfo = await allWith(
        `SELECT * from peer WHERE hid = :_hid AND hostId = :hostId`,
        {_hid, hostId},
        spaceId
    );

    // 获取客户信息
    let customerInfo = await userAllWith(
        `SELECT * from customer WHERE hostId = :hostId`,
        {hostId},
        spaceId
    );

    if (peerInfo.length > 0 && customerInfo.length > 0) {
        peerInfo[0].customerInfo = JSON.parse(customerInfo[0].content);
    }

    return peerInfo;
}

export async function get(hid, spaceId) {
    let hostId = await getHid();
    return getWith(
        'select * from peer where hid=:hid and hostId=:hostId',
        {hostId, hid},
        spaceId
    );
}
```

#### 从服务端获取 Peer

```javascript
export async function getPeersWithServer(spaceId = defaultSpaceId(), hidArray, needTopDialogIdList = [], dataWin = 3, needKey) {
    // 获取简略信息
    let summarys = await fetchSummaryForStatus(hidArray, spaceId, needKey);

    return new Promise((resolve, reject) => {
        let requestArray = [
            getContactInfoList(hidArray, spaceId),  // 详细信息
            getHWIDInfoList(idMap, spaceId)         // 华为ID信息
        ];

        Promise.allSettled(requestArray).then(async (response) => {
            let views = summarys || {};
            let details = response[0].value || {};
            let hwIDMap = response[1].value || {};

            // 获取头像
            const hidArg = F.formatHidArgByProtraitMtime(hidArray, views, spaceId);
            let avatars = await FM.exchangeAvatar(hidArg, undefined, spaceId) || {};

            let peers = [];
            for (const hid of hidArray) {
                const view = views[hid] || {};
                const detail = details[hid];
                const avatar = avatars[hid];

                let rsObj = _.merge({}, {portraitPath: avatar}, view, detail);
                rsObj.hid = hid;
                rsObj.survivalTime = Number(new Date()) + config.MEMORYTIMEOUT;
                rsObj.destroyInterval = detail?.pin?.selfDestruct || 0;
                rsObj.updateDestructTime = getTimestamp();

                peers.push(rsObj);
            }

            // 批量更新会话
            await batchUpdateSession(peers, spaceId);
            resolve(peers);
        });
    });
}
```

#### 更新 Peer 数据

```javascript
export function updatePeers(spaceId, dbArray = [], serverArray = [], dataWin, getCustomerInfoOnly = false, isNeedServe) {
    return new Promise((resolve, reject) => {
        let inputDBArray = [...dbArray, ...serverArray];

        // 从数据库获取
        getPeersWithDatabase(spaceId, dbArray).then(async (dbPeers) => {
            // 过滤出需要从服务端获取的
            let needFetchDBArray = dbArray.filter(hid =>
                !dbPeers.find(p => p?.hid === hid)
            );

            // 更新 Vuex
            if (dbPeers.length > 0) {
                store.commit('peerCollection/mergeDBPeersToVuex', {
                    peers: dbPeers,
                    spaceId
                });
            }

            serverArray.push(...needFetchDBArray);

            if (serverArray.length <= 0) {
                resolve(dbPeers.map(p => decodePeerTransform(p)));
                return;
            }

            // 从服务端获取
            getPeersWithServer(spaceId, serverArray, [], dataWin).then(async (serverPeers) => {
                // 保存到数据库
                await store.dispatch('peerCollection/peerSetContactItem', {
                    peers: serverPeers.map(encodePeerTransform),
                    spaceId
                });

                resolve(store.getters['peerCollection/getPlainPeers'](inputDBArray, spaceId));
            });
        });
    });
}
```

### 搜索功能

#### 搜索好友

```javascript
export async function findAvailablePersonsByLike(searchVal = '', exclude = [], spaceId = defaultSpaceId()) {
    let hostId = await getHid();
    let r = await allWith(
        `select * from peer
        where hostId = :hostId
        AND (type = 'friend' or type = 'group')
        and isDeleted is null
        and hid != :hid
        and hid not in (${exclude.map(hid => "'" + hid + "'").join(',')})
        and isBeBlock is null
        and myBlock is null
        and (
            accountPublic = 'false' and (name LIKE :searchVal OR alias LIKE :searchVal)
            OR
            (accountPublic IS NULL OR accountPublic != 'false')
            and (name LIKE :searchVal OR alias LIKE :searchVal OR email LIKE :searchVal)
        )
        order by isDialog desc, isTop desc, lastReactTime desc, mtime desc`,
        {hid: hostId, hostId: hostId, searchVal: `%${searchVal}%`},
        spaceId
    );
    return r;
}
```

#### 搜索转发对象

```javascript
export async function findAvailableForwarders(start, size, exclude = [], spaceId = defaultSpaceId()) {
    let hostId = await getHid();
    let r = await allWith(
        `SELECT p.*, s.isDeleted, s.lastReactTime as lastTime, s.isTop
         FROM peer p
         LEFT JOIN session s ON s.hid = p.hid
         WHERE p.hostId = :hostId
         AND (p.type = 'friend' or p.type = 'group' or p.type = 'peer' or p.type = 'person')
         AND p.hid != :hid
         AND p.hid not in (${exclude.map(hid => "'" + hid + "'").join(',')})
         AND s.isDeleted is null
         AND p.isBeBlock is null
         AND p.myBlock is null
         ORDER by s.lastReactTime desc, s.isTop desc, p.name asc
         limit :start,:size`,
        {start: start * size, size, hid: '', hostId: hostId},
        spaceId
    );
    return r;
}
```

#### 根据 HID 列表查询

```javascript
export async function findAvailablePersonsByHids(hidList, spaceId = defaultSpaceId()) {
    let hostId = await getHid();
    let r = await allWith(
        `select * from peer
        where hostId = :hostId
        and isDeleted is null
        and hid != :hid
        and hid in (${hidList.map(hid => "'" + hid + "'").join(',')})
        and isBeBlock is null
        and myBlock is null
        order by isDialog desc, isTop desc, lastReactTime desc, mtime desc`,
        {hid: hostId, hostId: hostId},
        spaceId
    );
    return r;
}
```

### 联系人列表管理

#### 获取联系人列表

```javascript
export async function getContactList(spaceId) {
    return new Promise(async (resolve, reject) => {
        if (isPrivateSpace(spaceId)) {
            // 个人空间
            commonUCRequest({
                baseURL: getUCBaseURL(personalSpaceId()),
                url: `/contact/getlist`,
                method: 'GET',
                params: {
                    enterpriseId: personalSpaceId(),
                    deviceType: 'windows'
                }
            }).then(response => {
                response.friends.push(store.state.userInfo.hid);
                store.commit('concat/CHANGE_CONTACT_LENGTH', response.friends.length);
                resolve({
                    friends: response.friends,
                    display: response.display
                });
            });
        } else {
            // 企业空间
            getCompanyMembers(spaceId).then(res => {
                let response = res.response;
                let enterpriseId = res.enterpriseId;
                resolve({
                    friends: response.members,
                    display: response.display
                });
                // 保存企业成员列表
                setEnterpriseMember(enterpriseId, JSON.stringify(response.members));
            });
        }
    });
}
```

#### 批量获取联系人

```javascript
export async function batchFetchContacts(spaceId, force = false, contactList) {
    let display = contactList.display;
    let changes = await allWith("select hid from peer where type = 'friend'", {}, spaceId);
    changes = changes.map(a => a.hid);

    if (!contactList.friends?.length) {
        await runWith(`update peer set type = 'peer' where type = 'friend'`, {}, spaceId);
        makeVuexNewest(changes, spaceId);
        return [];
    }

    let friends = contactList.friends.filter(a => dataUtil.getPeerType(a) != 'group');

    // 获取黑名单
    let blockInfo = isPrivateSpace(spaceId)
        ? await commonUCRequest({
            baseURL: getUCBaseURL(spaceId),
            method: 'GET',
            url: '/contact/blocklist',
            params: {enterpriseId: spaceId, rid: await getRid()}
        })
        : null;

    let blist = blockInfo?.blackList || [];
    let myBlockList = blockInfo?.blackByList || [];

    // 获取详细信息
    let allList = await fetchSummary(friends, contact => {
        contact.verifyType = 'scan';
        contact.isBeBlock = blist.includes(contact.hid) ? 'true' : null;
        contact.myBlock = myBlockList.includes(contact.hid) ? 'true' : null;
        contact.subscribeType = contact.subscribeType ||
            (store?.state?.concat?.whiteList?.some(v => v?.hid === contact.hid)
                ? SubscribeTypeEnum.ROBOT_SUBSCRIBE : null);
    }, force, force ? false : undefined, undefined, spaceId);

    // 排序
    let result = F.sortBy(allList)(F.ascending([F.alias, F.firstName, F.lastName]));

    // 更新数据库
    await runWith(
        `update peer set type = 'friend' where hid in (${friends.map(a => `'${a}'`).join(',')})`,
        {},
        spaceId
    );

    makeVuexNewest([...friends, ...changes], spaceId);
    return display == null || display == 1 ? result : [];
}
```

### 群组管理

#### 获取群组列表

```javascript
export async function getChannelList(spaceId = defaultSpaceId()) {
    return commonUCRequest({
        baseURL: getUCBaseURL(spaceId),
        url: `/channel/getenterprisegroup`,
        method: 'GET',
        params: {
            deviceType: 'windows',
            enterpriseId: spaceId
        }
    });
}
```

#### 获取群成员

```javascript
export async function getGroupUidList(groupHid, spaceId) {
    return commonUCRequest({
        baseURL: getUCBaseURL(spaceId),
        url: `/channel/getlist`,
        method: 'GET',
        params: {
            gid: groupHid,
            wdid: store.state.userInfo.wdid
        }
    });
}

export async function getGroupListInfo(groupHid) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        url: `/uc/channel/getlistinfo`,
        method: 'GET',
        params: {gid: groupHid}
    });
}
```

#### 获取企业所有群组

```javascript
export async function getSpaceAllChannelAndMembers(spaceId) {
    return commonUCRequest({
        baseURL: getUCBaseURL(),
        url: `/channel/getGroupListInfo`,
        method: 'GET',
        params: {enterpriseId: spaceId}
    });
}
```

#### 初始化群组数据

```javascript
export async function initGroupAdditional(hid, spaceId) {
    try {
        let groupItem = await fetchWholeForChannel(hid, spaceId, false, 'group');
        store.commit('peerCollection/mergeDBPeersToVuex', {
            peers: [{
                hid: hid,
                groupInfo: {
                    grouplist: groupItem.members
                }
            }],
            spaceId
        });
    } catch (error) {
        console.error('initGroupAdditional', error);
    }
}
```

### 数据持久化

#### 保存或更新

```javascript
export async function updateOrAdd(obj, hid, spaceId) {
    let hostId = await getHid();
    obj.hostId = hostId;

    let {n} = await getWith(
        'select count(hid) as n from peer where hid = :hid and hostId = :hostId',
        {hid, hostId},
        spaceId
    );

    if (n == 0) {
        obj.ctime = getTimestamp();
        if (obj.mtime == null) obj.mtime = getTimestamp();
        await insertWith('peer', obj, spaceId);
    } else {
        await updateWith(spaceId, 'peer', obj, hid, 'hid', hostId);
    }
}

export async function saveOrUpdate(obj, spaceId) {
    return updateOrAdd(obj, obj.hid, spaceId);
}
```

#### 批量保存

```javascript
export async function peerSetDBItem(peerList, spaceId) {
    for (const peer of peerList) {
        tasks.push(async () => {
            await saveOrUpdate(peer, spaceId);
        });
    }
    runTask();
}
```

### 任务队列

```javascript
let running = false;
let tasks = [];

async function runTask_() {
    if (tasks.length == 0) {
        running = false;
    } else {
        running = true;
        await tasks.shift()();  // 执行队首任务
        runTask_();             // 递归执行下一个
    }
}

async function runTask() {
    if (running) {
        return;
    } else {
        await runTask_();
    }
}
```

## 订阅类型

```javascript
// 订阅类型枚举
export const SubscribeTypeEnum = {
    ROBOT_SUBSCRIBE: 1  // 机器人订阅
};

// 判断是否为机器人
contact.subscribeType = store?.state?.concat?.whiteList?.some(v => v?.hid === contact.hid)
    ? SubscribeTypeEnum.ROBOT_SUBSCRIBE
    : null;
```

## 数据编解码

```javascript
// 编码 Peer 数据（存储前）
const {encodePeerTransform} = require('@/utils/dataDao');
let minPeer = encodePeerTransform(peer);

// 解码 Peer 数据（读取后）
const {decodePeerTransform} = require('@/utils/dataDao');
let peer = decodePeerTransform(dbPeer);
```

## Vuex 状态管理

### Store 操作

```javascript
// 合并 Peer 到 Vuex
store.commit('peerCollection/mergeDBPeersToVuex', {
    peers: peerList,
    spaceId
});

// 更新 Peer 属性
store.dispatch('peerCollection/changePeerProps', {
    hid,
    props: {isMute: 'true', updateMuteTime: getTimestamp()},
    spaceId
});

// 保存 Peer 到数据库
store.dispatch('peerCollection/peerSetContactItem', {
    peers: peerList,
    spaceId
});

// 获取 Peer
store.getters['peerCollection/getPeer'](hid, spaceId);
store.getters['peerCollection/getPlainPeers'](hidList, spaceId);
```

### 会话列表更新

```javascript
// 刷新会话列表项
store.commit('dialogList/makeItReact', {
    dialogItem: {hid, spaceId},
    spaceId,
    location: 8
});

// 移除会话
store.commit('dialogList/removeDialog', {
    dialogItem: {hid, spaceId},
    spaceId
});

// 切换置顶
store.commit('dialogList/toggleTop', {
    dialogItem: {hid, spaceId},
    index: {oldType: 'list'},  // or 'sticky'
    spaceId
});
```

## 缓存策略

### 内存缓存有效期

```javascript
// 设置缓存过期时间
rsObj.survivalTime = Number(new Date()) + config.MEMORYTIMEOUT;
```

### 缓存更新时机

| 时机 | 触发方式 |
|------|----------|
| 收到消息 | 自动更新发送者信息 |
| 进入会话 | 检查并刷新 Peer 数据 |
| 联系人列表 | 批量刷新所有联系人 |
| 主动搜索 | 从服务端获取最新数据 |

## 最佳实践

### 1. 优先使用本地数据

```javascript
// 先查数据库，再查服务端
let dbPeers = await getPeersWithDatabase(spaceId, hidList);
if (dbPeers.length < hidList.length) {
    let serverPeers = await getPeersWithServer(spaceId, missingHids);
}
```

### 2. 批量操作优化

```javascript
// 使用 Promise.allSettled 并行请求
Promise.allSettled([
    getContactInfoList(hidList, spaceId),
    getHWIDInfoList(idMap, spaceId)
]).then(handleResults);
```

### 3. 状态同步

```javascript
// 同时更新 Vuex 和数据库
store.commit('peerCollection/mergeDBPeersToVuex', {peers, spaceId});
await peerSetDBItem(peers, spaceId);
```

## 错误处理

### 403 错误处理

```javascript
userMessage({...}).catch(async (error) => {
    if (error?.responseHeader?.status === 403 && sessionStorage.getItem('freelogin')) {
        await forceCloseHandle('', `user/message 403close`);
    }
});
```

### 722 错误处理（新用户）

```javascript
if (resHeader && resHeader.status === 722) {
    store.commit('concat/CHANGE_CONTACT_LENGTH', 0);
    resolve({friends: []});
}
```

### 离线处理

```javascript
if (!navigator.online) {
    let changes = await allWith(
        "select hid from peer where type = 'friend' And subscribeType is Null",
        {},
        spaceId
    );
    resolve({friends: changes.map(a => a.hid)});
}
```
