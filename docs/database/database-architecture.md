# 数据库架构

## 概述

Matrx-Windows 项目使用 SQLCipher 加密数据库作为本地数据持久化方案，支持多空间隔离存储和全文检索功能。

## SQLCipher 集成

### 版本信息

- **SQLCipher 版本**: 通过 `@journeyapps/sqlcipher` 包集成
- **兼容模式**: SQLCipher 3.x (`PRAGMA cipher_compatibility = 3`)
- **KDF 迭代次数**: 10000 次 (`PRAGMA kdf_iter = '10000'`)

### 依赖引入

```javascript
var sqlite3 = require('@journeyapps/sqlcipher').verbose();
```

## 数据库文件位置

### 业务数据库（按空间隔离）

```
{configDir}/{vuid}/{spaceId}/{vuid}.{spaceId}.db.db
```

- `configDir`: 应用数据目录（`electron.app.getPath('userData')`）
- `vuid`: 当前登录用户的唯一标识
- `spaceId`: 空间/企业ID

### 用户信息数据库（全局）

```
{configDir}/{vuid}/{vuid}.user.db
```

用于存储用户级别的配置信息，如下载设置、FTS迁移状态等。

## 加密密钥管理

### 密钥获取流程

```javascript
async function getDBPassword(vuid, spaceId) {
    // 1. 优先从缓存获取
    if (getDBPwd(vuid)) {
        return getDBPwd(vuid);
    }

    // 2. 通过 IPC 从 SDK 获取密钥
    const pwBuffer = await sendSdk('fetchDBPassword', vuid);
    let result = Buffer.from(pwBuffer).toString('hex');

    // 3. 缓存密钥
    setDBPwd(vuid, result);
    return result;
}
```

### 密钥缓存

密钥缓存在内存中的 `dbPwdMap` 对象中，以 `vuid` 为键：

```javascript
// src/utils/multipleDBInsMange.js
const dbPwdMap = {};

export function getDBPwd(vuid) {
    return vuid ? dbPwdMap[vuid] : false;
}

export function setDBPwd(vuid, pwd) {
    if (vuid && pwd) {
        dbPwdMap[vuid] = pwd;
    }
}
```

## 多空间数据库隔离

### 实例缓存

每个空间的数据库实例独立缓存，以 `{vuid}_{spaceId}` 为键：

```javascript
// src/utils/multipleDBInsMange.js
const multipleInsMap = {};

export function getDBInsFromCache(vuid, spaceId) {
    if (vuid && spaceId) {
        let keyName = vuid + '_' + spaceId;
        return multipleInsMap[keyName];
    }
    return false;
}

export function setDBInsToCache(vuid, spaceId, dbIns) {
    if (vuid && spaceId) {
        let keyName = vuid + '_' + spaceId;
        multipleInsMap[keyName] = dbIns;
    }
}
```

### 隔离机制

- 每个企业空间拥有独立的数据库文件
- 数据库实例按需创建并缓存
- 所有数据操作需传入 `spaceId` 参数确保操作正确的数据库

## 数据库连接管理

### 业务数据库连接 (logicDBConnect.js)

```javascript
// src/utils/logicDBConnect.js
class DB {
    static async getDbIns(spaceId) {
        // 1. 检查缓存
        if (getDBInsFromCache(vuid, spaceId)) {
            return getDBInsFromCache(vuid, spaceId);
        }

        // 2. 创建新实例
        let dbPath = getDBPath(spaceId);
        let dbPassword = await getDBPassword(vuid, spaceId);
        await fse.ensureDir(dbDirPath);
        let dbINS = new sqlite3.Database(dbPath);

        // 3. 缓存实例
        setDBInsToCache(vuid, spaceId, dbINS);

        // 4. 配置 PRAGMA
        return new Promise((resolve, reject) => {
            dbINS.serialize(() => {
                dbINS.run('PRAGMA cipher_compatibility = 3');
                dbINS.run(`PRAGMA key = '${dbPassword}'`);
                dbINS.run(`PRAGMA kdf_iter = '10000'`);
                dbINS.run('PRAGMA busy_timeout = 6000');
                dbINS.run('PRAGMA journal_mode = WAL');
                dbINS.run('PRAGMA synchronous = 1', (err, data) => {
                    err ? reject(err) : resolve(dbINS);
                });
            });
        });
    }
}
```

### PRAGMA 配置说明

| PRAGMA | 值 | 说明 |
|--------|-----|------|
| `cipher_compatibility` | 3 | 兼容 SQLCipher 3.x 创建的数据库 |
| `key` | 加密密钥 | 数据库加密密钥 |
| `kdf_iter` | 10000 | 密钥派生函数迭代次数 |
| `busy_timeout` | 6000 | 忙等待超时时间（毫秒） |
| `journal_mode` | WAL | Write-Ahead Logging 模式，支持读写并发 |
| `synchronous` | 1 (NORMAL) | 同步模式，平衡性能和安全 |

### 用户信息数据库连接 (userInfoConnect.js)

用户信息数据库采用单例模式，全局只有一个实例：

```javascript
// src/utils/userInfoConnect.js
let dbINS = null;

class DB {
    static async getDbIns() {
        if (dbINS) {
            return dbINS;
        }
        // 创建并初始化...
    }
}
```

## 数据库初始化流程

### 1. 连接入口

```javascript
// src/utils/logicDBConnect.js
export const IDBUtil = {
    async connect(spaceId) {
        await dbInstance.connectDB(spaceId);  // 建立连接
        await dbInstance.initDB(spaceId);     // 初始化表结构
    },

    getDBInstance(spaceId) {
        return DB.getDbIns(spaceId);
    }
};
```

### 2. 版本检查与迁移

```javascript
async function _createTableFromInitialFile(spaceId) {
    let db = await DB.getDbIns(spaceId);

    db.get(`PRAGMA user_version;`, async (err, data) => {
        let curentVersion = data.user_version;
        let targetVersion = config.dbVersion;  // 当前为 29

        if (curentVersion < targetVersion) {
            await _doUpgrade(curentVersion, targetVersion, spaceId);
        }
    });
}
```

### 3. 执行迁移脚本

```javascript
async function _doUpgrade(curentVersion, targetVersion, spaceId) {
    // 获取需要执行的迁移脚本
    let needUpdateList = _getDBInitFiles(curentVersion, targetVersion);

    for (let index = 0; index < needUpdateList.length; index++) {
        const updateStr = needUpdateList[index] + ';';
        try {
            await this.exec(updateStr, spaceId);
        } catch (error) {
            // 忽略 duplicate column 错误
            if (error?.err?.message?.indexOf('duplicate column') < 0) {
                isError = true;
            }
        }
    }

    // 更新版本号
    if (!isError) {
        await this.exec(`PRAGMA user_version = ${config.dbVersion};`, spaceId);
    }
}
```

### 4. 迁移脚本加载

```javascript
function _getDBInitFiles(curentVersion, targetVersion) {
    let dbModules = [];
    const files = require.context('@/sql/init', false, /\.js$/);

    // 按版本号排序
    let sortList = files.keys().map(key => ({
        key,
        version: key.match(/([0-9]){1,7}/)[0]
    })).sort((o, n) => o.version - n.version);

    // 过滤出需要执行的版本
    sortList.filter(item =>
        Number(item.version) > Number(curentVersion) &&
        Number(item.version) <= Number(targetVersion)
    ).forEach(item => {
        dbModules = dbModules.concat(files(item.key).sqlList);
    });

    return dbModules;
}
```

## 版本信息

| 数据库类型 | 当前版本 | 配置项 |
|-----------|---------|--------|
| 业务数据库 | v29 | `config.dbVersion` |
| 用户信息数据库 | v9 | `config.userInfoVersion` |
| ACK 数据库 | v4 | `config.ackVersion` |

## 相关文件

- `src/utils/logicDBConnect.js` - 业务数据库连接管理
- `src/utils/userInfoConnect.js` - 用户信息数据库连接管理
- `src/utils/multipleDBInsMange.js` - 多实例缓存管理
- `src/config/config.js` - 配置项定义
