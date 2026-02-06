# 数据流架构

## 概述

本项目采用三层数据存储架构，确保数据在不同场景下的可靠性和性能。

## 数据层架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          数据层架构                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    运行时层 (Runtime Layer)                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │                     Vuex Store                           │  │   │
│  │  │  • 响应式数据绑定                                         │  │   │
│  │  │  • UI 状态管理                                           │  │   │
│  │  │  • 内存中运行                                            │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    配置层 (Config Layer)                      │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │                   electron-store                         │  │   │
│  │  │  • 应用配置存储                                          │  │   │
│  │  │  • 用户偏好设置                                          │  │   │
│  │  │  • 加密存储 (生产环境)                                    │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    持久层 (Persistence Layer)                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │                     SQLCipher                            │  │   │
│  │  │  • 消息历史                                              │  │   │
│  │  │  • 联系人数据                                            │  │   │
│  │  │  • 会话记录                                              │  │   │
│  │  │  • 全文搜索索引                                          │  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Vuex Store 数据流

### 单向数据流

```
┌──────────────────────────────────────────────────────────────┐
│                        Vue 组件                               │
│                           │                                   │
│                     dispatch action                           │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                      Actions                            │  │
│  │  • 处理异步操作                                         │  │
│  │  • 调用 API                                            │  │
│  │  • 提交 Mutation                                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│                      commit mutation                          │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                     Mutations                           │  │
│  │  • 同步修改 State                                       │  │
│  │  • 记录状态变更                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│                      mutate state                             │
│                           │                                   │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                       State                             │  │
│  │  • 响应式数据                                           │  │
│  │  • 单一数据源                                           │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│                     render view                               │
│                           │                                   │
│                           ▼                                   │
│                        Vue 组件                               │
└──────────────────────────────────────────────────────────────┘
```

### 模块化 Store

```javascript
// src/store/index.js
import Vue from 'vue';
import Vuex from 'vuex';

import messageCollection from './modules/messageCollection';
import peerCollection from './modules/peerCollection';
import spaceCollection from './modules/spaceCollection';
import theme from './modules/theme';
import uiControl from './modules/uiControl';
import storage from './modules/storage';
// ... 更多模块

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    messageCollection,
    peerCollection,
    spaceCollection,
    theme,
    uiControl,
    storage
  },

  // 全局状态
  state: {
    loginStatus: false,
    keepLogin: false,
    currentUser: null
  },

  // 全局 Getters
  getters: {
    isLoggedIn: state => state.loginStatus && state.currentUser,
    userId: state => state.currentUser?.id
  },

  // 全局 Mutations
  mutations: {
    SET_LOGIN_STATUS(state, status) {
      state.loginStatus = status;
    },
    SET_CURRENT_USER(state, user) {
      state.currentUser = user;
    }
  }
});
```

## 消息数据流

### 发送消息流程

```
用户输入消息
      │
      ▼
┌─────────────────┐
│ MessageInput    │ ─── 组件层
│ 组件            │
└─────────────────┘
      │
      │ @send="handleSend"
      ▼
┌─────────────────┐
│ dispatch        │ ─── Action 层
│ sendMessage     │
└─────────────────┘
      │
      ├──────────────────────┬─────────────────────┐
      │                      │                     │
      ▼                      ▼                     ▼
┌───────────┐         ┌───────────┐         ┌───────────┐
│ API 请求   │         │ 本地存储   │         │ UI 更新    │
│ 发送到服务器│         │ 写入 SQL   │         │ 乐观更新   │
└───────────┘         └───────────┘         └───────────┘
      │
      │ 服务器响应
      ▼
┌─────────────────┐
│ commit          │ ─── Mutation 层
│ UPDATE_MESSAGE  │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ 更新消息状态     │ ─── State 更新
│ (已发送/失败)    │
└─────────────────┘
```

### 接收消息流程

```
WebSocket/Push 收到消息
      │
      ▼
┌─────────────────┐
│ SDK 层          │ ─── 底层接收
│ 解析消息        │
└─────────────────┘
      │
      │ IPC 通知渲染进程
      ▼
┌─────────────────┐
│ 消息处理器      │ ─── 服务层
│ processMessage  │
└─────────────────┘
      │
      ├──────────────────────┬─────────────────────┐
      │                      │                     │
      ▼                      ▼                     ▼
┌───────────┐         ┌───────────┐         ┌───────────┐
│ 写入数据库 │         │ 更新 Store │         │ 发送通知   │
│ SQLCipher │         │ Vuex      │         │ 系统通知   │
└───────────┘         └───────────┘         └───────────┘
```

## electron-store 数据流

### 配置同步流程

```
主进程 electron-store
         │
         │ 数据变更
         ▼
┌─────────────────────┐
│ broadcastStoreChange│
└─────────────────────┘
         │
         │ IPC: 'changeStorage'
         ▼
┌─────────────────────────────────────────────────────────┐
│                     所有渲染进程窗口                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ 主窗口   │  │ 截图窗口 │  │ 设置窗口 │  │ 其他窗口 │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│       │           │           │           │            │
│       └───────────┴───────────┴───────────┘            │
│                         │                               │
│                         ▼                               │
│                  Vuex storage 模块                      │
│                  同步更新状态                            │
└─────────────────────────────────────────────────────────┘
```

### 存储数据类型

| 数据项 | 类型 | 说明 |
|--------|------|------|
| deviceId | string | 设备唯一标识 |
| lang | string | 用户语言设置 |
| skipUpdateVersion | string | 跳过更新的版本 |
| userData | object | 登录用户信息 |
| accountData | object | 账户数据 |
| win32SystemInfo | object | Windows 系统信息 |
| theme | string | 主题设置 |
| shortcutKeys | object | 快捷键配置 |

## SQLCipher 数据流

### 数据库操作流程

```
渲染进程业务代码
         │
         │ 调用 sqlApi
         ▼
┌─────────────────────┐
│   src/sqlApi/       │
│   统一 SQL 接口      │
└─────────────────────┘
         │
         │ 执行 SQL
         ▼
┌─────────────────────┐
│   src/sql/          │
│   SQLCipher 驱动    │
└─────────────────────┘
         │
         │ 加密读写
         ▼
┌─────────────────────┐
│   本地加密数据库     │
│   .db 文件          │
└─────────────────────┘
```

### 数据表结构

```
┌──────────────────────────────────────────────────────────┐
│                    SQLCipher 数据库                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │   peer     │  │  session   │  │     message        │ │
│  │ (联系人)    │  │  (会话)     │  │     (消息)         │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │organization│  │  forward   │  │   fts_message      │ │
│  │ (组织架构)  │  │  (转发)     │  │   (全文搜索)       │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
│                                                          │
│  ┌────────────┐  ┌────────────┐                         │
│  │  ack_db    │  │  user_info │                         │
│  │ (消息确认)  │  │  (用户信息) │                         │
│  └────────────┘  └────────────┘                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### SQL API 示例

```javascript
// src/sqlApi/index.js

// 查询消息
export function getMessages(sessionId, limit = 50, offset = 0) {
  return selectAll(`
    SELECT * FROM message
    WHERE session_id = ?
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `, [sessionId, limit, offset]);
}

// 插入消息
export function insertMessage(message) {
  return addInsertAll('message', [message]);
}

// 更新消息状态
export function updateMessageStatus(messageId, status) {
  return updateAll(`
    UPDATE message SET status = ? WHERE id = ?
  `, [status, messageId]);
}

// 全文搜索
export function searchMessages(keyword, limit = 20) {
  return selectAll(`
    SELECT m.* FROM message m
    INNER JOIN fts_message fts ON m.id = fts.rowid
    WHERE fts_message MATCH ?
    LIMIT ?
  `, [keyword, limit]);
}
```

## 完整数据流示例

### 用户登录数据流

```
1. 用户输入凭据
         │
         ▼
2. Vue 组件触发 login action
         │
         ▼
3. Action 调用 loginApi.emailLogin()
         │
         ▼
4. API 返回用户信息和 token
         │
         ├────────────────┬────────────────┬────────────────┐
         │                │                │                │
         ▼                ▼                ▼                ▼
5. 存储 token      6. 更新 Vuex    7. 初始化 SDK    8. 写入 SQLCipher
   electron-store     State           meetingSDK       用户数据
         │                │                │                │
         └────────────────┴────────────────┴────────────────┘
                                  │
                                  ▼
                       9. 路由跳转到主界面
                                  │
                                  ▼
                       10. 加载历史消息和联系人
```

### 消息同步数据流

```
┌──────────────────────────────────────────────────────────────────┐
│                          服务器                                   │
└──────────────────────────────────────────────────────────────────┘
                          ▲         │
                          │         │ 推送新消息
                   拉取历史  │         │
                          │         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API 层                                   │
│  ┌─────────────────┐              ┌─────────────────────────┐   │
│  │ historyMsgApi   │              │ WebSocket 消息处理器     │   │
│  │ 拉取历史消息     │              │ 处理实时消息             │   │
│  └─────────────────┘              └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │         │
                          ▼         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      消息处理服务                                 │
│  • 消息去重                                                      │
│  • 消息排序                                                      │
│  • 消息加密/解密 (E2EE)                                          │
└─────────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │ SQLCipher  │  │   Vuex     │  │ 系统通知    │
   │ 持久化存储  │  │ 状态更新    │  │ (新消息)    │
   └────────────┘  └────────────┘  └────────────┘
                          │
                          ▼
                   ┌────────────┐
                   │ Vue 组件   │
                   │ 自动更新   │
                   └────────────┘
```

## 数据缓存策略

### 多级缓存

```
┌─────────────────────────────────────────────────────────────────┐
│                          缓存层级                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  L1: Vue 组件缓存 (keep-alive)                                  │
│      ├─ 生命周期: 组件激活时                                     │
│      └─ 存储: 组件实例内存                                       │
│                                                                 │
│  L2: Vuex Store 缓存                                            │
│      ├─ 生命周期: 应用运行期间                                   │
│      └─ 存储: JavaScript 堆内存                                  │
│                                                                 │
│  L3: SQLCipher 本地缓存                                         │
│      ├─ 生命周期: 持久化                                         │
│      └─ 存储: 本地加密文件                                       │
│                                                                 │
│  L4: 服务器数据                                                  │
│      ├─ 生命周期: 永久                                          │
│      └─ 存储: 云端服务器                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 缓存失效策略

```javascript
// 消息缓存 TTL
const MESSAGE_CACHE_TTL = 1000 * 60 * 5; // 5 分钟

// 检查缓存有效性
function isCacheValid(cacheKey) {
  const cached = cache.get(cacheKey);
  if (!cached) return false;
  return Date.now() - cached.timestamp < MESSAGE_CACHE_TTL;
}

// 带缓存的数据获取
async function getMessagesWithCache(sessionId) {
  const cacheKey = `messages_${sessionId}`;

  // 检查 Vuex 缓存
  if (isCacheValid(cacheKey)) {
    return store.getters['messageCollection/getMessages'](sessionId);
  }

  // 检查 SQLCipher
  let messages = await sqlApi.getMessages(sessionId);

  // 如果本地没有，从服务器拉取
  if (!messages.length) {
    messages = await api.fetchMessages(sessionId);
    await sqlApi.insertMessages(messages);
  }

  // 更新 Vuex
  store.commit('messageCollection/SET_MESSAGES', { sessionId, messages });

  return messages;
}
```

## 下一步阅读

- [数据存储模块](../modules/data-storage.md) - 详细的存储实现
- [消息系统模块](../im/message-architecture.md) - 消息处理详解
