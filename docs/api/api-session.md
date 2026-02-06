# 会话管理 API

会话列表、会话操作、SDK 会话接口。

---

## sessionApi.js - 会话管理

**大小**: 15KB

### 获取会话列表

```javascript
import {
  getUISessionList,
  getDBSessionList,
  getSingleDBSession
} from '@/api/sessionApi';

// 获取 UI 会话列表（包含最后消息、用户信息）
const sessions = await getUISessionList(spaceId);

// 获取数据库会话列表
const dbSessions = await getDBSessionList(spaceId);

// 获取单个会话
const session = await getSingleDBSession(spaceId, hid);
```

### 会话操作

```javascript
import {
  updateSession,
  deleteSession,
  clearSession
} from '@/api/sessionApi';

// 更新会话
await updateSession(sessionId, {
  lastTime: Date.now(),
  unreadCount: 0
}, spaceId);

// 删除会话
await deleteSession(sessionId, spaceId);

// 清空会话消息
await clearSession(sessionId, spaceId);
```

---

## conversationApi.js - 会话 SDK 接口

**大小**: 4.4KB

与 IM SDK 交互的会话接口。

### 会话基本操作

```javascript
import {
  conversationGetMaxId,
  conversationTop,
  conversationTopList,
  conversationHide,
  conversationMessage
} from '@/api/conversationApi';

// 获取会话最大 ID
const maxId = await conversationGetMaxId({ spaceId });

// 置顶会话
await conversationTop({
  conversationId: sessionId,
  top: true
});

// 获取置顶列表
const topList = await conversationTopList({ spaceId });

// 隐藏会话
await conversationHide({
  conversationId: sessionId,
  hide: true
});

// 获取会话消息
const messages = await conversationMessage({
  conversationId: sessionId,
  limit: 20
});
```

### 静音设置

```javascript
import {
  muteSettings,
  groupMuteUpdate,
  userMuteUpdate,
  enterpriseUserMuteUpdate
} from '@/api/conversationApi';

// 获取静音设置
const muteList = await muteSettings({ spaceId });

// 设置群组静音
await groupMuteUpdate({
  groupId: groupHid,
  notifyLevel: 1  // 0=正常, 1=静音
});

// 设置用户静音
await userMuteUpdate({
  userHid: targetHid,
  mute: true
});

// 设置企业用户静音
await enterpriseUserMuteUpdate({
  enterpriseId,
  userHid,
  mute: true
});
```

### 群组操作

```javascript
import {
  createGroup,
  groupMembers
} from '@/api/conversationApi';

// 创建群组
const group = await createGroup({
  name: '项目组',
  members: memberList
});

// 获取群组成员
const members = await groupMembers({ groupId });
```

---

**最后更新**: 2026-02-05
