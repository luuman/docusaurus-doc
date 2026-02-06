# 安全架构

## 1. E2EE 端到端加密原理

### 1.1 概述

Matrx 使用基于 Signal Protocol 的端到端加密(E2EE)方案，确保消息只能被发送方和接收方解密，即使服务器也无法读取消息内容。

```
+------------------------------------------------------------------+
|                        E2EE 加密流程                               |
+------------------------------------------------------------------+

发送方                      服务器                      接收方
   |                          |                           |
   |  1. 生成会话密钥         |                           |
   |  2. 加密消息             |                           |
   |------------------------->|                           |
   |     密文 + 元数据         |                           |
   |                          |-------------------------->|
   |                          |     密文 + 元数据          |
   |                          |                           |
   |                          |  3. 使用共享密钥解密        |
   |                          |  4. 获得明文消息           |
```

### 1.2 密钥体系

```
+------------------------------------------------------------------+
|                      Signal Protocol 密钥体系                      |
+------------------------------------------------------------------+

Identity Key (身份密钥)
    |
    ├── 长期密钥对 (永久不变)
    ├── 用于验证设备身份
    └── 生成一次，本地存储

Signed Pre-Key (签名预密钥)
    |
    ├── 中期密钥对 (定期轮换)
    ├── 由 Identity Key 签名
    └── 用于建立初始会话

Pre-Keys (一次性预密钥)
    |
    ├── 短期密钥对 (一次使用)
    ├── 批量生成 (100个)
    └── 用于前向保密

Session Key (会话密钥)
    |
    ├── 每条消息不同
    ├── 双棘轮算法派生
    └── 保证前向/后向保密
```

### 1.3 SDK 桥接层实现

```javascript
// src/renderer/start/bridge/bridge_e2ee.js

// E2EE 初始化
function SDKE2EEInit() {
    const result = global.SDKBridgeAgent.mx_e2ee_bridge_init(SDKE2EECallback);
    return result;
}

// 生成应用密钥
function SDKE2EEGengerateAppKeys(email) {
    let localKeys = {};

    // 1. 生成注册ID (随机)
    localKeys.registrationId = Math.floor(Math.random() * 16777215) + 1;

    // 2. 获取或生成身份密钥
    let identityKey = SDKDBGetIdentityKey(email);
    if (identityKey == null) {
        identityKey = SDKUtilGengerateKeyPair();
    }
    localKeys.identityKey = identityKey;

    // 3. 生成签名预密钥
    const signedPrekey = SDKUtilGengerateKeyPair();
    const signature = SDKUtilCalculateSignature(signedPrekey.pub, identityKey.pri);
    localKeys.signedPrekey = {
        keyId: Math.floor(Math.random() * 16777215) + 1,
        keyPair: signedPrekey,
        signature: signature
    };

    // 4. 生成100个一次性预密钥
    localKeys.prekeys = [];
    let currentPryKeyIndex = SDKDBGetLastPrekeyId();
    if (currentPryKeyIndex == 0) {
        currentPryKeyIndex = Math.floor(Math.random() * (16777215 - 100)) + 1;
    }

    for (let i = 0; i < 100; i++) {
        const preKeyPair = SDKUtilGengerateKeyPair();
        localKeys.prekeys[i] = {
            keyId: currentPryKeyIndex,
            keyPair: preKeyPair
        };
        currentPryKeyIndex++;
    }

    return localKeys;
}

// 消息加密
function SDKE2EEEncrypt(body, uid, deviceId) {
    // body: 明文消息 (Buffer)
    // uid: 接收方用户ID
    // deviceId: 接收方设备ID

    const encrypted_buffer = Buffer.alloc(body.length + 200);
    let encrypted_buffer_size = Buffer.alloc(4);

    const result_code = global.SDKBridgeAgent.mx_e2ee_bridge_session_encrypt(
        encrypted_buffer,
        encrypted_buffer_size,
        uid,
        deviceId,
        body,
        body.length
    );

    if (result_code == 0) {
        return {
            encrypted: encrypted_buffer.toString('base64'),
            code: result_code
        };
    } else {
        return { encrypted: null, code: result_code };
    }
}

// 消息解密
function SDKE2EEDecrypt(cipher, uid, deviceId) {
    // cipher: 密文 (Buffer)
    // uid: 发送方用户ID
    // deviceId: 发送方设备ID

    const decrypted_buffer = Buffer.alloc(cipher.length);
    let decrypted_buffer_size = Buffer.alloc(4);

    const result_code = global.SDKBridgeAgent.mx_e2ee_bridge_session_decrypt(
        decrypted_buffer,
        decrypted_buffer_size,
        uid,
        deviceId,
        cipher,
        cipher.length
    );

    if (result_code == 0) {
        return {
            decrypted: decrypted_buffer,
            code: result_code
        };
    } else {
        return { decrypted: null, code: result_code };
    }
}
```

### 1.4 消息加密流程

```javascript
// src/utils/e2eUtil.js

async function encodeMessage(tempPlayload, uid, deviceId) {
    // 加密消息体
    if (tempPlayload.m.body) {
        const result = await sendSdk(
            'E2EE-Help-Method',
            4,                              // 加密操作码
            Buffer.from(tempPlayload.m.body),
            uid,
            deviceId
        );
        if (result.code == 0) {
            tempPlayload.m.body = result.encrypted;
        } else {
            return false;
        }
    }

    // 加密元数据
    if (tempPlayload.m.meta) {
        if (typeof tempPlayload.m.meta === 'object') {
            tempPlayload.m.meta = JSON.stringify(tempPlayload.m.meta);
        }
        if (tempPlayload.m.meta.length > 0) {
            const result = await sendSdk(
                'E2EE-Help-Method',
                4,
                Buffer.from(tempPlayload.m.meta),
                uid,
                deviceId
            );
            if (result.code == 0) {
                tempPlayload.m.meta = result.encrypted;
            } else {
                return false;
            }
        }
    }

    // 加密二进制部分
    if (tempPlayload.binaryPart && tempPlayload.binaryPart.length > 0) {
        const result = await sendSdk(
            'E2EE-Help-Method',
            4,
            Buffer.from(tempPlayload.binaryPart, 'base64'),
            uid,
            deviceId
        );
        if (result.code == 0) {
            tempPlayload.binaryPart = result.encrypted;
        } else {
            return false;
        }
    }

    return true;
}
```

### 1.5 E2EE 验证码生成

```javascript
// 生成E2EE验证指纹
function SDKE2EEGengerateFinger(peerUid, peerDeviceMap, selfDeviceMap) {
    let out_buffer = Buffer.alloc(64 + 60);

    // 排序设备ID确保一致性
    let peerDeviceArray = Object.keys(peerDeviceMap).sort();
    let selfDeviceArray = Object.keys(selfDeviceMap).sort();

    global.SDKBridgeAgent.mx_e2ee_bridge_generate_finger(
        peerUid,
        peerDeviceCArray,
        peerDeviceCArray.length,
        selfDeviceCArray,
        selfDeviceCArray.length,
        out_buffer
    );

    // 提取指纹
    const peerFinger = out_buffer.subarray(64, 64 + 30).toString('utf8');
    const selfFinger = out_buffer.subarray(64 + 30, 64 + 60).toString('utf8');

    return {
        code: 0,
        peerFinger,   // 对方指纹 (30字符)
        selfFinger    // 自己指纹 (30字符)
    };
}
```

## 2. SSL Pinning 实现

### 2.1 概述

SSL Pinning (证书锁定) 通过验证服务器证书指纹，防止中间人攻击。

```
+------------------------------------------------------------------+
|                      SSL Pinning 原理                             |
+------------------------------------------------------------------+

正常HTTPS连接:
Client --> Server: 请求证书
Server --> Client: 返回证书
Client: 验证证书链 (CA签名)
Client: 如果有效，建立连接

SSL Pinning加强:
Client --> Server: 请求证书
Server --> Client: 返回证书
Client: 1. 验证证书链
Client: 2. 计算证书指纹 (SHA256)
Client: 3. 与预置指纹列表对比
Client: 4. 匹配成功才建立连接
```

### 2.2 实现代码

```javascript
// src/main/certs/useCertificateVerifyProc.js

// 预置证书指纹配置
let ssl_cert_config = [];

function init_cert_config() {
    ssl_cert_config = [
        {
            domain: '*.matrx.work',
            fingerprints: [
                'sha256/nkpl5Cvy7fkKZAOzcZGRn3GwNlxgX21S/mA7gMf8zrU=',
                'sha256/VxlO1qIAJqDntoJRqnC3JpiXACC2QI+R58bFqxtEc8U=',
                'sha256/1Nhz6aRF1cBOjJjIKZO97CnVKqjU8OXuqP99CbUa1qQ='
            ]
        },
        {
            domain: '*.matrx.solutions',
            fingerprints: [
                'sha256/nkpl5Cvy7fkKZAOzcZGRn3GwNlxgX21S/mA7gMf8zrU=',
                'sha256/VxlO1qIAJqDntoJRqnC3JpiXACC2QI+R58bFqxtEc8U='
            ]
        },
        {
            domain: '*.matrx.io',
            fingerprints: [
                'sha256/82nn9Ypy+daI2u0lqAQZZRDljrtjH4/nvYaJPPFyXps=',
                'sha256/ATdSaIUeeT4ckWCMjKBYvJeirWqSTcp1kABX1aDq2PM='
            ]
        }
        // ... 更多域名配置
    ];
}

// 创建SSL验证器
function matrx_createSslVerificator(config) {
    // 验证通配符格式
    config.forEach(({domain}) => {
        const wildcardCount = domain.match(/\*/g);
        if (wildcardCount && wildcardCount.length > 1) {
            throw new Error('Wrong wildcard format. Use "*.example.org".');
        }
    });

    // 构建验证规则
    const rules = config.map(rule => {
        const fingerprintSet = new Set(rule.fingerprints);
        const hostnameRegex = new RegExp(
            '^' + rule.domain.replace('*.', '.*\\.?') + '$'
        );

        return (hostname, fingerprints) => {
            // 先匹配域名
            let val = hostnameRegex.test(hostname);
            if (!val) {
                // 域名不匹配，检查指纹
                val = fingerprints.every(fp => fingerprintSet.has(fp));
            }
            return val;
        };
    });

    // 返回验证回调函数
    return (request, callback) => {
        // 提取证书链的所有指纹
        const fingerprints = [];
        for (let cert = request.certificate;
             cert && cert !== cert.issuerCert;
             cert = cert.issuerCert) {
            fingerprints.push(cert.fingerprint);
        }

        // 检查域名是否在配置列表中
        let domain_exist = domains.some(regex => regex.test(request.hostname));

        // 验证结果
        // 0: 成功，禁用证书透明度验证
        // -2: 失败，拒绝连接
        // -3: 使用Chromium默认验证
        if (rules.some(rule => rule(request.hostname, fingerprints))) {
            callback(0);   // 验证成功
        } else if (!domain_exist) {
            callback(-3);  // 不在列表中，使用默认验证
        } else {
            log.log('SSL verification failed:', request.hostname);
            callback(-2);  // 验证失败，拒绝连接
        }
    };
}

// 设置验证器
export function setVerifyProc(win) {
    const matrx_sslVerificator = matrx_createSslVerificator(ssl_cert_config);

    // 设置默认会话验证
    session.defaultSession.setCertificateVerifyProc(matrx_sslVerificator);

    // 设置窗口会话验证
    if (win && !win.isDestroyed()) {
        win.webContents.session.setCertificateVerifyProc(matrx_sslVerificator);
    }
}

// 动态添加域名配置 (私有化部署)
async function handleDomainConfig(url, first) {
    const isDomain = wwwPattern.test(url);
    const domainConfig = await fetchSslConfig(url, isDomain);

    if (domainConfig) {
        if (first) ssl_cert_config = [];
        ssl_cert_config.push(domainConfig);
        ssl_cert_config = _.uniqWith(ssl_cert_config, _.isEqual);
        setVerifyProc(global.currentWin);
    }

    return domainConfig;
}
```

### 2.3 SSL Pinning 验证流程

```
+------------------------------------------------------------------+
|                    SSL Pinning 验证流程图                          |
+------------------------------------------------------------------+

HTTPS请求
    |
    v
+-------+-------+
| 获取服务器证书 |
+-------+-------+
    |
    v
+-------+-------+
| 提取证书链    |
| 所有指纹      |
+-------+-------+
    |
    v
+-------+-------+
| 检查hostname  |
| 是否在配置中  |
+-------+-------+
    |
    +------------------+------------------+
    |                  |                  |
    v                  v                  v
 在配置中          不在配置中         配置为空
    |                  |                  |
    v                  v                  v
+-------+------+  +-------+------+  +-------+------+
| 匹配指纹     |  | 使用Chromium |  | 使用Chromium |
| 验证结果     |  | 默认验证     |  | 默认验证     |
+-------+------+  +-------+------+  +-------+------+
    |
    +----------+----------+
    |                     |
    v                     v
匹配成功              匹配失败
callback(0)          callback(-2)
允许连接              拒绝连接
```

## 3. SQLCipher 数据库加密

### 3.1 SQLCipher 概述

SQLCipher 是 SQLite 的加密扩展，提供 256-bit AES 加密。

```
+------------------------------------------------------------------+
|                     SQLCipher 加密特性                             |
+------------------------------------------------------------------+

加密算法: AES-256-CBC
密钥派生: PBKDF2 (10000次迭代)
页面大小: 4096 bytes
加密范围: 整个数据库文件

特点:
- 透明加密 (应用层无需修改SQL)
- 高性能 (硬件加速)
- 跨平台兼容
- 开源审计
```

### 3.2 数据库连接配置

```javascript
// src/utils/logicDBConnect.js

const sqlite3 = require('@journeyapps/sqlcipher').verbose();

class DB {
    static async getDbIns(spaceId) {
        let vuid = appdataStorage.getItem('xx_vuid');
        let dbPath = getDBPath(spaceId);

        // 从SDK获取数据库密码
        let dbPassword = await getDBPassword(vuid, spaceId);

        // 确保目录存在
        await fse.ensureDir(dbDirPath);

        // 创建数据库实例
        let dbINS = new sqlite3.Database(dbPath);

        return new Promise((resolve, reject) => {
            dbINS.serialize(() => {
                // SQLCipher 3.x 兼容模式
                dbINS.run('PRAGMA cipher_compatibility = 3');

                // 设置加密密钥
                dbINS.run(`PRAGMA key = '${dbPassword}'`);

                // PBKDF2 迭代次数
                dbINS.run(`PRAGMA kdf_iter = '10000'`);

                // 锁等待超时
                dbINS.run('PRAGMA busy_timeout = 6000');

                // WAL模式 (读写并发)
                dbINS.run('PRAGMA journal_mode = WAL');

                // 同步模式
                dbINS.run('PRAGMA synchronous = 1', (err, data) => {
                    if (err) reject(err);
                    else resolve(dbINS);
                });
            });
        });
    }
}

// 获取数据库密码 (从SDK)
async function getDBPassword(vuid, spaceId) {
    if (getDBPwd(vuid)) {
        return getDBPwd(vuid);
    }

    // 从SDK进程获取密码
    const pwBuffer = await sendSdk('fetchDBPassword', vuid);
    let result = Buffer.from(pwBuffer).toString('hex');

    // 缓存密码
    setDBPwd(vuid, result);

    return result;
}
```

### 3.3 数据库密钥生成

```javascript
// 数据库密钥由SDK进程生成
// 密钥派生自用户的身份信息，通过安全的密钥派生函数

// IPC调用获取密钥
const pwBuffer = await sendSdk('fetchDBPassword', vuid);

// 密钥格式: 64字符的十六进制字符串 (256 bits)
// 示例: "a1b2c3d4e5f6..."
```

### 3.4 数据库文件结构

```
用户数据目录/
└── {vuid}/
    └── {spaceId}/
        └── {vuid}.{spaceId}.db.db    # 加密的SQLCipher数据库

数据库内表结构:
- message        # 消息表
- session        # 会话表
- peer           # 联系人/群组表
- setting        # 设置表
- IndexTable     # FTS全文索引表
- ...
```

## 4. 日志加密

### 4.1 日志系统架构

```javascript
// src/logs/index.js

const log4js = require('./lib/log4js');
const {debug} = require('../../config');

// 生产环境启用加密
const password = debug ? '' : 'empty';

const config = initLogConfig(configDir, name, '6M', password);

log4js.configure(config);
```

### 4.2 日志分类

```javascript
// 日志类别配置
const categoryNames = [
    {categoryName: 'appLog'},           // 应用日志
    {categoryName: 'bridgeLog'},        // 桥接日志
    {categoryName: 'ipcMainLog'},       // IPC主进程日志
    {categoryName: 'sdkLog'},           // SDK日志
    {categoryName: 'e2eeLog'},          // E2EE日志
    {categoryName: 'meetingLog'},       // 会议日志
    {categoryName: 'updaterLog'},       // 更新日志
    {categoryName: 'renderLog'},        // 渲染日志
    {categoryName: 'fileLog'},          // 文件日志
    {categoryName: 'messageLog'},       // 消息日志
    {categoryName: 'apiLog'},           // API日志
    {categoryName: 'ackLog'},           // 确认日志
    {categoryName: 'offlineMsgLog'}     // 离线消息日志
];
```

### 4.3 日志加密机制

```
+------------------------------------------------------------------+
|                       日志加密流程                                  |
+------------------------------------------------------------------+

日志内容
    |
    v
+-------+-------+
| log4js        |
| 格式化日志    |
+-------+-------+
    |
    v
+-------+-------+
| 加密处理器    |
| (生产环境)    |
+-------+-------+
    |
    v
+-------+-------+
| 写入文件      |
| *.log (加密)  |
+---------------+

日志文件位置: %AppData%/Matrx/logs/
```

## 5. 敏感数据存储策略

### 5.1 存储分类

```
+------------------------------------------------------------------+
|                     敏感数据存储策略                                |
+------------------------------------------------------------------+

数据类型              存储位置            加密方式
--------------------------------------------------------------------
用户凭证              SQLCipher DB        AES-256
消息内容              SQLCipher DB        AES-256 + E2EE
E2EE密钥              本地加密存储        SDK加密
应用设置              electron-store      可选加密
会话Token             内存/加密存储       临时存储
文件缓存              加密目录            随数据库密钥
```

### 5.2 electron-store 加密存储

```javascript
// src/main/store.js

const option = {
    name: 'storage',
    schema,
    defaults
};

// 生产环境启用加密
if (process.env.NODE_ENV === 'production') {
    option.encryptionKey = 'String';  // 二进制存储
}

store = new Store(option);
```

### 5.3 本地forage加密

```javascript
// src/plugins/localforage/crypto.js

const CryptoJS = require('crypto-js');

const key = 'Dw0qmsbuy1ZrpEgJ';  // 16字节密钥
const iv = 'q6oRuKShFTAD3HpL';   // 16字节IV

const AES = {
    // 加密
    encrypt: function (data) {
        if (typeof data === 'object') {
            data = JSON.stringify(data);
        }
        const dataHex = CryptoJS.enc.Utf8.parse(data);
        const encrypted = CryptoJS.AES.encrypt(dataHex, keyHex, {
            iv: ivHex,
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Iso10126
        });
        return encrypted.ciphertext.toString();
    },

    // 解密
    decrypt: function (encryptedVal) {
        if (typeof encryptedVal !== 'string' || !encryptedVal) {
            return encryptedVal;
        }
        const encryptedHexStr = CryptoJS.enc.Hex.parse(encryptedVal);
        const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        const decrypt = CryptoJS.AES.decrypt(srcs, keyHex, {
            iv: ivHex,
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Iso10126
        });
        return decrypt.toString(CryptoJS.enc.Utf8);
    }
};
```

## 6. 证书验证流程

### 6.1 完整验证流程图

```
+------------------------------------------------------------------+
|                      证书验证完整流程                               |
+------------------------------------------------------------------+

应用启动
    |
    v
+-------+-------+
| init_cert_    |
| config()      |
| 加载预置指纹  |
+-------+-------+
    |
    v
+-------+-------+
| setVerifyProc |
| 设置验证回调  |
+-------+-------+
    |
    v
等待HTTPS请求...
    |
    v
+-------+-------+
| HTTPS请求触发 |
| 证书验证回调  |
+-------+-------+
    |
    v
+-------+-------+
| 提取证书链    |
| fingerprints  |
+-------+-------+
    |
    v
+-------+-------+
| 匹配hostname  |
| 和指纹列表    |
+-------+-------+
    |
    +----------+----------+
    |          |          |
    v          v          v
成功(0)    未知域名(-3)  失败(-2)
允许        Chromium验证   拒绝

私有化部署场景:
    |
    v
+-------+-------+
| 动态获取     |
| 服务器证书   |
| 指纹配置     |
+-------+-------+
    |
    v
+-------+-------+
| 更新         |
| ssl_cert_    |
| config       |
+-------+-------+
```

### 6.2 IPC通信加密配置

```javascript
// 渲染进程请求更新证书配置
ipcMain.on('CHANGE_CERTIFICATEVERIFY_CONFIG', async (e, url, first) => {
    let domainConfig = await handleDomainConfig(url, first);
    e.reply('CHANGE_CERTIFICATEVERIFY_CONFIG', domainConfig);
});

// WSS连接的证书配置
ipcMain.on('CHANGE_CERTIFICATEVERIFY_CONFIG_WSS', async (e, url, first) => {
    let domainConfig = await handleDomainConfig(url, first);
    e.reply('CHANGE_CERTIFICATEVERIFY_CONFIG_WSS', domainConfig);
});
```

### 6.3 安全最佳实践总结

```
+------------------------------------------------------------------+
|                      安全措施清单                                   |
+------------------------------------------------------------------+

1. 通信安全
   [x] TLS 1.2+ 强制使用
   [x] SSL Pinning 证书锁定
   [x] E2EE 端到端加密
   [x] 前向保密 (PFS)

2. 数据存储安全
   [x] SQLCipher 数据库加密
   [x] 敏感设置加密存储
   [x] 日志文件加密
   [x] 密钥安全派生

3. 应用安全
   [x] 生产环境禁用调试
   [x] 代码签名
   [x] 单例运行
   [x] 崩溃恢复机制

4. 密钥管理
   [x] 密钥本地安全存储
   [x] 定期密钥轮换
   [x] 设备绑定密钥

5. 身份验证
   [x] 多设备身份管理
   [x] E2EE身份验证
   [x] SSO支持
```
