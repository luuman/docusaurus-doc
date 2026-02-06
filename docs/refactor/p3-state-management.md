# P3: 状态管理优化

**优先级**: P3
**涉及文件**: `src/store/modules/`
**预期提升**: 内存可控、状态可预测

---

## 问题 1: peers 无限增长

### 问题代码 (peerCollection.js)

```javascript
// TODO 注释已存在
// TODO 需要对peers做内存淘汰
const state = {
  isCacheUserId: {},
  debounceCache: [],
  length: 0
};
```

### 解决方案: LRU 缓存

```javascript
// src/store/modules/peerCollection.js
import { LRUCache } from '@/utils/LRUCache';

const MAX_PEERS = 5000;
const peerCache = new LRUCache(MAX_PEERS);

const state = {
  // 使用 getter 代理访问
  peers: {},
  cacheStats: {
    hits: 0,
    misses: 0,
    evictions: 0
  }
};

const getters = {
  getPeer: (state) => (hid) => {
    const peer = peerCache.get(hid);
    if (peer) {
      state.cacheStats.hits++;
      return peer;
    }
    state.cacheStats.misses++;
    return null;
  },

  getCacheStats: (state) => state.cacheStats
};

const mutations = {
  SET_PEER(state, { hid, peer }) {
    const evicted = peerCache.set(hid, peer);
    if (evicted) {
      state.cacheStats.evictions++;
    }
  },

  REMOVE_PEER(state, hid) {
    peerCache.delete(hid);
  },

  CLEAR_PEERS(state) {
    peerCache.clear();
    state.cacheStats = { hits: 0, misses: 0, evictions: 0 };
  }
};
```

---

## 问题 2: messages 无去重无淘汰

### 问题代码 (messageCollection.js)

```javascript
// TODO 需要对messages做内存淘汰
// TODO 需要对message去重
```

### 解决方案: 消息缓存管理器

```javascript
// src/store/modules/messageCollection.js
const MAX_MESSAGES = 10000;
const MAX_AGE = 24 * 60 * 60 * 1000; // 24小时

class MessageStore {
  constructor() {
    this.messages = new Map();
    this.byDialog = new Map();
    this.timestamps = new Map();
  }

  add(message) {
    const { uuid, dialogId } = message;

    // 去重
    if (this.messages.has(uuid)) {
      return false;
    }

    // 淘汰检查
    this.cleanup();

    // 存储
    this.messages.set(uuid, message);
    this.timestamps.set(uuid, Date.now());

    // 按会话索引
    if (!this.byDialog.has(dialogId)) {
      this.byDialog.set(dialogId, new Set());
    }
    this.byDialog.get(dialogId).add(uuid);

    return true;
  }

  get(uuid) {
    return this.messages.get(uuid);
  }

  getByDialog(dialogId, limit = 50) {
    const uuids = this.byDialog.get(dialogId);
    if (!uuids) return [];

    return [...uuids]
      .slice(-limit)
      .map(uuid => this.messages.get(uuid))
      .filter(Boolean);
  }

  cleanup() {
    const now = Date.now();

    // 清理过期
    for (const [uuid, time] of this.timestamps) {
      if (now - time > MAX_AGE) {
        this.remove(uuid);
      }
    }

    // 超出容量
    if (this.messages.size > MAX_MESSAGES) {
      const sorted = [...this.timestamps.entries()]
        .sort((a, b) => a[1] - b[1]);

      const toRemove = sorted.slice(0, this.messages.size - MAX_MESSAGES);
      toRemove.forEach(([uuid]) => this.remove(uuid));
    }
  }

  remove(uuid) {
    const message = this.messages.get(uuid);
    if (message) {
      const dialogSet = this.byDialog.get(message.dialogId);
      if (dialogSet) {
        dialogSet.delete(uuid);
        if (dialogSet.size === 0) {
          this.byDialog.delete(message.dialogId);
        }
      }
    }
    this.messages.delete(uuid);
    this.timestamps.delete(uuid);
  }

  clear() {
    this.messages.clear();
    this.byDialog.clear();
    this.timestamps.clear();
  }

  get size() {
    return this.messages.size;
  }
}

const messageStore = new MessageStore();

const state = {
  // 响应式状态用于 UI
  currentDialogMessages: [],
  messageCount: 0
};

const mutations = {
  ADD_MESSAGE(state, message) {
    if (messageStore.add(message)) {
      state.messageCount = messageStore.size;
    }
  },

  SET_CURRENT_DIALOG_MESSAGES(state, dialogId) {
    state.currentDialogMessages = messageStore.getByDialog(dialogId);
  },

  CLEAR_MESSAGES(state) {
    messageStore.clear();
    state.currentDialogMessages = [];
    state.messageCount = 0;
  }
};
```

---

## 问题 3: 频繁的状态查询

### 问题代码

```javascript
// 每次都访问 store
if (store.state.userInfo.meetingStatus == 'calling') return;
if (store.state.uiControl.TopMenuBar.active === '0') return;
if (store.state.spaceCollection.isWinFocus) return;
```

### 解决方案: 计算属性缓存

```javascript
// src/store/getters.js
export const getters = {
  // 组合状态，避免重复访问
  notificationContext: (state) => ({
    isCalling: state.userInfo.meetingStatus === 'calling',
    isMinimized: state.uiControl.TopMenuBar.active === '0',
    isFocused: state.spaceCollection.isWinFocus,
    currentSpace: state.spaceCollection.currentSpaceId
  }),

  shouldShowNotification: (state, getters) => {
    const ctx = getters.notificationContext;
    return !ctx.isCalling && !(ctx.isMinimized && ctx.isFocused);
  }
};

// 使用
const shouldNotify = store.getters.shouldShowNotification;
if (!shouldNotify) return;
```

---

## 问题 4: 状态模块过大

### 问题: concat.js 28KB

### 解决方案: 拆分模块

```javascript
// src/store/modules/concat/index.js
import contacts from './contacts';
import channels from './channels';
import requests from './requests';

export default {
  namespaced: true,
  modules: {
    contacts,
    channels,
    requests
  },

  // 跨模块 getters
  getters: {
    allItems: (state, getters) => [
      ...getters['contacts/list'],
      ...getters['channels/list']
    ]
  }
};

// src/store/modules/concat/contacts.js
export default {
  namespaced: true,
  state: () => ({
    list: [],
    loading: false
  }),
  mutations: {
    SET_LIST(state, list) {
      state.list = list;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    }
  },
  actions: {
    async fetch({ commit }) {
      commit('SET_LOADING', true);
      try {
        const list = await api.getContacts();
        commit('SET_LIST', list);
      } finally {
        commit('SET_LOADING', false);
      }
    }
  }
};
```

---

## 内存监控

```javascript
// src/utils/memoryMonitor.js
export class MemoryMonitor {
  constructor(interval = 60000) {
    this.interval = interval;
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => this.check(), this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  check() {
    if (performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      const usage = usedJSHeapSize / jsHeapSizeLimit;

      console.log(`[Memory] Used: ${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB, ` +
                  `Total: ${(totalJSHeapSize / 1024 / 1024).toFixed(2)}MB, ` +
                  `Usage: ${(usage * 100).toFixed(1)}%`);

      if (usage > 0.8) {
        console.warn('[Memory] High memory usage detected, triggering cleanup');
        this.triggerCleanup();
      }
    }
  }

  triggerCleanup() {
    store.commit('peerCollection/CLEANUP');
    store.commit('messageCollection/CLEANUP');
  }
}

// 在 main.js 中启用
const memoryMonitor = new MemoryMonitor();
memoryMonitor.start();
```

---

**预计工时**: 3-4 天
**负责人**: 待分配
