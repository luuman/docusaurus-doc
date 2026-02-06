# 对话框组件

## 概述

对话框组件处理应用中所有的模态交互场景，包括业务对话框（文件下载、远程登录提醒、添加成员）、右键上下文菜单、通知类弹窗和提示工具。这些组件基于 Element UI 的 `el-dialog` 和 `el-tooltip` 进行封装，同时也引入了 tippy.js 等第三方库实现更灵活的弹出层效果。

## 核心文件结构

```
src/components/
  Dialog/
    DownloadFileDIalog.vue         # 文件下载确认对话框
    DownloadFileNoSpaceDialog.vue   # 磁盘空间不足对话框
    EditPersonalNameDialog.vue      # 编辑个人名称对话框
    MemberAddDialog.vue             # 添加群成员对话框
    RemoteLoginDialog.vue           # 远程登录提醒对话框
  DialogCell.vue                    # 会话列表单元格（非对话框，见聊天组件文档）
  ContextMenu/
    index.vue                       # 右键菜单组件（基于 tippy.js）
  Tooltip/
    index.vue                       # 提示工具（封装 el-tooltip）
  Notify/
    MigrateAccount.vue              # 账号迁移通知对话框
  common/
    DialogCheckList/
      index.vue                     # 通用选人对话框
      CheckAdd.vue                  # 选人列表（子组件）
      newChatName.vue               # 新建聊天命名（子组件）
    Tooltip.vue                     # 通用 Popper 提示（基于 popper.js）
  kits/
    TDialog.vue                     # 轻量对话框封装
  Chat/
    DragDialog.vue                  # 可拖拽对话框
    SendFileDialog.vue              # 文件发送确认对话框
    FeedbackDialog.vue              # 反馈对话框
    AudioMeetingDialog.vue          # 音频会议对话框
    VideoMeetingDialog.vue          # 视频会议对话框
    ViewDialog.vue                  # 查看对话框
```

## Dialog 目录 - 业务对话框

### 文件位置

```
src/components/Dialog/
```

### DownloadFileDIalog - 文件下载确认

用户首次下载文件时弹出，允许选择下载路径。

```html
<el-dialog custom-class="download-file-dialog"
           :title="$t('settingsUtil.fileDownload')"
           :visible.sync="downloadFileDialogVisible">
  <div class="content">
    <span class="title">选择下载位置</span>
    <div class="location">
      <span class="download-path">{{ formatePath(selectedDownloadPath) }}</span>
      <el-button @click="openDownloadPathDialog">编辑</el-button>
    </div>
    <div class="tip">
      <p class="perference-tip">可在偏好设置中修改默认下载路径</p>
    </div>
  </div>
</el-dialog>
```

关键逻辑：
- 通过 `ipcRenderer` 与主进程通信，调用系统文件选择对话框
- 使用 `checkPathPermitted` 校验目标路径的写入权限
- 通过 `setDownloadSetting` 保存用户选择的下载路径

Vuex 状态：
```javascript
computed: {
    ...mapState('uiControl', ['downloadFileDialogVisible', 'downloadPathNoPermitted'])
}
```

### MemberAddDialog - 添加群成员

群聊场景下，通过此对话框选择并添加新成员。

```javascript
export default {
    name: 'MemberAddDialog',
    components: {
        BiDialog,           // 统一对话框壳
        MembersToBeAdded    // 待添加成员选择组件
    },
    computed: {
        channel() {
            return this.$store.state.concat.channels[this.$store.state.uiControl.actDialogId];
        }
    },
    methods: {
        addContact(hids) {
            await Peer.addContactForChannel(this.$store.state.uiControl.actDialogId, hids);
            Bus.$emit('refresh-group-info', actDialogId, false, spaceId, {
                type: 'add', hids
            });
        }
    }
};
```

关键功能：
- 使用 `BiDialog` 作为对话框外壳
- 内嵌 `MembersToBeAdded` 组件提供联系人搜索和选择
- 调用 `Peer.addContactForChannel` API 完成成员添加
- 通过 Vue Bus 广播 `refresh-group-info` 事件刷新群信息

### RemoteLoginDialog - 远程登录提醒

当检测到账号在其他设备登录时，显示登录详情提醒。

```javascript
export default {
    components: { PrettyTime },
    computed: {
        ...mapState('uiControl', ['remoteLoginDialogState']),
        info() {
            return this.remoteLoginDialogState?.info || {};
        }
    },
    methods: {
        onDialogHandleClose() {
            this.$store.commit('uiControl/setRemoteLoginInfo', { visible: false });
        }
    }
};
```

显示信息包括：
- 登录账号
- 登录时间（通过 `PrettyTime` 格式化）
- 登录地区
- IP 地址

### EditPersonalNameDialog - 编辑个人名称

用于修改用户的显示名称。

### DownloadFileNoSpaceDialog - 磁盘空间不足

当检测到磁盘空间不足时弹出提醒。

## ContextMenu - 右键菜单

### 文件位置

```
src/components/ContextMenu/index.vue
```

### 功能说明

ContextMenu 基于 `tippy.js` 实现的右键菜单组件，支持跟随鼠标位置弹出。

### 组件实现

```javascript
import tippy, { followCursor } from 'tippy.js';
export default {
    name: 'ContextMenu',
    computed: {
        ...mapState('uiControl', {
            isVisable: state => state.contentxMenuModel.isvisable,
            left: state => state.contentxMenuModel.left,
            top: state => state.contentxMenuModel.top
        })
    },
    data() {
        return {
            menuList: [
                { label: 'Copy', validateType: ['Text'] },
                { label: 'Forword', validateType: ['Text'] }
            ]
        };
    },
    mounted() {
        this.tip = tippy(this.$refs.tipTrigger, {
            hideOnClick: true,
            content: this.$refs.content,
            arrow: false,
            duration: 0,
            placement: 'right-start',
            trigger: 'contextmenu',
            interactive: true,
            plugins: [followCursor],
            followCursor: 'initial',
            zIndex: 3
        });
    }
};
```

### tippy.js 配置说明

| 配置项 | 值 | 说明 |
|--------|-----|------|
| placement | 'right-start' | 菜单在触发点右侧靠上显示 |
| trigger | 'contextmenu' | 右键点击触发 |
| interactive | true | 允许鼠标进入菜单区域 |
| followCursor | 'initial' | 在鼠标初始位置显示 |
| duration | 0 | 无动画延迟 |

### Slots

| Slot | 说明 |
|------|------|
| trigger | 触发区域，包裹需要右键菜单的元素 |
| default | 菜单内容，默认渲染 `menuList` 列表 |

### v-contextmenu 指令

除了 ContextMenu 组件外，项目还通过 `src/directive/contextmenu/` 注册了 `v-contextmenu` 指令，提供另一种右键菜单实现方式。该指令在 `main.js` 中全局注册：

```javascript
// src/directive/contextmenu/index.js
Vue.component(Contextmenu.name, Contextmenu);
Vue.component(ContextmenuItem.name, ContextmenuItem);
```

SessionList 中的会话右键菜单就使用了此指令：

```html
<v-contextmenu ref="contextmenu">
  <v-contextmenu-item v-for="item in menuRecent" @click="item.click">
    {{ $t(item.label) }}
  </v-contextmenu-item>
</v-contextmenu>
<ul v-contextmenu:contextmenu>
  <!-- 会话列表项 -->
</ul>
```

## Tooltip - 提示工具

### 文件位置

```
src/components/Tooltip/index.vue
```

### 功能说明

Tooltip 是对 Element UI `el-tooltip` 的轻量封装，修复了 auto-focus 导致的意外聚焦问题。在 `main.js` 中全局注册。

### 组件实现

```javascript
export default {
    name: 'Tooltip',
    props: {
        placement: {
            type: String,
            default: 'bottom'
        }
    },
    mounted() {
        // 修复 el-tooltip 自动聚焦 bug
        let tooltip = this.$refs.tooltip;
        if (typeof tooltip?.handleFocus === 'function') {
            tooltip.handleFocus = () => {};
        }
        tooltip = null;
    }
};
```

### 使用方式

透传 `$attrs` 和 `$listeners`，支持 el-tooltip 的所有属性和事件：

```html
<!-- 基础用法 -->
<Tooltip content="提示文本" placement="bottom">
  <SvgIcon iconClass="ic_settings" />
</Tooltip>

<!-- 自定义内容 -->
<Tooltip effect="dark" :visible-arrow="false" :hide-after="0">
  <template #content>
    <div>自定义提示内容</div>
  </template>
  <el-button>触发元素</el-button>
</Tooltip>
```

### common/Tooltip.vue - 通用 Popper 提示

区别于上述 Tooltip 组件，`common/Tooltip.vue` 是基于 `popper.js` 直接实现的更通用的提示组件，支持更多触发方式：

```javascript
// src/components/common/Tooltip.vue
props: {
    trigger: {
        type: String,
        default: 'hover',
        validator: value => ['clickToOpen', 'click', 'clickToToggle', 'hover', 'focus']
                            .indexOf(value) > -1
    },
    delayOnMouseOver: { type: Number, default: 10 },
    delayOnMouseOut: { type: Number, default: 10 },
    disabled: { type: Boolean, default: false },
    content: String,
    // 过渡动画
    enterActiveClass: String,
    leaveActiveClass: String,
    transition: { type: String, default: '' }
}
```

## Notify - 通知组件

### 文件位置

```
src/components/Notify/
  MigrateAccount.vue    # 账号迁移通知
```

### MigrateAccount - 账号迁移

当服务端触发账号迁移流程时，弹出多步骤向导对话框。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| isMigrateAccountCache | Object | 迁移信息缓存，包含 `former`（原账号）和 `later`（新账号） |

### 步骤流程

1. **next 阶段**：显示迁移信息（原账号 -> 新账号），用户确认
2. **finish 阶段**：要求用户设置新密码（通过 `ChangePassword` 组件）

### Events

| Event | 说明 |
|-------|------|
| close | 用户拒绝迁移 |
| finish | 完成迁移，携带新密码 |

```javascript
methods: {
    closeDialog() {
        // 拒绝迁移
        this.dialogVisible = false;
        this.$emit('close');
    },
    finishDialog() {
        // 完成迁移，提交新密码
        this.$emit('finish', this.newPassword);
    }
}
```

## DialogCheckList - 通用选人对话框

### 文件位置

```
src/components/common/DialogCheckList/
  index.vue        # 主入口
  CheckAdd.vue     # 选人列表
  newChatName.vue  # 新建聊天命名
```

### 功能说明

DialogCheckList 是一个高度复用的选人对话框，被多个业务场景调用：

| 业务场景 | DialogType 值 | 说明 |
|---------|---------------|------|
| 新建会话 | `newChat` | 选择联系人创建新聊天 |
| 创建群组 | `createMemberGroup` | 选择成员创建群组 |
| 转发消息 | `forwardMessage` | 选择目标会话转发 |
| 合并转发 | `forwardCombineMessage` | 合并消息后选择目标 |
| 转发名片 | `forwardNameCard` | 名片消息转发 |
| 会前邀请 | `addParticipant` | 会议前邀请与会者 |
| 授权管理 | `authorizeManger` | 授权联系人管理 |
| 转让群主 | `changeOwner` | 选择新群主 |

### 组件关系

```
DialogCheckList/index.vue
  BiDialog (对话框外壳)
    newChatName (第一步：命名)
    CheckAdd (第二步：选人)
```

### 核心依赖

```javascript
import { addContactForChannel, createChannel, checkIfsendMsg } from '@/api/peerApi';
import { MsgTemplate, handleMessage } from '@/api/messageManger.js';
import { sendMsgHandle } from '@/utils/message/sendMsg.js';
```

## kits/TDialog - 轻量对话框

### 文件位置

```
src/components/kits/TDialog.vue
```

### 功能说明

TDialog 是一个极简的对话框封装，仅保留 `el-dialog` 的核心功能，去除了默认标题栏：

```javascript
export default {
    name: 'TDialog',
    props: ['visible', 'width']
};
```

### 样式特性

```css
.matrx_dialog .el-dialog--center {
    top: 50%;
    transform: translateY(-50%);   /* 垂直居中 */
    margin: 0 auto;
}
.matrx_dialog .el-dialog__header {
    display: none;                  /* 隐藏默认标题 */
}
.matrx_dialog .el-dialog__body {
    padding: 0;                     /* 去除内边距 */
}
```

适用于需要完全自定义内容布局的模态弹窗场景。

## Chat 目录下的对话框组件

### SendFileDialog - 文件发送确认

在拖拽文件到聊天窗口或通过文件选择器选择文件后弹出，确认文件发送。

### AudioMeetingDialog / VideoMeetingDialog - 会议对话框

音频/视频会议的呼叫和接听对话框，显示通话状态和控制按钮。

### DragDialog - 可拖拽对话框

支持拖拽移动位置的对话框，用于不遮挡聊天区域的悬浮面板。

### FeedbackDialog - 反馈对话框

用户反馈收集对话框，支持文本输入和截图上传。

### ViewDialog - 查看对话框

图片/视频预览对话框，支持缩放和全屏查看。

## 对话框设计规范

### 统一样式

项目中的对话框遵循以下设计规范：

1. **关闭策略**：大多数对话框设置 `close-on-click-modal="false"`，防止误触关闭
2. **按钮布局**：底部按钮区使用 `slot="footer"`，取消在左、确认在右
3. **国际化**：所有文案通过 `$t()` 函数实现多语言
4. **状态管理**：对话框的可见性通常由 Vuex 的 `uiControl` 模块管理

### Vuex 状态管控

```javascript
// 常见的对话框可见性状态
uiControl: {
    downloadFileDialogVisible: false,
    openMemberAddDialog: false,
    groupUnPinDialogVisible: false,
    remoteLoginDialogState: { visible: false, info: {} }
}
```
