# 长连接 / 重连机制

# Socket 长连接代码逻辑与流程详解

本页详细整理 IM 模块中 Socket 长连接的代码结构、流程设计、主要函数列表及核心实现逻辑，适用于后端/前端开发者快速理解和扩展连接管理模块。

---

## 一、整体架构与代码流程

### 1.1 基本流程

1. **连接初始化**  
   创建 WebSocket 实例，配置连接参数（服务器地址、鉴权 token）。

2. **连接建立**  
   监听 `onopen` 事件，启动心跳机制，请求会话恢复。

3. **消息收发**  
   监听 `onmessage` 事件，分发消息、回执、心跳、异常等数据帧。

4. **异常处理**  
   监听 `onerror`、`onclose` 事件，判定断线原因，进入重连流程。

5. **重连机制**  
   按指数退避策略重试连接，最大次数后通知业务层异常。

6. **连接状态同步**  
   通过事件/回调通知 UI 层和业务模块（如连接成功、断开、重连中等）。

---

### 1.2 流程图

```
[初始化] → [连接建立] → [心跳/消息收发]
    ↓             ↓
[异常断开] ← [异常处理] ← [检测断线]
    ↓
[重连机制启动]
    ↓
[连接恢复/重试失败]
```

---

## 二、代码结构与核心文件

通常 Socket 管理模块结构如下：

```
src/modules/im/socket/
├── index.ts        # Socket 管理主入口
├── heartbeat.ts    # 心跳包逻辑
├── reconnect.ts    # 重连策略与实现
├── events.ts       # 事件/回调管理
├── types.ts        # 类型定义
├── utils.ts        # 辅助函数
```

---

## 三、主要函数列表与职责

### 3.1 主流程函数

| 函数名               | 作用说明                        |
| -------------------- | ------------------------------- |
| `connect()`          | 初始化连接，创建 WebSocket 实例 |
| `send(data)`         | 发送消息帧                      |
| `handleMessage(evt)` | 处理接收消息                    |
| `startHeartbeat()`   | 启动心跳机制                    |
| `stopHeartbeat()`    | 停止心跳                        |
| `handleError(evt)`   | 异常捕获，判定断线原因          |
| `handleClose(evt)`   | 连接断开，进入重连流程          |
| `reconnect()`        | 重连实现，指数退避              |
| `resetConnection()`  | 重新初始化连接                  |
| `emit(event, data)`  | 事件分发，连接状态同步          |
| `on(event, cb)`      | 事件注册，供业务层订阅          |

---

### 3.2 典型代码实现（TypeScript 示例）

```typescript
class SocketManager {
  private ws: WebSocket | null = null;
  private heartbeatTimer: any = null;
  private retryCount = 0;
  private maxRetry = 10;

  connect(url: string, token: string) {
    this.ws = new WebSocket(`${url}?token=${token}`);
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }

  handleOpen() {
    this.retryCount = 0;
    this.startHeartbeat();
    this.emit("connected");
  }

  send(data: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleMessage(evt: MessageEvent) {
    const msg = JSON.parse(evt.data);
    switch (msg.type) {
      case "heartbeat":
        /* ... */ break;
      case "message":
        this.emit("message", msg);
        break;
      case "ack":
        this.emit("ack", msg);
        break;
      case "kicked":
        this.emit("kicked", msg);
        this.ws?.close();
        break;
      default:
        this.emit("unknown", msg);
    }
  }

  startHeartbeat(interval = 30000) {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: "heartbeat", timestamp: Date.now() });
    }, interval);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
  }

  handleError(evt: Event) {
    this.emit("error", evt);
  }

  handleClose(evt: CloseEvent) {
    this.stopHeartbeat();
    if (this.retryCount < this.maxRetry) {
      this.retryCount++;
      setTimeout(
        () => this.reconnect(),
        Math.min(2 ** this.retryCount * 1000, 60000)
      );
      this.emit("reconnecting", this.retryCount);
    } else {
      this.emit("disconnected");
    }
  }

  reconnect() {
    this.resetConnection();
    this.connect(/* url, token */);
  }

  resetConnection() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws = null;
    }
  }

  emit(event: string, data?: any) {
    /* ...事件分发实现... */
  }
  on(event: string, cb: Function) {
    /* ...事件监听实现... */
  }
}
```

---

## 四、核心逻辑解析

### 4.1 连接管理

- 每次连接初始化都需校验 token，有效性不通过则拒绝连接。
- 连接成功后立即启动心跳，业务层可收到 `connected` 事件同步状态。
- 连接断开/异常时暂停心跳，确保资源释放。

### 4.2 消息分发

- 所有接收到的消息通过 `handleMessage` 分发，业务层只需订阅对应事件即可获取数据。
- ACK、心跳、系统异常、踢线等均有独立事件类型，便于前端 UI 和业务逻辑处理。

### 4.3 重连机制

- 指数退避，避免网络抖动时频繁重试导致雪崩。
- 最大重试次数后通知业务层，用户可主动手动重连或检查网络。
- 重连后自动恢复心跳、同步离线消息。

---

## 五、事件列表与业务通知

| 事件名         | 说明                     |
| -------------- | ------------------------ |
| `connected`    | 连接建立成功             |
| `disconnected` | 连接断开，重试失败       |
| `reconnecting` | 正在重连中，附带重试次数 |
| `reconnected`  | 重连成功                 |
| `message`      | 收到普通消息             |
| `ack`          | 收到 ACK 回执            |
| `kicked`       | 账号被服务器踢下线       |
| `error`        | 连接异常                 |
| `unknown`      | 未知类型事件             |

支持业务层通过 `on(event, cb)` 订阅事件，实现 UI 状态同步、消息通知、自动重连等高级逻辑。

---

## 六、扩展建议及边界问题

- 支持多窗口或多会话下的连接隔离，避免消息混淆。
- 可集成网络状态监控，断网自动暂停重连，恢复后自动触发。
- 针对移动端/休眠场景，建议心跳间隔和重连参数可动态调整。

---

## 七、参考实现与文档

- [WebSocket 官方 API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
- [IM 协议/数据帧](protocol.md)
- [企业级重连机制设计](https://martinfowler.com/articles/patterns-of-distributed-systems/persistent-connection.html)
- [事件流设计与分发](event-flow.md)

---

如需进一步扩展 Socket 逻辑，请结合实际业务场景进行配置和优化，欢迎提交 PR 或与维护团队沟通。
