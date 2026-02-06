# 表结构详解

## 概述

本文档详细描述 Matrx-Windows 项目中的数据库表结构，包括字段定义、索引设计和业务含义。

---

## message 表

消息表是核心数据表，存储所有会话消息。

### 表结构

```sql
CREATE TABLE IF NOT EXISTS message(
    id INTEGER PRIMARY KEY,
    filelisttype INTEGER,           -- 文件类型: 1=文件, 11=文件
    hostId TEXT NOT NULL DEFAULT '',-- 登录用户ID
    c TEXT,                         -- 消息来源标识
    t TEXT,                         -- 消息目标标识
    m TEXT,                         -- 消息元数据 (JSON)
    dialogId TEXT,                  -- 会话ID
    peerId TEXT,                    -- 对方用户ID
    expire TEXT,                    -- 过期时间
    isMine TEXT,                    -- 是否本人发送
    messageType TEXT,               -- 消息类型
    MIMETYPE TEXT,                  -- MIME类型
    ctime INTEGER,                  -- 创建时间
    stime INTEGER,                  -- 服务器时间
    uuid TEXT NOT NULL DEFAULT '',  -- 消息唯一标识
    body TEXT,                      -- 消息正文
    meta TEXT,                      -- 元信息
    messageStatus INTEGER,          -- 消息状态: 1=失败
    filename TEXT,                  -- 文件名
    isStar TEXT,                    -- 标记为efailed，标识消息是否失败
    docId TEXT,                     -- 文档ID
    isNeedUpdateFTS TEXT,           -- 是否需要更新FTS索引
    isDeleted TEXT,                 -- 是否已删除
    assertType INTEGER,             -- 资源类型: 1=file, 2=image, 3=link
    finishTime INTEGER,             -- 文件下载完成时间
    assertPath TEXT,                -- 文件协议路径
    fileFragmentMap TEXT DEFAULT '{}', -- 文件分片map，用于恢复进度
    content TEXT,                   -- 内容
    mcFrom TEXT,                    -- 多端来源
    mcTo TEXT,                      -- 多端目标
    uuidRepliedRoot TEXT,           -- 回复消息的根UUID (v4)
    f TEXT,                         -- 附加字段 (v5)
    s TEXT,                         -- 附加字段 (v6)
    stickerRepliedList TEXT,        -- 表情回复列表 (v7)
    pinnedInfo TEXT,                -- 置顶信息 (v9)
    binaryPart TEXT,                -- 二进制部分 (v10)
    unreadReceipt TEXT,             -- 未读回执 (v12)
    receiptShow TEXT NOT NULL DEFAULT 'show', -- 回执显示状态 (v12)
    sessionHide TEXT,               -- 会话隐藏 (v15)
    extraData TEXT,                 -- 扩展数据 (v24)
    tenantId TEXT,                  -- 租户ID (v26)
    burned INTEGER,                 -- 是否已焚毁 (v26)
    msgSeq INTEGER,                 -- 消息序号 (v26)
    lastSeq INTEGER,                -- 最后序号 (v26)
    UNIQUE (hostId, uuid)           -- 唯一约束
);
```

### 索引

```sql
CREATE INDEX IF NOT EXISTS idx_message_type ON message (c, MIMETYPE);
CREATE INDEX IF NOT EXISTS idx_message_dialogID ON message (dialogId);
CREATE INDEX IF NOT EXISTS idx_message_uuid ON message (uuid);
CREATE INDEX IF NOT EXISTS idx_message_docId ON message (docId);
CREATE INDEX IF NOT EXISTS idx_message_isStar ON message (isStar);
CREATE INDEX IF NOT EXISTS idx_message_uuidRepliedRoot ON message (uuidRepliedRoot);
CREATE INDEX IF NOT EXISTS idx_message_dialogID_stime ON message (dialogId, stime);
```

---

## peer 表

联系人/群组信息表，存储好友、群组和普通用户信息。

### 表结构

```sql
CREATE TABLE IF NOT EXISTS peer(
    id INTEGER PRIMARY KEY,
    hostId TEXT NOT NULL DEFAULT '',    -- 登录用户ID
    enterpriseId TEXT,                  -- 企业/空间ID
    myBlock TEXT,                       -- 被我拉黑
    hid TEXT NOT NULL DEFAULT '',       -- 用户/群组唯一标识
    h_account TEXT,                     -- 账号
    h_id TEXT,                          -- 内部ID
    remindlist TEXT,                    -- @我消息uuid列表
    h_sip_number TEXT,                  -- SIP号码
    portraitPath TEXT,                  -- 头像路径
    ctime INTEGER,                      -- 创建时间
    mtime INTEGER,                      -- 修改时间
    protraitMtime INTEGER,              -- 头像修改时间
    survivalTime TEXT,                  -- 存活时间
    type TEXT DEFAULT 'person',         -- 类型: person/group/friend
    firstName TEXT,                     -- 名
    lastName TEXT,                      -- 姓
    name TEXT,                          -- 名称（群组用）
    owner TEXT,                         -- 群主
    verifyType TEXT,                    -- 验证类型
    bannedSwitch TEXT,                  -- 禁言开关
    isTop TEXT,                         -- 是否置顶
    isMute TEXT,                        -- 是否静音
    memberLimit TEXT,                   -- 成员限制
    notice TEXT,                        -- 公告
    isStar TEXT,                        -- 是否星标
    isDeleted TEXT,                     -- 是否已删除
    isBeBlock TEXT,                     -- 是否被对方拉黑
    isDialog TEXT,                      -- 是否为会话
    lastMessageUUID TEXT,               -- 最后消息UUID
    dialogInfo TEXT,                    -- 会话信息
    lastReactTime INTEGER,              -- 最后互动时间
    docId TEXT,                         -- 文档ID
    isNeedUpdateFTS TEXT,               -- 是否需要更新FTS
    detail TEXT,                        -- 详情
    content TEXT,                       -- 内容
    request INTEGER DEFAULT 0,          -- 好友请求状态
    email TEXT,                         -- 邮箱
    phoneNumber TEXT,                   -- 电话号码
    sig TEXT,                           -- 签名
    description TEXT,                   -- 描述
    meetingroomlist TEXT,               -- 会议室列表
    groupInfo TEXT,                     -- 群信息
    e2eDeviceMap TEXT,                  -- E2E设备映射
    alias TEXT,                         -- 备注名 (v18)
    destroyInterval TEXT,               -- 阅后即焚时间间隔 (v16)
    accountPublic TEXT,                 -- 公开账号 (v20)
    updateDestructTime INTEGER,         -- 更新销毁时间 (v29)
    subscribeType TEXT,                 -- 订阅类型 (v24)
    UNIQUE (hostId, hid)                -- 唯一约束
);
```

### request 字段值说明

| 值 | 说明 |
|---|------|
| 0 | 不是好友请求者 |
| 1 | accept |
| 2 | accepted |
| 3 | requestSent |
| 5 | acceptUnread |
| 20 | removed |

### type 字段值说明

| 值 | 说明 |
|---|------|
| person | 普通人 |
| peer | 陌生人 |
| group | 群 |
| friend | 好友 |

### 索引

```sql
CREATE INDEX IF NOT EXISTS idx_peer_isNeedUpdateFTS ON peer (isNeedUpdateFTS);
CREATE INDEX IF NOT EXISTS idx_peer_docId ON peer (docId);
CREATE INDEX IF NOT EXISTS idx_peer_lastMessageUUID ON peer (lastMessageUUID);
CREATE INDEX IF NOT EXISTS idx_peer_isDialog ON peer (isDialog);
CREATE INDEX IF NOT EXISTS idx_peer_isBeBlock ON peer (isBeBlock);
CREATE INDEX IF NOT EXISTS idx_peer_isDeleted ON peer (isDeleted);
CREATE INDEX IF NOT EXISTS idx_peer_isStar ON peer (isStar);
CREATE INDEX IF NOT EXISTS idx_peer_isPin ON peer (isTop);
CREATE INDEX IF NOT EXISTS idx_peer_ctime ON peer (ctime);
CREATE INDEX IF NOT EXISTS idx_peer_mtime ON peer (mtime);
CREATE INDEX IF NOT EXISTS idx_peer_hid ON peer (hid);
CREATE INDEX IF NOT EXISTS idx_peer_type ON peer (type);
CREATE INDEX IF NOT EXISTS idx_peer_hid_isDeleted ON peer (hid, isDeleted);
```

---

## session 表

会话表，管理用户的聊天会话状态。

### 表结构

```sql
CREATE TABLE IF NOT EXISTS session(
    id INTEGER PRIMARY KEY,
    hostId TEXT NOT NULL DEFAULT '',    -- 登录用户ID
    hid TEXT NOT NULL DEFAULT '',       -- 会话ID
    enterpriseId TEXT,                  -- 空间ID
    myBlock TEXT,                       -- 被我拉黑的人列表
    remindlist TEXT,                    -- @我消息uuid列表
    isTop TEXT,                         -- 是否置顶
    isMute TEXT,                        -- 是否静音
    memberLimit TEXT,                   -- 成员限制
    isStar TEXT,                        -- 是否星标好友
    lastMessageUUID TEXT,               -- 最后一条消息uuid
    unreadCount TEXT,                   -- 未读数
    lastReactTime INTEGER,              -- 最后一条消息时间stime
    isDeleted TEXT,                     -- 是否删除 (v13)
    isGroupDismiss NULL,                -- 群是否解散 (v21)
    extraData TEXT,                     -- 扩展数据 (v23)
    draftObj TEXT,                      -- 草稿对象 (v20)
    maxSeq INTEGER,                     -- 最大序号 (v26)
    historyMsgMaxSeq INTEGER,           -- 历史消息最大序号 (v26)
    readtime INTEGER,                   -- 已读时间 (v27)
    clearHistoryTime INTEGER,           -- 清除历史时间 (v27)
    maxSeqForStime INTEGER,             -- 最大序号对应的stime (v28)
    insertState INTEGER,                -- 插入状态 (v29)
    maxSeqForUUID INTEGER,              -- 最大序号对应的UUID (v29)
    updateDeleteTime INTEGER,           -- 更新删除时间 (v29)
    updateMuteTime INTEGER,             -- 更新静音时间 (v29)
    updateTopTime INTEGER,              -- 更新置顶时间 (v29)
    UNIQUE (hostId, hid)                -- 唯一约束
);
```

### 索引

```sql
CREATE INDEX IF NOT EXISTS idx_session_lastMessageUUID ON session (lastMessageUUID);
CREATE INDEX IF NOT EXISTS idx_session_lastMessageUUID_lastReactTime ON session (lastMessageUUID, lastReactTime);
CREATE INDEX IF NOT EXISTS idx_session_isStar ON session (isStar);
CREATE INDEX IF NOT EXISTS idx_session_isPin ON session (isTop);
CREATE INDEX IF NOT EXISTS idx_session_unreadCount ON session (unreadCount);
CREATE INDEX IF NOT EXISTS idx_session_hid ON session (hid);
```

---

## organization 表

组织架构表，存储企业组织结构信息。

### 表结构

```sql
CREATE TABLE IF NOT EXISTS organization(
    id INTEGER PRIMARY KEY,
    organId TEXT NOT NULL DEFAULT '',   -- 组织ID
    spaceName TEXT NOT NULL DEFAULT '', -- 空间名称
    spaceType INTEGER,                  -- 空间类型
    pid TEXT NOT NULL DEFAULT '',       -- 父级ID
    level INTEGER,                      -- 层级
    size INTEGER,                       -- 大小
    rootId TEXT NOT NULL DEFAULT '',    -- 根ID
    uidList TEXT NOT NULL DEFAULT '',   -- 用户ID列表
    mapList TEXT NOT NULL DEFAULT ''    -- 映射列表
);
```

---

## forward 表 (appdata)

转发缓存表，用于存储应用数据。

### 表结构

```sql
CREATE TABLE IF NOT EXISTS appdata(
    id INTEGER PRIMARY KEY,
    key TEXT,           -- 键
    value TEXT,         -- 值
    timestamp INTEGER,  -- 时间戳
    expire INTEGER,     -- 过期时间
    extra TEXT          -- 扩展数据
);
```

---

## ACK 相关表

### temp_message 表

临时消息表，用于消息发送确认。

```sql
CREATE TABLE IF NOT EXISTS temp_message(
    id INTEGER PRIMARY KEY,
    key TEXT,               -- 消息键
    tempMessage TEXT,       -- 临时消息内容
    stime TEXT,             -- 服务器时间
    p TEXT,                 -- 附加字段 (v2)
    spaceId TEXT,           -- 空间ID (v3)
    msgSeq INTEGER,         -- 消息序号 (v3)
    dialogId TEXT,          -- 会话ID (v3)
    UNIQUE (key)
);
CREATE INDEX IF NOT EXISTS idx_temp_message_key ON temp_message (key);
```

### offline_session 表

离线会话表，记录离线消息区间。

```sql
CREATE TABLE IF NOT EXISTS offline_session(
    id INTEGER PRIMARY KEY,
    dialogId TEXT NOT NULL DEFAULT '',      -- 会话ID
    spaceId TEXT NOT NULL DEFAULT '',       -- 空间ID
    type TEXT NOT NULL DEFAULT '',          -- 类型
    offlineRegion TEXT NOT NULL DEFAULT '', -- 离线区间
    updateTime INTEGER                      -- 更新时间 (v4)
);
```

### temp_wait_message 表

等待消息表，用于消息队列管理。

```sql
CREATE TABLE IF NOT EXISTS temp_wait_message(
    id INTEGER PRIMARY KEY,
    key TEXT,               -- 键
    tempMessage TEXT,       -- 临时消息
    targetuuid TEXT,        -- 目标UUID
    dialogId TEXT           -- 会话ID
);
CREATE INDEX IF NOT EXISTS idx_temp_wait_message_targetuuid ON temp_wait_message (targetuuid);
```

---

## FTS 索引表

### IndexTable (FTS5)

全文搜索虚拟表。

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS IndexTable USING fts5(
    body,                       -- 搜索内容
    type UNINDEXED,             -- 类型（不索引）
    subType UNINDEXED,          -- 子类型（不索引）
    busItemId UNINDEXED,        -- 业务项ID（不索引）
    timeStamp UNINDEXED,        -- 时间戳（不索引）
    tokenize='unicode61'        -- 分词器
);
```

---

## 其他辅助表

### setting 表

用户设置表。

```sql
CREATE TABLE IF NOT EXISTS setting(
    id INTEGER PRIMARY KEY,
    hid TEXT,
    spaceId TEXT,
    hostId TEXT NOT NULL DEFAULT '',
    privateChats INTEGER,
    channels INTEGER,
    autoconnectedAudio INTEGER,
    showingPreview INTEGER,
    content TEXT,
    videoCheck INTEGER,
    usePersonalRoom INTEGER,
    meetExperienceSurvey INT NOT NULL DEFAULT 1,
    meetInvViaEmail INT NOT NULL DEFAULT 1,
    openAudioConnected INT NOT NULL DEFAULT 1,
    options TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_setting_peerId ON setting (hostId, hid);
```

### voice 表

语音消息状态表。

```sql
CREATE TABLE IF NOT EXISTS voice(
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL DEFAULT '',  -- 消息UUID
    isListened TEXT,                -- 是否已听
    UNIQUE (uuid)
);
```

### meeting 表

会议记录表。

```sql
CREATE TABLE IF NOT EXISTS meeting(
    id INTEGER PRIMARY KEY,
    conferenceId TEXT NOT NULL DEFAULT '',      -- 会议ID
    cycleSubConfID TEXT NOT NULL DEFAULT '',    -- 周期子会议ID
    messageUuid TEXT NOT NULL DEFAULT '',       -- 消息UUID
    authorizer TEXT                             -- 授权人
);
CREATE INDEX IF NOT EXISTS idx_meeting_conferenceId_authorizer ON meeting (conferenceId, authorizer, cycleSubConfID);
```

### emailPeer 表

邮件联系人表。

```sql
CREATE TABLE IF NOT EXISTS emailPeer(
    id INTEGER PRIMARY KEY,
    uid TEXT NOT NULL DEFAULT '',       -- 用户ID
    email TEXT NOT NULL DEFAULT '',     -- 邮箱
    firstName TEXT NOT NULL DEFAULT '', -- 名
    lastName TEXT NOT NULL DEFAULT '',  -- 姓
    mobile TEXT NOT NULL DEFAULT '',    -- 手机
    company TEXT NOT NULL DEFAULT '',   -- 公司
    notes TEXT NOT NULL DEFAULT ''      -- 备注
);
```

### approval 表

审批表。

```sql
CREATE TABLE IF NOT EXISTS approval(
    id INTEGER PRIMARY KEY,
    businessId TEXT NOT NULL DEFAULT '',    -- 业务ID
    messageUuid TEXT NOT NULL DEFAULT '',   -- 消息UUID
    taskId TEXT NOT NULL DEFAULT '',        -- 任务ID
    extraData TEXT                          -- 扩展数据
);
CREATE INDEX IF NOT EXISTS idx_approval_taskId ON approval (taskId);
```

### temp_destroy_message 表

阅后即焚消息表。

```sql
CREATE TABLE IF NOT EXISTS temp_destroy_message(
    id INTEGER PRIMARY KEY,
    uuid TEXT,                      -- 消息UUID
    dialogId TEXT,                  -- 会话ID
    stime INTEGER,                  -- 服务器时间
    destroyStartTimestamp INTEGER,  -- 销毁开始时间
    destroyInterval INTEGER,        -- 销毁间隔
    destroyTimestamp INTEGER,       -- 销毁时间
    extra TEXT,                     -- 扩展数据
    UNIQUE (uuid)
);
```

---

## 索引设计说明

### 设计原则

1. **查询优化**: 为高频查询字段创建索引
2. **复合索引**: 对常一起查询的字段创建复合索引
3. **唯一约束**: 使用 `UNIQUE` 约束确保数据唯一性
4. **避免过度索引**: 只为必要字段创建索引，避免影响写入性能

### 核心索引策略

| 表 | 索引 | 用途 |
|---|------|------|
| message | `idx_message_dialogID_stime` | 会话消息时间排序查询 |
| message | `idx_message_uuid` | UUID快速查找 |
| peer | `idx_peer_hid` | 用户快速查找 |
| peer | `idx_peer_type` | 按类型筛选联系人 |
| session | `idx_session_hid` | 会话快速查找 |
| session | `idx_session_lastReactTime` | 会话时间排序 |

### 复合索引

- `(hostId, uuid)` - 消息表唯一约束
- `(hostId, hid)` - peer/session 表唯一约束
- `(dialogId, stime)` - 消息时间线查询
- `(hid, isDeleted)` - 过滤已删除联系人

## 相关文件

- `src/sql/init/v1.js` - 基础表结构定义
- `src/sql/init/v11.js` - session 表定义
- `src/sql/init/v19.js` - organization 表定义
- `src/sql/init/v2.js` ~ `src/sql/init/v29.js` - 各版本迁移脚本
