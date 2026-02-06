# P2: 重复代码消除

**优先级**: P2
**涉及文件**: 多个 API 和 Store 文件
**预期提升**: 代码量↓20%

---

## 重复模式 1: 消息处理循环

### 问题代码 (messageManger.js)

```javascript
// 模式重复 5+ 次
const messageList = await allWith(
  `SELECT meta,uuid FROM message WHERE ...`,
  params,
  spaceId
);
messageList.forEach(message => {
  // 处理逻辑
  updateWith(spaceId, 'message', {...}, message.uuid, ...);
});
```

### 解决方案

```javascript
// src/utils/messageHelper.js
export async function batchProcessMessages(sqlQuery, params, processor, spaceId) {
  const messages = await allWith(sqlQuery, params, spaceId);
  return Promise.all(messages.map(msg => processor(msg, spaceId)));
}

// 使用
await batchProcessMessages(
  `SELECT meta,uuid FROM message WHERE hostId = :hostId`,
  { hostId },
  async (message, spaceId) => {
    const meta = JSON.parse(message.meta);
    // 处理逻辑
    return updateWith(spaceId, 'message', { meta: JSON.stringify(meta) }, message.uuid, 'uuid');
  },
  spaceId
);
```

---

## 重复模式 2: BlockList 获取

### 问题代码

```javascript
// 重复 5+ 次
let blockInfo = isPrivateSpace(spaceId)
  ? await commonUCRequest({
      baseURL: getUCBaseURL(spaceId),
      url: '/contact/blocklist',
      method: 'GET'
    })
  : null;
let blist = (blockInfo || {}).blackList || [];
let myBlockList = (blockInfo || {}).blackByList || [];
```

### 解决方案

```javascript
// src/utils/blockListHelper.js
const blockListCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

export async function getBlockList(spaceId) {
  if (!isPrivateSpace(spaceId)) {
    return { blist: [], myBlockList: [] };
  }

  // 检查缓存
  const cached = blockListCache.get(spaceId);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  const blockInfo = await commonUCRequest({
    baseURL: getUCBaseURL(spaceId),
    url: '/contact/blocklist',
    method: 'GET'
  });

  const result = {
    blist: blockInfo?.blackList || [],
    myBlockList: blockInfo?.blackByList || []
  };

  blockListCache.set(spaceId, { data: result, time: Date.now() });

  return result;
}

export function clearBlockListCache(spaceId) {
  if (spaceId) {
    blockListCache.delete(spaceId);
  } else {
    blockListCache.clear();
  }
}
```

---

## 重复模式 3: Session 更新

### 问题代码 (peerApi.js)

```javascript
// 模式重复 3+ 次
let session = store.state.sessionCollection[enCodeSpaceHid(hid, spaceId)];
if (!session) {
  session = {...};
  await store.dispatch('sessionCollection/initOrUpdateSession', {...});
} else {
  await store.dispatch('sessionCollection/changeSession', {...});
}
```

### 解决方案

```javascript
// src/utils/sessionHelper.js
export async function ensureSession(hid, spaceId, updates = {}) {
  const key = enCodeSpaceHid(hid, spaceId);
  const existingSession = store.state.sessionCollection[key];

  const sessionData = {
    ...existingSession,
    ...updates,
    hid,
    spaceId,
    updateTime: Date.now()
  };

  const action = existingSession
    ? 'sessionCollection/changeSession'
    : 'sessionCollection/initOrUpdateSession';

  await store.dispatch(action, {
    session: sessionData,
    spaceId
  });

  return sessionData;
}

// 使用
await ensureSession(hid, spaceId, {
  lastMessage: message,
  unreadCount: 1
});
```

---

## 重复模式 4: 空间检查

### 问题代码

```javascript
// 重复 10+ 次
if (!isExistSpaceList(spaceId)) {
  return;
}
const hostId = await getHid();
if (!hostId) {
  return;
}
```

### 解决方案

```javascript
// src/utils/spaceHelper.js
export async function validateSpaceContext(spaceId) {
  if (!isExistSpaceList(spaceId)) {
    throw new Error('Invalid space');
  }

  const hostId = await getHid();
  if (!hostId) {
    throw new Error('Not logged in');
  }

  return { spaceId, hostId };
}

// 使用装饰器模式
export function withSpaceValidation(fn) {
  return async function(spaceId, ...args) {
    const { hostId } = await validateSpaceContext(spaceId);
    return fn.call(this, spaceId, hostId, ...args);
  };
}

// 使用
const processMessage = withSpaceValidation(async (spaceId, hostId, message) => {
  // 处理逻辑，不需要再次检查
});
```

---

## 重复模式 5: Store 提交模式

### 问题代码

```javascript
// 重复模式
store.commit('moduleA/SET_DATA', data);
store.commit('moduleA/SET_LOADING', false);
store.commit('moduleA/SET_ERROR', null);
```

### 解决方案

```javascript
// src/store/helpers.js
export function createMutations(prefix, fields) {
  return fields.reduce((mutations, field) => {
    const mutationName = `SET_${field.toUpperCase()}`;
    mutations[mutationName] = (state, value) => {
      state[field] = value;
    };
    return mutations;
  }, {});
}

// 使用
// store/modules/example.js
const mutations = {
  ...createMutations('example', ['data', 'loading', 'error']),
  // 其他自定义 mutations
};

// 批量提交
export function batchCommit(commits) {
  commits.forEach(([type, payload]) => {
    store.commit(type, payload);
  });
}

// 使用
batchCommit([
  ['moduleA/SET_DATA', data],
  ['moduleA/SET_LOADING', false],
  ['moduleA/SET_ERROR', null]
]);
```

---

## 统计

| 重复模式 | 出现次数 | 消除后减少行数 |
|----------|----------|----------------|
| 消息处理循环 | 5+ | ~100 行 |
| BlockList 获取 | 5+ | ~50 行 |
| Session 更新 | 3+ | ~45 行 |
| 空间检查 | 10+ | ~60 行 |
| Store 提交 | 20+ | ~80 行 |
| **总计** | - | **~335 行** |

---

## 实施步骤

1. [ ] 创建 helper 函数文件
2. [ ] 逐个替换重复代码
3. [ ] 添加单元测试
4. [ ] 代码审查确认

---

**预计工时**: 2-3 天
**负责人**: 待分配
