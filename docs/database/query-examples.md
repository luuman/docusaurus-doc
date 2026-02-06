# SQL 查询示例

> 项目中常用的 SQL 查询语句参考，按业务模块分类整理。

## Peer (联系人) 查询

### makeVuexNewest — 批量获取联系人

```sql
SELECT * FROM peer
WHERE hid IN ('hid1', 'hid2', ...)
AND hostId = :hostId
```

### getAllSearchPeer — 搜索用可用联系人

查询好友或群组（包括自己），用于搜索消息。

```sql
SELECT * FROM peer
WHERE hostId = :hostId
  AND isDeleted IS NULL
  AND isBeBlock IS NULL
  AND myBlock IS NULL
  AND type = :type
LIMIT :limit OFFSET :offset
```

### findPeerIn — 查询特定人员

```sql
SELECT * FROM peer
WHERE hostId = :hostId
  AND isDeleted IS NULL
  AND hid != :hostId
  AND isBeBlock IS NULL
  AND myBlock IS NULL
  AND hid IN ('hid1', 'hid2', ...)
```

### findAvailableForwarders — 转发选择联系人

```sql
SELECT p.*, s.isDeleted, s.lastReactTime AS lastTime, s.isTop
FROM peer p
LEFT JOIN session s ON s.hid = p.hid
WHERE p.hostId = :hostId
  AND (p.type = 'friend' OR p.type = 'group')
  AND p.hid != :hid
  AND p.hid NOT IN (...)
  AND s.isDeleted IS NULL
  AND p.isBeBlock IS NULL
  AND p.myBlock IS NULL
ORDER BY s.lastReactTime DESC, s.isTop DESC, p.name ASC
LIMIT :start, :size
```

### findAvailablePersonsByLike — 模糊搜索好友

```sql
SELECT * FROM peer
WHERE hostId = :hostId
  AND (type = 'friend' OR type = 'group')
  AND isDeleted IS NULL
  AND hid != :hid
  AND hid NOT IN (...)
  AND isBeBlock IS NULL
  AND myBlock IS NULL
  AND name LIKE :searchVal
ORDER BY isDialog DESC, isTop DESC, lastReactTime DESC, mtime DESC
```

### fetchSummaryByhids — 批量获取摘要

```sql
SELECT * FROM peer
WHERE hostId = :hostId
AND hid IN ('hid1', 'hid2', ...)
```

### areWeFriend — 判断是否是好友

```sql
SELECT count(*) AS n FROM peer
WHERE hid = :hid
  AND hostId = :hostId
  AND type = 'friend'
  AND isDeleted IS NULL
```

### fetchRequests — 获取好友请求

```sql
SELECT * FROM peer
WHERE hostId = :hostId
  AND request BETWEEN 1 AND 19
ORDER BY mtime DESC
LIMIT 7000
```

### fetchNumber — 未读好友请求数

```sql
SELECT count(*) AS n FROM peer
WHERE request = :acceptUnread
AND hostId = :hostId
```

### deleteContactDB — 删除联系人（软删除）

```sql
UPDATE peer SET type = 'peer'
WHERE type = 'friend' AND hid = :hid
```

## Message (消息) 查询

### fetchMessageFrom — 按时间方向获取消息

```sql
SELECT * FROM message
WHERE dialogId = :dialogId
  AND hostId = :hostId
  AND c NOT IN ('application/receipt', 'application/cmd')
  AND (MIMETYPE IS NULL OR MIMETYPE NOT IN ('application/receipt', 'application/cmd'))
  AND isDeleted IS NULL
  AND stime > :stime  -- 或 < :stime，取决于方向
ORDER BY stime DESC   -- 或 ASC
LIMIT 30
```

### fetchMessageAfterAToB — 获取时间区间消息

```sql
SELECT * FROM message
WHERE dialogId = :dialogId
  AND hostId = :hostId
  AND c NOT IN ('application/receipt', 'application/cmd')
  AND (MIMETYPE IS NULL OR MIMETYPE NOT IN ('application/receipt', 'application/cmd'))
  AND isDeleted IS NULL
  AND stime < :astime
  AND stime >= :bstime
ORDER BY stime DESC
```

### takeLastMessage — 获取最后一条消息

```sql
SELECT * FROM message
WHERE dialogId = :dialogId
  AND c IN ('HyperText', 'Event')
  AND (MIMETYPE IS NULL OR MIMETYPE NOT IN ('application/receipt', 'application/cmd'))
  AND isDeleted IS NULL
ORDER BY stime DESC
LIMIT 1
```

### fetchMessageByUUID — 按 UUID 查找消息

```sql
SELECT * FROM message WHERE uuid = :uuid AND hostId = :hostId
```

### makeMessageFail / makeMessageSuccess — 更新消息状态

```sql
-- 标记失败
UPDATE message SET messageStatus = 1 WHERE hostId = :hostId AND uuid = :uuid

-- 标记成功
UPDATE message SET messageStatus = 3 WHERE hostId = :hostId AND uuid = :uuid
```

### deleteAMessage — 删除消息

```sql
DELETE FROM message WHERE uuid = :uuid AND hostId = :hostId
```

## File (文件) 查询

### fetchFiles — 获取文件列表

```sql
SELECT message.*, peer.firstName AS senderfirstName, peer.lastName AS senderlastName
FROM message
LEFT JOIN peer ON message.peerId = peer.hid AND peer.hostId = :me
WHERE message.filelisttype = :type
  AND message.dialogId = :dialogId
ORDER BY message.stime DESC
LIMIT :start, :howmuch
```

## Session (会话) 查询

### fetchMetioned — 获取 @ 提醒列表

```sql
SELECT remindlist FROM session WHERE hid = :hid
```

### saveMentioned — 保存 @ 提醒

```sql
SELECT remindlist FROM session WHERE hostId = :hostId AND hid = :hid
```

## Setting (设置) 查询

### readSettings — 读取设置

```sql
SELECT * FROM setting WHERE spaceId = :spaceId AND hid = :hid
```
