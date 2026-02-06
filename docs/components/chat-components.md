# 聊天组件

## 概述

聊天组件构成了 Matrx Windows 客户端最核心的 IM 交互界面。这组组件协同工作，实现了完整的会话列表展示、消息浏览、消息编辑、回复线程等功能。各组件之间通过 Vuex 状态管理和 Vue Bus 事件总线进行通信。

## 核心文件结构

```
src/components/
  ChatHead.vue               # 会话头部（名称、操作按钮）
  RightContentPanel.vue      # 右侧消息面板（消息列表+输入框，核心组件）
  RightMessageEdit.vue       # 消息编辑器（编辑已发送消息）
  SessionList.vue            # 会话列表（置顶/最近分组）
  DialogCell.vue             # 会话列表单元格
  ReplyListPannel.vue        # 回复线程面板
  ViewScroll.vue             # 虚拟滚动容器
  Chat/                      # 消息类型组件集合
    MessageComponents/       # 消息组件注册中心
    ChatItem.jsx             # 聊天项容器
    MessageTxtChat.vue       # 文本消息
    MessageTxtRichChat.jsx   # 富文本消息
    PictureChat.vue          # 图片消息
    DocumentChat.vue         # 文件消息
    VoiceChat/               # 语音消息
    CombineChat.vue          # 合并转发消息
    MeetingCard.vue          # 会议卡片
    MeetingInviteChat.vue    # 会议邀请消息
    NameCard.vue             # 名片消息
    EventChat.vue            # 事件消息
    CallRecordChat.vue       # 通话记录
    ReplyPannel.vue          # 回复引用面板
    SuggestionPannel.vue     # @建议面板
    Typing.vue               # 正在输入提示
    Backtarget.vue           # 回到最新消息按钮
    ...（约 50 个子组件）
  MessageInput/
    MessageInput.vue         # 消息输入框
  EmojisPannel/
    EmojisPannel.vue         # 表情面板（选择器入口）
    EmojiPannel.jsx          # 表情面板核心渲染
    EmojisReaction.vue       # 表情反应组件
```

## ChatHead - 会话头部

### 文件位置

```
src/components/ChatHead.vue
```

### 功能说明

ChatHead 是聊天界面顶部的会话信息栏，负责显示当前会话名称、正在输入状态、以及一系列操作按钮。根据会话类型（单聊/群聊/订阅号）动态显示不同的操作项。

### 模板结构

```html
<section class="dialog-head-container">
  <!-- 会话名称与正在输入状态 -->
  <div class="chatname">{{ viewChatName }}</div>
  <Typing v-if="currentTypeState" />

  <!-- 操作按钮组 -->
  <div class="action_option">
    <!-- 阅后即焚定时器 -->
    <div class="destruct-time" v-if="peerInterval" />

    <!-- 单聊操作：音频通话、视频通话 -->
    <template v-if="!isSubscribe && !isUserSelf">
      <SvgIcon iconClass="ic_Call" @click.native="audioMeetingChat" />
      <SvgIcon iconClass="ic_chat__meeting" @click.native="videoMeetingChat" />
    </template>

    <!-- 群聊操作：添加成员、置顶消息、公告 -->
    <template v-if="isGroup">
      <SvgIcon iconClass="ic_chat_add-people" @click.native="addMemberFunc" />
      <SvgIcon iconClass="ic_chat_pin" @click.native="pinnMessageFunc" />
      <SvgIcon iconClass="ic_Announcement" @click.native="openAnnouncementRight" />
    </template>

    <!-- 通用：设置按钮 -->
    <SvgIcon iconClass="ic_chat_settings" @click.native="optionHandle" />
  </div>
</section>
```

### 关键 Props

| Prop | 类型 | 说明 |
|------|------|------|
| isE2EFaile | Boolean | E2EE 加密会话是否失败 |

### 关键 Events

| Event | 说明 |
|-------|------|
| meetingInvite | 发起会议邀请，携带会议类型参数 |

### 核心逻辑

- 根据 `isGroup`、`isSubscribe`、`isUserSelf` 条件渲染不同操作按钮
- 通过 Vuex 状态 `currentTypeState` 实时显示对方"正在输入"状态
- 音视频通话按钮根据会议状态决定是否可点击（`meetingButtonClassname`）
- 群聊的置顶消息和公告入口带有未读标识提示

## RightContentPanel - 右侧消息面板

### 文件位置

```
src/components/RightContentPanel.vue
```

### 功能说明

RightContentPanel 是整个聊天界面最核心也是最复杂的组件（约 7000+ 行），负责消息列表的渲染、消息发送、文件传输、右键菜单、回复、编辑等核心交互。

### 模板层级结构

```
RightContentPanel
  el-dialog (群置顶确认弹窗)
  SendFileDialog (文件发送确认)
  RecipientCard (已读回执卡片)
  ChatHead (会话头部)
  TimeTip (时间提示)
  ViewScroll (虚拟滚动容器)
    component :is="dd" (动态消息组件)
    RightMessageEdit (消息编辑)
  ReplyListPannel (回复线程)
  GroupPinPannel (群置顶消息面板)
  RightClickOption (右键菜单)
  PanelSplit (输入框拖拽分隔)
  reply-pannel (回复引用)
  MessageInput (消息输入)
```

### 核心功能模块

1. **消息列表渲染**：通过 `ViewScroll` 实现无限滚动，支持上拉加载历史、下拉加载更新
2. **消息发送**：集成 `MessageInput` 输入框，支持文本、文件、表情、@提及
3. **消息右键菜单**：`RightClickOption` 提供复制、回复、转发、删除、编辑等操作
4. **消息编辑**：`RightMessageEdit` 支持编辑已发送的消息
5. **回复线程**：`ReplyListPannel` 展示消息的回复链
6. **群置顶**：`GroupPinPannel` 管理群组置顶消息
7. **已读回执**：`RecipientCard` 显示消息的已读/未读成员列表

### 关键 Vuex 状态依赖

```javascript
// uiControl 模块
actDialogUid       // 当前会话对方 UID
actDialogId        // 当前会话 ID
chatContextMenuVisible  // 右键菜单可见性

// concat 模块
channels           // 群组频道信息
```

## RightMessageEdit - 消息编辑器

### 文件位置

```
src/components/RightMessageEdit.vue
```

### 功能说明

当用户对已发送的消息执行"编辑"操作时，RightMessageEdit 以 inline 方式显示在该消息下方，提供 contenteditable 编辑区域。

### Props

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| chatInfo | Object | 是 | 被编辑的消息对象 |
| currentInputHeight | Number | 否 | 当前输入框高度 |

### Events

| Event | 参数 | 说明 |
|-------|------|------|
| editSend | 编辑后的消息数据 | 提交编辑 |
| editClear | - | 取消编辑 |
| metion | event, matches | @提及触发 |

### 核心逻辑

```javascript
// 监听键盘事件进行 @ 自动补全
onKeyEvent(event) {
    const text = selection.anchorNode.data.slice(0, selection.anchorOffset);
    const matches = text.match(this.autoCompleteRegEx);
    if (matches && matches[2] == '@') {
        this.$emit('metion', event, matches);
    }
}

// 使用 Editor 工具类处理富文本操作
editor: null  // 通过 @/utils/editor 初始化
```

- 使用 `contenteditable` 实现富文本编辑
- 内置 `@/utils/editor` 工具类处理光标、插入 @mention 等操作
- 支持表情选择、粘贴处理
- Enter 键提交编辑，带有 `canSend` 空内容校验

## SessionList - 会话列表

### 文件位置

```
src/components/SessionList.vue
```

### 功能说明

SessionList 是左侧面板中的会话列表组件，负责展示用户的所有活跃会话。会话按"置顶"和"最近"两个分组显示，每个会话项使用 `DialogCell` 组件渲染。

### 模板结构要点

```html
<div class="session-left" :style="`width: ${currentWidth}px;`">
  <!-- 右键菜单 -->
  <v-contextmenu ref="contextmenu">
    <v-contextmenu-item v-for="item in menuRecent" />
  </v-contextmenu>

  <!-- 连接状态提示 -->
  <div class="chat-connect-state">
    <span v-if="connectState === 'Disconnected'">断线</span>
  </div>

  <!-- 会话列表 -->
  <el-collapse v-model="activeNames">
    <!-- 置顶分组 -->
    <el-collapse-item name="pinned">
      <li v-for="sessionItem in pinnedDialogList">
        <DialogCell :dialog="sessionItem" />
      </li>
    </el-collapse-item>

    <!-- 最近分组 -->
    <el-collapse-item name="recent">
      <li v-for="sessionItem in recentDialogList">
        <DialogCell :dialog="sessionItem" />
      </li>
    </el-collapse-item>
  </el-collapse>
</div>
```

### 关键功能

- **宽度可调**：通过 `currentWidth` 控制面板宽度，配合 `PanelSplit` 实现拖拽调整
- **右键菜单**：使用 `v-contextmenu` 指令，支持置顶/取消置顶、静音、删除会话等操作
- **连接状态**：顶部显示 `Disconnected`/`Connecting` 等网络状态
- **列表分组**：通过 `el-collapse` 将会话分为 `pinned`（置顶）和 `recent`（最近）两组
- **拖拽文件**：会话项支持 `dragenter`/`dragleave` 事件，可将文件拖入指定会话

## DialogCell - 会话单元格

### 文件位置

```
src/components/DialogCell.vue
```

### 功能说明

DialogCell 是 SessionList 中每个会话项的渲染组件，显示头像、名称、最后一条消息摘要、时间和徽标。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| dialog | Object | 会话数据对象 |
| index | String | 会话 HID |
| currentReadToken | String | 当前已读标记 |
| status | String | 会话状态 |
| choosed | Boolean | 是否选中 |

### 关键子组件

- `AvatarWithStatus`：带在线状态的头像
- `MessageTip`：最后消息摘要（来自 `kits/MessageTip`），处理草稿、@提醒、已读回执

### 渲染逻辑

```html
<section class="list-item-wrap">
  <avatar-with-status :name="cname(dialog)" :avatar="calcIcon(dialog)" />
  <div class="message-displayname">
    <span class="show-name">{{ displayName }}</span>
    <span class="shorttime">{{ pretty(lastMsg.stime) }}</span>
  </div>
  <div class="subcontent">
    <message-tip :draft="dialog.draftObj?.value" :msg="lastMsg" />
    <!-- 静音、置顶图标、未读徽标 -->
    <SvgIcon v-show="dialog.isMute" iconClass="ic_unnotification" />
    <SvgIcon v-show="dialog.isTop" iconClass="ic_pin" />
    <span class="matrx-badge">{{ badgeCount }}</span>
  </div>
</section>
```

## ReplyListPannel - 回复线程面板

### 文件位置

```
src/components/ReplyListPannel.vue
```

### 功能说明

当用户点击某条消息的"查看回复"时，ReplyListPannel 以侧边面板形式展开，显示该消息的完整回复线程。

### 关键依赖

```javascript
import {getReplyListApi} from '@/api/messageApi';
import {getReplyMsgListByRootId} from '@/utils/replyDBDao';
import {preprocess} from '@/api/messageManger';
```

### 模板结构

```html
<div class="reply-list-panel" v-if="replyListPannelVisible">
  <div class="reply-title">
    <div class="txt">Thread</div>
    <SvgIcon @click="viewInChatList(rootChat)" iconClass="ic_common_reply" />
    <SvgIcon @click="close" iconClass="ic_common_close" />
  </div>

  <Scrollbar>
    <ul class="reply-list" v-infinite-scroll="loadMore">
      <!-- 根消息 -->
      <li class="reply-item">
        <slot name="content" :chatItem="rootChat" />
        <div class="placeholder">{{ replyCountTxt }}</div>
      </li>
      <!-- 回复消息列表 -->
      <li v-for="item in scrollList" class="reply-item">
        <slot name="content" :chatItem="item" />
      </li>
    </ul>
  </Scrollbar>
</div>
```

### 核心逻辑

- 通过 `getReplyListApi` 从服务端获取回复消息列表
- 本地通过 `getReplyMsgListByRootId` 从数据库查询缓存的回复
- 使用 `v-infinite-scroll` 实现分页加载
- 通过 `slot` 机制复用 `RightContentPanel` 中的消息渲染组件
- 支持"在聊天列表中查看"功能，点击后跳转定位到原始消息

## ViewScroll - 虚拟滚动容器

### 文件位置

```
src/components/ViewScroll.vue
```

### 功能说明

ViewScroll 是消息列表的虚拟滚动容器，配合 `v-infinite-scroll` 指令实现上下加载。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| scrollList | Array | [] | 消息列表数据 |
| metionList | Array | - | @提及消息 UUID 列表 |
| isFetching | Boolean | false | 是否正在加载 |
| distance | Number | 20 | 触发加载的距离阈值 |
| isInRightContent | Boolean | false | 是否在 RightContentPanel 内 |

### 事件

| Event | 说明 |
|-------|------|
| scroll | 滚动事件 |
| scrollToTop | 滚到顶部（加载历史消息） |
| loadMore | 加载更多 |
| scrollHandle | 滚动处理回调 |

## Chat 目录 - 消息类型组件

### 文件位置

```
src/components/Chat/
```

### 消息组件列表

| 组件 | 文件 | 消息类型 |
|------|------|---------|
| MessageTxtChat | `MessageTxtChat.vue` | 纯文本消息 |
| MessageTxtRichChat | `MessageTxtRichChat.jsx` | 富文本消息（JSX 渲染） |
| PictureChat | `PictureChat.vue` | 图片消息 |
| DocumentChat | `DocumentChat.vue` | 文件/文档消息 |
| VoiceChat | `VoiceChat/` | 语音消息 |
| CombineChat | `CombineChat.vue` | 合并转发消息 |
| MeetingCard | `MeetingCard.vue` | 会议卡片消息 |
| MeetingInviteChat | `MeetingInviteChat.vue` | 会议邀请消息 |
| CallRecordChat | `CallRecordChat.vue` | 通话记录 |
| NameCard | `NameCard.vue` | 名片消息 |
| EventChat | `EventChat.vue` | 日历事件消息 |
| AnnouncementChat | `AnnouncementChat.vue` | 公告消息 |
| ApprovalCard | `ApprovalCard.vue` | 审批卡片 |
| MapView | `MapView.vue` | 地图位置消息 |
| UnknowChat | `UnknowChat.vue` | 未知类型消息（兜底） |
| UnsupportedChat | `UnsupportedChat.vue` | 不支持的消息类型 |

### 辅助组件

| 组件 | 说明 |
|------|------|
| Typing | 对方正在输入状态指示 |
| Backtarget | "回到最新消息"按钮 |
| DownMore / UpMore | 上/下加载更多指示 |
| ChatRead | 已读状态标记 |
| E2ETips / E2EDescript | 端到端加密提示 |
| TranslateBar | 消息翻译栏 |
| SuggestionPannel | @提及建议面板 |
| EmojiTrigger | 快速表情反应触发器 |
| ReplyPannel | 回复引用预览面板 |
| SendFileDialog | 文件发送确认对话框 |
