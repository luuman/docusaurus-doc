# 数据库 API 参考

本文档介绍项目中 SQLCipher 数据库的操作 API 和使用方法。

---

## 目录

- [数据库架构概览](#数据库架构概览)
- [核心 SQL 操作函数](#核心-sql-操作函数)
- [SqliteUtil 工具函数](#sqliteutil-工具函数)
- [sqlApi 封装函数](#sqlapi-封装函数)
- [常用查询示例](#常用查询示例)
- [事务处理](#事务处理)
- [最佳实践](#最佳实践)

---

## 数据库架构概览

项目使用三种数据库：

| 数据库 | 用途 | 连接方式 |
|--------|------|----------|
| `logicDB` | 主业务数据库（消息、联系人、会话等） | 用户登录后连接 |
| `ackDB` | 临时确认数据库（待确认消息） | 应用启动时连接 |
| `forwardDB` | 转发数据库（全局数据） | 应用启动时连接 |

### 数据库文件位置

```
Windows: C:\Users\{username}\AppData\Roaming\{app-name}\{vuid}\{spaceId}\
```

---

## 核心 SQL 操作函数

**文件**: `src/utils/SqliteUtil.js`

### runWith(sql, params, spaceId)

执行 SQL 语句（增删改）。

```javascript
import { runWith } from '@/utils/SqliteUtil';

// 删除消息
await runWith(
  'DELETE FROM message WHERE uuid = ?',
  ['msg-uuid-123'],
  spaceId
);

// 更新状态
await runWith(
  'UPDATE message SET status = ? WHERE uuid = ?',
  [1, 'msg-uuid-123'],
  spaceId
);
```

**参数**:
- `sql` (string): SQL 语句
- `params` (array): 参数数组
- `spaceId` (string): 空间 ID

**返回**: `Promise<{ changes: number, lastInsertRowid: number }>`

---

### getWith(sql, params, spaceId)

查询单条数据。

```javascript
import { getWith } from '@/utils/SqliteUtil';

// 查询单个联系人
const peer = await getWith(
  'SELECT * FROM peer WHERE hid = ?',
  ['user-hid-123'],
  spaceId
);
```

**参数**:
- `sql` (string): SQL 查询语句
- `params` (array): 参数数组
- `spaceId` (string): 空间 ID

**返回**: `Promise<object | undefined>` - 单条记录或 undefined

---

### allWith(sql, params, spaceId)

查询多条数据。

```javascript
import { allWith } from '@/utils/SqliteUtil';

// 查询会话列表
const sessions = await allWith(
  'SELECT * FROM session WHERE spaceId = ? ORDER BY lastTime DESC',
  [spaceId],
  spaceId
);

// 查询消息列表
const messages = await allWith(
  'SELECT * FROM message WHERE dialogId = ? ORDER BY stime DESC LIMIT ?',
  [dialogId, 20],
  spaceId
);
```

**参数**:
- `sql` (string): SQL 查询语句
- `params` (array): 参数数组
- `spaceId` (string): 空间 ID

**返回**: `Promise<array>` - 记录数组

---

### insertWith(sql, params, spaceId)

插入数据。

```javascript
import { insertWith } from '@/utils/SqliteUtil';

// 插入消息
await insertWith(
  `INSERT INTO message (uuid, dialogId, content, stime, status)
   VALUES (?, ?, ?, ?, ?)`,
  ['msg-uuid-456', 'dialog-123', '消息内容', Date.now(), 0],
  spaceId
);
```

**参数**:
- `sql` (string): INSERT 语句
- `params` (array): 参数数组
- `spaceId` (string): 空间 ID

**返回**: `Promise<{ lastInsertRowid: number }>`

---

### updateWith(sql, params, spaceId)

更新数据。

```javascript
import { updateWith } from '@/utils/SqliteUtil';

// 更新消息状态
await updateWith(
  'UPDATE message SET status = ?, readTime = ? WHERE uuid = ?',
  [1, Date.now(), 'msg-uuid-123'],
  spaceId
);
```

**参数**:
- `sql` (string): UPDATE 语句
- `params` (array): 参数数组
- `spaceId` (string): 空间 ID

**返回**: `Promise<{ changes: number }>`

---

## sqlApi 封装函数

**文件**: `src/sqlApi/sql.js`

### selectAll(sql, params, spaceId)

查询多条数据（带日志）。

```javascript
import { selectAll } from '@/sqlApi/sql';

const messages = await selectAll(
  'SELECT * FROM message WHERE dialogId = ?',
  [dialogId],
  spaceId
);
```

---

### selectAllNum(sql, params, spaceId)

查询记录数量。

```javascript
import { selectAllNum } from '@/sqlApi/sql';

const count = await selectAllNum(
  'SELECT COUNT(*) FROM message WHERE dialogId = ?',
  [dialogId],
  spaceId
);
// 返回: number
```

---

### selectObj(sql, params, spaceId)

查询单条数据。

```javascript
import { selectObj } from '@/sqlApi/sql';

const message = await selectObj(
  'SELECT * FROM message WHERE uuid = ?',
  ['msg-uuid-123'],
  spaceId
);
```

---

### addInsert(sql, params, spaceId)

插入单条数据。

```javascript
import { addInsert } from '@/sqlApi/sql';

await addInsert(
  'INSERT INTO peer (hid, name, avatar) VALUES (?, ?, ?)',
  ['user-hid-456', '张三', 'avatar-url'],
  spaceId
);
```

---

### addInsertAll(sql, params, spaceId)

批量插入数据。

```javascript
import { addInsertAll } from '@/sqlApi/sql';

const insertSql = 'INSERT INTO peer (hid, name) VALUES (?, ?)';
const dataList = [
  ['hid-1', '用户1'],
  ['hid-2', '用户2'],
  ['hid-3', '用户3']
];

await addInsertAll(insertSql, dataList, spaceId);
```

---

### updateId(sql, params, spaceId)

更新单条数据。

```javascript
import { updateId } from '@/sqlApi/sql';

await updateId(
  'UPDATE peer SET name = ? WHERE hid = ?',
  ['新名称', 'user-hid-123'],
  spaceId
);
```

---

### deleteAll(sql, params, spaceId)

删除数据。

```javascript
import { deleteAll } from '@/sqlApi/sql';

await deleteAll(
  'DELETE FROM message WHERE dialogId = ? AND stime < ?',
  [dialogId, timestamp],
  spaceId
);
```

---

## 常用查询示例

### 消息相关查询

```javascript
import { selectAll, selectObj } from '@/sqlApi/sql';

// 获取会话的最近消息
const recentMessages = await selectAll(
  `SELECT * FROM message
   WHERE dialogId = ?
   ORDER BY stime DESC
   LIMIT 20`,
  [dialogId],
  spaceId
);

// 获取单条消息
const message = await selectObj(
  'SELECT * FROM message WHERE uuid = ?',
  [msgUuid],
  spaceId
);

// 搜索消息内容
const searchResults = await selectAll(
  `SELECT * FROM message
   WHERE content LIKE ?
   ORDER BY stime DESC`,
  [`%${keyword}%`],
  spaceId
);

// 获取未读消息数
const unreadCount = await selectAllNum(
  `SELECT COUNT(*) FROM message
   WHERE dialogId = ? AND status = 0`,
  [dialogId],
  spaceId
);
```

---

### 联系人相关查询

```javascript
// 获取所有联系人
const contacts = await selectAll(
  `SELECT * FROM peer
   WHERE type = 'user'
   ORDER BY name`,
  [],
  spaceId
);

// 搜索联系人
const searchContacts = await selectAll(
  `SELECT * FROM peer
   WHERE (name LIKE ? OR email LIKE ?)
   AND type = 'user'`,
  [`%${keyword}%`, `%${keyword}%`],
  spaceId
);

// 获取群组成员
const members = await selectAll(
  `SELECT p.* FROM peer p
   INNER JOIN group_member gm ON p.hid = gm.memberHid
   WHERE gm.groupHid = ?`,
  [groupHid],
  spaceId
);
```

---

### 会话相关查询

```javascript
// 获取会话列表
const sessions = await selectAll(
  `SELECT * FROM session
   WHERE spaceId = ?
   ORDER BY pinned DESC, lastTime DESC`,
  [spaceId],
  spaceId
);

// 更新会话最后消息时间
await updateId(
  `UPDATE session
   SET lastTime = ?, lastMsg = ?
   WHERE sessionId = ?`,
  [Date.now(), '最后一条消息', sessionId],
  spaceId
);
```

---

## 事务处理

对于需要原子性的多步操作，使用事务：

```javascript
import { runWith } from '@/utils/SqliteUtil';

// 开始事务
await runWith('BEGIN TRANSACTION', [], spaceId);

try {
  // 执行多个操作
  await runWith(
    'INSERT INTO message (...) VALUES (...)',
    [...],
    spaceId
  );

  await runWith(
    'UPDATE session SET lastTime = ? WHERE sessionId = ?',
    [Date.now(), sessionId],
    spaceId
  );

  // 提交事务
  await runWith('COMMIT', [], spaceId);

} catch (error) {
  // 回滚事务
  await runWith('ROLLBACK', [], spaceId);
  throw error;
}
```

---

## 数据表结构

### message 表

| 字段 | 类型 | 说明 |
|------|------|------|
| uuid | TEXT | 消息唯一 ID (主键) |
| dialogId | TEXT | 会话 ID |
| mcFrom | TEXT | 发送者 HID |
| mcTo | TEXT | 接收者 HID |
| content | TEXT | 消息内容 |
| contentType | TEXT | 内容类型 |
| stime | INTEGER | 服务器时间戳 |
| ctime | INTEGER | 客户端时间戳 |
| mtime | INTEGER | 修改时间戳 |
| status | INTEGER | 消息状态 |
| assertPath | TEXT | 附件本地路径 |
| assertType | INTEGER | 附件类型 |

### peer 表

| 字段 | 类型 | 说明 |
|------|------|------|
| hid | TEXT | 用户 HID (主键) |
| uid | TEXT | 用户 UID |
| name | TEXT | 显示名称 |
| avatar | TEXT | 头像 URL |
| email | TEXT | 邮箱 |
| phone | TEXT | 电话 |
| type | TEXT | 类型 (user/group) |
| status | INTEGER | 状态 |
| detail | TEXT | 详细信息 (JSON) |

### session 表

| 字段 | 类型 | 说明 |
|------|------|------|
| sessionId | TEXT | 会话 ID (主键) |
| spaceId | TEXT | 空间 ID |
| name | TEXT | 会话名称 |
| type | TEXT | 会话类型 |
| lastTime | INTEGER | 最后消息时间 |
| lastMsg | TEXT | 最后消息内容 |
| unreadCount | INTEGER | 未读数 |
| pinned | INTEGER | 是否置顶 |
| muted | INTEGER | 是否静音 |

---

## 最佳实践

### 1. 使用参数化查询

**正确**:
```javascript
await selectAll(
  'SELECT * FROM message WHERE dialogId = ?',
  [dialogId],
  spaceId
);
```

**错误** (SQL 注入风险):
```javascript
await selectAll(
  `SELECT * FROM message WHERE dialogId = '${dialogId}'`,
  [],
  spaceId
);
```

### 2. 分页查询

```javascript
// 使用 LIMIT 和 OFFSET 分页
const pageSize = 20;
const offset = page * pageSize;

const messages = await selectAll(
  `SELECT * FROM message
   WHERE dialogId = ?
   ORDER BY stime DESC
   LIMIT ? OFFSET ?`,
  [dialogId, pageSize, offset],
  spaceId
);
```

### 3. 索引优化

确保频繁查询的字段有索引：

```sql
CREATE INDEX IF NOT EXISTS idx_message_dialogId ON message(dialogId);
CREATE INDEX IF NOT EXISTS idx_message_stime ON message(stime);
CREATE INDEX IF NOT EXISTS idx_peer_type ON peer(type);
```

### 4. 批量操作

对于大量数据操作，使用批量方法：

```javascript
// 批量插入效率更高
await addInsertAll(insertSql, dataList, spaceId);

// 而不是循环单条插入
// for (const item of dataList) {
//   await addInsert(insertSql, item, spaceId); // 效率低
// }
```

### 5. 错误处理

```javascript
import { selectAll } from '@/sqlApi/sql';

try {
  const result = await selectAll(sql, params, spaceId);
  return result;
} catch (error) {
  console.error('数据库查询失败:', error);
  // 记录日志或上报错误
  throw error;
}
```

---

## 相关文档

- [数据库架构](../database/database-architecture.md)
- [表结构详解](../database/table-schema.md)
- [全文搜索](../database/fts-search.md)
- [版本迁移](../database/migration.md)

---

**最后更新**: 2026-02-05
