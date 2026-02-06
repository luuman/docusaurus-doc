# 核心基础设施 API

HTTP 请求、WebSocket 连接等基础设施模块。

---

## axiosInstance.js - HTTP 请求核心

**大小**: 17KB | **重要性**: ⭐⭐⭐⭐⭐

HTTP 请求的核心配置，包含请求/响应拦截器、错误处理、Token 管理。

### commonUCRequest - 通用请求方法

```javascript
import { commonUCRequest } from '@/api/axiosInstance';

// GET 请求
const data = await commonUCRequest({
  baseURL: getUCBaseURL(),
  url: '/api/endpoint',
  method: 'GET',
  params: { key: 'value' }
});

// POST 请求
const result = await commonUCRequest({
  baseURL: getUCBaseURL(),
  url: '/api/data',
  method: 'POST',
  data: { name: 'test' },
  headers: { 'Content-Type': 'application/json' },
  transformRequest: data => JSON.stringify(data)
});
```

### 拦截器功能

**请求拦截器**:
- 自动添加认证 Token (`Authorization`)
- 添加设备标识 (`C-HID`, `C-Type`)
- 添加请求 ID (`logid`)
- 登录前接口加密 (noLoginApi)
- 敏感参数加密 (encryptApi)

**响应拦截器**:
- 统一错误码处理 (403, 700, 432 等)
- Token 过期自动处理
- 请求日志记录
- 响应数据解析

### 需要加密的接口

```javascript
// 登录前需要加密的接口
const encryptApi = [
  '/user/signinv2',
  '/account/setpwd',
  '/account/signup',
  '/account/verify',
  '/account/pwdreset'
];

// 登录后需要加密的接口
const loginEncryptApi = [
  '/account/verify/changepwd',
  '/account/loginPwdreset',
  '/profile/modify'
];
```

---

## axios.js - Axios 基础配置

**大小**: 2KB

```javascript
import axios from '@/api/axios';

// 基础 axios 实例，不含业务拦截器
```

---

## socketUtil.js - WebSocket 连接

**大小**: 15KB | **重要性**: ⭐⭐⭐⭐⭐

WebSocket 连接管理，消息实时推送核心。

### SocketUtil 类

```javascript
import { SocketUtil } from '@/api/socketUtil';

// 创建 Socket 连接
const socket = new SocketUtil({
  socketUrl: 'wss://server.com',
  isNeedHeartCheck: true
});

// 初始化连接
await socket._init();

// 发送消息
socket.sendMessage(messageData);

// 断开连接
socket.disconnect();
```

### 主要方法

| 方法 | 说明 |
|------|------|
| `_init()` | 初始化 Socket 连接 |
| `sendMessage(data)` | 发送消息 |
| `disconnect()` | 断开连接 |
| `reconnect()` | 重新连接 |
| `heartCheck()` | 心跳检测 |

### 事件监听

```javascript
// 断开连接处理
import { disconnectedHandle } from '@/api/socketUtil';

window.MatrxGlobalEvent.on('ws:disconnect', (reason) => {
  console.log('连接断开:', reason);
});
```

---

## loopConnectSocket.js - Socket 重连机制

**大小**: 7KB

```javascript
import { tryAllConnect, stopConnect } from '@/api/loopConnectSocket';

// 尝试所有服务器连接
await tryAllConnect();

// 停止连接尝试
stopConnect();
```

---

## 工具函数

### apiUtil.js - URL 过滤

```javascript
import { filterRequestUrl } from '@/api/apiUtil';

// 过滤请求 URL (私有化部署)
const url = filterRequestUrl('/api/endpoint');
```

### commonParams.js - 公共参数

```javascript
import commonParams from '@/api/commonParams';

// 获取公共参数
const params = commonParams();
```

### retryRun.js - 重试机制

```javascript
import { retryRun } from '@/api/retryRun';

// 带重试的请求
await retryRun(async () => {
  return await someApi();
}, 3); // 重试3次
```

---

**最后更新**: 2026-02-05
