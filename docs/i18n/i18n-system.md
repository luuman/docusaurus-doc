# 国际化系统

## 概述

MATRX Windows 客户端基于 `vue-i18n` 实现完整的国际化（i18n）支持，当前支持英文（en）和阿拉伯文（ar）两种语言。系统采用模块化语言包组织方式，通过 `require.context` 自动发现和加载语言资源，同时集成了 Element UI 组件库的国际化方案。主进程通过自定义 `Translator` 类实现独立的翻译能力，渲染进程则直接使用 `vue-i18n` 实例。

## 核心文件结构

```
src/lang/
├── index.js                    # i18n 入口，VueI18n 实例创建与初始化
├── langUtils.js                # 语言工具函数（阿拉伯数字格式化等）
├── emojiData.js                # Emoji 数据映射（独立于语言包）
└── locales/                    # 语言包目录
    ├── en/                     # 英文语言包
    │   ├── index.js            # 英文主入口（合并所有子模块 + Element UI 英文包）
    │   ├── contact.js          # 联系人模块翻译
    │   ├── approval.js         # 审批模块翻译
    │   ├── devicesManagement.js # 设备管理翻译
    │   ├── shortcut.js         # 快捷键翻译
    │   └── update.js           # 更新模块翻译
    └── ar/                     # 阿拉伯文语言包（目录结构与 en 相同）
        ├── index.js
        ├── contact.js
        ├── approval.js
        ├── devicesManagement.js
        ├── shortcut.js
        └── update.js

src/main/translator.js          # 主进程翻译器类
src/config/element.config.js    # Element UI 国际化桥接配置
src/background.js               # 主进程语言初始化与切换 IPC 处理
src/App.vue                     # 渲染进程语言初始化与 RTL 方向设置
src/components/settings/util/EditPreferences.vue  # 语言切换 UI
```

## VueI18n 配置与初始化

### 入口文件 `src/lang/index.js`

该文件是国际化系统的核心入口，负责创建和导出 `VueI18n` 实例：

```javascript
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import {productName} from '../../package.json';

// 区分进程获取默认语言
let lang = '';
try {
    const ipcRenderer = require('electron').ipcRenderer;
    const store = ipcRenderer.sendSync('getStore-Sync', 'storage');
    lang = store.lang;
} catch (error) {
    lang = global.lang;
}

Vue.use(VueI18n);
```

**关键设计要点：**

1. **进程兼容**：由于主进程和渲染进程都会引用此文件，使用 `try/catch` 区分运行环境。渲染进程通过 `ipcRenderer.sendSync` 同步获取存储中的语言设置；主进程则从 `global.lang` 获取。
2. **产品名替换**：`replaceState` 函数会将语言包中所有 `Matrx` 字样替换为 `package.json` 中配置的 `productName`，实现产品名称的可配置化。

### 自动发现加载机制

```javascript
function init() {
    const locales = {};
    const files = require.context('./locales', true, /\/index\.js$/);
    files.keys().forEach(key => {
        const name = key.replace(/\.\/(.+)\/index\.js/, '$1');
        let localesKey = files(key).default || files(key);
        locales[name] = {
            ...replaceState(localesKey)
        };
    });
    return locales;
}
```

使用 Webpack 的 `require.context` 自动扫描 `./locales` 目录下所有 `index.js` 文件。这意味着新增语言只需在 `locales/` 下创建对应的语言文件夹（如 `zh/`），无需修改此处代码。目录名即为语言标识符。

### VueI18n 实例配置

```javascript
const i18n = new VueI18n({
    silentFallbackWarn: true,
    locale: lang || 'en',
    fallbackLocale: 'en',
    messages: init()
});
```

| 配置项 | 值 | 说明 |
|--------|------|------|
| `locale` | `lang \|\| 'en'` | 当前语言，从持久化存储读取，默认英文 |
| `fallbackLocale` | `'en'` | 回退语言，当翻译 key 缺失时使用英文 |
| `silentFallbackWarn` | `true` | 静默回退警告，避免控制台大量输出 |
| `messages` | `init()` | 所有语言包集合，由 `init()` 自动加载 |

## Element UI 国际化集成

Element UI 的国际化通过 `src/config/element.config.js` 与 VueI18n 桥接：

```javascript
import locale from 'element-ui/lib/locale';
import i18n from '@/lang';

locale.i18n((key, value) => i18n.t(key, value));
```

每个语言包的 `index.js` 入口文件会导入并展开对应的 Element UI 官方语言包：

- 英文：`import enLocaleElement from 'element-ui/lib/locale/lang/en'`
- 阿拉伯文：`import arabicLocaleElement from 'element-ui/lib/locale/lang/ar'`

通过 `...enLocaleElement` 展开合并到语言包对象中，使 Element UI 组件（如 DatePicker、Select 等）自动匹配当前语言。

## 主进程翻译器

由于主进程无法直接使用 Vue 组件系统，项目通过自定义 `Translator` 类（`src/main/translator.js`）提供主进程的翻译能力：

```javascript
class Translator {
    constructor(locale, messages, fallbackLocale) {
        this.locale = locale || i18n.locale;
        this.messages = messages || i18n.messages;
        this.fallbackLocale = fallbackLocale || i18n.fallbackLocale;
    }

    changeLang(locale) {
        this.locale = locale;
    }

    get() {
        return (i, j) => {
            return this.$t(i, j);
        };
    }

    $t(original, options) {
        // 按 . 分割 key 路径，逐层查找翻译值
        // 支持 fallback 到 fallbackLocale
        // 支持 {prop} 格式的变量插值
    }
}
```

主进程在 `background.js` 中初始化翻译器并挂载到全局：

```javascript
function initLocaleLange() {
    const getLocale = getStore('storage.lang');

    if (!getLocale) {
        // 初始化：从系统 locale 推断语言
        let langLocale = app.getLocale();
        if (langLocale.indexOf('en-') !== -1) langLocale = 'en';
        if (langLocale.indexOf('ar-') !== -1) langLocale = 'ar';
        if (langLocale !== 'en' && langLocale !== 'ar') langLocale = 'en';
        setStore('storage.lang', langLocale || 'en');
    } else {
        // 校验已存储的语言是否合法
        if (getLocale !== 'en' && getLocale !== 'ar') setStore('storage.lang', 'en');
    }

    global.translator = new Translator(getStore('storage.lang'));
    global.$t = global.translator.get();
}
```

主进程中的翻译调用方式为 `global.$t('some.key')`。

## 动态语言切换

### 切换流程

语言切换在设置页 `EditPreferences.vue` 中触发，完整流程如下：

```
用户选择语言
    ↓
弹出确认对话框（提示需要重启）
    ↓ 用户确认
this.$i18n.locale = lang          // 1. 更新 VueI18n 实例
ipcRenderer.send('setStore', 'storage.lang', lang)   // 2. 持久化到 electron-store
appdataStorage.setItem('langI18n', lang)              // 3. 存储到 localStorage
ipcRenderer.send('ipcChangeAppLang', lang)            // 4. 通知主进程
    ↓
主进程 background.js 处理 ipcChangeAppLang
    ↓
global.translator.changeLang(lang)  // 5. 更新主进程翻译器
destroyTray()                       // 6. 销毁系统托盘
appRestart()                        // 7. 重启应用
```

### 语言列表配置

当前支持的语言在 `EditPreferences.vue` 中硬编码：

```javascript
languageList: ['en', 'ar'],
languageRadio: appdataStorage.getItem('langI18n') || 'en',
```

### 主进程 IPC 监听

```javascript
ipcMain.on('ipcChangeAppLang', (e, lang) => {
    global.translator.changeLang(lang);
    destroyTray();
    appRestart();
});
```

语言切换后应用会完整重启，以确保所有窗口（主窗口、截图窗口、会议窗口等）都加载到新的语言配置。

## 语言工具函数

`src/lang/langUtils.js` 提供阿拉伯语相关的格式化工具：

```javascript
import i18n from '@/lang';

export function arabicFormate(timeNum) {
    if (i18n.locale !== 'ar') return timeNum;
    if (timeNum === 'Today') return i18n.t('days.Today');
    if (timeNum === 'Yesterday') return i18n.t('days.Yesterday');
    return timeNum.replace(/[0-9]/g, ($0, $1) => {
        return i18n.t('newNumFormat')[$0];
    });
}
```

该函数负责将阿拉伯语环境下的数字转换为阿拉伯-印度数字体系，并翻译 "Today"、"Yesterday" 等时间文案。

## 多窗口 RTL 适配

每个独立渲染窗口在挂载时都会根据当前语言设置文档方向：

```javascript
// App.vue / shortcut/App.vue / meetingInfo/App.vue 等
document.documentElement.setAttribute('dir', this.$i18n.locale === 'ar' ? 'rtl' : 'ltr');
```

CSS 中通过 `[dir='rtl']` 选择器实现 RTL 布局适配：

```css
[dir='rtl'] .icon_right_arrow {
    transform: rotate(180deg);
}

[dir='rtl'] .ic_common_back {
    transform: rotate(180deg);
}
```

## 在组件中使用翻译

### 模板中使用

```html
<!-- $t() 方法 -->
<span>{{ $t('contact.menulabel') }}</span>

<!-- 带参数 -->
<span>{{ $t('contact.tips.removecontacttitle', ['张三']) }}</span>
```

### JavaScript 中使用

```javascript
// 渲染进程 - 通过 this.$i18n 或导入 i18n 实例
import i18n from '@/lang';
const text = i18n.t('enum.hwerrorcode.20007');

// 主进程 - 通过全局翻译函数
const text = global.$t('enum.hwerrorcode.20007');
```

### 日期格式化中的语言判断

在 `src/utils/dataUtil.js` 中，日期格式根据当前语言切换：

```javascript
// 英文：日/月 格式
// 阿拉伯文：年/月/日 格式
return i18n.locale !== 'ar'
    ? formatDate(targetDate, 'd/M/yyyy')
    : formatDate(targetDate, 'yyyy/M/d');
```

## 语言持久化存储

语言设置通过两种途径持久化：

| 存储方式 | Key | 位置 | 用途 |
|---------|-----|------|------|
| electron-store | `storage.lang` | 主进程存储 | 主进程读取、应用启动初始化 |
| localStorage | `langI18n` | 渲染进程存储 | 渲染进程快速读取 |

首次启动时，主进程通过 `app.getLocale()` 获取操作系统语言，匹配到支持的语言后写入 `storage.lang`。若系统语言不在支持列表中，默认回退为英文。
