主进程的加载顺序可以分为以下几个阶段，我来详细梳理每个阶段加载的模块和功能：

## 1\. 应用预初始化阶段 (appPre.js)[](#1-应用预初始化阶段-appprejs)

**核心功能：**

- **路径配置与数据迁移**：检查并迁移旧版本数据路径，确保用户数据连续性
- **安全检查**：禁用调试模式，防止生产环境调试
- **权限验证**：检查应用数据目录权限，确保可正常读写
- **命令行参数配置**：设置 Electron 启动参数，包括证书忽略、窗口动画等

**关键模块：**

- [checkPathPermitted](https://github.com/luuman/matrx-windows/blob/master/src/tools/checkPathPermitted.js) - 路径权限检查
- [currentConfig](https://github.com/luuman/matrx-windows/blob/master/src/buildConfig/currentConfig.js) - 当前构建配置

## 2\. 主进程初始化阶段 (background.js)[](#2-主进程初始化阶段-backgroundjs)

### 2.1 基础模块导入[](#21-基础模块导入)

JAVASCRIPT

```js
// 核心Electron模块
import {
  app,
  ipcMain,
  shell,
  dialog,
  globalShortcut,
  session,
  clipboard,
  nativeImage,
} from "electron";

// 日志系统
const cryptolog = require("./logs/cryptolog.js");
const infoLog = require("./logs/infoLog.js");
const devLog = require("./logs/devLog.js");

// 设备标识
import { generateDeviceId } from "@/main/deviceId.js";
```

### 2.2 应用就绪处理 (app.on('ready'))[](#22-应用就绪处理-apponready)

**加载顺序：**

1.  **启动加载界面**：`startLoading()` - 显示应用启动动画
2.  **存储系统初始化**：`electronStore()` - 初始化本地存储
3.  **设备 ID 生成**：`initDeviceId()` - 生成唯一设备标识
4.  **国际化配置**：`initLocaleLange()` - 设置应用语言
5.  **环境配置加载**：`global.envConfig = require('@/config/config')` - 加载应用配置
6.  **开发者工具**：开发环境下加载 Vue DevTools

### 2.3 核心功能模块初始化[](#23-核心功能模块初始化)

**窗口管理模块：**

- `sysMemory()` - 内存监控
- `initScreenEvent()` - 屏幕事件处理
- `mainConnectAppdata()` - 应用数据连接
- `appLoading()` - 应用加载状态管理
- `initStartPage()` - 启动页面初始化
- `createWindow()` - 主窗口创建

**通信与 SDK 模块：**

- `initLiveWebview()` - 直播 WebView 初始化
- `initCstMeeting()` - 会议 SDK 初始化
- `loadInitSDK()` - SDK 加载（包括系统托盘、提示器等）

**IPC 通信模块：**

- `ipcListener()` - IPC 主进程监听器
- `initUpdater()` - 自动更新系统
- `useCapture()` - 截图功能
- `initNotification()` - 通知系统

### 2.4 专项功能窗口初始化[](#24-专项功能窗口初始化)

**会议相关窗口：**

- `onMeetingInfoChannel()` - 会议信息页面
- `onCallFeedback()` - 通话反馈
- `useMeetingInvite()` - 会议邀请
- `useMeetingPwd()` - 会议密码
- `useMeetingVote()` - 会议投票
- `useMeetingWhiteboardShare()` - 白板分享
- `initE2eeMeeting()` - 端到端加密会议

**工具窗口：**

- `usePictureViewer()` - 图片查看器
- `useFileViewer()` - 文件查看器
- `initPictureEditorWin()` - 图片编辑器
- `initMapWin()` - 地图窗口
- `initStorageDataWin()` - 存储数据窗口
- `initProfilePhotoWin()` - 头像设置窗口

**系统功能窗口：**

- `initPreferencesWin()` - 偏好设置窗口
- `initDialogWin()` - 对话窗口
- `initWebviewWin()` - WebView 窗口
- `initDevicesManagementWin()` - 设备管理窗口
- `initSSOWin()` - SSO 登录窗口
- `initRobotPage()` - 机器人页面
- `useAiModel()` - AI 模型功能

### 2.5 系统集成功能[](#25-系统集成功能)

**快捷键与菜单：**

- `initMainMenu()` - 主菜单初始化
- `registerShortcut()` - 全局快捷键注册
- `initshortcutWin()` - 快捷键窗口

**辅助功能：**

- `initUpdateWin()` - 更新窗口
- `initHelpCenterWin()` - 帮助中心
- `initNewGuideWin()` - 新手引导

## 3\. 渲染进程预加载 (preload.js)[](#3-渲染进程预加载-preloadjs)

**功能：**

- **IPC 通信桥接**：为渲染进程提供安全的 IPC 通信接口
- **API 暴露**：暴露主窗口操作、截图功能等 API 给渲染进程
- **存储初始化**：初始化本地存储系统

## 4\. 渲染进程启动 (main.js)[](#4-渲染进程启动-mainjs)

**Vue 应用初始化：**

- **Vue 实例创建**：创建 Vue 应用实例
- **插件注册**：注册各种 Vue 插件和组件
- **路由和状态管理**：初始化 Vue Router 和 Vuex
- **错误处理**：设置全局错误处理和日志记录

**应用数据初始化：**

- `renderInitAppdata()` - 渲染进程应用数据初始化
- `initUserInfo()` - 用户信息初始化
- `checkUserDiskFreeSpace()` - 磁盘空间检查

## 总结[](#总结)

主进程的加载顺序遵循了从基础到复杂、从核心到扩展的原则：

1.  **预初始化** → 确保基础环境和权限
2.  **核心模块** → 加载必要的系统模块
3.  **窗口管理** → 创建和管理应用窗口
4.  **功能模块** → 初始化各项业务功能
5.  **渲染进程** → 启动用户界面

这种设计确保了应用的稳定性和功能的逐步启用，避免了启动时的资源竞争和初始化冲突。
