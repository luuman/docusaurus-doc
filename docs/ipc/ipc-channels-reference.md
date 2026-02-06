# IPC 通道参考

## 概述

Matrx Windows 客户端注册了大量 IPC 通道，分布在主进程的多个模块中。本文档按功能分类列出所有已识别的 IPC 通道，包括通道名称、注册位置、通信方向、通信模式以及功能说明。此文档可作为开发时的查阅手册。

## 核心文件结构

```
src/
├── background.js                         # 主进程入口，注册约 30+ 通道
├── main/
│   ├── IPCMainChannel.js                # 通用 IPC 通道 (~15 通道)
│   ├── store.js                         # 数据存储通道 (5 通道)
│   ├── mainWindow/index.js              # 主窗口控制通道 (~10 通道)
│   ├── meetingSDK.js                    # 会议 SDK 通道 (~8 通道)
│   ├── screenshot/capture-main.js       # 截图通道 (3 通道)
│   ├── screenshot/WindowManager.js      # 截图桌面源通道 (2 通道)
│   ├── notification.js                  # 通知通道 (1 通道)
│   ├── globalShortcut.js                # 快捷键通道 (2 通道)
│   ├── tray.js                          # 托盘通道 (2 通道)
│   ├── toaster.js                       # Toast 通道 (5 通道)
│   ├── startPage.js                     # SDK 进程管理通道 (8 通道)
│   ├── update/index.js                  # 更新通道 (5 通道)
│   ├── updater.js                       # 更新器通道 (6 通道)
│   ├── winUser32.js                     # Win32 API 通道 (~8 通道)
│   ├── callfeedback/index.js            # 通话反馈通道 (4 通道)
│   ├── forwardDB/appdataUtil.js         # AppData DB 通道 (4 通道)
│   └── ...                              # 其他子窗口模块
└── main/constants.js                    # 通道名称常量
```

## 一、数据存储通道

### electron-store 存储

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `setStore` | `on` | R->M | store.js | 写入 store 值 |
| `updateStore` | `on` | R->M | store.js | 合并更新 store 对象 |
| `getStore-Sync` | `on` (sync) | R->M | store.js | 同步读取 store 值 |
| `getStore` | `on` (sync) | R->M | store.js | 同步读取 store 值（同名不同注册） |
| `getStore` | `handle` | R->M | store.js | 异步读取 store 值 |
| `electronStore` | `on` | R->M | background.js | 初始化 electron-store |

### AppData 存储

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `get-appdataStorage` | `on` (sync) | R->M | IPCMainChannel.js | 从 appdata DB 同步读取数据 |
| `set-appdataStorage` | `on` | R->M | IPCMainChannel.js | 转发 set 操作到主窗口 |
| `mainAppdata-init` | `on` | R->M | forwardDB/appdataUtil.js | 初始化 appdata 数据库 |
| `mainAppdata` | `handle` | R->M | forwardDB/appdataUtil.js | appdata CRUD 操作 |
| `mainAppdata-close` | `on` | R->M | forwardDB/appdataUtil.js | 关闭 appdata 数据库 |
| `syncAppdata` | `on` | R->M | forwardDB/appdataUtil.js | 同步 appdata 到其他进程 |

### 窗口间数据同步

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `GET_CURRENT_WIN_DATA` | `on` (sync) | R->M | IPCMainChannel.js | 获取主窗口 Vuex 数据 |
| `GET_CURRENT_WIN_DATA_RES` | `once` | M内部 | IPCMainChannel.js | 接收主窗口返回的数据 |
| `get-main-data` | `on` | R->M | IPCMainChannel.js | 从子窗口获取主窗口数据 |
| `GET_CURRENT_WIN_SOTRE` | `on` | R->M | background.js | 获取主窗口 store 快照 |
| `GET_CURRENT_WIN_SOTRE_RES` | `once` | M内部 | background.js | 主窗口 store 响应 |
| `changeStorage` | M->R | M->R | store.js / sendTo.js | 广播 storage 变更事件 |

## 二、窗口控制通道

### 主窗口控制

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `WINDOW-CONTROL` | `on` | R->M | background.js | 窗口最小化/最大化/关闭 |
| `GET-IS-MAXIMIZED` | `on` | R->M | background.js | 查询窗口是否最大化 |
| `REPLY-IS-MAXIMIZED` | reply | M->R | background.js | 返回最大化状态 |
| `main-window` | `on` (sync) | R->M | mainWindow/index.js | 查询窗口状态（isVisible/isMinimized）|
| `mainContentId` | `on` (sync) | R->M | mainWindow/index.js | 获取主窗口 webContents ID |
| `showMainWin` | `on` | R->M | mainWindow/index.js | 显示并聚焦主窗口 |
| `openDevTools-main` | `on` | R->M | mainWindow/index.js | 打开主窗口 DevTools |
| `MAIN-WIN-IS-CLOSE` | `on` | R->M | mainWindow/index.js | 设置窗口关闭标志 |
| `SEND-CURRENT-WIN-MSG` | `on` | M内部 | mainWindow/index.js | 主进程内部转发消息到主窗口 |
| `sendTo-main-win` | `on` | R->M | mainWindow/index.js | 转发消息到主窗口渲染进程 |
| `main-window-settings` | `on` | R->M | mainWindow/index.js | 窗口设置（路径/日历模式）|
| `ON_MAINWINDOW_SHOW` | `on` | R->M | background.js | 显示主窗口 |

### 主窗口事件（M->R）

| 通道名 | 方向 | 文件 | 说明 |
|--------|------|------|------|
| `MAXIMIZE_CHANGE` | M->R | mainWindow/index.js | 最大化状态变更通知 |
| `RESIZE_CHANGE` | M->R | mainWindow/index.js | 窗口大小变更通知 |
| `mainwindow-blur` | M->R | mainWindow/index.js | 窗口失焦通知 |
| `MAINWINDOW_FOCUS` | M->R | mainWindow/index.js | 窗口聚焦通知 |
| `ipcSendTrayClear` | M->R | mainWindow/index.js | 清除托盘通知标记 |
| `ipcSendGetPreceiptView` | M->R | mainWindow/index.js | 获取已读回执视图 |

### 子窗口管理通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `shortcut-win` | `on` | R->M | shortcut/index.js | 快捷键设置窗口控制 |
| `update-win` | `on` | R->M | update/index.js | 更新窗口控制 |
| `update-center` | `on` | R->M | update/index.js | 更新窗口消息中转 |
| `SEND-CURRENT-UPDATE-MSG` | `on` | M内部 | update/index.js | 发送消息到更新窗口 |
| `storage-data-win` | `on` | R->M | storageData/index.js | 存储数据窗口控制 |
| `preferences-win` | `on` | R->M | preferences/index.js | 偏好设置窗口控制 |
| `has-preferences-win` | `handle` | R->M | preferences/index.js | 检查偏好设置窗口是否存在 |
| `picture-viewer` | `on` | R->M | pictureViewer/index.js | 图片预览窗口控制 |
| `picture-viewer-handle` | `on` | R->M | pictureViewer/index.js | 图片预览操作 |
| `picture-editor-win` | `on` | R->M | pictureEditor/index.js | 图片编辑器窗口控制 |
| `file-viewer` | `on` | R->M | fileViewer/index.js | 文件预览窗口控制 |
| `help-center-win` | `on` | R->M | helpCenter/index.js | 帮助中心窗口控制 |
| `new-guide-win` | `on` | R->M | newGuide/index.js | 新手引导窗口控制 |
| `profile-photo-win` | `on` | R->M | profilePhoto/index.js | 头像编辑窗口控制 |
| `delete-account-feedback` | `on` | R->M | deleteAccountFeedback/index.js | 删除账号反馈窗口 |
| `dialog-window-main` | `on` | R->M | dialogWin/index.js | 对话框窗口控制 |
| `map-window-main` | `on` | R->M | mapWin/index.js | 地图窗口控制 |
| `devices-management-win` | `on` | R->M | devicesManagement/index.js | 设备管理窗口 |
| `CREATE-APPS-WIN` | `on` | R->M | appsWin/index.js | 创建应用窗口 |
| `SEND-TO-APPS-WIN-MSG` | `on` | R->M | appsWin/index.js | 发送消息到应用窗口 |
| `open-webview` | `on` | R->M | webview/index.js | 打开 webview 窗口 |
| `COMBINE_CHAT` | `on` | R->M | combineChat/index.js | 合并聊天窗口 |
| `get-combine-msgs` | `handle` | R->M | combineChat/index.js | 获取合并消息 |
| `get-robots-msgs` | `handle` | R->M | combineChat/index.js | 获取机器人消息 |

## 三、文件操作通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `SAVE-AS-PIC` | `on` | R->M | background.js | 右键另存为图片 |
| `SAVE-AS-PIC-Res` | send | M->R | background.js | 另存为结果 |
| `OPEN-FILE-LOCATION` | `on` | R->M | background.js | 在资源管理器中显示文件 |
| `SAVE-FILE-CHOOSE-PATH` | `on` | R->M | background.js | 选择文件保存路径 |
| `SAVE-FILE-CHOOSE-PATH-Res` | reply | M->R | background.js | 返回所选路径 |
| `DELETE_FILE` | `on` | R->M | background.js | 删除文件 |
| `OPEN-LOG-FILE` | `on` | R->M | background.js | 选择日志文件 |
| `OPEN-LOG-FILE-BACK` | reply | M->R | background.js | 返回所选日志文件 |
| `chats-setting-open-file` | `on` | R->M | background.js | 打开文件/文件夹 |
| `chats-setting-open-link` | `on` | R->M | background.js | 在浏览器中打开链接 |
| `top-open-dir` | `on` | R->M | background.js | 打开资源管理器目录 |
| `rotate-img` | `on` | R->M | background.js | 图片旋转处理 |
| `rotate-img-Res` | send | M->R | background.js | 旋转结果 |
| `copy-image-to-clipboard` | `on` | R->M | background.js | 复制图片到剪贴板 |
| `start-conversion` | `on` | R->M | pictureViewer/index.js | 文件格式转换 |
| `CHOOSE-DIRECTORY-PATH` | `handle` | R->M | background.js | 选择目录路径 |
| `shell-open-external` | `handle` | R->M | update/index.js | 打开外部 URL |

### 路径管理

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `set-record-path` | `on` | R->M | IPCMainChannel.js | 设置录制路径 |
| `get-document-download-path` | `on` | R->M | IPCMainChannel.js | 获取下载路径 |
| `get-document-download-path-res` | reply | M->R | IPCMainChannel.js | 返回下载路径 |
| `set-document-download-path` | `on` | R->M | IPCMainChannel.js | 选择下载路径 |
| `set-document-download-path-res` | reply | M->R | IPCMainChannel.js | 返回所选下载路径 |
| `set-first-document-download-path` | `on` | R->M | IPCMainChannel.js | 首次设置下载路径 |
| `set-first-document-download-path-res` | reply | M->R | IPCMainChannel.js | 首次设置结果 |
| `change-document-download-path` | `on` | R->M | IPCMainChannel.js | 切换下载路径 |
| `change-document-download-path-res` | reply | M->R | IPCMainChannel.js | 切换结果 |
| `Dialog-Set-Record-Path` | `on` | R->M | dialogOpen.js | 对话框选择录制路径 |
| `Dialog-Set-Record-Path-Res` | reply | M->R | dialogOpen.js | 返回录制路径 |
| `getExePath` | `on` (sync) | R->M | background.js | 获取应用安装路径 |

### 磁盘操作

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `check-disk-space` | `on` | R->M | background.js | 检查磁盘可用空间 |
| `check-disk-space-Res` | reply | M->R | background.js | 磁盘空间结果 |
| `get-logical-disk` | `on` | R->M | background.js | 获取逻辑磁盘列表 |
| `get-logical-disk-Res` | reply | M->R | background.js | 磁盘列表结果 |

### 剪贴板

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `clipboad-multiple-get` | `handle` | R->M | IPCMainChannel.js | 获取剪贴板中的文件路径列表 |
| `set-clipboad-multiple` | `on` | R->M | IPCMainChannel.js | 设置剪贴板文件路径 |

## 四、会议 SDK 通道

### SDK 初始化与控制

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `CST_SDK_INIT_CONFIG` | `on` | R->M | meetingSDK.js | SDK 初始化配置 |
| `CST_SDK_JOIN_MEETING` | `on` | R->M | meetingSDK.js | 加入会议 |
| `CST_SDK_CALL_MEETING` | `on` | R->M | meetingSDK.js | 发起会议 |
| `SDK_GET_MEETING_NOW_STATE` | `on` | R->M | meetingSDK.js | 获取当前会议状态 |
| `CST_SDK_SEND_FUNCTION` | `on` | R->M | meetingSDK.js | SDK 通用功能调用 |
| `CST_SDK_PARSE_LIVE_LINK_SYNC` | `on` | R->M | meetingSDK.js | 解析直播链接 |
| `MEETING_INFO_REFRESH_DATA` | `on` | R->M | meetingSDK.js | 刷新会议信息 |
| `CST-Conf-Add-Attendee` | `on` | R->M | meetingSDK.js | 添加会议参与者 |
| `sdkContentId` | `on` (sync) | R->M | background.js | 获取 SDK 进程 ID |

### SDK 进程通道（渲染进程间通信）

| 通道名 | 方向 | 文件 | 说明 |
|--------|------|------|------|
| `sdk-log-util-ok` | SDK->R | ipcSend.js | SDK 日志工具就绪 |
| `sdk-process-ok` | SDK->R | ipcSend.js | SDK 进程就绪 |
| `hwm-process-ok` | SDK->R | ipcSend.js | HWM 进程就绪 |
| `MAIN_TO_SDK` | M->SDK | mainToPage.js | 主进程到 SDK 的请求 |

### 会议信息窗口

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `MEETING_INFO_CREATE_WINDOW` | `on` | R->M | meetingInfo/onMeetingInfoChannel.js | 创建会议信息窗口 |
| `MEETING_INFO_CLOSE_WINDOW` | `on` | R->M | meetingInfo/onMeetingInfoChannel.js | 关闭会议信息窗口 |
| `MEETING_INFO_HIDE_WINDOW` | `on` | R->M | meetingInfo/onMeetingInfoChannel.js | 隐藏会议信息窗口 |
| `MEETING_INFO_REFRESH_DATA` | `on` | R->M | meetingInfo/onMeetingInfoChannel.js | 刷新会议信息数据 |
| `MEETING_INFO_SET_SIZE` | `on` | R->M | meetingInfo/onMeetingInfoChannel.js | 设置窗口大小 |

### 会议邀请与投票

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `meeting-invite` | `on` | R->M | meetingInvite/index.js | 会议邀请窗口控制 |
| `meeting-invite-error` | `on` | R->M | meetingInviteError/index.js | 会议邀请错误窗口 |
| `meeting-vote` | `on` | R->M | meetingVote/index.js | 会议投票窗口控制 |
| `meeting-pwd` | `on` | R->M | meetingPwd/index.js | 会议密码窗口控制 |
| `white-board-share` | `on` | R->M | meetingWhiteboardShare/index.js | 白板共享窗口 |
| `LINK-JOIN-MEETING` | send | M->R | background.js | 协议链接加入会议 |
| `LINK-JOIN-MEETING-RES` | `on` | R->M | background.js | 链接加入完成 |

### 通话质量反馈

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `SET_CALL_FEEDBACK` | `on` | R->M | callfeedback/index.js | 设置通话反馈 |
| `callfeedback` | `handle` | R->M | callfeedback/index.js | 通话反馈操作 |
| `get-Feedback` | `handle` | R->M | callfeedback/index.js | 获取反馈数据 |
| `set-Feedback` | `on` | R->M | callfeedback/index.js | 写入反馈数据 |
| `set-win32ComputerSystem` | `on` | R->M | callfeedback/index.js | 设置系统信息 |

### E2EE 加密会议

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `OPEN_E2EECODE_WIN` | `on` | R->M | e2eeMeeting/index.js | 打开 E2EE 验证码窗口 |
| `SHOW_E2EECODE_WIN` | `on` | R->M | e2eeMeeting/index.js | 显示 E2EE 窗口 |
| `HIDE_E2EECODE_WIN` | `on` | R->M | e2eeMeeting/index.js | 隐藏 E2EE 窗口 |
| `CLOSE_E2EECODE_WIN` | `on` | R->M | e2eeMeeting/index.js | 关闭 E2EE 窗口 |
| `SET_E2EECODE_WIN` | `on` | R->M | e2eeMeeting/index.js | 设置 E2EE 窗口大小 |

## 五、截图功能通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `capture-screen` | `on` | R->M | screenshot/capture-main.js | 截图控制（多 type 复用） |
| `capture-screen` | `handle` | R->M | screenshot/capture-main.js | 截图异步操作 |
| `powerMonitor-screenshot` | `on` | R->M | screenshot/capture-main.js | 电源管理触发截图重置 |
| `screenshotDesktop` | `handle` | R->M | screenshot/WindowManager.js | 获取桌面截图 |
| `desktop-getSources` | `handle` | R->M | screenshot/WindowManager.js | 获取桌面源列表 |
| `PASTE_CAPTURE_IMG` | send | M->R | screenshot/capture-main.js | 截图完成后粘贴图片 |

`capture-screen` 通道通过 `type` 字段复用了多种操作：

```javascript
// type 枚举值
'start'             // 开始截图
'complete'          // 截图完成
'select'            // 选择截图区域
'reset'             // 重置截图状态
'preselection'      // 预选区域
'close'             // 关闭截图
'Escape'            // ESC 键取消
'register-shortcut' // 注册快捷键
'reset-capture'     // 重置截图模块
'getCursorScreenPoint' // 获取光标位置 (sync)
'getBounds'         // 获取窗口边界 (sync)
'getOpacity'        // 获取窗口透明度 (sync)
'getDisplayBounds'  // 获取显示器边界 (sync)
'getCurrentScreen'  // 获取当前屏幕 (sync)
'getPrimaryDisplay' // 获取主显示器 (sync)
'isRegistered'      // 检查快捷键注册 (sync)
'unregister'        // 注销快捷键 (sync)

// handle 模式的 type 枚举
'focus'             // 聚焦截图窗口
'setOpacity'        // 设置透明度
'setIgnoreMouseEvents' // 设置忽略鼠标事件
'setBounds'         // 设置边界
'showSaveDialog'    // 显示保存对话框
'writeFile'         // 写入文件
```

## 六、系统功能通道

### 快捷键

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `isRegistered_keys` | `on` | R->M | globalShortcut.js | 检查快捷键是否已注册 |
| `isRegistered_keys_RES` | reply | M->R | globalShortcut.js | 返回注册状态 |
| `unregister_keys` | `on` | R->M | globalShortcut.js | 注销快捷键 |

### 通知

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `showNotification` | `on` | R->M | notification.js | 显示系统通知（有节流） |
| `notification-send` | send | M->R | notification.js | 通知事件回传（show/click） |
| `Notification-Click` | `on` | R->M | background.js | 通知点击恢复窗口 |

### 系统托盘

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `setTraySetImage` | `on` | R->M | tray.js | 设置托盘图标（有/无消息） |
| `ipc_show_context_menu` | `on` | R->M | tray.js | 显示右键菜单 |

### Toast 提示

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `electron-toast` | `on` | R->M | toaster.js | 显示 Toast 提示 |
| `electron-show-toast-win` | `on` | R->M | toaster.js | 显示 Toast 窗口 |
| `electron-hide-toast-win` | `on` | R->M | toaster.js | 隐藏 Toast 窗口 |
| `electron-close-toast-win` | `on` | R->M | toaster.js | 关闭 Toast 窗口 |
| `electron-set-toast-win` | `on` | R->M | toaster.js | 设置 Toast 窗口大小 |
| `toast-win-query` | send | M->R | toaster.js | 发送 Toast 数据到窗口 |

### 应用更新

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `start-checkUpdate` | `on` | R->M | updater.js | 开始检查更新 |
| `sys:continueUpdate` | `on` | R->M | updater.js | 继续更新 |
| `sys:cancelUpdate` | `on` | R->M | updater.js | 取消更新 |
| `sys:updateNow` | `on` | R->M | updater.js | 立即更新 |
| `sys:updateLater` | `on` | R->M | updater.js | 稍后更新 |
| `sys:skipUpdater` | `on` | R->M | updater.js | 跳过此版本 |
| `sys:nowRestart` | `on` | R->M | updater.js | 立即重启 |
| `sys:win32ComputerSystem` | `handle` | R->M | IPCMainChannel.js | 获取系统信息 |
| `check-update-window` | `handle` | R->M | update/index.js | 检查更新窗口是否存在 |

## 七、用户数据通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `REMOVE_USER_DATA` | `on` | R->M | IPCMainChannel.js | 删除用户数据 |
| `CLEAR-TEMP-USER` | send | M->R | tray.js | 请求清理临时用户数据 |
| `CLEAR-TEMP-USER-RES` | `on` | R->M | background.js | 清理完成，退出应用 |
| `CLEAR_COOKIE` | `on` | R->M | background.js | 清除 Cookie |
| `CLEAR_LOCAL_STORAGE` | `on` (sync) | R->M | background.js | 清除 localStorage |
| `UUID_REQUEST` | `handle` | R->M | background.js | 获取设备 UUID |

## 八、加密通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `Encryptd-Content` | `on` | R->M | background.js | AES-GCM 加密 |
| `Encryptd-Content-Res` | reply | M->R | background.js | 加密结果 |
| `Decryptd-Content` | `on` | R->M | background.js | AES-GCM 解密 |
| `Decryptd-Content-Res` | reply | M->R | background.js | 解密结果 |
| `ipc_decrypt_public` | `on` | R->M | background.js | RSA 公钥解密 |
| `ipc_decrypt_public_back` | reply | M->R | background.js | 公钥解密结果 |

## 九、应用生命周期通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `UPDATE_AND_QUIT_APP` | `on` | R->M | background.js | 更新后退出 |
| `MAIN_APP_RESART` | `on` | R->M | background.js | 重启应用 |
| `ipcChangeAppLang` | `on` | R->M | background.js | 切换语言并重启 |
| `SET_AUTO_LAUNCH` | `on` | R->M | background.js | 设置开机自启 |
| `GET_LOGIN_ITEM_SETTING` | `handle` | R->M | background.js | 获取自启设置 |
| `client-view-ready` | `on` | R->M | background.js | 客户端视图就绪 |

### 崩溃检测

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `get-pre-crash-log` | `on` | R->M | IPCMainChannel.js | 获取上次崩溃日志 |
| `get-pre-crash-log-res` | reply | M->R | IPCMainChannel.js | 崩溃日志结果 |
| `set-pre-crash-log` | `on` | R->M | IPCMainChannel.js | 记录崩溃日志 |

## 十、日志与调试通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `log` | `on` | R->M | background.js | 写入 infoLog |
| `initKey` | `on` | R->M | background.js | 初始化日志密钥 |
| `getLogFile` | `on` | R->M | background.js | 获取日志文件路径 |
| `gotLogFile` | reply | M->R | background.js | 返回日志路径 |
| `start-page-log` | `on` | R->M | startPage.js | SDK 进程日志 |
| `openDevTools-start` | `on` | R->M | startPage.js | 打开 SDK 进程 DevTools |
| `Fire_Base_Fire_Name` | `on` | R->M | background.js | 数据埋点事件 |
| `fireBaseFireName` | send | M->R | background.js | 转发埋点到渲染进程 |
| `getAppMetrics` | `on` | M内部 | memoryUsage.js | 获取进程性能指标 |

## 十一、SDK 进程管理通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `start-page-load` | `on` | R->M | startPage.js | 加载 SDK 进程 |
| `start-page-hide` | `on` | R->M | startPage.js | 隐藏 SDK 窗口 |
| `start-page-reload` | `on` | M内部 | startPage.js | 重载 SDK 进程 |
| `start-page-close` | `on` | M内部 | startPage.js | 关闭 SDK 进程 |
| `start-page-set` | `on` | R->M | startPage.js | 设置 SDK 窗口尺寸 |
| `start-page-send` | `on` | M内部 | startPage.js | 发送消息到 SDK 进程 |

## 十二、Win32 原生 API 通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `GET_SCREEN_RECT_SIZE` | `on` | R->M | winUser32.js | 获取屏幕矩形尺寸 |
| `GET_SCREEN_ACTIVE_WINDOW` | `handle` | R->M | winUser32.js | 获取当前活动窗口 |
| `GET_NAME_WINDOW_ON_TOP` | `handle` | R->M | winUser32.js | 按名称获取置顶窗口 |
| `GET_ACTIVE_WINDOW` | `handle` | R->M | winUser32.js | 获取活动窗口 |
| `GET_HWND_WINDOW_ON_TOP` | `handle` | R->M | winUser32.js | 按句柄置顶窗口 |
| `SET_WINDOW_HWND_ACTIVE` | `on` | R->M | winUser32.js | 激活窗口（按句柄） |
| `SET_NAME_WINDOW_ACTIVE` | `on` | R->M | winUser32.js | 激活窗口（按名称） |
| `SET_RESTART_USER32` | `on` | R->M | winUser32.js | 重启 user32 模块 |
| `SET_WINDOW_LONG` | `on` | R->M | winUser32.js | 设置窗口 long 属性 |
| `user32` | `on` | R->M | winUser32.js | 通用 user32 操作 |

## 十三、SSO 与认证通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `OPEN_SSO_WIN` | `on` | R->M | ssoWin.js | 打开 SSO 登录窗口 |
| `MATRX_SIGNIN` | `on` | R->M | ssoWin.js | SSO 登录完成 |
| `CLOSE_SSO_WIN` | `on` | R->M | ssoWin.js | 关闭 SSO 窗口 |
| `SEND_SSO_DATA` | send | M->R | background.js | 发送 SSO 数据到渲染进程 |

## 十四、证书验证通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `CHANGE_CERTIFICATEVERIFY_CONFIG` | `on` | R->M | certs/useCertificateVerifyProc.js | 更新证书验证配置 |
| `CHANGE_CERTIFICATEVERIFY_CONFIG_FIRST` | `on` | R->M | certs/useCertificateVerifyProc.js | 首次证书配置 |
| `CHANGE_CERTIFICATEVERIFY_CONFIG_WSS` | `on` | R->M | certs/useCertificateVerifyProc.js | WSS 证书配置 |

## 十五、AI 模型通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `ai-model` | `on` | R->M | aiModel/index.js | AI 模型窗口控制 |
| `get-ai-new-id` | `handle` | R->M | aiModel/index.js | 创建 AI 对话 ID |
| `get-ai-list` | `handle` | R->M | aiModel/index.js | 获取 AI 对话列表 |
| `delete-ai-conversation` | `handle` | R->M | aiModel/index.js | 删除 AI 对话 |
| `get-ai-message` | `handle` | R->M | aiModel/index.js | 获取 AI 消息 |
| `delete-ai-message` | `handle` | R->M | aiModel/index.js | 删除 AI 消息 |
| `get-ai-file` | `handle` | R->M | aiModel/index.js | 获取 AI 文件 |
| `get-ai-file-upload` | `handle` | R->M | aiModel/index.js | AI 文件上传 |
| `get-ai-file-down` | `handle` | R->M | aiModel/index.js | AI 文件下载 |
| `get-ai-chart` | `handle` | R->M | aiModel/index.js | 获取 AI 图表 |

## 十六、机器人通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `electron-show-robot-win` | `on` | R->M | robotPage.js | 显示机器人窗口 |
| `robot-win-show` | `on` | R->M | robotPage.js | 机器人窗口显示 |
| `get-priview-temp-url` | `on` | R->M | robotPage.js | 获取预览临时 URL |
| `IPC_SET_PREVIEW_TEMP_URL` | `on` | R->M | robotPage.js | 设置预览临时 URL |
| `robot-win-executeJavaScript` | `on` | R->M | robotPage.js | 执行 JavaScript |
| `electron-close-robot-win` | `on` | R->M | robotPage.js | 关闭机器人窗口 |

## 十七、其他通道

| 通道名 | 模式 | 方向 | 文件 | 说明 |
|--------|------|------|------|------|
| `syncMsg` | `send` | R->M | IPCRenderChannel.js | 同步消息（登录成功） |
| `sqliteRsp` | M->R | M->R | IPCRenderChannel.js | SQLite 操作响应 |
| `switch-space` | `on` | R->M | 多个模块 | 切换空间时关闭相关窗口 |
| `MenuforSentInput` | `on` | R->M | mainMenu.js | 菜单发送输入 |
| `init-Loading-App` | `on` | M内部 | appLoading.js | 初始化加载界面 |
| `Remove-Loading-App` | `on` | M内部 | appLoading.js | 移除加载界面 |

## 通道统计

根据以上分析，项目中共注册了约 **180+** 个 IPC 通道，其中：

- `ipcMain.on` 注册约 **130** 个
- `ipcMain.handle` 注册约 **25** 个
- 同步通道（`returnValue`）约 **15** 个
- 主进程到渲染进程的推送通道约 **30** 个

主要的通道分布模块：
- `background.js`：约 30 个
- `mainWindow/index.js`：约 10 个
- `IPCMainChannel.js`：约 15 个
- `meetingSDK.js`：约 8 个
- 各子窗口模块：平均每个 2-5 个
