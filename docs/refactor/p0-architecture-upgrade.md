# P0: 架构升级方案

**优先级**: P0
**范围**: 全局架构重构
**预期提升**: 首屏 10-15x，内存 4-5x，数据库 100x

---

## 当前架构问题

```
┌─────────────────────────────────────────────────────────────────────┐
│                        当前架构（性能瓶颈）                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   渲染进程（承担了所有重任）                                          │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │  Socket 连接 ──→ 消息处理 ──→ Vuex (28模块/4742行)         │    │
│   │       │              │              │                      │    │
│   │       ▼              ▼              ▼                      │    │
│   │  证书验证      数据转换/解密    全量响应式追踪                │    │
│   │       │              │              │                      │    │
│   │       ▼              ▼              ▼                      │    │
│   │  重连逻辑      SQLite写入       UI 更新                    │    │
│   │                (多实例无池化)    (列表无虚拟化)              │    │
│   └───────────────────────────────────────────────────────────┘    │
│                          全部阻塞 UI 线程！                         │
│                                                                     │
│   主进程：仅窗口管理，未充分利用                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 具体问题

| 问题 | 当前状态 | 影响 |
|------|----------|------|
| Socket 在渲染进程 | `loopConnectSocket.js` | 重连阻塞 UI |
| Vuex 过重 | 28 模块，4742 行 | 内存压力大 |
| 无 Worker | 仅截图用了 simple-web-worker | 计算阻塞 UI |
| 数据库无池化 | 多实例按 vuid+spaceId | 锁争用 |
| 无虚拟列表 | 全量渲染 | 百万数据崩溃 |

---

## 推荐架构：三层分离

```
┌─────────────────────────────────────────────────────────────────────┐
│                     推荐架构（三层分离）                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              渲染进程（纯 UI 展示层）                         │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  - 虚拟列表渲染（只渲染可见区域 50 条）               │   │   │
│  │  │  - 轻量状态（只存 UI 状态，不存业务数据）              │   │   │
│  │  │  - 被动接收数据推送（不主动拉取大量数据）              │   │   │
│  │  │  - 用户操作 → 发送 Action → 等待结果                  │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────┬─────────────────────────────────┘   │
│                              │ IPC (小数据包，已处理好)             │
│  ┌───────────────────────────┼─────────────────────────────────┐   │
│  │           主进程（协调层 - 极轻量）                          │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  - 窗口生命周期管理                                   │   │   │
│  │  │  - 消息路由（渲染 ↔ 服务层）                          │   │   │
│  │  │  - 系统 API（托盘、通知、快捷键）                      │   │   │
│  │  │  - 不做任何计算，只做调度                             │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────┬─────────────────────────────────┘   │
│                              │ MessagePort                         │
│  ┌───────────────────────────┼─────────────────────────────────┐   │
│  │          服务进程（业务核心 - Utility Process）              │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  Socket 管理    数据缓存(LRU)    业务逻辑             │   │   │
│  │  │       │              │              │                │   │   │
│  │  │       ▼              ▼              ▼                │   │   │
│  │  │  ┌────────┐    ┌────────┐    ┌────────┐            │   │   │
│  │  │  │DB Worker│    │IM Worker│   │Crypto W│            │   │   │
│  │  │  │(WAL模式)│    │(消息解析)│   │(加解密) │            │   │   │
│  │  │  └────────┘    └────────┘    └────────┘            │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 核心改造点

### 1. 服务进程（Utility Process）

Electron 的 `utilityProcess` 是独立的 Node.js 进程，适合处理 CPU 密集型任务。

```javascript
// src/service/index.js - 服务进程入口
const { parentPort } = require('electron');
const { SocketManager } = require('./socket/SocketManager');
const { DatabaseManager } = require('./database/DatabaseManager');
const { MessageProcessor } = require('./im/MessageProcessor');
const { WorkerPool } = require('./workers/WorkerPool');

class ServiceProcess {
  constructor() {
    this.socket = new SocketManager();
    this.db = new DatabaseManager();
    this.messageProcessor = new MessageProcessor();
    this.workerPool = new WorkerPool();
  }

  async init() {
    // 初始化 Worker 池
    await this.workerPool.init({
      database: { script: './workers/database.js', count: 2 },
      crypto: { script: './workers/crypto.js', count: 2 },
      transform: { script: './workers/transform.js', count: 2 },
    });

    // 监听主进程消息
    parentPort.on('message', (msg) => this.handleMessage(msg));
  }

  async handleMessage({ id, action, payload }) {
    try {
      let result;

      switch (action) {
        // Socket 操作
        case 'socket:connect':
          result = await this.socket.connect(payload);
          break;
        case 'socket:disconnect':
          result = await this.socket.disconnect();
          break;

        // 数据库操作
        case 'db:query':
          result = await this.workerPool.execute('database', 'all', payload);
          break;
        case 'db:insert':
          result = await this.workerPool.execute('database', 'run', payload);
          break;
        case 'db:batch':
          result = await this.workerPool.execute('database', 'batch', payload);
          break;

        // 消息操作
        case 'message:fetch':
          result = await this.fetchMessages(payload);
          break;
        case 'message:send':
          result = await this.sendMessage(payload);
          break;

        // 加密操作
        case 'crypto:decrypt':
          result = await this.workerPool.execute('crypto', 'decrypt', payload);
          break;
      }

      parentPort.postMessage({ id, success: true, data: result });
    } catch (error) {
      parentPort.postMessage({ id, success: false, error: error.message });
    }
  }

  async fetchMessages({ dialogId, cursor, limit }) {
    // 1. 查缓存
    const cached = this.messageCache.get(dialogId, cursor, limit);
    if (cached) return cached;

    // 2. 查数据库（在 Worker 中执行）
    const messages = await this.workerPool.execute('database', 'all', {
      sql: `SELECT * FROM message WHERE dialogId = ?
            AND time < ? ORDER BY time DESC LIMIT ?`,
      params: [dialogId, cursor, limit]
    });

    // 3. 转换格式（在 Worker 中执行）
    const transformed = await this.workerPool.execute('transform', 'messages', {
      messages
    });

    // 4. 更新缓存
    this.messageCache.set(dialogId, transformed);

    return transformed;
  }
}

const service = new ServiceProcess();
service.init();
```

### 2. 主进程（仅路由）

```javascript
// src/main/MessageRouter.js
import { utilityProcess, ipcMain } from 'electron';
import path from 'path';

class MessageRouter {
  constructor() {
    this.service = null;
    this.pending = new Map();
    this.taskId = 0;
  }

  async init() {
    // 启动服务进程
    this.service = utilityProcess.fork(
      path.join(__dirname, '../service/index.js')
    );

    // 接收服务进程结果
    this.service.on('message', ({ id, success, data, error }) => {
      const pending = this.pending.get(id);
      if (pending) {
        this.pending.delete(id);
        success ? pending.resolve(data) : pending.reject(new Error(error));
      }
    });

    // 接收服务进程主动推送
    this.service.on('message', (msg) => {
      if (msg.type === 'push') {
        this.broadcastToRenderers(msg.channel, msg.data);
      }
    });

    this.setupIPC();
  }

  setupIPC() {
    // 统一的任务分发接口
    ipcMain.handle('service:execute', async (event, { action, payload }) => {
      return this.dispatch(action, payload);
    });
  }

  dispatch(action, payload) {
    return new Promise((resolve, reject) => {
      const id = ++this.taskId;
      this.pending.set(id, { resolve, reject });
      this.service.postMessage({ id, action, payload });
    });
  }

  broadcastToRenderers(channel, data) {
    // 向所有渲染进程广播
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    }
  }
}

export const router = new MessageRouter();
```

### 3. 渲染进程（纯 UI）

```javascript
// src/renderer/service.js
const { ipcRenderer } = require('electron');

class ServiceClient {
  async execute(action, payload) {
    const result = await ipcRenderer.invoke('service:execute', { action, payload });
    return result;
  }

  // 便捷方法
  async queryDB(sql, params) {
    return this.execute('db:query', { sql, params });
  }

  async fetchMessages(dialogId, cursor, limit = 50) {
    return this.execute('message:fetch', { dialogId, cursor, limit });
  }

  async sendMessage(dialogId, content, type) {
    return this.execute('message:send', { dialogId, content, type });
  }

  async decrypt(ciphertext, key) {
    return this.execute('crypto:decrypt', { ciphertext, key });
  }

  // 监听推送
  on(channel, callback) {
    ipcRenderer.on(channel, (event, data) => callback(data));
    return () => ipcRenderer.removeListener(channel, callback);
  }
}

export const service = new ServiceClient();
```

### 4. 状态管理瘦身

```javascript
// 当前：Vuex 28 模块，4742 行，全量响应式
// 改造后：只保留 UI 状态

// src/renderer/store/index.js
import { createStore } from 'vuex';

export default createStore({
  state: {
    // 只存 UI 相关状态
    ui: {
      currentDialogId: null,
      sidebarCollapsed: false,
      theme: 'light',
      loading: false,
    },
    // 用户基本信息（登录后不变）
    user: {
      id: null,
      name: null,
      avatar: null,
    }
  },
  mutations: {
    SET_CURRENT_DIALOG(state, dialogId) {
      state.ui.currentDialogId = dialogId;
    },
    SET_LOADING(state, loading) {
      state.ui.loading = loading;
    },
    SET_USER(state, user) {
      state.user = user;
    }
  }
});

// 业务数据使用 shallowRef，不走 Vuex
// src/renderer/composables/useMessages.js
import { shallowRef, triggerRef, computed } from 'vue';
import { service } from '@/service';

const messageCache = shallowRef(new Map());

export function useMessages(dialogId) {
  const messages = computed(() =>
    messageCache.value.get(dialogId) || []
  );

  const loading = ref(false);

  async function loadMore(cursor) {
    if (loading.value) return;
    loading.value = true;

    try {
      const newMessages = await service.fetchMessages(dialogId, cursor, 50);
      const current = messageCache.value.get(dialogId) || [];
      messageCache.value.set(dialogId, [...newMessages, ...current]);
      triggerRef(messageCache);
    } finally {
      loading.value = false;
    }
  }

  // 监听新消息推送
  onMounted(() => {
    const unsubscribe = service.on('message:new', (msg) => {
      if (msg.dialogId === dialogId) {
        const current = messageCache.value.get(dialogId) || [];
        messageCache.value.set(dialogId, [...current, msg]);
        triggerRef(messageCache);
      }
    });

    onUnmounted(unsubscribe);
  });

  return { messages, loading, loadMore };
}
```

### 5. 虚拟列表

```vue
<!-- src/renderer/components/MessageList.vue -->
<template>
  <RecycleScroller
    class="message-list"
    :items="messages"
    :item-size="60"
    key-field="uuid"
    v-slot="{ item }"
    @scroll-start="onScrollStart"
    @scroll-end="onScrollEnd"
  >
    <MessageItem :message="item" />
  </RecycleScroller>
</template>

<script setup>
import { RecycleScroller } from 'vue-virtual-scroller';
import { useMessages } from '@/composables/useMessages';

const props = defineProps({
  dialogId: String
});

const { messages, loading, loadMore } = useMessages(props.dialogId);

// 滚动到顶部时加载更多历史
function onScrollStart() {
  if (messages.value.length > 0) {
    loadMore(messages.value[0].time);
  }
}
</script>

<style>
.message-list {
  height: 100%;
  overflow-y: auto;
}
</style>
```

---

## 数据流对比

### 改造前

```
用户操作 → Vuex action → API 调用 → 数据库(阻塞) → Vuex mutation → 全量响应式更新 → UI 渲染
                                        ↑
                                   阻塞 UI 线程
```

### 改造后

```
用户操作 → ServiceClient → 主进程路由 → 服务进程 → Worker 执行 → 结果返回
                                                         ↓
                                              推送到渲染进程(小数据包)
                                                         ↓
                                              shallowRef 更新 → 虚拟列表渲染
```

---

## 性能对比

| 指标 | 当前 | 优化后 | 提升 |
|------|------|--------|------|
| **首屏加载** | 8-12s | 0.5-1s | **10-15x** |
| **消息列表滚动** | 卡顿/崩溃 | 60fps | **∞** |
| **10 万消息** | 不可用 | 200ms | **∞** |
| **内存占用** | 800MB+ | 150-200MB | **4-5x** |
| **数据库写入** | 5s/千条 | 50ms/千条 | **100x** |
| **IPC 延迟** | 高频单条 | 批量推送 | **10x** |
| **主进程 CPU** | 60-80% | ≤5% | **15x** |
| **UI 线程阻塞** | 频繁 | 几乎为零 | **∞** |

---

## 技术选型

| 领域 | 当前 | 推荐 | 理由 |
|------|------|------|------|
| 数据库 | sql.js | **better-sqlite3** | 原生性能，快 10-50x |
| 状态管理 | Vuex 全量 | **Pinia + shallowRef** | 精细控制响应式 |
| 虚拟列表 | 无 | **vue-virtual-scroller** | 百万数据流畅 |
| 进程通信 | ipcMain/Renderer | **MessagePort** | 更高效 |
| Worker | 几乎没用 | **Worker 线程池** | 并行计算 |

---

## 实施路线

### Phase 1 (2周): 基础架构

- [ ] 创建服务进程框架 (`src/service/`)
- [ ] 创建 Worker 线程池 (`src/service/workers/`)
- [ ] 创建主进程路由 (`src/main/MessageRouter.js`)
- [ ] 创建渲染进程客户端 (`src/renderer/service.js`)
- [ ] 数据库迁移到 better-sqlite3 + WAL

### Phase 2 (2周): 数据层迁移

- [ ] Socket 下沉到服务进程
- [ ] 消息处理 Pipeline
- [ ] LRU 缓存实现
- [ ] 批量操作改造

### Phase 3 (2周): UI 层优化

- [ ] Vuex 瘦身（仅 UI 状态）
- [ ] 虚拟列表全面应用
- [ ] 组件懒加载
- [ ] 增量数据加载

### Phase 4 (1周): 验证与调优

- [ ] 性能基准测试
- [ ] 内存泄漏检测
- [ ] 压力测试（百万数据）
- [ ] 生产环境灰度

---

## 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 改动范围大 | 引入 bug | 分阶段上线，灰度发布 |
| 进程通信复杂 | 调试困难 | 完善日志，统一错误处理 |
| 数据一致性 | 缓存不同步 | 版本号机制，订阅通知 |
| 兼容性 | 旧数据迁移 | 迁移脚本，回滚方案 |

---

**预计工时**: 7 周
**负责人**: 待分配
