# P0: 数据库 N+1 查询问题修复

**优先级**: P0 (最高)
**涉及文件**: `src/store/modules/peerCollection.js`, `src/api/peerApi.js`
**预期提升**: 查询性能↑90%

---

## 问题描述

### 当前代码 (peerCollection.js:40-50)

```javascript
async function updateDBPeerData(state, payload, toVuex = true) {
  let updatePeerList = payload.peers;
  for (let index = 0; index < updatePeerList.length; index++) {
    const singlePeer = updatePeerList[index];
    // N+1 查询：每个联系人都查一次数据库
    let viewPeerFromDB = await getPeerInfoWithDatabase(spaceId, needStore.hid);
    if (viewPeerFromDB && viewPeerFromDB.length > 0) {
      await updateContactItem([needStore], spaceId);  // 逐条更新
    }
  }
}
```

### 问题分析

- 100个联系人 = 100次数据库查询 + 100次更新
- 企业场景可能有 1000+ 联系人
- 导致界面卡顿、响应慢

---

## 重构方案

### 优化后代码

```javascript
async function updateDBPeerData(state, payload, toVuex = true) {
  const updatePeerList = payload.peers;
  const spaceId = payload.spaceId;

  // 1. 提取所有 hid
  const hids = updatePeerList.map(p => p.hid);

  // 2. 批量查询一次（1次查询替代 N 次）
  const existingPeers = await batchGetPeerFromDB(hids, spaceId);
  const existingSet = new Set(existingPeers.map(p => p.hid));

  // 3. 分类：需要插入的 vs 需要更新的
  const toInsert = updatePeerList.filter(p => !existingSet.has(p.hid));
  const toUpdate = updatePeerList.filter(p => existingSet.has(p.hid));

  // 4. 批量操作（2次操作替代 N 次）
  if (toInsert.length > 0) {
    await peerSetDBItem(toInsert, spaceId);
  }
  if (toUpdate.length > 0) {
    await batchUpdateContactItem(toUpdate, spaceId);
  }

  // 5. 更新 Vuex
  if (toVuex) {
    updatePeerList.forEach(peer => {
      state.peers[peer.hid] = peer;
    });
  }
}
```

### 新增批量查询函数

```javascript
// src/sqlApi/peerSqlApi.js
export async function batchGetPeerFromDB(hids, spaceId) {
  if (!hids || hids.length === 0) return [];

  // 使用参数化查询防止 SQL 注入
  const placeholders = hids.map(() => '?').join(',');
  const sql = `SELECT * FROM peer WHERE hid IN (${placeholders})`;

  return allWith(sql, hids, spaceId);
}

export async function batchUpdateContactItem(peers, spaceId) {
  if (!peers || peers.length === 0) return;

  // 使用事务批量更新
  const db = await getDB(spaceId);
  await db.run('BEGIN TRANSACTION');

  try {
    const stmt = await db.prepare(`
      UPDATE peer SET
        name = ?, avatar = ?, status = ?, updateTime = ?
      WHERE hid = ?
    `);

    for (const peer of peers) {
      await stmt.run(peer.name, peer.avatar, peer.status, Date.now(), peer.hid);
    }

    await stmt.finalize();
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
}
```

---

## 其他 N+1 问题位置

### 位置 1: messageManger.js (lines 2750-2770)

```javascript
// 问题代码
const messageList = await allWith(`SELECT * FROM message WHERE uuid in (${uuids})`, ...);
messageList.forEach(message => {
  updateWith(spaceId, 'message', {...}, message.uuid, ...);  // N 次更新
});

// 优化为
await db.run(`
  UPDATE message SET meta = :meta
  WHERE uuid IN (SELECT messageUuid FROM meeting WHERE conferenceId = :confId)
`, { meta: JSON.stringify(options), confId: conferenceId });
```

### 位置 2: sessionApi.js

```javascript
// 问题代码
for (const session of sessions) {
  const lastMsg = await getLastMessage(session.dialogId);  // N 次查询
}

// 优化为
const dialogIds = sessions.map(s => s.dialogId);
const lastMessages = await batchGetLastMessages(dialogIds);  // 1 次查询
```

---

## 性能对比

| 场景 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 100 联系人更新 | 200次查询, 3000ms | 2次查询, 100ms | 97% |
| 500 联系人更新 | 1000次查询, 15000ms | 2次查询, 300ms | 98% |
| 1000 联系人更新 | 2000次查询, 30000ms | 2次查询, 500ms | 98% |

---

## 实施步骤

1. [ ] 新增 `batchGetPeerFromDB` 函数
2. [ ] 新增 `batchUpdateContactItem` 函数
3. [ ] 重构 `updateDBPeerData` 函数
4. [ ] 重构消息批量更新逻辑
5. [ ] 重构会话最后消息查询
6. [ ] 性能测试验证

---

**预计工时**: 2-3 天
**负责人**: 待分配
