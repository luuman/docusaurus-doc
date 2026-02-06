# 其他功能 API

AI、翻译、审批、直播、扫码等辅助功能接口。

---

## aiApi.js - AI 功能

**大小**: 4.2KB

```javascript
import {
  aiSummarize,
  aiTranslate,
  aiReply,
  aiChat
} from '@/api/aiApi';

// AI 摘要
const summary = await aiSummarize(messageContent);

// AI 翻译
const translated = await aiTranslate(text, targetLanguage);

// AI 回复建议
const suggestions = await aiReply(messageContext);

// AI 对话
const response = await aiChat(prompt);
```

---

## translateApi.js - 翻译服务

**大小**: 2KB

```javascript
import { translateText } from '@/api/translateApi';

const result = await translateText({
  text: 'Hello World',
  from: 'en',
  to: 'zh'
});
// 返回: { translatedText: '你好世界' }
```

---

## approvalApi.js - 审批流程

**大小**: 3KB

```javascript
import {
  getApprovalList,
  submitApproval,
  approveRequest,
  rejectRequest
} from '@/api/approvalApi';

// 获取审批列表
const approvals = await getApprovalList({
  status: 'pending',
  page: 1
});

// 提交审批
await submitApproval({
  type: 'leave',
  data: { ... }
});

// 通过/拒绝
await approveRequest(approvalId, '同意');
await rejectRequest(approvalId, '理由不充分');
```

---

## liveApi.js - 直播功能

**大小**: 2.5KB

```javascript
import {
  createLive,
  getLiveInfo,
  endLive
} from '@/api/liveApi';

// 创建直播
const live = await createLive({
  title: '产品发布会',
  spaceId
});

// 获取直播信息
const info = await getLiveInfo(liveId);

// 结束直播
await endLive(liveId);
```

---

## scanApi.js - 扫码功能

**大小**: 3.3KB

```javascript
import {
  scanLogin,
  scanCombinationE2EEKey
} from '@/api/scanApi';

// 扫码登录
await scanLogin(qrCodeData);

// 扫码获取 E2EE 密钥
const key = await scanCombinationE2EEKey(scanData);
```

---

## deleteApi.js - 删除操作

**大小**: 3.2KB

```javascript
import {
  deleteAccount,
  deleteMessages,
  deleteSession
} from '@/api/deleteApi';

// 删除账户
await deleteAccount({ reason: '不再使用' });

// 删除消息
await deleteMessages(uuidList, spaceId);
```

---

## updaterApi.js - 应用更新

**大小**: 1KB

```javascript
import { checkUpdate, getUpdateInfo } from '@/api/updaterApi';

// 检查更新
const hasUpdate = await checkUpdate();

// 获取更新信息
const updateInfo = await getUpdateInfo();
```

---

## forceCloseHandle.js - 强制关闭处理

**大小**: 4KB

```javascript
import { forceCloseHandle } from '@/api/forceCloseHandle';

// 强制关闭处理（如 Token 失效）
await forceCloseHandle(error, source);
```

---

## 其他小型模块

| 文件 | 大小 | 说明 |
|------|------|------|
| `openApi.js` | 901B | 开放 API 接口 |
| `document.js` | 1KB | 文档相关 |
| `ucApi.js` | 321B | UC 服务 API |

---

**最后更新**: 2026-02-05
