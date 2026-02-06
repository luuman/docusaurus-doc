# 消息推送机制

````markdown name=docs/modules/im/push.md
# 消息推送机制代码逻辑与流程详解

本页详细梳理 IM 模块消息推送机制的代码实现、逻辑流程、核心函数列表及业务处理建议，适用于服务端/客户端开发者理解和扩展消息推送相关模块。

---

## 一、整体推送架构与流程

### 1.1 推送机制简介

IM 消息推送的目标是将服务端产生的消息实时、可靠地送达客户端。主流架构采用 WebSocket 长连接，实现点对点（单聊）、群聊、系统通知等多类型消息的推送。对于离线用户，服务端需缓存未送达消息，客户端重连后自动拉取。

服务端推送通常包含：消息生产（业务层）、消息存储（数据库或缓存）、推送分发（长连接/离线队列）、ACK 回执机制（确保送达），并支持多端同步与多设备消息一致性。

### 1.2 推送流程图

```
[消息产生] → [消息入库/缓存] → [推送分发]
    ↓              ↓
[在线用户]     [离线用户]
    ↓              ↓
[WebSocket推送]   [离线队列]
    ↓              ↓
[客户端接收]   [重连后拉取]
    ↓
[ACK 回执]
```

---

## 二、代码逻辑梳理

### 2.1 服务端推送主流程

1. 接收到消息发送请求（如 POST /api/message/send）
2. 校验目标用户在线情况
3. 在线用户：通过长连接直接推送
4. 离线用户：消息存入离线队列或数据库
5. 客户端收到消息后发送 ACK 回执
6. 服务端记录消息送达状态，失败时可重试或告警

### 2.2 客户端推送处理流程

1. 监听 WebSocket `onmessage` 事件
2. 收到推送消息后分发至会话/通知模块
3. 发送 ACK 回执至服务端
4. UI 层更新未读、弹窗或消息列表
5. 若离线重连，自动拉取未读消息并处理

---

## 三、主要函数列表与职责

### 3.1 服务端推送相关函数

| 函数名                         | 作用说明             |
| ------------------------------ | -------------------- |
| `sendMessage(msg)`             | 处理消息发送业务逻辑 |
| `pushToOnline(user, msg)`      | 向在线用户推送消息   |
| `storeOffline(user, msg)`      | 存储离线消息         |
| `onAck(msgId, user)`           | 处理客户端回执       |
| `retryPush(user, msg)`         | 推送失败后重试机制   |
| `broadcastToGroup(group, msg)` | 群聊消息分发         |

### 3.2 客户端推送相关函数

| 函数名                   | 作用说明               |
| ------------------------ | ---------------------- |
| `onMessage(evt)`         | WebSocket 消息接收事件 |
| `handlePushMessage(msg)` | 解析与业务分发推送消息 |
| `sendAck(msgId)`         | 发送 ACK 回执          |
| `syncOfflineMessages()`  | 重连后同步离线消息     |
| `updateUI(msg)`          | UI 层更新和消息通知    |

---

## 四、典型代码实现

### 4.1 服务端推送逻辑（伪代码）

```javascript
function sendMessage(msg) {
  if (isOnline(msg.to)) {
    pushToOnline(msg.to, msg);
  } else {
    storeOffline(msg.to, msg);
  }
}
function pushToOnline(user, msg) {
  socketManager.send(user, JSON.stringify(msg));
}
function onAck(msgId, user) {
  markDelivered(msgId, user);
}
function retryPush(user, msg) {
  // 指数退避或定时重试
}
```

### 4.2 客户端推送逻辑（伪代码）

```javascript
ws.onmessage = function (evt) {
  const msg = JSON.parse(evt.data);
  handlePushMessage(msg);
};
function handlePushMessage(msg) {
  if (msg.type === "message") {
    updateUI(msg);
    sendAck(msg.msgId);
  }
}
function sendAck(msgId) {
  ws.send(JSON.stringify({ type: "ack", msgId }));
}
function syncOfflineMessages() {
  // 重连时调用，拉取未读
}
```

---

## 五、业务处理与扩展建议

- 推送消息类型建议包含文本、图片、文件、系统通知等，并预留扩展字段
- 群聊消息分发需支持高效广播和多端一致性
- 推送失败后需高优先级重试，并记录异常日志
- ACK 回执建议支持批量处理，防止高并发场景下服务端压力过大
- 多端设备同步时，合理设计未读数和消息一致性策略

---

## 六、边界处理与常见异常

- 用户离线、设备休眠或网络断开时消息需进入离线队列
- 消息推送失败后自动重试，并通知运维人员
- 客户端消息丢失、重复推送等需有幂等设计
- ACK 未收到时，服务端可定期重推或标记异常

---

## 七、推送机制 FAQ

**Q1：为什么有些消息没送达？**  
A：可能用户离线、网络波动或 ACK 未收到。建议检查离线推送及重连流程。

**Q2：群聊消息收不到怎么办？**  
A：检查分发逻辑和设备在线状态，确保广播队列正常。

**Q3：ACK 回执与消息送达有何关系？**  
A：ACK 用于确认客户端已收到消息，服务端据此更新送达状态并做异常处理。

---

## 八、参考链接

- [IM 协议/数据帧说明](protocol.md)
- [长连接与重连机制](socket.md)
- [WebSocket 官方文档](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
- [企业消息推送架构模式](https://martinfowler.com/articles/patterns-of-distributed-systems/persistent-connection.html)
````
