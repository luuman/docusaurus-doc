# Vuex Store API 参考

本文档介绍项目中 Vuex Store 的模块结构和常用 API。

---

## 目录

- [Store 架构概览](#store-架构概览)
- [核心模块](#核心模块)
- [常用 State](#常用-state)
- [常用 Actions](#常用-actions)
- [常用 Mutations](#常用-mutations)
- [常用 Getters](#常用-getters)
- [使用示例](#使用示例)

---

## Store 架构概览

Store 入口文件: `src/store/index.js`

### 模块结构

```
store/
└── modules/
    ├── concat.js           # 主状态管理 (27KB) - 核心业务状态
    ├── uiControl.js        # UI 控制 (24KB) - 界面状态
    ├── peerCollection.js   # 联系人集合 (15KB)
    ├── sessionCollection.js# 会话集合 (10KB)
    ├── spaceCollection.js  # 空间集合 (11KB)
    ├── spaceLimit.js       # 空间限制 (13KB)
    ├── userInfo.js         # 用户信息 (11KB)
    ├── messageCollection.js# 消息集合 (6KB)
    ├── setting.js          # 设置 (6KB)
    ├── fileCollection.js   # 文件集合 (3KB)
    ├── dialogList.js       # 对话框列表 (5KB)
    ├── theme.js            # 主题 (1KB)
    └── ...                 # 其他模块
```

---

## 核心模块

### concat 模块

主状态管理模块，包含核心业务逻辑。

**命名空间**: `concat`

```javascript
// State
store.state.concat.isLogin        // 是否已登录
store.state.concat.whiteList      // 白名单
store.state.concat.contacts       // 联系人列表
store.state.concat.channels       // 频道/群组列表

// Actions
store.dispatch('concat/refreshContacts', { spaceId, force: true })
store.dispatch('concat/refreshChannels', { spaceId })
store.dispatch('concat/logout')
```

---

### uiControl 模块

UI 控制状态模块。

**命名空间**: `uiControl`

```javascript
// State
store.state.uiControl.currentPanel      // 当前面板 ('chat'|'meeting'|'contact')
store.state.uiControl.currentSession    // 当前会话
store.state.uiControl.showSidebar       // 是否显示侧边栏
store.state.uiControl.showDialog        // 当前显示的对话框

// Mutations
store.commit('uiControl/SET_CURRENT_PANEL', 'chat')
store.commit('uiControl/SET_CURRENT_SESSION', sessionData)
store.commit('uiControl/TOGGLE_SIDEBAR', true)
```

---

### peerCollection 模块

联系人集合管理。

**命名空间**: `peerCollection`

```javascript
// State - 以 spaceHid 为 key 存储
store.state.peerCollection[spaceHid]  // 单个联系人数据

// Actions
store.dispatch('peerCollection/updatePeer', { spaceHid, peer })
store.dispatch('peerCollection/removePeer', spaceHid)
store.dispatch('peerCollection/batchUpdate', peersArray)

// Getters
store.getters['peerCollection/getPeer'](spaceHid)
store.getters['peerCollection/getAllPeers']
```

---

### sessionCollection 模块

会话集合管理。

**命名空间**: `sessionCollection`

```javascript
// State - 以 spaceHid 为 key 存储
store.state.sessionCollection[spaceHid]  // 单个会话数据

// Actions
store.dispatch('sessionCollection/updateSession', { spaceHid, session })
store.dispatch('sessionCollection/removeSession', spaceHid)
store.dispatch('sessionCollection/updateUnreadCount', { spaceHid, count })

// Getters
store.getters['sessionCollection/getSession'](spaceHid)
store.getters['sessionCollection/getSessionList']
```

---

### messageCollection 模块

消息集合管理。

**命名空间**: `messageCollection`

```javascript
// State
store.state.messageCollection.messages     // 消息缓存
store.state.messageCollection.currentChat  // 当前聊天消息

// Actions
store.dispatch('messageCollection/addMessage', message)
store.dispatch('messageCollection/updateMessage', { uuid, data })
store.dispatch('messageCollection/deleteMessage', uuid)
store.dispatch('messageCollection/loadMoreMessages', { dialogId, before })

// Getters
store.getters['messageCollection/getMessages'](dialogId)
```

---

### userInfo 模块

当前用户信息。

**命名空间**: `userInfo`

```javascript
// State
store.state.userInfo.hid          // 当前用户 HID
store.state.userInfo.uid          // 当前用户 UID
store.state.userInfo.name         // 用户名
store.state.userInfo.avatar       // 头像
store.state.userInfo.email        // 邮箱
store.state.userInfo.phone        // 电话

// Actions
store.dispatch('userInfo/setUserInfo', userInfo)
store.dispatch('userInfo/updateAvatar', avatarUrl)
store.dispatch('userInfo/clear')

// Getters
store.getters['userInfo/currentUser']
store.getters['userInfo/isLoggedIn']
```

---

### spaceCollection 模块

空间/租户集合管理。

**命名空间**: `spaceCollection`

```javascript
// State
store.state.spaceCollection.spaces        // 空间列表
store.state.spaceCollection.currentSpace  // 当前空间

// Actions
store.dispatch('spaceCollection/setSpaces', spaces)
store.dispatch('spaceCollection/switchSpace', spaceId)
store.dispatch('spaceCollection/updateSpace', { spaceId, data })

// Getters
store.getters['spaceCollection/currentSpaceId']
store.getters['spaceCollection/getSpace'](spaceId)
```

---

### setting 模块

用户设置。

**命名空间**: `setting`

```javascript
// State
store.state.setting.receiptEnabled    // 已读回执开关
store.state.setting.notificationEnabled // 通知开关
store.state.setting.soundEnabled      // 声音开关
store.state.setting.language          // 语言

// Actions
store.dispatch('setting/setReceipt', enabled)
store.dispatch('setting/setNotification', enabled)
store.dispatch('setting/setLanguage', 'en')
store.dispatch('setting/refresh', { type: 'initial' })

// Mutations
store.commit('setting/SET_RECEIPT', enabled)
store.commit('setting/SET_LANGUAGE', 'ar')
```

---

### theme 模块

主题设置。

**命名空间**: `theme`

```javascript
// State
store.state.theme.mode        // 'light' | 'dark' | 'system'
store.state.theme.primaryColor // 主题色

// Actions
store.dispatch('theme/setMode', 'dark')
store.dispatch('theme/setPrimaryColor', '#1890ff')
```

---

### dialogList 模块

对话框/会话列表。

**命名空间**: `dialogList`

```javascript
// State
store.state.dialogList.list   // 会话列表数组

// Actions
store.dispatch('dialogList/addDialog', dialog)
store.dispatch('dialogList/removeDialog', dialogId)
store.dispatch('dialogList/updateDialog', { dialogId, data })
store.dispatch('dialogList/moveToTop', dialogId)

// Getters
store.getters['dialogList/getDialog'](dialogId)
```

---

### fileCollection 模块

文件传输集合。

**命名空间**: `fileCollection`

```javascript
// State
store.state.fileCollection.uploads    // 上传任务列表
store.state.fileCollection.downloads  // 下载任务列表

// Actions
store.dispatch('fileCollection/addUpload', uploadTask)
store.dispatch('fileCollection/updateUploadProgress', { id, progress })
store.dispatch('fileCollection/addDownload', downloadTask)
store.dispatch('fileCollection/updateDownloadProgress', { id, progress })
store.dispatch('fileCollection/removeTask', { type, id })
```

---

## 常用 State

### 登录状态检查

```javascript
// 检查是否已登录
const isLoggedIn = store.state.concat.isLogin;

// 获取当前用户
const currentUser = store.state.userInfo;
```

### 获取当前会话

```javascript
// 获取当前选中的会话
const currentSession = store.state.uiControl.currentSession;

// 获取当前面板
const currentPanel = store.state.uiControl.currentPanel;
```

### 获取联系人

```javascript
import { enCodeSpaceHid } from '@/dataController/hid';

const spaceHid = enCodeSpaceHid(userHid, spaceId);
const peer = store.state.peerCollection[spaceHid];
```

---

## 常用 Actions

### 刷新数据

```javascript
// 刷新联系人列表
await store.dispatch('concat/refreshContacts', {
  spaceId: currentSpaceId,
  force: true
});

// 刷新群组列表
await store.dispatch('concat/refreshChannels', {
  spaceId: currentSpaceId
});

// 刷新设置
await store.dispatch('setting/refresh', {
  type: 'initial'
});
```

### 更新状态

```javascript
// 更新联系人
store.dispatch('peerCollection/updatePeer', {
  spaceHid,
  peer: updatedPeerData
});

// 更新会话
store.dispatch('sessionCollection/updateSession', {
  spaceHid,
  session: updatedSessionData
});

// 更新 UI 状态
store.commit('uiControl/SET_CURRENT_SESSION', newSession);
```

---

## 常用 Mutations

```javascript
// 设置当前面板
store.commit('uiControl/SET_CURRENT_PANEL', 'chat');

// 设置设置项
store.commit('setting/SET_RECEIPT', true);
store.commit('setting/SET_NOTIFICATION', false);

// 设置主题
store.commit('theme/SET_MODE', 'dark');
```

---

## 使用示例

### 在组件中使用

```vue
<template>
  <div>
    <span>{{ currentUser.name }}</span>
    <span>{{ unreadCount }}</span>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  computed: {
    ...mapState({
      currentUser: state => state.userInfo,
      isLoggedIn: state => state.concat.isLogin
    }),
    ...mapGetters('sessionCollection', ['getSessionList']),

    unreadCount() {
      return this.getSessionList.reduce((sum, s) => sum + (s.unreadCount || 0), 0);
    }
  },

  methods: {
    ...mapActions('concat', ['refreshContacts', 'refreshChannels']),

    async refresh() {
      await this.refreshContacts({ spaceId: this.spaceId, force: true });
    }
  }
}
</script>
```

### 在普通 JS 文件中使用

```javascript
import store from '@/store';

// 获取状态
const isLoggedIn = store.state.concat.isLogin;
const currentUser = store.state.userInfo;

// 分发 action
await store.dispatch('concat/refreshContacts', {
  spaceId,
  force: true
});

// 提交 mutation
store.commit('uiControl/SET_CURRENT_PANEL', 'meeting');

// 使用 getter
const peer = store.getters['peerCollection/getPeer'](spaceHid);
```

### 监听状态变化

```javascript
// 在组件中
export default {
  watch: {
    '$store.state.uiControl.currentSession'(newSession, oldSession) {
      // 处理会话切换
      this.handleSessionChange(newSession);
    }
  }
}

// 使用 store.watch
const unwatch = store.watch(
  (state) => state.concat.isLogin,
  (newValue, oldValue) => {
    if (newValue) {
      console.log('用户已登录');
    } else {
      console.log('用户已登出');
    }
  }
);

// 取消监听
unwatch();
```

---

## 最佳实践

### 1. 使用命名空间

始终使用命名空间访问模块：

```javascript
// 正确
store.dispatch('peerCollection/updatePeer', data);
store.state.peerCollection[key];

// 避免
store.dispatch('updatePeer', data);
```

### 2. 使用 Mutation 修改状态

不要直接修改 state，使用 mutation：

```javascript
// 正确
store.commit('setting/SET_RECEIPT', true);

// 错误
store.state.setting.receiptEnabled = true;
```

### 3. 异步操作使用 Action

```javascript
// 正确 - 在 action 中处理异步
store.dispatch('concat/refreshContacts', params);

// 避免 - 在组件中处理复杂异步逻辑
```

### 4. 使用 mapHelpers

在组件中使用 mapState、mapGetters、mapActions 简化代码：

```javascript
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';

export default {
  computed: {
    ...mapState('userInfo', ['name', 'avatar']),
    ...mapGetters('sessionCollection', ['getSessionList'])
  },
  methods: {
    ...mapActions('concat', ['refreshContacts']),
    ...mapMutations('uiControl', ['SET_CURRENT_PANEL'])
  }
}
```

---

## 相关文档

- [数据流架构](../architecture/data-flow.md)
- [渲染进程架构](../architecture/renderer-process.md)
- [Utils API 参考](./utils-api.md)

---

**最后更新**: 2026-02-05
