# P0: messageManger.js 拆分

**优先级**: P0 (最高)
**文件**: `src/api/messageManger.js`
**当前大小**: 171KB, 4426行, 64个函数
**预期提升**: 加载时间↓50%, 维护性↑70%

---

## 问题描述

文件极度臃肿，包含多种职责：
- 消息接收处理
- 事件消息处理
- 会议卡片消息
- 消息通知系统
- 特殊消息处理（撤回、置顶、Emoji等）
- 数据库操作集成

单个文件难以维护、测试和理解。

---

## 重构方案

### 拆分为 7 个模块

```
src/api/message/
├── index.js                    # 统一导出
├── messageReceiver.js          # 消息接收和初步处理
├── messageProcessor.js         # 消息业务逻辑
├── eventHandler.js             # 事件消息处理
├── notificationManager.js      # 通知管理
├── specialMessageHandler.js    # 特殊消息：撤回、置顶等
├── databaseAdapter.js          # 数据库操作适配层
└── messageFactory.js           # 消息工厂和转换
```

### 各模块职责

| 模块 | 职责 | 预估行数 |
|------|------|----------|
| messageReceiver.js | WebSocket 消息接收、解析 | 300-400 |
| messageProcessor.js | 消息分发、处理流程 | 500-600 |
| eventHandler.js | 事件类消息处理 | 400-500 |
| notificationManager.js | 系统通知、声音提醒 | 300-400 |
| specialMessageHandler.js | 撤回、置顶、Emoji | 400-500 |
| databaseAdapter.js | 消息存储、查询 | 300-400 |
| messageFactory.js | 消息创建、转换 | 200-300 |

---

## 实施步骤

### 第一步：提取通知模块 (1天)

```javascript
// src/api/message/notificationManager.js
export class NotificationManager {
  constructor(store) {
    this.store = store;
  }

  async shouldNotify(message, session, spaceId) {
    const state = this.store.state;
    if (state.userInfo.meetingStatus === 'calling') return false;
    if (state.uiControl.TopMenuBar.active === '0' && state.spaceCollection.isWinFocus) return false;
    if (session?.isMute === 'true') return false;
    // ...
  }

  async notify(message, session, spaceId) {
    if (!await this.shouldNotify(message, session, spaceId)) return;
    // 发送通知逻辑
  }
}
```

### 第二步：提取数据库适配层 (1天)

```javascript
// src/api/message/databaseAdapter.js
export class MessageDatabaseAdapter {
  constructor(spaceId) {
    this.spaceId = spaceId;
  }

  async saveMessage(message) {
    return setMessageWithDatabase([message], this.spaceId);
  }

  async batchSave(messages) {
    return setMessageWithDatabase(messages, this.spaceId);
  }

  async updateStatus(uuid, status) {
    return updateMessageWithDatabase([{ uuid, status }], this.spaceId);
  }

  async getByUuid(uuid) {
    return getMessageWithDatabase([uuid], this.spaceId);
  }
}
```

### 第三步：提取特殊消息处理 (1天)

```javascript
// src/api/message/specialMessageHandler.js
export const handlers = {
  withdraw: async (message, spaceId) => {
    // 撤回消息处理
  },

  pin: async (message, spaceId) => {
    // 置顶消息处理
  },

  emoji: async (message, spaceId) => {
    // Emoji 反应处理
  },

  receipt: async (message, spaceId) => {
    // 已读回执处理
  }
};

export function handleSpecialMessage(type, message, spaceId) {
  const handler = handlers[type];
  if (handler) {
    return handler(message, spaceId);
  }
  console.warn(`Unknown special message type: ${type}`);
}
```

### 第四步：重构主入口 (1天)

```javascript
// src/api/message/index.js
import { NotificationManager } from './notificationManager';
import { MessageDatabaseAdapter } from './databaseAdapter';
import { handleSpecialMessage } from './specialMessageHandler';
import { processMessage } from './messageProcessor';

export { MsgTemplate } from './messageFactory';

export async function handleMessage(rawMessage, spaceId) {
  const db = new MessageDatabaseAdapter(spaceId);
  const notifier = new NotificationManager(store);

  const message = parseMessage(rawMessage);

  if (isSpecialMessage(message)) {
    return handleSpecialMessage(message.type, message, spaceId);
  }

  await processMessage(message, db, spaceId);
  await notifier.notify(message, null, spaceId);
}
```

---

## 测试要点

- [ ] 消息接收流程不中断
- [ ] 通知功能正常
- [ ] 撤回消息正常
- [ ] 已读回执正常
- [ ] 数据库存储正常
- [ ] 性能测试对比

---

## 风险评估

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 功能遗漏 | 高 | 逐函数迁移，保持测试覆盖 |
| 循环依赖 | 中 | 使用依赖注入，避免直接 import |
| 性能回退 | 低 | 分阶段发布，监控指标 |

---

**预计工时**: 4-5 天
**负责人**: 待分配
