# 群组与频道 API

群组创建、管理、成员操作相关接口。

---

## channelApi.js - 频道/群组

**大小**: 8.4KB

### 群组列表

```javascript
import {
  channelGetList,
  getEnterpriseGroup,
  getSpaceAllChannelAndMembers
} from '@/api/channelApi';

// 获取群组列表
const channels = await channelGetList({ spaceId });

// 获取企业群组
const enterpriseGroups = await getEnterpriseGroup({
  deviceType: 'windows',
  spaceId
});

// 获取空间所有群组及成员
const allData = await getSpaceAllChannelAndMembers(spaceId);
```

### 群组创建与配置

```javascript
import {
  channelCreate,
  channelConfig
} from '@/api/channelApi';

// 创建群组
const channel = await channelCreate({
  name: '项目讨论组',
  members: ['hid1', 'hid2'],
  spaceId
});

// 配置群组
await channelConfig(
  { channelId },
  { name: '新名称', announcement: '群公告' }
);
```

### 成员管理

```javascript
import {
  channelIsMember,
  channelInvite,
  channelKick,
  channelLeave,
  channelDissolve
} from '@/api/channelApi';

// 检查是否是成员
const isMember = await channelIsMember({
  channelId,
  hid: userHid
});

// 邀请成员
await channelInvite({ channelId, members: ['hid3'] });

// 踢出成员
await channelKick({ channelId, member: 'hid2' });

// 离开群组
await channelLeave({ channelId });

// 解散群组
await channelDissolve({ channelId });
```

---

## groupApi.js - 群组辅助

**大小**: 1.4KB

```javascript
import { getGroupInfo, updateGroupInfo } from '@/api/groupApi';

// 获取群组信息
const groupInfo = await getGroupInfo(groupHid, spaceId);

// 更新群组信息
await updateGroupInfo(groupHid, {
  name: '新群名',
  avatar: 'avatar-url'
}, spaceId);
```

---

**最后更新**: 2026-02-05
