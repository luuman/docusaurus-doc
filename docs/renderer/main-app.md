# 主应用渲染进程

## 概述

主应用渲染进程是 Matrx Windows 客户端的核心前端模块，基于 Vue 2 + Vuex + Vue Router 构建。入口文件为 `src/main.js`，负责应用初始化、数据预载、全局组件/指令/插件注册，以及 Vue 实例的创建与挂载。本文档详细分析主应用渲染进程的启动流程、App.vue 根组件结构、路由配置以及关键辅助模块。

## 核心文件结构

```
src/
├── main.js                      # 渲染进程入口
├── App.vue                      # 根组件
├── router.js                    # 路由配置
├── preload.js                   # 预加载脚本（主窗口）
├── store/                       # Vuex 状态管理
├── utils/
│   └── initVue.js               # Vue 插件 - Client 类（IPC 事件中心）
├── config/
│   ├── element.config.js        # Element UI 配置
│   └── config.js                # 环境配置
├── mixins/
│   └── doInitMix.js             # 登录初始化 mixin
└── lang/                        # 国际化配置
```

## main.js 入口详解

### 启动流程

`src/main.js` 采用两阶段启动模式：先执行 `run()` 完成数据准备，再执行 `startVue()` 创建 Vue 实例。

```
run() ──► startVue() ──► CstSdkIpcListeners() ──► initUserInfo()
  │            │
  │            ├─ 注册全局组件
  │            ├─ 注册全局指令
  │            ├─ 注册插件
  │            └─ 创建 Vue 实例并挂载
  │
  ├─ renderInitAppdata()      # 初始化 appdata 存储
  ├─ initAppdataStorage()     # 建立本地存储桥
  ├─ 恢复用户登录状态
  ├─ 初始化 emoji 回复模块
  └─ 磁盘空间检查
```

### 阶段一：run() - 数据准备

```javascript
async function run() {
    // 1. 初始化 appdata 存储层
    await renderInitAppdata(store);

    // 2. 建立 appdataStorage 全局存储桥
    const initAppdataStorage = require('@/tools/forwardDB/appdataStorage.js');
    window.appdataStorage = initAppdataStorage(store);

    // 3. 恢复用户登录状态到 Vuex
    store.dispatch('userInfo/updateUserData', {
        uid: appdataStorage.getItem('uid'),
        hid: appdataStorage.getItem('hid'),
        loginStatus: appdataStorage.getItem('loginStatus'),
        userAgentAppend: window.navigator.userAgent
    });

    // 4. 初始化 emoji 回复模块
    store.dispatch('emojiReply/emojiInit');

    // 5. 恢复当前空间选择
    if (loginstatus == 'LOGINFINISH') {
        store.commit('spaceCollection/SET_CURRENT_SPACE',
            appdataStorage.getItem('xx_currentSpace'));
    }

    // 6. 延迟检查磁盘空间（15秒后）
    setTimeout(() => {
        checkUserDiskFreeSpace('USER_PATH').then(diskSpace => {
            if (diskSpace && diskSpace.free <= defaultDiskSize) {
                Message({ type: 'error', message: i18n.t('errorCode.start_app_nospace') });
            }
        });
    }, 15 * 1000);
}
```

关键点：
- `renderInitAppdata` 从本地文件系统读取 appdata，确保渲染进程可访问持久化数据
- `appdataStorage` 挂载到 `window` 全局对象，供所有模块使用
- 已读回执起始时间默认设置为 `2022-03-11 08:00:00`

### 阶段二：startVue() - Vue 实例创建

```javascript
async function startVue() {
    document.title = pkg.productName;

    // Vue 全局配置
    Vue.config.productionTip = false;
    Vue.config.errorHandler = function (err, vm, info) {
        // 全局错误上报
        reportErrorLogCommon({ error: err, info, vmName: vm.$vnode?.componentOptions?.tag });
    };

    // 注册全局组件（详见下文）
    // 注册全局指令（详见下文）
    // 注册插件（详见下文）

    // 私有化部署验证
    if (envConfig.isPrivated) {
        await startVerifyConfig(envConfig.serverConf, true);
    }

    // 创建并挂载 Vue 实例
    new Vue({
        i18n,
        router,
        store,
        render: h => h(App)
    }).$mount('#app');
}
```

### 阶段三：后置初始化

```javascript
run().then(async () => {
    startVue();

    // 启动会议 SDK IPC 监听
    CstSdkIpcListeners();

    // 获取设备信息和客户端版本
    let { wdid, clientver } = await initUserInfo();
    store.dispatch('userInfo/updateUserData', { wdid, clientver });

    // 开启开发日志
    openDevLog();
});
```

### 全局错误处理

`main.js` 在三个层级捕获异常：

| 层级 | 事件 | 处理方式 |
|------|------|----------|
| window | `error` | `devLog.error` + `reportErrorLogCommon` |
| process | `uncaughtException` | `devLog.info` + `reportErrorLogCommon` |
| process | `unhandledRejection` | `devLog.info` + `reportErrorLogCommon` |
| Vue | `errorHandler` | `devLog.error` + `reportErrorLogCommon` + 磁盘空间提示 |

当捕获到 `no space left on device` 错误时，会通过 `electronToast` 弹出磁盘空间不足提示。

## 全局组件注册

以下组件在 `startVue()` 中注册为全局组件，可在任意 Vue 模板中直接使用：

| 组件名 | 来源 | 用途 |
|--------|------|------|
| `RecycleScroller` | `vue-virtual-scroller` | 虚拟滚动列表（固定高度） |
| `DynamicScroller` | `vue-virtual-scroller` | 虚拟滚动列表（动态高度） |
| `DynamicScrollerItem` | `vue-virtual-scroller` | 动态滚动列表项 |
| `Scrollbar` | `@/components/Scrollbar` | 自定义滚动条 |
| `Tooltip` | `@/components/Tooltip` | 提示框 |
| `RenderName` | `@/components/RenderName` | 用户名渲染（姓名拼接策略） |
| `SvgIcon` | `@/components/common/SvgIcon` | SVG 图标 |
| `EmptyIcon` | `@/components/common/EmptyIcon` | 空状态图标 |

```javascript
Vue.component('RecycleScroller', RecycleScroller);
Vue.component('DynamicScroller', DynamicScroller);
Vue.component('DynamicScrollerItem', DynamicScrollerItem);
Vue.component('Scrollbar', Scrollbar);
Vue.component('Tooltip', Tooltip);
Vue.component('RenderName', RenderName);
Vue.component('SvgIcon', SvgIcon);
Vue.component('EmptyIcon', EmptyIcon);
```

## 全局指令注册

| 指令名 | 来源 | 用途 |
|--------|------|------|
| `v-loading` | `@/components/common/LoadingDirective` | 自定义加载状态指令 |

```javascript
Vue.directive('loading', LoadingDirective);
```

另外，`contextmenu` 指令通过插件模式注册（`Vue.use(contextmenu)`），提供右键菜单功能。

## 插件集成

| 插件 | 来源 | 用途 |
|------|------|------|
| `Alert` (vue-emojis) | `@/components/common/vue-emojis` | Emoji 表情弹窗 |
| `contextmenu` | `@/directive/contextmenu` | 右键上下文菜单 |
| `infiniteScroll` | `vue-infinite-scroll` | 无限滚动加载 |
| `mainClient` (initVue) | `@/utils/initVue` | Client 类插件，IPC 事件中心 |

```javascript
Vue.use(Alert);
Vue.use(contextmenu);
Vue.use(infiniteScroll);
Vue.use(mainClient);
```

### initVue 插件详解

`@/utils/initVue.js` 导出的 `mainClient` 插件是主渲染进程的核心通信枢纽。它以 Vue 插件形式安装，创建 `Client` 类实例并挂载到 `Vue.prototype.mainClient` 和 `window.mainClient`。

```javascript
export default {
    install(Vue, options) {
        window.mainClient = Vue.prototype.mainClient = new Client({ a: 1, ...options });
        window.cname = Vue.prototype.cname = cname;
        window.getLangText = Vue.prototype.getLangText = getLangText;
    }
};
```

`Client` 类核心功能：

- **ipcEvent()**: 注册所有 IPC 渲染进程监听器，包括：
  - `POWER-MONITOR-CHANGED`: 电源状态变化（休眠/恢复/解锁）
  - `start-CheckUpdateVersion`: 版本更新检查
  - `GET_CURRENT_WIN_SOTRE`: 向其他窗口返回主窗口 state
  - `GET_CURRENT_WIN_DATA`: 提供数据查询代理（FTS搜索、联系人查询等）
  - `sendTo-main-win`: 接收其他窗口发送的命令
  - `picture-viewer`: 图片查看器数据交互
  - `delete-account-feedback`: 删除账号反馈
  - `notification-send`: 通知消息点击跳转

- **globalInterval()**: 全局定时器（每5秒触发），用于缓存清理（30分钟）和服务器时间同步（1小时）

- **clearCacheMemory()**: CPU 空闲时执行 `webFrame.clearCache()` 释放内存

## App.vue 根组件结构

### 模板结构

```html
<template>
  <div id="app">
    <TitleBar />                          <!-- 自定义标题栏 -->
    <router-view></router-view>           <!-- 路由视图 -->
    <audio ref="soundPlay" :src="soundPlay"></audio>  <!-- 通知音效 -->
    <UpdateTemplate />                     <!-- 更新提示弹窗 -->
    <MeetingInfoCopy />                    <!-- 会议信息复制 -->
    <NoticeGlobal />                       <!-- 全局通知 -->
    <JoinMeetingDialog />                  <!-- 加入会议弹窗 -->
    <DomainInconsistency />                <!-- 域名不一致提示 -->
    <MediaStatusCheckModal />              <!-- 媒体状态检查 -->
    <MigrateAccount />                     <!-- 账号迁移弹窗 -->
    <Reporting />                          <!-- 上报组件 -->
  </div>
</template>
```

### 核心 Mixins

App.vue 混入 `doInitMix`（`@/mixins/doInitMix`），该 mixin 包含登录完成后的初始化逻辑：
- 建立 WebSocket 连接（`initChanel`）
- 获取 iKey 和执行简易登录（`getIkeyAndSimpleLogin`）

### 登录状态监听

App.vue 通过 `watch` 监听 `loginStatus` 状态变化，驱动核心业务流程：

```
loginStatus 变化
├── 'EMAILMLOGIN' → getIkeyAndSimpleLogin() → initChanel()
├── 'LOGINFINISH' → router.push('Message') → ShortcutService.init()
└── 'ERROR'       → 处理登录异常 → logUserOut()
```

### 关键方法

| 方法 | 功能 |
|------|------|
| `logUserOut()` | 登出：销毁 Socket、清除本地存储、重置状态、刷新页面 |
| `sendMeetingInvites(ids)` | 向指定用户发送会议邀请卡片消息 |
| `sendE2EMessage(sendData)` | E2EE 端对端加密消息发送 |
| `winOnBlurFocus()` | 监听窗口焦点变化，更新 `isWinFocus` 状态 |
| `permittedTips(url)` | 权限受限提示弹窗 |

### IPC 监听

App.vue 在 `mounted` 生命周期中注册的关键 IPC 监听：

| IPC 频道 | 功能 |
|----------|------|
| `IPC_SDK_OPEN_HAS_REMOVED` | 被移出会议提示 |
| `IPC_GET_PREVIEW_TEMP_URL` | AI 助手图片预览地址获取 |
| `CLEAR-TEMP-USER` | 临时用户清理（非记住密码时登出） |
| `changeStorage` | 存储配置变更 |
| `HWD-Conf-MEETING-INVITE-Attendee` | 会议邀请发送 |
| `SEND_SSO_DATA` | SSO 单点登录数据接收 |
| `LINK-JOIN-MEETING-ERROR` | 会议链接加入失败 |

## 路由配置

### 路由定义

`src/router.js` 使用 hash 模式，定义三个主要路由：

```javascript
const routes = [
    {
        path: '/',
        name: 'Welcome',
        component: Welcome            // 欢迎/登录页面
    },
    {
        path: '/emiallogin',
        name: 'EmailLogin',
        component: Welcome            // 邮箱登录页面（复用 Welcome 组件）
    },
    {
        path: '/message',
        name: 'Message',
        component: () => import('@/views/Main.vue')  // 主消息页面（懒加载）
    },
    {
        path: '*',
        redirect: '/'                 // 兜底重定向
    }
];
```

### 路由守卫

`beforeEach` 守卫实现登录状态校验：

```javascript
router.beforeEach((to, from, next) => {
    let loginstatus = appdataStorage.getItem('loginStatus');

    if (loginstatus == 'LOGINFINISH') {
        // 已登录：初始化主题，仅允许访问 Message 页面
        store.dispatch('theme/initTheme');
        if (directRouteNameList.includes(to.name)) {
            next();
        } else {
            next({ name: 'Message' });
        }
    } else {
        // 未登录：清除主题，禁止访问 Message 页面
        store.dispatch('theme/clearTheme');
        if (to.name == 'Message') {
            next({ name: 'EmailLogin' });
        } else {
            next();
        }
    }
});
```

### 路由导航错误抑制

```javascript
const originalPush = Router.prototype.push;
Router.prototype.push = function push(location) {
    return originalPush.call(this, location).catch(err => err);
};
```

覆写 `Router.prototype.push` 以静默处理重复导航错误（`NavigationDuplicated`）。

## 样式体系

App.vue 包含多段 `<style>` 块，覆盖以下样式层级：

| 样式范围 | 内容 |
|----------|------|
| 基础布局 | `html/body/app` 全屏布局、高亮文本样式 |
| Element UI 覆盖 | MessageBox、Dialog、Button、Checkbox 等组件样式定制 |
| 会议相关 | `meeting-info-dialog`、`meeting_dialog` 等会议弹窗样式 |
| 加载动画 | 自定义 loading gif 替代 Element UI 默认 spinner |
| 主题适配 | CSS 变量（`var(--blue-4)`、`var(--grey-10)` 等）实现主题切换 |

全局样式导入链：

```
main.js
├── @/styles/variables.css       # CSS 自定义属性
├── @/styles/varibales/color.css # 颜色变量
├── @/styles/style.scss          # 全局基础样式
├── @/styles/theme-chalk/index.scss  # Element UI 主题定制
└── vue-virtual-scroller/dist/vue-virtual-scroller.css
```
