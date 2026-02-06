# 全文搜索 (FTS)

## 概述

Matrx-Windows 项目使用 SQLite FTS5（Full-Text Search 5）实现全文搜索功能，支持消息内容、联系人姓名、群组名称和群成员的快速检索。

## FTS 模块架构

### 文件结构

```
src/utils/ftsDB/
├── ftsService.js      # 核心 FTS 服务 API
├── searchUtil.js      # 搜索工具函数
└── groupMemberUtil.js # 群成员搜索工具
```

### FTS 表结构

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS IndexTable USING fts5(
    body,                       -- 搜索内容（被索引）
    type UNINDEXED,             -- 类型（不索引）
    subType UNINDEXED,          -- 子类型（不索引）
    busItemId UNINDEXED,        -- 业务项ID（不索引）
    timeStamp UNINDEXED,        -- 时间戳（不索引）
    tokenize='unicode61'        -- 分词器：支持 Unicode
);
```

**说明**：
- `body` 字段是被索引的搜索内容
- 其他字段使用 `UNINDEXED` 标记，不参与全文索引，仅作为元数据存储
- 使用 `unicode61` 分词器支持多语言

---

## 搜索状态枚举 (SearchEnum)

```javascript
// src/enum/SearchStatus.js
export const SearchEnum = {
    status: ['INIT', 'LOADING', 'NOTHING', 'NORMAL'],

    type: {
        all: 1,
        contacts: 2,
        channels: 3
    },

    globalType: {
        all: 1,
        message: 2,
        contacts: 3,
        channels: 4
    },

    ftsType: {
        // 联系人类型
        BUS_TYPE_CONTACT: 1,
        // 联系人-好友名称
        BUS_SUBTYPE_CONTACT_FRIEND: 1,
        // 联系人-群名称
        BUS_SUBTYPE_CONTACT_GROUP: 2,
        // 联系人-群成员
        BUS_SUBTYPE_CONTACT_GROUP_MEMBER: 3,
        // 联系人-服务号
        BUS_SUBTYPE_CONTACT_SUBSCRIBE: 4,

        // 消息类型
        BUS_TYPE_MESSAGE: 2,
        // 普通消息
        BUS_SUBTYPE_MESSAGE: 1,
        // 文件消息
        BUS_SUBTYPE_FILE: 2
    }
};
```

### 类型对照表

| type | subType | 说明 |
|------|---------|------|
| 1 | 1 | 联系人-好友 |
| 1 | 2 | 联系人-群组 |
| 1 | 3 | 联系人-群成员 |
| 1 | 4 | 联系人-服务号 |
| 2 | 1 | 消息-普通消息 |
| 2 | 2 | 消息-文件 |

---

## ftsService.js 核心 API

### FtsService 类

`FtsService` 是 FTS 功能的核心服务类，提供静态方法进行各类搜索操作。

### 初始化联系人和群组索引

```javascript
// 初始化一个空间的 FTS 用户数据
static async setupContactAndGroupName(vuid, spaceId) {
    // 1. 删除旧的联系人索引
    await _deleteTable(['meta', 'IndexTable'], spaceId,
        SearchEnum.ftsType.BUS_TYPE_CONTACT,
        SearchEnum.ftsType.BUS_SUBTYPE_CONTACT_FRIEND);

    // 2. 删除旧的群组索引
    await _deleteTable(['meta', 'IndexTable'], spaceId,
        SearchEnum.ftsType.BUS_TYPE_CONTACT,
        SearchEnum.ftsType.BUS_SUBTYPE_CONTACT_GROUP);

    // 3. 删除旧的服务号索引
    await _deleteTable(['meta', 'IndexTable'], spaceId,
        SearchEnum.ftsType.BUS_TYPE_CONTACT,
        SearchEnum.ftsType.BUS_SUBTYPE_CONTACT_SUBSCRIBE);

    // 4. 重建索引
    await _setupFriendAndGroupFTS(spaceId);
}
```

### 消息搜索

#### batchSearch - 批量搜索消息

```javascript
static async batchSearch({
    queryStr,                   // 搜索关键词
    limit = 50,                 // 限制数量
    offset = 0,                 // 偏移量
    spaceId,                    // 空间ID
    type = SearchEnum.ftsType.BUS_TYPE_MESSAGE,     // 类型
    subType = SearchEnum.ftsType.BUS_SUBTYPE_MESSAGE, // 子类型
    filterOpt = {}              // 过滤选项
}) {
    // 转义并分词
    queryStr = transTerm(queryStr);

    if (queryStr) {
        let basicSqlStr = `
            SELECT fts.originalBusItemId, m.uuid, m.stime, m.peerId,
                   m.dialogId, m.body, m.stime, m.meta, m.MIMETYPE
            FROM message m
            INNER JOIN (
                SELECT IndexTable.body as body,
                       IndexTable.busItemId as originalBusItemId,
                       CASE
                           WHEN INSTR(IndexTable.busItemId, '|') > 0
                           THEN SUBSTR(IndexTable.busItemId, 1, INSTR(IndexTable.busItemId, '|') - 1)
                           ELSE IndexTable.busItemId
                       END AS bId
                FROM IndexTable
                WHERE body MATCH :queryStr
                  AND type = :type
                  AND subType = :subType
            ) fts ON m.uuid = fts.bId
            WHERE m.MIMETYPE != 'text/vcard'
        `;

        // 应用过滤条件
        let {newSqlStr, newBindObj} = formateBindObj({
            filterOpt,
            basicSqlStr,
            basicSqlBindObj: { queryStr, limit, offset, type, subType },
            add: true
        });

        // 执行查询
        let searchResList = await allWith(
            newSqlStr + ` ORDER BY m.stime desc LIMIT :limit OFFSET :offset;`,
            newBindObj,
            spaceId
        );

        return searchResList;
    }
    return [];
}
```

#### 使用示例

```javascript
import { FtsService } from '@/utils/ftsDB/ftsService';
import { SearchEnum } from '@/enum/SearchStatus.js';

// 搜索消息
const messages = await FtsService.batchSearch({
    queryStr: '会议',
    limit: 20,
    offset: 0,
    spaceId: 'space-123',
    type: SearchEnum.ftsType.BUS_TYPE_MESSAGE,
    subType: SearchEnum.ftsType.BUS_SUBTYPE_MESSAGE,
    filterOpt: {
        dialogId: 'dialog-456',      // 可选：限定会话
        stimeStart: 1700000000000,   // 可选：时间范围开始
        stimeEnd: 1710000000000      // 可选：时间范围结束
    }
});
```

---

## 联系人搜索

### queryMeta - 搜索联系人/群组

```javascript
static async queryMeta({
    queryStr,                   // 搜索关键词
    type,                       // 类型
    subType,                    // 子类型
    limit = 50,                 // 限制数量
    offset = 0,                 // 偏移量
    spaceId = defaultSpaceId(), // 空间ID
    isQueryGroup = false        // 是否同时查询群成员
}) {
    // 转义双引号单引号
    queryStr = queryStr.trim().replace(/("|')/g, '$1$1');

    let str = `
        SELECT * FROM IndexTable
        WHERE body MATCH :queryStr
          AND type = :type
          AND subType = :subType
        ORDER BY rank ASC
        LIMIT :limit OFFSET :offset;
    `;

    // 如果同时查询群成员
    if (isQueryGroup) {
        str = `
            SELECT * FROM IndexTable
            WHERE body MATCH :queryStr
              AND type = :type
              AND (subType = :subType OR subType = 3)
            ORDER BY rank ASC
            LIMIT :limit OFFSET :offset;
        `;
    }

    let metaList = await allWith(str, {
        queryStr: `"${queryStr}" OR "${queryStr}"*`,
        limit,
        offset,
        type,
        subType
    }, spaceId);

    return metaList;
}
```

### 使用示例

```javascript
// 搜索好友
const friends = await FtsService.queryMeta({
    queryStr: '张',
    type: SearchEnum.ftsType.BUS_TYPE_CONTACT,
    subType: SearchEnum.ftsType.BUS_SUBTYPE_CONTACT_FRIEND,
    limit: 20,
    spaceId: 'space-123'
});

// 搜索群组（包含群成员）
const groups = await FtsService.queryMeta({
    queryStr: '项目',
    type: SearchEnum.ftsType.BUS_TYPE_CONTACT,
    subType: SearchEnum.ftsType.BUS_SUBTYPE_CONTACT_GROUP,
    isQueryGroup: true,
    spaceId: 'space-123'
});
```

---

## 群名/群成员搜索

### getGroupAndMemberHid - 搜索群组和群成员

```javascript
static async getGroupAndMemberHid(queryStr, spaceId) {
    // 转义双引号单引号
    queryStr = queryStr.trim().replace(/("|')/g, '$1$1');

    let searchCountList = await allWith(`
        SELECT busItemId, body, type, subType
        FROM IndexTable
        WHERE type = 1
          AND (subType = 2 OR subType = 3)  -- 群组或群成员
          AND body MATCH :queryStr
    `, {
        queryStr: `"${queryStr}" OR "${queryStr}"*`
    }, spaceId);

    return searchCountList;
}
```

### queryGroupMembersByGHid - 获取群成员列表

```javascript
static async queryGroupMembersByGHid({busItemId, spaceId}) {
    let metaList = await allWith(`
        SELECT * FROM IndexTable
        WHERE type = 1
          AND subType = 3
          AND busItemId LIKE :busItemId
    `, {
        busItemId: `${busItemId}|%`
    }, spaceId);

    return metaList;
}
```

**注意**：群成员的 `busItemId` 格式为 `{groupHid}|{memberHid}`

---

## 索引更新策略

### 插入索引

```javascript
static async insert(ftsMsgList) {
    if (!(ftsMsgList instanceof Array)) {
        ftsMsgList = [ftsMsgList];
    }

    ftsMsgList?.forEach(async item => {
        let {spaceId, type, subType, busItemId, timeStamp, body} = item;

        if (body && body.trim()) {
            body = body.replace(/("|')/g, '$1$1').trim();

            // 检查是否已存在
            const isExists = await allWith(
                `SELECT 1 FROM IndexTable WHERE busItemId = '${busItemId}' LIMIT 1`,
                {},
                spaceId
            );

            if (!isExists?.length) {
                // 不存在则插入
                insertWith('IndexTable', {
                    type, subType, busItemId, timeStamp, body
                }, spaceId);
            } else {
                // 存在则更新
                runWith(`
                    UPDATE IndexTable
                    SET type = :type, subType = :subType, body = :body, timeStamp = :timeStamp
                    WHERE busItemId = :busItemId
                `, {
                    type, subType, busItemId, timeStamp, body
                }, spaceId);
            }
        }
    });
}
```

### 删除索引

```javascript
static async delete({spaceId, type, subType, busItemId}) {
    let sql = `DELETE FROM IndexTable WHERE type = ${type}`;

    if (type == SearchEnum.ftsType.BUS_TYPE_MESSAGE) {
        // 消息类型：同时删除关联的子项
        sql += ` AND (
            busItemId = '${busItemId}'
            OR busItemId LIKE '${busItemId}|%'
        )`;
    } else {
        // 联系人类型
        sql += ` AND busItemId = "${busItemId}" AND subType = ${subType}`;
    }

    return await runWith(sql, {}, spaceId);
}
```

### 批量删除

```javascript
static async batchDeleteBusItemID({spaceId, busItemIds}) {
    busItemIds = busItemIds.map(a => "'" + a + "'").join(',');
    let sql = `DELETE FROM IndexTable WHERE busItemId IN (${busItemIds})`;
    return await runWith(sql, {}, spaceId);
}
```

### 更新索引

```javascript
static async update({spaceId, type, subType, newType, newSubType, busItemId, timeStamp, body}) {
    return await runWith(`
        UPDATE IndexTable
        SET type = :newType, subType = :newSubType, body = :body, timeStamp = :timeStamp
        WHERE type = :type AND subType = :subType AND busItemId = :busItemId
    `, {
        type, subType, newType, newSubType, busItemId, timeStamp, body
    }, spaceId);
}
```

---

## 消息索引迁移

### 迁移流程

```javascript
static async setupMsg(spaceId) {
    const rowCount = 1000;  // 每批处理 1000 条

    // 读取当前迁移进度
    let currentRowID = await readWaterMark(spaceId);
    const maxRowID = await readMsgMaxRowID(spaceId);

    if (!currentRowID || !maxRowID) {
        await writeWaterMark(spaceId, { spaceId, isFinish: true });
        return;
    }

    // 分批处理
    do {
        await betchSetupFtsMsg(spaceId, currentRowID, rowCount);

        let lastRowID = currentRowID + rowCount;
        await writeWaterMark(spaceId, {
            spaceId,
            currentRowId: lastRowID,
            maxRowId: maxRowID,
            isFinish: false
        });

        currentRowID = await readWaterMark(spaceId);
    } while (currentRowID <= maxRowID);

    // 完成迁移
    if (Number(currentRowID) >= Number(maxRowID)) {
        await writeWaterMark(spaceId, { spaceId, isFinish: true });
    }
}
```

### 迁移状态记录

迁移状态存储在用户信息数据库的 `ftsmigration` 表中：

```sql
CREATE TABLE IF NOT EXISTS ftsmigration(
    spaceId TEXT NOT NULL DEFAULT '' UNIQUE,
    currentRowId INTEGER,
    maxRowId INTEGER,
    isFinish TEXT
);
```

---

## 搜索工具函数

### transTerm - 搜索词转换

```javascript
// src/utils/ftsDB/searchUtil.js
export function transTerm(queryStr) {
    return queryStr
        .trim()
        .replace(/("|')/g, '$1$1')  // 转义引号
        .split(' ')                  // 按空格分词
        .filter(i => i)              // 过滤空元素
        .map(i => `"${i}"*`)         // 添加前缀匹配
        .join(' ');                  // 组合
}

// 示例
// 输入: "hello world"
// 输出: '"hello"* "world"*'
```

### concentrateShow - 居中截取显示

长文本匹配多个关键字时，进行居中截取显示：

```javascript
export function concentrateShow({body, limit = 229, searchV}) {
    if (!body || !searchV) return '';

    let searchValList = splitTerm(searchV);
    let searchIdxList = searchValList.reduce((sum, searchVal) => {
        // 查找匹配位置
        // ...
    }, []);

    if (searchIdxList.length > 0) {
        firstIdx = Math.min.apply(null, searchIdxList);

        // 正文小于显示长度，全文显示
        if (limit >= body.length) {
            return `${body}`;
        }

        // 匹配内容在末尾，显示末尾部分
        if (firstIdx + limit > body.length) {
            return `...${body.substring(body.length - limit)}`;
        }

        // 匹配内容在前面或中间
        if (firstIdx + limit <= body.length) {
            if (firstIdx == 0) {
                return `${body}`;
            } else {
                return `...${body.substr(firstIdx, body.length)}`;
            }
        }
    }

    return `${body}`;
}
```

### chineseAndEnRegBType - 高亮正则生成

用于高亮被检索内容：

```javascript
export function chineseAndEnRegBType(searchVal) {
    let enReg = /[a-z]|[A-Z]/gu;
    let matchWorldList = [];

    searchVal = searchVal.replace(ignoreTxtReg, '');
    let searchValList = searchVal.split(' ');

    for (let searchVal of searchValList) {
        // 非英文内容按词匹配
        if (!searchVal.match(enReg)) {
            matchWorldList.push(searchVal);
        } else {
            // 英文内容添加词边界
            matchWorldList.push('\\b' + searchVal);
        }
    }

    let matchWorld = matchWorldList.join('|');
    let reg = new RegExp(matchWorld, 'gui');
    return reg;
}
```

---

## 群成员工具函数

### groupMemberUtil.js

#### 刷新群成员索引

```javascript
// src/utils/ftsDB/groupMemberUtil.js
export async function updateDBGroupMemberName(hid, members, spaceId) {
    // 1. 获取当前数据库中的群成员列表
    let currentGroupMemberList = await queryDBNameByHidList(hid, spaceId);

    // 2. 对比差异
    let {groupHid, allDiffMap} = await getDiff({
        groupHid: hid,
        newMemberList: members.map(item => ({
            ...item,
            ftsBody: renderName(item, 4)
        })),
        currentMemberList: currentGroupMemberList,
        currentKeyNameMap: { key: 'busItemId', valueKey: 'body' },
        newMemberKeyNameMap: { key: 'id', valueKey: 'ftsBody' }
    });

    let {addMap, deleteMap, nameDiffMap} = allDiffMap;

    // 3. 批量更新
    let addRows = formateRows(addMap, groupHid);
    let updateRows = formateRows(nameDiffMap, '%');
    let deleteRows = formateRows(deleteMap, groupHid);

    await batchUpdateFtsGroupMemberName(spaceId, {
        addRows,
        updateRows,
        deleteRows
    });
}
```

#### 删除群成员索引

```javascript
// 退群或解散群时，删除该群所有群成员索引
export async function deleteFtsAllGroupMember(groupHid, spaceId = defaultSpaceId()) {
    let busItemId = groupHid + '|%';
    await FtsService.deleteAllGroupMember({
        busItemId,
        spaceId
    });
}
```

---

## 最佳实践

### 1. 搜索词处理

```javascript
// 转义特殊字符
queryStr = queryStr.trim().replace(/("|')/g, '$1$1');

// 使用 FTS5 MATCH 语法
// 支持前缀匹配: "hello"*
// 支持 OR 操作: "hello" OR "hello"*
```

### 2. 索引更新时机

- **消息发送/接收**: 调用 `FtsService.nomarlFtsMsg(message)`
- **联系人更新**: 调用 `FtsService.setupContactAndGroupName()`
- **群成员变化**: 调用 `updateDBGroupMemberName()`

### 3. 性能优化

- 使用 `LIMIT` 和 `OFFSET` 分页
- 使用 `UNINDEXED` 标记非搜索字段
- 批量操作使用事务

## 相关文件

- `src/utils/ftsDB/ftsService.js` - FTS 核心服务
- `src/utils/ftsDB/searchUtil.js` - 搜索工具函数
- `src/utils/ftsDB/groupMemberUtil.js` - 群成员搜索工具
- `src/enum/SearchStatus.js` - 搜索状态枚举
- `src/sql/init/v8.js` - FTS 表定义
