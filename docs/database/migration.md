# 版本迁移

## 概述

Matrx-Windows 项目使用基于版本号的数据库迁移机制，通过 `PRAGMA user_version` 跟踪当前数据库版本，自动执行增量迁移脚本。

## 迁移脚本目录

### 业务数据库迁移 (sql/init/)

```
src/sql/init/
├── v1.js   # 基础表结构：message, peer, file, keypairs, IndexTable, metaTable
├── v2.js   # (空文件)
├── v3.js   # setting 表
├── v4.js   # message.uuidRepliedRoot 字段
├── v5.js   # message.f 字段, kv 表, Index_Table (FTS5)
├── v6.js   # message.s 字段
├── v7.js   # setting 字段, message.stickerRepliedList
├── v8.js   # IndexTable (FTS5 with unicode61)
├── v9.js   # message.pinnedInfo 字段
├── v10.js  # message.binaryPart 字段
├── v11.js  # session 表, voice 表
├── v12.js  # message 字段, peddingUnread 表, receiptInfo 表, 索引
├── v13.js  # session.isDeleted 字段
├── v14.js  # session 和 peer 索引
├── v15.js  # message.sessionHide 字段
├── v16.js  # temp_destroy_message 表, peer.destroyInterval
├── v17.js  # meeting 表
├── v18.js  # peer.alias 字段
├── v19.js  # organization 表
├── v20.js  # session.draftObj, peer.accountPublic
├── v21.js  # session.isGroupDismiss
├── v22.js  # emailPeer 表
├── v23.js  # session.extraData
├── v24.js  # message.extraData, peer.subscribeType
├── v25.js  # approval 表
├── v26.js  # message 字段, session 字段, temp_wait_message 表
├── v27.js  # session.readtime, session.clearHistoryTime
├── v28.js  # session.maxSeqForStime
└── v29.js  # peer.updateDestructTime, session 字段
```

**当前版本**: v29 (`config.dbVersion = 29`)

### 用户信息数据库迁移 (sql/userInfo/)

```
src/sql/userInfo/
├── v1.js   # customer 表, needping 表, setting 表
├── v2.js   # setting 字段: videoCheck, usePersonalRoom
├── v3.js   # ftsmigration 表（FTS 迁移状态）
├── v4.js   # downloadsetting 表, downloadfilemap 表
├── v5.js   # setting.meetExperienceSurvey, setting.meetInvViaEmail
├── v6.js   # setting.openAudioConnected
├── v7.js   # setting.options
├── v8.js   # downloadsetting.isRemotePath, downloadsetting.meetingRecordPath
└── v9.js   # downloadfilemap.state, downloadfilemap.extraData
```

**当前版本**: v9 (`config.userInfoVersion = 9`)

### ACK 数据库迁移 (sql/ackDB/)

```
src/sql/ackDB/
├── v1.js   # temp_message 表
├── v2.js   # temp_message.p 字段
├── v3.js   # temp_message 字段, offline_session 表
└── v4.js   # offline_session.updateTime 字段
```

**当前版本**: v4 (`config.ackVersion = 4`)

---

## 迁移执行流程

### 1. 数据库连接时触发

```javascript
// src/utils/logicDBConnect.js
export const IDBUtil = {
    async connect(spaceId) {
        await dbInstance.connectDB(spaceId);  // 建立连接
        await dbInstance.initDB(spaceId);     // 触发迁移检查
    }
};
```

### 2. 版本检查

```javascript
async function _createTableFromInitialFile(spaceId) {
    return new Promise(async (res, rej) => {
        let db = await DB.getDbIns(spaceId);

        // 获取当前数据库版本
        db.get(`PRAGMA user_version;`, async (err, data) => {
            let curentVersion = data.user_version;
            let targetVersion = config.dbVersion;  // 目标版本

            console.log('curentVersion', curentVersion, 'targetVersion', targetVersion);

            // 版本低于目标版本时执行迁移
            if (curentVersion < targetVersion) {
                await _doUpgrade(curentVersion, targetVersion, spaceId);
            }
            res('success');
        });
    });
}
```

### 3. 加载迁移脚本

```javascript
function _getDBInitFiles(curentVersion, targetVersion) {
    let dbModules = [];
    let sortList = [];

    // 动态加载迁移脚本目录
    const files = require.context('@/sql/init', false, /\.js$/);

    // 解析版本号
    files.keys().forEach(key => {
        if (key.match(/([0-9]){1,7}/) && key.match(/([0-9]){1,7}/)[0]) {
            let tempVersion = key.match(/([0-9]){1,7}/)[0];
            sortList.push({
                key: key,
                version: tempVersion
            });
        }
    });

    // 按版本号排序（解决 v1, v10 排序问题）
    sortList.sort((o, n) => o.version - n.version);

    // 筛选需要执行的版本
    sortList.map(item => {
        if (Number(item.version) > Number(curentVersion) &&
            Number(item.version) <= Number(targetVersion)) {
            let tempList = files(item.key).sqlList;
            dbModules = dbModules.concat(tempList);
        }
    });

    return dbModules;
}
```

### 4. 执行迁移

```javascript
async function _doUpgrade(curentVersion, targetVersion, spaceId) {
    let needUpdateList = _getDBInitFiles(curentVersion, targetVersion);
    let isError = false;

    // 逐条执行 SQL
    for (let index = 0; index < needUpdateList.length; index++) {
        if (needUpdateList[index]) {
            const updateStr = needUpdateList[index] + ';';
            try {
                await this.exec(updateStr, spaceId);
            } catch (error) {
                // 忽略 duplicate column 错误
                if (error?.err?.message?.indexOf('duplicate column') < 0) {
                    isError = true;
                }
                console.error('[_doUpgrade]', error, spaceId);
            }
        }
    }

    // 更新数据库版本号
    if (!isError) {
        await this.exec(`PRAGMA user_version = ${config.dbVersion};`, spaceId);
    }
}
```

---

## 迁移脚本格式

### 标准格式

每个迁移脚本导出一个 `sqlList` 数组，包含要执行的 SQL 语句：

```javascript
// src/sql/init/v4.js
export const sqlList = [
    `ALTER TABLE message ADD COLUMN uuidRepliedRoot TEXT;`,
    `CREATE INDEX IF NOT EXISTS idx_message_uuidRepliedRoot ON message (uuidRepliedRoot)`
];
```

### 支持的 SQL 类型

1. **添加字段**
```javascript
`ALTER TABLE message ADD COLUMN extraData TEXT;`
```

2. **创建表**
```javascript
`CREATE TABLE IF NOT EXISTS session(
    id INTEGER PRIMARY KEY,
    hostId TEXT NOT NULL DEFAULT '',
    hid TEXT NOT NULL DEFAULT '',
    ...
)`
```

3. **创建索引**
```javascript
`CREATE INDEX IF NOT EXISTS idx_session_hid ON session (hid)`
```

4. **创建虚拟表 (FTS)**
```javascript
`CREATE VIRTUAL TABLE IF NOT EXISTS IndexTable USING fts5(
    body,
    type UNINDEXED,
    ...
    tokenize='unicode61'
)`
```

5. **删除表/索引**
```javascript
`DROP TABLE IndexTable;`
```

---

## 数据兼容性处理

### 1. 使用 IF NOT EXISTS

避免表或索引重复创建的错误：

```javascript
`CREATE TABLE IF NOT EXISTS meeting(...)`
`CREATE INDEX IF NOT EXISTS idx_meeting_conferenceId ON meeting (...)`
```

### 2. 忽略 duplicate column 错误

迁移执行时自动忽略字段已存在的错误：

```javascript
catch (error) {
    // duplicate column 忽略
    if (error?.err?.message?.indexOf('duplicate column') < 0) {
        isError = true;
    }
}
```

### 3. 默认值处理

新增字段建议设置默认值，确保旧数据兼容：

```javascript
`ALTER TABLE setting ADD COLUMN openAudioConnected INT NOT NULL DEFAULT 1`
`ALTER TABLE message ADD COLUMN receiptShow TEXT NOT NULL DEFAULT 'show'`
```

### 4. 可空字段

对于可选字段，使用 NULL 或不设置默认值：

```javascript
`ALTER TABLE session ADD COLUMN isGroupDismiss NULL;`
`ALTER TABLE peer ADD COLUMN alias TEXT;`
```

---

## 迁移回滚策略

### 当前限制

项目当前**不支持自动回滚**，迁移是单向的。

### 手动回滚方案

1. **备份数据库文件**
   - 迁移前备份整个数据库文件
   - 出问题时恢复备份

2. **手动执行回滚 SQL**
   ```sql
   -- 删除字段（SQLite 不直接支持，需要重建表）
   -- 删除表
   DROP TABLE IF EXISTS new_table;
   -- 删除索引
   DROP INDEX IF EXISTS idx_new_index;
   ```

3. **版本号重置**
   ```sql
   PRAGMA user_version = {previous_version};
   ```

### 建议的回滚策略

1. **版本跨度限制**: 跨桌面版本超过 5 个建议强制升级（代码中有 TODO 注释）

2. **事务包装**: 用户信息数据库使用事务执行迁移
   ```javascript
   await this.exec(`
       BEGIN TRANSACTION;
       ${updateStr}
       COMMIT;
   `);
   ```

3. **增量迁移**: 每个版本的迁移应该是增量的，避免破坏性变更

---

## 版本演进示例

### 场景：添加新功能

假设需要添加"消息翻译"功能：

1. **更新版本号**
   ```javascript
   // src/config/config.js
   dbVersion: 30,  // 从 29 升级到 30
   ```

2. **创建迁移脚本**
   ```javascript
   // src/sql/init/v30.js
   export const sqlList = [
       // 添加翻译内容字段
       `ALTER TABLE message ADD COLUMN translatedBody TEXT;`,
       // 添加翻译语言字段
       `ALTER TABLE message ADD COLUMN translatedLang TEXT;`,
       // 创建翻译记录表
       `CREATE TABLE IF NOT EXISTS translation_cache(
           id INTEGER PRIMARY KEY,
           sourceText TEXT,
           translatedText TEXT,
           sourceLang TEXT,
           targetLang TEXT,
           ctime INTEGER
       )`,
       // 创建索引
       `CREATE INDEX IF NOT EXISTS idx_translation_source ON translation_cache (sourceText)`
   ];
   ```

3. **测试迁移**
   - 清除本地数据库
   - 重新启动应用
   - 验证新表和字段创建成功

---

## FTS 迁移状态管理

FTS 消息索引迁移使用单独的状态表跟踪进度：

### ftsmigration 表

```sql
CREATE TABLE IF NOT EXISTS ftsmigration(
    spaceId TEXT NOT NULL DEFAULT '' UNIQUE,
    currentRowId INTEGER,   -- 当前处理到的行ID
    maxRowId INTEGER,       -- 最大行ID
    isFinish TEXT           -- 是否完成
);
```

### 迁移进度记录

```javascript
// 写入迁移进度
async function writeWaterMark(spaceId, newObj) {
    await userRunWith(`
        INSERT INTO ftsmigration(spaceId, currentRowId, maxRowId, isFinish)
        VALUES(:spaceId, :currentRowId, :maxRowId, :isFinish)
        ON CONFLICT(spaceId)
        DO UPDATE SET maxRowId=excluded.maxRowId, currentRowId=:currentRowId, isFinish=:isFinish;
    `, {
        spaceId: newObj.spaceId,
        currentRowId: newObj.currentRowId,
        isFinish: newObj.isFinish
    }, spaceId);
}

// 读取迁移进度
async function readWaterMark(spaceId) {
    let currentRowID = await usergetWith(
        `SELECT * FROM ftsmigration WHERE spaceId = :spaceId`,
        { spaceId }
    );
    if (!currentRowID) {
        currentRowID = await getWith(
            `SELECT min(ROWID) as currentRowId FROM message`,
            {},
            spaceId
        );
    }
    return currentRowID.currentRowId;
}
```

---

## 最佳实践

### 1. 迁移脚本原则

- 每个版本只做增量变更
- 使用 `IF NOT EXISTS` 和 `IF EXISTS` 保护
- 新字段设置合理的默认值
- 避免破坏性变更（如删除字段、修改字段类型）

### 2. 测试迁移

```bash
# 测试步骤
1. 备份现有数据库
2. 修改版本号和迁移脚本
3. 启动应用验证迁移
4. 检查数据完整性
5. 测试新旧版本兼容性
```

### 3. 版本管理

- 配置中统一管理版本号
- 迁移脚本按版本号命名
- 保持迁移脚本不可变（发布后不修改）

## 相关文件

- `src/config/config.js` - 版本号配置
- `src/utils/logicDBConnect.js` - 业务数据库迁移逻辑
- `src/utils/userInfoConnect.js` - 用户信息数据库迁移逻辑
- `src/sql/init/` - 业务数据库迁移脚本
- `src/sql/userInfo/` - 用户信息数据库迁移脚本
- `src/sql/ackDB/` - ACK 数据库迁移脚本
