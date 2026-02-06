# 新人入门指南

欢迎加入 Matrx Windows 项目开发团队！本文档将帮助你快速上手项目开发。

---

## 目录

- [前置知识要求](#前置知识要求)
- [项目概览](#项目概览)
- [第一天：环境搭建](#第一天环境搭建)
- [第二天：理解架构](#第二天理解架构)
- [第三天：运行和调试](#第三天运行和调试)
- [第四天：代码结构](#第四天代码结构)
- [第五天：开始开发](#第五天开始开发)
- [常见问题](#常见问题)
- [学习资源](#学习资源)

---

## 前置知识要求

### 必须掌握

| 技术 | 程度 | 学习资源 |
|------|------|----------|
| JavaScript (ES6+) | 熟练 | [MDN JavaScript](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript) |
| Vue.js 2.x | 熟练 | [Vue 2 官方文档](https://v2.cn.vuejs.org/) |
| Node.js | 了解 | [Node.js 官方文档](https://nodejs.org/zh-cn/docs/) |
| HTML/CSS | 熟练 | - |
| Git | 熟练 | [Git 教程](https://www.runoob.com/git/git-tutorial.html) |

### 建议了解

| 技术 | 说明 |
|------|------|
| Electron | 桌面应用框架，项目核心 |
| Vuex | Vue 状态管理 |
| SQLite | 本地数据库 |
| WebSocket | 实时通信 |
| SCSS | CSS 预处理器 |

---

## 项目概览

### 这是什么项目？

Matrx 是一个企业级桌面即时通讯应用，类似于企业版微信/钉钉，主要功能包括：

- 即时消息（文本、图片、文件、语音）
- 音视频会议
- 联系人和群组管理
- 日历和审批
- 文件管理

### 技术栈速览

```
┌────────────────────────────────────────────────────┐
│                   Matrx Windows                     │
├────────────────────────────────────────────────────┤
│  前端框架    │  Vue 2.6 + Vuex + Vue Router        │
│  桌面框架    │  Electron 20                         │
│  UI 组件库   │  Element UI                          │
│  数据库      │  SQLCipher (加密 SQLite)             │
│  网络通信    │  Axios + Socket.io                   │
│  构建工具    │  Vue CLI + electron-builder          │
└────────────────────────────────────────────────────┘
```

### 项目规模

- **代码行数**: 30万+ 行
- **JavaScript 文件**: 734 个
- **Vue 组件**: 402 个
- **多窗口应用**: 26+ 个独立窗口

---

## 第一天：环境搭建

### 1. 安装必要软件

```bash
# 安装 Node.js 16 (使用 nvm)
nvm install 16
nvm use 16

# 验证版本
node -v  # 应显示 v16.x.x
npm -v   # 应显示 8.x.x
```

### 2. 克隆项目

```bash
git clone --recurse-submodules git@github.com:luuman/matrx-windows.git
cd matrx-windows
```

### 3. 安装依赖

```bash
# 安装依赖（可能需要 --force）
npm install --force

# 如果遇到原生模块错误
npm run changeV8
npm install --force
```

### 4. 启动项目

```bash
# 启动开发模式
npm run dev
```

如果一切顺利，你应该能看到应用启动的登录界面。

### 常见安装问题

| 问题 | 解决方案 |
|------|----------|
| node-gyp 错误 | 安装 Visual Studio Build Tools |
| Electron 下载失败 | 设置镜像：`npm config set electron_mirror "https://npmmirror.com/mirrors/electron/"` |
| 依赖冲突 | 使用 `npm install --force` |

详细排错请参考 [环境搭建指南](./setup.md)。

---

## 第二天：理解架构

### Electron 基础概念

Electron 应用由两种进程组成：

```
┌─────────────────────────────────────────────────────────┐
│                      Electron 应用                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────┐    IPC     ┌─────────────────┐   │
│  │    主进程 (Main)   │ ◄──────► │  渲染进程 (Renderer)│   │
│  │  - 窗口管理        │           │  - Vue 应用       │   │
│  │  - 系统 API       │           │  - 用户界面       │   │
│  │  - 文件操作        │           │  - 前端逻辑       │   │
│  │  - 数据库         │           │                   │   │
│  └───────────────────┘           └─────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 重要文件位置

```
src/
├── background.js       # 主进程入口 ⭐ 从这里开始理解主进程
├── main.js             # 渲染进程入口 ⭐ 从这里开始理解前端
├── preload.js          # 预加载脚本（连接主进程和渲染进程）
├── App.vue             # Vue 根组件
├── router.js           # 路由配置
│
├── main/               # 主进程代码
│   ├── mainWindow/     # 主窗口管理
│   ├── store.js        # electron-store 数据存储
│   └── IPCMainChannel.js # IPC 主进程监听
│
├── views/              # 页面视图
│   ├── Welcome.vue     # 登录入口页
│   └── Main.vue        # 主界面
│
├── components/         # Vue 组件库
├── store/              # Vuex 状态管理
├── api/                # API 请求
└── utils/              # 工具函数
```

### 推荐阅读顺序

1. `src/background.js` - 理解应用启动流程
2. `src/main.js` - 理解 Vue 应用初始化
3. `src/App.vue` - 理解根组件结构
4. `src/views/Main.vue` - 理解主界面布局
5. `src/store/index.js` - 理解状态管理

---

## 第三天：运行和调试

### 开发模式

```bash
# 标准开发模式
npm run dev

# 仅启动 Vue（不启动 Electron）
npm run serve
```

### 调试工具

1. **Vue DevTools**: 在渲染进程中调试 Vue 组件和 Vuex
2. **Chrome DevTools**: 按 `Ctrl+Shift+I` 打开开发者工具
3. **主进程调试**: 查看终端输出或使用 VS Code 调试

### 日志查看

```
日志文件位置（Windows）:
C:\Users\{用户名}\AppData\Roaming\{app-name}\logs\

重要日志:
├── dev.log           # 开发日志
├── message.log       # 消息日志
├── meeting.log       # 会议日志
└── error.log         # 错误日志
```

### 常用调试技巧

```javascript
// 在代码中添加日志
import devLog from '@/logs/devLog';

devLog.info('调试信息', { data: someData });
devLog.error('错误信息', error);

// 或使用 console（开发环境）
console.log('调试数据:', data);
```

---

## 第四天：代码结构

### 目录结构详解

```
src/
├── api/                # API 请求层
│   ├── messageApi.js   # 消息 API
│   ├── contactApi.js   # 联系人 API
│   ├── meetingApi.js   # 会议 API
│   └── axiosInstance.js # HTTP 实例配置
│
├── components/         # Vue 组件
│   ├── Chat/           # 聊天相关组件
│   ├── Contact/        # 联系人组件
│   ├── Meeting/        # 会议组件
│   ├── MessageInput/   # 消息输入组件
│   └── common/         # 通用组件
│
├── store/              # Vuex 状态管理
│   └── modules/
│       ├── concat.js   # 主状态（联系人、登录等）
│       ├── uiControl.js # UI 控制状态
│       ├── sessionCollection.js # 会话列表
│       └── messageCollection.js # 消息列表
│
├── utils/              # 工具函数
│   ├── Function.js     # 核心函数库
│   ├── dataUtil.js     # 数据处理工具
│   ├── FileTool.js     # 文件处理工具
│   └── ipc/            # IPC 通信工具
│
├── sql/                # 数据库
│   └── init/           # 数据库初始化脚本
│
├── logs/               # 日志系统
│
└── lang/               # 国际化
    └── locales/
        ├── en/         # 英文
        └── ar/         # 阿拉伯语
```

### 代码风格

项目使用 ESLint + Prettier 进行代码检查和格式化：

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `MessageItem.vue` |
| JS 文件 | camelCase | `dataUtil.js` |
| CSS 类名 | kebab-case | `.message-item` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 变量/函数 | camelCase | `getUserInfo()` |

---

## 第五天：开始开发

### 开发一个简单功能的流程

假设要添加一个显示用户在线状态的功能：

#### 1. 添加 API 请求

```javascript
// src/api/userApi.js
export function getUserStatus(userId) {
  return axios.get(`/users/${userId}/status`);
}
```

#### 2. 添加 Vuex 状态

```javascript
// src/store/modules/userInfo.js
const state = {
  onlineStatus: 'offline'
};

const mutations = {
  SET_ONLINE_STATUS(state, status) {
    state.onlineStatus = status;
  }
};

const actions = {
  async fetchStatus({ commit }, userId) {
    const { data } = await getUserStatus(userId);
    commit('SET_ONLINE_STATUS', data.status);
  }
};
```

#### 3. 创建/修改组件

```vue
<!-- src/components/common/UserStatus.vue -->
<template>
  <span :class="['status-dot', status]"></span>
</template>

<script>
export default {
  name: 'UserStatus',
  props: {
    status: {
      type: String,
      default: 'offline'
    }
  }
}
</script>

<style scoped>
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.online { background: #52c41a; }
.status-dot.offline { background: #d9d9d9; }
</style>
```

#### 4. 在页面中使用

```vue
<template>
  <div>
    <UserStatus :status="userStatus" />
    <span>{{ userName }}</span>
  </div>
</template>

<script>
import UserStatus from '@/components/common/UserStatus.vue';
import { mapState } from 'vuex';

export default {
  components: { UserStatus },
  computed: {
    ...mapState('userInfo', ['onlineStatus'])
  }
}
</script>
```

### Git 提交规范

```bash
# 提交格式
<type>(<scope>): <subject>

# 示例
feat(chat): add message retry function
fix(meeting): fix audio mute issue
docs(readme): update installation guide
style(components): format code with prettier
refactor(api): simplify request logic
```

---

## 常见问题

### Q: 如何查看某个功能的代码？

使用 VS Code 的全局搜索 (`Ctrl+Shift+F`)：
- 搜索中文文案找到对应组件
- 搜索 API 路径找到请求代码
- 搜索组件名找到使用位置

### Q: 主进程和渲染进程如何通信？

使用 IPC (Inter-Process Communication)：

```javascript
// 渲染进程发送
import { ipcInvoke, ipcSend } from '@/utils/ipc/ipcSend';
const result = await ipcInvoke('getStore', 'key');
ipcSend('showNotification', { title: 'Hi' });

// 主进程监听 (IPCMainChannel.js)
ipcMain.handle('getStore', (event, key) => {
  return store.get(key);
});
```

### Q: 如何添加新页面？

1. 在 `src/views/` 创建 Vue 文件
2. 在 `src/router.js` 添加路由配置
3. 如果是新窗口，需要在 `vue.config.js` 的 `pages` 中配置

### Q: 如何调试数据库？

使用 SQLite 客户端工具（如 DB Browser for SQLite）打开数据库文件：
```
位置: C:\Users\{用户}\AppData\Roaming\{app}\{userId}\{spaceId}\
```
注意：数据库使用 SQLCipher 加密，需要密钥才能打开。

---

## 学习资源

### 官方文档

- [Vue.js 2.x 文档](https://v2.cn.vuejs.org/)
- [Vuex 文档](https://vuex.vuejs.org/zh/)
- [Electron 文档](https://www.electronjs.org/zh/docs/latest/)
- [Element UI 文档](https://element.eleme.cn/#/zh-CN)

### 项目内部文档

- [项目整体架构](../architecture/overview.md)
- [主进程架构](../architecture/main-process.md)
- [IPC 通信机制](../architecture/ipc-communication.md)
- [API 参考](../api/utils-api.md)
- [数据库架构](../database/database-architecture.md)

### 推荐学习路径

1. **第一周**: 熟悉项目结构，能够运行和调试
2. **第二周**: 理解 Electron 架构和 IPC 通信
3. **第三周**: 熟悉核心模块（消息、会话、联系人）
4. **第四周**: 开始独立开发小功能
5. **之后**: 深入特定领域（会议 SDK、文件处理等）

---

## 需要帮助？

- 查看 [调试与排错指南](./debugging.md)
- 查看 [日志排查手册](./log-troubleshooting-guide.md)
- 询问团队成员

**最后更新**: 2026-02-05
