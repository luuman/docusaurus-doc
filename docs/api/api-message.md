# 消息系统 API

消息发送、接收、存储、历史记录相关接口。

---

## messageManger.js - 消息管理核心

**大小**: 171KB | **重要性**: ⭐⭐⭐⭐⭐

项目中最大的文件，消息处理的核心引擎。

### MsgTemplate - 消息模板

```javascript
import { MsgTemplate } from '@/api/messageManger';

// 创建文本消息
const textMsg = MsgTemplate.createTextMessage({
  content: '你好',
  to: targetHid,
  spaceId
});

// 创建图片消息
const imageMsg = MsgTemplate.createImageMessage({
  filePath: '/path/to/image.jpg',
  to: targetHid,
  spaceId
});

// 创建文件消息
const fileMsg = MsgTemplate.createFileMessage({
  filePath: '/path/to/file.pdf',
  fileName: 'document.pdf',
  to: targetHid,
  spaceId
});
```

### handleMessage - 消息处理

```javascript
import { handleMessage } from '@/api/messageManger';

// 处理接收到的消息
await handleMessage(rawMessage, spaceId);
```

### logMessage - 消息日志

```javascript
import { logMessage } from '@/api/messageManger';

// 记录消息日志
logMessage('发送消息', messageData);
```

---

## messageApi.js - 消息数据操作

**大小**: 29KB

### 数据库操作

```javascript
import {
  setMessageWithDatabase,
  getMessageWithDatabase,
  updateMessageWithDatabase,
  getMessagesWithDialogId,
  deleteMessageForContact
} from '@/api/messageApi';

// 保存消息到数据库
await setMessageWithDatabase([message1, message2]);

// 获取消息
const messages = await getMessageWithDatabase(['uuid1', 'uuid2'], spaceId);

// 更新消息
await updateMessageWithDatabase([
  { uuid: 'xxx', status: 1, mcTo: targetHid, mcFrom: fromHid }
]);

// 获取会话消息列表
const chatMessages = await getMessagesWithDialogId(dialogId, spaceId);

// 删除联系人的消息
await deleteMessageForContact(dialogId, beforeTime, spaceId);
```

### 消息文件路径

```javascript
import {
  updateMessageFilePath,
  getMessageFilePath
} from '@/api/messageApi';

// 更新消息附件路径
await updateMessageFilePath('/path/to/file', uuid, spaceId);

// 获取附件路径
const filePath = await getMessageFilePath(uuid, spaceId);
```

### 消息状态更新

```javascript
import { updateMessageReceiptRead } from '@/api/messageApi';

// 更新已读状态
await updateMessageReceiptRead(
  { readTime: Date.now(), status: 3 },
  uuid,
  spaceId
);
```

---

## historyMsgApi.js - 历史消息

**大小**: 612B

```javascript
import { fetchHistoryMessages } from '@/api/historyMsgApi';

// 拉取历史消息
const history = await fetchHistoryMessages({
  dialogId: sessionId,
  beforeTime: timestamp,
  limit: 20,
  spaceId
});
```

---

## offlineMsgApi.js - 离线消息

**大小**: 4.7KB

```javascript
import {
  fetchOfflineMessages,
  getOfflineMessageCount
} from '@/api/offlineMsgApi';

// 拉取离线消息
const offlineMessages = await fetchOfflineMessages({
  lastMessageTime: lastSyncTime,
  spaceId: currentSpaceId
});

// 获取离线消息数量
const count = await getOfflineMessageCount(spaceId);
```

---

## receiveMessage.js - 消息接收

**大小**: 1.2KB

```javascript
import { handleReceivedMessage } from '@/api/receiveMessage';

// 处理接收到的消息
await handleReceivedMessage(messageData);
```

---

## inputCycleMessage.js - 输入状态

**大小**: 4.6KB

```javascript
import {
  sendTypingStatus,
  stopTypingStatus
} from '@/api/inputCycleMessage';

// 发送正在输入状态
sendTypingStatus(dialogId);

// 停止输入状态
stopTypingStatus(dialogId);
```

---

**最后更新**: 2026-02-05
