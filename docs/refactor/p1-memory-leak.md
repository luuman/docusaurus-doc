# P1: 内存泄漏修复

**优先级**: P1
**涉及文件**: `messageManger.js`, 各 Vue 组件
**预期提升**: 内存占用↓30-50%

---

## 问题 1: 计时器未清理

### 问题代码 (messageManger.js:950, 1101, 1118)

```javascript
// 问题：旧计时器未清理就重新赋值
pushRegTimer = setTimeout(() => {
  // 处理逻辑
}, 3000);

// 后续重新赋值，旧 timer 仍在运行
pushRegTimer = setTimeout(() => {...}, 3000);
```

### 风险

- 旧计时器继续运行
- 累积导致内存泄漏
- 可能导致逻辑多次执行

### 解决方案

```javascript
// 方案 1: 清理后再设置
if (pushRegTimer) {
  clearTimeout(pushRegTimer);
}
pushRegTimer = setTimeout(() => {...}, 3000);

// 方案 2: 使用 Timer 管理器
class TimerManager {
  constructor() {
    this.timers = new Map();
  }

  set(key, fn, delay) {
    this.clear(key);
    this.timers.set(key, setTimeout(fn, delay));
  }

  clear(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clearAll() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

// 使用
const timers = new TimerManager();
timers.set('pushReg', () => {...}, 3000);

// 组件销毁时
onBeforeUnmount(() => timers.clearAll());
```

---

## 问题 2: 事件监听器未移除

### 问题代码 (messageManger.js:715-850)

```javascript
// 添加监听
window.MatrxGlobalEvent.on('ws:connect', async () => {
  // 事件处理
});

ipcRenderer.on('E2E-Key-Change', keychangeFn);

// 问题：组件卸载时未移除
```

### 风险

- 组件重新创建时重复监听
- 旧处理函数仍在执行
- 内存持续增长

### 解决方案

```javascript
// 方案 1: 手动管理
const handleConnect = async () => {...};
const handleKeyChange = (event, data) => {...};

// 添加
window.MatrxGlobalEvent.on('ws:connect', handleConnect);
ipcRenderer.on('E2E-Key-Change', handleKeyChange);

// 移除
onBeforeUnmount(() => {
  window.MatrxGlobalEvent.off('ws:connect', handleConnect);
  ipcRenderer.removeListener('E2E-Key-Change', handleKeyChange);
});

// 方案 2: 事件管理器
class EventManager {
  constructor() {
    this.listeners = [];
  }

  on(target, event, handler) {
    if (target.on) {
      target.on(event, handler);
    } else if (target.addEventListener) {
      target.addEventListener(event, handler);
    }
    this.listeners.push({ target, event, handler });
  }

  offAll() {
    this.listeners.forEach(({ target, event, handler }) => {
      if (target.off) {
        target.off(event, handler);
      } else if (target.removeEventListener) {
        target.removeEventListener(event, handler);
      } else if (target.removeListener) {
        target.removeListener(event, handler);
      }
    });
    this.listeners = [];
  }
}

// 使用
const events = new EventManager();
events.on(window.MatrxGlobalEvent, 'ws:connect', handleConnect);
events.on(ipcRenderer, 'E2E-Key-Change', handleKeyChange);

onBeforeUnmount(() => events.offAll());
```

---

## 问题 3: Vuex 状态无限增长

### 问题代码 (peerCollection.js:62)

```javascript
// TODO 注释已存在，但未实现
// TODO 需要对peers做内存淘汰
const state = {
  isCacheUserId: {},
  debounceCache: [],
  length: 0
};
```

### 风险

- peers 对象无限增长
- 离线用户信息永不清理
- 大企业场景内存溢出

### 解决方案: LRU 缓存

```javascript
class LRUCache {
  constructor(maxSize = 5000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key, value) {
    // 已存在则先删除（移到末尾）
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 超出容量则删除最旧的
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    // 移到末尾（最近使用）
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// Vuex 模块中使用
const peerCache = new LRUCache(5000);

const mutations = {
  SET_PEER(state, { hid, peer }) {
    peerCache.set(hid, peer);
  }
};

const getters = {
  getPeer: () => (hid) => peerCache.get(hid)
};
```

---

## 问题 4: 消息列表无去重无淘汰

### 问题代码 (messageCollection.js:10-11)

```javascript
// TODO 需要对messages做内存淘汰
// TODO 需要对message去重
```

### 解决方案

```javascript
class MessageCache {
  constructor(maxMessages = 10000, maxAge = 24 * 60 * 60 * 1000) {
    this.messages = new Map();
    this.messagesByDialog = new Map();
    this.maxMessages = maxMessages;
    this.maxAge = maxAge;
  }

  add(message) {
    const uuid = message.uuid;

    // 去重
    if (this.messages.has(uuid)) {
      return false;
    }

    // 清理过期
    this.cleanup();

    // 存储
    this.messages.set(uuid, {
      data: message,
      time: Date.now()
    });

    // 按会话索引
    const dialogId = message.dialogId;
    if (!this.messagesByDialog.has(dialogId)) {
      this.messagesByDialog.set(dialogId, new Set());
    }
    this.messagesByDialog.get(dialogId).add(uuid);

    return true;
  }

  cleanup() {
    const now = Date.now();

    // 清理过期消息
    for (const [uuid, { time }] of this.messages) {
      if (now - time > this.maxAge) {
        this.remove(uuid);
      }
    }

    // 超出容量则清理最旧的
    if (this.messages.size > this.maxMessages) {
      const sorted = [...this.messages.entries()]
        .sort((a, b) => a[1].time - b[1].time);

      const toRemove = sorted.slice(0, this.messages.size - this.maxMessages);
      toRemove.forEach(([uuid]) => this.remove(uuid));
    }
  }

  remove(uuid) {
    const msg = this.messages.get(uuid);
    if (msg) {
      const dialogSet = this.messagesByDialog.get(msg.data.dialogId);
      if (dialogSet) {
        dialogSet.delete(uuid);
      }
      this.messages.delete(uuid);
    }
  }
}
```

---

## 检查清单

- [ ] 排查所有 setTimeout/setInterval 使用
- [ ] 排查所有事件监听注册
- [ ] 排查 Vuex 状态增长情况
- [ ] 添加内存监控日志
- [ ] 压力测试验证

---

**预计工时**: 3-4 天
**负责人**: 待分配
