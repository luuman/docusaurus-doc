# 组件库概述

## 概述

Matrx Windows 客户端基于 Electron 20 + Vue 2 构建，组件库位于 `src/components/` 目录下。整个组件体系围绕 IM 聊天、布局导航、弹窗交互、通用基础四大类进行组织，共包含约 35 个一级目录和若干顶层单文件组件。组件采用局部注册与全局注册相结合的方式，全局组件在 `src/main.js` 中通过 `Vue.component()` 统一注册，业务组件则在各自的父组件中按需引入。

## 核心文件结构

```
src/components/
  Approval/                  # 审批组件
  Calendar/                  # 日历组件（周视图/月视图）
  Chat/                      # 聊天消息组件集合（消息卡片、语音、视频、文件等）
  ChatHead.vue               # 会话头部（会话名称、操作栏）
  common/                    # 通用基础组件（SvgIcon、AudioPlayer、WindowControls 等）
  contact/                   # 联系人相关
  ContactBreadcrumb.vue      # 联系人面包屑导航
  ContactList/               # 联系人列表
  contacts/                  # 联系人模块
  ContextMenu/               # 右键菜单（基于 tippy.js）
  DateFormPicker/             # 日期表单选择器
  Dialog/                    # 业务对话框（下载、远程登录、添加成员等）
  DialogCell.vue             # 会话列表单元格
  EmojisPannel/              # 表情面板（选择器、表情反应）
  Example/                   # 示例组件
  FloatTip.vue               # 浮动提示
  GroupPin/                   # 群组置顶消息
  InputNumberSelect.vue      # 数字选择输入
  kits/                      # 工具组件集合（ContactCard、TDialog、Icon 等 21 个）
  Layout/                    # 布局组件（TopMenu）
  LeftMenuBar.vue            # 左侧主导航菜单
  Map/                       # 地图组件
  Meeting/                   # 会议相关组件
  MessageInput/              # 消息输入框
  MultiSpace/                # 多空间管理
  Nickname/                  # 昵称显示
  Notify/                    # 通知组件（账号迁移等）
  Panel/                     # 面板组件（ChatsPanel、ContactsPanel、MeetingsPanel 等）
  PayUpgrade/                # 付费升级
  Portrait/                  # 头像组件
  ReadProgress/              # 已读进度
  RecentList.vue             # 最近列表
  RenderName.vue             # 名称渲染（全局注册）
  ReplyListPannel.vue        # 回复列表面板
  RichText/                  # 富文本编辑器
  RightContentPanel.vue      # 右侧消息面板（核心聊天区域）
  RightHandNameCard/         # 右侧名片卡
  RightMessageEdit.vue       # 消息编辑（编辑已发送消息）
  RightTitlePanel.vue        # 右侧标题面板
  Scrollbar/                 # 自定义滚动条（封装 el-scrollbar）
  ScrollPane/                # 滚动面板（IntersectionObserver 驱动）
  SearchBar/                 # 搜索栏（含频道/联系人/文件/消息搜索子组件）
  SessionList.vue            # 会话列表
  SesstionNotice.vue         # 会话通知
  settings/                  # 设置相关组件
  TextTooltip.vue            # 文本溢出提示
  TimeChat.vue               # 时间聊天组件
  TimeTip.vue                # 时间提示
  TitleBar.vue               # 标题栏
  Tooltip/                   # 提示工具（封装 el-tooltip）
  TopMenuBar.vue             # 顶部菜单栏
  TroubleShooting.vue        # 故障排查
  updater/                   # 更新器组件
  ViewScroll.vue             # 虚拟滚动容器（消息列表核心）
```

## 组件分类

### 聊天核心组件

与 IM 消息收发、展示直接相关的组件，构成聊天功能的核心界面：

| 组件 | 文件 | 说明 |
|------|------|------|
| ChatHead | `ChatHead.vue` | 会话头部，显示会话名称、音视频通话按钮、群设置入口 |
| RightContentPanel | `RightContentPanel.vue` | 右侧消息面板，集成消息列表、输入框、右键菜单 |
| RightMessageEdit | `RightMessageEdit.vue` | 消息编辑器，用于编辑已发送的消息 |
| SessionList | `SessionList.vue` | 会话列表，展示置顶/最近会话，支持右键菜单和拖拽排序 |
| DialogCell | `DialogCell.vue` | 会话列表中的单个会话项，显示头像、名称、最后消息 |
| ReplyListPannel | `ReplyListPannel.vue` | 回复线程面板，展示消息回复链 |
| Chat/ | `Chat/` 目录 | 约 50 个消息类型组件（文本、图片、语音、文件、会议卡片等） |

### 布局与导航组件

控制应用整体布局结构和导航逻辑：

| 组件 | 文件 | 说明 |
|------|------|------|
| LeftMenuBar | `LeftMenuBar.vue` | 左侧主菜单，包含头像、在线状态、功能模块切换 |
| Panel/ | `Panel/` 目录 | 各功能面板容器（聊天、联系人、会议、日历、审批、应用） |
| Layout/ | `Layout/TopMenu/` | 顶部菜单（快速访问面板、空间下拉列表） |
| Scrollbar | `Scrollbar/index.vue` | 自定义滚动条，封装 el-scrollbar |
| ScrollPane | `ScrollPane/` | 基于 IntersectionObserver 的滚动面板 |
| ViewScroll | `ViewScroll.vue` | 虚拟滚动容器，配合 infinite-scroll 实现消息加载 |

### 对话框与弹窗组件

承载各种模态交互和上下文操作：

| 组件 | 文件 | 说明 |
|------|------|------|
| Dialog/ | `Dialog/` 目录 | 业务对话框（下载文件、远程登录提醒、添加成员等） |
| ContextMenu | `ContextMenu/index.vue` | 右键菜单，基于 tippy.js 实现 |
| Tooltip | `Tooltip/index.vue` | 提示工具，封装 el-tooltip 并修复 auto-focus 问题 |
| Notify | `Notify/` 目录 | 通知类组件（账号迁移） |
| DialogCheckList | `common/DialogCheckList/` | 通用选人对话框，支持新建聊天、创建群组、转发等场景 |

### 通用基础组件

可跨业务模块复用的基础组件：

| 组件 | 文件 | 说明 |
|------|------|------|
| SvgIcon | `common/SvgIcon/` | SVG 图标组件（全局注册） |
| EmptyIcon | `common/EmptyIcon.vue` | 空状态占位图（支持深色/浅色主题） |
| Portrait | `Portrait/Portrait.vue` | 用户头像 |
| SearchBar | `SearchBar/SearchBar.vue` | 搜索栏 |
| TextTooltip | `TextTooltip.vue` | 文本溢出时自动显示完整内容的提示 |
| WindowControls | `common/WindowControls.vue` | 窗口控制按钮（最小化/最大化/关闭） |
| AudioPlayer | `common/AudioPlayer.vue` | 音频播放器 |
| PanelSplit | `common/PanelSplit.vue` | 面板拖拽分割器 |
| kits/ | `kits/` 目录 | 21 个工具组件（ContactCard、TDialog、Icon、CodeInput 等） |

## 全局注册方式

在 `src/main.js` 中，以下组件通过 `Vue.component()` 进行全局注册，可在任意模板中直接使用：

```javascript
// src/main.js
Vue.component('RecycleScroller', RecycleScroller);   // 虚拟列表回收滚动
Vue.component('DynamicScroller', DynamicScroller);    // 动态高度虚拟列表
Vue.component('DynamicScrollerItem', DynamicScrollerItem);
Vue.component('Scrollbar', Scrollbar);                // 自定义滚动条
Vue.component('Tooltip', Tooltip);                    // 提示工具
Vue.component('RenderName', RenderName);              // 名称渲染
Vue.component('SvgIcon', SvgIcon);                    // SVG 图标
Vue.component('EmptyIcon', EmptyIcon);                // 空状态图标

Vue.use(Alert);             // 表情弹窗插件 (vue-emojis)
Vue.use(contextmenu);       // 右键菜单指令 (v-contextmenu)
Vue.use(infiniteScroll);    // 无限滚动指令 (v-infinite-scroll)
Vue.directive('loading', LoadingDirective);  // 自定义 loading 指令
```

## 命名规范

### 文件命名

- **目录组件**：使用 PascalCase 命名目录，入口文件为 `index.vue` 或 `index.js`（如 `Scrollbar/index.vue`）
- **单文件组件**：使用 PascalCase 命名（如 `ChatHead.vue`、`SessionList.vue`）
- **工具组件**：位于 `kits/` 目录下，同样使用 PascalCase（如 `ContactCard.vue`、`TDialog.vue`）

### 组件 name 属性

所有组件的 `name` 选项与文件名保持一致，使用 PascalCase：

```javascript
export default {
    name: 'SessionList',    // 与文件名 SessionList.vue 一致
    // ...
}
```

### Props 命名

Props 使用 camelCase 命名，模板中可以用 kebab-case 传入：

```javascript
props: {
    iconClass: { type: String, required: true },
    searchPlaceholder: { type: String, default: 'Search' }
}
```

### 事件命名

自定义事件使用 camelCase 或 kebab-case，与 Vue 2 规范保持一致：

```javascript
this.$emit('editSend', data);
this.$emit('drag-split', newWidth);
```

## 子渲染进程组件

除主渲染进程外，Matrx 还为以下子窗口独立注册了组件：

| 渲染进程 | 路径 | 全局组件 |
|---------|------|---------|
| shortcut | `src/renderer/shortcut/` | SvgIcon |
| meetingInfo | `src/renderer/meetingInfo/` | SvgIcon |
| devicesManagement | `src/renderer/devicesManagement/` | ElButton, SvgIcon |
| meetingWhiteboardShare | `src/renderer/meetingWhiteboardShare/` | RenderName, SvgIcon |
| pictureEditor | `src/renderer/pictureEditor/` | Tooltip, ElButton, SvgIcon |
| combineChat | `src/renderer/combineChat/` | RenderName, SvgIcon, Tooltip |
| sso | `src/renderer/sso/` | SvgIcon |
| aiModel | `src/renderer/aiModel/` | RenderName |
