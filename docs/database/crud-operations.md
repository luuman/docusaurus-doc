# CRUD 操作

## 概述

本文档描述 Matrx-Windows 项目中数据库 CRUD（Create, Read, Update, Delete）操作的核心工具函数和使用方法。

## 核心工具文件

- `src/utils/SqliteUtil.js` - 业务数据库操作工具 (~17KB)
- `src/utils/userInfoDBUtil.js` - 用户信息数据库操作工具
- `src/sqlApi/sql.js` - SQL 操作封装层
- `src/sqlApi/index.js` - 业务查询 API

---

## SqliteUtil.js 核心工具

### 参数预处理

所有参数在执行前都会通过 `preinsertinkey` 函数进行处理，为参数键名添加前缀：

```javascript
function preinsertinkey(obj) {
    if (Array.isArray(obj)) {
        return obj;
    } else {
        let newobj = {};
        for (let key in obj) {
            if (':@$'.indexOf(key.charAt(0)) == -1) {
                newobj[':' + key] = obj[key];
            } else {
                newobj[key] = obj[key];
            }
        }
        return newobj;
    }
}
```

---

## runWith() - 执行 SQL

执行任意 SQL 语句，适用于 INSERT、UPDATE、DELETE 等操作。

### 函数签名

```javascript
export async function runWith(sql, params, spaceId)
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| sql | string | SQL 语句 |
| params | object | 参数对象 |
| spaceId | string | 空间ID（必需） |

### 示例

```javascript
import { runWith } from '@/utils/SqliteUtil';

// 更新消息状态
await runWith(
    `UPDATE message SET messageStatus = :status WHERE uuid = :uuid`,
    { status: 1, uuid: 'msg-123' },
    spaceId
);

// 删除索引记录
await runWith(
    `DELETE FROM IndexTable WHERE busItemId = :busItemId`,
    { busItemId: 'item-456' },
    spaceId
);
```

### 实现

```javascript
export async function runWith(sql, params, spaceId) {
    if (!spaceId) {
        console.error('runWith spaceId', sql, params, spaceId);
        return Promise.reject('no spaceId');
    }
    return new Promise(async (resolve, reject) => {
        try {
            let dbInstance = await getDBInstance(spaceId);
            dbInstance.run(sql, preinsertinkey(params), transP(resolve, reject));
        } catch (e) {
            console.error('runWith catch', e, sql, params, spaceId);
            reject(e);
        }
    });
}
```

---

## insertWith() - 插入数据

根据对象自动生成 INSERT 语句并执行。

### 函数签名

```javascript
export async function insertWith(tableName, obj, spaceId)
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| tableName | string | 表名 |
| obj | object | 数据对象，键为列名，值为数据 |
| spaceId | string | 空间ID |

### 示例

```javascript
import { insertWith } from '@/utils/SqliteUtil';

// 插入联系人
await insertWith('peer', {
    hostId: 'user-001',
    hid: 'peer-123',
    firstName: 'John',
    lastName: 'Doe',
    type: 'friend'
}, spaceId);

// 插入消息
await insertWith('message', {
    uuid: 'msg-001',
    dialogId: 'dialog-123',
    body: 'Hello World',
    stime: Date.now()
}, spaceId);
```

### 实现

```javascript
export async function insertWith(tableName, obj, spaceId) {
    if (!spaceId) {
        console.trace('insertWith', tableName, obj, spaceId);
    }
    let columns = [];
    let values = [];
    let sqlVec = ['insert or ignore into', tableName];

    for (let key in obj) {
        columns.push(key);
        values.push(':' + key);
    }

    sqlVec.push('(');
    sqlVec.push(columns.join(','));
    sqlVec.push(')');
    sqlVec.push('values');
    sqlVec.push('(');
    sqlVec.push(values.join(','));
    sqlVec.push(')');

    let sql = sqlVec.join(' ');
    return runWith(sql, obj, spaceId);
}
```

### 生成的 SQL

```sql
insert or ignore into peer ( hostId, hid, firstName, lastName, type )
values ( :hostId, :hid, :firstName, :lastName, :type )
```

**注意**: 使用 `insert or ignore` 策略，如果违反唯一约束则忽略插入。

---

## updateWith() - 更新数据

根据对象自动生成 UPDATE 语句并执行。

### 函数签名

```javascript
export async function updateWith(
    spaceId,
    tableName,
    obj,
    keyValue,
    keyField = 'id',
    hostId,
    hostIdField = 'hostId',
    isNeedHostId = true
)
```

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| spaceId | string | - | 空间ID |
| tableName | string | - | 表名 |
| obj | object | - | 更新数据对象 |
| keyValue | any | - | 主键值 |
| keyField | string | 'id' | 主键字段名 |
| hostId | string | - | 宿主ID（必需） |
| hostIdField | string | 'hostId' | 宿主ID字段名 |
| isNeedHostId | boolean | true | 是否需要 hostId 条件 |

### 示例

```javascript
import { updateWith } from '@/utils/SqliteUtil';

// 更新联系人信息
await updateWith(
    spaceId,
    'peer',
    { firstName: 'Jane', lastName: 'Smith' },  // 更新内容
    'peer-123',    // keyValue
    'hid',         // keyField
    'user-001',    // hostId
    'hostId',      // hostIdField
    true           // isNeedHostId
);
```

### 实现

```javascript
export async function updateWith(spaceId, tableName, obj, keyValue, keyField = 'id',
                                  hostId, hostIdField = 'hostId', isNeedHostId = true) {
    if (!hostId) {
        return new Error('Please fill hostId !!!!!!!');
    }
    let columns = [];
    let sqlVec = ['update', tableName, 'set'];

    for (let key in obj) {
        columns.push(key + '=:' + key);
    }

    sqlVec.push(columns.join(','));
    sqlVec.push('where');
    sqlVec.push(keyField);
    sqlVec.push('=$' + keyField);

    if (isNeedHostId) {
        sqlVec.push('AND');
        sqlVec.push(hostIdField);
        sqlVec.push('=$' + hostIdField);
    }

    obj['$' + keyField] = keyValue;
    if (isNeedHostId) {
        obj['$' + hostIdField] = hostId;
    }

    let sql = sqlVec.join(' ');
    return runWith(sql, obj, spaceId);
}
```

### 生成的 SQL

```sql
update peer set firstName=:firstName, lastName=:lastName
where hid=$hid AND hostId=$hostId
```

---

## allWith() / getWith() - 查询数据

### allWith() - 查询多条

```javascript
export async function allWith(sql, params, spaceId) {
    return new Promise(async (resolve, reject) => {
        try {
            let dbInstance = await getDBInstance(spaceId);
            dbInstance.all(sql, preinsertinkey(params), transP(resolve, reject));
        } catch (e) {
            console.error('allWith catch', e, sql, params, spaceId);
            reject(e);
        }
    });
}
```

### getWith() - 查询单条

```javascript
export async function getWith(sql, params, spaceId) {
    if (!spaceId) {
        console.trace('getWith', sql, params, spaceId);
    }
    return new Promise(async (resolve, reject) => {
        let dbInstance = await getDBInstance(spaceId);
        if (!dbInstance?.get) {
            reject(dbInstance);
            return;
        }
        dbInstance.get(sql, preinsertinkey(params), transP(resolve, reject));
    });
}
```

### 示例

```javascript
import { allWith, getWith } from '@/utils/SqliteUtil';

// 查询多条消息
const messages = await allWith(
    `SELECT * FROM message WHERE dialogId = :dialogId ORDER BY stime DESC LIMIT 50`,
    { dialogId: 'dialog-123' },
    spaceId
);

// 查询单个联系人
const peer = await getWith(
    `SELECT * FROM peer WHERE hid = :hid`,
    { hid: 'peer-123' },
    spaceId
);
```

---

## deleteWith() - 删除数据

通过 `runWith` 或封装的 `deleteAll` 函数实现删除操作。

### 使用 runWith

```javascript
// 删除单条记录
await runWith(
    `DELETE FROM message WHERE uuid = :uuid`,
    { uuid: 'msg-123' },
    spaceId
);

// 批量删除
await runWith(
    `DELETE FROM peer WHERE hid IN ('hid1', 'hid2', 'hid3')`,
    {},
    spaceId
);
```

### sqlApi 中的 deleteAll

```javascript
// src/sqlApi/sql.js
export const deleteAll = (SqlText, params, spaceId) => {
    return runWith(SqlText, params, spaceId)
        .then(res => {})
        .catch(err => {
            console.log('sqlApi Error', err);
            throw new TypeError(err);
        });
};
```

---

## 事务处理

### 基本事务模式

使用 `serialize` 和 `BEGIN/COMMIT` 实现事务：

```javascript
return new Promise(async (resolve, reject) => {
    getDBInstance(spaceId).then(dbInstance => {
        dbInstance.serialize(async function () {
            dbInstance.run('BEGIN');

            // ... 执行多个操作 ...

            dbInstance.run('COMMIT', transP(resolve, reject));
        });
    });
});
```

### 示例：批量更新 FTS 群成员

```javascript
export function batchUpdateFtsGroupMemberName(spaceId, {addRows, updateRows, deleteRows}) {
    return new Promise(async (resolve, reject) => {
        getDBInstance(spaceId).then(dbInstance => {
            dbInstance.serialize(async function () {
                dbInstance.run('BEGIN');

                // 批量插入
                if (addRows && addRows.length > 0) {
                    const insertStmt = dbInstance.prepare(`
                        INSERT OR IGNORE INTO IndexTable (body, type, subType, busItemId, timeStamp)
                        VALUES ($body, $type, $subType, $busItemId, $timeStamp)
                    `);
                    for (let item of addRows) {
                        insertStmt.run({
                            $body: item.body,
                            $type: SearchEnum.ftsType.BUS_TYPE_CONTACT,
                            $subType: SearchEnum.ftsType.BUS_SUBTYPE_CONTACT_GROUP_MEMBER,
                            $busItemId: item.memberId,
                            $timeStamp: item.stime
                        });
                    }
                    insertStmt.finalize();
                }

                // 批量删除
                if (deleteRows && deleteRows.length > 0) {
                    const deleteStmt = dbInstance.prepare(`
                        DELETE FROM IndexTable
                        WHERE busItemId = $busItemId AND type = $type AND subType = $subType
                    `);
                    for (let item of deleteRows) {
                        deleteStmt.run({
                            $type: SearchEnum.ftsType.BUS_TYPE_CONTACT,
                            $subType: SearchEnum.ftsType.BUS_SUBTYPE_CONTACT_GROUP_MEMBER,
                            $busItemId: item.memberId
                        });
                    }
                    deleteStmt.finalize();
                }

                // 批量更新
                if (updateRows && updateRows.length > 0) {
                    const updateStmt = dbInstance.prepare(`
                        UPDATE IndexTable SET body = $body
                        WHERE busItemId LIKE $busItemId AND type = $type AND subType = $subType
                    `);
                    for (let item of updateRows) {
                        updateStmt.run({
                            $body: item.body,
                            $type: SearchEnum.ftsType.BUS_TYPE_CONTACT,
                            $subType: SearchEnum.ftsType.BUS_SUBTYPE_CONTACT_GROUP_MEMBER,
                            $busItemId: item.memberId
                        });
                    }
                    updateStmt.finalize();
                }

                dbInstance.run('COMMIT', transP(resolve, reject));
            });
        });
    });
}
```

---

## 批量操作优化

### betchInsertWith() - 批量插入

使用预编译语句（prepare）进行批量插入，显著提升性能：

```javascript
export function betchInsertWith(tableName, newList, spaceId) {
    return new Promise(async (resolve, reject) => {
        if (!newList.length) {
            resolve('length 0');
            return;
        }

        getDBInstance(spaceId).then(dbInstance => {
            dbInstance.serialize(async function () {
                dbInstance.run('BEGIN');

                const item = newList[0];
                const keys = Object.keys(item);
                const $keys = keys.map(key => `$${key}`);

                const stmt = dbInstance.prepare(
                    `INSERT OR IGNORE INTO ${tableName} (${keys.join(',')}) VALUES (${$keys.join(',')})`
                );

                for (let i = 0; i < newList.length; i++) {
                    let curItem = newList[i];
                    const queryParm = {};
                    for (const key in curItem) {
                        queryParm[`$${key}`] = curItem[key];
                    }
                    stmt.run(queryParm);
                }

                stmt.finalize();
                dbInstance.run('COMMIT', transP(resolve, reject));
            });
        });
    });
}
```

### 使用示例

```javascript
import { betchInsertWith } from '@/utils/SqliteUtil';

const messages = [
    { uuid: 'msg-1', body: 'Hello', stime: 1000 },
    { uuid: 'msg-2', body: 'World', stime: 2000 },
    { uuid: 'msg-3', body: '!', stime: 3000 }
];

await betchInsertWith('message', messages, spaceId);
```

### betchInsertFtsMsg() - 批量插入 FTS 消息

```javascript
export function betchInsertFtsMsg(spaceId, bodyRows) {
    return new Promise(async (resolve, reject) => {
        getDBInstance(spaceId).then(dbInstance => {
            dbInstance.serialize(async function () {
                dbInstance.run('BEGIN');

                const stmt = dbInstance.prepare(`
                    INSERT OR IGNORE INTO IndexTable (body, type, subType, busItemId, timeStamp)
                    VALUES ($body, $type, $subType, $busItemId, $timeStamp)
                `);

                for (let curItem of bodyRows) {
                    // 跳过名片类型
                    if (curItem && curItem.MIMETYPE == 'text/vcard') {
                        continue;
                    }

                    stmt.run({
                        $body: curItem.body,
                        $type: SearchEnum.ftsType.BUS_TYPE_MESSAGE,
                        $subType: !curItem.filelisttype
                            ? SearchEnum.ftsType.BUS_SUBTYPE_MESSAGE
                            : SearchEnum.ftsType.BUS_SUBTYPE_FILE,
                        $busItemId: curItem.uuid,
                        $timeStamp: curItem.stime
                    });
                }

                stmt.finalize();
                dbInstance.run('COMMIT', transP(resolve, reject));
            });
        });
    });
}
```

---

## SQL API 封装层

`src/sqlApi/sql.js` 提供了更高层的封装：

### selectAll - 查询多条

```javascript
export const selectAll = (SqlText, params, spaceId) => {
    return allWith(SqlText, params, spaceId)
        .then(res => res)
        .catch(err => {
            console.log('sqlApi Error', err);
            throw new TypeError(err);
        });
};
```

### selectAllNum - 查询数量

```javascript
export const selectAllNum = (SqlText, params, spaceId) => {
    return allWith(SqlText, params, spaceId)
        .then(res => res[0]['COUNT (*)'] || 0)
        .catch(err => {
            console.log('sqlApi Error', err);
            throw new TypeError(err);
        });
};
```

### selectObj - 查询单条

```javascript
export const selectObj = (SqlText, params, spaceId) => {
    return getWith(SqlText, params, spaceId)
        .then(res => res)
        .catch(err => {
            console.log('sqlApi Error', err);
            throw new TypeError(err);
        });
};
```

### updateAll - 批量更新

```javascript
export const updateAll = (SqlText, params, spaceId, id) => {
    let insertListBack = params.map(item => {
        updateWith(spaceId, SqlText, item, item[id], id, 'hostId', '', false);
    });
    return Promise.all(insertListBack);
};
```

### addInsertAll - 批量插入

```javascript
export const addInsertAll = (SqlText, params, spaceId) => {
    let insertListBack = params.map(item => {
        insertWith(SqlText, item, spaceId);
    });
    return Promise.all(insertListBack);
};
```

---

## 最佳实践

### 1. 始终传入 spaceId

```javascript
// 正确
await allWith(sql, params, spaceId);

// 错误 - 会导致查询错误数据库
await allWith(sql, params);
```

### 2. 使用事务进行批量操作

```javascript
// 推荐：使用事务
dbInstance.serialize(() => {
    dbInstance.run('BEGIN');
    // ... 批量操作 ...
    dbInstance.run('COMMIT');
});

// 不推荐：多次单独操作
for (let item of items) {
    await insertWith('table', item, spaceId);
}
```

### 3. 使用预编译语句

```javascript
// 推荐
const stmt = dbInstance.prepare('INSERT INTO table VALUES (?, ?)');
for (let item of items) {
    stmt.run(item.a, item.b);
}
stmt.finalize();

// 不推荐
for (let item of items) {
    dbInstance.run('INSERT INTO table VALUES (?, ?)', [item.a, item.b]);
}
```

### 4. 批量插入时按 stime 排序

```javascript
/**
 * 【插入】批量插入时需根据 stime 排序后插入，保证 id 和 stime 顺序一致。
 */
messages.sort((a, b) => a.stime - b.stime);
await betchInsertWith('message', messages, spaceId);
```

## 相关文件

- `src/utils/SqliteUtil.js` - 核心 CRUD 工具
- `src/utils/userInfoDBUtil.js` - 用户信息数据库工具
- `src/sqlApi/sql.js` - SQL 操作封装
- `src/sqlApi/index.js` - 业务查询 API
