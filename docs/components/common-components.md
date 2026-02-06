# 通用组件

## 概述

通用组件位于 `src/components/common/` 目录及 `src/components/` 下的若干独立文件中，提供跨业务模块复用的基础 UI 能力。这些组件涵盖了图标系统、头像、搜索、文本提示、音频播放、窗口控制、面板分割、加载指示等基础功能，是构建上层业务组件的基石。

## 核心文件结构

```
src/components/common/
  SvgIcon/
    index.vue              # SVG 图标组件
    index.js               # SVG 资源自动导入
  EmptyIcon.vue            # 空状态占位图
  AudioPlayer.vue          # 音频播放器
  WaveformProgressBar.vue  # 波形进度条
  WindowControls.vue       # 窗口控制按钮（最小化/最大化/关闭）
  PanelSplit.vue           # 面板拖拽分割器
  Tooltip.vue              # 通用 Popper 提示组件
  Countdown.vue            # 验证码倒计时
  Resend.vue               # 验证码重发
  LoginPassword.vue        # 登录密码输入
  DialogCheckList/         # 通用选人对话框
  ChangePassword/          # 修改密码组件
  LoadingDirective/        # 自定义 v-loading 指令
  vue-avatar/              # 头像生成组件
  vue-emojis/              # 表情弹窗插件
  vue-loading/             # 加载动画组件

src/components/
  Portrait/
    Portrait.vue           # 用户头像
  SearchBar/
    SearchBar.vue          # 搜索栏
    SearchDialog.vue       # 搜索对话框
    SearchPannel.vue       # 搜索面板
    SearchFilter.vue       # 搜索过滤器
    SearchList.vue         # 搜索结果列表
    SearchTip.vue          # 搜索提示
    SearchItem/            # 搜索结果项
    ChannelSearchList.vue  # 频道搜索结果
    ContactSearchList.vue  # 联系人搜索结果
    FileSearchList.vue     # 文件搜索结果
    MessageSearchList.vue  # 消息搜索结果
  TextTooltip.vue          # 文本溢出提示
  kits/                    # 工具组件集合
    AccountType.vue        # 账户类型标识
    Alias.vue              # 联系人别名编辑
    CircleIcon.vue         # 圆形图标
    CodeInput.vue          # 验证码输入框
    ContactCard.vue        # 联系人名片卡
    delayIcon.vue          # 延迟图标
    EmailShow.vue          # 邮箱显示
    Empty.vue              # 空状态
    FileIcon.vue           # 文件类型图标
    FileName.vue           # 文件名显示
    FilterInput.vue        # 过滤输入框
    GoBack.vue             # 返回按钮
    Icon.vue               # 通用图标
    KitButton.vue          # 工具按钮
    MessageTip.vue         # 消息摘要提示
    MMask.vue              # 遮罩层
    OnlineStatusNew.vue    # 在线状态指示器
    PrettyTime.vue         # 时间格式化显示
    SmartScroll.vue        # 智能滚动
    TDialog.vue            # 轻量对话框
    Topbar.vue             # 顶部栏
```

## SvgIcon - SVG 图标组件

### 文件位置

```
src/components/common/SvgIcon/
  index.vue    # 组件模板
  index.js     # SVG 资源自动导入
```

### 全局注册

SvgIcon 在 `main.js` 中全局注册，可在任意模板中直接使用：

```javascript
// src/main.js
import SvgIcon from '@/components/common/SvgIcon/index.vue';
import '@/components/common/SvgIcon/index.js';
Vue.component('SvgIcon', SvgIcon);
```

### 组件实现

```javascript
export default {
    name: 'SvgIcon',
    props: {
        iconClass: { type: String, required: true },  // 图标名称
        size: { type: [Number, String] },               // 尺寸（px）
        color: { type: String },                         // 颜色
        rotate: { type: [Number, String] }               // 旋转角度（deg）
    },
    computed: {
        iconName() {
            return `#icon-${this.iconClass}`;   // 拼接 SVG symbol ID
        },
        svgClass() {
            return 'svg-icon ' + (this.iconClass || '');
        },
        style() {
            const styles = {};
            if (this.color) styles.color = this.color;
            if (this.size) {
                styles.width = this.size + 'px';
                styles.height = this.size + 'px';
            }
            if (this.rotate) styles.rotate = this.rotate + 'deg';
            return styles;
        }
    }
};
```

### SVG 资源自动导入

```javascript
// src/components/common/SvgIcon/index.js
const requireAll = requireContext => requireContext.keys().map(requireContext);
const req = require.context('@/assets/svgs', false, /\.svg$/);
const req2 = require.context('@/assets/new/icons', false, /\.svg$/);
const req3 = require.context('@/assets/new/ic', false, /\.svg$/);
const req4 = require.context('@/assets/new/settings', false, /\.svg$/);
requireAll(req);
requireAll(req2);
requireAll(req3);
requireAll(req4);
```

通过 Webpack 的 `require.context` 自动扫描并导入四个目录下的所有 `.svg` 文件，配合 `svg-sprite-loader` 生成 SVG symbol sprite。

### 使用方式

```html
<!-- 基础用法 -->
<SvgIcon iconClass="ic_close" />

<!-- 指定尺寸和颜色 -->
<SvgIcon iconClass="ic_settings" size="20" color="var(--mv2-Grey-Grey5)" />

<!-- 旋转 -->
<SvgIcon iconClass="ic_direction_down" :rotate="180" :size="16" />
```

### SVG 资源目录

| 目录 | 说明 |
|------|------|
| `src/assets/svgs/` | 旧版 SVG 图标 |
| `src/assets/new/icons/` | 新版通用图标 |
| `src/assets/new/ic/` | 新版功能图标 |
| `src/assets/new/settings/` | 设置相关图标 |

## EmptyIcon - 空状态占位图

### 文件位置

```
src/components/common/EmptyIcon.vue
```

### 全局注册

```javascript
Vue.component('EmptyIcon', EmptyIcon);
```

### 组件实现

```javascript
export default {
    props: {
        size: { type: [Number, String] },   // 图片尺寸
        name: String                          // 图片名称
    },
    computed: {
        img() {
            const mode = this.$store.state.theme.mode;
            try {
                if (mode === 'dark') {
                    return require(`@/assets/new/emptys/dark/${this.name}.svg`);
                } else {
                    return require(`@/assets/new/emptys/light/${this.name}.svg`);
                }
            } catch (error) {
                // 回退到默认图片
                return require(`@/assets/new/emptys/${mode}/unable-files.svg`);
            }
        }
    }
};
```

### 主题适配

EmptyIcon 根据当前主题（`this.$store.state.theme.mode`）自动加载对应的深色/浅色版本空状态图。当指定名称的图片不存在时，自动回退到 `unable-files.svg` 默认图。

### 使用方式

```html
<EmptyIcon name="pic_no_contact" size="160" />
<EmptyIcon name="pic_no_message" :size="120" />
```

## Portrait - 用户头像

### 文件位置

```
src/components/Portrait/Portrait.vue
```

### Props

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| userInfo | Object | 是 | 用户信息对象，包含 `portraitPath`、`name`、`firstName`、`lastName` |
| imgwidth | String | 否 | 图片宽度 |
| classname | String | 否 | 自定义 CSS 类 |
| borderRadius | String | 否 | 圆角（默认 `'4px'`） |

### 组件实现

```javascript
export default {
    name: 'Portrait',
    components: { Avatar },  // 引用 common/vue-avatar
    computed: {
        displayName() {
            if (this.userInfo) {
                return this.userInfo.name
                    || this.userInfo.firstName || ''
                    + ' '
                    + this.userInfo.lastName || '';
            }
            return '';
        }
    }
};
```

内部使用 `common/vue-avatar` 组件，当用户无头像图片时根据姓名首字母生成彩色占位头像。

### 相关组件

项目中还有更常用的 `AvatarWithStatus` 组件（位于 `settings/util/AvatarWithStatus.vue`），在头像基础上叠加在线状态指示器，被 `SessionList`、`ContactCard`、`LeftMenuBar` 等广泛使用。

## SearchBar - 搜索栏

### 文件位置

```
src/components/SearchBar/
  SearchBar.vue          # 搜索输入框
  SearchDialog.vue       # 搜索对话框（全局搜索入口）
  SearchPannel.vue       # 搜索面板
  SearchFilter.vue       # 搜索过滤器
  SearchList.vue         # 搜索结果列表
  SearchTip.vue          # 搜索提示
  SearchItem/            # 搜索结果项（子目录）
  ChannelSearchList.vue  # 频道搜索结果
  ContactSearchList.vue  # 联系人搜索结果
  FileSearchList.vue     # 文件搜索结果
  MessageSearchList.vue  # 消息搜索结果
```

### SearchBar.vue - 搜索输入框

核心搜索输入组件，提供输入、清除、焦点管理等基础功能。

#### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value | String/Number | - | 搜索值（v-model） |
| searchPlaceholder | String | 'Search' | 占位文本 |
| clearable | Boolean | true | 是否可清除 |
| clearType | String | 'circle' | 清除按钮样式（`'circle'` 或 `'txt'`） |
| prefixIcon | String | 'icon-search' | 前缀图标 |
| maxLen | Number | - | 最大输入长度 |

#### Events

| Event | 参数 | 说明 |
|-------|------|------|
| input | value | 输入事件（支持 v-model） |
| change | value | 值变化事件 |
| focus | value | 获得焦点 |
| blur | value | 失去焦点 |
| clear | - | 清除输入 |
| click | - | 点击输入框 |

#### 模板结构

```html
<div class="search-bar" @click="handleClick">
  <SvgIcon iconClass="ic_gen_search" class="search-icon" />
  <input class="input-search"
         :placeholder="searchPlaceholder"
         :value="value"
         @input="handleInput"
         @focus="handleFocus"
         @blur="handleBlur" />
  <SvgIcon v-show="showCircleClear"
           iconClass="ic_close_radius_grey"
           @click="doClear" />
  <div v-show="showTxtClear" @click="doClear">清除</div>
</div>
```

### 搜索子组件说明

| 组件 | 说明 |
|------|------|
| SearchDialog | 全屏搜索对话框，集成所有搜索功能 |
| SearchPannel | 搜索结果面板容器 |
| SearchFilter | 搜索过滤器（按类型、时间等筛选） |
| SearchList | 搜索结果统一列表 |
| ChannelSearchList | 频道/群组搜索结果 |
| ContactSearchList | 联系人搜索结果 |
| FileSearchList | 文件搜索结果 |
| MessageSearchList | 消息搜索结果 |

## TextTooltip - 文本溢出提示

### 文件位置

```
src/components/TextTooltip.vue
```

### 功能说明

TextTooltip 自动检测文本是否溢出容器，当文本被截断时，在 hover 状态下显示完整内容的提示气泡。

### Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| content | String | '' | 文本内容 |
| isTip | Boolean | true | 是否启用提示功能 |
| tag | String | 'span' | 包裹标签类型 |
| contentClass | String | - | 内容区域自定义 CSS 类 |

### 核心逻辑

```javascript
methods: {
    initTooltip() {
        this.$nextTick(() => {
            const width = this.$el.offsetWidth;
            const textWidth = this.getTextWidth();
            if (textWidth > width) {
                this.tooltip = true;  // 文本溢出，启用提示
                this.height = this.$el.offsetHeight;
            }
        });
    },
    getTextWidth() {
        // 创建隐藏元素测量文本实际宽度
        const textEle = document.createElement('span');
        textEle.style['white-space'] = 'nowrap';
        textEle.style['position'] = 'absolute';
        textEle.style['z-index'] = '-999';
        textEle.innerText = this.content;
        this.$el.appendChild(textEle);
        const textWidth = textEle.offsetWidth;
        textEle.remove();
        return textWidth;
    }
}
```

- 通过创建临时不换行元素测量文本真实宽度
- 对比容器宽度判断是否溢出
- 监听 `content` 变化，自动重新检测
- 提示气泡通过 CSS hover 控制显示

### 使用方式

```html
<TextTooltip content="这是一段可能会很长的文本" tag="div" />
```

## kits 目录 - 工具组件集合

### 文件位置

```
src/components/kits/
```

### 组件列表

| 组件 | 文件 | 说明 |
|------|------|------|
| ContactCard | `ContactCard.vue` | 联系人名片卡，显示头像、名称、在线状态、操作按钮 |
| OnlineStatusNew | `OnlineStatusNew.vue` | 在线状态指示器（在线/离开/忙碌/离线） |
| PrettyTime | `PrettyTime.vue` | 时间格式化显示，支持多种格式模板 |
| MessageTip | `MessageTip.vue` | 会话列表消息摘要，处理草稿、@提醒、已读回执 |
| Alias | `Alias.vue` | 联系人别名编辑，支持 inline 编辑模式 |
| CodeInput | `CodeInput.vue` | 验证码输入框，支持自动聚焦和粘贴 |
| FileIcon | `FileIcon.vue` | 根据文件扩展名显示对应图标 |
| FileName | `FileName.vue` | 文件名显示，支持长名称截断 |
| FilterInput | `FilterInput.vue` | 带过滤功能的输入框 |
| CircleIcon | `CircleIcon.vue` | 圆形图标按钮 |
| AccountType | `AccountType.vue` | 账户类型标识（管理员/成员等） |
| EmailShow | `EmailShow.vue` | 邮箱地址显示 |
| Empty | `Empty.vue` | 空状态占位 |
| GoBack | `GoBack.vue` | 返回导航按钮 |
| Icon | `Icon.vue` | 通用图标包装 |
| KitButton | `KitButton.vue` | 工具栏按钮 |
| MMask | `MMask.vue` | 全屏遮罩层 |
| SmartScroll | `SmartScroll.vue` | 智能滚动（自动判断滚动方向和速度） |
| TDialog | `TDialog.vue` | 轻量对话框封装 |
| Topbar | `Topbar.vue` | 通用顶部栏 |
| delayIcon | `delayIcon.vue` | 延迟显示图标（避免闪烁） |

### ContactCard 详解

ContactCard 是最常用的工具组件之一，显示联系人的完整名片信息：

```html
<div class="contactCard">
  <AvatarWithStatus :name="cname(peer)" :avatar="peer.portraitPath"
                    :size="72" :hid="peer.hid" radius="20px" />
  <OnlineStatusNew :hid="peer.hid" />

  <!-- 可编辑模式 -->
  <template v-if="isEdited">
    <RenderName :peer="peer" :type="1" />
    <SvgIcon @click="onClickEdit" iconClass="ic_Live_edit" />
    <PersonTextarea v-model="peer.sig" />
  </template>

  <!-- 显示模式 -->
  <template v-else>
    <Alias v-if="isContact" :hid="peer.hid" />
    <RenderName v-else :peer="peer" />
  </template>
</div>
```

功能特性：
- 显示头像（支持上传修改）、名称、在线状态、个性签名
- 支持编辑模式（修改头像和名称）
- 显示联系人别名（通过 Alias 组件）
- 处理已被移除的联系人状态

## common 目录其他组件

### AudioPlayer - 音频播放器

```javascript
props: {
    isPlay: { type: Boolean, default: false },
    isSelf: { type: Boolean, default: false },
    sendFrom: { type: String, default: '' },
    currentDuration: { type: String, default: '-:-' },
    duration: { type: String, default: '-:-' },
    audioRate: { type: Number, default: 1 }
}
```

功能：播放/暂停控制、播放速率切换（0.5x/1x/1.5x/2x）、进度显示、发送者信息。

### WaveformProgressBar - 波形进度条

```javascript
props: {
    progress: { type: Number, required: true },
    waveformData: { type: Array, default: () => [...] }  // 波形数据
}
```

功能：以波形图方式展示音频播放进度，支持拖拽调整播放位置。

### Countdown - 验证码倒计时

```javascript
props: {
    isShow: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    currentMethod: { type: String, default: '' },  // 'sms' 或 'appNotify'
    codeText: { type: String, default: '' }
}
```

功能：发送验证码后的倒计时显示，支持短信和应用通知两种方式，限制最大发送次数。

### Resend - 验证码重发

```javascript
props: {
    value: { type: Boolean, required: true },       // 是否在倒计时中
    resendNum: { type: Number, required: true },     // 倒计时总秒数
    phoneNum: { type: String, required: true },      // 手机号
    resendText: { type: String, default: '' }        // 自定义文案
}
```

功能：验证码重发按钮，内置倒计时逻辑和发送次数限制（最多 5 次）。

### LoadingDirective - 自定义加载指令

```javascript
// src/components/common/LoadingDirective/index.js
export default {
    bind(el, binding) {
        const mask = new Mask({
            el: document.createElement('div')
        });
        el.instance = mask;
        el.mask = mask.$el;
        binding.value && toggleLoading(el, binding);
    },
    update(el, binding) {
        if (binding.oldValue !== binding.value) {
            toggleLoading(el, binding);
        }
    },
    unbind(el) {
        el.instance && el.instance.$destroy();
    }
};
```

在 `main.js` 中全局注册为 `v-loading` 指令：

```javascript
Vue.directive('loading', LoadingDirective);
```

使用方式：

```html
<div v-loading="isLoading">
  内容区域
</div>
```

### vue-avatar - 头像生成

位于 `common/vue-avatar/`，根据用户名首字母生成彩色背景的占位头像。当用户未上传头像时自动使用。

### vue-emojis - 表情弹窗插件

位于 `common/vue-emojis/`，作为 Vue 插件安装，提供 `$emojisAlert` 全局方法用于弹出表情选择面板。

### vue-loading - 加载动画

位于 `common/vue-loading/`，提供统一的加载动画效果。
