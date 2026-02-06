# 渲染进程架构详解

## 1. 主渲染进程 (src/main.js)

### 1.1 入口文件结构

```javascript
// src/main.js 完整结构
+------------------------------------------------------------------+
| 1. 预加载脚本                                                      |
|    import './preload.js'                                          |
+------------------------------------------------------------------+
| 2. Vue核心导入                                                     |
|    - Vue, i18n, App, router, store                               |
+------------------------------------------------------------------+
| 3. 样式导入                                                        |
|    - variables.css, style.scss, theme-chalk                       |
+------------------------------------------------------------------+
| 4. 插件和工具导入                                                   |
|    - Element UI, vue-virtual-scroller, 自定义指令                 |
+------------------------------------------------------------------+
| 5. 全局错误处理                                                     |
|    - window.addEventListener('error')                             |
|    - process.on('uncaughtException')                              |
+------------------------------------------------------------------+
| 6. 启动函数                                                        |
|    - run() -> startVue()                                          |
+------------------------------------------------------------------+
```

### 1.2 启动流程详解

```
+------------------------------------------------------------------+
|                        启动序列图                                   |
+------------------------------------------------------------------+

run() 函数
    |
    ├── renderInitAppdata(store)      # 初始化AppData存储
    |       |
    |       └── 建立主进程-渲染进程数据同步
    |
    ├── initAppdataStorage(store)     # 初始化AppData存储API
    |       |
    |       └── window.appdataStorage = ...
    |
    ├── 读取登录状态
    |       |
    |       └── appdataStorage.getItem('loginStatus')
    |
    ├── store.dispatch('userInfo/updateUserData')  # 初始化用户信息
    |
    ├── store.dispatch('emojiReply/emojiInit')     # 初始化表情
    |
    └── 如果已登录 -> 设置当前空间
            |
            └── store.commit('spaceCollection/SET_CURRENT_SPACE')
                    |
                    ↓
+------------------------------------------------------------------+
startVue() 函数
    |
    ├── document.title = 'Matrx'
    |
    ├── Vue.config.productionTip = false
    |
    ├── Vue.config.errorHandler = (err, vm, info) => {...}
    |
    ├── 注册全局组件
    |   ├── RecycleScroller, DynamicScroller
    |   ├── Scrollbar, Tooltip, RenderName
    |   └── SvgIcon, EmptyIcon
    |
    ├── Vue.use() 插件注册
    |   ├── Alert (自定义)
    |   ├── contextmenu
    |   ├── infiniteScroll
    |   └── mainClient
    |
    ├── Vue.directive('loading', LoadingDirective)
    |
    ├── 私有化部署: startVerifyConfig()
    |
    └── new Vue({i18n, router, store, render: h => h(App)}).$mount('#app')
            |
            ↓
+------------------------------------------------------------------+
后续初始化
    |
    ├── CstSdkIpcListeners()          # SDK IPC监听
    |
    ├── initUserInfo()                # 获取设备信息
    |
    ├── store.dispatch('userInfo/updateUserData')  # 更新wdid, clientver
    |
    └── openDevLog()                  # 开启开发日志
```

### 1.3 全局错误处理

```javascript
// 全局DOM错误捕获
window.addEventListener('error', error => {
    console.error('[error]: ', 'onerror', error);
    devLog.error('error onerror=>', error, error.message, error.filename);
    reportErrorLogCommon({
        error: error,
        filename: error.filename
    });
});

// Node.js进程级错误
process.on('uncaughtException', e => {
    console.error('[error]: ', 'uncaughtException', e);
    devLog.info('main uncaughtException render', e);
    reportErrorLogCommon({ error: e });
});

process.on('unhandledRejection', e => {
    console.error('[error]: ', 'unhandledRejection', e);
    devLog.info('main unhandledRejection render', e);
    reportErrorLogCommon({ error: e });
});

// Vue错误处理
Vue.config.errorHandler = function (err, vm, info) {
    console.error('[error]: ', 'VueerrorHandler=>', err);
    devLog.error('VueerrorHandler=>', `Error: ${err.message}`);
    reportErrorLogCommon({
        error: err,
        info,
        vmName: vm.$vnode?.componentOptions?.tag
    });

    // 磁盘空间不足特殊处理
    if (err?.message?.includes('no space left on device')) {
        electronToast({
            msg: i18n.t('errorCode.error_space_noleft'),
            duration: 10000
        });
    }
};
```

## 2. 28个独立渲染应用清单

### 2.1 完整应用列表

```
src/renderer/
├── start/                    # SDK进程 (最重要)
│   ├── main.js              # 入口
│   └── bridge/              # SDK桥接层
│       ├── bridge.js        # 主桥接
│       ├── bridge_e2ee.js   # E2EE加密
│       ├── bridge_db.js     # 数据库操作
│       ├── bridge_util.js   # 工具函数
│       ├── bridge_ikey.js   # 密钥管理
│       ├── loadSdk.js       # SDK加载
│       ├── loadChild.js     # 子进程加载
│       ├── sendTo.js        # 消息发送
│       ├── hashFile.js      # 文件哈希
│       └── serviceCallback.js # 回调处理
│
├── screenshot/               # 截图功能
│   ├── main.js
│   ├── preload.js
│   ├── store/
│   └── components/
│       └── Screenshots/     # 截图编辑组件
│
├── pictureViewer/           # 图片查看器
│   ├── main.js
│   └── onPictureViewer.js
│
├── fileViewer/              # 文件查看器
│   ├── main.js
│   ├── router.js
│   ├── store/
│   └── TxtViewer/
│
├── meetingInfo/             # 会议信息页
│   ├── main.js
│   └── App.vue
│
├── meetingInvite/           # 会议邀请
│   ├── main.js
│   └── element.config.js
│
├── meetingPwd/              # 会议密码
│   └── index.js
│
├── meetingWhiteboardShare/  # 白板分享
│   ├── main.js
│   └── element.config.js
│
├── callfeedback/            # 通话反馈
│   ├── main.js
│   ├── preload.js
│   └── constants.js
│
├── deleteAccountFeedback/   # 删除账号反馈
│   ├── main.js
│   └── utils.js
│
├── e2eeCode/                # E2EE验证码
│   ├── index.js
│   └── Index.vue
│
├── dialogWin/               # 自定义对话框
│   └── main.js
│
├── sso/                     # SSO登录
│   └── index.js
│
├── aiModel/                 # AI模型交互
│   ├── main.js
│   ├── preload.js
│   ├── element.config.js
│   └── components/
│       └── aiModelMain/
│
├── combineChat/             # 合并聊天
│   ├── main.js
│   ├── preload.js
│   ├── App.vue
│   └── ChatBox.vue
│
├── mapWin/                  # 地图窗口
│   └── index.js
│
├── storageData/             # 存储数据管理
│   ├── index.js
│   └── Management.vue
│
├── profilePhoto/            # 头像编辑
│   ├── index.js
│   └── components.config.js
│
├── pictureEditor/           # 图片编辑器
│   ├── index.js
│   └── components.config.js
│
├── devicesManagement/       # 设备管理
│   ├── index.js
│   └── components.config.js
│
├── update/                  # 更新窗口
│   ├── index.js
│   └── store/
│
├── shortcut/                # 快捷键设置
│   ├── index.js
│   └── components.config.js
│
├── helpCenter/              # 帮助中心
│   └── index.js
│
├── newGuide/                # 新手引导
│   └── index.js
│
├── robotPage/               # 机器人页面
│   └── index.js
│
└── toast/                   # Toast提示
    └── index.js
```

### 2.2 应用用途详解

| 应用 | 类型 | 用途说明 |
|------|------|----------|
| start | 后台进程 | SDK桥接，E2EE加密/解密，数据库密钥生成 |
| screenshot | 功能窗口 | 屏幕截图和编辑 |
| pictureViewer | 功能窗口 | 图片预览、缩放、旋转 |
| fileViewer | 功能窗口 | 文件预览(文本、视频、Office) |
| meetingInfo | 功能窗口 | 会议详情展示 |
| meetingInvite | 功能窗口 | 会议邀请弹窗 |
| meetingPwd | 功能窗口 | 会议密码输入 |
| meetingWhiteboardShare | 功能窗口 | 会议白板分享 |
| callfeedback | 功能窗口 | 通话质量反馈 |
| deleteAccountFeedback | 功能窗口 | 账号删除原因反馈 |
| e2eeCode | 功能窗口 | E2EE验证码展示 |
| dialogWin | 功能窗口 | 自定义确认对话框 |
| sso | 功能窗口 | SSO单点登录页面 |
| aiModel | 功能窗口 | AI助手交互界面 |
| combineChat | 功能窗口 | 合并转发聊天记录查看 |
| mapWin | 功能窗口 | 位置地图展示 |
| storageData | 功能窗口 | 本地存储数据管理 |
| profilePhoto | 功能窗口 | 头像裁剪编辑 |
| pictureEditor | 功能窗口 | 图片编辑器 |
| devicesManagement | 功能窗口 | 登录设备管理 |
| update | 功能窗口 | 应用更新提示 |
| shortcut | 功能窗口 | 快捷键设置 |
| helpCenter | 功能窗口 | 帮助文档 |
| newGuide | 功能窗口 | 新手引导 |
| robotPage | 功能窗口 | 机器人富文本 |
| toast | UI组件 | Toast通知提示 |

## 3. Vue 应用初始化流程

### 3.1 初始化时序图

```
+------------------------------------------------------------------+
|  浏览器窗口加载                                                     |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
|  preload.js 执行                                                  |
|  - 暴露Electron API到window                                       |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
|  main.js 模块加载                                                  |
|  - 同步导入所有依赖                                                 |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
|  run() 异步执行                                                    |
|  ├── renderInitAppdata()    建立数据同步                           |
|  ├── 初始化appdataStorage                                         |
|  ├── 读取并设置用户登录状态                                         |
|  └── 检查磁盘空间                                                   |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
|  startVue() 同步执行                                               |
|  ├── 配置Vue全局设置                                               |
|  ├── 注册全局组件                                                   |
|  ├── 注册全局指令                                                   |
|  ├── 注册Vue插件                                                   |
|  └── new Vue().$mount('#app')                                    |
+------------------------------------------------------------------+
        |
        v
+------------------------------------------------------------------+
|  Vue实例挂载后                                                     |
|  ├── CstSdkIpcListeners()   监听SDK IPC                          |
|  ├── initUserInfo()         获取设备信息                           |
|  └── openDevLog()           开启日志                               |
+------------------------------------------------------------------+
```

### 3.2 全局组件注册

```javascript
// 虚拟滚动组件
Vue.component('RecycleScroller', RecycleScroller);
Vue.component('DynamicScroller', DynamicScroller);
Vue.component('DynamicScrollerItem', DynamicScrollerItem);

// 基础UI组件
Vue.component('Scrollbar', Scrollbar);
Vue.component('Tooltip', Tooltip);
Vue.component('RenderName', RenderName);

// SVG图标
Vue.component('SvgIcon', SvgIcon);
Vue.component('EmptyIcon', EmptyIcon);
```

### 3.3 插件注册

```javascript
Vue.use(Alert);           // 自定义弹窗
Vue.use(contextmenu);     // 右键菜单
Vue.use(infiniteScroll);  // 无限滚动
Vue.use(mainClient);      // 主客户端工具

Vue.directive('loading', LoadingDirective);  // 加载指令
```

## 4. 路由配置与守卫

### 4.1 路由配置 (src/router.js)

```javascript
const routes = [
    {
        path: '/',
        name: 'Welcome',
        component: Welcome      // 欢迎/登录页
    },
    {
        path: '/emiallogin',
        name: 'EmailLogin',
        component: Welcome      // 邮箱登录
    },
    {
        path: '/message',
        name: 'Message',
        component: () => import('@/views/Main.vue')  // 主界面(懒加载)
    },
    {
        path: '*',
        redirect: '/'           // 404重定向
    }
];

const router = new Router({
    mode: 'hash',              // Hash模式(Electron推荐)
    routes
});
```

### 4.2 路由守卫

```javascript
const directRouteNameList = ['Message'];  // 允许直接访问的路由

router.beforeEach((to, from, next) => {
    // 读取登录状态
    let loginstatus = appdataStorage.getItem('loginStatus');
    let keepLogin = appdataStorage.getItem('keepLogin');

    devLog.log('router.beforeEach', from.name, to.name);
    devLog.log('router.loginstatus', loginstatus);

    if (loginstatus == 'LOGINFINISH') {
        // 已登录
        store.dispatch('theme/initTheme');  // 初始化主题

        if (directRouteNameList.includes(to.name)) {
            next();  // 允许访问
        } else {
            next({ name: 'Message' });  // 跳转到主界面
        }
    } else {
        // 未登录
        store.dispatch('theme/clearTheme');

        if (to.name == 'Message') {
            next({ name: 'EmailLogin' });  // 跳转到登录页
        } else {
            next();  // 允许访问登录页
        }
    }
});
```

### 4.3 路由流程图

```
+------------------------------------------------------------------+
|                         路由导航流程                               |
+------------------------------------------------------------------+

用户访问 → beforeEach守卫
              |
              ├── 检查 loginStatus
              |       |
              |       ├── LOGINFINISH (已登录)
              |       |       |
              |       |       ├── 目标是 Message → 允许
              |       |       └── 目标是其他 → 重定向到 Message
              |       |
              |       └── 未登录
              |               |
              |               ├── 目标是 Message → 重定向到 EmailLogin
              |               └── 目标是其他 → 允许(登录页)
              |
              └── next() → 渲染目标组件
```

## 5. 组件加载策略

### 5.1 同步加载 vs 异步加载

```javascript
// 同步加载(启动时必需)
import Welcome from '@/views/Welcome';

// 异步加载(懒加载，按需加载)
component: () => import('@/views/Main.vue')
```

### 5.2 组件目录结构

```
src/components/
├── Chat/                     # 聊天相关组件
│   ├── ChatWarp.vue          # 聊天消息容器
│   ├── MessageTxtChat.vue    # 文本消息
│   ├── PictureChat.vue       # 图片消息
│   ├── DocumentChat.vue      # 文档消息
│   ├── VoiceChat/            # 语音消息
│   ├── VideoMeetingDialog.vue # 视频会议
│   ├── E2EVerifyCode.vue     # E2EE验证
│   └── ...
│
├── Panel/                    # 面板组件
│   ├── ChatsPanel.vue        # 会话列表面板
│   ├── ContactsPanel.vue     # 联系人面板
│   ├── MeetingsPanel.vue     # 会议面板
│   ├── CalendarPanel.vue     # 日历面板
│   ├── ApprovalPanel.vue     # 审批面板
│   └── AppsPanel.vue         # 应用面板
│
├── Meeting/                  # 会议组件
│   ├── MeetingSchedule.vue   # 会议安排
│   └── SchedulePanel.vue     # 日程面板
│
├── Settings/                 # 设置组件
│   ├── PersonSettings.vue    # 个人设置
│   ├── GroupManagement.vue   # 群管理
│   └── ...
│
├── Calendar/                 # 日历组件
│   ├── CalendarViewer.vue
│   ├── CalendarViewerWeek/
│   └── CalendarViewerMonth/
│
├── Approval/                 # 审批组件
│   ├── ApprovalCreate.vue
│   ├── ApprovalDetail.vue
│   └── ...
│
├── common/                   # 通用组件
│   ├── SvgIcon/
│   ├── EmptyIcon.vue
│   ├── LoadingDirective.js
│   └── DialogCheckList/
│
├── Layout/                   # 布局组件
│   └── TopMenu/
│       ├── SpaceDropDown.vue
│       └── QuickAccessPannel.vue
│
├── EmojisPannel/             # 表情面板
├── MultiSpace/               # 多空间
├── SearchBar/                # 搜索栏
├── MessageInput/             # 消息输入
├── GroupPin/                 # 群置顶
├── Map/                      # 地图
└── ...
```

## 6. Vuex 模块概览

### 6.1 模块自动加载

```javascript
// src/store/modules/index.js
const files = require.context('.', false, /\.js$/);
const modules = {};

files.keys().forEach(key => {
    if (key === './index.js') return;
    modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default;
});

export default modules;
```

### 6.2 模块清单 (30个)

| 模块名 | 文件大小 | 主要功能 |
|--------|----------|----------|
| userInfo | 11.8KB | 用户信息、登录状态 |
| spaceCollection | 11.0KB | 空间列表、当前空间 |
| sessionCollection | 10.2KB | 会话列表管理 |
| peerCollection | 15.4KB | 联系人/群组信息 |
| messageCollection | 6.1KB | 消息集合 |
| dialogList | 5.7KB | 对话框列表 |
| concat | 27.8KB | 联系人相关 |
| setting | 6.6KB | 用户设置 |
| spaceLimit | 13.6KB | 空间功能限制 |
| uiControl | 24.2KB | UI状态控制 |
| fileCollection | 3.8KB | 文件集合 |
| fileProcessCollection | 2.1KB | 文件处理进度 |
| fileCancelCollection | 0.8KB | 文件取消 |
| fileWorking | 0.6KB | 文件工作状态 |
| forwardCollection | 1.3KB | 转发集合 |
| searchCollection | 1.1KB | 搜索结果 |
| suggestionList | 1.2KB | 建议列表 |
| emojiReply | 2.3KB | 表情回复 |
| approval | 1.7KB | 审批相关 |
| theme | 1.9KB | 主题设置 |
| chatTyping | 0.4KB | 输入状态 |
| meetingCollection | 0.2KB | 会议集合 |
| customerInfo | 2.6KB | 客户信息 |
| appdata | 2.5KB | 应用数据 |
| config | 0.8KB | 配置信息 |
| storage | 0.7KB | 存储相关 |
| updater | 0.7KB | 更新状态 |

### 6.3 核心模块结构示例

```javascript
// src/store/modules/spaceCollection.js
const state = {
    spaceInfoList: [],        // 空间列表
    currentSpaceId: '',       // 当前空间ID
    showRemoveSpaceAlert: false,
    isTrayCurrentSpace: false,
    isTrayMultiSpace: false,
    isWinFocus: false,
    currentIdObj: {},         // 当前空间未读ID
    currentSDK: 'crystal',
    isCrystalSdk: true,
    spacePayment: {},
    spaceData: {},
    spaceWorkplace: {},
    languageList: [],
    urlWhiteList: [],
    sortSpaceList: []
};

const mutations = {
    RESET_SPACE_LIST(state, payload) { ... },
    SET_CURRENT_SPACE(state, payload) { ... },
    SET_REMOVE_SPACE_ALERT(state, payload) { ... },
    // ...
};

const actions = {
    initSpaceList({commit, state}, payload) { ... },
    addSpace({commit, state}, payload) { ... },
    delSpace({commit, state}, payload) { ... },
    setCurrentSDK({commit}, {spaceId, currentSDK}) { ... },
    // ...
};

const getters = {
    currentSpaceId: state => state.currentSpaceId,
    getSpaceInfo: state => spaceId => { ... },
    getCurrentSpaceType(state, getters) { ... },
    // ...
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
```

### 6.4 模块依赖关系

```
                    +------------------+
                    |    userInfo      |
                    | (用户身份基础)    |
                    +--------+---------+
                             |
        +--------------------+--------------------+
        |                    |                    |
        v                    v                    v
+-------+-------+   +--------+--------+   +------+-------+
| spaceCollection|   | peerCollection |   | setting      |
| (空间管理)      |   | (联系人管理)    |   | (用户设置)    |
+-------+-------+   +--------+--------+   +------+-------+
        |                    |                    |
        +--------------------+--------------------+
                             |
                             v
                    +--------+--------+
                    | sessionCollection|
                    | (会话管理)        |
                    +--------+--------+
                             |
                             v
                    +--------+--------+
                    | messageCollection|
                    | (消息管理)        |
                    +-----------------+
```
