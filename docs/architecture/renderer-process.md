# 渲染进程架构详解

## 概述

渲染进程负责 UI 展示和用户交互，本项目使用 Vue 2 + Vuex + Vue Router 构建渲染进程应用。

## 入口文件分析

### `src/main.js` - 主渲染进程入口

```javascript
// 初始化流程
1. 加载 preload.js 暴露的 API
2. 配置 vue-i18n 国际化
3. 加载 Element UI 组件库
4. 初始化应用数据 (renderInitAppdata)
5. 初始化用户信息 (initUserInfo)
6. 配置 Vuex Store
7. 配置 Vue Router
8. 挂载 Vue 应用
```

### 关键初始化代码

```javascript
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './lang';
import ElementUI from 'element-ui';

// 全局组件注册
import { RecycleScroller, DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import Scrollbar from '@/components/Scrollbar';
import Tooltip from '@/components/Tooltip';
import SvgIcon from '@/components/common/SvgIcon';

Vue.component('RecycleScroller', RecycleScroller);
Vue.component('DynamicScroller', DynamicScroller);
Vue.component('DynamicScrollerItem', DynamicScrollerItem);
Vue.component('Scrollbar', Scrollbar);
Vue.component('Tooltip', Tooltip);
Vue.component('SvgIcon', SvgIcon);

// 全局指令
import loading from '@/components/common/LoadingDirective';
Vue.directive('loading', loading);

// 插件
Vue.use(ElementUI);
Vue.use(contextmenu);
Vue.use(infiniteScroll);

// 应用初始化
async function initApp() {
  await renderInitAppdata();
  await initUserInfo();

  new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount('#app');
}

initApp();
```

## 多页面应用架构

### `vue.config.js` 页面配置

项目采用多页面应用（MPA）模式，共 26 个独立页面：

```javascript
module.exports = {
  pages: {
    // 主应用
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html'
    },
    // 启动页
    start: {
      entry: 'src/renderer/start/main.js',
      template: 'public/start.html',
      filename: 'start.html'
    },
    // 截图窗口
    screenshot: {
      entry: 'src/renderer/screenshot/main.js',
      template: 'public/screenshot.html',
      filename: 'screenshot.html'
    },
    // 文件查看器
    fileViewer: {
      entry: 'src/renderer/fileViewer/main.js',
      template: 'public/fileViewer.html',
      filename: 'fileViewer.html'
    },
    // 图片编辑器
    pictureEditor: {
      entry: 'src/renderer/pictureEditor/index.js',
      template: 'public/pictureEditor.html',
      filename: 'pictureEditor.html'
    },
    // ... 更多页面 (共26个)
  }
};
```

### 页面清单

| 页面名称 | 入口文件 | 功能说明 |
|---------|---------|---------|
| index | src/main.js | 主应用窗口 |
| start | renderer/start/main.js | 启动加载页 |
| meetingInfo | renderer/meetingInfo/main.js | 会议信息显示 |
| callfeedback | renderer/callfeedback/main.js | 通话质量反馈 |
| toast | renderer/toast/index.js | 系统提示通知 |
| screenshot | renderer/screenshot/main.js | 截图工具 |
| pictureViewer | renderer/pictureViewer/main.js | 图片查看器 |
| pictureEditor | renderer/pictureEditor/index.js | 图片编辑器 |
| fileViewer | renderer/fileViewer/main.js | 文件查看器 |
| meetingInvite | renderer/meetingInvite/main.js | 会议邀请 |
| meetingWhiteboardShare | renderer/meetingWhiteboardShare/main.js | 白板分享 |
| deleteAccountFeedback | renderer/deleteAccountFeedback/main.js | 账户删除反馈 |
| sso | renderer/sso/index.js | SSO 单点登录 |
| meetingPwd | renderer/meetingPwd/index.js | 会议密码输入 |
| e2eeCode | renderer/e2eeCode/index.js | E2EE 验证码 |
| dialogWin | renderer/dialogWin/main.js | 通用对话框 |
| mapWin | renderer/mapWin/index.js | 地图窗口 |
| storageData | renderer/storageData/index.js | 存储数据管理 |
| profilePhoto | renderer/profilePhoto/index.js | 头像设置 |
| devicesManagement | renderer/devicesManagement/index.js | 设备管理 |
| aiModel | renderer/aiModel/main.js | AI 模型窗口 |
| update | renderer/update/index.js | 应用更新 |
| shortcut | renderer/shortcut/index.js | 快捷键设置 |
| helpCenter | renderer/helpCenter/index.js | 帮助中心 |
| newGuide | renderer/newGuide/index.js | 新手指南 |
| combineChat | renderer/combineChat/main.js | 合并聊天 |

## Vue 应用结构

### 根组件 `App.vue`

```vue
<template>
  <div id="app" :class="themeClass">
    <!-- 自定义标题栏 -->
    <TitleBar v-if="showTitleBar" />

    <!-- 路由视图 -->
    <router-view />

    <!-- 全局组件 -->
    <UpdateTemplate />
    <JoinMeetingDialog />
    <DomainInconsistency />
    <MediaStatusCheckModal />
    <MigrateAccount />
    <Reporting />
    <NoticeGlobal />
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {
    TitleBar,
    UpdateTemplate,
    JoinMeetingDialog,
    DomainInconsistency,
    MediaStatusCheckModal,
    MigrateAccount,
    Reporting,
    NoticeGlobal
  },
  computed: {
    ...mapState('theme', ['currentTheme']),
    themeClass() {
      return `theme-${this.currentTheme}`;
    }
  }
};
</script>
```

### 路由配置 `src/router.js`

```javascript
import Vue from 'vue';
import Router from 'vue-router';
import Welcome from '@/views/Welcome.vue';

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'Welcome',
      component: Welcome,
      meta: { requiresAuth: false }
    },
    {
      path: '/emiallogin',
      name: 'EmailLogin',
      component: Welcome,
      meta: { requiresAuth: false }
    },
    {
      path: '/message',
      name: 'Message',
      component: () => import('@/views/Main.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const loginStatus = store.state.loginStatus;
  const keepLogin = store.state.keepLogin;

  // 初始化主题
  initTheme();

  // 需要认证的路由
  if (to.meta.requiresAuth && !loginStatus) {
    next({ name: 'Welcome' });
    return;
  }

  // 已登录访问登录页
  if (!to.meta.requiresAuth && loginStatus && keepLogin) {
    next({ name: 'Message' });
    return;
  }

  next();
});

export default router;
```

## Vuex 状态管理

### Store 结构

```
src/store/
├── index.js                   # Store 入口
├── modules/
│   ├── messageCollection.js   # 消息集合
│   ├── peerCollection.js      # 用户/对象集合
│   ├── spaceCollection.js     # 空间集合
│   ├── spaceLimit.js          # 空间限制
│   ├── forwardCollection.js   # 转发集合
│   ├── searchCollection.js    # 搜索集合
│   ├── theme.js               # 主题管理
│   ├── uiControl.js           # UI 控制状态
│   ├── chatTyping.js          # 输入状态
│   ├── approval.js            # 审批流程
│   ├── customerInfo.js        # 客户信息
│   ├── updater.js             # 更新程序
│   ├── suggestionList.js      # 建议列表
│   └── storage.js             # 存储同步
```

### 核心模块示例

#### `messageCollection.js` - 消息模块

```javascript
export default {
  namespaced: true,

  state: {
    messages: {},           // 消息集合 { sessionId: [messages] }
    currentSession: null,   // 当前会话
    unreadCount: 0,         // 未读数量
    loadingMore: false      // 加载状态
  },

  getters: {
    currentMessages: (state) => {
      return state.messages[state.currentSession] || [];
    },
    totalUnread: (state) => {
      return Object.values(state.messages).reduce((sum, msgs) => {
        return sum + msgs.filter(m => !m.read).length;
      }, 0);
    }
  },

  mutations: {
    SET_MESSAGES(state, { sessionId, messages }) {
      Vue.set(state.messages, sessionId, messages);
    },
    ADD_MESSAGE(state, { sessionId, message }) {
      if (!state.messages[sessionId]) {
        Vue.set(state.messages, sessionId, []);
      }
      state.messages[sessionId].push(message);
    },
    SET_CURRENT_SESSION(state, sessionId) {
      state.currentSession = sessionId;
    }
  },

  actions: {
    async fetchMessages({ commit }, { sessionId, page }) {
      const messages = await messageApi.getMessages(sessionId, page);
      commit('SET_MESSAGES', { sessionId, messages });
    },
    async sendMessage({ commit }, { sessionId, content }) {
      const message = await messageApi.sendMessage(sessionId, content);
      commit('ADD_MESSAGE', { sessionId, message });
    }
  }
};
```

#### `theme.js` - 主题模块

```javascript
export default {
  namespaced: true,

  state: {
    currentTheme: 'light',  // 'light' | 'dark' | 'system'
    systemTheme: 'light'    // 系统主题
  },

  mutations: {
    SET_THEME(state, theme) {
      state.currentTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
    },
    SET_SYSTEM_THEME(state, theme) {
      state.systemTheme = theme;
    }
  },

  actions: {
    initTheme({ commit, state }) {
      const saved = localStorage.getItem('theme');
      if (saved) {
        commit('SET_THEME', saved);
      }
    },
    setTheme({ commit }, theme) {
      localStorage.setItem('theme', theme);
      commit('SET_THEME', theme);
    }
  }
};
```

### 与主进程 Store 同步

```javascript
// src/store/modules/storage.js
import { ipcRenderer } from 'electron';

export default {
  namespaced: true,

  state: {
    // 从主进程同步的数据
    userData: null,
    accountData: null,
    lang: 'en'
  },

  mutations: {
    SYNC_FROM_MAIN(state, { key, value }) {
      if (state.hasOwnProperty(key)) {
        state[key] = value;
      }
    }
  },

  actions: {
    async init({ commit }) {
      // 初始化时从主进程获取数据
      const storage = await ipcRenderer.invoke('getStore', 'storage');
      Object.keys(storage).forEach(key => {
        commit('SYNC_FROM_MAIN', { key, value: storage[key] });
      });
    },
    async setItem({ commit }, { key, value }) {
      await ipcRenderer.invoke('setStore', key, value);
      commit('SYNC_FROM_MAIN', { key, value });
    }
  }
};

// 监听主进程存储变化
ipcRenderer.on('changeStorage', (event, { key, value }) => {
  store.commit('storage/SYNC_FROM_MAIN', { key, value });
});
```

## 组件架构

### 组件目录结构

```
src/components/
├── Chat/                    # 聊天相关
│   ├── ChatWindow.vue       # 聊天窗口
│   ├── MessageList.vue      # 消息列表
│   ├── MessageItem.vue      # 消息项
│   └── ...
├── Meeting/                 # 会议相关
│   ├── MeetingRoom.vue      # 会议室
│   ├── ParticipantList.vue  # 参与者列表
│   └── ...
├── MessageInput/            # 消息输入
│   ├── index.vue            # 输入框主组件
│   ├── Toolbar.vue          # 工具栏
│   └── ...
├── Layout/                  # 布局组件
│   ├── TitleBar.vue         # 标题栏
│   ├── Sidebar.vue          # 侧边栏
│   └── ...
├── Contact/                 # 联系人
│   ├── ContactCard.vue      # 联系人卡片
│   ├── ContactSearch.vue    # 联系人搜索
│   └── ...
├── common/                  # 通用组件
│   ├── SvgIcon/             # SVG 图标
│   ├── LoadingDirective/    # 加载指令
│   ├── EmptyIcon/           # 空状态图标
│   └── vue-emojis/          # 表情组件
└── ...
```

### 组件设计模式

#### 1. 容器组件 vs 展示组件

```vue
<!-- 容器组件 - 处理数据和逻辑 -->
<template>
  <ChatWindowPresentation
    :messages="messages"
    :loading="loading"
    @send="handleSend"
    @loadMore="handleLoadMore"
  />
</template>

<script>
export default {
  computed: {
    ...mapGetters('messageCollection', ['currentMessages']),
    ...mapState('messageCollection', ['loadingMore'])
  },
  methods: {
    ...mapActions('messageCollection', ['sendMessage', 'fetchMessages']),
    handleSend(content) {
      this.sendMessage({ sessionId: this.currentSession, content });
    }
  }
};
</script>

<!-- 展示组件 - 纯 UI 渲染 -->
<template>
  <div class="chat-window">
    <div class="messages" v-loading="loading">
      <MessageItem
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />
    </div>
    <MessageInput @send="$emit('send', $event)" />
  </div>
</template>
```

#### 2. 虚拟滚动

```vue
<template>
  <RecycleScroller
    class="scroller"
    :items="messages"
    :item-size="80"
    key-field="id"
    v-slot="{ item }"
  >
    <MessageItem :message="item" />
  </RecycleScroller>
</template>
```

#### 3. 懒加载组件

```javascript
// 路由级懒加载
{
  path: '/message',
  component: () => import('@/views/Main.vue')
}

// 组件级懒加载
components: {
  HeavyComponent: () => import('./HeavyComponent.vue')
}
```

## 样式架构

### SCSS 结构

```
src/styles/
├── variables.scss      # 变量定义
├── mixins.scss         # 混合宏
├── reset.scss          # 样式重置
├── element-override.scss  # Element UI 覆盖
├── theme/
│   ├── light.scss      # 亮色主题
│   └── dark.scss       # 暗色主题
└── common.scss         # 通用样式
```

### 主题变量

```scss
// variables.scss
:root {
  // 亮色主题
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --accent-color: #1890ff;
}

[data-theme="dark"] {
  // 暗色主题
  --bg-primary: #1f1f1f;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --border-color: #404040;
  --accent-color: #177ddc;
}
```

### 组件样式规范

```vue
<style lang="scss" scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);

  &__header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  &__content {
    flex: 1;
    overflow-y: auto;
  }

  &__footer {
    padding: 16px;
    border-top: 1px solid var(--border-color);
  }
}
</style>
```

## 预加载脚本

### `src/preload.js`

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// 安全暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electron', {
  // IPC 通信
  ipcRenderer: {
    send: (channel, ...args) => {
      const validChannels = ['setStore', 'updateStore', 'minimize', 'maximize', 'close'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    },
    on: (channel, func) => {
      const validChannels = ['changeStorage', 'update-available', 'download-progress'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel, ...args) => {
      const validChannels = ['getStore', 'setStore', 'dialog:open', 'dialog:save'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  },

  // 应用信息
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPath: (name) => ipcRenderer.invoke('app:getPath', name)
  },

  // 平台信息
  platform: process.platform,
  arch: process.arch
});
```

## 下一步阅读

- [IPC 通信机制](./ipc-communication.md) - 深入了解进程间通信
- [数据流架构](./data-flow.md) - 数据流动与状态管理
