# Matrx Windows 开发文档目录规划

> 本文档为详细的文档目录规划，按优先级和模块划分，确保颗粒度足够细致。

---

## 📊 文档统计

| 分类 | 文档数量 | 优先级 |
|------|---------|--------|
| 核心架构 | 5 篇 | P0 |
| IM 即时通讯 | 8 篇 | P0 |
| 会议 SDK | 6 篇 | P0 |
| 数据库 | 5 篇 | P0 |
| IPC 通信 | 4 篇 | P1 |
| API 模块 | 6 篇 | P1 |
| 主进程模块 | 5 篇 | P1 |
| 渲染进程 | 4 篇 | P1 |
| 功能模块 | 8 篇 | P2 |
| 工具函数 | 6 篇 | P2 |
| 组件库 | 5 篇 | P2 |
| 打包部署 | 4 篇 | P3 |
| 日志与监控 | 4 篇 | P0 |
| 国际化 | 2 篇 | P3 |
| **总计** | **71 篇** | - |

---

## 一、核心架构篇 (5篇) - P0

### 1.1 `architecture/project-overview.md` - 项目整体架构
- 技术栈概览 (Electron 20 + Vue 2 + Vuex + SQLCipher)
- 代码规模统计 (734 JS + 402 Vue)
- 进程模型图解
- 模块依赖关系图
- 核心数据流向

### 1.2 `architecture/main-process-architecture.md` - 主进程架构详解
- `background.js` 入口分析
- 应用生命周期事件 (`app.on` 全部事件)
- 全局对象管理 (`global.currentWin`, `global.meetingSDK` 等)
- 单例锁机制
- 崩溃恢复流程

### 1.3 `architecture/renderer-process-architecture.md` - 渲染进程架构详解
- 主渲染进程 (`src/main.js`)
- 28 个独立渲染应用清单
- Vue 应用初始化流程 (`initVue.js` - 44KB)
- 路由配置与守卫
- 组件加载策略

### 1.4 `architecture/multi-space-architecture.md` - 多空间架构
- 空间概念 (`spaceId`)
- 空间数据隔离机制
- 空间切换流程
- 跨空间消息 (`mcFrom`, `mcTo`)
- `SpaceManager.js` 核心 API

### 1.5 `architecture/security-architecture.md` - 安全架构
- E2EE 端到端加密原理
- SSL Pinning 实现 (`useCertificateVerifyProc.js`)
- SQLCipher 数据库加密
- 日志加密 (`encrypt.js`)
- 敏感数据存储策略

---

## 二、IM 即时通讯模块 (8篇) - P0

### 2.1 `im/message-architecture.md` - 消息系统架构
- `messageManger.js` (171KB) 核心解析
- 消息生命周期 (`ctime`, `stime`, `mtime`)
- 消息状态机 (`messageStatus`)
- 消息队列管理
- 消息去重机制

### 2.2 `im/message-types.md` - 消息类型详解
- 文本消息 (`text/plain`)
- 图片消息 (`image/*`)
- 文件消息 (`assertType: 1/2/3`)
- 回复消息 (`Reply`)
- 表情回复 (`application/sticker`)
- 机器人消息 (`Robot`)
- 通知消息 (`Event`)
- 销毁消息 (`DestroyMsg`)
- 多媒体嵌入消息
- 已读回执 (`application/receipt`)
- 消息类型扩展指南

### 2.3 `im/message-send-receive.md` - 消息收发流程
- 发送流程 (本地存储 → Socket → 服务器 → ACK)
- 接收流程 (`handlePush.js` 解析)
- `receiveMessage.js` 核心逻辑
- 消息模板 (`messageTemplate.js`)
- 发送失败重试机制
- 消息确认 (`ackDB`)

### 2.4 `im/session-management.md` - 会话管理
- `sessionApi.js` (15KB) 核心 API
- 会话列表渲染 (`SessionList.vue` - 31KB)
- 会话排序规则 (置顶、时间)
- 会话未读数管理
- 会话静音与隐藏
- 群会话特殊处理

### 2.5 `im/read-receipt.md` - 已读未读机制
- 回执数据结构
- `receiptUtils.js` 工具函数
- `clearReceiptShow()` - 清除回执显示
- `appendReceipt()` - 追加回执
- `saveReceiptAllMessage()` - 批量保存
- 群聊已读回执
- 性能优化策略

### 2.6 `im/offline-history-message.md` - 离线与历史消息
- `offlineMsgApi.js` - 离线消息拉取
- `historyMsgApi.js` - 历史消息加载
- `fetchOfflineMsgs()` 流程
- `fetchHistoryMsgs()` 分页策略
- 消息合并与去重
- 增量同步机制

### 2.7 `im/socket-connection.md` - Socket 长连接
- `socketUtil.js` (15KB) 核心解析
- `loopConnectSocket.js` (7KB) 重连机制
- 连接状态管理
- 心跳保活
- 断线重连策略
- 多设备登录处理 (`handleRemoteLoginNotification`)

### 2.8 `im/contact-peer-management.md` - 联系人与对端管理
- `peerApi.js` (111KB) 核心 API
- `contactApi.js` (7.7KB) 联系人操作
- `contactRequest.js` (5.5KB) 好友请求
- `peer` 表结构详解
- 联系人状态 (`statusMap.js`)
- 组织架构 (`organizationUtils.js`)

---

## 三、会议 SDK 模块 (6篇) - P0

### 3.1 `sdk/sdk-overview.md` - SDK 架构概述
- `meetingSDK.js` (89KB) 整体结构
- CST SDK 加载机制
- SDK 版本管理 (`sdkVersion.js`)
- SDK 与主进程交互
- SDK 事件回调体系

### 3.2 `sdk/sdk-initialization.md` - SDK 初始化
- `cstInitialize()` 流程
- `cstInitConfiguration()` 配置项
- `CST_Func_initialize()` 参数详解
- SDK 环境检测 (`checkSdk.js`)
- 初始化错误处理

### 3.3 `sdk/meeting-operations.md` - 会议操作
- `joinMeeting()` 加入会议流程
- `callMeeting()` 发起通话流程
- 会议信息获取
- 参与者管理
- 主持人权限 (host/cohost/member)
- 等待室功能

### 3.4 `sdk/audio-video-control.md` - 音视频控制
- 音频控制 API
- 视频控制 API
- 设备管理 (`devicesManagement`)
- 媒体状态检测
- 虚拟背景
- 噪声抑制

### 3.5 `sdk/screen-share-recording.md` - 屏幕共享与录制
- 屏幕共享 API
- 应用窗口共享
- 白板共享 (`meetingWhiteboardShare`)
- 会议录制
- 录制路径配置

### 3.6 `sdk/e2ee-meeting.md` - E2EE 会议
- `e2eeMeetingUtils.js` (32KB) 核心逻辑
- E2EE 会议创建
- 密钥交换流程
- 验证码机制 (`e2eeCode`)
- E2EE 常量 (`e2eeConstants.js`)

---

## 四、数据库模块 (5篇) - P0

### 4.1 `database/database-architecture.md` - 数据库架构
- SQLCipher 5.3.1 集成
- 数据库文件位置
- 加密密钥管理
- 多空间数据库隔离
- 数据库连接管理

### 4.2 `database/table-schema.md` - 表结构详解
- `message` 表 (20+ 字段)
- `peer` 表 (30+ 字段)
- `session` 表
- `organization` 表
- `forward` 表
- `ack` 表
- 索引设计

### 4.3 `database/crud-operations.md` - CRUD 操作
- `SqliteUtil.js` (17KB) 核心工具
- `runWith()` - 执行 SQL
- `insertWith()` - 插入数据
- `updateWith()` - 更新数据
- `allWith()` / `getWith()` - 查询数据
- `deleteWith()` - 删除数据
- 事务处理
- 批量操作优化

### 4.4 `database/fts-search.md` - 全文搜索
- FTS 模块架构 (`ftsDB/`)
- `ftsService.js` 核心 API
- 搜索状态 (`SearchEnum`)
- 消息搜索
- 联系人搜索
- 群名搜索
- 索引更新策略

### 4.5 `database/migration.md` - 版本迁移
- 迁移脚本目录 (`sql/init/` v1-v29)
- 用户信息迁移 (`sql/userInfo/` v1-v9)
- 迁移执行流程
- 数据兼容性处理
- 迁移回滚策略

---

## 五、IPC 通信模块 (4篇) - P1

### 5.1 `ipc/ipc-architecture.md` - IPC 通信架构
- Electron IPC 模型
- 主进程通道 (`IPCMainChannel.js`)
- 渲染进程通道 (`IPCRenderChannel.js`)
- 通道命名规范
- 数据序列化

### 5.2 `ipc/ipc-send-receive.md` - IPC 发送与接收
- `ipcSend.js` 工具详解
- `ipcReceive.js` 监听器
- 单向通信 (`ipcMain.on` / `ipcRenderer.send`)
- 双向通信 (`ipcMain.handle` / `ipcRenderer.invoke`)
- 同步通信 (`sendSync`)

### 5.3 `ipc/ipc-channels-reference.md` - IPC 通道参考
- 用户数据通道 (`REMOVE_USER_DATA` 等)
- 文件操作通道 (`clipboad-*`, `set-record-path` 等)
- 窗口控制通道 (`showMainWin`, `minimize` 等)
- 会议 SDK 通道
- 快捷键通道 (`shortcut-win`)
- 通知通道 (`showNotification`)

### 5.4 `ipc/ipc-best-practices.md` - IPC 最佳实践
- 通道管理策略
- 大数据传输优化
- 超时与重试
- 错误处理
- 调试技巧

---

## 六、API 模块 (6篇) - P1

### 6.1 `api/api-architecture.md` - API 架构概述
- API 目录结构 (49 个文件)
- HTTP 实例配置 (`axiosInstance.js` - 17KB)
- 请求/响应拦截器
- 错误处理机制
- 令牌刷新

### 6.2 `api/auth-api.md` - 认证 API
- `loginApi.js` (20KB) 详解
- 邮箱登录
- SSO 单点登录
- 两步验证 (2FA)
- 登出流程
- Token 管理

### 6.3 `api/message-api.md` - 消息 API
- `messageApi.js` (29KB) 详解
- 消息发送 API
- 消息查询 API
- 消息删除 API
- 消息撤回 API
- 批量操作 API

### 6.4 `api/meeting-api.md` - 会议 API
- `meetingApi.js` (18KB) 详解
- 创建会议
- 加入会议
- 会议信息查询
- 参与者管理
- 会议设置

### 6.5 `api/file-api.md` - 文件 API
- `FileApi.js` (19KB) 详解
- `uploadApi.js` (7KB) 上传流程
- 文件上传 (分片、断点续传)
- 文件下载
- 文件预览
- 文件服务器配置

### 6.6 `api/other-api.md` - 其他 API
- `e2eeApi.js` - E2EE 加密
- `aiApi.js` (4.2KB) - AI 功能
- `approvalApi.js` - 审批流程
- `translateApi.js` - 翻译服务
- `liveApi.js` - 直播功能

---

## 七、主进程模块 (5篇) - P1

### 7.1 `main-process/entry-point.md` - 主进程入口
- `background.js` 完整解析
- 启动流程时序图
- `appPre.js` 预初始化
- `appLoading.js` 加载页
- `start.js` 启动控制

### 7.2 `main-process/window-management.md` - 窗口管理
- `mainWindow/index.js` 详解
- `createWindow()` 参数
- 窗口事件处理
- 多窗口管理策略
- 窗口状态持久化

### 7.3 `main-process/tray-module.md` - 系统托盘
- `tray.js` 完整解析
- 托盘图标切换 (`setTraySetImage`)
- 托盘菜单构建
- 托盘事件监听
- 新消息闪烁

### 7.4 `main-process/notification-module.md` - 系统通知
- `notification.js` 完整解析
- 通知显示 API
- 通知点击处理
- 通知节流
- 免打扰模式

### 7.5 `main-process/updater-module.md` - 自动更新
- `updater.js` (26KB) 完整解析
- `AppUpdater` 类详解
- 更新检查流程
- 下载进度跟踪
- 强制更新处理
- 版本跳过策略

---

## 八、渲染进程模块 (4篇) - P1

### 8.1 `renderer/main-app.md` - 主应用渲染进程
- `main.js` 入口详解
- `App.vue` (38KB) 结构
- 全局组件注册
- 全局指令注册
- 插件集成

### 8.2 `renderer/vuex-modules.md` - Vuex 状态管理
- Store 模块清单 (28 个)
- `messageCollection.js` (6.1KB)
- `peerCollection.js` (15KB)
- `sessionCollection.js` (10KB)
- `uiControl.js` (24KB)
- `concat.js` (27KB)
- 状态持久化同步

### 8.3 `renderer/independent-apps.md` - 独立渲染应用
- 28 个独立应用清单
- `screenshot/` 截屏应用
- `pictureEditor/` 图片编辑
- `fileViewer/` 文件查看
- `shortcut/` 快捷键设置
- `update/` 更新管理
- 应用间通信

### 8.4 `renderer/preload-scripts.md` - 预加载脚本
- `preload.js` 主预加载
- 各窗口专用预加载
- `contextBridge` API 暴露
- 安全最佳实践

---

## 九、功能模块 (8篇) - P2

### 9.1 `features/screenshot-module.md` - 截屏模块
- `capture-main.js` (15KB) 主进程
- `WindowManager.js` (24KB) 窗口管理
- 截屏渲染应用 (`renderer/screenshot/`)
- Fabric.js 画布编辑
- 编辑工具详解 (画笔、矩形、文字、箭头)
- 保存与分享

### 9.2 `features/shortcut-module.md` - 快捷键模块
- `shortcut/index.js` 主进程
- 全局快捷键注册
- 自定义快捷键
- 快捷键冲突检测
- 快捷键持久化
- 快捷键设置窗口

### 9.3 `features/file-module.md` - 文件处理模块
- `FileTool.js` (49KB) 核心工具
- 文件上传流程
- 文件下载流程
- 分片上传
- 断点续传
- 文件预览
- 大文件处理优化

### 9.4 `features/editor-module.md` - 编辑器模块
- `editor.js` (12KB) 核心
- 富文本编辑 (`RichText/`)
- 消息输入 (`MessageInput/`)
- 表情面板 (`EmojisPannel/`)
- @提及功能
- 图片粘贴

### 9.5 `features/calendar-module.md` - 日历模块
- `Calendar/` 组件详解
- 日历视图
- 事件管理
- 会议日程
- 提醒功能

### 9.6 `features/approval-module.md` - 审批模块
- `approvalApi.js` API
- `Approval/` 组件
- 审批流程
- 审批状态

### 9.7 `features/ai-module.md` - AI 模块
- `aiApi.js` (4.2KB) API
- `aiModel/` 渲染应用
- AI 功能集成
- 消息智能处理

### 9.8 `features/map-module.md` - 地图模块
- `Map/` 组件
- `mapWin/` 渲染应用
- 位置分享
- 地图集成

---

## 十、工具函数库 (6篇) - P2

### 10.1 `utils/data-utils.md` - 数据处理工具
- `dataUtil.js` (31KB) 核心函数
- `dataDao.js` (11KB) 数据访问
- `deepCopy.js` 深复制
- `safeJson.js` 安全 JSON
- 常用数据转换函数

### 10.2 `utils/file-utils.md` - 文件处理工具
- `FileTool.js` (49KB) 核心函数
- `FileSHAModule.js` (4.9KB) SHA 计算
- `FileLongPath.js` 长路径
- `fileType.js` 类型判断
- 文件读写操作

### 10.3 `utils/crypto-utils.md` - 加密工具
- `aes128gcm.js` AES 加密
- `caTool.js` (6.2KB) CA 工具
- `E2EEPingUtil.js` (7.1KB) E2EE Ping
- 加密/解密示例

### 10.4 `utils/format-utils.md` - 格式化工具
- `format/timeFormat.js` 时间格式化
- `format/stringFormat.js` 字符串格式化
- `TimeZone.js` 时区处理
- `timestampFix.js` 时间戳修复
- 常用格式化函数

### 10.5 `utils/ui-utils.md` - UI 工具
- `dom.js` (2.7KB) DOM 操作
- `moveElement.js` 元素移动
- `renderMsgItem.js` (13KB) 消息渲染
- `notification.js` (4.8KB) 通知工具
- `clipboard.js` (6.6KB) 剪贴板

### 10.6 `utils/function-reference.md` - 通用函数参考
- `Function.js` (59KB) 核心函数库
- 高频使用函数清单
- 函数使用示例
- 废弃函数说明

---

## 十一、组件库 (5篇) - P2

### 11.1 `components/component-overview.md` - 组件库概述
- 组件目录结构 (35 个目录)
- 组件分类
- 组件注册方式
- 组件命名规范

### 11.2 `components/chat-components.md` - 聊天组件
- `ChatHead.vue` (42KB) 聊天头部
- `RightContentPanel.vue` (267KB) 内容面板
- `RightMessageEdit.vue` 消息编辑
- `SessionList.vue` (31KB) 会话列表
- `ReplyListPannel.vue` (18KB) 回复列表

### 11.3 `components/layout-components.md` - 布局组件
- `LeftMenuBar.vue` (28KB) 左菜单
- `Layout/` 布局组件
- `Scrollbar/` 滚动条
- `ScrollPane/` 滚动面板
- `Panel/` 面板组件

### 11.4 `components/dialog-components.md` - 对话框组件
- `Dialog/` 对话框
- `DialogCell.vue` (15KB) 对话框单元
- `ContextMenu/` 右键菜单
- `Notify/` 通知组件
- `Tooltip/` 提示组件

### 11.5 `components/common-components.md` - 通用组件
- `common/` 通用组件目录
- `SvgIcon/` SVG 图标
- `Portrait/` 头像组件
- `SearchBar/` 搜索栏
- `TextTooltip.vue` 文本提示
- `kits/` 工具组件

---

## 十二、打包部署 (4篇) - P3

### 12.1 `build/build-overview.md` - 构建系统概述
- `build.js` (10KB) 构建脚本
- `vue.config.js` 配置
- NPM Scripts 详解
- 构建环境变量

### 12.2 `build/nsis-config.md` - NSIS 打包配置
- `nsis_build/` 目录结构
- `installer.nsi` (5.9KB) 配置
- `build_setup.nsi` (6.5KB) 配置
- `System.nsh` (14KB) 系统脚本
- 安装程序自定义

### 12.3 `build/msi-appx-config.md` - MSI/APPX 配置
- `msiConfig.js` (1.8KB) MSI 配置
- `appxConfig.js` (2.5KB) APPX 配置
- Windows Store 发布
- 企业部署配置

### 12.4 `build/code-signing.md` - 代码签名
- `sign.js` 签名脚本
- `sign_dll.js` DLL 签名
- 证书管理
- 时间戳服务器
- 签名验证

---

## 十三、日志与监控 (4篇) - P0 ⭐重要

### 13.1 `guides/log-troubleshooting-guide.md` - 日志排查手册 ✅已完成
- 日志文件位置
- 日志文件清单（核心/功能/辅助）
- 问题排查流程（标准流程图）
- 首先看什么（黄金法则）
- 按症状定位日志（症状→日志映射表）
- 日志格式解读
- 常见错误分析（网络/认证/数据库/SDK/IPC）
- 日志解密方法
- 高级排查技巧（跨日志关联、实时监控、统计分析）
- 日志收集与上报

### 13.2 `logging/logging-system.md` - 日志系统架构
- `logs/` 目录结构 (66 文件, 3463行)
- `log.config.js` 配置详解
- 19 个日志类别 (categoryNames)
- 21 个 Appender 配置
- 日志级别配置
- 日志轮转策略 (6MB/8MB, 2-5备份)

### 13.3 `logging/log-categories.md` - 日志分类参考
- `devLog.js` 开发日志
- `messageLog.js` / `msgAllLog.js` 消息日志
- `meetingLog.js` / `cst-meeting-agent.log` 会议日志
- `sdkLog.js` SDK 日志
- `e2eeLog.js` E2EE 日志
- `ackLog.js` / `offlineMsgLog.js` 同步日志
- 其他专用日志

### 13.4 `logging/log-encryption.md` - 日志加密机制
- `encrypt.js` 加密模块
- AES-CTR 加密流程
- SHA-256 密钥派生
- 加密日志格式 (`|+|` 标记)
- 解密方法与脚本

---

## 十四、国际化 (2篇) - P3

### 14.1 `i18n/i18n-system.md` - 国际化系统
- `lang/` 目录结构
- Vue-i18n 配置
- 语言包加载
- 动态语言切换

### 14.2 `i18n/language-reference.md` - 语言包参考
- 英文 (en) 语言包
- 阿拉伯文 (ar) 语言包
- 新增语言指南
- RTL 语言适配

---

## 执行计划

### 第一批：核心模块 (P0) - 24篇
1. 核心架构篇 (5篇)
2. IM 即时通讯 (8篇)
3. 会议 SDK (6篇)
4. 数据库 (5篇)

### 第二批：重要模块 (P1) - 19篇
1. IPC 通信 (4篇)
2. API 模块 (6篇)
3. 主进程模块 (5篇)
4. 渲染进程 (4篇)

### 第三批：功能模块 (P2) - 19篇
1. 功能模块 (8篇)
2. 工具函数 (6篇)
3. 组件库 (5篇)

### 第四批：辅助模块 (P3) - 9篇
1. 打包部署 (4篇)
2. 日志监控 (3篇)
3. 国际化 (2篇)

---

## 已完成文档

### 新增文档 (2026-02-05)

| 文档路径 | 说明 |
|---------|------|
| `architecture/file-statistics.md` | 完整项目文件统计与目录结构 |
| `api/http-api.md` | HTTP API 接口参考 (50个API模块详解) |
| `api/utils-api.md` | 工具函数 API 参考 |
| `api/database-api.md` | 数据库 API 参考 |
| `api/store-api.md` | Vuex Store API 参考 |
| `api/ipc-api.md` | IPC 通道 API 参考 |
| `guides/getting-started.md` | 新人入门指南 |
| `guides/concepts.md` | 核心概念与知识点讲解 |

---

## 待确认事项

1. 是否需要调整优先级顺序？
2. 是否有遗漏的重要模块？
3. 每篇文档的详细程度是否合适？

---

**文档规划版本**: 1.1
**最后更新**: 2026-02-05
