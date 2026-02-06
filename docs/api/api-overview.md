# API 架构总览

本目录详细整理 `src/api/` 下所有 50 个 API 模块的使用文档。

---

## 文件分类统计

| 分类 | 文件数 | 核心文件 | 文档链接 |
|------|--------|----------|----------|
| 核心基础设施 | 5 | axiosInstance.js, socketUtil.js | [查看](api-infrastructure.md) |
| 认证与账户 | 4 | loginApi.js, account.js | [查看](api-auth.md) |
| 用户与联系人 | 6 | peerApi.js, contactApi.js | [查看](api-user-contact.md) |
| 消息系统 | 6 | messageManger.js, messageApi.js | [查看](api-message.md) |
| 会话管理 | 3 | sessionApi.js, conversationApi.js | [查看](api-session.md) |
| 群组与频道 | 2 | channelApi.js, groupApi.js | [查看](api-group.md) |
| 会议系统 | 5 | meetingApi.js, sdkApi.js | [查看](api-meeting.md) |
| 文件管理 | 3 | FileApi.js, uploadApi.js | [查看](api-file.md) |
| 空间与企业 | 2 | spaceApi.js, storageDataApi.js | [查看](api-space.md) |
| 安全与加密 | 2 | e2eeApi.js, dohApi.js | [查看](api-security.md) |
| 其他功能 | 12 | aiApi.js, translateApi.js 等 | [查看](api-other.md) |
| **总计** | **50** | - | - |

---

## 文件大小排名 (Top 15)

| 排名 | 文件 | 大小 | 说明 |
|------|------|------|------|
| 1 | messageManger.js | 171KB | 消息处理核心引擎 |
| 2 | peerApi.js | 111KB | 用户/联系人管理核心 |
| 3 | messageApi.js | 29KB | 消息数据库操作 |
| 4 | loginApi.js | 20KB | 登录认证流程 |
| 5 | FileApi.js | 19KB | 文件操作 |
| 6 | meetingApi.js | 18KB | 会议管理 |
| 7 | axiosInstance.js | 17KB | HTTP 请求配置 |
| 8 | socketUtil.js | 15KB | WebSocket 连接 |
| 9 | sessionApi.js | 15KB | 会话管理 |
| 10 | dohApi.js | 9KB | DNS over HTTPS |
| 11 | channelApi.js | 8KB | 群组/频道 |
| 12 | contactApi.js | 7KB | 联系人操作 |
| 13 | loopConnectSocket.js | 7KB | Socket 重连 |
| 14 | spaceApi.js | 7KB | 空间管理 |
| 15 | userApi.js | 7KB | 用户信息 |

---

## API 调用基础

### 统一使用 commonUCRequest

```javascript
// 推荐方式
import { commonUCRequest } from '@/api/axiosInstance';

const result = await commonUCRequest({
  baseURL: getUCBaseURL(),
  url: '/api/endpoint',
  method: 'POST',
  data: { key: 'value' }
});
```

### BaseURL 获取方法

```javascript
import {
  getUCBaseURL,       // UC 服务
  getPFMBaseURL,      // PFM 服务
  getImSdkGwURL,      // IM SDK 网关
  getSpaceImSdkGwURL, // 空间 IM SDK
  getBaseSpaceUserURL // 空间用户服务
} from '@/utils/base';
```

### 错误处理

```javascript
try {
  const result = await commonUCRequest({ ... });
} catch (error) {
  if (error.responseHeader) {
    const { status, msg } = error.responseHeader;
    if (status === 403) {
      // Token 失效
    } else if (status === 700) {
      // 空间过期
    }
  }
}
```

---

## API 文件完整索引

| 文件名 | 大小 | 分类 |
|--------|------|------|
| account.js | 955B | 认证与账户 |
| aiApi.js | 4.2KB | AI 功能 |
| apiUtil.js | 559B | 核心基础设施 |
| approvalApi.js | 3KB | 审批流程 |
| avrRiskApi.js | 326B | 安全与加密 |
| axios.js | 2.1KB | 核心基础设施 |
| axiosInstance.js | 17KB | 核心基础设施 |
| callApi.js | 1KB | 会议系统 |
| callFeedbackApi.js | 2.4KB | 会议系统 |
| channelApi.js | 8.4KB | 群组与频道 |
| commonParams.js | 121B | 核心基础设施 |
| contactApi.js | 7.7KB | 用户与联系人 |
| contactRequest.js | 5.4KB | 用户与联系人 |
| conversationApi.js | 4.4KB | 会话管理 |
| cstApi.js | 901B | 会议系统 |
| deleteApi.js | 3.2KB | 其他功能 |
| document.js | 1KB | 其他功能 |
| dohApi.js | 9.6KB | 安全与加密 |
| e2eeApi.js | 2.4KB | 安全与加密 |
| FileApi.js | 19KB | 文件管理 |
| fileServerApi.js | 1.5KB | 文件管理 |
| forceCloseHandle.js | 4KB | 其他功能 |
| groupApi.js | 1.4KB | 群组与频道 |
| historyMsgApi.js | 612B | 消息系统 |
| inputCycleMessage.js | 4.6KB | 消息系统 |
| liveApi.js | 2.5KB | 直播功能 |
| loginApi.js | 20KB | 认证与账户 |
| loopConnectSocket.js | 7.3KB | 核心基础设施 |
| meetingApi.js | 18KB | 会议系统 |
| messageApi.js | 29KB | 消息系统 |
| messageManger.js | 171KB | 消息系统 |
| offlineMsgApi.js | 4.7KB | 消息系统 |
| openApi.js | 901B | 其他功能 |
| peerApi.js | 111KB | 用户与联系人 |
| peerStatusApi.js | 1.9KB | 用户与联系人 |
| profile.js | 1.3KB | 认证与账户 |
| receiveMessage.js | 1.2KB | 消息系统 |
| retryRun.js | 412B | 核心基础设施 |
| scanApi.js | 3.3KB | 其他功能 |
| sdkApi.js | 5.1KB | 会议系统 |
| sessionApi.js | 15KB | 会话管理 |
| socketUtil.js | 15KB | 核心基础设施 |
| spaceApi.js | 7.3KB | 空间与企业 |
| storageDataApi.js | 3.6KB | 空间与企业 |
| translateApi.js | 2KB | 翻译服务 |
| ucApi.js | 321B | 其他功能 |
| updaterApi.js | 1KB | 其他功能 |
| uploadApi.js | 6.7KB | 文件管理 |
| userApi.js | 7KB | 用户与联系人 |
| userInfoApi.js | 3.9KB | 认证与账户 |

---

**最后更新**: 2026-02-05
