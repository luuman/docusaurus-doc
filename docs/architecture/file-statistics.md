# 项目文件统计与目录结构

## 项目规模概览

| 统计项 | 数量 |
|--------|------|
| JavaScript 文件 | 734 个 |
| Vue 组件文件 | 402 个 |
| SCSS 样式文件 | 22 个 |
| CSS 样式文件 | 6 个 |
| 目录数量 | 298 个 |
| 总源代码文件 | 1,136+ 个 |

---

## 按目录分类统计

| 目录 | 文件数 | 说明 |
|------|--------|------|
| `src/api/` | 50 | API 请求层 |
| `src/components/` | 311 | Vue 组件库 |
| `src/views/` | 15 | 页面视图 |
| `src/store/` | 30 | Vuex 状态管理 |
| `src/utils/` | 178 | 工具函数库 |
| `src/main/` | 94 | 主进程模块 |
| `src/renderer/` | 270 | 多窗口渲染进程 |
| `src/sql/` | 45 | 数据库模块 |
| `src/logs/` | 63 | 日志系统 |
| `src/lang/` | 15 | 国际化 |

---

## 核心大文件统计

以下是项目中最重要的大型核心文件（按代码行数排序）：

### 主进程核心文件

| 文件路径 | 行数 | 说明 |
|---------|------|------|
| `src/main/sdk/meetingSDK.js` | 89,444 | 会议 SDK 集成核心 |
| `src/main/screenshot/capture-main.js` | ~15,000 | 截图主进程 |
| `src/main/mainWindow/index.js` | ~5,000 | 主窗口管理 |
| `src/main/update/updater.js` | ~4,000 | 应用更新管理 |

### API 层核心文件

| 文件路径 | 大小 | 说明 |
|---------|------|------|
| `src/api/messageManger.js` | 171KB | 消息管理器核心 |
| `src/api/peerApi.js` | 111KB | 联系人/对端 API |
| `src/api/messageApi.js` | 29KB | 消息 API |
| `src/api/loginApi.js` | 20KB | 登录认证 API |
| `src/api/FileApi.js` | 19KB | 文件操作 API |
| `src/api/meetingApi.js` | 18KB | 会议 API |
| `src/api/axiosInstance.js` | 17KB | HTTP 实例配置 |
| `src/api/sessionApi.js` | 15KB | 会话 API |
| `src/api/socketUtil.js` | 15KB | Socket 工具 |

### 工具函数核心文件

| 文件路径 | 行数 | 说明 |
|---------|------|------|
| `src/utils/Function.js` | 59,180 | 核心函数库 |
| `src/utils/FileTool.js` | 49,672 | 文件处理工具 |
| `src/utils/dataUtil.js` | 31,558 | 数据处理工具 |
| `src/dataController/enterprise.js` | 40,648 | 企业数据控制器 |

### Vuex Store 核心模块

| 文件路径 | 行数 | 说明 |
|---------|------|------|
| `src/store/modules/concat.js` | 27,788 | 主状态管理 |
| `src/store/modules/uiControl.js` | 24,191 | UI 控制状态 |
| `src/store/modules/peerCollection.js` | 15,425 | 联系人集合 |
| `src/store/modules/spaceLimit.js` | 13,591 | 空间限制管理 |
| `src/store/modules/userInfo.js` | 11,798 | 用户信息 |
| `src/store/modules/spaceCollection.js` | 11,003 | 空间集合 |
| `src/store/modules/sessionCollection.js` | 10,160 | 会话集合 |

### 渲染进程大型组件

| 文件路径 | 行数 | 说明 |
|---------|------|------|
| `src/renderer/screenshot/App.vue` | 1,598 | 截图应用 |
| `src/renderer/combineChat/ChatBox.vue` | 1,428 | 聊天框组件 |
| `src/renderer/callfeedback/App.vue` | 1,103 | 通话反馈 |
| `src/renderer/pictureViewer/App.vue` | 1,096 | 图片查看器 |
| `src/dataController/enterprise.js` | 1,087 | 企业控制器 |

---

## 完整目录结构

```
matrx-windows/
├── src/                                    # 源代码目录
│   ├── main.js                             # 渲染进程入口
│   ├── background.js                       # 主进程入口
│   ├── preload.js                          # 预加载脚本
│   ├── App.vue                             # 根 Vue 组件
│   ├── router.js                           # Vue Router 配置
│   ├── userInfo.js                         # 用户信息工具
│   ├── IPCRenderChannel.js                 # IPC 渲染进程通道
│   │
│   ├── api/                                # API 接口层 (50个文件)
│   │   ├── axiosInstance.js                # Axios 实例配置
│   │   ├── axios.js                        # Axios 封装
│   │   ├── loginApi.js                     # 登录相关 API
│   │   ├── messageApi.js                   # 消息 API
│   │   ├── messageManger.js                # 消息管理器 (核心)
│   │   ├── contactApi.js                   # 联系人 API
│   │   ├── peerApi.js                      # 对端用户 API
│   │   ├── userApi.js                      # 用户 API
│   │   ├── meetingApi.js                   # 会议 API
│   │   ├── historyMsgApi.js                # 历史消息 API
│   │   ├── FileApi.js                      # 文件 API
│   │   ├── uploadApi.js                    # 上传 API
│   │   ├── e2eeApi.js                      # 端到端加密 API
│   │   ├── storageDataApi.js               # 存储数据 API
│   │   ├── approvalApi.js                  # 审批 API
│   │   ├── callApi.js                      # 通话 API
│   │   ├── sessionApi.js                   # 会话 API
│   │   ├── socketUtil.js                   # Socket 工具
│   │   ├── loopConnectSocket.js            # Socket 重连
│   │   ├── spaceApi.js                     # 空间 API
│   │   ├── channelApi.js                   # 频道 API
│   │   ├── aiApi.js                        # AI 功能 API
│   │   ├── translateApi.js                 # 翻译 API
│   │   ├── liveApi.js                      # 直播 API
│   │   ├── sdkApi.js                       # SDK API
│   │   └── ...                             # 其他 API 文件
│   │
│   ├── components/                         # Vue 组件库 (311个文件)
│   │   ├── Layout/                         # 布局组件
│   │   ├── Panel/                          # 面板组件
│   │   │   ├── ChatsPanel.vue              # 聊天面板
│   │   │   ├── MeetingsPanel.vue           # 会议面板
│   │   │   ├── ContactsPanel.vue           # 联系人面板
│   │   │   ├── CalendarPanel.vue           # 日历面板
│   │   │   └── ApprovalPanel.vue           # 审批面板
│   │   ├── Chat/                           # 聊天组件
│   │   │   ├── ChatHead.vue                # 聊天头部
│   │   │   ├── RightContentPanel.vue       # 内容面板
│   │   │   └── ReplyListPannel.vue         # 回复列表
│   │   ├── Meeting/                        # 会议组件
│   │   ├── MessageInput/                   # 消息输入组件
│   │   ├── EmojisPannel/                   # 表情面板
│   │   ├── RichText/                       # 富文本编辑器
│   │   ├── Contact/                        # 联系人组件
│   │   ├── Dialog/                         # 对话框组件
│   │   ├── SearchBar/                      # 搜索栏
│   │   ├── Scrollbar/                      # 滚动条
│   │   ├── Tooltip/                        # 工具提示
│   │   ├── Portrait/                       # 用户头像
│   │   ├── SvgIcon/                        # SVG 图标
│   │   ├── common/                         # 通用组件
│   │   ├── kits/                           # UI 套件
│   │   ├── PayUpgrade/                     # 付费升级
│   │   ├── Notify/                         # 通知组件
│   │   ├── updater/                        # 更新器组件
│   │   ├── ContextMenu/                    # 右键菜单
│   │   └── ...                             # 其他组件目录
│   │
│   ├── views/                              # 页面视图 (15个文件)
│   │   ├── Welcome.vue                     # 欢迎/登录选择页
│   │   ├── Main.vue                        # 主界面
│   │   ├── UserLogin.vue                   # 用户登录
│   │   ├── EmailLogin.vue                  # 邮箱登录
│   │   ├── PhoneLogin.vue                  # 手机登录
│   │   ├── LdapLogin.vue                   # LDAP 登录
│   │   ├── TwoFactor.vue                   # 两步验证
│   │   ├── ServerSeting.vue                # 服务器设置
│   │   ├── Reporting.vue                   # 问题反馈
│   │   ├── MessageBox.vue                  # 消息框
│   │   ├── NoticeGlobal.vue                # 全局通知
│   │   └── Loading.vue                     # 加载页面
│   │
│   ├── store/                              # Vuex 状态管理 (30个文件)
│   │   ├── index.js                        # Store 入口
│   │   └── modules/                        # Store 模块 (28个)
│   │       ├── concat.js                   # 主状态管理 (核心)
│   │       ├── uiControl.js                # UI 控制状态
│   │       ├── peerCollection.js           # 联系人集合
│   │       ├── sessionCollection.js        # 会话集合
│   │       ├── spaceCollection.js          # 空间集合
│   │       ├── messageCollection.js        # 消息集合
│   │       ├── spaceLimit.js               # 空间限制
│   │       ├── userInfo.js                 # 用户信息
│   │       ├── setting.js                  # 设置状态
│   │       ├── theme.js                    # 主题状态
│   │       ├── fileCollection.js           # 文件集合
│   │       ├── forwardCollection.js        # 转发集合
│   │       ├── dialogList.js               # 对话框列表
│   │       ├── approval.js                 # 审批状态
│   │       ├── appdata.js                  # 应用数据
│   │       └── ...                         # 其他模块
│   │
│   ├── utils/                              # 工具函数库 (178个文件)
│   │   ├── Function.js                     # 核心函数库 (59K行)
│   │   ├── FileTool.js                     # 文件工具 (49K行)
│   │   ├── dataUtil.js                     # 数据工具 (31K行)
│   │   ├── base.js                         # 基础工具
│   │   ├── cache.js                        # 缓存管理
│   │   ├── debounce.js                     # 防抖函数
│   │   ├── deepCopy.js                     # 深拷贝
│   │   ├── aes128gcm.js                    # AES 加密
│   │   ├── ackDBUtil.js                    # ACK 数据库工具
│   │   ├── caughtError.js                  # 错误捕获
│   │   ├── deviceInfo.js                   # 设备信息
│   │   ├── dom.js                          # DOM 工具
│   │   ├── editor.js                       # 编辑器工具
│   │   ├── clipboard.js                    # 剪贴板工具
│   │   ├── downloadSetting.js              # 下载设置
│   │   ├── ipc/                            # IPC 通信工具
│   │   │   └── ipcSend.js                  # IPC 发送
│   │   ├── chat/                           # 聊天工具
│   │   ├── message/                        # 消息工具
│   │   ├── files/                          # 文件工具
│   │   ├── login/                          # 登录工具
│   │   ├── contact/                        # 联系人工具
│   │   ├── meeting/                        # 会议工具
│   │   ├── sdk/                            # SDK 工具
│   │   ├── format/                         # 格式化工具
│   │   ├── ftsDB/                          # 全文搜索工具
│   │   ├── approval/                       # 审批工具
│   │   ├── avatar/                         # 头像工具
│   │   └── ...                             # 其他工具目录
│   │
│   ├── main/                               # 主进程代码 (94个文件)
│   │   ├── background.js                   # 主进程入口
│   │   ├── mainWindow/                     # 主窗口管理
│   │   │   ├── index.js                    # 窗口创建和管理
│   │   │   └── settingsCalendar.js         # 日历设置
│   │   ├── sdk/                            # SDK 集成
│   │   │   └── meetingSDK.js               # 会议 SDK (89K行)
│   │   ├── store.js                        # electron-store
│   │   ├── IPCMainChannel.js               # IPC 主进程通道
│   │   ├── mainUtils.js                    # 主进程工具
│   │   ├── appLoading.js                   # 应用加载
│   │   ├── appPre.js                       # 应用预初始化
│   │   ├── deviceId.js                     # 设备 ID 生成
│   │   ├── check-disk-space.js             # 磁盘空间检查
│   │   ├── globalShortcut.js               # 全局快捷键
│   │   ├── tray/                           # 托盘功能
│   │   ├── update/                         # 更新管理
│   │   ├── screenshot/                     # 截图工具
│   │   ├── preferences/                    # 偏好设置
│   │   ├── fileViewer/                     # 文件查看器
│   │   ├── pictureViewer/                  # 图片查看器
│   │   ├── pictureEditor/                  # 图片编辑器
│   │   ├── meetingInfo/                    # 会议信息窗口
│   │   ├── meetingInvite/                  # 会议邀请窗口
│   │   ├── meetingPwd/                     # 会议密码窗口
│   │   ├── dialogWin/                      # 对话框窗口
│   │   ├── profilePhoto/                   # 用户头像窗口
│   │   ├── shortcut/                       # 快捷键窗口
│   │   ├── helpCenter/                     # 帮助中心
│   │   ├── newGuide/                       # 新手指南
│   │   ├── aiModel/                        # AI 模型集成
│   │   ├── devicesManagement/              # 设备管理
│   │   ├── forwardDB/                      # 转发数据库
│   │   ├── livesdk/                        # Live SDK
│   │   └── ...                             # 其他主进程模块
│   │
│   ├── renderer/                           # 渲染进程窗口 (270个文件)
│   │   ├── start/                          # 启动页面
│   │   │   ├── main.js                     # 入口
│   │   │   ├── App.vue                     # 组件
│   │   │   └── bridge/                     # 桥接脚本
│   │   ├── screenshot/                     # 截图应用
│   │   ├── fileViewer/                     # 文件查看器
│   │   ├── pictureViewer/                  # 图片查看器
│   │   ├── pictureEditor/                  # 图片编辑器
│   │   ├── meetingInfo/                    # 会议信息
│   │   ├── meetingInvite/                  # 会议邀请
│   │   ├── meetingPwd/                     # 会议密码
│   │   ├── dialogWin/                      # 对话框
│   │   ├── mapWin/                         # 地图窗口
│   │   ├── sso/                            # SSO 登录
│   │   ├── toast/                          # 通知提示
│   │   ├── storageData/                    # 存储数据
│   │   ├── profilePhoto/                   # 头像编辑
│   │   ├── update/                         # 更新界面
│   │   ├── shortcut/                       # 快捷键设置
│   │   ├── aiModel/                        # AI 模型界面
│   │   ├── devicesManagement/              # 设备管理
│   │   ├── combineChat/                    # 合并聊天
│   │   ├── callfeedback/                   # 通话反馈
│   │   ├── newGuide/                       # 新手引导
│   │   └── ...                             # 其他渲染窗口
│   │
│   ├── sql/                                # 数据库 SQL 定义 (45个文件)
│   │   ├── init/                           # 数据库初始化脚本
│   │   │   ├── v1.js ~ v29.js              # 版本迁移脚本
│   │   │   └── index.js                    # 初始化入口
│   │   ├── ackDB/                          # ACK 数据库
│   │   ├── forwardInit/                    # 转发数据库初始化
│   │   ├── ftsInit/                        # 全文搜索初始化
│   │   ├── userInfo/                       # 用户信息数据库
│   │   │   ├── v1.js ~ v9.js               # 版本迁移
│   │   │   └── index.js                    # 入口
│   │   └── messageDao.js                   # 消息数据访问对象
│   │
│   ├── sqlApi/                             # SQL API 层
│   │   ├── index.js                        # SQL API 入口
│   │   └── sql.js                          # SQL 执行工具
│   │
│   ├── socket/                             # WebSocket 相关
│   │   ├── handlePush.js                   # 推送消息处理
│   │   ├── messageTemplate.js              # 消息模板
│   │   └── BatchProcessor.js               # 批处理器
│   │
│   ├── config/                             # 应用配置
│   │   ├── config.js                       # 环境配置
│   │   ├── envConf.js                      # 环境变量
│   │   ├── element.config.js               # Element UI 配置
│   │   ├── MatrxMessage.js                 # 消息配置
│   │   ├── countryCode.js                  # 国家代码
│   │   └── country.js                      # 国家配置
│   │
│   ├── buildConfig/                        # 构建配置
│   │   ├── index.js                        # 构建配置入口
│   │   ├── currentConfig.js                # 当前配置
│   │   ├── meydan.js                       # Meydan 版本
│   │   ├── public.js                       # 公共版本
│   │   ├── private.js                      # 私有版本
│   │   └── current.js                      # 当前版本
│   │
│   ├── dataController/                     # 数据控制器
│   │   ├── hid.js                          # 用户 ID 控制
│   │   ├── enterprise.js                   # 企业数据控制
│   │   └── fileManage.js                   # 文件管理
│   │
│   ├── logs/                               # 日志系统 (63个文件)
│   │   ├── log.config.js                   # 日志配置
│   │   ├── devLog.js                       # 开发日志
│   │   ├── infoLog.js                      # 信息日志
│   │   ├── messageLog.js                   # 消息日志
│   │   ├── meetingLog.js                   # 会议日志
│   │   ├── e2eeLog.js                      # E2EE 日志
│   │   ├── cryptolog.js                    # 加密日志
│   │   └── lib/                            # 日志库
│   │
│   ├── lang/                               # 国际化 (15个文件)
│   │   └── locales/                        # 语言文件
│   │       ├── en/                         # 英文
│   │       └── ar/                         # 阿拉伯语
│   │
│   ├── styles/                             # 样式文件
│   │   ├── style.scss                      # 主样式
│   │   ├── variables.css                   # CSS 变量
│   │   └── theme-chalk/                    # Element 主题
│   │
│   ├── scss/                               # SCSS 文件 (22个)
│   │
│   ├── assets/                             # 资源文件
│   │   ├── icons/                          # 图标资源
│   │   ├── fonts/                          # 字体文件
│   │   ├── images/                         # 图片资源
│   │   └── logo/                           # Logo 资源
│   │
│   ├── plugins/                            # Vue 插件
│   │   ├── localforage/                    # LocalForage
│   │   ├── pdfjs-dist/                     # PDF.js
│   │   ├── image-editor/                   # 图片编辑器
│   │   └── reportError/                    # 错误上报
│   │
│   ├── directive/                          # Vue 自定义指令
│   │   ├── contextmenu/                    # 右键菜单
│   │   └── readreceipt/                    # 阅读回执
│   │
│   ├── mixins/                             # Vue Mixins
│   │   └── doInitMix.js                    # 初始化混合
│   │
│   ├── enum/                               # 枚举定义
│   │
│   ├── sentry/                             # Sentry 错误追踪
│   │
│   └── Firebase/                           # Firebase 集成
│
├── public/                                 # 静态资源
│   ├── index.html                          # 主页面 HTML
│   ├── start.html                          # 启动页面
│   ├── icon.png                            # 应用图标
│   ├── webview/                            # WebView 页面
│   ├── livewebview/                        # Live WebView
│   ├── loading/                            # 加载页面
│   ├── helpCenter/                         # 帮助中心
│   ├── newGuide/                           # 新手指南
│   ├── child/                              # 子窗口
│   ├── tray/                               # 托盘图标
│   ├── update/                             # 更新相关
│   ├── cmaps/                              # PDF CMap
│   └── ...                                 # 其他静态资源
│
├── build/                                  # 构建资源
├── build_base/                             # 基础构建资源
├── nsis_build/                             # NSIS 安装程序
├── devtools/                               # 开发工具
├── scripts/                                # 构建脚本
│   ├── all.js                              # 全量构建
│   ├── test_all.js                         # 全量测试
│   └── change-version.js                   # 版本更改
│
├── patches/                                # patch-package 补丁
├── docs/                                   # 开发文档
├── test/                                   # 测试文件
│
├── vue.config.js                           # Vue CLI 配置
├── babel.config.js                         # Babel 配置
├── .eslintrc.js                            # ESLint 配置
├── package.json                            # 项目依赖
├── exeConfig.js                            # EXE 打包配置
├── msiConfig.js                            # MSI 打包配置
├── appxConfig.js                           # APPX 打包配置
├── config.js                               # 应用配置
├── postcss.config.js                       # PostCSS 配置
├── prettier.config.js                      # Prettier 配置
├── commitlint.config.js                    # Commit 规范
└── build.js                                # 自定义构建脚本
```

---

## API 模块文件清单

### 核心 API 文件

| 文件名 | 大小 | 说明 |
|--------|------|------|
| `messageManger.js` | 171KB | 消息管理核心，处理消息收发、状态管理 |
| `peerApi.js` | 111KB | 联系人/对端用户管理 |
| `messageApi.js` | 29KB | 消息 CRUD 操作 |
| `loginApi.js` | 20KB | 登录认证相关 |
| `FileApi.js` | 19KB | 文件上传下载 |
| `meetingApi.js` | 18KB | 会议管理 |
| `axiosInstance.js` | 17KB | HTTP 请求实例 |
| `sessionApi.js` | 15KB | 会话管理 |
| `socketUtil.js` | 15KB | Socket 连接工具 |

### 其他 API 文件

| 文件名 | 说明 |
|--------|------|
| `aiApi.js` | AI 功能 API |
| `approvalApi.js` | 审批流程 API |
| `callApi.js` | 通话 API |
| `channelApi.js` | 频道 API |
| `contactApi.js` | 联系人 API |
| `contactRequest.js` | 好友请求 |
| `conversationApi.js` | 会话 API |
| `deleteApi.js` | 删除操作 API |
| `e2eeApi.js` | E2EE 加密 API |
| `historyMsgApi.js` | 历史消息 API |
| `liveApi.js` | 直播 API |
| `offlineMsgApi.js` | 离线消息 API |
| `spaceApi.js` | 空间 API |
| `storageDataApi.js` | 存储数据 API |
| `translateApi.js` | 翻译 API |
| `uploadApi.js` | 上传 API |
| `userApi.js` | 用户 API |
| `userInfoApi.js` | 用户信息 API |

---

## Store 模块文件清单

| 模块名 | 行数 | 说明 |
|--------|------|------|
| `concat.js` | 27,788 | 主状态管理，包含大量业务逻辑 |
| `uiControl.js` | 24,191 | UI 控制状态（窗口、面板、弹窗等） |
| `peerCollection.js` | 15,425 | 联系人集合管理 |
| `spaceLimit.js` | 13,591 | 空间配额和限制管理 |
| `userInfo.js` | 11,798 | 当前用户信息 |
| `spaceCollection.js` | 11,003 | 空间/租户集合 |
| `sessionCollection.js` | 10,160 | 会话列表管理 |
| `setting.js` | 6,609 | 用户设置 |
| `messageCollection.js` | 6,109 | 消息集合 |
| `dialogList.js` | 5,711 | 对话框列表 |
| `fileCollection.js` | 3,806 | 文件集合 |
| `appdata.js` | 2,514 | 应用数据 |
| `customerInfo.js` | 2,581 | 客户信息 |
| `emojiReply.js` | 2,271 | 表情回复 |
| `fileProcessCollection.js` | 2,143 | 文件处理集合 |
| `theme.js` | 1,912 | 主题状态 |
| `approval.js` | 1,701 | 审批状态 |
| `forwardCollection.js` | 1,299 | 转发集合 |
| `suggestionList.js` | 1,192 | 建议列表 |
| `searchCollection.js` | 1,088 | 搜索集合 |

---

## 独立渲染应用清单

项目采用多页面应用 (MPA) 模式，共有 26+ 个独立渲染应用：

| 应用名 | 目录 | 说明 |
|--------|------|------|
| `index` | `src/main.js` | 主应用窗口 |
| `start` | `renderer/start/` | 启动/加载页面 |
| `screenshot` | `renderer/screenshot/` | 截图工具 |
| `pictureViewer` | `renderer/pictureViewer/` | 图片查看器 |
| `pictureEditor` | `renderer/pictureEditor/` | 图片编辑器 |
| `fileViewer` | `renderer/fileViewer/` | 文件查看器 |
| `meetingInfo` | `renderer/meetingInfo/` | 会议信息 |
| `meetingInvite` | `renderer/meetingInvite/` | 会议邀请 |
| `meetingPwd` | `renderer/meetingPwd/` | 会议密码 |
| `dialogWin` | `renderer/dialogWin/` | 通用对话框 |
| `mapWin` | `renderer/mapWin/` | 地图窗口 |
| `sso` | `renderer/sso/` | SSO 登录 |
| `toast` | `renderer/toast/` | 通知提示 |
| `storageData` | `renderer/storageData/` | 存储数据管理 |
| `profilePhoto` | `renderer/profilePhoto/` | 头像编辑 |
| `update` | `renderer/update/` | 更新管理 |
| `shortcut` | `renderer/shortcut/` | 快捷键设置 |
| `aiModel` | `renderer/aiModel/` | AI 模型界面 |
| `devicesManagement` | `renderer/devicesManagement/` | 设备管理 |
| `combineChat` | `renderer/combineChat/` | 合并聊天窗口 |
| `callfeedback` | `renderer/callfeedback/` | 通话反馈 |
| `newGuide` | `renderer/newGuide/` | 新手引导 |
| `helpCenter` | `public/helpCenter/` | 帮助中心 |

---

## 文件大小分布

```
大文件 (>50KB):
├── src/main/sdk/meetingSDK.js        # 89KB - 会议SDK核心
├── src/api/messageManger.js          # 171KB - 消息管理器
├── src/api/peerApi.js                # 111KB - 联系人API
├── src/utils/Function.js             # 59KB - 核心函数库
├── src/utils/FileTool.js             # 49KB - 文件工具

中等文件 (20-50KB):
├── src/store/modules/concat.js       # 27KB - 主状态
├── src/store/modules/uiControl.js    # 24KB - UI控制
├── src/utils/dataUtil.js             # 31KB - 数据工具
├── src/api/messageApi.js             # 29KB - 消息API
└── ...

小文件 (<20KB):
├── 大部分组件和工具文件
└── ...
```

---

**最后更新**: 2026-02-05
