# 语言包参考

## 概述

MATRX Windows 客户端当前支持两种语言：英文（en）和阿拉伯文（ar）。每种语言的翻译资源按功能模块拆分为多个独立文件，通过 `index.js` 入口文件合并导出。本文档详细说明语言包的组织结构、各模块的翻译键分类，以及新增语言和 RTL 适配的开发指南。

## 支持的语言列表

| 语言标识 | 语言名称 | 文字方向 | Element UI 包 | 备注 |
|---------|---------|---------|--------------|------|
| `en` | English（英文） | LTR（从左到右） | `element-ui/lib/locale/lang/en` | 默认语言、回退语言 |
| `ar` | العربية（阿拉伯文） | RTL（从右到左） | `element-ui/lib/locale/lang/ar` | RTL 语言 |

## 语言包目录结构

每种语言的目录结构完全一致：

```
src/lang/locales/{语言标识}/
├── index.js              # 主入口文件（合并所有子模块 + Element UI 语言包 + 主体内容）
├── contact.js            # 联系人与通讯录模块
├── approval.js           # 审批流程模块
├── devicesManagement.js  # 设备管理模块
├── shortcut.js           # 快捷键模块
└── update.js             # 应用更新模块
```

## 语言包入口文件结构

以英文 `src/lang/locales/en/index.js` 为例：

```javascript
import contact from './contact.js';
import approval from './approval.js';
import devicesManagement from './devicesManagement.js';
import shortcut from './shortcut.js';
import update from './update.js';
import enLocaleElement from 'element-ui/lib/locale/lang/en';
const copyrightConfig = require('../../../../copyright.js');

export default {
    ...contact,           // 展开联系人模块（顶层合并）
    ...enLocaleElement,   // 展开 Element UI 英文翻译（顶层合并）
    approval,             // 嵌套到 approval 命名空间
    devicesManagement,    // 嵌套到 devicesManagement 命名空间
    shortcut,             // 嵌套到 shortcut 命名空间
    update,               // 嵌套到 update 命名空间
    // ... 大量顶层 key
};
```

**合并策略差异**：`contact` 模块使用展开运算符 `...contact` 合并到顶层，因此调用方式为 `$t('contact.menulabel')`；而 `approval` 等模块作为命名空间嵌套，调用方式为 `$t('approval.NewApproval')`。

## 英文语言包键值分类

`index.js` 主入口文件包含大量翻译键，按功能可分为以下类别：

### 基础与通用

| 键路径 | 示例值 | 说明 |
|--------|--------|------|
| `startBtn` | `'Sign In'` | 登录按钮 |
| `signBtn` | `'Sign Up'` | 注册按钮 |
| `joinBtn` | `'Join a Meeting'` | 加入会议按钮 |
| `Cancel` | `'Cancel'` | 通用取消 |
| `Submit` | `'Submit'` | 通用提交 |
| `Loading` | `'Loading'` | 加载中 |
| `Warning` | `'Warning'` | 警告 |
| `SomethingWentWrong` | `'Something went wrong'` | 通用错误提示 |

### 系统托盘与上下文菜单

| 键路径 | 示例值 |
|--------|--------|
| `contextMenu.openApp` | `'Open Matrx'` |
| `contextMenu.exit` | `'Exit'` |

### 消息与会话

| 键路径 | 示例值 |
|--------|--------|
| `message_withdraw_single` | `'{handler} deleted a message'` |
| `message_you_withdraw_single` | `'You deleted a message'` |
| `im_toall` | `'@All'` |
| `new_message_some_you` | `'You have new messages'` |
| `sendTxtPlaceHolder` | `'Message here'` |

### 会议模块

| 键路径前缀 | 说明 |
|-----------|------|
| `Meeting.*` | 会议功能（创建、加入、设置等） |
| `Call.*` | 通话功能 |
| `CallPage.*` | 通话页面 |
| `meetingInfo.*` | 会议详情 |
| `meetCard.*` | 会议卡片 |
| `callfeedback.*` | 通话反馈 |
| `MeetingInvite.*` | 会议邀请 |
| `meetingVote.*` | 会议投票 |
| `meetingPayUpgrade.*` | 会议付费升级 |

### 设置与偏好

| 键路径前缀 | 说明 |
|-----------|------|
| `settingsUtil.*` | 设置页面工具 |
| `Notifications.*` | 通知设置 |
| `ChangeAccount.*` | 切换账号 |
| `ChangePassword.*` | 修改密码 |
| `langChange.*` | 语言切换相关（确认对话框文案） |

### 联系人模块（contact.js）

该模块通过展开合并到顶层，包含以下主要命名空间：

| 键路径前缀 | 说明 |
|-----------|------|
| `menucontext.*` | 右键菜单（粘贴、复制、标记已读等） |
| `contact.*` | 联系人操作（添加、查看、删除等） |
| `contact.addcontact.*` | 添加联系人流程 |
| `contact.addcontact.email.*` | 邮箱添加联系人 |
| `contact.addcontact.phone.*` | 手机号添加联系人 |
| `contact.allchannel.*` | 群组列表 |
| `contact.tips.*` | 联系人操作提示 |
| `sendfile.*` | 文件发送 |

### 国家/地区代码

语言包中包含完整的国家/地区名称翻译（用于电话号码选择器），键名格式为 `country_select_modal_country_{code}`。共覆盖 250+ 个国家和地区。

### 时间与日期

| 键路径 | 示例值 |
|--------|--------|
| `weeks` | `['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']` |
| `months` | `['Jan', 'Feb', 'Mar', ...]` |
| `monthsName` | `['January', 'February', ...]` |
| `weekNums` | `['First', 'Second', 'Third', 'Fourth', 'Last']` |
| `days.Today` | `'Today'` |
| `days.Yesterday` | `'Yesterday'` |

### 错误码映射

`enum.hwerrorcode.*` 命名空间下包含 SDK 和系统层面的错误码翻译，如：

```javascript
enum: {
    hwerrorcode: {
        1: 'Network error',
        20007: 'Meeting room is full',
        // ... 40+ 个错误码
    }
}
```

### 拉丁化映射（LatinizeMap）

英文语言包包含一个大型的字符拉丁化映射表 `LatinizeMap`，用于将带音调的拉丁字母（如 `A`、`A`）转换为基本 ASCII 字母，支持联系人搜索时的模糊匹配。

### 阿拉伯数字映射（newNumFormat）

用于在阿拉伯语环境下将西方数字转换为阿拉伯-印度数字：

```javascript
newNumFormat: {
    0: '٠', 1: '١', 2: '٢', 3: '٣', 4: '٤',
    5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩'
}
```

## 子模块语言包详解

### approval.js - 审批模块

包含 60+ 个翻译键，覆盖审批流程的完整 UI：

```javascript
// 使用方式：$t('approval.NewApproval')
export default {
    NewApproval: 'New Approval',
    Approve: 'Approve',
    Reject: 'Reject',
    Withdraw: 'Withdraw',
    // 带参数的翻译
    NotificationTitleSubmitted: 'The "{0}" submitted by {1} is waiting for your approval.',
    ApprovedBy: 'Approved by {0}.',
    // ...
};
```

### devicesManagement.js - 设备管理模块

```javascript
// 使用方式：$t('devicesManagement.Title')
export default {
    Title: 'Devices Management',
    LoggedIn: 'Logged-in devices',
    Current: 'Current',
    LoginHistory: 'Login History',
    SignOut: 'Sign Out',
    // ...
};
```

### shortcut.js - 快捷键模块

```javascript
// 使用方式：$t('shortcut.ScreenCapture')
export default {
    Shortcut: 'Shortcut',
    Navigation: 'Navigation',
    Search: 'Search',
    ScreenCapture: 'Screen Capture',
    Bold: 'Bold',
    Italic: 'Italic',
    // ...
};
```

### update.js - 应用更新模块

```javascript
// 使用方式：$t('update.updateNow')
export default {
    MatrxUpdate: 'Matrx Update',
    updateNow: 'Update Now',
    automaticUpdate: 'Automatic update next time',
    learnMoreVersion: 'Learn more (V{version} version)'
};
```

## 阿拉伯文语言包特性

阿拉伯文语言包与英文语言包保持完全相同的键结构，但有以下特殊之处：

1. **RTL 方向**：阿拉伯文为从右到左书写，应用启动时会设置 `dir="rtl"`
2. **数字体系**：通过 `newNumFormat` 映射表支持阿拉伯-印度数字（`٠١٢٣٤٥٦٧٨٩`）
3. **日期格式**：阿拉伯文使用 `yyyy/M/d` 格式（年在前），英文使用 `d/M/yyyy` 格式（日在前）
4. **Element UI 组件**：引入 `element-ui/lib/locale/lang/ar` 确保下拉框、日期选择器等组件正确显示阿拉伯文

阿拉伯文 `index.js` 入口示例：

```javascript
import contact from './contact.js';
import approval from './approval.js';
import devicesManagement from './devicesManagement.js';
import shortcut from './shortcut.js';
import update from './update.js';
import arabicLocaleElement from 'element-ui/lib/locale/lang/ar';
const copyrightConfig = require('../../../../copyright.js');

export default {
    ...contact,
    ...arabicLocaleElement,
    approval,
    devicesManagement,
    shortcut,
    update,
    contextMenu: {openApp: 'فتح Matrx', exit: 'مخرج'},
    startBtn: 'تسجيل الدخول',
    // ...
};
```

## 新增语言指南

### 第一步：创建语言包目录

在 `src/lang/locales/` 下创建新语言目录，例如新增法语 `fr`：

```
src/lang/locales/fr/
├── index.js
├── contact.js
├── approval.js
├── devicesManagement.js
├── shortcut.js
└── update.js
```

### 第二步：编写入口文件

`src/lang/locales/fr/index.js`：

```javascript
import contact from './contact.js';
import approval from './approval.js';
import devicesManagement from './devicesManagement.js';
import shortcut from './shortcut.js';
import update from './update.js';
import frLocaleElement from 'element-ui/lib/locale/lang/fr';
const copyrightConfig = require('../../../../copyright.js');

export default {
    ...contact,
    ...frLocaleElement,
    approval,
    devicesManagement,
    shortcut,
    update,
    contextMenu: {
        openApp: 'Ouvrir Matrx',
        exit: 'Quitter'
    },
    startBtn: 'Se connecter',
    // ... 翻译所有键值
};
```

由于 `src/lang/index.js` 使用 `require.context('./locales', true, /\/index\.js$/)` 自动扫描，新语言目录会被自动发现并加载，**无需修改** `src/lang/index.js`。

### 第三步：更新语言选择列表

在 `src/components/settings/util/EditPreferences.vue` 中将新语言添加到列表：

```javascript
// 修改前
languageList: ['en', 'ar'],

// 修改后
languageList: ['en', 'ar', 'fr'],
```

### 第四步：更新主进程语言校验

在 `src/background.js` 的 `initLocaleLange` 函数中更新合法语言判断：

```javascript
// 修改前
if (langLocale !== 'en' && langLocale !== 'ar') langLocale = 'en';

// 修改后
if (!['en', 'ar', 'fr'].includes(langLocale)) langLocale = 'en';
```

同样更新已存储语言的校验逻辑：

```javascript
// 修改前
if (getLocale !== 'en' && getLocale !== 'ar') setStore('storage.lang', 'en');

// 修改后
if (!['en', 'ar', 'fr'].includes(getLocale)) setStore('storage.lang', 'en');
```

### 第五步：验证键值完整性

确保新语言包包含英文语言包的所有键。缺失的键会自动回退到英文（`fallbackLocale: 'en'`），不会导致运行时错误，但 UI 上会出现混合语言。

## RTL 语言适配指南

如果新增的语言是 RTL（从右到左）语言（如希伯来文 `he`、波斯文 `fa`），需要进行以下额外适配：

### 1. 更新方向判断逻辑

当前代码中将 RTL 判断硬编码为 `locale === 'ar'`，需要改为支持多种 RTL 语言：

```javascript
// 当前写法（多处出现）
document.documentElement.setAttribute('dir', this.$i18n.locale === 'ar' ? 'rtl' : 'ltr');

// 建议改为
const RTL_LANGUAGES = ['ar', 'he', 'fa'];
const dir = RTL_LANGUAGES.includes(this.$i18n.locale) ? 'rtl' : 'ltr';
document.documentElement.setAttribute('dir', dir);
```

需要修改的文件列表：

| 文件 | 说明 |
|------|------|
| `src/App.vue` | 主窗口 |
| `src/renderer/shortcut/App.vue` | 快捷键窗口 |
| `src/renderer/meetingInfo/App.vue` | 会议详情窗口 |
| `src/renderer/newGuide/App.vue` | 新手引导窗口 |
| `src/renderer/devicesManagement/App.vue` | 设备管理窗口 |
| `src/renderer/meetingWhiteboardShare/App.vue` | 白板共享窗口 |
| `src/renderer/pictureEditor/App.vue` | 图片编辑窗口 |

### 2. CSS RTL 样式

项目中已有大量 `[dir='rtl']` 选择器的 CSS 规则，涵盖图标翻转、布局调整等。这些规则会自动生效，无需针对新 RTL 语言额外编写。常见的 RTL 样式模式包括：

```css
/* 图标翻转 */
[dir='rtl'] .icon_right_arrow {
    transform: rotate(180deg);
}

/* 返回按钮翻转 */
[dir='rtl'] .ic_common_back {
    transform: rotate(180deg);
}

/* 文本对齐 */
[dir='rtl'] .preferences {
    text-align: right;
}
```

### 3. 日期和数字格式

如果新增的 RTL 语言有特殊的日期格式或数字体系，需要在以下位置扩展：

- `src/utils/dataUtil.js`：日期格式化逻辑
- `src/lang/langUtils.js`：`arabicFormate` 函数（可考虑重构为通用的 RTL 格式化函数）

## 翻译键命名规范

基于现有代码总结的命名规范：

1. **驼峰命名**：`startBtn`、`joinBtn`、`SignUp`
2. **点分隔层级**：`contact.addcontact.email.label`
3. **变量插值**：使用 `{0}`、`{1}` 位置参数或 `{name}` 命名参数
4. **模块前缀**：独立模块文件中的键不需要前缀，因为引入时已有命名空间
5. **国家代码**：`country_select_modal_country_{iso_code}` 格式
