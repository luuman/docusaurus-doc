# Socket 长连接管理

## 概述

Socket 长连接是 IM 即时通讯系统的核心通信基础设施。本文档详细介绍 `socketUtil.js` 和 `loopConnectSocket.js` 的实现原理，包括连接建立、心跳保活、断线重连、多设备登录等核心机制。

## 核心文件

| 文件 | 职责 |
|------|------|
| `src/api/socketUtil.js` | Socket 连接管理类，消息收发 |
| `src/api/loopConnectSocket.js` | 连接重试与多节点选择 |
| `src/socket/handlePush.js` | 推送消息处理 |

## 技术栈

- **Socket.io Client**: WebSocket 通信框架
- **端到端加密**: IKEY-SDK 消息加密
- **事件驱动**: MatrxGlobalEvent 全局事件总线

## SocketUtil 核心类

### 类结构

```javascript
export class SocketUtil {
    constructor(connectOption) {
        let defaultOption = {
            path: '/wecs'  // WebSocket 端点路径
        };

        this.connectOpts = {...defaultOption, ...connectOption};
        this.socketUrl = connectOption.socketUrl;
        this.currentTime = 0;
        this.pingInstance = '';
        this.pingInterval = 25000;  // 心跳间隔 25秒
        this.isNeedHeartCheck = connectOption.isNeedHeartCheck || true;
        this.commonHead = {
            hid: store.state.userInfo.hid,
            ts: getTimestamp(),
            wdid: store.state.userInfo.wdid
        };
        this.ioInstance = connectOption.instance;
    }
}
```

### 连接初始化

```javascript
async _init() {
    // 清理旧的事件监听
    window.MatrxGlobalEvent.removeListener('ws:sendMsg');

    let socketOptions = {
        path: this.connectOpts.path,
        transports: ['websocket'],  // 仅使用 WebSocket 传输
        pingTimeout: 300000,        // Ping 超时 5分钟
        pingInterval: 25000         // Ping 间隔 25秒
    };

    // 创建或复用连接实例
    if (!this.ioInstance) {
        this.ioInstance = io('https://' + appdataStorage.getItem('c_scoket'), socketOptions);
    }

    // 注册消息发送监听
    window.MatrxGlobalEvent.on('ws:sendMsg', ({payloadArray, cmd = 'HyperText'}) => {
        this._sendMsg(payloadArray, cmd);
    });

    // 注册连接事件
    this.ioInstance.on('connect', () => {
        this.currentTime = getTimestamp();
        window.MatrxGlobalEvent.emit('ws:connect');
    });
}
```

## 连接生命周期

### 状态流转图

```
                    ┌─────────────┐
                    │   初始化    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   连接中    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ 连接成功 │ │ 连接错误 │ │ 连接超时 │
       └────┬─────┘ └────┬─────┘ └────┬─────┘
            │            │            │
            ▼            └────┬───────┘
     ┌─────────────┐          │
     │  WPushRes   │          ▼
     │  (已就绪)   │   ┌─────────────┐
     └──────┬──────┘   │   重连中    │
            │          └──────┬──────┘
            ▼                 │
     ┌─────────────┐          │
     │   正常通信  │◄─────────┘
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │   断开连接  │
     └─────────────┘
```

### 连接状态存储

```javascript
// 连接状态通过 appdataStorage 持久化
appdataStorage.setItem('c_socket_state', 'disconnect');  // 断开
appdataStorage.setItem('c_socket_state', 'WPushRes');    // 已就绪
```

## 事件监听体系

### 核心事件列表

```javascript
// 连接成功
this.ioInstance.on('connect', () => {
    this.currentTime = getTimestamp();
    window.MatrxGlobalEvent.emit('ws:connect');
});

// 连接错误
this.ioInstance.on('error', error => {
    this.currentTime = getTimestamp();
    window.MatrxGlobalEvent.emit('ws:messageError', error);
});

// 断开连接
this.ioInstance.on('disconnect', disconnectedHandle);

// 连接错误（握手失败等）
this.ioInstance.on('connect_error', error => {
    msgDevLog.error('----->>connect_error', error);
});

// 连接超时
this.ioInstance.on('connect_timeout', timeout => {
    msgDevLog.warn('connect_timeout', timeout);
});

// 重连尝试
this.ioInstance.on('reconnect_attempt', attempt => {
    msgDevLog.warn('reconnect_attempt', attempt);
});

// 重连错误
this.ioInstance.on('reconnect_error', error => {
    msgDevLog.error('reconnect_error', error);
});

// 重连失败
this.ioInstance.on('reconnect_failed', attempt => {
    msgDevLog.error('reconnect_failed', attempt);
});

// 重连中
this.ioInstance.on('reconnecting', attemptNumber => {
    if (navigator.onLine) {
        window.MatrxGlobalEvent.emit('ws:reconnecting', attemptNumber);
    }
});
```

### 断开连接处理

```javascript
export function disconnectedHandle(reason) {
    // 更新连接状态
    appdataStorage.setItem('c_socket_state', 'disconnect');

    // 清理消息接收任务队列
    clearReceiveMessageTask();

    msgDevLog.log('[disconnectedHandle]: ', 'c_socket_state', 'disconnect');
    console.error('[error]: ', '----->>disconnect', reason);

    // 通知全局断开事件
    window.MatrxGlobalEvent.emit('ws:disconnect', reason);
}
```

## 消息收发机制

### 推送消息接收 (WPushRes)

```javascript
this.ioInstance.on('WPushRes', async (data, ackCallFn) => {
    let ackCallback;
    let taskKey = 'WPushRes|' + uuidv4();
    const startTime = performance.now();

    msgTaskLog.log('WPushRes->', taskKey, Boolean(ackCallFn));

    // 构建 ACK 回调
    if (ackCallFn) {
        ackCallback = uuidList => {
            ackLog.log('ack->', taskKey, uuidList, performance.now() - startTime);
            ackCallFn('200');  // 确认收到
        };
    }

    // 根据连接状态决定任务优先级
    if (appdataStorage.getItem('c_socket_state') != 'WPushRes') {
        // 未就绪状态，高优先级处理
        addReceiveMessageTopTask(handleReceivePush, data, ackCallback, taskKey);
    } else {
        // 正常状态，普通优先级
        addReceiveMessageTask(handleReceivePush, data, ackCallback, taskKey);
    }
});
```

### 消息发送 (_sendMsg)

```javascript
_sendMsg(payloadArray, cmd, timeout = msgTimeOut) {
    return new Promise(async (resolve, reject) => {
        payloadArray = _.cloneDeep(payloadArray);

        // SDK 模式添加租户ID
        if (appdataStorage.getItem('imSdkOpen')) {
            payloadArray.forEach(item => (item.tenantId = envConfig.tenantId));
        }

        // 检查连接状态
        if (appdataStorage.getItem('c_socket_state') != 'WPushRes' && cmd !== 'WPushReg') {
            this.handleMsgStatus(payloadArray, 1);  // 标记失败
            reject(`WPushRes Disconnected send error`);
            return;
        }

        // 标记为发送中
        this.handleMsgStatus(payloadArray, 2);

        // 构建请求头
        let extraHeader = {...this.commonHead, cmd};
        this.currentTime = getTimestamp();
        let content = {extraHeader, payload: payloadArray};

        // 端到端加密
        const cipher = await sendSdk('IKEY-SDK-Encrypted-Push-Msg', JSON.stringify(content));

        // 发送消息
        this.ioInstance.emit('WPush', cipher, this.withTimeout(
            async data => {
                // 成功回调
                for (const payload of payloadArray) {
                    const spaceId = getSpaceId(payload.mcTo);
                    if (payload?.m?.uuid) {
                        await store.dispatch('messageCollection/haveSent', {
                            uuid: payload.m.uuid,
                            spaceId
                        });
                    }
                }
                resolve(data);
            },
            () => {
                // 超时回调
                this.handleMsgStatus(payloadArray, 1);  // 标记失败
                reject(`send timeout:${timeout}`);
            },
            timeout
        ));
    });
}
```

### 超时处理机制

```javascript
withTimeout(onSuccess, onTimeout, timeout = msgTimeOut) {
    let called = false;

    const timer = setTimeout(() => {
        if (called) return;
        called = true;
        onTimeout();
    }, timeout);

    return (...args) => {
        if (called) return;
        called = true;
        clearTimeout(timer);
        onSuccess.apply(this, args);
    };
}
```

**默认超时时间**: 30秒 (`const msgTimeOut = 30 * 1000`)

### 消息状态管理

```javascript
handleMsgStatus(payloadArray, status) {
    try {
        // status: fail:1, sending:2, Sent:3
        for (const payload of payloadArray) {
            const spaceId = getSpaceId(payload.mcTo);
            let uuid = payload.m.uuid || '';

            if (uuid) {
                store.dispatch('messageCollection/setMessageStatus', {
                    uuid: uuid,
                    spaceId,
                    status,
                    t: payload.t
                });
            }
        }
    } catch (error) {
        msgDevLog.error('[change handleMsgStatus catch]', error);
    }
}
```

## 多节点连接策略

### loopConnectSocket.js 架构

```javascript
let ipTryConnectList = [];      // IP 连接实例列表
let domainTryConnectList = [];   // 域名连接实例列表

// 监听的事件类型
let onEventList = ['connect', 'error', 'disconnect', 'connect_error', 'reconnecting'];
```

### 连接策略优先级

```
优先级: 域名 > IP

策略说明:
1. 同时尝试连接域名和IP
2. 域名成功则直接采用
3. IP先成功则等待3秒看域名是否成功
4. 3秒内域名成功则采用域名
5. 3秒后域名未成功则采用IP
```

### tryAllConnect 实现

```javascript
export function tryAllConnect(response) {
    let ipList = [];
    let domainList = [];
    if (response) {
        ipList = response.ipList;
        domainList = response.domainList;
    }

    return new Promise((res, rej) => {
        if ((!ipList && !domainList) || (domainList.length == 0 && ipList == 0)) {
            res('empty');
            return;
        }

        let st = null;

        // 监听强制下线
        ipcRenderer.once('Push40004', () => {
            rej('Push40004');
        });

        // 域名连接
        if (domainList && domainList.length > 0) {
            loopConnect(domainList, false)
                .then(domainRes => {
                    clearTimeout(st);
                    ipTryConnectList = [];
                    domainTryConnectList = [];
                    res(domainRes);
                })
                .catch(errorRej);
        }

        // IP 连接
        if (ipList && ipList.length > 0) {
            loopConnect(ipList, true)
                .then(ipRes => {
                    // IP 成功后等待3秒给域名机会
                    st = setTimeout(() => {
                        clearTimeout(st);
                        ipTryConnectList = [];
                        domainTryConnectList = [];
                        res(ipRes);
                    }, 3 * 1000);
                })
                .catch(errorRej);
        }
    });
}
```

### 单节点连接尝试

```javascript
function _tryConnect(xconfig, isIp = true) {
    return new Promise(async (res, rej) => {
        const url = isIp ? `http://${xconfig.ip}` : `https://${xconfig.ip}`;

        // 私有部署需要验证证书
        if (isPrivated && navigator.onLine) {
            await verifyScoketServerCert(new URL(url));
        }

        let instance = io(url, xconfig);

        // 记录连接实例
        if (isIp) {
            ipTryConnectList.push(instance);
        } else {
            domainTryConnectList.push(instance);
        }

        instance.on('connect', () => {
            const result = {
                isIp,
                socketUrl: xconfig.ip,
                instance
            };
            res(result);
        });

        instance.on('error', error => rej(xconfig.ip));
        instance.on('disconnect', () => rej(xconfig.ip));
        instance.on('connect_error', error => rej(xconfig.ip));

        instance.on('reconnecting', attemptNumber => {
            // 重连超过3次则放弃
            if (attemptNumber >= 3) {
                instance.close();
            }
            rej(xconfig.ip);
        });
    });
}
```

### 循环连接多节点

```javascript
function loopConnect(domainList, isIp = true) {
    return new Promise((res, rej) => {
        let errorCount = 0;

        for (let index = 0; index < domainList.length; index++) {
            const ip = domainList[index];
            _tryConnect({
                ip: ip,
                path: appdataStorage.getItem('imSdkOpen') ? '/sdk-wecs' : '/wecs',
                transports: ['websocket'],
                query: { type: 'desktop' },
                pingTimeout: 300 * 1000,
                pingInterval: 25 * 1000
            }, isIp)
            .then(iRes => {
                res(iRes);
                connectRes(iRes);  // 清理其他连接
            })
            .catch(iRej => {
                errorCount += 1;
                // 所有节点都失败
                if (errorCount == domainList.length) {
                    rej(iRej);
                    errorCloseInstance(isIp);
                }
            });
        }
    });
}
```

## 心跳保活机制

### Socket.io 内置心跳

```javascript
let socketOptions = {
    pingTimeout: 300000,   // Ping 响应超时: 5分钟
    pingInterval: 25000    // Ping 发送间隔: 25秒
};
```

### 心跳流程

```
客户端                          服务端
   │                              │
   │◄────── ping (每25秒) ────────│
   │                              │
   │─────── pong (响应) ─────────►│
   │                              │
   │   (5分钟无响应则断开连接)     │
   │                              │
```

### E2EE Ping 机制

```javascript
// 检查是否为 Ping 消息
if (E2EEPingUtil.checkIsPingMessage(payload.a)) {
    tempPingList.push(payload.t);
}

// 发送成功后清理 Ping 列表
E2EEPingUtil.delNeedSendPingUserList(tempPingList, spaceId);
```

## 断线重连策略

### 重连触发条件

1. 网络断开后恢复
2. 服务端主动断开
3. 连接超时
4. 心跳超时

### 重连事件处理

```javascript
this.ioInstance.on('reconnecting', attemptNumber => {
    msgDevLog.warn('----->>reconnecting', attemptNumber);

    // 仅在网络在线时通知 UI
    if (navigator.onLine) {
        window.MatrxGlobalEvent.emit('ws:reconnecting', attemptNumber);
    }
});
```

### 重连次数限制

```javascript
instance.on('reconnecting', attemptNumber => {
    // 重连超过3次则关闭连接
    if (attemptNumber >= 3) {
        instance.close();
    }
    rej(xconfig.ip);
});
```

## 多设备登录处理

### Push40004 强制下线

```javascript
ipcRenderer.once('Push40004', () => {
    rej('Push40004');
});
```

### 设备类型标识

```javascript
// 连接时携带设备类型
{
    query: {
        type: 'desktop'  // 桌面端标识
    }
}
```

### 请求头设备标识

```javascript
headers: {
    'C-Type': 'windows'  // Windows 客户端
}

params: {
    deviceType: 'windows',
    clienttype: 'windows'
}
```

## 连接清理机制

### 成功连接后清理

```javascript
function connectRes(result) {
    if (!result.isIp) {
        // 域名成功，清理所有IP连接
        domainTryConnectList.forEach(i => {
            if (result.instance === i) {
                onEventList.forEach(ev => i.off(ev));
            } else {
                i.close();
            }
        });
        ipTryConnectList.forEach(i => i.close());

        ipTryConnectList = [];
        domainTryConnectList = [];
    } else {
        // IP成功，清理其他IP连接
        ipTryConnectList.forEach(i => {
            if (result.instance === i) {
                onEventList.forEach(ev => i.off(ev));
            } else {
                i.close();
            }
        });
        ipTryConnectList = [];
    }
}
```

### 错误时清理

```javascript
function errorCloseInstance(isIp) {
    if (isIp) {
        ipTryConnectList.forEach(i => i.close());
        ipTryConnectList = [];
    } else {
        domainTryConnectList.forEach(i => i.close());
        domainTryConnectList = [];
    }
}
```

### 主动销毁

```javascript
destory() {
    msgDevLog.log('[destory 2]');
    if (this.ioInstance) {
        this.ioInstance.close();
        this.ioInstance = null;
    }
}

onClose() {
    console.log('[close 2]');
    this.ioInstance.close();
    this.ioInstance = null;
}
```

## 证书验证 (私有部署)

```javascript
async function verifyScoketServerCert(data) {
    let res = await startVerifyConfig({
        serverProtocol: 'https://',
        serverIp: data.hostname,
        serverPort: data.port
    });

    if (!res) {
        // 第一次失败，等待2秒重试
        await new Promise(resolve => setTimeout(resolve, 2000));
        res = await startVerifyConfig({...});

        if (!res) {
            // 第二次重试
            res = await startVerifyConfig({...});
        }
    }
}
```

## 全局事件总线

### 发出的事件

| 事件名 | 触发时机 | 参数 |
|--------|----------|------|
| `ws:connect` | 连接成功 | 无 |
| `ws:disconnect` | 断开连接 | reason |
| `ws:reconnecting` | 重连中 | attemptNumber |
| `ws:messageError` | 消息错误 | error |

### 监听的事件

| 事件名 | 处理逻辑 |
|--------|----------|
| `ws:sendMsg` | 调用 `_sendMsg` 发送消息 |

## 配置参数

### 连接配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| path | `/wecs` | WebSocket 端点路径 |
| SDK path | `/sdk-wecs` | SDK 模式端点路径 |
| transports | `['websocket']` | 传输方式 |
| pingTimeout | 300000 (5分钟) | Ping 超时时间 |
| pingInterval | 25000 (25秒) | Ping 间隔时间 |

### 超时配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| msgTimeOut | 30000 (30秒) | 消息发送超时 |
| IP等待域名 | 3000 (3秒) | IP成功后等待域名时间 |
| 证书验证重试 | 2000 (2秒) | 证书验证重试间隔 |

## 日志系统

```javascript
import msgDevLog from '@/logs/msgDevLog';
import devLog from '@/logs/devLog';
import devMsgAllLog from '@/logs/devMsgAllLog';
import ackLog from '@/logs/ackLog.js';
import msgTaskLog from '@/logs/msgTaskLog.js';
```

### 日志分类

| 日志模块 | 用途 |
|----------|------|
| msgDevLog | 消息开发日志 |
| devLog | 通用开发日志 |
| devMsgAllLog | 全量消息日志 |
| ackLog | ACK 确认日志 |
| msgTaskLog | 消息任务日志 |

## 最佳实践

### 1. 连接状态检查

```javascript
// 发送消息前检查连接状态
if (appdataStorage.getItem('c_socket_state') != 'WPushRes') {
    // 处理未连接状态
    return;
}
```

### 2. 消息发送重试

```javascript
// 失败后标记状态，等待重连后重发
this.handleMsgStatus(payloadArray, 1);  // 标记失败
```

### 3. 事件清理

```javascript
// 组件销毁时清理事件监听
window.MatrxGlobalEvent.removeListener('ws:sendMsg');
```

## 故障排查

### 常见问题

1. **连接失败**
   - 检查网络状态 `navigator.onLine`
   - 检查服务器地址配置
   - 检查证书验证（私有部署）

2. **消息发送超时**
   - 检查连接状态 `c_socket_state`
   - 检查网络延迟
   - 查看 msgDevLog 日志

3. **频繁断线重连**
   - 检查心跳配置
   - 检查服务端负载
   - 查看 reconnecting 日志

4. **多设备冲突**
   - 检查 Push40004 事件
   - 确认设备类型配置
