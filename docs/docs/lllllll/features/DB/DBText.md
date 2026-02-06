# 数据库表

备注：

1. hostId 账号 ID 无用的一条数据

## db.enc

```mermaid
graph TD
  subgraph message[消息表]
		uuid
    dialogId
  end
  subgraph peer[个人信息表]
  end
  subgraph file[文件表]
  end
  subgraph keypairs[MessageInput]
  end
  subgraph kv[MessageInput]
  end
  subgraph metaTable[MessageInput]
  end
  subgraph voice[语音表]
  end
  subgraph setting[个人设置表]
  end
  subgraph session[会话表]
		lastMessageUUID
    hid
  end
  subgraph peddingUnread[已读回执缓存表]
  end
	lastMessageUUID-->|keyup|uuid
  dialogId-->|keyup|hid
  subgraph TOP[MessageInput]
    M39-->Y2{键盘类型}
  end
```

<!-- tabs:start -->

#### **session**

| 会话表           | 类型    | 默认值 | 废弃 | 描述                        |
| ---------------- | ------- | ------ | ---- | --------------------------- |
| id               | INTEGER | KEY    |      | KEY                         |
| hostId           | TEXT    | ''     |      | 本人 ID                     |
| hid              | TEXT    | ''     |      | 会话 id                     |
| ~~enterpriseId~~ | TEXT    | NULL   |      | 空间 id（废弃）             |
| ~~myBlock~~      | TEXT    | NULL   |      | 被我拉黑的人列表            |
| remindlist       | TEXT    | NULL   | no   | at 我消息 uuid 列表         |
| isTop            | TEXT    | NULL   |      | 是否置顶                    |
| isMute           | TEXT    | NULL   |      | 是否静音                    |
| ~~memberLimit~~  | TEXT    | NULL   |      | 成员限制（成员列表）        |
| ~~isStar~~       | TEXT    | NULL   |      | 是否星标好友                |
| lastMessageUUID  | TEXT    | NULL   |      | 最后一条消息 uuid           |
| unreadCount      | TEXT    | NULL   |      | 未读数                      |
| lastReactTime    | INTEGER | NULL   |      | 最后一条消息时间 stime      |
| isDeleted        | TEXT    | NULL   |      | 是否隐藏                    |
| UNIQUE           |         |        |      | 唯一约束 hid 和当前登录 hid |

```
CREATE TABLE session(
  id INTEGER PRIMARY KEY,
  hostId TEXT NOT NULL DEFAULT '',
	-- 会话id
  hid TEXT NOT NULL DEFAULT '',
	-- 空间id
  enterpriseId TEXT ,
	-- 被我拉黑的人列表
  myBlock TEXT,
	-- at我消息uuid列表
  remindlist TEXT,
	-- 是否置顶
  isTop TEXT,
	-- 是否静音
  isMute TEXT,
	-- 是否静音
  memberLimit TEXT,
	-- 是否星标好友
  isStar TEXT,
	-- 最后一条消息uuid
  lastMessageUUID TEXT,
	-- 未读数
  unreadCount TEXT,
	-- 最后一条消息时间stime
  lastReactTime INTEGER, isDeleted TEXT,
	-- 唯一约束 hid和当前登录hid
  UNIQUE (hostId,hid)
)
```

#### **message**

| 消息表                 | 类型    | 默认值 | 废弃 | 描述                                                        |
| ---------------------- | ------- | ------ | ---- | ----------------------------------------------------------- |
| id                     | INTEGER | KEY    |      | KEY                                                         |
| filelisttype           | INTEGER | NULL   |      | 消息文件分类（1:图片 11 图片未下载完成状态 2:文件 3:link）  |
| hostId                 | TEXT    | ''     |      | 个人 hid                                                    |
| c                      | TEXT    | NULL   |      | 发送消息类型（HyperText、）                                 |
| t                      | TEXT    | NULL   |      | 接收方 hid                                                  |
| m                      | TEXT    | NULL   |      | 消息内容主体部分                                            |
| dialogId               | TEXT    | NULL   |      | 所属会话 ID                                                 |
| peerId                 | TEXT    | NULL   |      | 所属人 ID                                                   |
| expire                 | TEXT    | NULL   |      |                                                             |
| isMine                 | TEXT    | NULL   |      | 是否是我的消息（1、NULL）                                   |
| messageType            | TEXT    | NULL   |      | 消息所属类型（user、group）                                 |
| MIMETYPE               | TEXT    | NULL   |      | 消息类型 （text/plain ）                                    |
| ctime                  | INTEGER | NULL   |      | 消息时间戳（服务端）                                        |
| stime                  | INTEGER | NULL   |      | 消息时间戳(客户端)                                          |
| uuid                   | TEXT    | ''     |      | 消息 ID                                                     |
| body                   | TEXT    | NULL   |      | 消息内容                                                    |
| meta                   | TEXT    | NULL   |      | 消息媒体信息（已读、表情、引用）                            |
| ~~messageStatus~~      | INTEGER | NULL   |      | 1 失败 其它情况视为成功                                     |
| ~~filename~~           | TEXT    | NULL   |      | 文件名称                                                    |
| isStar                 | TEXT    | NULL   |      | 表示失败意思 改为 efailed 标识消息是否失败                  |
| ~~docId~~              | TEXT    | NULL   | no   |                                                             |
| ~~isNeedUpdateFTS~~    | TEXT    | NULL   | no   | 批量更新索引表优化性能                                      |
| ~~isDeleted~~          | TEXT    | NULL   |      | 是否隐藏（1 隐藏、NULL）                                    |
| ~~assertType~~         |         | NULL   |      | 1 file 2 image 3 link                                       |
| ~~finishTime~~         | INTEGER | NULL   |      | 文件下载完成时间                                            |
| assertPath             | TEXT    | NULL   |      | 文件协议路径                                                |
| fileFragmentMap        | TEXT    | {}     |      | 文件分片 map 用于恢复进度                                   |
| content                | TEXT    | NULL   |      | 消息体的全部内容                                            |
| mcFrom                 | TEXT    | NULL   |      | 接收方（空间+hid）                                          |
| mcTo                   | TEXT    | NULL   |      | 接收方（空间+hid）                                          |
| ~~uuidRepliedRoot      | TEXT    | NULL   |      | reply 引用指向消息的（ UUID ）                              |
| f                      | TEXT    | NULL   |      | 发送方（hostId）                                            |
| s                      | TEXT    | NULL   |      | 接收方 id                                                   |
| ~~stickerRepliedList~~ | TEXT    | NULL   | no   | 获取表情回复字段列表                                        |
| ~~pinnedInfo~~         | TEXT    | NULL   | no   |                                                             |
| binaryPart             | TEXT    | NULL   |      | 文件二进制流                                                |
| unreadReceipt          | TEXT    | NULL   |      | 已读状态（0 未读、1 【部分、已发送】、2 已读、NULL 不展示） |
| receiptShow            | TEXT    | 'show' |      | 是否展示已读（show、hid）                                   |
| UNIQUE                 |         |        |      | hostId,uuid                                                 |

```
CREATE TABLE message(
  id INTEGER PRIMARY KEY,
  filelisttype INTEGER,
  hostId TEXT NOT NULL DEFAULT '',
  c TEXT,
  t TEXT,
  m TEXT,
  dialogId TEXT,
  peerId TEXT,
  expire TEXT,
  isMine TEXT,
  messageType TEXT,
  MIMETYPE TEXT,
  ctime INTEGER,
  stime INTEGER,
  uuid TEXT NOT NULL DEFAULT '',
  body TEXT,
  meta TEXT,
  messageStatus INTEGER, -- 1 失败 其它情况视为成功
  filename TEXT,
  isStar TEXT, -- 改为 efailed 标识消息是否失败
  docId TEXT,
  isNeedUpdateFTS TEXT,
  isDeleted TEXT,
  assertType INTEGER, -- 1 file 2 image 3 link
  finishTime INTEGER, -- 文件下载完成时间，为下载为默认值 null
  assertPath TEXT, -- 文件协议路径
  fileFragmentMap TEXT DEFAULT '{}', -- 文件分片 map 用于恢复进度
  content TEXT,
  mcFrom TEXT,
  mcTo TEXT, uuidRepliedRoot TEXT, f TEXT, s TEXT, stickerRepliedList TEXT, pinnedInfo TEXT, binaryPart TEXT, unreadReceipt TEXT, receiptShow TEXT NOT NULL DEFAULT 'show',
  UNIQUE (hostId,uuid)
)
```

#### **peer**

| 个人信息表      | 类型    | 默认值   | 废弃 | 描述                                                                              |
| --------------- | ------- | -------- | ---- | --------------------------------------------------------------------------------- |
| id              | INTEGER | KEY      |      | KEY                                                                               |
| hostId          | TEXT    | ''       |      |                                                                                   |
| enterpriseId    | TEXT    | NULL     |      | 空间 ID                                                                           |
| myBlock         | TEXT    | NULL     |      | 是否拉黑                                                                          |
| hid             | TEXT    | ''       |      | 用户 ID                                                                           |
| h_account       | TEXT    | NULL     |      |                                                                                   |
| h_id            | TEXT    | NULL     |      |                                                                                   |
| remindlist      | TEXT    | NULL     |      |                                                                                   |
| h_sip_number    | TEXT    | NULL     |      |                                                                                   |
| portraitPath    | TEXT    | NULL     |      | 头像地址                                                                          |
| ctime           | INTEGER | NULL     |      | 时间戳                                                                            |
| mtime           | INTEGER | NULL     |      | 时间戳                                                                            |
| protraitMtime   | INTEGER | NULL     |      | 头像时间戳                                                                        |
| survivalTime    | TEXT    | NULL     | no   |                                                                                   |
| type            | TEXT    | 'person' |      | 类型（friend、group、peer、person）                                               |
| firstName       | TEXT    | NULL     |      |                                                                                   |
| lastName        | TEXT    | NULL     |      |                                                                                   |
| name            | TEXT    | NULL     |      |                                                                                   |
| owner           | TEXT    | NULL     |      | 群主 ID                                                                           |
| verifyType      | TEXT    | NULL     |      |                                                                                   |
| bannedSwitch    | TEXT    | NULL     |      |                                                                                   |
| isTop           | TEXT    | NULL     |      | 置顶（废弃）                                                                      |
| isMute          | TEXT    | NULL     |      | 静音（废弃）                                                                      |
| memberLimit     | TEXT    | NULL     |      | （废弃）                                                                          |
| notice          | TEXT    | NULL     |      |                                                                                   |
| isStar          | TEXT    | NULL     |      | （废弃）                                                                          |
| isDeleted       | TEXT    | NULL     |      | （废弃）                                                                          |
| isBeBlock       | TEXT    | NULL     |      | （废弃）                                                                          |
| isDialog        | TEXT    | NULL     |      | （废弃）                                                                          |
| lastMessageUUID | TEXT    | NULL     |      |                                                                                   |
| dialogInfo      | TEXT    | NULL     |      |                                                                                   |
| lastReactTime   | INTEGER | NULL     |      |                                                                                   |
| docId           | TEXT    | NULL     |      |                                                                                   |
| isNeedUpdateFTS | TEXT    | NULL     |      |                                                                                   |
| detail          | TEXT    | NULL     |      |                                                                                   |
| content         | TEXT    | NULL     |      | 0 不是好友请求者, 1 accept, 2 accepted, 3 requestSent, 5 acceptUnread, 20 removed |
| request         | INTEGER | 0        |      |                                                                                   |
| email           | TEXT    | NULL     |      | email                                                                             |
| phoneNumber     | TEXT    | NULL     | no   | phoneNumber                                                                       |
| sig             | TEXT    | NULL     |      | sig                                                                               |
| description     | TEXT    | NULL     | no   |                                                                                   |
| meetingroomlist | TEXT    | NULL     |      |                                                                                   |
| groupInfo       | TEXT    | NULL     | no   |                                                                                   |
| e2eDeviceMap    | TEXT    | NULL     |      |                                                                                   |
| UNIQUE          |         |          |      | hostId,uuid                                                                       |

```
CREATE TABLE peer(
  id INTEGER PRIMARY KEY,
  hostId TEXT NOT NULL DEFAULT '',
  enterpriseId TEXT ,
  myBlock TEXT,
  hid TEXT NOT NULL DEFAULT '',
  h_account TEXT,
  h_id TEXT,
  remindlist TEXT,
  h_sip_number TEXT,
  portraitPath TEXT,
  ctime INTEGER,
  mtime INTEGER,
  protraitMtime INTEGER,
  survivalTime TEXT, --  person 普通人 group 群 friend 好友
  type TEXT DEFAULT 'person',
  firstName TEXT,
  lastName TEXT,
  name TEXT,
  owner TEXT,
  verifyType TEXT,
  bannedSwitch TEXT,
  isTop TEXT,
  isMute TEXT,
  memberLimit TEXT,
  notice TEXT,
  isStar TEXT,
  isDeleted TEXT,
  isBeBlock TEXT,
  isDialog TEXT,
  lastMessageUUID TEXT,
  dialogInfo TEXT ,
  lastReactTime INTEGER,
  docId TEXT,
  isNeedUpdateFTS TEXT ,
  detail TEXT,
  content TEXT, --  peer request 0 不是好友请求者, 1 accept, 2 accepted, 3 requestSent, 5 acceptUnread, 20 removed
  request INTEGER DEFAULT 0,
  email TEXT,
  phoneNumber TEXT,
  sig TEXT,
  description TEXT,
  meetingroomlist TEXT,
  groupInfo TEXT,
  e2eDeviceMap TEXT,
  UNIQUE (hostId,hid)
)
```

#### **peddingUnread**

| 已读回执缓存表 | 类型    | 默认值 | 废弃 | 描述 |
| -------------- | ------- | ------ | ---- | ---- |
| id             | INTEGER | KEY    |      | KEY  |
| f              | TEXT    | ''     |      |      |
| t              | TEXT    | ''     |      |      |
| stime          | TEXT    | ''     |      |      |
| payload        | TEXT    | ''     |      |      |

```
CREATE TABLE peddingUnread(
  id INTEGER PRIMARY KEY,
  f TEXT NOT NULL DEFAULT '',
  t TEXT NOT NULL DEFAULT '',
  stime TEXT NOT NULL DEFAULT '',
  payload TEXT NOT NULL DEFAULT ''
)
```

#### **keypairs**

| 企业用户表 | 类型    | 默认值 | 废弃 | 描述                                              |
| ---------- | ------- | ------ | ---- | ------------------------------------------------- |
| id         | INTEGER | KEY    |      | KEY                                               |
| hostId     | TEXT    | ''     |      |                                                   |
| pairName   | TEXT    | NULL   |      | （sessionmigration、installed、enterpriseMember） |
| pairValue  | TEXT    | NULL   |      | 值                                                |

```
CREATE TABLE keypairs(
  id INTEGER PRIMARY KEY,
  hostId TEXT NOT NULL DEFAULT '',
  pairName TEXT,
  pairValue TEXT
)

export async function getEnterpriseMember(spaceId = defaultSpaceId(), hid) {
  let hostId = await getHid();
  let all = await getWith(
    `select pairName from keypairs where hostId=:hostId and pairName=:pairName And pairValue LIKE "%${hid}%"`,
    {
      hostId,
      pairName: 'enterpriseMember'
    },
    spaceId
  );
  return all;
}
```

#### **organization**

| 组织架构  | 类型    | 默认值 | 废弃 | 描述                                         |
| --------- | ------- | ------ | ---- | -------------------------------------------- |
| id        | INTEGER | KEY    |      | KEY                                          |
| organId   | TEXT    | ''     |      | 空间 ID                                      |
| spaceName | TEXT    |        |      | 空间名称                                     |
| spaceType | INTEGER |        |      | 空间类型: 0-公司, 1-部门                     |
| pid       | TEXT    |        |      | 父级 ID，当为根节点时(level=1)此值为空字符串 |
| level     | INTEGER |        |      | 层级                                         |
| size      | INTEGER |        |      | 人数                                         |
| rootId    | TEXT    |        |      | 根节点空间 ID                                |
| uidList   | TEXT    |        |      | 空间下用户的 uid 集合                        |

```
CREATE TABLE keypairs(
  id INTEGER PRIMARY KEY,
  organId TEXT NOT NULL DEFAULT '',
  spaceName TEXT NOT NULL DEFAULT '',
  spaceType INTEGER,
  pid TEXT NOT NULL DEFAULT '',
  level INTEGER,
  size INTEGER,
  rootId TEXT NOT NULL DEFAULT '',
  uidList TEXT NOT NULL DEFAULT '',
)

"spaceList": [{
			"id": "UAE-971-0000001",
			"level": 1,
			"pid": "",
			"rootId": "UAE-971-0000001",
			"size": 271,
			"spaceName": "Matrx Team",
			"spaceType": 0,
			"uidList": [971233079302050800, 65251934196822560, 86187556975331970],
			"childList": [{
				"id": "UAE-971-3961989100",
				"level": 2,
				"pid": "UAE-971-0000001",
				"rootId": "UAE-971-0000001",
				"size": 9,
				"spaceName": "SupportTeam",
				"spaceType": 1,
				"uidList": [238735774911950, 86172606176902820, 164720603379960, 8656835311494735, 97115032386802030, 971125941330284200, 65161679749289420, 146600137277845, 8664939916132246],
				"childList": []
			}]
		}]
```

#### **file(废弃)**

| file       | 类型    | 默认值 | 废弃 | 描述                                  |
| ---------- | ------- | ------ | ---- | ------------------------------------- |
| id         | INTEGER | KEY    |      | KEY                                   |
| docId      | TEXT    | NULL   |      |                                       |
| hid        | TEXT    | NULL   |      | hid 软关联 peer 中的 hid              |
| uuid       | TEXT    | NULL   |      |                                       |
| content    | TEXT    | NULL   |      |                                       |
| fileSize   | INTEGER | NULL   |      | 文件大小 单位 bit                     |
| fileName   | TEXT    | NULL   |      |                                       |
| metaType   | INTEGER | NULL   |      | 1 file, 2 image, 3 link               |
| createTime | INTEGER | 0      |      | NOT NULL DEFAULT 0,                   |
| finishTime | INTEGER | NULL   |      | 文件下载完成时间，为下载为默认值 null |
| url        | TEXT    | NULL   |      | 文件协议路径                          |
| hostId     | TEXT    | ''     |      |                                       |

```
CREATE TABLE file(
  id INTEGER PRIMARY KEY,
  docId TEXT,
  hid TEXT, -- hid 软关联peer中的hid
  uuid TEXT,
  content TEXT,
  fileSize INTEGER, -- 文件大小 单位bit
  fileName TEXT,
  metaType INTEGER, -- 1 file, 2 image, 3 link
  createTime INTEGER NOT NULL DEFAULT 0,
  finishTime INTEGER, -- 文件下载完成时间，为下载为默认值null
  url TEXT, -- 文件协议路径
  hostId TEXT NOT NULL DEFAULT ''
)
```

#### **kv(废弃)**

| message   | 类型    | 默认值 | 废弃 | 描述 |
| --------- | ------- | ------ | ---- | ---- |
| id        | INTEGER | KEY    |      | KEY  |
| pairName  | TEXT    | NULL   |      |      |
| pairValue | TEXT    | NULL   |      |      |

```
CREATE TABLE kv(
  id INTEGER PRIMARY KEY,
  pairName TEXT,
  pairValue TEXT
)
```

#### **metaTable(废弃)**

| message   | 类型    | 默认值 | 废弃 | 描述 |
| --------- | ------- | ------ | ---- | ---- |
| id        | INTEGER | KEY    |      | KEY  |
| docId     | INTEGER | 0      |      |      |
| type      | TEXT    | NULL   |      |      |
| subType   | TEXT    | NULL   |      |      |
| busItemId | TEXT    | NULL   |      |      |
| timeStamp | INTEGER | NULL   |      |      |

```
CREATE TABLE metaTable(
  id INTEGER PRIMARY KEY,
  docId INTEGER NOT NULL DEFAULT 0,
  type TEXT,
  subType TEXT,
  busItemId TEXT,
  timeStamp INTEGER
)
```

#### **voice(废弃)**

| message    | 类型    | 默认值 | 废弃 | 描述 |
| ---------- | ------- | ------ | ---- | ---- |
| id         | INTEGER | KEY    |      | KEY  |
| uuid       | TEXT    | ''     |      |      |
| isListened | TEXT    | NULL   |      |      |
| UNIQUE     |         |        |      | uuid |

```
CREATE TABLE voice(
  id INTEGER PRIMARY KEY,
  uuid TEXT NOT NULL DEFAULT '',  -- 语音消息是否被听过
  isListened TEXT,
  UNIQUE (uuid)
)
```

#### **setting(废弃)**

| message            | 类型    | 默认值 | 废弃 | 描述 |
| ------------------ | ------- | ------ | ---- | ---- |
| id                 | INTEGER | KEY    |      | KEY  |
| hid                | TEXT    | NULL   |      |      |
| spaceId            | text    | NULL   |      |      |
| hostId             | TEXT    | ''     |      |      |
| privateChats       | INTEGER | NULL   |      |      |
| channels           | INTEGER | NULL   |      |      |
| autoconnectedAudio | INTEGER | NULL   |      |      |
| showingPreview     | INTEGER | NULL   |      |      |
| content            | TEXT    | NULL   |      |      |
| videoCheck         | INTEGER | NULL   |      |      |
| usePersonalRoom    | INTEGER | NULL   |      |      |

```
CREATE TABLE setting(
  id INTEGER PRIMARY KEY,
  hid TEXT,
  spaceId text,
  hostId TEXT NOT NULL DEFAULT '',
  privateChats INTEGER,
  channels INTEGER,
  autoconnectedAudio INTEGER,
  showingPreview INTEGER,
  content TEXT,
  videoCheck INTEGER,
  usePersonalRoom INTEGER
)
```

<!-- tabs:end -->

<!-- tabs:start -->

#### **IndexTable**

| message   | 类型 | 默认值 | 废弃 | 描述 |
| --------- | ---- | ------ | ---- | ---- |
| body      | TEXT | KEY    |      | KEY  |
| type      | TEXT | NULL   |      |      |
| subType   | TEXT | NULL   |      |      |
| busItemId | TEXT | NULL   |      |      |
| timeStamp | TEXT | NULL   |      |      |

```
CREATE TABLE 'IndexTable_config'(k PRIMARY KEY, v) WITHOUT ROWID
CREATE TABLE 'IndexTable_content'(id INTEGER PRIMARY KEY, c0, c1, c2, c3, c4)
CREATE TABLE 'IndexTable_data'(id INTEGER PRIMARY KEY, block BLOB)
CREATE TABLE 'IndexTable_docsize'(id INTEGER PRIMARY KEY, sz BLOB)
CREATE TABLE 'IndexTable_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID
```

#### **IndexTable_config**

| IndexTable_config | 类型 | 默认值 | 废弃 | 描述 |
| ----------------- | ---- | ------ | ---- | ---- |
| k                 | TEXT | NULL   |      | 名称 |
| v                 | TEXT | NULL   |      | 描述 |

#### **IndexTable_content**

| IndexTable_content | 类型    | 默认值 | 废弃 | 描述      |
| ------------------ | ------- | ------ | ---- | --------- |
| id                 | INTEGER | KEY    |      | KEY       |
| c0                 | TEXT    | NULL   |      | body      |
| c1                 | TEXT    | NULL   |      | type      |
| c2                 | TEXT    | NULL   |      | subType   |
| c3                 | TEXT    | NULL   |      | busItemId |
| c4                 | TEXT    | NULL   |      | timeStamp |

#### **IndexTable_data**

| IndexTable_data | 类型    | 默认值 | 废弃 | 描述 |
| --------------- | ------- | ------ | ---- | ---- |
| id              | INTEGER | KEY    |      | KEY  |
| block           | TEXT    | NULL   |      |      |

#### **IndexTable_docsize**

| IndexTable_docsize | 类型    | 默认值 | 废弃 | 描述 |
| ------------------ | ------- | ------ | ---- | ---- |
| id                 | INTEGER | KEY    |      | KEY  |
| sz                 | TEXT    | NULL   |      |      |

#### **IndexTable_idx**

| IndexTable_idx | 类型    | 默认值 | 废弃 | 描述 |
| -------------- | ------- | ------ | ---- | ---- |
| segid          | INTEGER | KEY    |      | KEY  |
| term           | TEXT    | NULL   |      |      |
| pgno           | TEXT    | NULL   |      |      |
| KEY            | TEXT    | NULL   |      |      |

<!-- tabs:end -->

## ackdb.enc

| 消息缓存    | 类型    | 默认值 | 废弃 | 描述                        |
| ----------- | ------- | ------ | ---- | --------------------------- |
| id          | INTEGER | KEY    |      | KEY                         |
| key         | TEXT    | ''     |      | 本人 ID                     |
| tempMessage | TEXT    | ''     |      | 会话 id                     |
| stime       | INTEGER | NULL   |      | 最后一条消息时间 stime      |
| p           | TEXT    | NULL   |      | 是否隐藏                    |
| UNIQUE      |         |        |      | 唯一约束 hid 和当前登录 hid |

## user.enc

| customer | 类型    | 默认值 | 废弃 | 描述                        |
| -------- | ------- | ------ | ---- | --------------------------- |
| id       | INTEGER | KEY    |      | KEY                         |
| hostId   | TEXT    | ''     |      | 本人 ID                     |
| content  | TEXT    | ''     |      | 会话 id                     |
| UNIQUE   |         |        |      | 唯一约束 hid 和当前登录 hid |

downloadfilemap
id
hostId
uuid
downloadpath

downloadsetting
id
hid
hostId
remaind
isRemainded
noSpaceRemainded
defalutPath

ftsmigration
spaceId
currentRowld
maxRowId
isFinish

needping
id
hostId
peerId
spaceId

setting
id
hid
spaceId
hostId
privateChats
channels
autoconnectedAudio
showingPreview
content
videoCheck
usePersonalRoom
