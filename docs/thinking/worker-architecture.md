# Worker 架构设计

> 分析项目中适合 Worker 处理的场景，对比框架选型，设计整体 Worker 架构方案。

---

## 一、项目中适合 Worker 处理的内容

项目是 Electron + Vue 2 的 IM 应用，以下场景会阻塞 UI 线程。

### 高优先级（直接影响用户体验）

| 模块 | 文件 | 问题 |
|------|------|------|
| **文件哈希/SHA256** | `src/utils/FileSHAModule.js`、`src/utils/hashFile.js` | 大文件哈希同步计算，阻塞 UI |
| **消息加解密** | `src/utils/message/decryptUtils.js`、`src/utils/aes128gcm.js` | X25519/AES-GCM 批量解密卡顿 |
| **图片压缩** | `src/utils/files/compress.js` | Jimp + Canvas 压缩 CPU 密集 |
| **文件上传分片加密** | `src/tools/upload/encryptFile.js`、`src/utils/files/FileUploader.js` | 800KB 分片加密阻塞 |

### 中优先级

| 模块 | 文件 | 问题 |
|------|------|------|
| **FTS 全文搜索索引** | `src/utils/ftsDB/ftsService.js` | 批量插入 FTS 索引卡顿 |
| **离线消息处理** | `src/utils/message/offlineMsg.js` | 大量离线消息批量解密 |
| **日志加密** | `src/logs/cryptoLogUtil.js` | AES 加密日志写入 |
| **组织树处理** | `src/utils/chat/organizationUtils.js` | 已有 simple-web-worker 但未充分利用 |

---

## 二、Worker 框架选型对比

### Renderer 进程（Web Worker）

| 框架 | 包大小 | 特点 | 推荐度 |
|------|--------|------|--------|
| **Comlink** | 1.1kB | Google 出品，把 Worker 变成 async 函数调用，零样板代码 | ★★★★★ |
| **workerpool** | 较大 | 内置 Worker 池，自动任务排队，适合批处理 | ★★★★ |
| **threads.js** | 中等 | 同时支持 Web Worker 和 Node.js worker_threads | ★★★ |
| **workerize** | 小 | 简单模块转 Worker，功能较少 | ★★ |

**推荐组合：Comlink（简单通信）+ workerpool（池化批处理）**

### Main 进程（Node.js worker_threads）

直接使用 Node.js 原生 `worker_threads`，或用 `threads.js` 包装。适合数据库操作、文件处理等重计算。

### Worker 类型对比（Electron 上下文）

| 类型 | 可用性 | 适用场景 |
|------|--------|----------|
| Dedicated Worker | ✅ Renderer 可用 | 隔离的 CPU 密集任务 |
| SharedWorker | ❌ Electron 不支持 | — |
| Node.js worker_threads | ✅ Main 进程可用 | 数据库、文件处理、原生模块 |

### 决策矩阵

| 场景 | 推荐方案 |
|------|----------|
| Renderer - 简单任务 | Comlink + Web Workers |
| Renderer - Worker 池 | workerpool + Web Workers |
| Main - CPU 任务 | Node.js worker_threads |
| 跨平台 (web + Electron) | threads.js |
| 多窗口协调 | Electron IPC（非 SharedWorker） |

---

## 三、整体架构设计

```
┌─────────────────────────────────────────────────┐
│              Renderer Process (Vue 2)            │
│                                                  │
│  ┌──────────────┐    ┌───────────────────────┐  │
│  │  UI Thread    │◄──►│  Worker Manager       │  │
│  │  Vue/Vuex     │    │  (统一调度层)          │  │
│  └──────────────┘    └───────┬───────────────┘  │
│                              │                   │
│         ┌────────────────────┼──────────────┐   │
│         ▼                    ▼              ▼   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────┐ │
│  │ Crypto Worker│  │ File Worker  │  │ Search │ │
│  │ (Comlink)    │  │ Pool (4线程) │  │ Worker │ │
│  │ - 消息加解密  │  │ - SHA256     │  │ - FTS  │ │
│  │ - E2EE密钥   │  │ - 图片压缩   │  │ - 过滤  │ │
│  └─────────────┘  │ - 文件加密   │  └────────┘ │
│                    └──────────────┘              │
└────────────────────────┬────────────────────────┘
                         │ IPC
┌────────────────────────▼────────────────────────┐
│              Main Process                        │
│                                                  │
│  ┌──────────────┐    ┌───────────────────────┐  │
│  │  主线程       │    │  worker_threads Pool  │  │
│  │  - Socket     │    │  - 重型数据库查询      │  │
│  │  - IPC 路由   │    │  - 文件流加密          │  │
│  │  - 窗口管理   │    │  - 日志加密写入        │  │
│  └──────────────┘    └───────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 四、Worker Manager 统一调度层

```javascript
// workerManager.js - 统一入口
import { wrap, releaseProxy } from 'comlink';
import workerpool from 'workerpool';

class WorkerManager {
  constructor() {
    this.cryptoWorker = null;   // 单例 - 常驻
    this.searchWorker = null;   // 单例 - 常驻
    this.filePool = null;       // 池 - 动态伸缩
  }

  // 懒加载 Crypto Worker（常驻，消息加解密高频使用）
  getCryptoWorker() {
    if (!this.cryptoWorker) {
      const worker = new Worker(
        new URL('./workers/crypto.worker.js', import.meta.url)
      );
      this.cryptoWorker = wrap(worker);
    }
    return this.cryptoWorker;
  }

  // 文件处理池（动态，控制并发）
  getFilePool() {
    if (!this.filePool) {
      this.filePool = workerpool.pool(
        new URL('./workers/file.worker.js', import.meta.url).href,
        {
          maxWorkers: Math.min(navigator.hardwareConcurrency || 4, 4),
          workerType: 'web'
        }
      );
    }
    return this.filePool;
  }

  // 销毁所有 Worker
  destroy() {
    this.cryptoWorker?.[releaseProxy]();
    this.filePool?.terminate();
  }
}

export default new WorkerManager();
```

---

## 五、各 Worker 实现示例

### 5.1 Crypto Worker（Comlink）

```javascript
// workers/crypto.worker.js
import { expose } from 'comlink';
import { box, randomBytes } from 'tweetnacl';

const cryptoApi = {
  // 消息加密
  async encryptMessage(plaintext, sharedKey) {
    const nonce = randomBytes(24);
    const encrypted = box.after(
      new TextEncoder().encode(plaintext), nonce, sharedKey
    );
    return { encrypted, nonce };
  },

  // 批量消息解密（离线消息场景）
  async decryptBatch(messages, keyMap) {
    return messages.map(msg => {
      const key = keyMap[msg.sessionId];
      return { ...msg, content: decrypt(msg.content, key) };
    });
  },

  // AES-GCM 文件块加密
  async encryptChunk(chunk) {
    // chunk 是 ArrayBuffer，通过 transferable 传入
    // ... 加密逻辑
    return encryptedBuffer;
  }
};

expose(cryptoApi);
```

### 5.2 文件处理 Worker（workerpool）

```javascript
// workers/file.worker.js
import workerpool from 'workerpool';
import SparkMD5 from 'spark-md5';

function hashFile(arrayBuffer) {
  const spark = new SparkMD5.ArrayBuffer();
  spark.append(arrayBuffer);
  return spark.end();
}

function compressImage(imageData, quality) {
  // OffscreenCanvas 压缩（不依赖 DOM）
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageData, 0, 0);
  return canvas.convertToBlob({ type: 'image/jpeg', quality });
}

workerpool.worker({ hashFile, compressImage });
```

### 5.3 Vue 组件中使用

```javascript
// 在 Vue 组件或 Vuex action 中
import workerManager from '@/workerManager';

export default {
  methods: {
    async sendMessage(text) {
      const crypto = workerManager.getCryptoWorker();
      // 像调用普通 async 函数一样
      const { encrypted, nonce } = await crypto.encryptMessage(
        text, this.sharedKey
      );
      this.$socket.emit('message', { encrypted, nonce });
    },

    async uploadFile(file) {
      const pool = workerManager.getFilePool();
      const buffer = await file.arrayBuffer();
      // 自动排队，控制并发
      const hash = await pool.exec('hashFile', [buffer]);
      // ...
    }
  }
}
```

---

## 六、数据传输性能

### Structured Clone vs Transferable

| 方式 | 32MB ArrayBuffer | 原始数据 |
|------|------------------|----------|
| Structured Clone（默认复制） | ~300ms | 保留可用 |
| Transferable（零拷贝转移） | ~6ms（快 50 倍） | 转移后不可用 |

**原则**：大于 1MB 的二进制数据用 Transferable，小对象用默认 Structured Clone。

```javascript
// 大文件用 transfer
const buffer = await file.arrayBuffer();
worker.postMessage({ type: 'hash', buffer }, [buffer]);
// 注意：transfer 后原始 buffer 不可用

// 小数据用默认 structured clone
worker.postMessage({ type: 'encrypt', text: message });
```

### Transferable 支持的类型

- `ArrayBuffer`
- `MessagePort`
- `ImageBitmap`
- `OffscreenCanvas`

> 注意：TypedArray（Int32Array、Uint8Array 等）本身不可 transfer，但其底层 `ArrayBuffer` 可以。

---

## 七、Electron 安全注意事项

```javascript
// 必须保持默认 false
webPreferences: {
  nodeIntegrationInWorker: false  // 开启会导致 XSS → RCE
}
```

这意味着 Renderer 的 Web Worker 中**不能使用 Node.js 模块**（fs、path 等）。需要 Node 能力的计算应放到 Main 进程的 `worker_threads` 中。

---

## 八、Webpack 配置

### Webpack 5（推荐）

Webpack 5 原生支持 Web Worker，无需额外 loader：

```javascript
const worker = new Worker(
  new URL('./workers/crypto.worker.js', import.meta.url)
);
```

### Webpack 4（需要 worker-loader）

```javascript
// vue.config.js
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('worker')
      .test(/\.worker\.js$/)
      .use('worker-loader')
      .loader('worker-loader')
      .end();
  }
}
```

---

## 九、落地实施路线

### 第一阶段 — 最高收益

1. 文件哈希（`hashFile.js` / `FileSHAModule.js`）→ File Worker Pool
2. 消息加解密（`decryptUtils.js`）→ Crypto Worker (Comlink)

### 第二阶段 — 改善体验

3. 图片压缩（`compress.js`）→ File Worker Pool + OffscreenCanvas
4. 离线消息批量处理（`offlineMsg.js`）→ Crypto Worker 批量接口

### 第三阶段 — 锦上添花

5. FTS 索引（`ftsService.js`）→ Search Worker
6. 日志加密（`cryptoLogUtil.js`）→ Main 进程 worker_threads

### 涉及文件统计

| Worker 类型 | 涉及文件数 | 涉及调用次数 | 预期收益 |
|-------------|-----------|-------------|----------|
| File Worker (哈希/压缩) | 20+ | ~50 | 大文件不卡 UI |
| Crypto Worker (加解密) | 18 | ~100 | 50ms → 5ms |
| FTS Worker (全文搜索) | 5 | 31 | 搜索响应 10x |
| Transform Worker (JSON) | 162 | 620 | 内存减 60% |

---

**创建日期**: 2026-02-08
**分析基础**: 项目源码 741 JS 文件 + 402 Vue 文件
