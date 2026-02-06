# 布局组件

## 概述

布局组件定义了 Matrx Windows 客户端的整体界面结构。应用采用经典的左侧导航+右侧内容的布局模式：`LeftMenuBar` 提供主导航入口，`Panel/` 目录下的各面板组件承载对应功能模块的内容，`Scrollbar`/`ScrollPane` 提供统一的滚动交互体验。

## 核心文件结构

```
src/components/
  LeftMenuBar.vue              # 左侧主导航菜单
  TopMenuBar.vue               # 顶部菜单栏
  TitleBar.vue                 # 标题栏
  Layout/
    TopMenu/
      QuickAccessPannel.vue    # 快速访问面板
      SpaceDropDown.vue        # 空间下拉选择
  Panel/
    ChatsPanel.vue             # 聊天面板
    ContactsPanel.vue          # 联系人面板
    MeetingsPanel.vue          # 会议面板
    CalendarPanel.vue          # 日历面板
    ApprovalPanel.vue          # 审批面板
    AppsPanel.vue              # 应用面板
    DialogContainer.vue        # 对话框容器
    RightClickOption.vue       # 右键选项面板
    MemberSearchBar.vue        # 成员搜索栏
    AddEmailContact.vue        # 添加邮箱联系人
    EmailContactList.vue       # 邮箱联系人列表
  Scrollbar/
    index.vue                  # 自定义滚动条
  ScrollPane/
    ScrollPanel.vue            # 基于 IntersectionObserver 的滚动面板
    DynamicScrollPanel.vue     # 动态高度虚拟滚动面板
  ViewScroll.vue               # 虚拟滚动容器
  common/
    PanelSplit.vue             # 面板拖拽分割器
    WindowControls.vue         # 窗口控制按钮
```

## LeftMenuBar - 左侧主导航菜单

### 文件位置

```
src/components/LeftMenuBar.vue
```

### 功能说明

LeftMenuBar 是应用左侧的主导航栏，包含用户头像/在线状态、功能模块切换（聊天/联系人/会议/日历/审批/应用）和底部功能入口。支持展开/收起两种模式。

### 模板结构

```html
<div class="flex-start-start page-left">
  <!-- 多空间下拉菜单 -->
  <DropDownList v-if="leftSpaceMenuVisible" />

  <div class="left-menu" :class="[leftMenuBarExpand ? 'expand' : 'collapse']">
    <!-- 用户头像区域 -->
    <div class="avatar-box">
      <avatar-with-status :name="cname(personalInfo)"
                          :avatar="personalInfo.portraitPath"
                          :size="32" :hid="personalInfo.hid" />
      <OnlineStatusNew :showText="false" :iconSize="20" :hid="userHid" />
    </div>

    <!-- 个人菜单（点击头像弹出） -->
    <personal-menu @open-profile @hide-personl @show-about @open-preference />
    <contact-card v-show="openPersonalCard" :peer="personalInfo" />

    <!-- 功能模块切换 -->
    <transition-group name="list" tag="div" class="menu-list">
      <div v-for="menuItem in menuList"
           class="menu-item"
           :class="{ active: pannelActive === menuItem.key }"
           @click="switchPannelHandle(menuItem.key)"
           @dblclick="unReadScroll(menuItem.key)"
           draggable="true">
        <SvgIcon :iconClass="pannelActive === menuItem.key
                   ? `icon_${menuItem.name}_light`
                   : `icon_${menuItem.name}_gray`" />
        <p class="menu-item-label">{{ $t(label[menuItem.key]) }}</p>
        <!-- 未读徽标 -->
        <sup class="matrx-badge" v-if="menuItem.key == 0 && allUnreadCom != 0">
          {{ allUnreadCom }}
        </sup>
      </div>
    </transition-group>
  </div>
</div>
```

### 核心功能

| 功能 | 说明 |
|------|------|
| 功能模块切换 | 通过 `switchPannelHandle(key)` 切换当前活跃面板（0=聊天, 1=联系人, 2=会议...） |
| 未读徽标 | 聊天模块显示 `allUnreadCom`，联系人模块显示 `newRequestsNumber` |
| 拖拽排序 | 菜单项支持 `dragstart`/`dragend`/`dragover` 实现拖拽排序 |
| 双击回到未读 | `dblclick` 事件调用 `unReadScroll` 快速定位到未读消息 |
| 多空间 | 通过 `DropDownList` 组件切换工作空间 |
| 展开/收起 | `leftMenuBarExpand` 控制菜单栏宽度模式 |

### Vuex 状态依赖

```javascript
// 读取当前活跃面板
pannelActive: state => state.uiControl.pannelActive

// 左侧菜单展开状态
leftMenuBarExpand: state => state.uiControl.leftMenuBarExpand

// 多空间菜单可见性
leftSpaceMenuVisible: state => state.uiControl.leftSpaceMenuVisible
```

## Panel 目录 - 面板组件

### 文件位置

```
src/components/Panel/
```

### 面板组件列表

| 组件 | 文件 | 说明 |
|------|------|------|
| ChatsPanel | `ChatsPanel.vue` | 聊天面板，组合 SessionList + MessageBox |
| ContactsPanel | `ContactsPanel.vue` | 联系人面板 |
| MeetingsPanel | `MeetingsPanel.vue` | 会议面板 |
| CalendarPanel | `CalendarPanel.vue` | 日历面板 |
| ApprovalPanel | `ApprovalPanel.vue` | 审批面板 |
| AppsPanel | `AppsPanel.vue` | 应用面板 |
| DialogContainer | `DialogContainer.vue` | 对话框统一容器 |
| RightClickOption | `RightClickOption.vue` | 右键菜单选项面板 |

### ChatsPanel 详解

ChatsPanel 是最重要的面板组件，将 `SessionList`（会话列表）和 `MessageBox`（消息区域）组合在一起：

```javascript
// src/components/Panel/ChatsPanel.vue
export default {
    name: 'ChatsPanel',
    components: {
        SessionList,    // 左侧会话列表
        MessageBox      // 右侧消息区域（来自 src/views/MessageBox）
    },
    mounted() {
        F.initInfo();
        ipcRenderer.on('ipcSendTrayClear', this.clearTrayCurrent);
        document.addEventListener('click', this.clearTrayCurrent);
    },
    async created() {
        let spaceId = defaultSpaceId();
        let rs = await mangePeerList(spaceId, [this.$store.state.userInfo.hid], 6);
        this.$store.dispatch('userInfo/setUserInfo', rs);
    }
}
```

关键职责：
- 初始化用户信息
- 监听系统托盘清除事件
- 管理多空间托盘状态
- 组合 SessionList 和 MessageBox 的布局

### 其他辅助组件

| 组件 | 说明 |
|------|------|
| MemberSearchBar | 面板内成员搜索栏，用于群成员筛选 |
| AddEmailContact | 通过邮箱添加联系人 |
| EmailContactList | 邮箱联系人列表展示 |
| SyncCalendar | 日历同步逻辑（`SyncCalendar.js` + `SyncCalendarConstants.js`） |

## Scrollbar - 自定义滚动条

### 文件位置

```
src/components/Scrollbar/index.vue
```

### 功能说明

Scrollbar 是对 Element UI 的 `el-scrollbar` 组件的封装，统一滚动条样式并解决若干 bug。该组件在 `main.js` 中全局注册，可在任意模板中直接使用。

### 组件实现

```javascript
export default {
    name: 'Scrollbar',
    mounted() {
        Bus.$on('window-resize', this.onWindowResize);
        this.$refs.ElScrollbar.wrap.addEventListener('scroll', this.onScroll);
    },
    activated() {
        // 修复 keep-alive 激活后滚动条位置丢失的 bug
        const thumb = this.$el.querySelector('.el-scrollbar__thumb');
        if (thumb) thumb.style.transform = '';
    },
    methods: {
        onScroll(e) {
            this.$emit('scroll', e);
        },
        onWindowResize() {
            // 解决 el-scrollbar 窗口 resize 时滚动条未更新的问题
            this.$refs?.ElScrollbar?.update();
        }
    }
};
```

### 样式定制

```scss
.custom-scrollbar {
    .el-scrollbar__wrap {
        margin-bottom: 0 !important;  // 移除底部多余间距
        overflow-x: hidden;           // 隐藏横向滚动
    }
    .is-horizontal .el-scrollbar__thumb {
        width: 0px !important;        // 隐藏横向滚动条
    }
    .is-vertical .el-scrollbar__thumb {
        background-color: var(--grey-4-rgb-80);  // 自定义纵向滚动条颜色
    }
}
```

### 解决的问题

1. Element UI `el-scrollbar` 双滚动条问题
2. `keep-alive` 组件切换后滚动条位置重置
3. 窗口 resize 后滚动条尺寸未更新
4. RTL 布局下的滚动条位置修正

## ScrollPane - 滚动面板

### 文件位置

```
src/components/ScrollPane/
  ScrollPanel.vue            # 基于 IntersectionObserver 的滚动面板
  DynamicScrollPanel.vue     # 动态高度虚拟滚动面板
```

### ScrollPanel

使用 `IntersectionObserver` API 监测滚动到顶部/底部，触发对应的加载事件：

```javascript
export default {
    name: 'ScrollPanel',
    props: {
        distance: { type: Number, default: 20 }  // 触发区域高度
    },
    methods: {
        _intersectHandle(entries) {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const direction = entry.target.getAttribute('data-scroll');
                    if (direction === 'top') this.$emit('upScroll');
                    if (direction === 'bottom') this.$emit('downScroll');
                }
            }
        },
        initObserver() {
            this.observerInstance = new IntersectionObserver(
                this._intersectHandle,
                { root: this.$refs.scrollContainer, threshold: 0.2 }
            );
            this.observerInstance.observe(this.$refs.scrollerTop);
            this.observerInstance.observe(this.$refs.scrollerBottom);
        }
    }
};
```

### Events

| Event | 说明 |
|-------|------|
| upScroll | 滚动到顶部触发 |
| downScroll | 滚动到底部触发 |
| onScrollFn | 滚动过程中触发（200ms 节流） |

### DynamicScrollPanel

封装 `vue-virtual-scroller` 的 `DynamicScroller` 组件，用于渲染动态高度的大列表：

```javascript
export default {
    name: 'DynamicScrollPanel',
    props: {
        isDynamic: { type: Boolean, required: true },
        dataList: { type: Object, required: true },
        itemSize: { type: Number },
        minItemSize: { type: Number },
        sizeDependencies: { type: Array }
    }
};
```

- 使用 `DynamicScroller` + `DynamicScrollerItem` 实现动态高度虚拟滚动
- 通过 `sizeDependencies` 属性在依赖数据变化时重新计算项高度

## PanelSplit - 面板拖拽分割器

### 文件位置

```
src/components/common/PanelSplit.vue
```

### 功能说明

PanelSplit 实现了面板之间的拖拽分割功能，支持水平（x）和垂直方向。用于调整会话列表宽度和输入框高度。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| dir | String | 拖拽方向，`'x'` 为水平，默认为垂直 |
| currentHeight | Number | 当前面板高度（垂直模式） |
| currentWidth | Number | 当前面板宽度（水平模式） |

### Events

| Event | 参数 | 说明 |
|-------|------|------|
| drag-split | Number | 拖拽过程中实时发送新的尺寸值 |
| drag-split-end | Number | 拖拽结束时发送最终尺寸值 |

### 核心逻辑

```javascript
// 尺寸约束
maxHeight: 350,    minHeight: 128,   // 垂直方向
maxWidth: 380,     minWidth: 280,    // 水平方向

mouseDownHandle(e) {
    document.addEventListener('mouseup', this.mouseUpHandle);
    document.addEventListener('mousemove', this.mouseMoveHandle);
    // 动态计算最大高度（聊天区域的 2/3）
    this.maxHeight = ((box.offsetHeight - header.offsetHeight) * 2) / 3;
}
```

- 通过 `mousedown`/`mousemove`/`mouseup` 事件实现拖拽
- `mouseMoveHandle` 使用 lodash `_.throttle` 进行 16ms 节流
- 垂直模式下动态计算最大高度，确保消息区域可见
- 当达到最大/最小值时，通过 CSS class `isMax`/`isMin` 改变光标样式

## WindowControls - 窗口控制按钮

### 文件位置

```
src/components/common/WindowControls.vue
```

### 功能说明

WindowControls 提供 Electron 窗口的最小化、最大化/还原、关闭按钮，替代系统默认的标题栏控制。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | String | '' | 窗口标题 |
| light | Boolean | false | 浅色主题 |
| iconSize | Number/String | 20 | 图标尺寸 |
| controlHeight | Number/String | 20 | 控制栏高度 |
| noHoverEffect | Boolean | false | 禁用悬浮效果 |
| controls | Array | ['minimize','maximize','close'] | 显示的按钮列表 |

### 与 Electron 主进程通信

```javascript
handleControl(action) {
    ipcRenderer.send('window-control', action);
}

// 监听最大化状态变化
mounted() {
    ipcRenderer.on('window-maximized', () => { this.isMaximized = true; });
    ipcRenderer.on('window-unmaximized', () => { this.isMaximized = false; });
}
```

- 通过 `ipcRenderer.send('window-control', action)` 向主进程发送窗口控制指令
- 监听主进程反馈的 `window-maximized`/`window-unmaximized` 事件同步按钮状态
- 包含可拖拽的标题栏区域（`titlebar-drag-region`），实现窗口拖动

## Layout/TopMenu - 顶部菜单

### 文件位置

```
src/components/Layout/TopMenu/
  QuickAccessPannel.vue    # 快速访问面板
  SpaceDropDown.vue        # 空间下拉选择
```

### QuickAccessPannel

快速访问面板提供常用功能的快捷入口，如新建聊天、创建群组等。

### SpaceDropDown

多空间下拉选择组件，用于在多个工作空间之间切换。当用户属于多个组织空间时，通过此组件选择当前活跃的空间。
