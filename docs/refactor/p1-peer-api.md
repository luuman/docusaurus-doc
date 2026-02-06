# P1: peerApi.js 拆分

**优先级**: P1
**文件**: `src/api/peerApi.js`
**当前大小**: 111KB, 3265行
**预期提升**: 加载↓40%, 维护性↑60%

---

## 问题描述

联系人/对话管理的集大成文件，混合了：
- HTTP API 请求
- 数据库操作
- Vuex 状态管理
- 业务逻辑处理

---

## 重构方案

### 拆分为 5 个模块

```
src/api/peer/
├── index.js              # 统一导出
├── contactApi.js         # 联系人 HTTP 接口
├── sessionService.js     # 会话管理服务
├── peerRepository.js     # 数据持久化层
├── peerService.js        # 业务逻辑层
└── blockListManager.js   # 黑名单管理
```

### 各模块职责

| 模块 | 职责 | 依赖 |
|------|------|------|
| contactApi.js | HTTP 请求封装 | axiosInstance |
| peerRepository.js | 数据库 CRUD | sqlApi |
| peerService.js | 业务逻辑组合 | contactApi, peerRepository |
| sessionService.js | 会话状态管理 | store, peerRepository |
| blockListManager.js | 黑名单操作 | contactApi, peerRepository |

---

## 代码示例

### peerRepository.js

```javascript
// src/api/peer/peerRepository.js
import { getWith, insertWith, updateWith, allWith } from '@/sql/SqliteUtil';

export class PeerRepository {
  constructor(spaceId) {
    this.spaceId = spaceId;
  }

  async findByHid(hid) {
    const result = await getWith(
      `SELECT * FROM peer WHERE hid = :hid`,
      { hid },
      this.spaceId
    );
    return result?.[0] || null;
  }

  async findByHids(hids) {
    if (!hids?.length) return [];
    const placeholders = hids.map(() => '?').join(',');
    return allWith(
      `SELECT * FROM peer WHERE hid IN (${placeholders})`,
      hids,
      this.spaceId
    );
  }

  async save(peer) {
    const existing = await this.findByHid(peer.hid);
    if (existing) {
      return this.update(peer);
    }
    return this.insert(peer);
  }

  async insert(peer) {
    return insertWith(this.spaceId, 'peer', peer);
  }

  async update(peer) {
    return updateWith(
      this.spaceId,
      'peer',
      peer,
      peer.hid,
      'hid'
    );
  }

  async batchSave(peers) {
    const hids = peers.map(p => p.hid);
    const existing = await this.findByHids(hids);
    const existingSet = new Set(existing.map(p => p.hid));

    const toInsert = peers.filter(p => !existingSet.has(p.hid));
    const toUpdate = peers.filter(p => existingSet.has(p.hid));

    await Promise.all([
      ...toInsert.map(p => this.insert(p)),
      ...toUpdate.map(p => this.update(p))
    ]);
  }
}
```

### contactApi.js

```javascript
// src/api/peer/contactApi.js
import { commonUCRequest } from '@/api/axiosInstance';
import { getUCBaseURL } from '@/utils/base';

export async function fetchPeerSummary(hids, spaceId) {
  return commonUCRequest({
    baseURL: getUCBaseURL(spaceId),
    url: '/user/summary',
    method: 'POST',
    data: { hids: hids.join(',') }
  });
}

export async function fetchPeerDetail(hid, spaceId) {
  return commonUCRequest({
    baseURL: getUCBaseURL(spaceId),
    url: `/user/${hid}/detail`,
    method: 'GET'
  });
}

export async function searchPeer(keyword, spaceId) {
  return commonUCRequest({
    baseURL: getUCBaseURL(spaceId),
    url: '/user/search',
    method: 'GET',
    params: { keyword }
  });
}
```

### peerService.js

```javascript
// src/api/peer/peerService.js
import { PeerRepository } from './peerRepository';
import * as contactApi from './contactApi';
import store from '@/store';

export class PeerService {
  constructor(spaceId) {
    this.spaceId = spaceId;
    this.repository = new PeerRepository(spaceId);
  }

  async getPeer(hid, forceRefresh = false) {
    // 1. 检查 Vuex 缓存
    if (!forceRefresh) {
      const cached = store.getters['peerCollection/getPeer'](hid);
      if (cached) return cached;
    }

    // 2. 检查数据库
    let peer = await this.repository.findByHid(hid);

    // 3. 需要时从服务器获取
    if (!peer || forceRefresh) {
      const serverPeer = await contactApi.fetchPeerDetail(hid, this.spaceId);
      peer = this.mergePeer(peer, serverPeer);
      await this.repository.save(peer);
    }

    // 4. 更新 Vuex
    store.commit('peerCollection/SET_PEER', { hid, peer });

    return peer;
  }

  async getPeers(hids) {
    const result = {};
    const missing = [];

    // 1. 从缓存获取
    for (const hid of hids) {
      const cached = store.getters['peerCollection/getPeer'](hid);
      if (cached) {
        result[hid] = cached;
      } else {
        missing.push(hid);
      }
    }

    if (missing.length === 0) return result;

    // 2. 从数据库获取
    const dbPeers = await this.repository.findByHids(missing);
    const stillMissing = [];

    for (const peer of dbPeers) {
      result[peer.hid] = peer;
      store.commit('peerCollection/SET_PEER', { hid: peer.hid, peer });
    }

    const dbHids = new Set(dbPeers.map(p => p.hid));
    for (const hid of missing) {
      if (!dbHids.has(hid)) {
        stillMissing.push(hid);
      }
    }

    // 3. 从服务器获取
    if (stillMissing.length > 0) {
      const serverPeers = await contactApi.fetchPeerSummary(stillMissing, this.spaceId);
      await this.repository.batchSave(serverPeers);

      for (const peer of serverPeers) {
        result[peer.hid] = peer;
        store.commit('peerCollection/SET_PEER', { hid: peer.hid, peer });
      }
    }

    return result;
  }

  mergePeer(existing, newData) {
    return {
      ...existing,
      ...newData,
      updateTime: Date.now()
    };
  }
}
```

### 统一导出

```javascript
// src/api/peer/index.js
export { PeerRepository } from './peerRepository';
export { PeerService } from './peerService';
export * from './contactApi';
export { BlockListManager } from './blockListManager';
export { SessionService } from './sessionService';
```

---

## 迁移计划

1. [ ] 创建新模块结构
2. [ ] 迁移数据库操作到 peerRepository
3. [ ] 迁移 HTTP 请求到 contactApi
4. [ ] 迁移业务逻辑到 peerService
5. [ ] 更新所有调用方
6. [ ] 删除旧文件

---

**预计工时**: 4-5 天
**负责人**: 待分配
