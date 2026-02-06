# 用户与联系人 API

用户信息、联系人管理、好友请求相关接口。

---

## peerApi.js - 用户/联系人核心

**大小**: 111KB | **重要性**: ⭐⭐⭐⭐⭐

项目中最大的 API 模块之一，处理所有用户和联系人相关逻辑。

### 数据库操作

```javascript
import {
  peerSetDBItem,
  getPeerFromDB,
  updatePeerInDB,
  deletePeerFromDB
} from '@/api/peerApi';

// 批量保存用户到数据库
await peerSetDBItem(peerList, spaceId);

// 从数据库获取用户
const peer = await getPeerFromDB(hid, spaceId);

// 更新用户信息
await updatePeerInDB(hid, { name: '新名称' }, spaceId);
```

### 静音操作

```javascript
import { togglePeerMute } from '@/api/peerApi';

// 设置联系人静音
await togglePeerMute(true, userHid, spaceId);

// 取消静音
await togglePeerMute(false, userHid, spaceId);
```

### 获取用户信息

```javascript
import {
  fetchSummaryByhids,
  fetchPeerDetail,
  searchPeer
} from '@/api/peerApi';

// 批量获取用户摘要
const summaries = await fetchSummaryByhids(hidList, spaceId);

// 获取用户详情
const detail = await fetchPeerDetail(hid, spaceId);

// 搜索用户
const results = await searchPeer({
  keyword: '张三',
  spaceId: currentSpaceId
});
```

### 初始化会话

```javascript
import { initDialogs } from '@/api/peerApi';

// 初始化会话列表
await initDialogs(spaceId);
```

---

## contactApi.js - 联系人操作

**大小**: 7.7KB

### 联系人列表

```javascript
import { contactGetList, contactBlocklist } from '@/api/contactApi';

// 获取联系人列表
const contacts = await contactGetList({
  deviceType: 'windows',
  spaceId: currentSpaceId
});

// 获取黑名单
const blockedUsers = await contactBlocklist({}, { spaceId });
```

### 联系人静音

```javascript
import { contactMute } from '@/api/contactApi';

// 设置静音
await contactMute(
  { spaceId },
  { hid: userHid, mute: true }
);
```

### 好友请求操作

```javascript
import {
  contactReqList,     // 获取好友请求列表
  contactAccept,      // 接受请求
  contactReject,      // 拒绝请求
  contactWithdraw,    // 撤回请求
  contactDelReq       // 删除请求
} from '@/api/contactApi';

// 获取好友请求列表
const requests = await contactReqList({ spaceId });

// 接受好友请求
await contactAccept({ requestId: 'xxx' });

// 拒绝好友请求
await contactReject({ requestId: 'xxx', reason: '...' });
```

---

## contactRequest.js - 好友请求

**大小**: 5.4KB

```javascript
import {
  sendContactRequest,
  updateAllHistoryList
} from '@/api/contactRequest';

// 发送好友请求
await sendContactRequest({
  targetHid: 'user-hid',
  message: '你好，我是张三',
  spaceId: currentSpaceId,
  by: { type: 'NumberSearch' }
});

// 更新历史请求列表
await updateAllHistoryList(spaceId);
```

---

## userApi.js - 用户信息

**大小**: 7KB

```javascript
import {
  getUserInfo,
  userMessage,
  userRemove,
  setUserTop
} from '@/api/userApi';

// 获取用户信息
const userInfo = await getUserInfo(hid);

// 发送消息给用户
await userMessage(hid, messageData);

// 删除用户
await userRemove(hid);

// 置顶用户
await setUserTop(hid, true);
```

---

## peerStatusApi.js - 用户状态

**大小**: 1.9KB

```javascript
import { getPeerStatus, subscribePeerStatus } from '@/api/peerStatusApi';

// 获取用户在线状态
const status = await getPeerStatus(hidList);
// 返回: { 'hid1': 'online', 'hid2': 'offline' }

// 订阅用户状态变化
subscribePeerStatus(hidList, (statusMap) => {
  console.log('状态更新:', statusMap);
});
```

---

**最后更新**: 2026-02-05
