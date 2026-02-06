# 会议系统 API

会议创建、管理、通话、SDK 集成相关接口。

---

## meetingApi.js - 会议管理

**大小**: 18KB

### 会议绑定

```javascript
import { bindHW } from '@/api/meetingApi';

// 绑定华为会议服务
await bindHW();
```

### 创建会议

```javascript
import {
  createRealtimeMeeting,
  createAppointMeeting
} from '@/api/meetingApi';

// 创建实时会议
const meeting = await createRealtimeMeeting({
  subject: '项目讨论会',
  startTime: Date.now(),
  mediaTypes: 'Video',
  language: 'zh-CN',
  attendees: JSON.stringify([
    { hid: 'user1', name: '张三' },
    { hid: 'user2', name: '李四' }
  ]),
  isMute: false,
  timeZone: 'Asia/Shanghai'
});
// 返回: { meetingId, password, joinUrl, hostKey, ... }

// 创建预约会议
const appointMeeting = await createAppointMeeting({
  subject: '周例会',
  mediaTypes: 'Video',
  language: 'zh-CN',
  attendees: attendeesJson,
  conferenceType: 0,
  startTime: '2026-02-10 10:00:00',
  endTime: '2026-02-10 11:00:00',
  timeZone: 'Asia/Shanghai',
  syncDesktop: true
});
```

### 会议操作

```javascript
import {
  getMeetingInfo,
  getMeetingList,
  cancelMeeting,
  updateMeeting,
  getMeetingParticipants,
  inviteToMeeting
} from '@/api/meetingApi';

// 获取会议信息
const info = await getMeetingInfo(meetingId);

// 获取会议列表
const meetings = await getMeetingList({
  startDate: '2026-02-01',
  endDate: '2026-02-28',
  spaceId
});

// 取消会议
await cancelMeeting(meetingId);

// 更新会议
await updateMeeting(meetingId, {
  subject: '新主题',
  startTime: newTime
});

// 获取参与者
const participants = await getMeetingParticipants(meetingId);

// 邀请参会
await inviteToMeeting(meetingId, ['hid1', 'hid2']);
```

---

## sdkApi.js - SDK 接口

**大小**: 5.1KB

```javascript
import {
  getSdkToken,
  refreshSdkToken,
  getSdkConfig
} from '@/api/sdkApi';

// 获取 SDK Token
const token = await getSdkToken();

// 刷新 SDK Token
const newToken = await refreshSdkToken();

// 获取 SDK 配置
const config = await getSdkConfig();
```

---

## cstApi.js - CST SDK

**大小**: 901B

```javascript
import { cstGetToken } from '@/api/cstApi';

// 获取 CST SDK Token
const cstToken = await cstGetToken();
```

---

## callApi.js - 通话

**大小**: 1KB

```javascript
import { startCall, endCall } from '@/api/callApi';

// 发起通话
await startCall({
  targetHid: userHid,
  type: 'video'  // 'video' | 'audio'
});

// 结束通话
await endCall(callId);
```

---

## callFeedbackApi.js - 通话反馈

**大小**: 2.4KB

```javascript
import { submitCallFeedback } from '@/api/callFeedbackApi';

// 提交通话反馈
await submitCallFeedback({
  callId: 'xxx',
  rating: 5,
  issues: ['audio_quality'],
  comment: '通话清晰'
});
```

---

**最后更新**: 2026-02-05
