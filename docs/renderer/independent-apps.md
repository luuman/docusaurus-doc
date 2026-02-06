# 独立渲染应用

## 概述

Matrx Windows 客户端采用多页面应用（MPA）架构，除了主应用渲染进程外，还包含 26 个独立渲染应用。每个独立应用运行在独立的 `BrowserWindow` 中，拥有各自的入口文件、Vue 实例，部分应用拥有独立的 Vuex Store 和 Router。独立应用通过 IPC 通信与主窗口交换数据，实现功能解耦和进程隔离。

## 核心文件结构

```
src/renderer/
├── screenshot/              # 截屏应用
│   ├── main.js              # 入口（含 preload）
│   ├── preload.js           # 截屏专用预加载脚本
│   ├── App.vue              # 根组件
│   ├── App.scss             # 样式
│   ├── store/               # 独立 Vuex Store
│   └── components/          # 截屏工具组件
├── pictureEditor/           # 图片编辑应用
│   ├── index.js             # 入口
│   └── App.vue
├── pictureViewer/           # 图片/视频查看器
│   ├── main.js              # 入口
│   ├── App.vue
│   ├── ImageViewer.vue      # 图片查看组件
│   ├── ImageToggle.vue      # 图片切换
│   ├── playVideo.vue        # 视频播放
│   └── ContactsDialog.vue   # 转发联系人选择
├── fileViewer/              # 文件查看器
│   ├── main.js              # 入口
│   ├── App.vue
│   ├── router.js            # 独立路由
│   ├── store/               # 独立 Vuex Store
│   ├── PdfViewer/           # PDF 查看
│   ├── TxtViewer/           # 文本查看
│   ├── VideoViewer/         # 视频查看
│   ├── OfficeViewer/        # Office 文件查看
│   └── NotSupported/        # 不支持的文件类型
├── shortcut/                # 快捷键设置
│   ├── index.js             # 入口
│   └── App.vue
├── update/                  # 更新管理
│   ├── index.js             # 入口
│   ├── store/               # 独立 Vuex Store
│   └── App.vue
├── aiModel/                 # AI 助手
│   ├── main.js              # 入口
│   ├── preload.js           # AI 专用预加载
│   ├── App.vue
│   └── components/          # AI 对话组件
├── combineChat/             # 合并聊天记录查看
│   ├── main.js              # 入口
│   ├── preload.js           # 合并聊天专用预加载
│   └── App.vue
├── callfeedback/            # 通话质量反馈
│   ├── main.js              # 入口
│   ├── preload.js           # 反馈专用预加载
│   └── App.vue
├── meetingInvite/           # 会议邀请
│   ├── main.js              # 入口
│   └── App.vue
├── meetingInfo/             # 会议信息展示
│   ├── main.js              # 入口
│   └── App.vue
├── meetingPwd/              # 会议密码输入
│   ├── index.js             # 入口
│   └── Index.vue
├── meetingWhiteboardShare/  # 会议白板共享
│   ├── main.js              # 入口
│   └── App.vue
├── dialogWin/               # 弹窗窗口
│   ├── main.js              # 入口
│   └── Index.vue
├── deleteAccountFeedback/   # 账号删除反馈
│   ├── main.js              # 入口
│   └── App.vue
├── helpCenter/              # 帮助中心
│   ├── index.js             # 入口
│   └── App.vue
├── e2eeCode/                # E2EE 安全码展示
│   ├── index.js             # 入口
│   └── Index.vue
├── robotPage/               # 机器人页面
│   ├── index.js             # 入口
│   └── Index.vue
├── profilePhoto/            # 头像编辑
│   ├── index.js             # 入口
│   └── App.vue
├── devicesManagement/       # 设备管理
│   ├── index.js             # 入口
│   └── App.vue
├── storageData/             # 存储数据管理
│   ├── index.js             # 入口
│   └── App.vue
├── mapWin/                  # 地图窗口
│   ├── index.js             # 入口
│   └── App.vue
├── toast/                   # Toast 通知
│   ├── index.js             # 入口
│   └── Index.vue
├── sso/                     # SSO 单点登录
│   ├── index.js             # 入口
│   └── App.vue
├── newGuide/                # 新手引导
│   ├── index.js             # 入口
│   └── App.vue
└── start/                   # SDK 启动进程
    └── main.js              # SDK 初始化入口
```

## 所有独立应用清单

| 应用 | 入口文件 | 独立 Store | 独立 Router | Preload | 功能描述 |
|------|----------|-----------|-------------|---------|----------|
| screenshot | `main.js` | 是 | 否 | 是 | 屏幕截图与标注 |
| pictureEditor | `index.js` | 是 (screenshot) | 否 | 否 | 图片编辑 |
| pictureViewer | `main.js` | 否 | 否 | 否 | 图片/视频查看 |
| fileViewer | `main.js` | 是 | 是 | 否 | 文件预览（PDF/文本/视频/Office） |
| shortcut | `index.js` | 否 | 否 | 否 | 快捷键设置 |
| update | `index.js` | 是 | 否 | 否 | 应用更新管理 |
| aiModel | `main.js` | 否 | 否 | 是 | AI 对话助手 |
| combineChat | `main.js` | 是 (主 Store) | 否 | 是 | 合并消息查看 |
| callfeedback | `main.js` | 否 | 否 | 是 | 通话质量反馈 |
| meetingInvite | `main.js` | 否 | 否 | 否 | 会议邀请卡片 |
| meetingInfo | `main.js` | 否 | 否 | 否 | 会议信息展示 |
| meetingPwd | `index.js` | 否 | 否 | 否 | 会议密码输入 |
| meetingWhiteboardShare | `main.js` | 否 | 否 | 否 | 白板共享展示 |
| dialogWin | `main.js` | 否 | 否 | 否 | 通用弹窗窗口 |
| deleteAccountFeedback | `main.js` | 否 | 否 | 否 | 删除账号反馈 |
| helpCenter | `index.js` | 否 | 否 | 否 | 帮助中心 |
| e2eeCode | `index.js` | 否 | 否 | 否 | E2EE 安全码 |
| robotPage | `index.js` | 否 | 否 | 否 | 机器人应用页面 |
| profilePhoto | `index.js` | 否 | 否 | 否 | 头像裁剪编辑 |
| devicesManagement | `index.js` | 否 | 否 | 否 | 登录设备管理 |
| storageData | `index.js` | 否 | 否 | 否 | 存储数据管理 |
| mapWin | `index.js` | 否 | 否 | 否 | 地图位置展示 |
| toast | `index.js` | 否 | 否 | 否 | Toast 通知弹窗 |
| sso | `index.js` | 否 | 否 | 否 | SSO 登录窗口 |
| newGuide | `index.js` | 否 | 否 | 否 | 新手引导 |
| start | `main.js` | 否 | 否 | 否 | SDK 初始化进程 |

## 典型独立应用详解

---

### screenshot - 截屏应用

截屏应用是最复杂的独立渲染应用之一，支持屏幕截图、区域选择、标注编辑、放大镜等功能。

#### 入口文件

```javascript
// src/renderer/screenshot/main.js
import './preload.js';
import Vue from 'vue';
import i18n from '@/lang';
import App from '@/renderer/screenshot/App';
import store from '@/renderer/screenshot/store/index';

import '@/renderer/screenshot/components/Screenshots/screenshots.scss';
import './components.config.js';

new Vue({
    store,
    i18n,
    render: h => h(App)
}).$mount('#app');
```

关键特点：
- 导入自身的 `preload.js`，获取截屏专用的 Electron API
- 拥有独立的 Vuex Store（`screenshot/store/index`）
- 导入专用组件配置（`components.config.js`）
- 注册全局异常捕获

#### 核心组件结构

```html
<!-- App.vue -->
<template>
  <div class="screenshot">
    <canvas id="bg-canvas"></canvas>          <!-- 背景画布 -->
    <div id="js-bg" class="bg"></div>          <!-- 遮罩层 -->
    <canvas id="js-canvas"></canvas>           <!-- 截图画布 -->
    <div class="size-info">{{ sizeInfo }}</div> <!-- 尺寸信息 -->
    <Screenshots />                            <!-- 工具栏与编辑组件 -->
    <CaptureMagnifier />                       <!-- 放大镜组件 -->
  </div>
</template>
```

#### 截屏交互模块

| 模块 | 功能 |
|------|------|
| `desktop-capturer` | 获取屏幕源（Electron desktopCapturer） |
| `capture-editor` | 截图区域编辑（创建、移动、调整大小、锚点） |
| `Screenshots` | 工具栏（矩形、圆形、箭头、文字、马赛克等） |
| `CaptureMagnifier` | 截图时的放大镜预览 |

#### 截屏窗口控制

截屏应用通过 preload 暴露的 `window.screenshot` API 控制窗口行为：

```javascript
window.screenshot = {
    focus(),                    // 窗口获焦
    setOpacity(data),          // 设置透明度
    getOpacity(data),          // 获取透明度
    setIgnoreMouseEvents(data), // 设置鼠标事件穿透
    getBounds(),               // 获取窗口边界
    setBounds(data),           // 设置窗口边界
    getCursorScreenPoint(),    // 获取鼠标坐标
    getCurrentScreen(),        // 获取当前屏幕信息
    screenshotDesktop(display), // 执行桌面截图
    dialog.showSaveDialog(),   // 保存文件对话框
    fs.writeFile(),            // 写入文件
    clipboardWriteImage(url),  // 写入剪贴板
    user32.getPreviewWindowRect(), // Win32 API 获取窗口位置
    user32.setShowCursor()     // 显示/隐藏光标
};
```

---

### pictureViewer - 图片/视频查看器

#### 入口文件

```javascript
// src/renderer/pictureViewer/main.js
import Vue from 'vue';
import i18n from '@/lang';
import App from './App.vue';

import SvgIcon from '@/components/common/SvgIcon/index.vue';
import Tooltip from '@/components/Tooltip';
import RenderName from '@/components/RenderName';

Vue.component('SvgIcon', SvgIcon);
Vue.component('Tooltip', Tooltip);
Vue.component('RenderName', RenderName);

window.nofetchAvatar = 1;  // 禁止自动拉取头像

new Vue({
    i18n,
    render: h => h(App)
}).$mount('#app');
```

#### 核心组件

| 组件 | 功能 |
|------|------|
| `ImageViewer.vue` | 图片查看器（缩放、旋转、拖拽） |
| `ImageToggle.vue` | 图片前后切换导航 |
| `playVideo.vue` | 视频播放器 |
| `ContactsDialog.vue` | 转发时的联系人选择弹窗 |

#### 与主窗口通信

图片查看器通过 IPC 与主窗口交换数据：

```javascript
// 主窗口 initVue.js 中的 IPC 监听
ipcRenderer.on('picture-viewer', (event, params) => {
    switch (params.type) {
        case 'get-chat-images':
            // 从数据库获取聊天图片列表
            Peer.fetchFiles(dialogId, startPage, howmuch, 'image&video');
            break;
        case 'start-loading-image':
            // 开始下载图片（普通图片/富文本图片/视频）
            break;
    }
});
```

---

### fileViewer - 文件查看器

文件查看器是功能最完整的独立应用之一，支持 PDF、文本、视频、Office 文件预览。

#### 入口文件

```javascript
// src/renderer/fileViewer/main.js
import Vue from 'vue';
import i18n from '@/lang';
import NProgress from 'nprogress';
import App from './App.vue';
import router from './router';
import store from './store';

NProgress.configure({
    showSpinner: false,
    minimum: 0.15,
    trickleSpeed: 50,
    parent: '#body-viewer'
});

new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
}).$mount('#app');
```

关键特点：
- 拥有独立的 Vue Router（`fileViewer/router.js`）
- 拥有独立的 Vuex Store（`fileViewer/store/`，含 `txtViewer`、`videoViewer` 模块）
- 集成 NProgress 进度条
- 注册全局 `Scrollbar` 和 `SvgIcon` 组件

#### 文件查看器类型

| 组件 | 支持格式 | 路径 |
|------|----------|------|
| `PdfViewer` | PDF | `fileViewer/PdfViewer/` |
| `TxtViewer` | 文本文件（多编码检测） | `fileViewer/TxtViewer/` |
| `VideoViewer` | 视频文件 | `fileViewer/VideoViewer/` |
| `OfficeViewer` | Word/Excel/PPT（DPS 转换） | `fileViewer/OfficeViewer/` |
| `NotSupported` | 不支持的格式 | `fileViewer/NotSupported/` |

#### 密码保护文件

`PasswordDialog` 组件（`fileViewer/PasswordDialog/`）处理加密文件的密码输入。

---

### shortcut - 快捷键设置

#### 入口文件

```javascript
// src/renderer/shortcut/index.js
import Vue from 'vue';
import i18n from '@/lang';
import App from './App';

import SvgIcon from '@/components/common/SvgIcon/index.vue';
import { Input } from 'element-ui';

Vue.component('SvgIcon', SvgIcon);
Vue.use(Input);

new Vue({
    i18n,
    render: h => h(App)
}).$mount('#app');
```

快捷键设置窗口为轻量级独立应用，仅注册 SvgIcon 组件和 Element UI Input 组件，不需要独立 Store 和 Router。

---

### update - 更新管理

```javascript
// src/renderer/update/index.js
import Vue from 'vue';
import i18n from '@/lang';
import App from './App';
import store from './store';
import SvgIcon from '@/components/common/SvgIcon/index.vue';

Vue.component('SvgIcon', SvgIcon);

new Vue({
    store,
    i18n,
    render: h => h(App)
}).$mount('#app');
```

更新管理拥有独立 Store，用于管理下载进度、版本信息等更新状态。

---

### start - SDK 启动进程

```javascript
// src/renderer/start/main.js
const log = require('@/logs/renderSdkLog.js');
try {
    const { initSdk } = require('./bridge/loadSdk');
    initSdk();
    log.info(`[loadSdk processpid]=>`, process.pid);
} catch (e) {
    log.info('initSdkerror render=>', `${e.stack}: ${e?.message}`);
}
```

start 是一个特殊的独立进程，不包含 Vue 实例。它以隐藏窗口运行，专门用于初始化会议 SDK（Crystal SDK），通过 `bridge/loadSdk` 加载 native SDK 模块。

---

### combineChat - 合并聊天记录查看

```javascript
// src/renderer/combineChat/main.js
import '@/config/MatrxMessage';
import Vue from 'vue';
import i18n from '@/lang';
import App from './App';
import store from '@/store';           // 共享主应用 Store
import './preload.js';

Vue.component('RenderName', RenderName);
Vue.component('SvgIcon', SvgIcon);
Vue.component('Tooltip', Tooltip);
Vue.use(infiniteScroll);

new Vue({
    i18n,
    store,                             // 注入主应用 Store
    render: h => h(App)
}).$mount('#app');
```

合并聊天记录查看器的特殊之处在于它直接引用主应用的 Vuex Store（`@/store`），而非创建独立 Store。

## 应用间通信

### 通信架构

独立渲染应用与主窗口之间通过以下机制通信：

```
独立渲染应用                 主进程                    主窗口渲染进程
    │                         │                           │
    ├── ipcRenderer.send ──►  │ ──► ipcRenderer.on ──────►│
    │                         │                           │
    ◄── ipcRenderer.on ◄──── │ ◄── ipcRenderer.send ◄────│
    │                         │                           │
    ├── ipcRenderer.invoke ──►│ ──► handle ──────────────►│
    │                         │                           │
    ◄── ipcRenderer.sendTo ◄─│ ──► sendTo(webContentsId)─│
```

### 数据查询代理模式

独立窗口无法直接访问主窗口的数据库和 Store，通过 IPC 代理实现：

```javascript
// 独立窗口发送查询请求
ipcRenderer.send('GET_CURRENT_WIN_DATA', {
    type: 'peerApi.findPeerIn',
    data: { /* 查询参数 */ }
});

// 主窗口 initVue.js 处理查询
ipcRenderer.on('GET_CURRENT_WIN_DATA', async (e, data) => {
    let res = null;
    switch (data.type) {
        case 'peerApi.findPeerIn':
            res = await findPeerIn(data.data);
            break;
    }
    ipcRenderer.send('GET_CURRENT_WIN_DATA_RES', res);
});
```

### 主窗口接收独立应用命令

通过 `sendTo-main-win` 频道，独立应用可以向主窗口发送命令：

| 命令 | 来源 | 功能 |
|------|------|------|
| `download-newUpdateVersion` | update | 新版本下载完成通知 |
| `restart-newUpdateVersion` | update | 触发应用重启更新 |
| `open-picture-viewer-uuid` | combineChat | 通过 UUID 打开图片查看 |
| `clear-chat-history-message` | combineChat | 清除聊天历史 |
| `picture-editor-done` | pictureEditor | 图片编辑完成回调 |
| `forward-file` | fileViewer | 文件转发 |
| `devices-getOnlineLoggedDevices` | devicesManagement | 获取在线设备列表 |
| `devices-devicesLogout` | devicesManagement | 远程登出设备 |
| `update-shortcut` | shortcut | 快捷键更新通知 |

### appdataStorage 远程访问

部分独立窗口（如 combineChat）通过 IPC 同步调用访问 appdataStorage：

```javascript
// combineChat/preload.js
window.appdataStorage = {
    getItem: key => ipcRenderer.sendSync('get-appdataStorage', { key }),
    setItem: (key, value) => ipcRenderer.send('set-appdataStorage', { key, value })
};
```

## 独立应用入口模式

### 完整 Vue 应用模式（main.js）

适用于功能复杂的独立应用，包含完整的 Vue 生态：

```javascript
import Vue from 'vue';
import App from './App.vue';
import store from './store';
import router from './router';
import i18n from '@/lang';

new Vue({ store, router, i18n, render: h => h(App) }).$mount('#app');
```

代表应用：fileViewer（完整 Store + Router）、screenshot（独立 Store）

### 轻量 Vue 应用模式（index.js）

适用于简单功能窗口，仅包含 Vue 实例和国际化：

```javascript
import Vue from 'vue';
import App from './App';
import i18n from '@/lang';

new Vue({ i18n, render: h => h(App) }).$mount('#app');
```

代表应用：shortcut、toast、helpCenter、e2eeCode

### 非 Vue 进程模式

适用于无界面的后台进程：

```javascript
const { initSdk } = require('./bridge/loadSdk');
initSdk();
```

代表应用：start（SDK 初始化进程）

## 共享依赖

所有独立应用共享以下基础依赖：

| 依赖 | 用途 |
|------|------|
| `@/lang` (i18n) | 国际化语言包 |
| `@/styles/variables.css` | CSS 自定义属性 |
| `@/styles/style.scss` | 全局基础样式 |
| `@/styles/theme-chalk/index.scss` | Element UI 主题定制 |
| `@/components/common/SvgIcon` | SVG 图标组件 |
| `@/config/element.config.js` | Element UI 按需引入配置 |
