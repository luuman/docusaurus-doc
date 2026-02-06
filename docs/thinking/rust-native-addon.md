# Rust Native Addon 性能优化分析

> 分析项目中哪些模块适合抽离到 Rust，通过 `napi-rs` 编译为 Node.js native addon，替代现有 JS 实现以获得更优性能。

## 背景

当前项目存在以下性能瓶颈：

- `crypto-js` 纯 JS 实现的加密算法，比 Node.js 原生 `crypto` 慢 5-10 倍
- `ffi-napi` 每次 DLL 调用有显著的序列化/反序列化开销
- 大文件分片处理时多次 Buffer 拷贝
- 数据库批量操作中 JS ↔ Native 频繁上下文切换

---

## Tier 1: 高收益，强烈推荐

### 1. 文件哈希与加解密

**涉及文件：**
- `src/utils/FileSHAModule.js` — SHA-256 / HMAC-SHA256 / AES 加解密
- `src/utils/aes128gcm.js` — AES-256-GCM 封装

**现状问题：**

```javascript
// FileSHAModule.js - 使用 crypto-js 纯 JS 实现
var wordArray = CryptoJS.lib.WordArray.create(fileArrayBuffer);
var sha256Str = CryptoJS.SHA256(wordArray); // 比原生慢 5-10x

// toArrayBuffer() 手动逐字节拷贝，效率极低
function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
```

- `crypto-js` 是纯 JS 实现，大文件 hash 计算非常慢
- 每次加解密都要创建 `CryptoGcm` 实例，开销大
- `toArrayBuffer()` 逐字节拷贝完全可以零拷贝

**Rust 收益：**
- 使用 `ring` 或 `rust-crypto` 做 AES-256-GCM / SHA-256，比 crypto-js 快 **20-50 倍**
- Rust 可直接操作 Buffer 零拷贝，避免 JS 中反复的 `Buffer.from()` 和 `toArrayBuffer()` 转换
- 通过 `napi-rs` 编译为 `.node` 文件，替代现有的 `ffi-napi` 调用

**建议接口：**

```rust
use napi_derive::napi;
use napi::bindgen_prelude::*;

#[napi]
fn aes_gcm_encrypt(plaintext: Buffer, key: Buffer, iv: Buffer) -> Result<Buffer> { ... }

#[napi]
fn aes_gcm_decrypt(ciphertext: Buffer, key: Buffer, iv: Buffer) -> Result<Option<Buffer>> { ... }

#[napi]
fn sha256(data: Buffer) -> Result<String> { ... }

#[napi]
fn hmac_sha256(data: Buffer, secret: Buffer) -> Result<String> { ... }

/// 流式计算大文件 hash，不阻塞 event loop
#[napi]
fn file_sha256_stream(file_path: String) -> AsyncTask<Sha256Task> { ... }
```

---

### 2. 数据库操作层 — 替换 `@journeyapps/sqlcipher`

**涉及文件：**
- `src/utils/SqliteUtil.js` — 数据库工具函数
- `src/utils/logicDBConnect.js` — 连接管理
- `src/utils/ftsDB/` — 全文搜索

**现状问题：**

```javascript
// SqliteUtil.js - 批量插入在 JS 循环中逐条调用 stmt.run()
dbInstance.serialize(async function () {
    dbInstance.run('BEGIN');
    const stmt = dbInstance.prepare(`insert or ignore into IndexTable (...) VALUES (...)`);
    for (let queryIdx = 0; queryIdx < bodyRows.length; queryIdx++) {
        // 每次 stmt.run() 都是一次 JS ↔ Native 跨界调用
        stmt.run(queryParm);
    }
    stmt.finalize();
    dbInstance.run('COMMIT', transP(resolve, reject));
});
```

- 批量插入 FTS 索引时（`betchInsertFtsMsg`、`betchSetupFtsMsg`）在 JS 循环中逐条调用 `stmt.run()`
- 每次数据库操作都要 `await getDBInstance()` 获取连接，有 Promise 开销
- FTS5 全文搜索在大消息量时性能下降明显

**Rust 收益：**
- 使用 `rusqlite` + `sqlcipher` 直接管理加密数据库
- 批量操作在 Rust 侧一次性完成循环 + 事务，减少 JS ↔ Native 上下文切换（当前每条 `stmt.run()` 都是一次跨界调用）
- 连接池管理在 Rust 侧实现，比 JS 的 `WeakMap` + `Promise` 更高效
- 预估批量插入性能提升 **3-10 倍**

**建议接口：**

```rust
#[napi]
fn batch_insert_fts(
    db_path: String,
    key: String,
    rows: Vec<FtsRow>
) -> Result<u32> { ... }

#[napi]
fn query_fts(
    db_path: String,
    key: String,
    keyword: String,
    limit: u32
) -> Result<Vec<SearchResult>> { ... }

#[napi]
fn batch_upsert(
    db_path: String,
    key: String,
    table: String,
    rows: Vec<serde_json::Value>
) -> Result<u32> { ... }
```

---

### 3. 文件分片处理

**涉及文件：**
- `src/utils/FileTool.js`（1262 行）— 文件上传/下载/分片
- `src/api/FileApi.js` — 文件 API

**现状问题：**

```javascript
// bytesToBase64() 纯 JS 手动 base64 编码
function bytesToBase64(bytes) {
    let mod3;
    let result = '';
    for (let nLen = bytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
        // ... 逐字节处理
    }
}
```

- 大文件上传/下载时需要分片、hash 校验、加密、base64 编码
- 整个流程：读取分片 → SHA256 → AES 加密 → 上传，全在主进程或渲染进程
- 多次 Buffer 拷贝，内存占用高

**Rust 收益：**
- 文件分片 + hash + 加密一次性管道处理，避免多次 Buffer 拷贝
- 流式处理大文件，内存占用从 O(fileSize) 降到 O(chunkSize)
- 预估大文件处理性能提升 **5-15 倍**

**建议接口：**

```rust
#[napi]
fn prepare_file_chunks(
    file_path: String,
    chunk_size: u32,
    aes_key: Buffer,
    aes_iv: Buffer,
) -> AsyncTask<FileChunkTask> { ... }
// 返回: Vec<{ chunk: Buffer, sha256: String, index: u32 }>
```

---

## Tier 2: 中等收益

### 4. 替换 ffi-napi 调用

**涉及文件：**
- `src/main/winUser32.js`（493 行）— Windows API 调用
- `src/main/meetingSDK.js`（2390 行）— 会议 SDK DLL 调用

**现状问题：**
- `ffi-napi` 每次 DLL 调用有显著序列化/反序列化开销
- `meetingSDK.js` 频繁调用 native DLL
- `ffi-napi`、`ref-napi`、`ref-struct-napi`、`ref-array-napi` 四个依赖在 Electron 升级时经常出兼容性问题

**Rust 收益：**
- `napi-rs` 直接静态链接或 `libloading` 动态加载 DLL，零 FFI overhead
- 所有 Win32 API 和 Meeting SDK 调用封装为一个 `.node` addon
- 消除四个 napi 相关依赖，Electron 升级更稳定

**建议接口：**

```rust
#[napi]
fn find_window(class_name: Option<String>, window_name: Option<String>) -> Result<i64> { ... }

#[napi]
fn set_foreground_window(hwnd: i64) -> Result<bool> { ... }

#[napi]
fn meeting_sdk_init(config: MeetingSdkConfig) -> Result<MeetingSdkHandle> { ... }
```

---

### 5. 消息解析与转换

**涉及文件：**
- `src/utils/dataUtil.js`（840 行）— 数据转换
- `src/socket/messageTemplate.js`（600+ 行）— 消息模板
- `src/socket/handlePush.js`（400+ 行）— 推送处理

**现状问题：**
- 大量正则匹配（URL、email、IP 检测）
- 消息体 JSON 解析和转换，每条消息都要经过
- 离线历史消息同步时存在消息洪流

**Rust 收益：**
- Rust 的正则引擎（`regex` crate）比 JS 快 **2-5 倍**
- 批量消息解析可在 Rust 侧一次处理
- 单条消息处理时间本身不长，收益相对有限

---

## Tier 3: 可以考虑但优先级较低

### 6. 日志加密系统

当前用 JS 做日志加密写入，可以用 Rust 做异步批量加密写入，减少 I/O 阻塞。

### 7. 图片压缩/缩略图生成

替代 `jimp`（纯 JS 图像处理），使用 Rust `image` crate，图片处理速度提升 **10-20 倍**。

---

## 推荐实施路径

```
Phase 1: napi-rs 基础 addon（替代 crypto-js + ffi-napi）
  ├── AES-256-GCM 加解密
  ├── SHA-256 / HMAC-SHA256
  ├── 文件流式 hash
  └── Win32 API 封装

Phase 2: 数据库层优化
  ├── rusqlite + sqlcipher 连接管理
  ├── 批量 FTS 索引构建
  └── 高频查询缓存

Phase 3: 文件处理管道
  ├── 分片 + hash + 加密一体化
  └── 流式上传/下载
```

## 技术栈选型

| 选项 | 说明 | 推荐 |
|------|------|------|
| **napi-rs** | Rust → Node.js addon，编译为 `.node` 文件 | **推荐** |
| node-bindgen | 类似 napi-rs，社区较小 | 不推荐 |
| wasm-bindgen | 编译为 WASM，无法调用系统 API | 不适用 |

**选择 `napi-rs` 的理由：**
- 直接编译为 `.node` 文件，与 Electron 兼容性好
- 支持 `AsyncTask`（不阻塞 Node.js event loop）
- 可以调用 Windows API、加载 DLL
- 活跃的社区，`swc`、`Rspack` 等知名项目在用
- 支持 GitHub Actions 交叉编译多平台

## 预估总体收益

| 模块 | 当前方案 | Rust 方案 | 预估提升 |
|------|----------|-----------|----------|
| AES-GCM 加解密 | crypto-js / Node crypto | ring | 20-50x |
| SHA-256 hash | crypto-js | ring | 20-50x |
| 大文件流式 hash | JS 分块读取 + crypto-js | Rust 流式 | 10-30x |
| DB 批量插入 | JS 循环 stmt.run() | rusqlite 批量 | 3-10x |
| FTS 搜索 | sqlcipher node binding | rusqlite FTS5 | 2-5x |
| 文件分片加密 | JS 多步骤 | Rust 管道 | 5-15x |
| FFI 调用 | ffi-napi | libloading | 2-5x |
| 图片处理 | jimp (纯 JS) | image crate | 10-20x |

> **Phase 1 的投入产出比最高** — 改动面小（只替换几个工具函数），但能直接解决加解密和 FFI 两个最大的性能瓶颈。
