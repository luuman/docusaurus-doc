# 日志加密机制

本文档详细说明 MATRX Windows 客户端日志系统的加密实现，包括加密算法、密钥派生、加密格式和解密方法。

## 概述

日志加密用于保护生产环境中的敏感日志内容，防止日志泄露导致的安全风险。系统使用 AES-CTR 模式加密，密钥通过 SHA-256 从密码派生。

## encrypt.js 加密模块详解

位置: `src/logs/lib/encrypt.js`

### 完整源码解析

```javascript
let crypto = require('crypto');
let pureAes = require('aes-js');

// 字符串反转函数 - 用于混淆加密结果
function reverse(xs) {
    xs = Array.isArray(xs) ? xs : xs.split('');
    if (xs.length == 0) {
        return '';
    } else {
        return xs.reverse().join('');
    }
}

// 分隔符：用于分离日志级别和消息内容
const joinSep = ')=> ';

// 默认盐值/密码
let salt = 'empty';

// AES-CTR 加密函数
function encrypt(text, password) {
    // 1. 使用 SHA-256 派生 128 位密钥
    let hash = crypto.createHash('sha256');
    hash.update(password || salt);
    let key128 = hash.digest().slice(0, 16);  // 取前 16 字节 (128 bits)

    // 2. 将文本转换为字节数组
    let textbytes = pureAes.utils.utf8.toBytes(text);

    // 3. 使用 AES-CTR 模式加密
    let ctr = new pureAes.ModeOfOperation.ctr(key128);
    let outBytes = ctr.encrypt(textbytes);

    // 4. 转换为 Base64 编码
    return Buffer.from(outBytes).toString('base64');
}

// 加密字符串并添加标记
function encryptStr(str, password) {
    return '|+|' + reverse(encrypt(str, password));
}

module.exports = {encryptStr, joinSep};
```

### 核心组件说明

| 组件 | 说明 |
|------|------|
| `crypto` | Node.js 内置加密模块，用于 SHA-256 |
| `aes-js` | 纯 JavaScript AES 实现库 |
| `joinSep` | 分隔符 `)=> `，分离日志级别和消息 |
| `salt` | 默认密码 `'empty'` |

## AES-CTR 加密流程

### 加密步骤详解

```
原始日志消息
    │
    ▼
┌─────────────────────┐
│  SHA-256 密钥派生   │
│  password → 256 bits│
│  截取前 128 bits    │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  UTF-8 编码转换     │
│  string → bytes     │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  AES-CTR 加密       │
│  plaintext → cipher │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Base64 编码        │
│  bytes → string     │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  字符串反转混淆     │
│  reverse(base64)    │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  添加加密标记       │
│  '|+|' + reversed   │
└─────────────────────┘
    │
    ▼
最终加密日志
```

### AES-CTR 模式特点

- **流式加密**: 支持任意长度数据，无需填充
- **计数器模式**: 每次加密使用递增计数器生成密钥流
- **并行处理**: 加密/解密可并行化
- **无需 IV 传输**: CTR 模式使用内置计数器

## SHA-256 密钥派生

### 派生过程

```javascript
let hash = crypto.createHash('sha256');
hash.update(password || salt);
let key128 = hash.digest().slice(0, 16);
```

### 详细说明

1. **输入**: 密码字符串（生产环境: `'empty'`，开发环境: 空字符串）
2. **哈希**: 使用 SHA-256 生成 256 位（32 字节）摘要
3. **截取**: 取前 128 位（16 字节）作为 AES 密钥
4. **输出**: 16 字节的 AES-128 密钥

### 密钥派生图示

```
Password: "empty"
    │
    ▼ SHA-256
┌────────────────────────────────────────────────────────────────┐
│ 32 字节 (256 bits) SHA-256 摘要                                 │
│ e3b0c442...98f3cde3...d8e9b5c4...f5c6e8a9...                   │
└────────────────────────────────────────────────────────────────┘
    │
    ▼ slice(0, 16)
┌────────────────────────────────┐
│ 16 字节 (128 bits) AES 密钥    │
│ e3b0c442...98f3cde3...         │
└────────────────────────────────┘
```

## 加密日志格式

### 格式结构

```
[时间戳] (级别)=> |+|加密内容(反转后的Base64)
```

### 格式示例

未加密（开发环境）:
```
[2024-01-15 10:30:45.123] (INFO)=> 用户登录成功, userId: 12345 [login.js:42]
```

加密后（生产环境）:
```
[2024-01-15 10:30:45.123] (INFO)=> |+|=QWxhZGRpbjpvcGVuIHNlc2FtZQ== [login.js:42]
```

### 加密标记 `|+|`

- **作用**: 标识后续内容为加密数据
- **位置**: 紧接在分隔符 `)=> ` 之后
- **用途**: 解密工具通过此标记识别需要解密的内容

### 内容分割

日志格式中使用 `)=> ` 作为分隔符:

```javascript
const joinSep = ')=> ';

// 在 layouts.js 中的处理
let str = formattedString.split(joinSep);
const prev = str.shift();  // 时间戳和级别部分
if (password) {
    str = encryptStr(str, password);  // 加密消息部分
}
formattedString = prev + joinSep + str;
```

## cryptoLogUtil.js 加密工具

位置: `src/logs/cryptoLogUtil.js`

### 功能概述

提供独立的日志加密工具，用于在非核心日志系统中进行加密。

### 核心函数

```javascript
// 字符串反转
function reverse(xs) {
    xs = Array.isArray(xs) ? xs : xs.split('');
    if (xs.length == 0) {
        return '';
    } else {
        return xs.reverse().join('');
    }
}

// AES-CTR 加密
function encrypt(text) {
    let hash = crypto.createHash('sha256');
    hash.update(salt);
    let key128 = hash.digest().slice(0, 16);
    let textbytes = pureAes.utils.utf8.toBytes(text);
    let ctr = new pureAes.ModeOfOperation.ctr(key128);
    let outBytes = ctr.encrypt(textbytes);
    return Buffer.from(outBytes).toString('base64');
}

// 加密字符串（根据环境判断）
function encryptStr(str) {
    if (debug) {
        return str;  // 开发环境不加密
    } else {
        return '|+|' + reverse(encrypt(str));  // 生产环境加密
    }
}

// 初始化独立日志实例
function initLog(fileName = 'app', size) {
    // 配置并返回加密日志实例
}

// 包装日志方法进行加密
function encryptLog(log) {
    return {
        error(...args) { log.error(encryptStr(args)); },
        warn(...args) { log.warn(encryptStr(args)); },
        log(...args) { log.log(encryptStr(args)); },
        info(...args) { log.info(encryptStr(args)); },
        debug(...args) { log.debug(encryptStr(args)); },
        initKey(key) { log.info(encryptStr(`initKey=> ${key}`)); }
    };
}
```

### 使用场景

```javascript
const {initLog} = require('@/logs/cryptoLogUtil');

// 创建独立的加密日志实例
const myLog = initLog('my-feature');
myLog.info('敏感操作', { userId, action });
```

## 解密方法

### 解密流程

```
加密日志行
    │
    ▼
提取 |+| 后的内容
    │
    ▼
┌─────────────────────┐
│  字符串反转还原     │
│  reversed → base64  │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Base64 解码        │
│  string → bytes     │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  SHA-256 密钥派生   │
│  (与加密相同)       │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  AES-CTR 解密       │
│  cipher → plaintext │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  UTF-8 解码         │
│  bytes → string     │
└─────────────────────┘
    │
    ▼
原始日志消息
```

### 完整解密脚本

```javascript
/**
 * MATRX 日志解密工具
 * 用于解密生产环境的加密日志
 */

const crypto = require('crypto');
const aes = require('aes-js');
const fs = require('fs');
const readline = require('readline');

// 默认密码（与加密时相同）
const PASSWORD = 'empty';

// 字符串反转
function reverse(str) {
    return str.split('').reverse().join('');
}

// 解密函数
function decrypt(encryptedBase64, password = PASSWORD) {
    try {
        // 1. SHA-256 派生密钥
        const hash = crypto.createHash('sha256');
        hash.update(password);
        const key128 = hash.digest().slice(0, 16);

        // 2. Base64 解码
        const encryptedBytes = Buffer.from(encryptedBase64, 'base64');

        // 3. AES-CTR 解密
        const ctr = new aes.ModeOfOperation.ctr(key128);
        const decryptedBytes = ctr.decrypt(encryptedBytes);

        // 4. UTF-8 解码
        return aes.utils.utf8.fromBytes(decryptedBytes);
    } catch (error) {
        return `[解密失败: ${error.message}]`;
    }
}

// 解密单行日志
function decryptLine(line) {
    // 查找加密标记
    const marker = '|+|';
    const markerIndex = line.indexOf(marker);

    if (markerIndex === -1) {
        // 没有加密标记，返回原文
        return line;
    }

    // 提取加密部分
    const prefix = line.substring(0, markerIndex);
    const encryptedPart = line.substring(markerIndex + marker.length);

    // 查找文件位置后缀 [xxx.js:nn]
    const suffixMatch = encryptedPart.match(/\s+\[[\w\-\.]+:\d+\]$/);
    let encrypted = encryptedPart;
    let suffix = '';

    if (suffixMatch) {
        suffix = suffixMatch[0];
        encrypted = encryptedPart.substring(0, encryptedPart.length - suffix.length);
    }

    // 反转并解密
    const reversed = reverse(encrypted);
    const decrypted = decrypt(reversed);

    return prefix + decrypted + suffix;
}

// 解密日志文件
async function decryptLogFile(inputPath, outputPath) {
    const fileStream = fs.createReadStream(inputPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const output = fs.createWriteStream(outputPath);

    for await (const line of rl) {
        output.write(decryptLine(line) + '\n');
    }

    output.end();
    console.log(`解密完成: ${outputPath}`);
}

// 命令行使用
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('用法: node decrypt-log.js <输入文件> [输出文件]');
        console.log('示例: node decrypt-log.js main.log main-decrypted.log');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace('.log', '-decrypted.log');

    decryptLogFile(inputFile, outputFile);
}

module.exports = {decrypt, decryptLine, decryptLogFile};
```

### 使用方法

```bash
# 安装依赖
npm install aes-js

# 解密单个文件
node decrypt-log.js main.log

# 指定输出文件
node decrypt-log.js main.log output.log

# 在代码中使用
const {decryptLine} = require('./decrypt-log');
const decrypted = decryptLine(encryptedLogLine);
```

### 快速解密单行

```javascript
const crypto = require('crypto');
const aes = require('aes-js');

function quickDecrypt(encryptedLine) {
    const marker = '|+|';
    const idx = encryptedLine.indexOf(marker);
    if (idx === -1) return encryptedLine;

    const encrypted = encryptedLine.substring(idx + 3).split(' [')[0];
    const reversed = encrypted.split('').reverse().join('');

    const hash = crypto.createHash('sha256');
    hash.update('empty');
    const key = hash.digest().slice(0, 16);

    const bytes = Buffer.from(reversed, 'base64');
    const ctr = new aes.ModeOfOperation.ctr(key);
    const decrypted = ctr.decrypt(bytes);

    return aes.utils.utf8.fromBytes(decrypted);
}
```

## 生产/开发环境的差异

### 环境判断逻辑

```javascript
// config.js
module.exports = {
    debug: process.env.npm_lifecycle_event === 'electron:test'
        || process.env.BUILD_ENV === 'debug'
        || process.env.NODE_ENV === 'development',
};

// src/logs/index.js
const {debug} = require('../../config');
const password = debug ? '' : 'empty';
```

### 差异对比

| 特性 | 开发环境 | 生产环境 |
|------|----------|----------|
| 环境标识 | `debug = true` | `debug = false` |
| 加密密码 | `''` (空字符串) | `'empty'` |
| 日志内容 | 明文输出 | 加密输出 |
| 加密标记 | 无 | `\|+\|` |
| 可读性 | 直接可读 | 需解密 |

### 开发环境日志示例

```
[2024-01-15 10:30:45.123] (INFO)=> 用户登录成功, userId: 12345 [login.js:42]
[2024-01-15 10:30:46.456] (DEBUG)=> 会话创建, sessionId: abc123 [session.js:78]
```

### 生产环境日志示例

```
[2024-01-15 10:30:45.123] (INFO)=> |+|=QWxhZGRp...Nlc2FtZQ== [login.js:42]
[2024-01-15 10:30:46.456] (DEBUG)=> |+|=b3BlbiB...c2VzYW1l [session.js:78]
```

## 安全注意事项

1. **密码管理**: 生产密码 `'empty'` 是示例值，实际部署时应使用更安全的密码
2. **密钥派生**: 使用 SHA-256 派生密钥，满足基本安全要求
3. **CTR 模式**: 注意不要对大量数据使用相同的密钥和计数器组合
4. **日志保护**: 加密日志仍应妥善保管，避免泄露
5. **解密工具**: 解密脚本应仅供授权人员使用

## 相关文件

- `src/logs/lib/encrypt.js` - 核心加密模块
- `src/logs/lib/layouts.js` - 布局处理（加密集成）
- `src/logs/cryptoLogUtil.js` - 加密工具类
- `src/logs/index.js` - 日志系统入口
- `config.js` - 环境配置
