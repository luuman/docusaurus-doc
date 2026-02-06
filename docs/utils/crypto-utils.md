# 加密工具

本文档介绍项目中的加密相关工具函数，包括 AES-256-GCM 加解密引擎、CA 证书管理工具、E2EE Ping 通信工具。

---

## 目录

- [核心文件结构](#核心文件结构)
- [aes128gcm - AES-256-GCM 加密引擎](#aes128gcm---aes-256-gcm-加密引擎)
- [FileSHAModule - 加密工具集](#fileshamodule---加密工具集)
- [caTool - CA 证书管理](#catool---ca-证书管理)
- [E2EEPingUtil - 端到端加密 Ping 工具](#e2eepingutil---端到端加密-ping-工具)

---

## 核心文件结构

```
src/utils/
├── aes128gcm.js         # AES-256-GCM 加解密核心引擎（CryptoGcm 类）
├── FileSHAModule.js     # 上层加密工具封装（AES 加解密、SHA256、HMAC）
├── caTool.js            # CA 证书加解密与管理
└── E2EEPingUtil.js      # E2EE Ping 消息生产与发送
```

---

## aes128gcm - AES-256-GCM 加密引擎

**文件**: `src/utils/aes128gcm.js`

> 注意: 虽然文件名为 `aes128gcm`，实际使用的算法是 **AES-256-GCM**（`aes-256-gcm`）。

### CryptoGcm 类

基于 Node.js `crypto` 模块封装的 AES-256-GCM 加解密类，使用 WeakMap 管理密钥生命周期以防止内存泄露。

#### 构造函数

```javascript
import { CryptoGcm } from '@/utils/aes128gcm';

const cipher = new CryptoGcm({
    key: encryptionKey,         // Buffer 类型的加密密钥
    encoding: {
        plaintext: 'buffer',    // 明文编码: 'ascii' | 'utf8' | 'buffer'
        payload: 'buffer'       // 密文编码: 'base64' | 'hex' | 'buffer'
    }
});
```

**参数**:
- `options.key` (Buffer): 32 字节的 AES-256 密钥
- `options.encoding.plaintext` (string): 明文编码格式
- `options.encoding.payload` (string): 密文编码格式

#### encrypt(plaintext, iv)

加密数据。输出包含密文和 16 字节认证标签（Auth Tag）。

```javascript
const encrypted = cipher.encrypt(plainBuffer, ivBuffer);
// encrypted: Buffer (密文 + 16字节 Auth Tag)
```

**参数**:
- `plaintext` (Buffer | string): 待加密数据
- `iv` (Buffer): 初始化向量

**返回**: `Buffer | string | false` - 加密后的数据（格式由 `encoding.payload` 决定）

#### decrypt(payload, iv)

解密数据。自动分离密文和认证标签进行验证。

```javascript
const decrypted = cipher.decrypt(encryptedBuffer, ivBuffer);
// decrypted: Buffer (明文数据)
```

**参数**:
- `payload` (Buffer | string): 加密数据（密文 + Auth Tag）
- `iv` (Buffer): 初始化向量

**返回**: `Buffer | string | false` - 解密后的明文，认证失败返回 `false`

#### destroy()

销毁实例，从 WeakMap 中删除密钥引用。

```javascript
cipher.destroy();
// 之后调用 encrypt/decrypt 将抛出 'instance has been destroyed' 错误
```

### 安全设计

- **密钥存储**: 使用 `WeakMap` 存储密钥，实例被 GC 后密钥自动回收
- **认证标签**: GCM 模式自带 16 字节认证标签，保证数据完整性
- **最小载荷**: 密文最小长度为 17 字节（1 字节密文 + 16 字节 Tag）

### 完整加解密示例

```javascript
import { CryptoGcm } from '@/utils/aes128gcm';

// 初始化
const cg = new CryptoGcm({
    key: Buffer.from(aesKeyHex, 'hex'),    // 32 字节密钥
    encoding: {
        plaintext: 'buffer',
        payload: 'buffer'
    }
});

// 加密
const iv = Buffer.from(aesIvHex, 'hex');   // 初始化向量
const encrypted = cg.encrypt(Buffer.from('Hello World'), iv);

// 解密
const decrypted = cg.decrypt(encrypted, iv);
console.log(decrypted.toString('utf8'));    // "Hello World"

// 清理
cg.destroy();
```

---

## FileSHAModule - 加密工具集

**文件**: `src/utils/FileSHAModule.js`

FileSHAModule 在 `CryptoGcm` 基础上封装了面向文件传输的加解密方法，以及 SHA256/HMAC-SHA256 哈希计算。详细的函数签名可参考 [文件处理工具](./file-utils.md#fileshamodule---文件加密模块)。

### 核心函数一览

| 函数名 | 签名 | 说明 |
|--------|------|------|
| `AESDecrypt` | `(aesKey, aesIv, filePieceBuf) => Promise&lt;Buffer&gt;` | AES-256-GCM 解密文件片段 |
| `AESEncrypt` | `(aesKey, aesIv, fileBaseBuf) => Promise&lt;ArrayBuffer&gt;` | AES-256-GCM 加密文件片段 |
| `generateRandomAlphaNum` | `(len, isHex) => string` | 生成随机字符串 |
| `getHmacSHA256` | `(fileArrayBuffer, secret) => CryptoJS.WordArray` | 计算 HMAC-SHA256 |
| `getSHA256` | `(fileArrayBuffer) => CryptoJS.WordArray` | 计算 SHA256 哈希 |
| `hexStrToString` | `(hexStr) => string` | hex 转字符串 |
| `stringToHex` | `(str) => string` | 字符串转 hex |
| `toArrayBuffer` | `(buf) => ArrayBuffer` | Buffer 转 ArrayBuffer |

### 文件传输加密流程

```
上传流程:
  1. generateRandomAlphaNum(64, true) 生成 aesKey
  2. generateRandomAlphaNum(32, true) 生成 HmacSHA256Key
  3. AESEncrypt(aesKey, aesIv, fileBuffer) 加密文件分片
  4. getSHA256(encryptedBuffer) 计算分片 SHA256
  5. getHmacSHA256(encryptedBuffer, hmacKey) 计算 HMAC 签名
  6. 上传加密数据 + SHA256 + HMAC 到服务器

下载流程:
  1. 从消息 meta 中获取 iKey(aesKey) 和 sha256
  2. aesIv = sha256.substr(16, 32) 截取 IV
  3. AESDecrypt(iKey, aesIv, encryptedBuffer) 解密分片
  4. 合并分片为完整文件
```

---

## caTool - CA 证书管理

**文件**: `src/utils/caTool.js`

caTool 管理应用的 CA 根证书，证书以 AES 加密的形式存储在代码中，运行时解密使用。支持多环境（在线环境、私有化部署、Meydan 定制版）的证书管理。

### 导入方式

```javascript
const { getonlineCa, encryptCa, getCurrentCa, caFiles } = require('@/utils/caTool');
```

### getonlineCa(ca)

获取在线环境的 CA 证书内容。根据当前环境配置自动选择对应证书。

```javascript
const caCert = getonlineCa();
// 返回解密后的 CA 证书 PEM 内容
```

**环境判断逻辑**:
1. Meydan 定制版: 使用 `currentConfig.crt` 中的证书
2. 私有化部署 (`envConfig.isPrivated`): 使用 `caFiles['20220625ca']` 证书
3. 在线环境: 使用 `caOnline` 默认证书

### encryptCa(ca, password)

加密 CA 证书内容，用于存储或传输。

```javascript
const encrypted = encryptCa(certPem);
// 返回 AES 加密后的 Base64 字符串
```

**参数**:
- `ca` (string): 证书 PEM 内容
- `password` (string): 加密密码，默认使用内置密码

### getCurrentCa(ca)

解密指定的 CA 证书字符串。

```javascript
const certPem = getCurrentCa(encryptedCaString);
```

### caFiles 对象

内置的证书映射表，存储不同版本的加密证书数据。

```javascript
caFiles['20220625ca']  // 2022年6月部署的 CA 证书（加密存储）
```

---

## E2EEPingUtil - 端到端加密 Ping 工具

**文件**: `src/utils/E2EEPingUtil.js`

E2EE Ping 是端到端加密通信中的握手机制，用于建立和验证加密密钥通道。E2EEPingUtil 管理 Ping 消息的生产、发送和队列调度。

### 导入方式

```javascript
import E2EEPingUtil from '@/utils/E2EEPingUtil';
```

### setNeedSendPingUserList(peerIdList, spaceId)

将需要发送 Ping 的用户列表写入本地数据库。

```javascript
await E2EEPingUtil.setNeedSendPingUserList(['peerHid1', 'peerHid2'], spaceId);
```

**参数**:
- `peerIdList` (`Array&lt;string&gt;`): 需要 Ping 的用户 HID 列表
- `spaceId` (string): 空间 ID

**返回**: `Promise&lt;boolean&gt;` - 写入是否成功

### getNeedSendPingUserList(spaceId)

从本地数据库获取待 Ping 的用户列表。

```javascript
const peerIds = await E2EEPingUtil.getNeedSendPingUserList(spaceId);
// ['peerHid1', 'peerHid2', ...]
```

### delNeedSendPingUserList(peerIdList, spaceId)

Ping 完成后从数据库中删除已处理的用户。

```javascript
await E2EEPingUtil.delNeedSendPingUserList(['peerHid1'], spaceId);
```

### checkIsPingMessage(a)

判断消息类型是否为 E2EE Ping 消息（消息类型代码为 13）。

```javascript
E2EEPingUtil.checkIsPingMessage(13);  // true
E2EEPingUtil.checkIsPingMessage(1);   // false
```

### produceBatchPingMsgParm(peerIdSet, uid)

批量生产 Ping 消息参数，不进行实际加密（仅构造明文 "PING"）。

```javascript
const result = E2EEPingUtil.produceBatchPingMsgParm(peerIdSet, myUid);
// result: { plainTextArray, uidArray, deviceArray, pingArray }
```

**参数**:
- `peerIdSet` (Object): 以 peerHid 为 key、设备列表为 value 的映射
  ```javascript
  {
      'peerHid1': { 'deviceId1': 'web', 'deviceId2': 'mobile' },
      'peerHid2': { 'deviceId3': 'desktop' }
  }
  ```
- `uid` (string): 当前用户 UID

### producePingMsgParm(peerIdSet, selfUid, spaceId)

生产带 E2EE 加密的 Ping 消息参数。每个设备独立加密。

```javascript
const pingArray = await E2EEPingUtil.producePingMsgParm(peerIdSet, myUid, spaceId);
// pingArray: [{ cipher, peerUid, meTo, isE2EE, isSyncFrom, spaceId }, ...]
```

**流程**:
1. 遍历每个 peer 的每个设备
2. 调用 SDK `E2EE-Help-Method` 方法 4 进行加密
3. 构造包含密文和路由信息的 Ping 参数

### sendE2EPinMessage()

从 store 的 pinList 中取出待发送的 Ping 消息，通过 Socket 批量发送。

```javascript
await E2EEPingUtil.sendE2EPinMessage();
```

### addSendPingTask()

将 Ping 发送任务加入队列，保证串行执行（最大并发 1）。

```javascript
E2EEPingUtil.addSendPingTask();
```

### E2EE Ping 完整流程

```
1. 收到新联系人或设备变更通知
2. setNeedSendPingUserList 记录待 Ping 用户
3. getNeedSendPingUserList 获取列表
4. producePingMsgParm 为每个用户的每个设备生成加密 Ping 参数
5. 将 pingArray 写入 store.state.uiControl.pinList
6. addSendPingTask -> sendE2EPinMessage 通过 Socket 发送
7. delNeedSendPingUserList 清理已完成的 Ping 记录
```

---

## 加密体系总览

| 层次 | 模块 | 算法 | 用途 |
|------|------|------|------|
| 底层引擎 | `aes128gcm.js` | AES-256-GCM | 通用对称加解密 |
| 文件加密 | `FileSHAModule.js` | AES-256-GCM + SHA256 + HMAC-SHA256 | 文件分片加解密与完整性验证 |
| 密码哈希 | `dataUtil.js` | SHA256 (crypto-js) | 用户密码哈希（加盐） |
| 证书管理 | `caTool.js` | AES (crypto-js) | CA 证书加密存储 |
| 端到端加密 | `E2EEPingUtil.js` | E2EE SDK 封装 | 加密通道握手 |
